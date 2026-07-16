## Context

当前 `AgentTaskPoller.createTask()` 内部调用 `crypto.randomUUID()` 生成一个全新 UUID 作为 `.agent/tasks/<uuid>/` 的目录名和 `job.json` 中的 `taskId`。但业务层 `DataRepository.create()` 在写入 tasks 表时已经生成了一个 UUID（`taskRecord.id`）。两个不同的 UUID 导致 `.agent/` 目录的状态变化（tasks→processing→results）无法映射回业务 DB 中的对应记录，UI 无法根据 Agent 进度更新任务状态。

本次设计将 Agent 任务目录的 UUID 统一为业务 DB 中的 task record ID，消除映射断层。

## Goals / Non-Goals

**Goals:**
- Agent 模式创建任务时，`.agent/tasks/<uuid>/` 的 uuid 等于 `taskRecord.id`
- `AgentTaskPoller.createTask()` 保持向后兼容（不传 taskId 时自生成）
- 改动量最小，不涉及新增状态同步逻辑

**Non-Goals:**
- 不改变 `.agent/` 目录协议格式（job.json/brief.md 结构不变）
- 不新增从目录状态到业务状态的自动同步——统一 UUID 后为后续状态同步铺平道路，但本次不做
- 不改动 `connect-agent-task-pipeline` 中已实现的 AgentHandler 或 BriefBuilder 的公共 API

## Decisions

1. **`AgentTaskPoller.createTask(type, briefContent, files, taskId?)` 加可选 taskId**
   - 传入 taskId 时：`uuid = taskId`，不再自生成
   - 不传时：`uuid = crypto.randomUUID()`（完全向后兼容）
   - 这是侵入最小、最直接的方式，不改变现有调用方

2. **AgentHandler 传入 `taskRecord.id`**
   ```js
   const uuid = await this._poller.createTask(job.type, brief, [], taskRecord.id);
   ```
   - `brief.md` 的 frontmatter 中自然包含 `taskId`，无需额外修改 BriefBuilder
   - `job.json` 中的 `taskId` 字段自动等于业务 ID

3. **不选择方案：独立映射表**
   - 需要新增表/文件来记录双向映射，增加复杂度和维护成本
   - 多一个映射就多一个不一致的可能
   - 共享 UUID 是在当前架构下最自然的方案

## Risks / Trade-offs

- **现有 Agent 任务兼容**：`connect-agent-task-pipeline` 刚实现、未上线，不存在历史 Agent 任务数据需要迁移。该变更仅在 Proposal 阶段，apply 时会覆盖未合并的代码。
- **Hermes Agent 侧**：Agent 通过 `job.json` 读取任务信息，`taskId` 字段含义不变（仍为唯一标识），只是其值现在等于业务 DB 的 record ID。对 Agent 来说无感知。
