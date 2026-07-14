/**
 * Media Studio 业务清单
 *
 * 定义所有业务视图、菜单组和初始化模块的注册信息。
 * 框架通过此清单动态加载业务代码，实现框架与业务的完全解耦。
 */

export const MANIFEST = {
  name: 'media-studio',
  version: '1.0.0',
  label: 'Media Studio — 自媒体内容生产流水线',

  /** 视图注册表：hash → 视图模块映射 */
  views: [
    { hash: 'kanban', label: '看板', iconKey: 'kanban', path: '/extensions/business/views/KanbanBoard.js', className: 'KanbanBoard', group: 'production' },
    { hash: 'review', label: '审核', iconKey: 'review', path: '/extensions/business/views/ReviewMode.js', className: 'ReviewMode', group: 'production' },
    { hash: 'tasks', label: '任务', iconKey: 'tasks', path: '/extensions/business/views/TasksView.js', className: 'TasksView', group: 'production' },
    { hash: 'publish', label: '发布', iconKey: 'publish', path: '/extensions/business/views/PublishView.js', className: 'PublishView', group: 'publishing' },
    { hash: 'archive', label: '素材库', iconKey: 'archive', path: '/extensions/business/views/MediaArchive.js', className: 'MediaArchive', group: 'resources' },
    { hash: 'copywriting', label: '图文库', iconKey: 'copywriting', path: '/extensions/business/views/CopywritingView.js', className: 'CopywritingView', group: 'resources' },
    { hash: 'calendar', label: '日历', iconKey: 'calendar', path: '/extensions/business/views/CalendarView.js', className: 'CalendarView', group: 'resources' },
    { hash: 'platforms', label: '平台配置', iconKey: 'platforms', path: '/extensions/business/views/PlatformConfig.js', className: 'PlatformConfig', group: 'operations' },
    { hash: 'database', label: '数据库', iconKey: 'database', path: '/extensions/business/views/DatabaseManager.js', className: 'DatabaseManager', group: 'system' },
  ],

  /** 菜单组结构：按组组织视图 */
  menuGroups: [
    { id: 'production', label: '生产流程', iconKey: 'production', items: ['kanban', 'review', 'tasks'] },
    { id: 'publishing', label: '发布管理', iconKey: 'publishing', items: ['publish'] },
    { id: 'resources', label: '资源管理', iconKey: 'resources', items: ['archive', 'copywriting', 'calendar'] },
    { id: 'operations', label: '运营配置', iconKey: 'operations', items: ['platforms'] },
    { id: 'system', label: '系统管理', iconKey: 'operations', items: ['database'] },
  ],

  /** 初始化模块定义 */
  initDefs: [
    { id: 'orchestrator-core', path: '/extensions/business/init/InitOrchestrator.init-def.js', label: '初始化框架核心' },
    { id: 'workspace', path: '/extensions/business/init/workspace.init-def.js', label: '创建工作区目录' },
    { id: 'schema-registry', path: '/extensions/business/init/SchemaRegistry.init-def.js', label: '初始化系统数据库' },
    { id: 'configs', path: '/extensions/business/init/configs.init-def.js', label: '写入默认配置' },
  ],
};
