import { empty } from '../utils/dom.js';

export class ViewManager {
  constructor({ api, state, schemaRegistry, viewContainer, router, onViewChange, manifest } = {}) {
    this.api = api;
    this.state = state;
    this.schemaRegistry = schemaRegistry;
    this.viewContainer = viewContainer;
    this.router = router;
    this.onViewChange = onViewChange;
    this.manifest = manifest;
    this.modules = {};
  }

  async initModules() {
    for (const entry of this.manifest.views) {
      try {
        const mod = await import(entry.path);
        const ViewClass = mod[entry.className];
        if (!ViewClass) {
          console.warn(`[ViewManager] View class ${entry.className} not found at ${entry.path}`);
          continue;
        }
        const sharedDeps = { api: this.api, state: this.state };
        const instance = entry.hash === 'database'
          ? new ViewClass({ ...sharedDeps, schemaRegistry: this.schemaRegistry })
          : new ViewClass(sharedDeps);

        if (typeof instance.render !== 'function') {
          console.warn(`[ViewManager] View "${entry.hash}" has no render() method, skipping`);
          continue;
        }

        this.modules[entry.hash] = instance;
        this.router.register(entry.hash, (params) => this._renderView(entry.hash, params));
      } catch (e) {
        console.error(`[ViewManager] Failed to load view "${entry.hash}":`, e);
      }
    }
  }

  async _renderView(viewName, params) {
    if (this.onViewChange) this.onViewChange(viewName);

    empty(this.viewContainer);

    const loading = document.createElement('div');
    loading.className = 'ms-loading';
    loading.textContent = '加载中...';
    this.viewContainer.appendChild(loading);

    const mod = this.modules[viewName];
    if (!mod) {
      empty(this.viewContainer);
      this.viewContainer.innerHTML = `<div class="ms-empty"><div class="ms-empty-icon">⚠</div><div>视图 "${viewName}" 未找到</div></div>`;
      return;
    }

    setTimeout(() => {
      try {
        empty(this.viewContainer);
        mod.render(this.viewContainer, params);
      } catch (e) {
        empty(this.viewContainer);
        this.viewContainer.innerHTML = `<div class="ms-empty"><div class="ms-empty-icon">⚠</div><div>视图加载失败: ${e.message}</div></div>`;
      }
    }, 0);
  }

  destroyAll() {
    Object.values(this.modules).forEach(mod => {
      if (mod && typeof mod.destroy === 'function') mod.destroy();
    });
  }

  pauseAll() {
    Object.values(this.modules).forEach(mod => {
      if (mod && typeof mod.pauseRefresh === 'function') mod.pauseRefresh();
    });
  }
}
