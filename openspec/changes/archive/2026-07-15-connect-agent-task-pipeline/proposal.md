## Why

Agent 模式的任务在当前版本完全无法被 Hermes Agent 感知。TasksView 创建任务时仅通过 DataRepository 写入业务数据库（`.database/business/tasks/`），但从不写入 `.agent/tasks/<uuid>/` 目录。Hermes Agent 只扫描 `.agent/` 目录获取任务，因此 Agent 模式创建的任务永远停留在 `pending` 状态，实际没有任何 Agent 调度发生。框架层的 `AgentTaskPoller.createTask()` 已完整实现（写入 job.json + brief.md），但业务层从未调用它。

## What Changes

- 创建 `business/agent/` 模块（3 个文件）：`BriefBuilder.js`、`AgentHandler.js`、`index.js`
- BriefBuilder 将 DataRepository 的 task record 组装为 brief.md + job.json
- AgentHandler 编排：任务创建 → BriefBuilder → AgentTaskPoller.createTask() → 轮询 → 采集结果
- TasksView 创建 Agent 模式任务时串联 AgentHandler
- 在 InitOrchestrator 初始化链中创建 `.agent/` 目录结构（tasks/ / processing/ / results/）
- Manifest 注册 `agent-task-routing` 能力对应的 initDef（目录初始化）

## Capabilities

### New Capabilities
- `agent-task-routing`: 从业务层 task record 到 `.agent/` 目录通信协议的完整路由能力。涵盖：任务创建时写入 job.json + brief.md、Hermes Agent 拾取后的 processing 状态管理、结果回写后的采集与业务 DB 更新。

### Modified Capabilities
- *（无）*

## Impact

- 新增 `src/business/agent/` 目录（3 文件）
- 修改 `src/business/views/TasksView.js`（Agent 模式创建时调用 AgentHandler）
- 修改 `src/business/init/business-db.init-def.js` 或新建 initDef 创建 `.agent/` 目录
- 无框架层修改（`AgentTaskPoller` 接口不变）
- 无 API 层修改
