## Why

Agent 模式创建任务时产生了两个不同的 UUID——业务库 task record 一个 ID，`.agent/tasks/<uuid>/` 目录名另一个 ID。这导致 `.agent/` 目录状态变化（pickup → processing → results）无法反向同步到业务 DB 的任务状态，UI 上看不到任何状态更新。只需让两个层级共享同一个 UUID 即可消除这个断层，无需双向映射表。

## What Changes

- `AgentTaskPoller.createTask()` 增加可选 `taskId` 参数，传入时不再自生成 UUID
- `AgentHandler.submitTask()` 将 `taskRecord.id` 作为 taskId 传入 createTask
- `job.json` 中的 `taskId` 字段此时自然等于业务 DB 的 record id

## Capabilities

### New Capabilities

（无，仅修改已有的 `agent-task-communication` 实现细节）

### Modified Capabilities

（无 spec 级行为变更——createTask 接口向后兼容，不传 taskId 时行为不变）

## Impact

- `src/framework/core/AgentTaskPoller.js`：`createTask()` 签名扩展
- `src/business/agent/AgentHandler.js`：调用处传入 `taskRecord.id`
- `src/business/agent/BriefBuilder.js`：无需改动（build 中 job.taskId 来自 record.id）
