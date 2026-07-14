/**
 * InitPipeline — Pluggable initialization pipeline
 *
 * Manages ordered registration and execution of initialization steps.
 * Each step is an async handler. Steps execute in registration order.
 * Failed required steps stop the pipeline. Step status is persisted
 * to boot.json via SchemaRegistry.
 *
 * Usage:
 *   const pipeline = new InitPipeline({ api, schemaRegistry });
 *   pipeline.registerStep('create-dirs', { label: '创建目录', required: true, handler });
 *   const result = await pipeline.run({ onProgress });
 *   // result = { ok: true } or { ok: false, failedStep: '<step-name>' }
 */

export class InitPipeline {
  constructor({ api, schemaRegistry }) {
    if (!api) throw new Error('InitPipeline requires api');
    if (!schemaRegistry) throw new Error('InitPipeline requires schemaRegistry');
    this.api = api;
    this.schemaRegistry = schemaRegistry;
    this._steps = [];
    this._stepResults = {};
  }

  /**
   * Register an initialization step.
   * @param {string} name - Unique step identifier (e.g., 'create-dirs')
   * @param {Object} opts
   * @param {string} opts.label - Human-readable step label
   * @param {boolean} [opts.required=true] - If true, step failure stops the pipeline
   * @param {Function} opts.handler - Async function(ctx) where ctx = { api, schemaRegistry, onProgress }
   */
  registerStep(name, { label, required = true, handler }) {
    if (!name) throw new Error('Step name is required');
    if (!handler) throw new Error(`Step "${name}" requires a handler function`);
    if (this._steps.find(s => s.name === name)) {
      throw new Error(`Step "${name}" is already registered`);
    }
    this._steps.push({ name, label: label || name, required, handler });
  }

  /**
   * Run all registered steps in order.
   * @param {Object} [opts]
   * @param {Function} [opts.onProgress] - Callback (stepName, status, message)
   *   where status is 'running' | 'done' | 'failed'
   * @returns {Promise<{ ok: boolean, failedStep?: string }>}
   */
  async run({ onProgress } = {}) {
    this._stepResults = {};

    // Set init_state to 'booting' signalling first step execution
    await this.schemaRegistry.writeBoot({ init_state: 'booting' });

    for (const step of this._steps) {
      try {
        if (onProgress) onProgress(step.name, 'running', step.label);

        await step.handler({
          api: this.api,
          schemaRegistry: this.schemaRegistry,
          onProgress: (msg) => {
            if (onProgress) onProgress(step.name, 'running', msg);
          }
        });

        // Record success in boot.json
        await this.schemaRegistry.writeStepStatus(step.name, 'done');
        this._stepResults[step.name] = { status: 'done', completedAt: new Date().toISOString() };
        if (onProgress) onProgress(step.name, 'done', step.label);
      } catch (err) {
        const errMsg = err.message || String(err);
        this._stepResults[step.name] = { status: 'failed', error: errMsg };

        // Write failure to boot.json
        await this.schemaRegistry.writeBoot({
          steps: {
            [step.name]: {
              status: 'failed',
              error: errMsg,
              failedAt: new Date().toISOString()
            }
          }
        });

        if (onProgress) onProgress(step.name, 'failed', errMsg);

        if (step.required) {
          return { ok: false, failedStep: step.name };
        }

        // Non-required step — log and continue
        console.warn(`[InitPipeline] Non-required step "${step.name}" failed:`, errMsg);
      }
    }

    return { ok: true };
  }

  /**
   * Get the status of all registered steps.
   * @returns {Object} { stepName: { status, error?, completedAt? } }
   */
  getStepStatuses() {
    return { ...this._stepResults };
  }

  /**
   * Check if initialization is complete (init_state === 'done').
   * @returns {Promise<boolean>}
   */
  async isComplete() {
    const boot = await this.schemaRegistry.readBoot();
    return boot.init_state === 'done';
  }
}
