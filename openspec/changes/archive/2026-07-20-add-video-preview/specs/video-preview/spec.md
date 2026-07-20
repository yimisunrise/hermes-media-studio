## ADDED Requirements

### Requirement: 素材网格卡片中视频显示缩略图预览
素材网格中的视频类型卡片 SHALL 显示视频内容的首帧作为静态缩略图，或显示带播放按钮覆盖层的视频元素，替代当前纯 emoji 图标。

#### Scenario: 视频素材在网格中显示缩略图
- **WHEN** 素材列表包含 type 为 video 的素材
- **THEN** 网格中的视频卡片 SHALL 显示视频内容预览（或至少显示播放按钮覆盖层），而非纯 emoji 图标
- **AND** 视频缩略图区域 SHALL 与图片卡片保持一致的尺寸和布局

### Requirement: 详情弹窗支持视频内联播放
素材详情弹窗（`_showAssetDetail`）对 type 为 video 的素材 SHALL 渲染 `<video controls>` 元素，支持播放/暂停/音量/全屏等原生控件。

#### Scenario: 视频素材详情弹窗显示内联播放器
- **WHEN** 用户点击视频素材卡片，打开详情弹窗
- **THEN** 弹窗体内容区域 SHALL 显示 `<video controls>` 元素
- **AND** 视频源 SHALL 通过 `api.getDownloadUrl()` 获取 Blob URL 作为 `<video>` 的 src
- **AND** 视频加载期间 SHALL 显示加载状态指示
- **AND** 视频加载失败时 SHALL 显示友好的错误提示

#### Scenario: 视频详情弹窗仍展示元数据
- **WHEN** 视频素材详情弹窗打开
- **THEN** 弹窗中 SHALL 同时展示视频播放器和素材元数据（文件名、类型、大小、MIME、创建时间）

### Requirement: 预览按钮使用内联播放替代 window.open
对于可内联播放的类型（video），详情弹窗中的「预览」按钮 SHALL 优先使用页面内预览而非 `window.open(blobURL)`。

#### Scenario: 视频素材的"预览"行为
- **WHEN** 用户在视频详情弹窗中点击「预览」按钮
- **THEN** 系统 SHALL 在弹窗内展开视频播放器（如果当前已显示则聚焦到播放器）
- **AND** 系统 SHOULD NOT 使用 `window.open(url, '_blank')` 打开新标签页

### Requirement: 关联素材列表中的视频预览
任务详情视图（`TaskDetail`）中的关联素材列表 SHALL 支持视频类型的内联预览，与素材网格中的视频卡片行为一致。

#### Scenario: 任务详情中视频素材预览
- **WHEN** 用户在任务详情中点击关联素材列表中的视频素材
- **THEN** 视频 SHALL 通过内联 `<video controls>` 播放，而非仅通过 `window.open()` 在新标签页打开
