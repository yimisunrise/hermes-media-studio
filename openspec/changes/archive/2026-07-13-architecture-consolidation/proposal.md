## Why

Hermes Media Studio 在迭代过程中经历了 3 次非破坏性重构（流水线系统 → 任务系统 → core/ 服务层），导致项目中同时存在 4 套架构风格。AI 编码时频繁混淆旧/新模式——使用 Positional Args 调用解构模式的模块，在内联 style 和 app.css 之间用错，引用已废弃的模块路径。这种架构债务正在降低开发效率，每次改动都需要花费额外精力判断"这段代码属于哪个时代"。

## What Changes

### 规范化目标架构（1 个稳定架构替代 4 个）

当前代码分散在 4 个入口：
- **Era 0** (原始): `modules/{api,state,router,sidebar}.js` — `export default` + 位置参数
- **Era 1** (流水线): `modules/{KanbanBoard,ReviewMode}.js` — 解构注入 `{api, state}`，有 `modules/utils/`
- **Era 2** (任务系统): `modules/{TasksView,PublishView,CopywritingView,...}` — config-driven stateMachine，动态 style 注入
- **Era 3** (服务层): `core/` 下 7 个文件 + `views/DatabaseManager.js` — `export class` 命名导出，未与视图集成

**目标结构**：
```
src/
├── core/          # 保留 Era 3 的 SchemaRegistry、InitPipeline
├── views/         # 全部 UI 视图迁移至此处
├── lib/           # api.js, state.js, router.js, sidebar.js（核心基础设施）
├── utils/         # 单一 utils 目录（合并 modules/utils/ 和 src/utils/）
├── app.js         # 入口
└── app.css        # 统一样式
```

### 具体变更

- **统一构造函数签名**：全部视图采用 `constructor({ api, state })` 解构注入。**BREAKING**
- **移除未使用代码**：`src/utils/dom.js`（无人引用）、`NotificationBus`（初始化为 null 未使用）、`core/ProcessEngine.js`（与 stateMachine.js 功能重叠）
- **激活 core/ 服务**：DataRepository 接入实际视图替代 WorkspaceAPI 直接文件操作
- **样式统一**：消除动态 `<style>` 注入和 `element.style.cssText`，全部移至 `app.css`
- **状态机收敛**：移除 `core/ProcessEngine.js`，统一使用 `stateMachine.js`（config-driven）
- **更新 AGENTS.md**：反映目标架构
- **utils 目录合并**：废弃 `modules/utils/`，迁移至 `src/utils/`

## Capabilities

### New Capabilities

- `architecture-target`: 定义稳定的目标架构蓝图，包含目录结构、模块契约、构造函数签名、样式策略和状态机收敛规则。所有后续重构操作以此为基准。
- `view-migration-core`: 将 Era 0/1/2 视图批量迁移到目标架构（构造函数统一、移除动态样式、接入 DataRepository），完成后视图层只有一种模式
- `dead-code-elimination`: 识别并安全移除未使用代码（dom.js、NotificationBus、ProcessEngine），清理无引用的导出和无调用路径
- `documentation-alignment`: 更新 AGENTS.md 以及相关文档，使其准确反映项目当前结构

### Modified Capabilities

- （无现有 spec 被修改）

## Impact

- **全部 22 个 JS 源文件**：每个文件都需要检查/更新 import 路径、构造函数签名、样式引用方式
- **AGENTS.md**：需要重写架构部分
- **core/ 接口**：DataRepository 的 API 可能需要微调以适配实际视图需求
- **无外部 API 影响**：所有变更局限在工作空间文件操作层面
- **无运行时破坏**：每步迁移保持向后兼容，增量提交
