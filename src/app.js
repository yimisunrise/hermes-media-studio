import WorkspaceAPI from './modules/api.js';
import AppState from './modules/state.js';
import Router from './modules/router.js';
import Sidebar from './modules/sidebar.js';
import { KanbanBoard } from './modules/KanbanBoard.js';
import { ReviewMode } from './modules/ReviewMode.js';
import { MediaDetail } from './modules/components/MediaDetail.js';
import { PackageEditor } from './modules/PackageEditor.js';
import { CalendarView } from './modules/CalendarView.js';
import { StatsDashboard } from './modules/StatsDashboard.js';
import { GenerationConsole } from './modules/GenerationConsole.js';
import { ThemeStrategy } from './modules/ThemeStrategy.js';
import { MediaArchive } from './modules/MediaArchive.js';
import { show, hide, empty } from './modules/utils/dom.js';

const DIRS_TO_CREATE = [
  'pipeline/01-generating',
  'pipeline/02-pending-review',
  'pipeline/03-approved',
  'pipeline/04-scheduled',
  'pipeline/05-published',
  'themes',
  'platforms',
  'workflows',
  'archive',
  '.trash'
];

/* ── Inline SVG icons (no emoji, reliably renderable) ── */
const ICONS = {
  production:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="5" height="4" rx="1"/><rect x="10" y="3" width="5" height="4" rx="1"/><rect x="5.5" y="9" width="5" height="4" rx="1"/><path d="M6 5h4" opacity=".4"/></svg>',
  publishing:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2h10l1 4H2l1-4z"/><path d="M2 6h12v8H2z"/><path d="M6 10h4"/></svg>',
  resources:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5l6-3 6 3-6 3-6-3z"/><path d="M2 8l6 3 6-3"/><path d="M2 11l6 3 6-3"/></svg>',
  customize:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4"/></svg>',
  kanban:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="2" width="4" height="12" rx="1"/><rect x="6" y="3" width="4" height="11" rx="1"/><rect x="11" y="1" width="4" height="13" rx="1"/></svg>',
  review:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4L6 11l-3-3"/></svg>',
  generation:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3,2 14,8 3,14" fill="currentColor" fill-opacity=".15"/></svg>',
  calendar:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="11" rx="1"/><path d="M2 7h12"/><path d="M5 1v3M11 1v3"/></svg>',
  packageEditor:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1l6 3v8l-6 3-6-3V4l6-3z"/><path d="M8 8l6-3M8 8L2 5M8 8v7"/></svg>',
  dashboard:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="4" height="8" rx="1"/><rect x="6" y="3" width="4" height="11" rx="1"/><rect x="11" y="1" width="4" height="13" rx="1"/></svg>',
  archive:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h12l-1 10H3L2 3z"/><path d="M6 7h4"/></svg>',
  themes:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 2a6 6 0 0 1 0 12 4 4 0 0 0 0-8"/></svg>',
};

const MENU_GROUPS = [
  {
    id: 'production',
    label: '生产流程',
    icon: ICONS.production,
    items: [
      { hash: 'kanban', label: '看板', icon: ICONS.kanban },
      { hash: 'review', label: '审核', icon: ICONS.review },
      { hash: 'generation', label: '生成', icon: ICONS.generation }
    ]
  },
  {
    id: 'publishing',
    label: '发布管理',
    icon: ICONS.publishing,
    items: [
      { hash: 'calendar', label: '日历', icon: ICONS.calendar },
      { hash: 'package-editor', label: '发布包', icon: ICONS.packageEditor }
    ]
  },
  {
    id: 'resources',
    label: '资源管理',
    icon: ICONS.resources,
    items: [
      { hash: 'dashboard', label: '数据', icon: ICONS.dashboard },
      { hash: 'archive', label: '素材库', icon: ICONS.archive }
    ]
  },
  {
    id: 'customize',
    label: '定制化',
    icon: ICONS.customize,
    items: [
      { hash: 'themes', label: '主题', icon: ICONS.themes }
    ]
  }
];

class MediaStudioApp {
  constructor() {
    this.api = new WorkspaceAPI();
    this.state = new AppState();
    this.router = new Router(this.state);
    this.modules = {};
    this.container = null;
    this.menuPanel = null;
  }

  async init(containerEl) {
    this.container = containerEl;
    this.container.className = 'ms-app';

    const panel = this._createPanel();
    this.container.appendChild(panel);

    const viewContainer = document.createElement('div');
    viewContainer.id = 'media-studio-view-container';
    viewContainer.className = 'ms-view-container';
    this.container.appendChild(viewContainer);

    try {
      const sessionReady = await this.api._waitForSession();
      if (!sessionReady) {
        this._showError('无法获取会话信息。请确认页面已完全加载后刷新重试。');
        return;
      }

      this.api.detectWorkspace();

      await this.api.probe();
      if (!this.api.ready) {
        this._showError('无法连接到 Workspace API。请确认 Hermes WebUI 正在运行。');
        return;
      }

      // Non-blocking: check initialization but don't block the UI
      this._workspaceReady = await this.api.checkInitialized();
      if (!this._workspaceReady) {
        this._showInitTip(viewContainer);
      }
    } catch (e) {
      this._showError('初始化失败: ' + e.message);
      return;
    }


    this._initModules(viewContainer);
    this.router.init();
    this._initSidebar();
  }

  _createPanel() {
    this.menuPanel = document.createElement('div');
    this.menuPanel.className = 'ms-panel';
    const panel = this.menuPanel;

    const head = document.createElement('div');
    head.className = 'ms-panel-head';
    head.textContent = '🎬 Media Studio';
    panel.appendChild(head);

    const menu = document.createElement('div');
    menu.className = 'ms-menu';

    for (const group of MENU_GROUPS) {
      const groupEl = document.createElement('div');
      groupEl.className = 'ms-menu-group';
      groupEl.dataset.group = group.id;

      const header = document.createElement('button');
      header.className = 'ms-menu-group-header';
      header.innerHTML = `
        <span class="ms-menu-group-icon">${group.icon}</span>
        <span class="ms-menu-group-label">${group.label}</span>
        <span class="ms-menu-chevron">▶</span>
      `;

      const body = document.createElement('div');
      body.className = 'ms-menu-group-body';

      for (const item of group.items) {
        const itemEl = document.createElement('button');
        itemEl.className = 'ms-menu-item';
        itemEl.dataset.view = item.hash;
        itemEl.innerHTML = `
          <span class="ms-menu-item-icon">${item.icon}</span>
          <span>${item.label}</span>
        `;
        itemEl.addEventListener('click', () => this.router.navigate(item.hash));
        body.appendChild(itemEl);
      }

      header.addEventListener('click', () => {
        groupEl.classList.toggle('expanded');
      });

      groupEl.appendChild(header);
      groupEl.appendChild(body);
      menu.appendChild(groupEl);
    }

    panel.appendChild(menu);
    return panel;
  }

  _initModules(viewContainer) {
    const renderInContainer = (viewName) => (params) => {
      this._updateNavActive(viewName);
      empty(viewContainer);

      const loading = document.createElement('div');
      loading.className = 'ms-loading';
      loading.textContent = '加载中...';
      viewContainer.appendChild(loading);

      const module = this.modules[viewName];
      if (module) {
        setTimeout(() => {
          empty(viewContainer);
          module.render(viewContainer, params);
        }, 0);
      }
    };

    const sharedDeps = { api: this.api, state: this.state };

    this.modules.kanban = new KanbanBoard(sharedDeps);
    this.modules.review = new ReviewMode(sharedDeps);
    this.modules['package-editor'] = new PackageEditor(sharedDeps);
    this.modules.calendar = new CalendarView(sharedDeps);
    this.modules.dashboard = new StatsDashboard(sharedDeps);
    this.modules.generation = new GenerationConsole(sharedDeps);
    this.modules.themes = new ThemeStrategy(sharedDeps);
    this.modules.archive = new MediaArchive(sharedDeps);

    this.router.register('kanban', renderInContainer('kanban'));
    this.router.register('review', renderInContainer('review'));
    this.router.register('package-editor', renderInContainer('package-editor'));
    this.router.register('calendar', renderInContainer('calendar'));
    this.router.register('dashboard', renderInContainer('dashboard'));
    this.router.register('generation', renderInContainer('generation'));
    this.router.register('themes', renderInContainer('themes'));
    this.router.register('archive', renderInContainer('archive'));
  }

  _updateNavActive(viewName) {
    this.menuPanel.querySelectorAll('.ms-menu-item').forEach(el => el.classList.remove('active'));
    const activeItem = this.menuPanel.querySelector(`.ms-menu-item[data-view="${viewName}"]`);
    if (activeItem) activeItem.classList.add('active');
    this.menuPanel.querySelectorAll('.ms-menu-group').forEach(g => {
      const hasActive = !!g.querySelector(`.ms-menu-item[data-view="${viewName}"]`);
      g.classList.toggle('expanded', hasActive);
    });
  }

  _initSidebar() {
    Sidebar.init();

    document.addEventListener('ms:activated', () => {
      const currentHash = window.location.hash;
      if (!currentHash || currentHash === '#') {
        this.router.navigate('kanban');
      } else {
        this.router.navigate(currentHash.slice(1));
      }
    });

    document.addEventListener('ms:deactivated', () => {
      this._pauseAutoRefresh();
    });
  }

  _pauseAutoRefresh() {
    Object.values(this.modules).forEach(mod => {
      if (mod && typeof mod.pauseRefresh === 'function') {
        mod.pauseRefresh();
      }
    });
  }

  /** Show setup dialog prompting user to initialize workspace */
  /** Show a non-blocking init tip in the view area instead of blocking the UI */
  _showInitTip(container) {
    container.innerHTML = `
      <div class="ms-init-tip">
        <span class="ms-init-tip-icon">🛠️</span>
        <span class="ms-init-tip-text">工作空间尚未初始化，部分功能不可用。</span>
        <button class="ms-btn ms-btn-primary ms-init-tip-btn" id="ms-init-now-btn">立即初始化</button>
        <button class="ms-btn ms-init-tip-btn" id="ms-init-later-btn">稍后</button>
      </div>
    `;

    container.querySelector('#ms-init-now-btn').addEventListener('click', async () => {
      const didInit = await this._showSetupDialog();
      if (didInit) {
        this._workspaceReady = true;
        empty(container);
        const hash = window.location.hash;
        if (hash && hash !== '#') {
          this.router.navigate(hash.slice(1));
        }
      }
    });

    container.querySelector('#ms-init-later-btn').addEventListener('click', () => {
      empty(container);
    });
  }

  _showSetupDialog() {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'ms-setup-overlay';

      const dialog = document.createElement('div');
      dialog.className = 'ms-setup-dialog';

      const wsPath = this.api.workspacePath || '未知';

      dialog.innerHTML = `
        <h2 class="ms-setup-title">🎬 Media Studio 初始化</h2>
        <p class="ms-setup-desc">需要在工作空间中创建以下目录结构：</p>
        <div class="ms-setup-path">
          <span class="ms-setup-path-label">工作空间：</span>
          <span class="ms-setup-path-value">${wsPath}/media-studio/</span>
        </div>
        <ul class="ms-setup-dir-list">
          ${DIRS_TO_CREATE.map(d => `<li>${d}/</li>`).join('')}
        </ul>
        <div class="ms-setup-actions">
          <button class="ms-btn" id="ms-setup-cancel">取消</button>
          <button class="ms-btn ms-btn-primary" id="ms-setup-init">初始化</button>
        </div>
        <div class="ms-setup-progress" style="display:none;"></div>
      `;

      overlay.appendChild(dialog);
      this.container.appendChild(overlay);

      dialog.querySelector('#ms-setup-cancel').addEventListener('click', () => {
        this.container.removeChild(overlay);
        resolve(false);
      });

      dialog.querySelector('#ms-setup-init').addEventListener('click', async () => {
        const initBtn = dialog.querySelector('#ms-setup-init');
        const cancelBtn = dialog.querySelector('#ms-setup-cancel');
        const progress = dialog.querySelector('.ms-setup-progress');
        initBtn.disabled = true;
        cancelBtn.disabled = true;
        initBtn.textContent = '创建中…';
        progress.style.display = 'block';

        const succeeded = await this._createWorkspaceDirectories(progress);

        if (succeeded) {
          progress.innerHTML = '<span class="ms-setup-success">✅ 目录创建完成。</span>';
          setTimeout(() => {
            this.container.removeChild(overlay);
            resolve(true);
          }, 800);
        } else {
          progress.innerHTML = '<span class="ms-setup-error">❌ 部分目录创建失败，请重试。</span>';
          initBtn.disabled = false;
          cancelBtn.disabled = false;
          initBtn.textContent = '重试';
          cancelBtn.textContent = '跳过';
          cancelBtn.addEventListener('click', () => {
            this.container.removeChild(overlay);
            resolve(false);
          }, { once: true });
        }
      });
    });
  }

  /** Create workspace directory structure, showing progress */
  async _createWorkspaceDirectories(progressEl) {
    let allOk = true;
    for (let i = 0; i < DIRS_TO_CREATE.length; i++) {
      const dir = DIRS_TO_CREATE[i];
      progressEl.innerHTML = `<span>(${i + 1}/${DIRS_TO_CREATE.length}) 创建 ${dir}/ …</span>`;
      try {
        await this.api.mkdir(dir);
      } catch (e) {
        console.error('mkdir failed:', dir, e);
        allOk = false;
      }
    }
    return allOk;
  }

  _showError(msg) {
    if (this.container) {
      this.container.innerHTML = `<div class="ms-empty"><div class="ms-empty-icon">⚠</div><div>${msg}</div></div>`;
    }
  }

  _showEmpty(msg) {
    const vc = document.getElementById('media-studio-view-container');
    if (vc) {
      vc.innerHTML = `<div class="ms-empty"><div class="ms-empty-icon">📂</div><div>${msg}</div></div>`;
    }
  }
}

// ── Auto‑init ──────────────────────────────────────────────
// Create the container, instantiate the app and start it once the
// DOM is parsed (guaranteed for <script type="module">).
function startMediaStudio() {
  const CID = 'media-studio-app';
  let container = document.getElementById(CID);
  if (!container) {
    container = document.createElement('div');
    container.id = CID;
    container.style.display = 'none';
    const main = document.querySelector('.main');
    (main || document.body).appendChild(container);
  }
  const app = new MediaStudioApp();
  app.init(container);
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  startMediaStudio();
} else {
  document.addEventListener('DOMContentLoaded', startMediaStudio);
}

export default MediaStudioApp;
