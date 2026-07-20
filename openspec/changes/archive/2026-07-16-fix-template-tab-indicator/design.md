## Context

`TemplatesView.js` 的 tab 栏在 `render()` 中创建 tab 按钮并设置 active 样式（蓝色底线），但 tab 点击回调只更新了 `this._activeTab` 并调用 `_renderList()`，没有更新按钮视觉状态。导致蓝色底线始终停留在初始化时的 tab 上。

## Goals / Non-Goals

**Goals:**
- tab 切换时蓝色活动底线跟随到当前 tab
- 保持现有代码结构和风格不变

**Non-Goals:**
- 不重构 tab 渲染方式
- 不涉及样式主题变更

## Decisions

**方案 A：保存 tab 按钮引用，切换时更新**

在 `render()` 中收集所有 tabBtn 到 `this._tabBtns` 数组，`_renderList()` 末尾遍历更新所有按钮的 `borderBottomColor`/`color`/`fontWeight`。

选择理由：
- 最小改动，仅需增加 ~8 行代码
- 不改动现有渲染逻辑
- 按钮引用生命周期与视图一致，无需额外 cleanup

## Risks / Trade-offs

<!-- 无风险，纯视觉修复 -->
