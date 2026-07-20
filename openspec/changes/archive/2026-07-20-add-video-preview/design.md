## Context

当前素材管理系统中 video 类型的预览能力完全缺失。具体表现：

- **AssetCard.js**（网格卡片）：仅对 `type === 'image'` 渲染 `<img>` 并使用 `api.readAsDataURL()` 加载预览；对 video/audio 仅显示 emoji 图标（🎬/🎵）
- **AssetGallery.js `_showAssetDetail`**（详情弹窗）：仅对 `type === 'image'` 构建内联 `<img>` 预览区块；video 类型无媒体元素
- **AssetGallery.js 预览按钮**：对所有文件类型使用 `api.getDownloadUrl()` → `window.open(url, '_blank')`，对视频 blob URL 在不同浏览器行为不一致（可能下载而非播放）
- **TaskDetail.js** 关联素材列表：同样使用 AssetCard，点击则 `getDownloadUrl` + `window.open`

上传管线已正确处理 video 类型（`AssetUploader.js` 第 19 行通过 `file.type.startsWith('video/')` 识别视频），API 层也支持视频 MIME 类型（`readAsDataURL` 和 `getDownloadUrl` 均不限制 MIME）。

### 约束

- 无构建步骤，纯 ES Module
- 无第三方依赖
- 浏览器原生 `<video>` 元素支持
- 大视频文件需考虑内存和网络加载性能

## Goals / Non-Goals

**Goals:**

- 素材网格卡片中的视频显示可交互的预览（带播放覆盖层的 `<video>` 缩略图）
- 素材详情弹窗中渲染 `<video controls>` 支持视频内联播放
- 详情弹窗「预览」按钮对视频类型复用内联播放器
- TaskDetail 关联素材列表同样支持视频内联预览
- 加载状态和错误处理

**Non-Goals:**

- 视频封面缩略图提取（首帧生成海报图）— 需要 Canvas API 或额外处理，当前不做
- 视频转码/压缩 — 超出当前 scope
- 流式加载（渐进式加载/分段请求）— workspace API 当前基于完整文件读取
- 音频类型预览改造 — 音频问题类似但本变更聚焦视频

## Decisions

### 决策 1：视频源使用 Blob URL（`getDownloadUrl`）而非 Data URL（`readAsDataURL`）

**选择**：`api.getDownloadUrl()` → `URL.createObjectURL(blob)` → `<video src>`

**理由**：
- Data URL（`readAsDataURL`）对视频文件会生成巨大的 base64 字符串（约膨胀 33%），在 DOM 中直接使用会导致巨大内存占用和解析延迟
- Blob URL 是内存中的二进制引用，浏览器的 `<video>` 元素原生支持 blob URL 作为源
- `getDownloadUrl()` 已在 API 层实现（`api.js` 第 451-455 行），复用现有方法

**代价**：每次播放需要将完整文件读入内存（ArrayBuffer → Blob），对大视频不理想，但当前 workspace API 架构如此。

### 决策 2：网格卡片使用 `<video>` + 播放按钮覆盖层，而非 emoji

**选择**：在 `AssetCard.js` 中对 video 类型创建 `<video>` 元素 + 居中播放按钮覆盖层（CSS 半透明三角形图标），视频自动加载首帧作为静态封面

**理由**：
- 纯 emoji 图标无法给用户任何视频内容的视觉提示
- `<video>` 标签的 `preload="metadata"` 属性只加载元数据而非完整视频，对性能和流量影响可控
- 播放按钮覆盖层清晰告知用户该卡片可播放
- 使用与图片卡片一致的尺寸和布局，视觉上保持统一

**代价**：没有提取真实的视频首帧作为缩略图封面（`preload="metadata"` 下浏览器显示全黑或首帧，行为因浏览器而异）。如需精确封面需额外使用 Canvas `drawImage` 捕获首帧，留待后续优化。

### 决策 3：详情弹窗中视频预览与图片预览采用相同模式，但使用 `<video>` 元素

**选择**：在 `_showAssetDetail` 中对 `type === 'video'` 构建 `<video controls>` 区块，使用 `getDownloadUrl()` 异步获取 Blob URL 赋值给 `video.src`

**理由**：
- 与图片预览保持一致的异步加载模式和 UI 布局（同一位置，加载中→播放器）
- `<video controls>` 提供播放/暂停/进度/音量/全屏等完整基础交互
- 视频加载完成后，浏览器处理解码和帧渲染，无需额外代码

### 决策 4：预览按钮对视频类型聚焦到内联播放器，而非 window.open

**选择**：当 `asset.type === 'video'` 时，「预览」按钮行为改为：如果视频已加载则调用 `video.play()` 并滚动到播放器位置；否则复用 `getDownloadUrl()` 并触发播放。

**理由**：
- `window.open(blobURL)` 对视频在不同浏览器下行为不可控（Chrome 可能下载文件而非播放）
- 内联播放提供一致的用户体验
- 无需创建新标签页和后续 Blob URL 生命周期管理

### 决策 5：大视频的加载状态管理

**选择**：在 `<video>` 元素上监听 `loadedmetadata` 和 `error` 事件；加载期间显示加载指示器（与图片共享 `ag-preview-loading` 元素）；加载失败显示错误提示

**理由**：
- 与图片预览模式一致，用户不会感到突兀
- `loadedmetadata` 触发较快（只需元数据），用户体验好
- `error` 事件覆盖了网络错误、格式不支持等异常场景

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 大视频文件完整加载到内存（`getDownloadUrl` 使用 `readAsArrayBuffer`） | 当前 workspace API 架构如此；视频加载完成前显示 loading 状态；视频不会自动全量下载（`preload="metadata"` 仅元数据，用户点击播放才全量加载） |
| `<video>` 在网格中多个同时渲染可能消耗 GPU/内存 | 网格缩略图仅显示首帧（`preload="metadata"`），不会自动播放；只有在用户点击播放时才全量解码 |
| 浏览器不支持视频编码格式（如 H.265 而非 H.264） | 浏览器原生 `<video>` 会触发 `error` 事件，显示"加载失败"提示；使用 MP4（H.264）格式最广泛兼容 |
| Blob URL 内存泄漏 | 每个 Blob URL 在视图销毁或切换时通过 `URL.revokeObjectURL()` 释放；AssetGallery 已有 `destroy()` 方法 |

## Open Questions

1. 是否需要考虑移动端视口下的视频预览布局？当前 WebUI 扩展主要面向桌面。
2. 网格卡片中视频是否应自动播放（muted autoplay）以展示内容？目前保持静态度量，不自动播放。
