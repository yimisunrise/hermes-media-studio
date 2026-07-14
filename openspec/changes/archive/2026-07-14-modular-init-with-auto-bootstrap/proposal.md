## Why

当前初始化系统将所有初始化步骤的定义集中在 `app.js` 的 `_registerInitSteps()` 中，违反单一职责原则——每个模块自身的初始化知识（SchemaRegistry 知道如何建库、configs 知道如何写默认配置）没有归属到对应模块。同时，初始化需要用户手动点击按钮触发，存在一个专门的 init 页面，让启动流程多了一个人工干预环节。

## What Changes

- **NEW** `core/InitOrchestrator` — 替代现有 InitPipeline，支持模块级 init-def 注册、版本号比对、依赖拓扑排序、自动执行
- **NEW** 每个模块的 `*.init-def.js` — 模块持自己的 init handler + version + 依赖声明
- **NEW** `.system/init/<module>.json` — 模块级初始化标记文件，记录版本号，支持增量更新
- **NEW** 启动 init overlay — 自动初始化时展示简短的进度浮层
- **REMOVE** `app.js` 中的 `_registerInitSteps()`、`_renderInitView()`、`INIT_TREE`、`DIRS_TO_CREATE`
- **REMOVE** `#init` 路由、init 页面及相关 UI 逻辑
- **REMOVE** `_applyMenuFilter()` 菜单过滤逻辑
- **BREAKING** `InitPipeline` 的执行机制改为 `InitOrchestrator`；历史 `boot.json` 中的 `init_state` 字段不再作为唯一判断依据

## Capabilities

### New Capabilities
- `module-init-def`: 模块初始化定义格式标准——每个模块通过 `init-def.js` 声明 name、version、dependsOn、handler，所有模块平级注册，由 orchestrator 统一调度
- `init-orchestrator`: 核心初始化编排器——管理模块注册、版本比对（判断跳过/re-init）、拓扑排序、进度回调、持久化标记
- `init-progress-overlay`: 启动初始化浮层组件——自动初始化时展示进度反馈，无需用户交互

### Modified Capabilities
- `writeboot-persistence`: boot.json 的写入逻辑从单文件全局状态改为模块级 `.system/init/<module>.json` 标记；`boot.json` 简化或移除 `steps` 字段
- `app-bootstrap`: 启动流程从"等待用户点击"改为"自动执行未完成/过期的模块 init"

## Impact

- `src/core/InitPipeline.js` — 保留或替换为 InitOrchestrator（向后兼容或重写）
- `src/core/InitOrchestrator.js` — 新增文件
- `src/core/SchemaRegistry.js` — 移除 `bootstrapSystemDb()` 中的 boot 状态写入，改为模块标记
- `src/app.js` — 大幅简化：移除 `_registerInitSteps`、`_renderInitView`、`INIT_TREE`、`DIRS_TO_CREATE`、`_applyMenuFilter`；init() 流程改为先自动 init 再渲染
- `src/lib/router.js` — 移除 `#init` 路由注册
- `src/lib/sidebar.js` — 移除 init 相关激活逻辑
- `src/core/index.js` — 导出 InitOrchestrator
- 新增 `src/core/InitOrchestrator.init-def.js`、`src/init/workspace.init-def.js` 等模块 init-def 文件
