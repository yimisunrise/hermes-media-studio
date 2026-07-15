## Why

当前 AgentTaskPoller 的传输层实现基于旧版单文件协议（job.json 存完整任务定义 + result.json 存序列化结果），与新版双文件协议（job.json 薄索引 + brief.md 任务简报 + result.md YAML frontmatter）不匹配。需要微调传输层接口，将业务内容处理职责从传输层分离到业务层，使 Agent 通信逻辑与架构设计文档对齐。

## What Changes

1. **AgentTaskPoller API 调整**
   - `deliver(uuid, result, files)` → 改为通用的 `stageResult(uuid)`，仅创建结果目录并清理 processing，不写入具体文件格式
   - `collect()` → 改为返回结果目录 UUID 列表，返回原始 result.md 文本供业务层解析，不再自行解析 JSON
   - 新增 `createTask(type, briefContent, files)` → 写入 job.json + brief.md + 附件到 `.agent/tasks/<uuid>/`
   - 新增 `readResult(uuid)` → 读取 `.agent/results/<uuid>/result.md` 原文

2. **路径修正**
   - ARCHITECTURE.md 中的路径 `framework/core/` → 实际代码在 `src/framework/core/`

3. **职责重新声明**
   - scan() 和 isPendingTask() 不动（已符合新协议）
   - AgentTaskPoller 明确只做传输层：文件搬移、队列生命周期、结果路径返回
   - 业务层（`business/agent/`）负责 brief.md 生成、result.md 解析、结果派发

## Capabilities

### New Capabilities
- `agent-transport`: AgentTaskPoller 传输层 API，负责任务文件生命周期（创建任务目录/扫描/拾取/标记完成/采集结果），不处理业务内容

### Modified Capabilities
- （无现有 spec 变更）

## Impact

- **文件**: `src/framework/core/AgentTaskPoller.js` — 微调 API 签名
- **依赖**: 无新增依赖，`WorkspaceAPI` 已提供所需文件操作
- **业务层**: 后续实现 `business/agent/` 时通过新的 `stageResult`/`readResult` 获取结果
- **ARCHITECTURE.md**: 路径和职责描述已同步
