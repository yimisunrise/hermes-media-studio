## ADDED Requirements

### Requirement: 素材卡片使用统一正方形缩略图

素材管理页面的卡片列表 SHOULD 展示统一尺寸的正方形缩略图，所有卡片在网格中等高等宽。

#### Scenario: 图片素材显示正方形缩略图
- **WHEN** 用户浏览素材列表
- **THEN** 每张素材卡片 SHOULD 使用 `.ms-media-card` 类
- **AND** 缩略图容器 SHOULD 使用 `.ms-media-card-thumb` 类并应用 `aspect-ratio: 1`
- **AND** 图片内容 SHOULD 通过 `object-fit: cover` 填充正方形区域

#### Scenario: 视频素材显示正方形缩略图+播放叠加图标
- **WHEN** 视频素材在卡片中渲染
- **THEN** 缩略图为正方形（`aspect-ratio: 1`），叠加播放按钮 SVG 图标

#### Scenario: 音频/其他素材显示类型图标
- **WHEN** 素材类型为 audio 或无 filePath
- **THEN** 正方形缩略图区域居中显示对应的类型 SVG 图标

### Requirement: 操作按钮 hover 显示

卡片操作按钮 SHOULD 默认隐藏，鼠标悬停时显示。

#### Scenario: 默认隐藏删除按钮
- **WHEN** 卡片未被鼠标悬停
- **THEN** 删除按钮 SHOULD 不可见

#### Scenario: 悬停显示删除按钮
- **WHEN** 鼠标悬停在卡片上
- **THEN** 删除按钮 SHOULD 可见

### Requirement: 删除操作使用 Modal 确认

删除素材 SHOULD 使用 Modal 弹窗确认，而非 `window.confirm`。

#### Scenario: 点击删除按钮弹出 Modal
- **WHEN** 用户点击卡片上的删除按钮
- **THEN** 弹出 Modal 确认弹窗，含「确认删除此素材？」文案
- **AND** Modal 底部有「确认」「取消」按钮

#### Scenario: 确认删除
- **WHEN** 用户在 Modal 中点击「确认」
- **THEN** 执行素材删除，刷新列表

#### Scenario: 取消删除
- **WHEN** 用户在 Modal 中点击「取消」或关闭弹窗
- **THEN** 不做任何删除操作

### Requirement: 空状态使用组件化展示

当无素材时，SHOULD 展示 `.ms-empty` 类容器 + SVG 图标。

#### Scenario: 空列表展示
- **WHEN** 素材列表为空
- **THEN** 展示含文件 SVG 图标的空状态界面
- **AND** 文案提示「暂无素材，点击上方上传」
