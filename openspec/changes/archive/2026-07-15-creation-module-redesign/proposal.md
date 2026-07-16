## Why

当前创作模块（TasksView、KanbanBoard、ReviewMode）使用旧 file-based API（`tasks/<uuid>/.meta.json` + `.index/tasks.json`），与策划模块（ThemeStrategy、IdeaBoard、TopicBoard）基于 DataRepository + Schema 的新体系不一致。随着 Agent 集成层就绪，需要统一到新数据层之上，消除两种数据访问模式的维护成本。

## What Changes

- **移除** `framework/lib/api.js` 中的全部业务代理方法（`listTasks`/`createTask`/`updateTaskStatus` 等 ~30 个方法）
- **创建** `business/data/index.js` 仓储工厂，统一对外暴露 DataRepository 实例
- **新增** 创作相关 DB 表：`tasks`（月度分片）、`assets`（月度分片）、`scripts`（不分片）
- **重写** TasksView、KanbanBoard、ReviewMode 三个视图，数据源从旧 API 切换到 DataRepository
- **更新** 现有策划视图（ThemeStrategy / IdeaBoard / TopicBoard）使用 DataRepository 替代 api.js 代理方法
- **创建** `business/agent/` 层（BriefBuilder / ResultParser / AgentHandler），衔接 Agent 传输层与业务数据层
- **更新** ViewManager 向所有视图传递 `schemaRegistry`，替代原来仅 database 视图享有的特权

## Capabilities

### New Capabilities
- `creation-tasks`: 创作任务管理（CRUD + 状态流转 + 月度分片）
- `creation-assets`: 素材管理（关联任务、类型区分、文件管理）
- `creation-scripts`: 脚本管理（版本控制、草稿/定稿状态）
- `agent-integration`: Agent 集成层（Brief 生成、Result 解析、Handler 派发）

### Modified Capabilities

<!-- No existing specs are being modified -->

## Impact

- `src/framework/lib/api.js` — 移除约 30 个业务方法，保留通用文件/会话方法
- `src/framework/ui/ViewManager.js` — 所有视图注入 schemaRegistry
- `src/business/views/ThemeStrategy.js` — 切换到 DataRepository
- `src/business/views/IdeaBoard.js` — 切换到 DataRepository
- `src/business/views/TopicBoard.js` — 切换到 DataRepository
- `src/business/views/TasksView.js` — 完全重写
- `src/business/views/KanbanBoard.js` — 完全重写
- `src/business/views/ReviewMode.js` — 完全重写
- `src/business/init/business-db.init-def.js` — 追加 3 张表定义
- `src/business/agent/` — 新目录，3 个模块
