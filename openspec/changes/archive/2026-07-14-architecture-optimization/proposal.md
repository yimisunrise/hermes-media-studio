## Why

当前 Media Studio 的入口模块 `app.js` 承担了过多职责（引导、菜单渲染、视图编排、导航管理、生命周期协调），是一个逐渐膨胀的 God Object。同时存在代码死重（废弃的 InitPipeline、未挂载的视图）、接口隐式约定（视图之间没有统一契约）、以及基础设施模块间的职责交叉（Router 维护硬编码视图列表）。这些问题随着视图数量增长会持续恶化。

本次重构的目标是：在不改动 core 层数据管理和流程引擎的前提下，将前端架构层（app.js + lib/ + views/）梳理清晰，使每个模块有明确的单一职责、显式的接口约定、以及干净的依赖关系。

**核心原则**：不保留任何历史兼容代码。旧结构直接替换为新结构。

## What Changes

- **BREAKING**: `app.js` 中的 `MediaStudioApp` 类拆分为三个独立模块：`AppBootstrap`（启动引导）、`MenuManager`（菜单渲染与交互）、`ViewManager`（视图容器与生命周期编排）
- **BREAKING**: `src/lib/router.js` — 移除 `VIEWS` 硬编码常量，改为从已注册路由动态推导
- **BREAKING**: 所有视图模块统一实现 `ViewInterface`（`constructor(deps)` / `render(container, params)` / `pauseRefresh()` / `destroy()`）
- **BREAKING**: `InitPipeline.js` 彻底移除（不再保留导出）
- `init-def` 文件统一移动到 `src/init/` 目录
- 清理未使用的视图模块和废弃样式
- `NotificationBus` 正式接入替代 null 传参

## Capabilities

### New Capabilities
- `app-bootstrap-refactor`: 将 MediaStudioApp 拆分为 AppBootstrap、MenuManager、ViewManager 三个单一职责模块
- `router-simplification`: 消除 Router 的硬编码 VIEWS 常量，实现动态路由注册和未知 hash 回退
- `view-interface`: 定义视图接口标准（ViewInterface），所有视图统一实现生命周期方法
- `init-cleanup`: init-def 统一目录、移除 InitPipeline、清理 core/index.js 导出
- `dead-code-removal`: 移除未挂载的废弃视图模块和对应的 CSS 样式

### Modified Capabilities
- （本次不修改任何现有的 capability spec）

## Impact

| 影响范围 | 说明 |
|---------|------|
| `src/app.js` | 从 352 行缩减到约 60 行，仅保留入口启动逻辑 |
| `src/lib/router.js` | 简化，移除 VIEWS 常量，支持动态推导 |
| `src/lib/sidebar.js` | 无变化 |
| `src/core/InitPipeline.js` | **移除**（约 117 行） |
| `src/core/index.js` | 移除 InitPipeline 导出 |
| `src/core/InitOrchestrator.init-def.js` | 移动到 `src/init/` |
| `src/core/SchemaRegistry.init-def.js` | 移动到 `src/init/` |
| `src/init/` | 从 2 个文件增加到 4 个 |
| `src/views/` | 废弃视图移除，其余视图实现 ViewInterface |
| `src/app.css` | 移除废弃样式 |
| 新增 `src/ui/` | MenuManager + ViewContainer 两个新模块 |
