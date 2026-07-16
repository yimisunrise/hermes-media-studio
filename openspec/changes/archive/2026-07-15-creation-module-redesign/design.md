## Context

Hermes Media Studio 采用三层架构：framework（零业务依赖）→ business（视图+数据）→ .database（JSON 文件持久化）。当前策划模块（ThemeStrategy/IdeaBoard/TopicBoard）已基于 DataRepository + SchemaRegistry 体系运作，但创作模块仍使用旧 file-based API：

- `tasks/<uuid>/.meta.json` 逐任务文件存储
- `.index/tasks.json` + `.index/pipeline.json` 索引文件
- `api.js` 中约 30 个业务代理方法直接操作文件系统

AgentTaskPoller（framework 层）已实现双文件协议（job.json + brief.md），但缺少业务层的衔接。

## Goals / Non-Goals

**Goals:**
- 统一创作模块与策划模块的数据访问模式，全部走 DataRepository + SchemaRegistry
- 移除 api.js 中所有业务代理方法，使其回归通用文件/会话 API 的职责
- 创作数据纳入 Schema 管理体系（表定义、字段校验、分片策略）
- 三个视图（TasksView/KanbanBoard/ReviewMode）基于 DataRepository 重写
- 创建 Agent 集成业务层（BriefBuilder/ResultParser/AgentHandler）
- 完成端到端验证：视图 CRUD → Agent 流转闭环

**Non-Goals:**
- 不改变现有 UI 交互范式（Kanban 拖拽、Review 审批流程保持原样）
- 不引入新的外部依赖
- 不改造 framework/core/DataRepository.js 或 SchemaRegistry 本身
- 不迁移历史数据（开发初期，旧数据直接废弃）

## Decisions

### 1. DataRepository 直接注入业务视图

**方案：** ViewManager 向**所有**视图构造函数注入 `schemaRegistry`，视图内部按需调用 `DataRepository.for(api, schemaRegistry, 'business', tableName)` 获取仓储实例。

**理由：**
- 现有策划视图已使用此模式，保持一致
- 视图自行管理仓储实例生命周期，无需全局注册中心
- 与 api.js 解耦——视图不再依赖 api 上的业务方法

**备选方案：** 在 api.js 中保留统一业务 API 层，通过 DataRepository 实现——被否决。会导致 api.js 仍承载业务语义，职责边界模糊。

### 2. 旧视图完全重写而非迁移

**方案：** TasksView、KanbanBoard、ReviewMode 三个视图从零重写，不兼容旧数据格式。

**理由：**
- 开发初期明确声明"不兼容历史用户和数据"
- 旧视图代码与旧文件 API 深度耦合（`readTaskMeta`/`writeTaskMeta`/`scanDirectory`），修改成本接近重写
- 新 Schema 字段设计与旧格式不同（如 `id` 代替 `uuid`，`taskType` 枚举代替自由字符串）

### 3. agent/ 层职责划分

**方案：** 三个模块各司其职：
- **BriefBuilder**：将 `tasks` 记录组装为 Agent 可消费的 `brief.md` + `job.json`
- **ResultParser**：解析 Agent 回写的结果文件，更新 `tasks`/`assets`/`scripts` 表
- **AgentHandler**：编排流程——触发 AgentTaskPoller → 轮询结果 → 调用 ResultParser

**理由：**
- AgentTaskPoller（framework）已完成通用传输层，不应耦合业务语义
- 分离 Builder/Parser 使 Agent 集成可独立测试

### 4. 月度分片策略

**方案：** `tasks` 和 `assets` 表使用 `shardType: 'monthly'`，`scripts` 使用 `shardType: 'none'`。

**理由：**
- 创作任务和素材具有明显的时间序列特性，月度分片控制单文件大小
- 脚本数量少、更新频繁且需跨月引用，不分片简化版本管理

## Risks / Trade-offs

- **[风险] 视图重写期间功能不可用** → 三个视图依次重写，每次替换一个，保留旧视图作为回退
- **[风险] DataRepository 月度分片查询性能** → 当前 JSON 文件规模和用户量下可忽略，后续如需优化可加索引文件
- **[风险] Agent 集成层与 AgentTaskPoller 接口耦合** → 定义清晰的契约接口（job.json/brief.md 格式），Poller 变更时仅需适配层改动
