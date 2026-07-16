## Why

TasksView 的筛选栏包含类型选择、状态选择、归档复选框三个元素，但由于 `.ms-panel-filterbar` 设置了 `flex-wrap: wrap`，在部分布局条件下三个元素被折为三行，占用过多垂直空间。需要强制保持在一行。

## What Changes

- 移除 `.ms-panel-filterbar` 的 `flex-wrap: wrap` 属性

## Capabilities

### New Capabilities

无

### Modified Capabilities

无

## Impact

- `src/business/app.css` — 一行 CSS 删除
