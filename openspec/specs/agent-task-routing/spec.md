# agent-task-routing Specification

## Purpose
TBD - created by archiving change connect-agent-task-pipeline. Update Purpose after archive.
## Requirements
### Requirement: Agent 模式任务写入 .agent/ 协议目录

当用户在 TasksView 中选择 Agent 模式创建任务时，系统 SHALL 在保存到 DataRepository 的同时，将任务信息写入 `.agent/tasks/<uuid>/` 目录，使 Hermes Agent 可以感知。

#### Scenario: Agent 模式任务创建触发协议写入

- **WHEN** 用户填写任务表单并选择 mode="agent"，点击"创建"
- **THEN** taskRepo.create() 将任务记录写入 business.tasks 表
- **THEN** AgentHandler.submitTask() 被调用
- **THEN** `.agent/tasks/<uuid>/job.json` 被创建，包含 type、taskId、status:"pending"、createdAt
- **THEN** `.agent/tasks/<uuid>/brief.md` 被创建，包含用户填写的创作简报
- **THEN** 界面显示任务已创建，不阻塞 UI

#### Scenario: 手工模式任务不触发协议写入

- **WHEN** 用户选择 mode="manual" 创建任务
- **THEN** taskRepo.create() 写入业务 DB
- **THEN** AgentHandler.submitTask() 不被调用
- **THEN** `.agent/tasks/` 中无对应目录

### Requirement: .agent/ 目录结构在初始化时创建

系统 SHALL 在业务数据库初始化时创建 `.agent/tasks/`、`.agent/processing/`、`.agent/results/` 目录。

#### Scenario: business-db initDef 创建 .agent/ 目录

- **WHEN** business-db initDef 执行并完成
- **THEN** workspace 中存在 `.agent/tasks/` 目录
- **THEN** workspace 中存在 `.agent/processing/` 目录
- **THEN** workspace 中存在 `.agent/results/` 目录

### Requirement: BriefBuilder 生成协议文件内容

BriefBuilder SHALL 将 task record 组装为符合双文件协议的 job.json 和 brief.md。

#### Scenario: BriefBuilder 组装 job.json

- **WHEN** BriefBuilder.build(taskRecord) 被调用
- **THEN** 返回的 job 对象包含 type（取自 taskType）、taskId、status:"pending"、createdAt

#### Scenario: BriefBuilder 组装 brief.md

- **WHEN** BriefBuilder.build(taskRecord) 被调用
- **THEN** 返回的 brief 字符串包含任务标题、创作简报内容、关联选题 ID

