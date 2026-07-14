/**
 * InitOrchestrator — Module-driven initialization orchestrator
 *
 * Manages registration, version comparison, dependency ordering,
 * and execution of module initialization definitions.
 *
 * Each module declares its init logic via an init-def.js file.
 * Module state is persisted to .system/init/<name>.json as markers.
 *
 * Usage:
 *   const orchestrator = new InitOrchestrator({ api, schemaRegistry });
 *   orchestrator.register(moduleDef);       // register init-def
 *   await orchestrator.migrateIfNeeded();   // migrate from old boot.json
 *   const result = await orchestrator.run({ onProgress });
 *   // result = { ok: true } or { ok: false, failedModule: '<name>', error: '<msg>' }
 */

export class InitOrchestrator {
  constructor({ api, schemaRegistry, bootManager }) {
    if (!api) throw new Error('InitOrchestrator requires api');
    if (!schemaRegistry) throw new Error('InitOrchestrator requires schemaRegistry');
    this.api = api;
    this.schemaRegistry = schemaRegistry;
    this.bootManager = bootManager;
    this._modules = new Map();
  }

  /**
   * Register a module init-def.
   * @param {Object} moduleDef
   * @param {string} moduleDef.name - Unique module identifier (kebab-case)
   * @param {string} moduleDef.version - Semver version for change tracking
   * @param {string} moduleDef.label - Human-readable Chinese label
   * @param {boolean} [moduleDef.required=true] - If true, failure blocks startup
   * @param {string[]} [moduleDef.dependsOn=[]] - Dependency module names
   * @param {Function} moduleDef.handler - Async (ctx) => void
   */
  register(moduleDef) {
    if (!moduleDef || !moduleDef.name || !moduleDef.version || !moduleDef.handler) {
      throw new Error('Module init-def requires name, version, and handler');
    }
    if (this._modules.has(moduleDef.name)) {
      throw new Error(`Module "${moduleDef.name}" is already registered`);
    }
    this._modules.set(moduleDef.name, {
      name: moduleDef.name,
      version: moduleDef.version,
      label: moduleDef.label || moduleDef.name,
      required: moduleDef.required !== false,
      dependsOn: moduleDef.dependsOn || [],
      handler: moduleDef.handler,
    });
  }

  /**
   * Get the list of module names that need initialization
   * (marker missing or version mismatch).
   * @returns {Promise<string[]>}
   */
  async getPending() {
    const pending = [];
    for (const [name, mod] of this._modules) {
      const marker = await this._readMarker(name);
      if (!marker || marker.version !== mod.version) {
        pending.push(name);
      }
    }
    return pending;
  }

  /**
   * Check if all registered modules are initialized.
   * @returns {Promise<boolean>}
   */
  async isComplete() {
    const pending = await this.getPending();
    return pending.length === 0;
  }

  /**
   * Run all pending modules in dependency order.
   * @param {Object} [opts]
   * @param {Function} [opts.onProgress] - Callback (moduleName, status, label)
   *   where status is 'running' | 'done' | 'failed'
   * @returns {Promise<{ ok: boolean, failedModule?: string, error?: string }>}
   */
  async run({ onProgress } = {}) {
    const pending = await this.getPending();
    if (pending.length === 0) return { ok: true };

    const order = this._resolveOrder();

    for (const name of order) {
      if (!pending.includes(name)) continue;

      const mod = this._modules.get(name);
      try {
        if (onProgress) onProgress(name, 'running', mod.label);

        await mod.handler({
          api: this.api,
          schemaRegistry: this.schemaRegistry,
          orchestrator: this,
          onProgress: (msg) => {
            if (onProgress) onProgress(name, 'running', msg);
          }
        });

        await this._writeMarker(name, mod.version);
        if (onProgress) onProgress(name, 'done', mod.label);
      } catch (err) {
        const errMsg = err.message || String(err);
        try {
          await this._writeFailureMarker(name, errMsg);
        } catch { /* swallow marker write errors */ }

        if (onProgress) onProgress(name, 'failed', errMsg);

        if (mod.required) {
          return { ok: false, failedModule: name, error: errMsg };
        }

        console.warn(`[InitOrchestrator] Non-required module "${name}" failed:`, errMsg);
      }
    }

    return { ok: true };
  }

  /**
   * Migrate from old boot.json-based init state.
   * Detects existing boot.json with init_state=done but no .system/init/ directory.
   * When found, writes completion markers for all registered modules.
   * @returns {Promise<boolean>} true if migration was performed
   */
  async migrateIfNeeded() {
    const boot = this.bootManager
      ? await this.bootManager.readBoot()
      : await this.schemaRegistry.readBoot();
    if (boot.init_state !== 'done') return false;

    const hasInitDir = await this.api.exists('.system/init');
    if (hasInitDir) return false;

    // Migration: old workspace with boot.json done but no module markers
    await this.api.mkdir('.system/init');
    for (const [name, mod] of this._modules) {
      await this._writeMarker(name, mod.version);
    }
    return true;
  }

  /**
   * Read a module's marker file.
   * @param {string} name
   * @returns {Promise<Object|null>}
   */
  async _readMarker(name) {
    try {
      return await this.api.readJSON(`.system/init/${name}.json`);
    } catch {
      return null;
    }
  }

  /**
   * Write a completion marker for a module.
   * @param {string} name
   * @param {string} version
   */
  async _writeMarker(name, version) {
    await this.api.writeJSON(`.system/init/${name}.json`, {
      name,
      version,
      completedAt: new Date().toISOString()
    });
  }

  /**
   * Write a failure marker for a module.
   * @param {string} name
   * @param {string} error
   */
  async _writeFailureMarker(name, error) {
    await this.api.writeJSON(`.system/init/${name}.json`, {
      name,
      version: 'failed',
      failedAt: new Date().toISOString(),
      error
    });
  }

  /**
   * Topological sort of modules based on dependsOn.
   * Detects circular dependencies and throws.
   * @returns {string[]} module names in execution order
   */
  _resolveOrder() {
    const names = [...this._modules.keys()];
    const visited = new Set();
    const visiting = new Set();
    const sorted = [];

    const visit = (name) => {
      if (visiting.has(name)) {
        throw new Error(
          `Circular dependency detected: module "${name}" is part of a dependency cycle`
        );
      }
      if (visited.has(name)) return;
      visiting.add(name);
      const mod = this._modules.get(name);
      for (const dep of mod.dependsOn) {
        if (!this._modules.has(dep)) {
          throw new Error(
            `Module "${name}" depends on unknown module "${dep}"`
          );
        }
        visit(dep);
      }
      visiting.delete(name);
      visited.add(name);
      sorted.push(name);
    };

    for (const name of names) {
      if (!visited.has(name)) visit(name);
    }

    return sorted;
  }
}
