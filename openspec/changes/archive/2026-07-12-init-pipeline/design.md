## Context

当前 `app.js` 的初始化流程独立于 `src/core/` 框架之外运行：

```
app.js 初始化 → 创建 DIRS_TO_CREATE 目录 → 写简陋 boot.json → 完成
                  ↑ 完全不使用 SchemaRegistry / DataRepository 等
```

而 `src/core/` 已经实现了 ARCHITECTURE.md 设计的全部核心模块：
- `SchemaRegistry` — 已具备 `readBoot()`、`writeBoot()`、`isFirstBoot()`、`markBootComplete()`、`bootstrapSystemDb()`
- `DataRepository`、`ProcessEngine`、`FileScanner`、`AgentTaskPoller` — 全部实现但未实例化

核心矛盾：框架模块已就绪，但 app.js 的初始化与它们之间有断层。

同时，刚完成的 `refactor-init-boot-flow` 写入的 boot.json 格式（`version + init_state + last_boot + directories`）与 SchemaRegistry 期望的格式（`boot_id + init_state: pending → done`）不一致，需要统一。

## Goals / Non-Goals

**Goals:**
- 创建 `InitPipeline` 类，支持步骤注册和按序执行
- 扩展 SchemaRegistry 的 boot.json 格式，增加 `steps` 步骤状态追踪
- 实现 4 个内置初始化步骤：`create-dirs`、`bootstrap-core`、`seed-configs`、`mark-done`
- 集成 InitPipeline 到 app.js 初始化流程，替换 `_createWorkspaceDirectories()`
- 统一 boot.json 格式为 SchemaRegistry 格式 + steps 扩展
- 从 `src/core/index.js` 导出 InitPipeline

**Non-Goals:**
- 不实现 ARCHITECTURE.md Section VII 的完整 8 步引导（如 ProcessEngine/FileScanner 初始化留在后续）
- 不修改 SchemaRegistry/DataRepository 等现有核心模块的业务逻辑
- 不处理旧的 `.system/boot.json` 自动迁移（重新初始化即可）
- 不做 init 状态恢复/断点续作（`init_state: booting` 检测但不自动恢复）

## Decisions

| 决策 | 方案 | 理由 |
|------|------|------|
| Pipeline 位置 | `src/core/InitPipeline.js` | 作为核心框架的一部分，与 SchemaRegistry 同级 |
| boot.json 状态管理 | 委托 SchemaRegistry 现有的 readBoot/writeBoot | 避免重复实现，核心框架已有完整方法 |
| boot.json 格式 | 扩展 SchemaRegistry 格式 + `steps` 字段 | 保持架构一致性，向前兼容 SchemaRegistry 现有代码 |
| 步骤接口 | `{ name, label, required, handler(ctx) }` | 最小够用，handler 抛异常即失败 |
| 步骤粒度 | 粗粒度 4 步 | 当前需求足够，未来可拆分 |
| 进度追踪 | `onProgress(name, status, message)` 回调 | app.js 传入 UI 更新函数 |
| 框架集成 | InitPipeline 构造时接收 SchemaRegistry 引用 | 通过依赖注入避免耦合 |
| 旧格式兼容 | SchemaRegistry.readBoot() 的 try/catch 已做兜底 | 无需额外逻辑 |

## Risks / Trade-offs

- **Boot 格式变更** — `refactor-init-boot-flow` 刚创建的 boot.json 格式与 SchemaRegistry 预期不同
  → SchemaRegistry.readBoot() 的 try/catch + BOOT_DEFAULTS 兜底使其视为 pending，触发重新初始化
- **Step 失败导致半初始化状态** — 例如 create-dirs 成功但 bootstrap-core 失败
  → init_state 保持 booting，但当前不实现自动恢复，用户重试重新跑全部
- **SchemaRegistry.bootstrapSystemDb() 依赖于 `api.exists()`** — 需要确认 WorkspaceAPI 是否有此方法
  → 检查 api.js 后若不存在则需要先用 try/catch readJSON 代替
