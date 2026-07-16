## ADDED Requirements

### Requirement: 公共面板 CSS 类
app.css SHALL 定义 5 个公共面板类 `.ms-panel-section`、`.ms-panel-header`、`.ms-panel-filterbar`、`.ms-panel-body`、`.ms-item-card`，供所有列表面板复用。

#### Scenario: 类定义存在
- **WHEN** app.css 被加载
- **THEN** 5 个 `.ms-panel-*` 和 `.ms-item-card` 类定义可用

### Requirement: 面板结构一致
所有列表面板 SHALL 使用相同的三级结构：header → filterbar → body。

#### Scenario: IdeaBoard 使用公共类
- **WHEN** IdeaBoard 渲染
- **THEN** 头部使用 `.ms-panel-header`，筛选栏使用 `.ms-panel-filterbar`，列表区使用 `.ms-panel-body`

#### Scenario: TopicBoard 使用公共类
- **WHEN** TopicBoard 渲染
- **THEN** 头部使用 `.ms-panel-header`，筛选栏使用 `.ms-panel-filterbar`，列表区使用 `.ms-panel-body`

#### Scenario: TasksView 使用公共类
- **WHEN** TasksView 渲染
- **THEN** 头部使用 `.ms-panel-header`，筛选栏使用 `.ms-panel-filterbar`，卡片容器使用 `.ms-panel-body`

### Requirement: 卡片样式统一
列表中每行卡片 SHALL 使用 `.ms-item-card` 类，hover 时通过 CSS `:hover` 变色，不再使用 JS `onmouseenter/leave`。

#### Scenario: 卡片 hover
- **WHEN** 鼠标悬停在 `.ms-item-card` 上
- **THEN** 卡片边框变为强调色，无需 JS 事件
