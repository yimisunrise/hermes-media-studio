## MODIFIED Requirements

### Requirement: 卡片基础样式
任务的卡片 SHALL 有明确的视觉容器：背景色、圆角边框、内边距、指针光标。卡片内部布局 SHALL 按照从上到下顺序：标题 → 时间 → 底部栏。

#### Scenario: 卡片外观
- **WHEN** 看板渲染任务卡片
- **THEN** 每个卡片有 background/border-radius/padding，cursor 为 pointer

#### Scenario: 卡片内部布局
- **WHEN** 任务卡片渲染完成
- **THEN** 卡片内容从上到下依次为：标题（加粗）、时间（灰色小字）、底部栏
- **THEN** 底部栏内，类型/模式标签在左，操作按钮在右

### Requirement: 按钮样式
卡片上的关闭/归档按钮 SHALL 有可交互的视觉样式。按钮 SHALL 位于卡片底部栏的右侧。

#### Scenario: 按钮外观
- **WHEN** 按钮渲染在卡片上
- **THEN** 按钮有边框、圆角、与卡片一致的配色
- **WHEN** 鼠标悬停在关闭按钮上
- **THEN** 按钮变为红色系
- **WHEN** 鼠标悬停在归档按钮上
- **THEN** 按钮变为橙色系
