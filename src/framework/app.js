import WorkspaceAPI from './lib/api.js';
import AppState from './lib/state.js';
import Router from './lib/router.js';
import { BootManager, SchemaRegistry, InitOrchestrator } from './core/index.js';

export async function bootstrapFramework(containerEl) {
  containerEl.className = 'ms-app';

  const panel = document.createElement('div');
  panel.className = 'ms-panel';
  containerEl.appendChild(panel);

  const viewContainer = document.createElement('div');
  viewContainer.id = 'media-studio-view-container';
  viewContainer.className = 'ms-view-container';
  containerEl.appendChild(viewContainer);

  const api = new WorkspaceAPI();
  const state = new AppState();
  const router = new Router(state);

  const sessionReady = await api._waitForSession();
  if (!sessionReady) {
    containerEl.innerHTML =
      '<div class="ms-empty"><div class="ms-empty-icon">⚠</div><div>无法获取会话信息。请确认页面已完全加载后刷新重试。</div></div>';
    return null;
  }

  api.detectWorkspace();
  await api.probe();

  if (!api.ready) {
    containerEl.innerHTML =
      '<div class="ms-empty"><div class="ms-empty-icon">⚠</div><div>无法连接到 Workspace API。请确认 Hermes WebUI 正在运行。</div></div>';
    return null;
  }

  const bootManager = new BootManager({ api });
  const schemaRegistry = new SchemaRegistry({ api, notificationBus: null });
  api.setSchemaRegistry(schemaRegistry);
  const orchestrator = new InitOrchestrator({ api, schemaRegistry, bootManager });

  return { api, state, router, bootManager, schemaRegistry, orchestrator, panel, viewContainer };
}

export function _showError(container, msg) {
  if (container) {
    container.innerHTML =
      `<div class="ms-empty"><div class="ms-empty-icon">⚠</div><div>${msg}</div></div>`;
  }
}
