## Why

Media Studio 扩展有两个交互问题影响用户体验：

1. **首页自动跳转问题**：打开 Hermes WebUI 首页（`http://localhost:8787/`）时，即使没有点击 Media Studio 侧边栏按钮，URL 也会自动跳转到 `#kanban` 路由。这是因为 Router 初始化时无条件设置了默认 hash，而此时 Media Studio 尚未被用户激活。

2. **侧边栏按钮布局问题**：Media Studio 按钮在侧边栏（`.rail`）中带有文字标签 "Media Studio"，但视觉上按钮出现在底部设置按钮（Control Center）之后。一方面文字标签多余（图标已足够表达），另一方面按钮应该排列在上部原有菜单项之后、设置按钮之前。

## What Changes

1. **移除首页自动重定向到 `#kanban`**：
   - `Router.init()` 不再在 hash 为空时设置默认 hash
   - 仅在用户点击侧边栏 Media Studio 按钮（`ms:activated` 事件）时才导航到 kanban 视图
   - 保留 hash 变化监听，对已有的 hash 路由正常响应

2. **侧边栏 Media Studio 按钮改为纯图标并调整位置**：
   - 移除按钮中的 `<span>Media Studio</span>` 文字，只保留图标 `🎬`
   - 将按钮从 `rail.appendChild`（追加到末尾）改为插入到设置按钮之前
   - 移动端注入的链接保持文字不变（移动端需要文字辅助识别）

## Capabilities

### New Capabilities
<!-- 本次变更为纯 UI 修复，不引入新能力模块 -->

### Modified Capabilities
<!-- 本次变更不修改现有 spec 级别的行为需求，仅涉及前端表现层调整 -->

## Impact

- `src/modules/router.js`：修改 `init()` 方法，移除默认 hash 设置逻辑
- `src/modules/sidebar.js`：修改按钮 HTML 内容（移除文字）和插入位置（insertBefore 替代 appendChild）
- `src/app.css`：可能需微调 `.ms-rail-btn` 样式以适配纯图标按钮
