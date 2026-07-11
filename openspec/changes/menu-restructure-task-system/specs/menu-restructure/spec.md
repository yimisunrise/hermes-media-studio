## ADDED Requirements

### Requirement: 菜单按四级分组重新组织
系统 SHALL 将侧边栏菜单重新组织为以下四级分组：
- 生产流程：看板、审批、任务
- 发布管理：发布
- 资源管理：素材库、图文库、日历
- 运营配置：初始化、平台配置

#### Scenario: 菜单显示新分组
- **WHEN** 用户激活 Media Studio
- **THEN** 侧边栏显示上述四个分组，每个分组下包含对应的菜单项
- **THEN** "生成"不再出现在菜单中
- **THEN** "主题"和"数据"不再出现在菜单中
- **THEN** "日历"出现在资源管理分组下而非发布管理分组下

### Requirement: 视图注册更新
系统 SHALL 注册新视图并移除旧视图：
- 新增视图：`tasks`、`publish`、`copywriting`、`platforms`
- 移除视图：`generation`、`themes`、`dashboard`、`package-editor`
- `calendar` 视图保留但移至其他分组

#### Scenario: 新视图可路由
- **WHEN** 用户点击"任务"菜单项
- **THEN** URL hash 变为 `#tasks`
- **WHEN** 用户点击"发布"菜单项
- **THEN** URL hash 变为 `#publish`
- **WHEN** 用户点击"图文库"菜单项
- **THEN** URL hash 变为 `#copywriting`
- **WHEN** 用户点击"平台配置"菜单项
- **THEN** URL hash 变为 `#platforms`

#### Scenario: 旧视图不再可路由
- **WHEN** 用户手动输入 `#generation`
- **THEN** 系统自动重定向到默认视图（看板）
- **WHEN** 用户手动输入 `#themes`
- **THEN** 系统自动重定向到默认视图
- **WHEN** 用户手动输入 `#dashboard`
- **THEN** 系统自动重定向到默认视图

### Requirement: 日历视图功能调整
日历 SHALL 从发布管理移至资源管理分组。日历统计内容 SHALL 从"发布包"统计改为展示每日各类成果（素材成果、图文成果）的生成数量。

#### Scenario: 日历显示成果统计
- **WHEN** 用户打开日历视图
- **THEN** 日历展示每日生成的素材数量和图文数量
- **THEN** 日历不再展示发布相关数据
