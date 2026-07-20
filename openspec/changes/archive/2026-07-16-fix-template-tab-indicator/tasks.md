## 1. Tab 底线指示修复

- [x] 1.1 在 `TemplatesView.render()` 中收集 tab 按钮到 `this._tabBtns` 数组
- [x] 1.2 新增 `_updateTabStyles()` 方法，遍历 `this._tabBtns` 根据 `this._activeTab` 设置 `borderBottomColor`/`color`/`fontWeight`
- [x] 1.3 在 tab 点击回调中调用 `_updateTabStyles()`，在 `_renderList()` 调用处也确保样式更新
