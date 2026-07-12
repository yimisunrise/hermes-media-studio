## ADDED Requirements

### Requirement: 发布表单
系统 SHALL 在 `#publish` 路由下提供发布登记表单。表单 SHALL 包含以下字段：
- 发布平台：从 `configs/platforms/` 读取的平台列表（仅显示已启用的平台）
- 发布类型：根据所选平台的发布类型列表动态加载
- 发布文案：从图文库中选择已审核的文案
- 发布时间：用户指定的发布时间

#### Scenario: 发布表单填写
- **WHEN** 用户导航到发布视图
- **THEN** 显示发布表单
- **WHEN** 用户选择发布平台
- **THEN** 发布类型下拉框自动更新为该平台的可选类型
- **WHEN** 用户选择发布文案
- **THEN** 显示图文库中状态为已审核的文案供选择
- **WHEN** 用户填写所有字段并提交
- **THEN** 创建发布记录

### Requirement: 发布记录存储
发布记录 SHALL 存储在 `.index/publish-records.json` 或按月的分片文件中。每条记录 SHALL 包含：
- 发布平台
- 发布类型
- 发布文案 ID/路径
- 发布时间
- 创建时间
- 状态（已排期 / 已发布 / 失败）

#### Scenario: 发布记录创建
- **WHEN** 用户提交发布表单
- **THEN** 创建发布记录
- **THEN** 关联的文案状态更新为 "scheduled"
- **WHEN** 发布时间到达或手动确认发布
- **THEN** 记录状态变为 "published"，文案状态变为 "published"

### Requirement: 发布记录列表
系统 SHALL 在发布表单下方展示发布历史记录列表。列表 SHALL 支持按平台、状态、时间筛选。

#### Scenario: 发布历史查看
- **WHEN** 用户打开发布视图
- **THEN** 显示发布记录列表（按时间倒序）
- **THEN** 每条记录显示平台、类型、文案标题、发布时间、状态
