import WorkspaceAPI from './lib/api.js';
import AppState from './lib/state.js';
import Router from './lib/router.js';
import Sidebar from './lib/sidebar.js';
import { KanbanBoard } from './views/KanbanBoard.js';
import { ReviewMode } from './views/ReviewMode.js';
import { MediaDetail } from './views/components/MediaDetail.js';
import { CalendarView } from './views/CalendarView.js';
import { MediaArchive } from './views/MediaArchive.js';
import { TasksView } from './views/TasksView.js';
import { PublishView } from './views/PublishView.js';
import { CopywritingView } from './views/CopywritingView.js';
import { PlatformConfig } from './views/PlatformConfig.js';
import { DatabaseManager } from './views/DatabaseManager.js';
import { show, hide, empty } from './utils/dom.js';
import { SchemaRegistry, InitPipeline } from './core/index.js';

const APP_VERSION = '1.0.0';

const DIRS_TO_CREATE = [
  'configs/themes',
  'configs/platforms',
  'configs/workflows',
  'assets',
  'tasks',
  'copywriting',
  '.system',
  '.trash',
  '.index'
];

/* ── Init tree: complete content structure shown on init page ── */
const INIT_TREE = [
  { name: 'configs', type: 'dir', step: 'create-dirs', children: [
    { name: 'themes', type: 'dir', step: 'create-dirs' },
    { name: 'platforms', type: 'dir', step: 'create-dirs' },
    { name: 'workflows', type: 'dir', step: 'create-dirs', children: [
      { name: 'task-lifecycle.json', type: 'file', step: 'seed-configs' }
    ]}
  ]},
  { name: 'assets', type: 'dir', step: 'create-dirs' },
  { name: 'tasks', type: 'dir', step: 'create-dirs' },
  { name: 'copywriting', type: 'dir', step: 'create-dirs' },
  { name: '.system', type: 'dir', step: 'create-dirs', children: [
    { name: 'boot.json', type: 'file', step: 'mark-done' }
  ]},
  { name: '.trash', type: 'dir', step: 'create-dirs' },
  { name: '.index', type: 'dir', step: 'create-dirs' },
  { name: '.database', type: 'dir', step: 'bootstrap-core', children: [
    { name: 'system', type: 'dir', step: 'bootstrap-core', children: [
      { name: 'db.json', type: 'file', step: 'bootstrap-core' },
      { name: 'database', type: 'dir', step: 'bootstrap-core', children: [
        { name: 'schema.json', type: 'file', step: 'bootstrap-core' },
        { name: 'data.json', type: 'file', step: 'bootstrap-core' }
      ]},
      { name: 'table', type: 'dir', step: 'bootstrap-core', children: [
        { name: 'schema.json', type: 'file', step: 'bootstrap-core' },
        { name: 'data.json', type: 'file', step: 'bootstrap-core' }
      ]}
    ]},
    { name: 'main', type: 'dir', step: 'bootstrap-core', children: [
      { name: 'db.json', type: 'file', step: 'bootstrap-core' }
    ]}
  ]}
];

/* ── Inline SVG icons (no emoji, reliably renderable) ── */
const ICONS = {
  production:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="5" height="4" rx="1"/><rect x="10" y="3" width="5" height="4" rx="1"/><rect x="5.5" y="9" width="5" height="4" rx="1"/><path d="M6 5h4" opacity=".4"/></svg>',
  publishing:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2h10l1 4H2l1-4z"/><path d="M2 6h12v8H2z"/><path d="M6 10h4"/></svg>',
  resources:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5l6-3 6 3-6 3-6-3z"/><path d="M2 8l6 3 6-3"/><path d="M2 11l6 3 6-3"/></svg>',
  operations:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4"/></svg>',
  kanban:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="2" width="4" height="12" rx="1"/><rect x="6" y="3" width="4" height="11" rx="1"/><rect x="11" y="1" width="4" height="13" rx="1"/></svg>',
  review:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4L6 11l-3-3"/></svg>',
  tasks:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12" rx="1"/><path d="M5 8l2 2 4-4"/></svg>',
  publish:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1v10"/><path d="M4 5l4-4 4 4"/><path d="M2 12v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2"/></svg>',
  calendar:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="11" rx="1"/><path d="M2 7h12"/><path d="M5 1v3M11 1v3"/></svg>',
  archive:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h12l-1 10H3L2 3z"/><path d="M6 7h4"/></svg>',
  copywriting:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M5 5h6M5 8h6M5 11h4"/></svg>',
  platforms:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>',
  themes:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 2a6 6 0 0 1 0 12 4 4 0 0 0 0-8"/></svg>',
  init:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8a6 6 0 0 1 6-6 6 6 0 0 1 5.3 3"/><path d="M14 2v4h-4"/><path d="M14 8a6 6 0 0 1-6 6 6 6 0 0 1-5.3-3"/><path d="M2 14v-4h4"/></svg>',
  database:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="8" cy="3.5" rx="6" ry="2"/><path d="M2 5.5v4c0 1.1 2.7 2 6 2s6-.9 6-2v-4"/><path d="M2 12.5v-7"/></svg>',
};

const MENU_GROUPS = [
  {
    id: 'production',
    label: '生产流程',
    icon: ICONS.production,
    items: [
      { hash: 'kanban', label: '看板', icon: ICONS.kanban },
      { hash: 'review', label: '审核', icon: ICONS.review },
      { hash: 'tasks', label: '任务', icon: ICONS.tasks }
    ]
  },
  {
    id: 'publishing',
    label: '发布管理',
    icon: ICONS.publishing,
    items: [
      { hash: 'publish', label: '发布', icon: ICONS.publish }
    ]
  },
  {
    id: 'resources',
    label: '资源管理',
    icon: ICONS.resources,
    items: [
      { hash: 'archive', label: '素材库', icon: ICONS.archive },
      { hash: 'copywriting', label: '图文库', icon: ICONS.copywriting },
      { hash: 'calendar', label: '日历', icon: ICONS.calendar }
    ]
  },
  {
    id: 'operations',
    label: '运营配置',
    icon: ICONS.operations,
    items: [
      { hash: 'platforms', label: '平台配置', icon: ICONS.platforms }
    ]
  },
  {
    id: 'system',
    label: '系统管理',
    icon: ICONS.operations,
    items: [
      { hash: 'init', label: '初始化', icon: ICONS.init },
      { hash: 'database', label: '数据库', icon: ICONS.database }
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

      this.schemaRegistry = new SchemaRegistry({ api: this.api, notificationBus: null });
      this.pipeline = new InitPipeline({ api: this.api, schemaRegistry: this.schemaRegistry });
      this._registerInitSteps();

      const boot = await this.schemaRegistry.readBoot();
      this._workspaceReady = boot.init_state === 'done';
      this._applyMenuFilter();
    } catch (e) {
      this._showError('初始化失败: ' + e.message);
      return;
    }

    this._initModules(viewContainer);
    this.router.init();
    this._initSidebar();

    if (!this._workspaceReady) {
      this.router.navigate('init');
    }
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

    this._menuGroupEls = {};

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

      const itemEls = {};
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
        itemEls[item.hash] = itemEl;
      }

      header.addEventListener('click', () => {
        groupEl.classList.toggle('expanded');
      });

      groupEl.appendChild(header);
      groupEl.appendChild(body);
      menu.appendChild(groupEl);
      this._menuGroupEls[group.id] = { groupEl, itemEls };
    }

    panel.appendChild(menu);
    return panel;
  }

  /** Filter visible menu groups based on initialization state.
   *  When workspace is not ready, only the system group's init item is shown. */
  _applyMenuFilter() {
    if (!this._menuGroupEls) return;
    const isReady = this._workspaceReady;

    for (const group of MENU_GROUPS) {
      const { groupEl, itemEls } = this._menuGroupEls[group.id];
      if (!isReady) {
        if (group.id === 'system') {
          groupEl.style.display = '';
          for (const [hash, el] of Object.entries(itemEls)) {
            el.style.display = hash === 'init' ? '' : 'none';
          }
        } else {
          groupEl.style.display = 'none';
        }
      } else {
        groupEl.style.display = '';
        for (const el of Object.values(itemEls)) {
          el.style.display = '';
        }
      }
    }
  }

  _initModules(viewContainer) {
    const renderInContainer = (viewName) => (params) => {
      this._updateNavActive(viewName);
      empty(viewContainer);

      // Protect routes when workspace is not initialized
      if (viewName !== 'init' && !this._workspaceReady) {
        this.router.navigate('init');
        return;
      }

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
    this.modules.tasks = new TasksView(sharedDeps);
    this.modules.publish = new PublishView(sharedDeps);
    this.modules.copywriting = new CopywritingView(sharedDeps);
    this.modules.platforms = new PlatformConfig(sharedDeps);
    this.modules.calendar = new CalendarView(sharedDeps);
    this.modules.archive = new MediaArchive(sharedDeps);
    this.modules.database = new DatabaseManager({ ...sharedDeps, schemaRegistry: this.schemaRegistry });

    this.router.register('kanban', renderInContainer('kanban'));
    this.router.register('review', renderInContainer('review'));
    this.router.register('tasks', renderInContainer('tasks'));
    this.router.register('publish', renderInContainer('publish'));
    this.router.register('copywriting', renderInContainer('copywriting'));
    this.router.register('platforms', renderInContainer('platforms'));
    this.router.register('calendar', renderInContainer('calendar'));
    this.router.register('archive', renderInContainer('archive'));
    this.router.register('database', renderInContainer('database'));

    // Init view — no module class, rendered directly
    this.router.register('init', (params) => {
      this._updateNavActive('init');
      empty(viewContainer);
      this._renderInitView(viewContainer);
    });
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

    document.addEventListener('ms:activated', async () => {
      // Re-detect workspace and session — workspace switch or new chat
      // session may have changed them since last activation
      this.api.detectWorkspace();
      const boot = await this.schemaRegistry.readBoot();
      this._workspaceReady = boot.init_state === 'done';
      this._applyMenuFilter();

      const currentHash = window.location.hash;
      if (!this._workspaceReady) {
        this.router.navigate('init');
      } else if (!currentHash || currentHash === '#') {
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

  /** Register built-in initialization steps into the pipeline */
  _registerInitSteps() {
    this.pipeline.registerStep('create-dirs', {
      label: '创建目录结构',
      required: true,
      handler: async ({ onProgress }) => {
        for (const dir of DIRS_TO_CREATE) {
          onProgress(`创建 ${dir}/`);
          await this.api.mkdir(dir);
        }
      }
    });

    this.pipeline.registerStep('bootstrap-core', {
      label: '初始化核心数据库',
      required: true,
      handler: async ({ api, schemaRegistry, onProgress }) => {
        onProgress('初始化系统数据库...');
        await schemaRegistry.bootstrapSystemDb();

        onProgress('创建主数据库...');
        await api.mkdir('.database/main');
        const now = new Date().toISOString();
        await api.writeJSON('.database/main/db.json', {
          id: 'main', label: '主库', tables: [], created_at: now
        });

        let dbReg;
        try {
          dbReg = await api.readJSON('.database/db.json');
        } catch {
          dbReg = { databases: [] };
        }
        dbReg.databases.push({ id: 'main', label: '主库', createdAt: now });
        await api.writeJSON('.database/db.json', dbReg);
      }
    });

    this.pipeline.registerStep('seed-configs', {
      label: '初始化默认配置',
      required: false,
      handler: async ({ api, onProgress }) => {
        onProgress('检查配置文件...');
        const exists = await api.exists('configs/workflows/task-lifecycle.json');
        if (!exists) {
          onProgress('创建默认任务生命周期配置...');
          await api.writeJSON('configs/workflows/task-lifecycle.json', {
            media: {
              label: '素材任务',
              states: ['initialized', 'generating', 'pending_review', 'approved', 'rejected'],
              kanban_states: ['generating', 'pending_review', 'approved'],
              transitions: {
                initialized: ['generating'],
                generating: ['pending_review'],
                pending_review: ['approved', 'rejected']
              },
              final_states: ['approved', 'rejected'],
              color: '#4a90d9'
            }
          });
        }
      }
    });

    this.pipeline.registerStep('mark-done', {
      label: '完成初始化',
      required: true,
      handler: async ({ schemaRegistry }) => {
        await schemaRegistry.markBootComplete();
      }
    });
  }

  /** Recursively render INIT_TREE into a container as flat depth-indented rows */
  _renderTree(nodes, containerEl, depth = 0) {
    for (const node of nodes) {
      const el = document.createElement('div');
      el.className = 'ms-init-tree-node';
      if (node.step) el.dataset.step = node.step;
      el.dataset.name = node.name;
      el.style.paddingLeft = `${depth * 24}px`;
      el.innerHTML = `
        <span class="ms-init-tree-icon">${node.type === 'dir' ? '📁' : '📄'}</span>
        <span class="ms-init-tree-name">${node.name}</span>
        <span class="ms-init-tree-check"></span>
      `;
      containerEl.appendChild(el);
      if (node.children) {
        this._renderTree(node.children, containerEl, depth + 1);
      }
    }
  }

  /** Async check existing top-level entries via api.tree('.') and mark matching nodes */
  async _checkTreeExistence(treeContainer) {
    try {
      const entries = await this.api.tree('.');
      const names = new Set(entries.map(e => e.name));
      treeContainer.querySelectorAll('.ms-init-tree-node').forEach(el => {
        if (names.has(el.dataset.name)) {
          el.classList.add('exists');
        }
      });
    } catch {
      // workspace tree may not exist yet
    }
  }

  /** Render the full-page init view */
  _renderInitView(container) {
    if (this._workspaceReady) {
    container.innerHTML = `
      <div class="ms-init-view">
        <div class="ms-init-completed">
          <div class="ms-init-completed-icon">✅</div>
          <h2>工作空间初始化已完成</h2>
          <p>Media Studio 工作空间位于：</p>
          <div class="ms-init-path">${this.api.workspacePath || '未知'}</div>
        </div>
        <p class="ms-init-dir-heading">初始化内容：</p>
        <div class="ms-init-tree-container" id="ms-init-tree-completed"></div>
      </div>
    `;
    const treeEl = container.querySelector('#ms-init-tree-completed');
    this._renderTree(INIT_TREE, treeEl);
    treeEl.querySelectorAll('.ms-init-tree-node').forEach(el => el.classList.add('done'));
    return;
    }

    container.innerHTML = `
      <div class="ms-init-view">
        <div class="ms-init-tutorial">
          <h2>🎬 欢迎使用 Media Studio</h2>
          <p>Media Studio 是自媒体内容生产驾驶舱，需要在您的工作空间中创建目录结构来管理素材、任务和图文内容。</p>
          <p>工作空间采用以下结构：<strong>configs</strong>（配置）、<strong>assets</strong>（素材）、<strong>tasks</strong>（任务）、<strong>copywriting</strong>（图文库）。</p>
          <p>工作空间路径：</p>
          <div class="ms-init-path">${this.api.workspacePath || '未知'}</div>
          <p>将创建以下目录：</p>
        </div>
        <div class="ms-init-tree-container" id="ms-init-tree-pending"></div>
        <div class="ms-init-actions">
          <button class="ms-btn ms-btn-primary ms-init-button" id="ms-init-do-btn">初始化工作空间</button>
        </div>
        <div class="ms-init-progress" style="display:none;"></div>
      </div>
    `;

    const treeEl = container.querySelector('#ms-init-tree-pending');
    this._renderTree(INIT_TREE, treeEl);
    this._checkTreeExistence(treeEl);

    container.querySelector('#ms-init-do-btn').addEventListener('click', async () => {
      const btn = container.querySelector('#ms-init-do-btn');
      const progress = container.querySelector('.ms-init-progress');
      btn.disabled = true;
      btn.textContent = '创建中…';
      progress.style.display = 'block';

      const result = await this.pipeline.run({
        onProgress: (stepName, status) => {
          if (status === 'running') {
            progress.innerHTML = `<span>${stepName === 'create-dirs' ? '创建目录' : stepName === 'bootstrap-core' ? '初始化数据库' : stepName === 'seed-configs' ? '配置默认文件' : stepName === 'mark-done' ? '完成初始化' : stepName}...</span>`;
          } else if (status === 'done' && stepName) {
            treeEl.querySelectorAll(`[data-step="${stepName}"]`).forEach(el => {
              el.classList.add('done');
            });
          }
        }
      });

      if (result.ok) {
        this._workspaceReady = true;
        this._applyMenuFilter();
        treeEl.querySelectorAll('.ms-init-tree-node').forEach(el => el.classList.add('done'));
        progress.innerHTML = '<span class="ms-setup-success">✅ 初始化完成。</span>';
        const banner = this.container.querySelector('.ms-warning-banner');
        if (banner) banner.remove();
        setTimeout(() => {
          this.router.navigate('kanban');
        }, 500);
      } else {
        progress.innerHTML = `<span class="ms-setup-error">❌ 初始化失败: ${result.failedStep}，请重试。</span>`;
        btn.disabled = false;
        btn.textContent = '重试';
      }
    });
  }

  /** Show a dismissible warning banner when navigating away without initializing */
  _renderWarningBanner(container) {
    const existing = container.querySelector('.ms-warning-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.className = 'ms-warning-banner';
    banner.innerHTML = `
      <span class="ms-warning-banner-text">⚠ 工作空间尚未初始化，部分功能不可用。</span>
      <button class="ms-btn ms-btn-sm ms-warning-banner-dismiss">✕</button>
    `;
    banner.querySelector('.ms-warning-banner-dismiss').addEventListener('click', () => {
      banner.remove();
    });
    container.insertBefore(banner, container.firstChild);
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
