/**
 * Media Studio 业务清单
 *
 * 定义所有业务视图、菜单组和初始化模块的注册信息。
 * 框架通过此清单动态加载业务代码，实现框架与业务的完全解耦。
 */

export const MANIFEST = {
  name: 'media-studio',
  version: '1.0.0',
  label: 'Media Studio — 自媒体运营助手',

  /** 视图注册表：hash → 视图模块映射 */
  views: [
    { hash: 'kanban', label: '看板', iconKey: 'kanban', path: '/extensions/business/views/KanbanBoard.js', className: 'KanbanBoard', group: 'production' },
    { hash: 'tasks', label: '任务', iconKey: 'tasks', path: '/extensions/business/views/TasksView.js', className: 'TasksView', group: 'production' },
    { hash: 'assets', label: '素材', iconKey: 'assets', path: '/extensions/business/views/AssetGallery.js', className: 'AssetGallery', group: 'production' },
    { hash: 'templates', label: '模板', iconKey: 'templates', path: '/extensions/business/views/TemplatesView.js', className: 'TemplatesView', group: 'production' },
    { hash: 'ideas', label: '灵感', iconKey: 'ideas', path: '/extensions/business/views/IdeaBoard.js', className: 'IdeaBoard', group: 'planning' },
    { hash: 'topics', label: '选题', iconKey: 'topics', path: '/extensions/business/views/TopicBoard.js', className: 'TopicBoard', group: 'planning' },
    { hash: 'themes', label: '主题', iconKey: 'themes', path: '/extensions/business/views/ThemeStrategy.js', className: 'ThemeStrategy', group: 'planning' },
    { hash: 'database', label: '数据库', iconKey: 'database', path: '/extensions/business/views/DatabaseManager.js', className: 'DatabaseManager', group: 'system' },
    { hash: 'publish', label: '发布', iconKey: 'publish', path: '/extensions/business/views/PublishManager.js', className: 'PublishManager', group: 'publish' },
    { hash: 'calendar', label: '日历', iconKey: 'calendar', path: '/extensions/business/views/PublishCalendar.js', className: 'PublishCalendar', group: 'publish' },
    { hash: 'platforms', label: '平台', iconKey: 'platforms', path: '/extensions/business/views/PlatformConfig.js', className: 'PlatformConfig', group: 'publish' },
  ],

  /** 菜单组结构：按组组织视图 */
  menuGroups: [
    { id: 'planning', label: '选题策划', iconKey: 'planning', items: ['ideas', 'topics', 'themes'] },
    { id: 'production', label: '内容创作', iconKey: 'production', items: ['kanban', 'tasks', 'assets', 'templates'] },
    { id: 'publish', label: '发布运营', iconKey: 'publish', items: ['publish', 'calendar', 'platforms'] },
    { id: 'system', label: '系统管理', iconKey: 'operations', items: ['database'] },
  ],

  /** 初始化模块定义 */
  initDefs: [
    { id: 'orchestrator-core', path: '/extensions/business/init/InitOrchestrator.init-def.js', label: '初始化框架核心' },
    { id: 'schema-registry', path: '/extensions/business/init/SchemaRegistry.init-def.js', label: '初始化系统数据库' },
    { id: 'business-db', path: '/extensions/business/init/business-db.init-def.js', label: '创建业务数据库' },
  ],
};
