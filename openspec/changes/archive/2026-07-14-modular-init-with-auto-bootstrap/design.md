## Context

当前 Hermes Media Studio 的初始化逻辑集中在 `src/app.js`：

1. `MediaStudioApp._registerInitSteps()` 注册 4 个步骤（create-dirs、bootstrap-core、seed-configs、mark-done）
2. `DIRS_TO_CREATE` 和 `INIT_TREE` 常量定义在 app.js 顶层
3. `_renderInitView()` 渲染完整的初始化页面，等待用户点击按钮
4. `_applyMenuFilter()` 在未初始化时隐藏几乎所有菜单项
5. 全局 boot.json 管理所有初始化状态

问题：模块的初始化知识（建目录、建库、写配置）散落在 app.js，没有归属到模块自身；且强制用户交互，无法实现纯自动启动。

本设计将初始化系统从"中央集权 + 手动触发"重构为"模块自治 + 自动编排 + 版本驱动"。

## Goals / Non-Goals

**Goals:**
- 每个模块通过 `init-def.js` 声明自己的初始化逻辑、版本号、依赖关系
- `InitOrchestrator` 统一管理模块注册、版本比对、拓扑排序、自动执行
- 启动时自动运行未初始化或版本过期的模块，展示轻量 overlay 进度
- 移除 `#init` 路由、init 页面、菜单过滤逻辑
- 模块级初始化标记持久化到 `.system/init/<module>.json`，支持增量更新

**Non-Goals:**
- 不改变 SchemaRegistry、DataRepository 等模块的内部行为
- 不重写 WorkspaceAPI（`src/lib/api.js`）
- 不涉及测试套件（项目无测试基础设施）
- 不改变业务模块（KanbanBoard、ReviewMode 等）的渲染逻辑

## Decisions

### 1. InitOrchestrator 替代 InitPipeline

**现状：** `InitPipeline` 是一个步骤注册 + 顺序执行器，步骤和 handler 耦合在 app.js。

**决策：** 新建 `InitOrchestrator` 作为核心编排器，替换 InitPipeline。InitPipeline 现有的 `registerStep` / `run` / `isComplete` API 由 Orchestrator 重新实现。

```js
class InitOrchestrator {
  constructor({ api, schemaRegistry }) { ... }

  register(moduleDef)     // 注册模块 init-def
  async run(opts)         // 自动执行所有待办/过期模块
  getPending()            // 返回待初始化的模块列表
  isComplete()            // 检查是否所有模块都已初始化
}
```

**备选方案：** 在 InitPipeline 基础上增量修改。否决理由：InitPipeline 的 `run()` 设计为全量执行所有步骤，不适合"跳过已完成的模块"的场景，改动量接近重写。

### 2. 模块级标记文件代替全局 boot.json

**现状：** `markBootComplete()` 写入 `.system/boot.json` 的 `init_state: 'done'`，只有一个全局开关。

**决策：** 每个模块独立标记到 `.system/init/<module-name>.json`：

```json
// .system/init/schema-registry.json
{
  "name": "schema-registry",
  "version": "1.0.0",
  "completedAt": "2026-07-14T10:30:00.000Z"
}
```

模块更新时修改 `version` 字段，orchestrator 自动触发 re-init。`.system/boot.json` 保留但简化为仅记录整体启动信息（如启动时间、版本），不再作为初始化状态依据。

### 3. 模块 init-def 格式

每个需要初始化的模块在自身目录下创建 `*.init-def.js`：

```js
// core/SchemaRegistry.init-def.js
export const initDef = {
  name: 'schema-registry',
  version: '1.0.0',
  label: '初始化核心数据库',
  required: true,
  dependsOn: ['workspace'],          // 依赖的模块名
  handler: async (ctx) => {
    // ctx = { api, schemaRegistry, orchestrator, onProgress }
    await ctx.schemaRegistry.bootstrapSystemDb();
  }
}
```

`dependsOn` 用于 orchestrator 拓扑排序，确保执行顺序。

### 4. 启动 overlay 替代 init 页面

**现状：** 完整的 `_renderInitView()` 渲染欢迎页 + 目录树 + 按钮。

**决策：** 使用轻量 DOM overlay，在 app 初始化流程中自动展示：

```css
.ms-init-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: var(--bg, #1a1a2e);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
```

overlay 内容：标题 + 当前步骤文本 + 进度指示器。所有模块初始化完成后自动淡出消失，进入 kanban 视图。

### 5. 模块拆分

当前 4 个 init 步骤拆分为以下模块 init-def：

| 模块 init-def | 来源 | 职责 |
|---|---|---|
| `src/init/workspace.init-def.js` | `create-dirs` | 创建工作空间目录结构 |
| `src/core/SchemaRegistry.init-def.js` | `bootstrap-core` | 初始化系统库 + main 库 |
| `src/init/configs.init-def.js` | `seed-configs` | 写入默认配置文件 |
| `src/core/InitOrchestrator.init-def.js` | - | 框架自身初始化 (创建 .system/init/ 目录) |

注意：`mark-done` 不再需要——因为 orchestrator 在模块执行完就写模块标记，不再需要全局完成标记。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|---|---|
| 模块标记文件损坏导致反复初始化 | handler 需幂等；orchestrator 捕获异常后标记 failed 而不是重试 |
| 依赖循环导致死锁 | register 时检测循环依赖（DFS 检测环），抛出明确错误 |
| 大量模块导致启动变慢 | init-def 只在版本变化时执行；首次初始化有 overlay 指示进度 |
| 移除 init 页面后用户不知道发生了什么 | overlay 展示"正在初始化工作空间"和当前步骤名 |
| 历史 workspace 已有 boot.json 但无模块标记 | orchestrator 检测到无模块标记且 boot.json 的 init_state=done 时，将所有模块标记为已完成（适配迁移） |

## Open Questions

- ~~`SchemaRegistry.bootstrapSystemDb()` 中 `writeBoot({ init_state: 'booting' })` 的逻辑如何处理？~~ 此逻辑属于 InitPipeline.run() 内部，改为由 orchestrator 管理
- 迁移方案：已初始化的 workspace 升级后如何兼容？是否在迁移代码中标记所有模块为已完成？
