## Context

当前 Agent 模式任务只写入 DataRepository，Hermes Agent 无感知。框架层 `AgentTaskPoller` 已实现完整的双文件协议（job.json + brief.md），但业务层无调用者。需要在业务层新增衔接模块，将 task record 转化为 `.agent/` 目录协议文件，串联任务创建→Agent 调度→结果采集的全流程。

相关文件：
- `framework/core/AgentTaskPoller.js` — 传输层（不修改）
- `business/views/TasksView.js` — 任务创建入口（需修改）
- `business/init/business-db.init-def.js` — 业务初始化（可能需要扩展）

## Goals / Non-Goals

**Goals:**
- 创建 `business/agent/` 模块：BriefBuilder（组装协议文件）、AgentHandler（编排生命周期）
- Agent 模式任务创建时自动写入 `.agent/tasks/<uuid>/job.json + brief.md`
- `.agent/` 目录结构在初始化时创建（tasks/ / processing/ / results/）
- TasksView 中 Agent 模式创建后显示 Agent 已调度的状态信息

**Non-Goals:**
- 不修改 `AgentTaskPoller` 框架层接口
- 不实现 Agent 结果回写的自动化（ResultParser 仅为桩模块预留）
- 不涉及 Hermes Agent 进程本身的安装或配置
- 不添加轮询 UI 或实时状态更新

## Decisions

| 决策 | 选择 | 理由 |
|------|------|------|
| 模块位置 | `business/agent/` | 与框架层 `AgentTaskPoller` 分离，保持框架零业务依赖 |
| BriefBuilder 职责边界 | 仅组装文本，不写文件 | 写文件由 AgentHandler 调用 AgentTaskPoller.createTask() 完成，单一职责 |
| AgentHandler 调用时机 | TasksView 创建任务后立即异步调用 | 不阻塞 UI，任务创建成功后 fire-and-forget |
| `.agent/` 目录初始化 | 在 business-db initDef 中创建 | 与 workspace 准备工作一同完成，无需新增独立 initDef |
| brief.md 内容格式 | YAML frontmatter + Markdown 正文 | 与现有双文件协议一致，Hermes Agent 可直接解析 |

数据流：

```
TasksView._showCreateForm()
  → taskRepo.create()                   写入业务 DB
  → AgentHandler.submitTask(taskRecord) 异步触发
      → BriefBuilder.build(taskRecord)  组装 brief.md + job.json
      → AgentTaskPoller.createTask()    写入 .agent/tasks/<uuid>/
```

## Risks / Trade-offs

- **[低] Agent 进程未运行时任务堆积** → `.agent/tasks/` 目录中的任务会自然堆积，Agent 上线后自动拾取，无需额外处理
- **[低] brief.md 格式与 Agent 期望不匹配** → 当前 `AgentTaskPoller.createTask()` 写入的 brief.md 为纯 Markdown，Hermes Agent 需支持此格式。若未来需结构化格式，则扩展 BriefBuilder
- **[中] 无重试机制** → 若 `createTask()` 因文件系统错误失败，任务仅存于业务 DB 而 `.agent/` 中无对应目录。当前手动重试，未来可添加重试队列
