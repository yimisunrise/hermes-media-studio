## Why

Media Studio 当前通过 Extension Tab 加载，用户需要知道扩展 Tab 的存在并手动导航才能使用。将其入口添加到 Hermes WebUI 左侧边栏（rail），与 Tasks、Skills、Memory 等原生工具并列，能让用户像使用 WebUI 内置功能一样自然地发现和访问 Media Studio。这是从"扩展"到"集成"的关键一步。

## What Changes

- 在 Hermes WebUI 桌面端 `.rail` 和移动端 `.sidebar-nav` 中各注入一个 🎬 Media Studio 按钮
- 实现 panel 激活/停用生命周期：点击按钮激活 Media Studio，切换到其他 panel 时隐藏
- 扩展内保留 hash 路由导航栏（7 个内部视图），侧边栏按钮作为启动器入口
- 适配 WebUI 主题系统（CSS 变量继承）
- 不修改 WebUI 源码，完全通过 Extension DOM 注入实现

## Capabilities

### New Capabilities
- `sidebar-injection`: 在 WebUI rail 中注入 Media Studio 按钮，含样式隔离、激活状态管理、主题适配
- `panel-lifecycle`: 面板切换集成，处理 Media Studio 的激活/停用生命周期（显示/隐藏、重绘触发）
- `mobile-adaptation`: 移动端侧边栏按钮注入，响应式适配

### Modified Capabilities
- (无 — 这是纯新增功能，不修改现有 capability)

## Impact

- `src/` — 新增 `src/modules/sidebar.js`（约 150 行 DOM 注入 + panel 集成）
- `src/app.js` — 修改 bootstrap 流程，初始化时调用 `Sidebar.init()`
- `src/app.css` — 新增约 30 行 `.rail` 按钮样式，适配 WebUI 主题变量
- 无后端变更，无依赖变更
