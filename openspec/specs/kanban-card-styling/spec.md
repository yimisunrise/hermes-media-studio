## ADDED Requirements

### Requirement: 卡片基础样式
任务的卡片 SHALL 有明确的视觉容器：背景色、圆角边框、内边距、指针光标。卡片内部布局 SHALL 按照从上到下顺序：标题 → 时间 → 底部栏。

#### Scenario: 卡片外观
- **WHEN** 看板渲染任务卡片
- **THEN** 每个卡片有 background/border-radius/padding，cursor 为 pointer

#### Scenario: 卡片内部布局
- **WHEN** 任务卡片渲染完成
- **THEN** 卡片内容从上到下依次为：标题（加粗）、时间（灰色小字）、底部栏
- **THEN** 底部栏内，类型/模式标签在左，操作按钮在右

### Requirement: 悬停效果
卡片 SHALL 在鼠标悬停时有视觉反馈：边框变色并轻微浮起。

#### Scenario: 悬停
- **WHEN** 鼠标悬停在卡片上
- **THEN** 卡片边框变为强调色，出现阴影，向上偏移 1px

### Requirement: 列色条
每列中的卡片 SHALL 在左侧显示对应状态色的竖条。

#### Scenario: 色条颜色对应
- **WHEN** 卡片在 pending 列
- **THEN** 其左侧色条为橙色
- **WHEN** 卡片在 generating 列
- **THEN** 其左侧色条为蓝色
- **WHEN** 卡片在 review 列
- **THEN** 其左侧色条为红色
- **WHEN** 卡片在 approved 列
- **THEN** 其左侧色条为绿色

### Requirement: 拖拽视觉反馈
拖拽中的卡片 SHALL 半透明并略微旋转。

#### Scenario: 拖拽中
- **WHEN** 用户开始拖拽卡片
- **THEN** 卡片变为 50% 透明度并旋转 2 度

### Requirement: 按钮样式
卡片上的关闭/归档按钮 SHALL 有可交互的视觉样式：边框、悬停变色。按钮 SHALL 位于卡片底部栏的右侧。

#### Scenario: 按钮外观
- **WHEN** 按钮渲染在卡片上
- **THEN** 按钮有边框、圆角、与卡片一致的配色
- **WHEN** 鼠标悬停在关闭按钮上
- **THEN** 按钮变为红色系
- **WHEN** 鼠标悬停在归档按钮上
- **THEN** 按钮变为橙色系
