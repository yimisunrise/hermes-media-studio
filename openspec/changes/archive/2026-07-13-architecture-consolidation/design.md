## Context

Hermes Media Studio 当前有 22 个 JS 源文件分布在 4 个入口目录（modules/、core/、views/、utils/），分别对应 4 个架构时代：

| 时代 | 模式 | 文件 |
|------|------|------|
| Era 0 | `export default` + 位置参数 `(api, state)` | api.js, state.js, router.js, sidebar.js |
| Era 1 | 解构注入 `{api, state}` + `modules/utils/` | KanbanBoard.js, ReviewMode.js |
| Era 2 | config-driven 状态机 + 动态 style 注入 | TasksView.js, PublishView.js, CopywritingView.js, CalendarView.js, PlatformConfig.js, MediaArchive.js, GenerationConsole.js, PackageEditor.js, StatsDashboard.js, ThemeStrategy.js |
| Era 3 | `export class` 命名导出 + service 层 | SchemaRegistry.js, DataRepository.js, InitPipeline.js, ProcessEngine.js, FileScanner.js, AgentTaskPoller.js, NotificationBus.js, DatabaseManager.js |

**约束条件**：
- 无构建步骤、无 npm 依赖、无框架（纯前端注入扩展）
- 所有变更必须向前兼容（同一次 deploy 中不能出现中间损坏状态）
- 以"触及即迁移"（touch-to-migrate）为原则，不做一次性全量重构
- OpenSpec 管理变更流程

## Goals / Non-Goals

**Goals:**
- 定义稳定的目标架构和目录结构，消除模式选择歧义
- 统一全部视图的构造函数签名为 `constructor({ api, state })`
- 收敛两套状态机（移除 ProcessEngine，统一使用 stateMachine.js）
- 合并两个 utils 目录（废弃 modules/utils/，迁移至 src/utils/）
- 清除未使用代码（dom.js、NotificationBus、ProcessEngine）
- 将 core/ 服务层（DataRepository、SchemaRegistry）接入实际视图
- 更新 AGENTS.md 反映真实架构
- 统一样式策略：全部样式放在 app.css，消除动态 `<style>` 注入和 `element.style.cssText`

**Non-Goals:**
- 不增加新功能
- 不改动工作空间文件目录结构
- 不重写 API 客户端（WorkspaceAPI）
- 不改动配置驱动的状态机引擎核心逻辑
- 不改动 media-studio 工作空间的物理约定

## Decisions

### 1. 以 core/ + views/ + lib/ + utils/ 作为目标结构

**选择理由**：
- `core/` 已存在且包含有价值的服务抽象（SchemaRegistry、InitPipeline、DataRepository）
- `views/` 目录已存在（DatabaseManager.js）
- `lib/` 存放基础基础设施（api.js、state.js、router.js、sidebar.js），与 UI 视图解耦
- `utils/` 单一目录避免重复
- 迁移路径自然：按文件所属逻辑类型确定目标目录

**备选方案**：
- 保留 `modules/` 不变——维护了现状但永久保留了 Era 0/1/2 混合模式的困惑
- 改为 `services/` + `components/` + `hooks/`——过于抽象，对纯 JS 无框架项目不适用

### 2. 增量迁移（touch-to-migrate）而非一次性全量重构

**选择理由**：
- 22 个文件涉及 4 套模式，一次性迁移风险高
- 每次处理某个文件的功能请求时顺势迁移，逐步收敛
- 每步改动小，易于 review 和回滚

**备选方案**：
- 一次性全量重写——开发周期长、review 困难、高风险
- 分批但按目录处理——无法按功能需求优先级驱动

### 3. 移除 ProcessEngine，统一使用 stateMachine.js

**选择理由**：
- `stateMachine.js`（config-driven）是 Era 2 引入的正式状态机实现
- `ProcessEngine`（在 Era 3 的 core/ 中）功能重叠，且未在任何视图中使用
- 两个状态机共存使 AI 无法确定该用哪个

### 4. DataRepository 逐步接入视图

**选择理由**：
- DataRepository 提供了 SchemaRegistry 验证、自动索引更新等能力
- 当前视图直接使用 WorkspaceAPI 进行文件操作，缺乏一致的数据层
- 但 DataRepository 的接口需要微调以匹配实际视图需求

### 5. 样式统一策略：全部入 app.css

**选择理由**：
- 3 种样式策略共存导致维护混乱
- `app.css` 已有 `ms-` 命名空间隔离，改造成本低
- 动态 style 注入增加了渲染不确定性且不可被 CSS 预处理器覆盖

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| **增量迁移周期过长**：touch-to-migrate 可能导致架构不纯状态持续数月 | 设立"架构可迁移"检查点：每次 PR 必须包含对应文件的迁移 |
| **core/ 服务接口不匹配**：DataRepository 接口与实际视图需求有 gap | 先在小范围视图（如 MediaArchive）试用再推广 |
| **路径更新遗漏**：import/require 路径随文件移动需要同步更新 | LSP diagnostics + node --check 验证每次迁移后无断链 |
| **样式回归**：动态 style 移除后视觉效果与之前不一致 | 屏幕截图对比验证 |
| **AI 继续使用旧模式**：即使迁移后，AI 可能仍然按旧习惯写模式不匹配的代码 | AGENTS.md 更新 + OpenSpec 工作流约束 |
