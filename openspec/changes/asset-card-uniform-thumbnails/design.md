## Context

当前 AssetCard 使用独立 class 体系（`.ms-asset-card-item` / `.ms-asset-card-thumb` / `.ms-asset-card-info`），缩略图容器无高度约束，不同比例的原图导致卡片高度参差。同时，`src/business/app.css` 已定义完整 `.ms-media-card` 体系供网格卡片使用：

```css
.ms-media-card-thumb {
  width: 100%;
  aspect-ratio: 1;           /* 统一正方形 */
  object-fit: cover;
  background: var(--ms-bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

hermes-ui-patterns 也明确指定素材库应使用 `ms-media-card` 网格卡片。本设计是将 AssetCard 迁移至该体系的最小化变更。

## Goals / Non-Goals

**Goals:**
- AssetCard 使用 `.ms-media-card` / `.ms-media-card-thumb` / `.ms-media-card-info` class，卡片统一正方形缩略图
- 删除 AssetGallery 中重叠冗余的 inline 样式（`.ms-asset-thumb`, `.ms-asset-card` 等）
- 操作按钮使用 `.ms-item-card-actions` CSS hover 显示，删除 JS `mouseenter/mouseleave`
- 删除确认使用 Modal 组件替代 `window.confirm`
- 空状态使用 `.ms-empty` + SVG 图标

**Non-Goals:**
- 不改动 AssetGallery 的上传、筛选、详情弹窗等其他功能逻辑
- 不改动 `src/business/app.css`（`ms-media-card` 体系已完备）
- 不引入新的 grid 布局方案（现有 CSS Grid `repeat(auto-fill, minmax(200px, 1fr))` 保持不变）
- 不涉及列表视图/网格视图切换（这是未来的扩展方向）

## Decisions

### 1. 使用 `aspect-ratio: 1` 而非 `aspect-ratio: 4/3`
- **选择**：1:1 正方形
- **理由**：素材管理中有横图（16:9 截图）、竖图（9:16 手机截图）、方形图等多种比例。统一裁为正方形时，所有卡片在 grid 中排列最整齐。且 `ms-media-card-thumb` 已定义为 `aspect-ratio: 1`，零新增 CSS
- **替代方案**：16:9（对横屏视频友好，但竖图裁剪过重）/ 4:3（折中，但需要新增 CSS）

### 2. 操作按钮使用 `.ms-item-card-actions` CSS hover
- **选择**：CSS class 方式，而非 JS `mouseenter/mouseleave`
- **理由**：对齐 hermes-ui-patterns 规则 2，CSS 路径避免 JS 事件绑定，也更便于后续维护
- **实施**：`ms-item-card-actions` 已有 `display: none` + `:hover` 规则，按钮放入该容器即可

### 3. 删除确认使用 Modal
- **选择**：复用 `framework/ui/Modal.js`
- **理由**：对齐 hermes-ui-patterns 规则 6，AssetGallery 的 `_showAssetDetail` 已在使用 Modal，保持一致

### 4. 空状态使用 `.ms-empty`
- **选择**：使用框架 class + SVG 图标
- **理由**：对齐规则 7，替代当前 inline HTML（`<div style="font-size:32px;opacity:0.3;">-</div>`）

### 5. 缩略图 class 变更不影响 thumbnail 加载逻辑
- AssetCard 中 `api.readAsDataURL()` / `api.getDownloadUrl()` 的异步加载逻辑不变
- 仅容器 class 变化，图片的 `object-fit: cover` 保持不变

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| 正方形裁剪导致极端比例图片（如 1:10 长图）几乎不可见 | `object-fit: cover` 确保填充，但确实会严重裁剪。通过点击打开详情弹窗查看原图即可 |
| 现有内联样式可能与其他视图共用 | 检查发现 AssetGallery 的内联样式 ID 为 `media-studio-asset-gallery-styles`，仅 AssetGallery 使用，安全删除 |
| Compact 模式（`_renderCompact`）受影响 | Compact 模式使用独立渲染路径，保持其样式不变，仅修改默认网格路径 |
