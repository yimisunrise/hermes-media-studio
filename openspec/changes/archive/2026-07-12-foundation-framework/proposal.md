## Why

Hermes Media Studio 目前没有统一的数据层——每个视图模块直接调用 WorkspaceAPI 操作文件系统，各自构造路径、手写 CRUD、散落大量 try/catch。随着业务增长，这种 ad-hoc 模式导致代码重复、无声失败、耦合严重。

现在需要搭建**统一的数据管理框架**：通过 SchemaRegistry + DataRepository 提供通用 CRUD，通过 ProcessEngine 抽象状态流转，通过 FileScanner / AgentTaskPoller 处理外部的文件和 Agent 通信。所有核心模块注入 NotificationBus 统一错误处理。

原有视图代码功能暂不修改，仅新增 `src/core/` 目录下的框架核心模块。

## What Changes

- 新增 `src/core/` 目录，包含 6 个框架核心模块
- 新增 `.system/boot.json` 引导层 + `.database/` 目录结构
- 修改 `src/app.js`：集成核心模块的启动引导流程
- 修改 `src/app.css`：增加 ms- 命名空间样式（NotificationBus toast）
- 新增 `src/scripts/migrate-v2.sh`：一键迁移脚本（创建 `.system/` + `.database/` 骨架）
- 新增 `src/utils/dom.js`：DOM 工具函数（多个视图共用的 createElement 等）

## Capabilities

### New Capabilities

- `notification-bus`: Toast 通知系统，统一替代 alert / console.error
- `schema-registry`: 库和表结构的元数据管理（CRUD database & table）
- `data-repository`: 通用数据 CRUD（get / find / create / update / delete），透明分片
- `process-engine`: 配置驱动的状态机引擎（加载流程定义、校验转换、触发钩子）
- `file-scanner`: 文件附件扫描器（incoming/ → .files/ 迁移、去重、入库）
- `agent-task-poller`: Hermes-Agent 任务通信（扩展侧 collect 已完成结果）
- `database-manager`: 数据库管理器视图，可视化浏览/管理数据库和表数据

### Modified Capabilities

<!-- 无现有 specs 需要修改 -->

## Impact

- 新增文件：`src/core/` 下 6 个模块 + `src/utils/dom.js` + `src/scripts/migrate-v2.sh`
- 修改文件：`src/app.js`（引导流程） + `src/app.css`（toast 样式）
- 工作空间新增目录：`media-studio/.system/` + `media-studio/.database/`
- 与现有视图代码无冲突——模块挂在 `window.HermesFramework` 命名空间下，视图按需调用
- 新增 `src/views/DatabaseManager.js`：数据库管理器可视化界面
- 修改 `src/app.js`：注册 DatabaseManager 视图（ICONS + MENU_GROUPS + 路由）
- 修改 `src/modules/router.js`：新增 `database` 到 VIEWS 白名单
- 不修改现有 `src/modules/` 下的其他视图代码
