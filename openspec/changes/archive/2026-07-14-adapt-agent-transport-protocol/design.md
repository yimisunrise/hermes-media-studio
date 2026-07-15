## Context

当前 AgentTaskPoller 实现使用旧版单文件协议：

- `deliver(uuid, result, files)` 写入 `result.json`（序列化对象）
- `collect()` 读取 `result.json` 并解析为 JS 对象
- 缺乏写入 `brief.md` 的能力
- 职责边界模糊：传输层既搬文件又解析内容

新版双文件协议要求：
- `job.json` → 仅存 `{type, taskId, status, createdAt}` 供 scan() 快速扫描
- `brief.md` → 任务简报（YAML frontmatter + Markdown），供 Agent 读取执行
- `result.md` → 结果报告（YAML frontmatter + Markdown），业务层解析 frontmatter
- 传输层不解析业务内容

## Goals / Non-Goals

**Goals:**
- AgentTaskPoller API 与新版双文件协议对齐
- 职责分离：传输层只搬文件，不解析内容
- 向后兼容：现有调用方（若有）不崩溃
- 保持 `scan()` / `pickup()` / `isPendingTask()` 不变（已符合新协议）

**Non-Goals:**
- 业务层 `business/agent/` 的实现（brief生成/result解析/handler 派发）
- AgentTaskPoller 之外的框架改造
- Agent 进程本身

## Decisions

### 1. deliver() → 改为 stageResult(uuid)，不写具体文件

旧 `deliver(uuid, result, files)` 写 result.json 是"传输层替业务层做决定"。改为 `stageResult(uuid)` 仅创建 results 目录 + 清理 processing，由业务层自行写入 result.md。

**备选方案**: 保留 deliver() 签名但改为写 result.md。否决理由：传输层不应该假设结果文件的格式。结果格式是业务层 Agent 协议的一部分，不是传输层关心的。

### 2. collect() → 返回 { uuid, resultText }[]，不解析

旧 `collect()` 返回 `{ result, files, delivered_at }`，隐含解析 `result.json`。改为扫描 results 目录、读取 `result.md` 原文，返回 `{ uuid, resultText }[]`。业务层收到后自行 parseFrontmatter()。

**备选方案**: 返回 parsed frontmatter。否决理由：同 1——传输层不应理解 frontmatter 字段含义。

### 3. 新增 createTask(type, briefContent, files?)

传输层提供方便的写入入口：创建 UUID 目录 → 写 `job.json` → 写 `brief.md` → 复制附件（可选）。这属于传输层职责（文件生命周期管理）而非内容理解。

### 4. 新增 readResult(uuid)

单个结果读取，供业务层在 collect 的批量模式之外按需读取。

### 5. briefContent 参数是原始 Markdown 字符串

写入前不做 frontmatter 校验或格式转换。传输层不关心内容格式，只负责写入。如果业务层传的是无效 frontmatter，传输层不做拦截。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 现有调用方使用旧 deliver()/collect() 签名 | 搜索所有调用方，确认无其他使用后再改签名 |
| `stageResult()` 误清理其他进程的 processing 目录 | UUID 命名空间隔离，同类无锁协议保证单进程访问 |
| brief.md 写入失败但 job.json 已写入 | createTask 整体 try-catch，任一失败则清理整个 UUID 目录 |
