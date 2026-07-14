import { MANIFEST } from './manifest.js';
import { MenuManager } from '../framework/ui/MenuManager.js';
import { ViewManager } from '../framework/ui/ViewManager.js';
import { InitOverlay } from './views/InitOverlay.js';
import Sidebar from '../framework/lib/sidebar.js';

export async function bootstrapBusiness(frameworkCtx) {
  if (!frameworkCtx) return;

  const { api, state, router, orchestrator, panel, viewContainer } = frameworkCtx;

  // Register init-defs from manifest
  for (const def of MANIFEST.initDefs) {
    try {
      const mod = await import(def.path);
      if (mod.initDef) orchestrator.register(mod.initDef);
    } catch (e) {
      console.error(`[Business] Failed to load init-def "${def.id}":`, e);
    }
  }

  await orchestrator.migrateIfNeeded();

  // Auto-init with overlay
  const needsInit = !(await orchestrator.isComplete());
  if (needsInit) {
    InitOverlay.show();
    const result = await orchestrator.run({
      onProgress: (_moduleName, status, label) => {
        if (status === 'running') InitOverlay.update(label);
      }
    });
    if (result.ok) {
      InitOverlay.hide();
    } else {
      InitOverlay.hideAll();
      _showError(viewContainer, `初始化失败: ${result.failedModule}`);
      return;
    }
  }

  // Init menu from manifest
  const menuManager = new MenuManager({ manifest: MANIFEST });
  menuManager.render(panel, (hash) => router.navigate(hash));

  // Init views from manifest
  const viewManager = new ViewManager({
    api,
    state,
    schemaRegistry: frameworkCtx.schemaRegistry,
    viewContainer,
    router,
    manifest: MANIFEST,
    onViewChange: (viewName) => menuManager.setActiveView(viewName)
  });
  await viewManager.initModules();

  // Start router + sidebar
  router.init();
  _initSidebar(api, router, viewManager);
  router.navigate('kanban');
}

function _initSidebar(api, router, viewManager) {
  Sidebar.init();

  document.addEventListener('ms:activated', async () => {
    api.detectWorkspace();
    const currentHash = window.location.hash;
    if (!currentHash || currentHash === '#') {
      router.navigate('kanban');
    } else {
      router.navigate(currentHash.slice(1));
    }
  });

  document.addEventListener('ms:deactivated', () => {
    if (viewManager) viewManager.pauseAll();
  });
}

function _showError(container, msg) {
  if (container) {
    container.innerHTML =
      `<div class="ms-empty"><div class="ms-empty-icon">⚠</div><div>${msg}</div></div>`;
  }
}
