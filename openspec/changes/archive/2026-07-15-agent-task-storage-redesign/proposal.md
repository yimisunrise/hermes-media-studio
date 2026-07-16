## Why

当前 Agent 任务的生命周期状态靠目录位置隐式表达（`tasks/` → `processing/` → `results/` 三级目录流转），导致状态查询需遍历三个目录、任务文件分散在多个位置、增加新状态成本高。改为显式 JSON 状态管理 + 单目录存储，简化协议、提升可维护性。

## What Changes

- **BREAKING** 废弃 `.agent/` 目录（`tasks/` / `processing/` / `results/` 三级结构）
- 新建 `.agent-tasks/` 目录，所有任务文件（job.json / brief.md / files / result.md）统一在 `.agent-tasks/<uuid>/` 下
- 引入 `.agent-tasks/index.json` 集中管理所有任务的状态（pending / generating / done / failed）
- 引入 `processing` 锁字段替代 mv 防重复拾取机制
- 重写 `AgentTaskPoller.js`：去掉基于目录 mv 的 scan/pickup/stageResult/collect，改为 index.json 驱动
- `AgentStatusSync.js` 改为读取 index.json 判断任务状态
- 更新所有文档中的目录结构描述

## Capabilities

### New Capabilities
- `agent-task-protocol`: Agent 任务通信协议的新设计——index.json 集中状态管理 + `.agent-tasks/` 单目录任务存储，覆盖任务创建、状态变更、结果采集全生命周期

### Modified Capabilities

无。当前无已存在的 `openspec/specs/` 目录（非 spec-driven schema 项目），且此次变更不涉及业务层需求变化，属于基础设施层面重构。

## Impact

- `framework/core/AgentTaskPoller.js` — 核心传输层重写
- `business/agent/AgentStatusSync.js` — 状态同步逻辑适配
- `business/agent/AgentHandler.js` — 调用链路微调
- `business/init/business-db.init-def.js` — 目录创建逻辑修改
- `ARCHITECTURE.md` / `README.md` / `DESIGN.md` — 文档多处更新
- Agent 进程端（Hermes Agent）需同步适配新协议
