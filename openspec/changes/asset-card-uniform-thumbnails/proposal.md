## Why

素材管理页（AssetGallery）的卡片列表当前因缩略图容器无高度约束，不同宽高比的原图导致卡片高度参差不齐，视觉上不整齐。hermes-ui-patterns 已定义 `ms-media-card` CSS 类体系（含 `aspect-ratio: 1` 正方形缩略图），但 AssetCard 未复用该体系，而是使用了独立的 inline 样式。本变更将 AssetCard 迁移至现有 `ms-media-card` 类体系，实现统一正方形缩略图展示。

## What Changes

- 将 `AssetCard.js` 的 class 名从 `.ms-asset-card-item` / `.ms-asset-card-thumb` / `.ms-asset-card-info` 替换为已有的 `.ms-media-card` / `.ms-media-card-thumb` / `.ms-media-card-info`
- 删除 `AssetGallery.js` 中冗余的内联样式定义（与 `.ms-media-card` 体系重叠的 `.ms-asset-thumb`、`.ms-asset-card` 等）
- 缩略图容器应用 `aspect-ratio: 1`（正方形），`object-fit: cover` 保持填充
- 卡片删除按钮迁移为 `.ms-item-card-actions` hover 显示机制，替换当前 JS `mouseenter/mouseleave`
- 删除确认弹窗从 `window.confirm` 替换为 Modal 组件（对齐 hermes-ui-patterns 规则 6）
- 空状态迁移为 `.ms-empty` 类 + SVG 图标（对齐规则 7）

## Capabilities

### New Capabilities
- `asset-card-uniform-grid`: 素材卡片统一正方形缩略图网格展示，所有卡片等高等宽

### Modified Capabilities
- （无——本变更仅涉及 UI 展示层，不修改素材数据的 schema 或行为）

## Impact

- `src/business/views/components/AssetCard.js` — 重新渲染逻辑，替换 class 名和交互行为
- `src/business/views/AssetGallery.js` — 清理冗余 inline 样式，其他逻辑不变
- `src/business/app.css` — 无需修改，`ms-media-card` 体系已定义
