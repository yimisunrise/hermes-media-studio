## ADDED Requirements

### Requirement: Agent 任务存储在 .agent-tasks/ 单目录

Agent 任务通信协议 SHALL 使用 `.agent-tasks/` 单根目录存储所有任务文件和产物，不再使用 `.agent/` 三级目录结构。

#### Scenario: 目录结构
- **WHEN** `.agent-tasks/` 目录被创建
- **THEN** 其根目录下存在 `index.json` 文件
- **AND** 每个任务以 UUID 命名子目录存在

#### Scenario: 旧目录不再创建
- **WHEN** 系统初始化执行
- **THEN** `.agent/tasks/`、`.agent/processing/`、`.agent/results/` 目录 SHALL NOT 被创建
- **AND** `.agent-tasks/` 目录 SHALL 替代 `.agent/` 作为 Agent 通信目录

---

### Requirement: index.json 集中状态管理

系统 SHALL 在 `.agent-tasks/index.json` 中集中管理所有 Agent 任务的状态。

#### Scenario: index.json 格式
- **WHEN** `index.json` 被读取
- **THEN** 其包含 `version` 字段（当前为 1）
- **AND** 包含 `processing` 字段记录当前正在处理的任务 UUID（无任务时为 null）
- **AND** 包含 `tasks` 对象，每个 key 为任务 UUID，value 包含 `status`、`type`、`createdAt`、`pickedAt`、`completedAt`

#### Scenario: 状态流转字段变化
- **WHEN** 任务从 `pending` 变为 `generating`
- **THEN** `tasks[<uuid>].status` 更新为 `"generating"`
- **AND** `tasks[<uuid>].pickedAt` 设为当前时间戳
- **AND** `index.json.processing` 设为该任务 UUID

#### Scenario: 任务完成
- **WHEN** Agent 完成任务执行
- **THEN** `tasks[<uuid>].status` 更新为 `"done"`
- **AND** `tasks[<uuid>].completedAt` 设为当前时间戳
- **AND** `index.json.processing` 重置为 null

---

### Requirement: processing 字段防重复拾取

系统 SHALL 使用 `index.json.processing` 字段作为并发锁，防止 Agent 重复拾取任务。

#### Scenario: Agent 拾取时检查锁
- **WHEN** Agent 准备拾取任务
- **THEN** 先读取 `index.json`
- **AND** 检查 `processing` 是否为 null
- **AND** 如果 `processing` 不为 null，SHALL 跳过拾取

#### Scenario: 无并发空闲状态
- **WHEN** 没有任务正在处理
- **THEN** `index.json.processing` SHALL 为 null

---

### Requirement: 任务文件统一在单目录

每个 Agent 任务的所有文件 SHALL 存放在 `.agent-tasks/<uuid>/` 目录下。

#### Scenario: 创建任务时写入文件
- **WHEN** 系统创建一个 Agent 任务
- **THEN** `.agent-tasks/<uuid>/` 目录被创建
- **AND** `job.json` 被写入（含 type / taskId / status / createdAt）
- **AND** `brief.md` 被写入（任务简报）
- **AND** 可选地 `files/` 目录被创建并写入附件

#### Scenario: Agent 写入结果
- **WHEN** Agent 完成任务执行
- **THEN** result.md 被写入 `.agent-tasks/<uuid>/result.md`
- **AND** 结果文件 SHALL 存放在同一 `<uuid>/` 目录下

---

### Requirement: AgentTaskPoller API 适配新协议

`AgentTaskPoller` SHALL 提供适配新协议的读写方法。

#### Scenario: createTask 写入新目录
- **WHEN** `createTask(type, briefContent, files, taskId)` 被调用
- **THEN** 在 `.agent-tasks/<taskId>/` 创建目录
- **AND** 写入 job.json 和 brief.md
- **AND** 更新 `.agent-tasks/index.json` 添加任务记录

#### Scenario: readIndex 返回全量状态
- **WHEN** `readIndex()` 被调用
- **THEN** 返回 `.agent-tasks/index.json` 的解析内容

#### Scenario: updateTaskStatus 更新状态
- **WHEN** `updateTaskStatus(uuid, status)` 被调用
- **THEN** `index.json.tasks[uuid].status` 被更新
- **AND** 如果状态为 `"generating"`，同时更新 `pickedAt` 和 `processing` 锁
- **AND** 如果状态为 `"done"`，同时更新 `completedAt` 并释放 `processing` 锁

#### Scenario: writeResult 写入结果并更新状态
- **WHEN** `writeResult(uuid, resultContent)` 被调用
- **THEN** result.md 写入 `.agent-tasks/<uuid>/result.md`
- **AND** `updateTaskStatus(uuid, "done")` 自动调用

#### Scenario: 旧的 scan/pickup/stageResult/collect 方法被移除
- **WHEN** `AgentTaskPoller` 实例化后
- **THEN** `scan()`、`pickup()`、`stageResult()`、`collect()` 方法 SHALL NOT 可用

---

### Requirement: AgentStatusSync 适配新协议

`AgentStatusSync` SHALL 通过读取 `index.json` 来判断任务状态，而非检查目录是否存在。

#### Scenario: 通过 index.json 判断状态
- **WHEN** `_poll()` 同步 agent 模式任务
- **THEN** 读 `.agent-tasks/index.json` 获取 tasks 状态
- **AND** 对于 `tasks[uuid].status === "done"` 的任务，读 `.agent-tasks/<uuid>/result.md`

#### Scenario: 不再检查 processing 目录
- **WHEN** `_poll()` 检查任务是否被拾取
- **THEN** 不再 try-catch `.agent/processing/<uuid>/` 目录
- **AND** 改为检查 `index.json.tasks[uuid].status === "generating"`

---

### Requirement: 初始化时创建 .agent-tasks/ 目录

系统 SHALL 在初始化时创建 `.agent-tasks/` 目录及 `index.json`。

#### Scenario: business-db initDef 创建新目录
- **WHEN** 业务数据库初始化执行
- **THEN** `.agent-tasks/` 目录被创建
- **AND** `.agent-tasks/index.json` 被写入初始内容 `{"version":1,"processing":null,"tasks":{}}`
- **AND** `.agent/tasks/`、`.agent/processing/`、`.agent/results/` SHALL NOT 被创建
