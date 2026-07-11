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

class MediaStudioApp {
  constructor() {
    this.api = new WorkspaceAPI();
    this.state = new AppState();
    this.router = new Router(this.state);
    this.modules = {};
    this.container = null;
    this.navBar = null;
  }

  async init(containerEl) {
    this.container = containerEl;
    this.container.className = 'ms-app';
    this.container.style.display = 'flex';

    this.navBar = this._createNavBar();
    this.container.appendChild(this.navBar);

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

      const initialized = await this.api.checkInitialized();
      if (!initialized) {
        const didInit = await this._showSetupDialog();
        if (didInit) {
          const stillInitialized = await this.api.checkInitialized();
          if (!stillInitialized) {
            this._showEmpty('工作空间初始化失败，请重试。');
            return;
          }
        } else {
          this._showEmpty('工作空间未初始化。点击上方按钮或重新打开 Media Studio 以初始化。');
          return;
        }
      }
    } catch (e) {
      this._showError('初始化失败: ' + e.message);
      return;
    }


    this._initModules(viewContainer);
    this.router.init();
    this._initSidebar();
  }

  _createNavBar() {
    const nav = document.createElement('nav');
    nav.className = 'ms-toolbar';

    const title = document.createElement('span');
    title.className = 'ms-toolbar-title';
    title.textContent = '🎬 Media Studio';
    nav.appendChild(title);

    const actions = document.createElement('div');
    actions.className = 'ms-toolbar-actions';

    const links = [
      { hash: '#kanban', label: '看板' },
      { hash: '#review', label: '审核' },
      { hash: '#calendar', label: '日历' },
      { hash: '#dashboard', label: '数据' },
      { hash: '#package-editor', label: '发布包' },
      { hash: '#generation', label: '生成' },
      { hash: '#themes', label: '主题' },
      { hash: '#archive', label: '素材库' }
    ];

    for (const link of links) {
      const btn = document.createElement('button');
      btn.className = 'ms-btn ms-btn-sm';
      btn.textContent = link.label;
      btn.addEventListener('click', () => this.router.navigate(link.hash.slice(1)));
      if (window.location.hash === link.hash) btn.style.borderColor = 'var(--ms-accent)';
      actions.appendChild(btn);
    }

    nav.appendChild(actions);
    return nav;
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
    const btns = this.navBar.querySelectorAll('.ms-btn');
    btns.forEach(btn => btn.style.borderColor = '');
    const activeMap = {
      kanban: '看板', review: '审核', calendar: '日历', dashboard: '数据',
      'package-editor': '发布包', generation: '生成', themes: '主题', archive: '素材库'
    };
    const label = activeMap[viewName];
    if (label) {
      btns.forEach(btn => {
        if (btn.textContent === label) btn.style.borderColor = 'var(--ms-accent)';
      });
    }
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
    if (this.container) {
      this.container.innerHTML = `<div class="ms-empty"><div class="ms-empty-icon">📂</div><div>${msg}</div></div>`;
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
