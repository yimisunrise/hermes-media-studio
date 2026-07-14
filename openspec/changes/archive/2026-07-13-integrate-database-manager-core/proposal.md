## Why

DatabaseManager（数据库页面）当前使用一套与 SchemaRegistry + DataRepository 不兼容的扁平文件存储格式（`.database/manifest.json`、`.database/<db>/<table>.json`），而工作空间初始化系统（InitPipeline + SchemaRegistry）使用的是层次化存储格式（`.database/db.json`、`.database/<db>/<table>/schema.json + data.json`）。这导致数据库页面看不到初始化时创建的数据库记录——两套数据模型各自独立，互不感知。

根据 architecture-consolidation 架构规划，应激活 core/ 服务层让实际视图接入 SchemaRegistry 和 DataRepository，消除两套存储格式并存状态。

## What Changes

- **DatabaseManager 构造函数注入 `schemaRegistry`** 替换直接文件操作 — **BREAKING**
- 数据库列表功能从读 `.database/manifest.json` 改为调用 `schemaRegistry.listDatabases()`
- 表列表功能从读 `.database/<db>/db.json` 改为调用 `schemaRegistry.listTables(db)`
- 表结构读取改为调用 `schemaRegistry.getTable(db, table)`
- 数据 CRUD（增删改查）从直接读写 `.database/<db>/<table>.json` 改为使用 `DataRepository`
- 数据库/表/记录的创建、编辑、删除操作统一走 SchemaRegistry + DataRepository
- `app.js` 创建 DatabaseManager 实例时传入 `schemaRegistry` 和 `dataRepository`
- 清理废弃的扁平文件存储路径（无其他模块依赖的格式）

## Capabilities

### New Capabilities
- `database-manager-core-integration`: 将 DatabaseManager 视图从直接 WorkspaceAPI 文件操作迁移到使用 SchemaRegistry（元数据管理）和 DataRepository（数据 CRUD），消除两套存储格式并存的问题

### Modified Capabilities
- （无现有 spec 被修改）

## Impact

- `src/views/DatabaseManager.js`：重写全部数据操作方法，构造函数签名从 `{ api, state }` 变为 `{ api, state, schemaRegistry }`
- `src/app.js`：DatabaseManager 实例化时传入 `schemaRegistry`；创建 `DataRepository` 实例供 DatabaseManager 使用
- `src/core/SchemaRegistry.js`：可能需要补充少量缺失的方法（如 `updateDatabase`）
- 工作空间文件清理：初始化后的 `.database/` 目录结构保持不变（已经是 SchemaRegistry 格式）
- 无外部 API 影响，纯前端扩展变更
