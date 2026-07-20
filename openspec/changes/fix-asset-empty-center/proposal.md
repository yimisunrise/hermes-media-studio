## Why

素材管理页面（`AssetGallery.js`）在无数据时显示空状态提示文字「暂无素材 / 点击右上角「上传素材」添加」，但文字未在页面中水平居中，影响视觉效果和用户体验。

## What Changes

- 给 `.ms-asset-empty` 元素增加 `grid-column: 1 / -1`，使其跨越 `.ms-asset-grid` 的所有列
- 增加 `text-align: center` 确保文字在整行中居中

不涉及功能逻辑变更，纯 CSS 修复。不修改 HTML 结构或 JS 逻辑。

## Capabilities

无新增能力。此变更为已有功能（Asset Gallery）的 UI 缺陷修复，不改变任何行为规范。

## Impact

- `src/business/views/AssetGallery.js`：仅修改 `_injectStyles()` 中的 CSS 样式定义
- 无其他文件影响
