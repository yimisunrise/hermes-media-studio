## Why

当前初始化流程（创建目录 + 写 boot.json）与 ARCHITECTURE.md 设计的完整启动引导流程存在较大差距：

1. **核心框架空转** — `src/core/` 下的 SchemaRegistry、DataRepository 等 6 个模块已实现，但 app.js 的初始化流程完全没有使用它们
2. **无可扩展性** — 新增初始化内容（建表、填充默认数据、初始化业务配置）必须侵入式修改 `_createWorkspaceDirectories()` 和 `_renderInitView()`
3. **boot.json 格式冲突** — 刚完成的 `refactor-init-boot-flow` 写入的格式（`version + init_state + last_boot + directories`）与 SchemaRegistry 期望的格式（`boot_id + init_state: pending/done`）不一致
4. **缺少中间态** — 初始化没有 `booting` 中间标记，中断后无法检测和恢复

需要建立一个可扩展的初始化流水线（InitPipeline），让后续业务模块能自注册初始化步骤，同时将当前初始化对齐架构设计的引导流程。

## What Changes

- **新建** `src/core/InitPipeline.js` — 初始化流水线，支持步骤注册和按序执行
- **扩展** `src/core/SchemaRegistry.js` — boot.json 增加 `steps` 追踪字段
- **新增** 4 个内置初始化步骤：`create-dirs`、`bootstrap-core`、`seed-configs`、`mark-done`
- **改造** `src/app.js` 初始化流程 — 集成 InitPipeline 替代 `_createWorkspaceDirectories()`，接入 SchemaRegistry 进行 boot 管理
- **导出** `src/core/index.js` — 增加 InitPipeline 导出

## Capabilities

### New Capabilities
- `init-pipeline`: 初始化步骤注册、执行、进度追踪、boot.json 步骤状态管理

### Modified Capabilities
- (无修改，全部为新增)

## Impact

- `src/core/InitPipeline.js` — 新建，约 150 行
- `src/core/SchemaRegistry.js` — 扩展 boot.json 写入方法，增加步骤状态字段
- `src/core/index.js` — 增加 InitPipeline 导出
- `src/app.js` — 集成 InitPipeline 和 SchemaRegistry，替换 _createWorkspaceDirectories()
- boot.json 格式统一为 SchemaRegistry 格式 + steps 扩展字段
