## 1. AssetCard 视频缩略图渲染

- [x] 1.1 在 `AssetCard.render()` 中对 `type === 'video'` 分支创建 `<video>` 元素替代纯 emoji 图标，设置 `preload="metadata"`、`muted`、`playsinline` 属性
- [x] 1.2 在 `<video>` 上方添加 CSS 播放按钮覆盖层（居中三角形图标），使用半透明背景
- [x] 1.3 通过 `api.getDownloadUrl()` 异步获取 Blob URL 赋值给 `video.src`，处理加载状态
- [x] 1.4 同样的改动同步到 `_renderCompact()` 紧凑模式

## 2. AssetGallery 详情弹窗视频内联预览

- [x] 2.1 在 `_showAssetDetail()` 中为 `type === 'video'` 添加 `<video controls>` 区块，放置于元数据之前（与图片相同位置）
- [x] 2.2 通过 `api.getDownloadUrl()` 异步加载视频 Blob URL 作为 src，显示加载状态和错误处理

## 3. AssetGallery 预览按钮优化

- [x] 3.1 修改 `#ag-preview` 点击处理逻辑：对 `type === 'video'` 聚焦到内联播放器并调用 `play()`；对其他类型继续使用 `window.open()`
- [x] 3.2 视频 `<video>` 元素添加 `id="ag-preview-video"`，预览按钮通过 scrollIntoView + play 聚焦

## 4. TaskDetail 关联素材视频预览

- [x] 4.1 修改 `TaskDetail` 中关联素材点击处理逻辑（第 240-244 行），对 `type === 'video'` 创建 `<video controls>` 弹窗或内联播放，而非直接 `window.open()`
- [x] 4.2 确保视频播放时不影响任务详情视图的布局

## 5. CSS 样式

- [x] 5.1 在 `AssetGallery` 内联样式中添加 `.ms-asset-thumb video { width:100%;height:100%;object-fit:cover;display:block; }`
- [x] 5.2 播放按钮覆盖层使用内联样式和 SVG 图标，覆盖层为半透明黑色（rgba(0,0,0,0.25)），与暗色主题完全兼容

## 6. 验证

- [x] 6.1 JS 语法检查通过：修改的三个文件（AssetCard.js、AssetGallery.js、TaskDetail.js）语法正确。项目中所有 `.js` 文件的 ES Module 解析错误（Cannot use import statement outside a module）为预存问题（package.json 缺少 "type": "module"），非本次变更引入
- [ ] 6.2 手动验证视频上传 → 网格卡片显示 → 详情弹窗播放 → 预览按钮行为全链路（需在运行环境中测试）
