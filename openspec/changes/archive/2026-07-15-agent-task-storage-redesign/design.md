## Context

当前 Agent 任务通信采用三级目录流转协议：

```
.agent/
├── tasks/<uuid>/       ← pending（扩展写入）
├── processing/<uuid>/  ← generating（Agent mv 至此）
└── results/<uuid>/     ← done（Agent 写入结果）
```

状态隐式于目录位置，需遍历三个目录才能获取全量任务视图。文件系统 mv 操作作为防重复拾取机制，但使代码流程复杂（`AgentTaskPoller` 需要 scan → pickup → stageResult → collect 四个方法）。任务产物文件（job.json、brief.md、files/、result.md）分散在不同阶段目录中。

此次设计将状态管理从"文件系统目录位置"改为"显式 JSON 记录"，任务内容统一存放于单目录。

## Goals / Non-Goals

**Goals:**
- 状态管理集中化：单个 index.json 即可获取全部任务状态
- 任务目录单一化：一个任务的 job.json / brief.md / files / result.md 始终在同一目录
- 防重复拾取：用 JSON 字段锁替代 mv 操作
- 简化 AgentTaskPoller API：从 4+ 方法减少为直接读写方法
- 同步更新所有涉及文件（JS 代码、Shell 脚本、文档）

**Non-Goals:**
- 不改变 job.json / brief.md / result.md 的内部字段格式
- 不涉及业务层状态机（task status 在 DataRepository 中的值）
- 不涉及 Agent 进程端的具体实现（仅定义文件协议，Agent 端需自行适配）

## Decisions

### 1. 目录结构：`.agent-tasks/` 单根目录

```
.agent-tasks/
├── index.json              ← 集中状态管理
└── <uuid>/
    ├── job.json            ← 任务定义
    ├── brief.md            ← 任务简报
    ├── files/              ← 参考附件
    └── result.md           ← Agent 执行结果
```

`.agent/` 目录不再使用，前缀改为 `.agent-tasks/` 明确职责为"任务内容存储"。

**替代方案考虑**：状态放在 `.agent/`、任务内容在 `.agent-tasks/`。否决理由：用户明确要求集中在一个目录。

### 2. index.json 格式

```json
{
  "version": 1,
  "processing": null,
  "tasks": {
    "<uuid>": {
      "status": "pending",
      "type": "comfyui-generate",
      "createdAt": "2026-07-15T10:00:00.000Z",
      "pickedAt": null,
      "completedAt": null
    }
  }
}
```

- `version`：协议版本号，方便未来升级
- `processing`：当前正在处理的任务 UUID，作为并发锁。null 表示无任务在处理
- `tasks`：map 结构，key 为 UUID，便于 O(1) 查找
- 每个任务记录包含时间戳链（createdAt → pickedAt → completedAt），可追溯全生命周期

### 3. 防重复拾取：processing 字段锁

```
Agent 拾取流程:
  1. 读 index.json
  2. 检查 processing === null
  3. 写 processing = <uuid>, tasks[<uuid>].status = "generating"
  4. 读 .agent-tasks/<uuid>/job.json + brief.md 执行
  5. 完成后写 result.md
  6. 写 processing = null, tasks[<uuid>].status = "done"

冲突处理:
  - 如果 processing !== null，Agent 跳过拾取
  - 并发时写入 processing 的最后一个获胜（简单，无需锁服务）
```

在"无多任务并发"的前提下，单字段锁已经足够。若未来需要多任务并发，可改为数组 `processing: ["uuid-a", "uuid-b"]`。

### 4. AgentTaskPoller API 重设计

旧 API（4 个传输方法）：
| 方法 | 操作 |
|------|------|
| scan() | 遍历 .agent/tasks/ 读 job.json |
| pickup(uuid) | mv tasks → processing |
| stageResult(uuid) | 创建 .agent/results/ + 清理 processing |
| collect() | 遍历 .agent/results/ 读 result.md 并清理 |
| readResult(uuid) | 读单个 result.md |

新 API（3 个方法，更语义化）：
| 方法 | 操作 |
|------|------|
| createTask(type, briefContent, files, taskId) | 创建任务目录 + 文件 + 写入 index.json |
| readIndex() | 读 index.json 返回全量状态 |
| updateTaskStatus(uuid, status) | 更新 index.json 中的任务状态 |
| readBrief(uuid) | 读 brief.md |
| readResult(uuid) | 读 result.md |
| writeResult(uuid, resultContent) | 写 result.md + 更新 index.json |

### 5. AgentStatusSync 适配

当前逻辑：遍历业务 DB agent 任务 → 检查 `.agent/processing/<uuid>/` 目录是否存在 → 检查 `.agent/results/<uuid>/result.md` 是否存在。

改为：读 `.agent-tasks/index.json` → 根据 tasks[<uuid>].status 判断 → 读 result.md。

## Risks / Trade-offs

- **processing 字段锁非原子**：写入 index.json 不是原子操作，在极端并发下可能有冲突。当前场景单进程 Agent 无此问题。
- **index.json 持续增长**：随任务数增多，单个 JSON 文件变大。当前使用场景下数百个任务 JSON 体积仍在可接受范围。未来可引入归档机制将已完成任务移出 index.json。
- **Agent 进程需同步适配**：Hermes Agent 需要改为读 index.json + `.agent-tasks/` 目录，协议变更期间两个版本不兼容。建议扩展侧和 Agent 侧同步上线。
