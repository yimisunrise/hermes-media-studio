## 1. Router 简化

- [x] 1.1 移除 `router.js` 中的 `VIEWS` 硬编码常量
- [x] 1.2 修改 `_onHashChange()`：从 `this.routes` 的 keys 动态推导合法视图，未知 hash 回退到默认视图
- [x] 1.3 添加 `defaultView` 构造参数（默认为 `'kanban'`）
- [x] 1.4 验证：Router 不需要 app.js 传入视图列表，注册即可用

## 2. View Interface 标准化

- [x] 2.1 在 `src/utils/dom.js` 或新建 `src/utils/view-interface.js` 中添加 ViewInterface 的 JSDoc 类型定义
- [x] 2.2 ReviewMode.js — 添加 `destroy()` 方法清理事件监听器
- [x] 2.3 MediaArchive.js — 添加 `destroy()` 方法
- [x] 2.4 TasksView.js — 添加 `destroy()` 方法
- [x] 2.5 其余视图（KanbanBoard, CalendarView, CopywritingView, PublishView, PlatformConfig, DatabaseManager）——确认已有 render 方法，添加空的 destroy() 或确认无需清理

## 3. app.js 拆分 — 创建 MenuManager

- [x] 3.1 新建 `src/ui/MenuManager.js`
- [x] 3.2 将 `MENU_GROUPS` 和 `ICONS` 常量从 app.js 移至 MenuManager
- [x] 3.3 实现 `render(container)`：创建菜单 DOM、绑定展开/折叠交互
- [x] 3.4 实现 `setActiveView(viewName)`：清除旧高亮、设置新高亮、展开父组
- [x] 3.5 实现 `destroy()`：清理 DOM 和事件监听

## 4. app.js 拆分 — 创建 ViewManager

- [x] 4.1 新建 `src/ui/ViewManager.js`
- [x] 4.2 实现 `constructor({ api, state, schemaRegistry, viewContainer, router })`
- [x] 4.3 实现 `initModules()`：实例化所有视图、验证 render 方法、注册路由
- [x] 4.4 实现 `pauseAll()`：遍历模块调用 pauseRefresh
- [x] 4.5 从 app.js 移植 `renderInContainer` 逻辑：清空容器、设置加载态、委托 render

## 5. app.js 入口简化

- [x] 5.1 从 `app.js` 删除 `MENU_GROUPS`、`ICONS` 常量
- [x] 5.2 从 `app.js` 删除 `_createPanel()` 方法（移至 MenuManager）
- [x] 5.3 从 `app.js` 删除 `_updateNavActive()` 方法（移至 MenuManager）
- [x] 5.4 从 `app.js` 删除 `_initModules()` 和 `renderInContainer()`（移至 ViewManager）
- [x] 5.5 从 `app.js` 删除 `_pauseAutoRefresh()`（移至 ViewManager）
- [x] 5.6 简化 `init()`：创建 MenuManager → 创建 ViewManager → 引导 → MenuManager.render() → ViewManager.initModules() → router.init() → 导航到 kanban
- [x] 5.7 更新 `MediaStudioApp` 类：只保留 `init()`、`_showError()`、`_showEmpty()` 和 `_createPanel()` 的调用入口

## 6. Init 目录统一 + InitPipeline 移除

- [x] 6.1 移动 `src/core/InitOrchestrator.init-def.js` → `src/init/InitOrchestrator.init-def.js`
- [x] 6.2 移动 `src/core/SchemaRegistry.init-def.js` → `src/init/SchemaRegistry.init-def.js`
- [x] 6.3 更新 `src/app.js` 中的 import 路径
- [x] 6.4 删除 `src/core/InitPipeline.js`
- [x] 6.5 更新 `src/core/index.js` — 移除 InitPipeline 导出

## 7. 死代码清理

- [x] 7.1 删除 `src/views/GenerationConsole.js`
- [x] 7.2 删除 `src/views/ThemeStrategy.js`
- [x] 7.3 删除 `src/views/PackageEditor.js`
- [x] 7.4 删除 `src/views/StatsDashboard.js`
- [x] 7.5 删除 `src/views/components/PlatformSelector.js`（仅被 PackageEditor 引用）
- [x] 7.6 删除 `src/views/components/ThemeSelector.js`（仅被 PackageEditor 引用）
- [x] 7.7 搜索 `app.css` 中 `.ms-generation-*`、`.ms-theme-*`、`.ms-package-*`、`.ms-stats-*` 样式，确认并移除

## 8. 验证

- [x] 8.1 JS 语法检查：`find src -name "*.js" -exec node --check {} \;` 无新增错误
- [x] 8.2 检查 app.js 中不再 import 已移除的模块
- [x] 8.3 确认 Router 不再 export VIEWS 常量
- [x] 8.4 确认 `core/index.js` 不再 export InitPipeline
- [x] 8.5 确认 `src/init/` 下有 4 个 init-def 文件
- [x] 8.6 确认所有 9 个视图都有 render 方法
