## Context

Media Studio 当前以 Extension Tab 方式加载：用户需要在 WebUI 顶部 Tab 栏找到扩展 Tab 并点击才能使用。这种方式对首次用户不够直观。

Hermes WebUI 的侧边栏（`.rail`）包含所有核心工具的入口：Chat、Tasks、Kanban、Skills、Memory、Workspaces、Profiles、Todos、Insights、Dashboard、Logs、Settings。这些按钮是硬编码在 `templates/index.html` 中的 `<button class="rail-btn nav-tab" data-panel="...">`。面板切换由 `static/js/panels.js` 的 `switchPanel()` 函数管理。

WebUI 的扩展机制（`HERMES_WEBUI_EXTENSION_SCRIPT_URLS`）将扩展 JS/CSS 直接注入到主页面上下文中（非 iframe），因此扩展可以操作 DOM——包括侧边栏。

## Goals / Non-Goals

**Goals:**
- 在 WebUI 桌面端 `.rail` 底部添加一个 🎬 Media Studio 按钮
- 在移动端 `.sidebar-nav` 中同步添加对应入口
- 点击按钮时激活 Media Studio，切换到其他面板时自动隐藏
- 兼容 WebUI 主题（亮/暗模式），继承 CSS 变量
- 扩展内部保留 hash 路由导航栏，侧边栏入口仅作为启动器
- 不修改 WebUI 任何源码

**Non-Goals:**
- 不为每个 Media Studio 内部视图（Kanban/Review/etc.）创建独立的 WebUI panel
- 不修改 WebUI 的 `switchPanel()` 实现（通过 DOM 事件和 CSS 控制）
- 不涉及后端变更
- 不处理权限或用户认证

## Decisions

### D1：注入时机

**决策**：脚本加载时立即执行，通过 `document.readyState` 判断 DOM 状态
- 如果 DOM 已加载 → 直接注入
- 否则 → 监听 `DOMContentLoaded`

**理由**：扩展 JS 在页面 `<head>` 中通过 `<script>` 加载，此时 DOM 可能尚未完全构建。延迟到 `DOMContentLoaded` 保证 `.rail` 和 `.sidebar-nav` 元素已存在。不需要 MutationObserver，因为 rail 在初始渲染后不再变动。

**备选**：MutationObserver 监听 `.rail` → 过度设计，rail 不会动态重建。

### D2：面板激活策略

**决策**：注入的按钮通过 `click` 事件直接操作 DOM 显隐，不调用 WebUI 的 `switchPanel()`
- `click → document.body.classList.toggle('ms-active') + 切换其他 panel 的 active 状态`
- Media Studio 容器（`#media-studio-app`）常态为 `display: none`
- 激活时设置为 `display: flex`，同时隐藏其他原生 panel 内容

**理由**：最轻量、最不侵入的方式。WebUI 的 `switchPanel()` 有硬编码的面板列表（`panels.js:238`），修改它需要 monkey-patch。纯 CSS 显隐控制没有副作用，且 WebUI 更新时不会破坏。

**备选 A**：Monkey-patch `switchPanel()` → 高风险，WebUI 更新可能改变函数签名。
**备选 B**：模拟点击原生按钮 → 会触发不必要的 panel 卸载逻辑。
**备选 C**：直接修改 `switchPanel()` 所在文件 → 违背"不修改 WebUI 源码"原则。

### D3：激活/停用生命周期

**决策**：
```
点击 Media Studio 按钮 →
  1. 隐藏所有原生 panel（设置其容器 display:none）
  2. 显示 #media-studio-app
  3. 触发自定义事件 'ms:activated'
  4. 高亮侧边栏按钮

点击其他原生按钮 →
  1. 隐藏 #media-studio-app
  2. 恢复原生 panel 显示
  3. 触发自定义事件 'ms:deactivated'
  4. 取消侧边栏按钮高亮
```

**理由**：自定义事件 `ms:activated` / `ms:deactivated` 允许 Media Studio 内部模块做生命周期管理（如暂停轮询、释放资源）。与 WebUI panel 系统的解耦使得各自独立演进。

**备选**：在 `app.js` 中通过 MutationObserver 监听 body 类变化 → 可靠但浪费性能。

### D4：移动端适配

**决策**：同时在 `.rail`（桌面）和 `.sidebar-nav`（移动端）注入按钮。使用 CSS media query 显示/隐藏对应按钮实例。

**理由**：WebUI 的移动端使用独立的 `.sidebar-nav` DOM 树，两个入口都需要注入才能覆盖所有设备。

### D5：主题兼容

**决策**：按钮样式仅使用 CSS 变量（`var(--* )`），不定义任何硬编码颜色。激活状态使用 `var(--primary)` 或 `var(--accent)`。

**理由**：WebUI 主题通过 `:root` CSS 变量定义，继承即可自动适配亮/暗模式切换。

### D6：WebUI 版本兼容性

**决策**：将所有 DOM 选择器集中在模块顶部作为常量：
```js
const SELECTORS = {
  rail: '.rail',
  sidebarNav: '.sidebar-nav',
  navTab: '.nav-tab',
  panelContainer: 'main',
  activeClass: 'active'
};
```

**理由**：当 WebUI 更新导致 DOM 结构变化时，只需修改选择器常量而不需要重写逻辑。这些选择器的变动预期很低（WebUI 核心 UI 架构稳定）。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| WebUI 更新改变 `.rail` DOM 结构 | 选择器集中在常量中，直接可见、易于更新 |
| 按钮注入被其他扩展覆盖 | 使用 `insertBefore()` 插入到最后一个按钮之后，而非 `appendChild()` |
| 多个 Media Studio 实例共存 | 注入前检查按钮是否已存在（幂等性检查） |
| 移动端 `.sidebar-nav` 使用不同的激活机制 | 统一通过 CSS class 控制显隐，平台差异在 CSS 层处理 |
| WebUI 更新后移除了 CSS 变量 `--primary`/`--accent` | 设置 fallback 颜色值 `var(--primary, #0098ff)` |

## Open Questions

- 是否需要支持"固定到侧边栏"功能（类似 Workspaces 的 pin 行为）？当前范围不需要，优先级低。
- 侧边栏按钮是否显示 badge/通知计数（如待审核数量）？可做但当前范围不需要。
