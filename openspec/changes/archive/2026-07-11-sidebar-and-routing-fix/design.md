## Context

Media Studio 作为 Hermes WebUI Extension，通过 JS 注入方式在 host 页面中工作。当前有两个交互问题：

1. **路由问题**：`Router.init()` 在扩展初始化时无条件将 hash 设为 `#kanban`，导致首页自动跳转。而此时用户可能并未激活 Media Studio。`ms:activated` 事件监听器已经包含了导航到 kanban 的逻辑，Router 的默认 hash 设置是多余的。

2. **侧边栏问题**：`SidebarManager._injectRail()` 通过 `rail.appendChild()` 将按钮追加到 `.rail` 末尾，导致按钮出现在底部设置按钮（Control Center）之后。同时按钮包含文字 `<span>Media Studio</span>`，而图标 `🎬` 已经足够标识。

## Goals / Non-Goals

**Goals:**
- 移除首页自动跳转到 `#kanban` 的行为
- Media Studio 侧边栏按钮改为纯图标，移除非必要的文字
- 将侧边栏按钮移动到上部菜单项之后、设置按钮之前
- 保持已有的 hash 路由功能完整

**Non-Goals:**
- 不修改路由注册或视图渲染逻辑
- 不修改移动端侧边栏（`_injectMobile`）的样式 — 移动端空间有限但仍需文字辅助识别
- 不改变任何业务功能

## Decisions

### Decision 1: Router 初始化时不设置默认 hash

**现状**（`router.js:17-18`）：
```js
if (!window.location.hash || window.location.hash === '#') {
  window.location.hash = '#kanban';
}
```

**方案**：直接移除默认 hash 设置，改为仅在有 hash 时处理路由：
```js
if (window.location.hash && window.location.hash !== '#') {
  this._onHashChange();
}
```

**原理**：`ms:activated` 事件监听器（`app.js:186-192`）已包含导航到 kanban 的逻辑：
```js
document.addEventListener('ms:activated', () => {
  const currentHash = window.location.hash;
  if (!currentHash || currentHash === '#') {
    this.router.navigate('kanban');
  } else {
    this.router.navigate(currentHash.slice(1));
  }
});
```

当用户点击侧边栏按钮时 → `ms:activated` 事件触发 → 导航到 kanban（或恢复上次的 hash）。Router 中的默认 hash 设置抢在了用户操作之前，是问题根源。

**备选方案考虑**：在 `Router.init()` 中检查 Media Studio 是否已激活。但 Router 不感知激活状态，且 `ms:activated` 已处理，更简洁的方案是直接移除默认 hash。

### Decision 2: 侧边栏按钮改为纯图标

**现状**（`sidebar.js:51`）：
```js
btn.innerHTML = '🎬 <span>Media Studio</span>';
```

**方案**：移除 `<span>`，只保留图标：
```js
btn.innerHTML = '🎬';
```

同时更新 CSS（`app.css:108-111`）中的 `.ms-rail-btn span` 规则 — 因为不再有 span，可以移除相关样式，或者保留以防其它场景。

**原理**：侧边栏按钮空间有限，图标 `🎬` 已清晰表达 Media Studio 的含义。`title` 属性已提供完整文字说明（`btn.title = 'Media Studio — 自媒体内容生产流水线'`），悬停即可查看。

### Decision 3: 按钮插入到设置按钮之前

**现状**（`sidebar.js:53`）：
```js
rail.appendChild(btn);
```

**方案**：查找 rail 中的 Control Center 按钮（特征：内容包含 `⚙️` 或有 `data-panel` 属性），在其之前插入：
```js
const controlBtn = rail.querySelector('[data-panel="control-center"], .rail-btn:last-child');
rail.insertBefore(separator, controlBtn);
rail.insertBefore(btn, controlBtn);
```

**稳妥备选**：如果 Control Center 选择器不明确，直接取 rail 的最后一个 `.rail-btn` 元素作为插入锚点。因为 Hermes WebUI 的 rail 结构固定为：nav 项目在前，Control Center 在末尾。

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Control Center 选择器不匹配 | 按钮可能插入到错误位置 | 使用 `:last-child` 回退策略；若完全匹配失败则 fallback 到 `appendChild` |
| hash 路由依赖默认行为 | 其他入口依赖 `Router.init()` 设置 hash | 目前 `ms:activated` 是唯一入口，无其他依赖 |
| host 页面 rail 结构变更 | 按钮位置不对 | 控制台 log 输出插入位置信息，便于调试 |
