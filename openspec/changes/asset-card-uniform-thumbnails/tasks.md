## 1. AssetCard 默认渲染路径迁移至 ms-media-card 体系

- [x] 1.1 将 `AssetCard.js` `render()` 方法中的 class 名 `.ms-asset-card-item` 替换为 `.ms-media-card`，确保 `ms-media-card` 的 border/radius/hover 样式生效
- [x] 1.2 将缩略图容器 class 从 `.ms-asset-card-thumb` 替换为 `.ms-media-card-thumb`（继承 `aspect-ratio: 1` 正方形约束）
- [x] 1.3 将信息区 class 从 `.ms-asset-card-info` 替换为 `.ms-media-card-info`
- [x] 1.4 移除 `render()` 中缩略图容器和图片上重复的内联 style（如 `width:100%;height:100%;object-fit:cover`），由 `.ms-media-card-thumb` 的 CSS 统一控制
- [x] 1.5 视频素材缩略图和播放叠加图标在正方形容器中校验显示正常
- [x] 1.6 音频/无图类型素材保持 SVG 图标居中显示

## 2. 操作按钮迁移至 ms-item-card-actions

- [x] 2.1 在 `.ms-media-card` 卡片内添加 `.ms-item-card-actions` 容器，包裹删除按钮
- [x] 2.2 移除 `render()` 中删除按钮的 JS `mouseenter/mouseleave` 事件绑定
- [x] 2.3 删除按钮 click 事件已含 `e.stopPropagation()` 防止冒泡触发卡片点击
- [x] 2.4 确认删除按钮的 CSS hover 显示符合 hermes-ui-patterns（默认隐藏，hover 可见）

## 3. 删除确认弹窗替换为 Modal

- [x] 3.1 删除操作不再使用 `window.confirm`，改为调用 `Modal` 组件
- [x] 3.2 Modal 包含「确认删除此素材？」文案和「确认」「取消」按钮
- [x] 3.3 点击确认执行删除并刷新列表，点击取消关闭弹窗
- [x] 3.4 确保 `e.stopPropagation()` 阻止 Modal 内部操作冒泡

## 4. AssetGallery 内联样式清理

- [x] 4.1 删除 `_injectStyles()` 中与 `.ms-media-card` 体系重叠的样式规则（`.ms-asset-card`, `.ms-asset-thumb`, `.ms-asset-info`, `.ms-asset-name`, `.ms-asset-meta`, `.ms-asset-type-badge`, `.ms-asset-thumb-icon`）
- [x] 4.2 确认 `.ms-asset-grid`（grid 容器）样式保留不变

## 5. 空状态迁移至 ms-empty

- [x] 5.1 将 `_renderGrid()` 空状态的 inline HTML 替换为 `.ms-empty` 类容器 + 文件 SVG 图标
- [x] 5.2 文案改为「暂无素材，点击上方上传」

## 6. 验证

- [x] 6.1 执行语法检查确认无误（`sed` 剥离 `import/export` 后 `node --check` 通过）
- [x] 6.2 紧凑模式（`_renderCompact`）未受影响——仅移除了 `window.confirm`，其余逻辑保持不变
- [x] 6.3 上传素材后新卡片使用 `ms-media-card` + `aspect-ratio:1` 正方形缩略图
- [x] 6.4 删除按钮使用 CSS `.ms-media-card:hover .ms-item-card-actions` 控制 hover 显示/隐藏
- [x] 6.5 删除使用 `_confirmDelete()` Modal 确认流程
