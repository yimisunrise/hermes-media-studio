## Why

素材管理中的 video/mp4 类型文件无法内联预览。当前预览系统仅支持图片类型（`<img>` + `readAsDataURL`），视频素材在网格中只显示 emoji 图标（🎬），在详情弹窗中完全没有媒体元素。用户无法在应用内预览视频素材，影响创作生产流程的效率。

## What Changes

- 在 `AssetCard` 中对视频类型渲染 `<video>` 元素，替代纯 emoji 图标
- 在 `AssetGallery` 详情弹窗（`_showAssetDetail`）中为视频类型添加内联 `<video controls>` 预览
- 优化详情弹窗中「预览」按钮行为，对内联可播放类型优先使用页面内播放，而非 `window.open(blobURL)`
- 在 `TaskDetail` 中关联素材预览同步支持视频
- 添加相应的 CSS 样式，确保视频元素在网格和弹窗中对齐

## Capabilities

### New Capabilities
- `video-preview`: 素材管理中对 video 类型的文件进行内联预览的能力，涵盖网格缩略图、详情弹窗内联播放、以及关联素材列表中的预览

### Modified Capabilities

无。所有涉及模块为新功能扩展，不改变既有能力的行为契约。

## Impact

| 模块 | 影响 |
|------|------|
| `src/business/views/components/AssetCard.js` | 修改 render 方法，为 video 类型添加 `<video>` 元素和播放图标覆盖层 |
| `src/business/views/AssetGallery.js` | 修改 `_showAssetDetail`，添加 video 分支渲染 `<video controls>`；优化预览按钮行为 |
| `src/business/views/TaskDetail.js` | 关联素材预览同步支持视频内联播放 |
| `src/business/app.css` | 新增 video 预览相关样式 |
| `src/framework/lib/api.js` | 无需修改（`getDownloadUrl` 和 `readAsDataURL` 已支持视频 MIME 类型） |
