## Context

DatabaseManager 当前通过 WorkspaceAPI 直接文件操作实现全部数据管理功能，使用了与 SchemaRegistry 不兼容的扁平存储格式：

```
DatabaseManager 当前使用的路径:       SchemaRegistry 实际存储的路径:
.database/manifest.json              .database/db.json
.database/<db>/<table>.json          .database/<db>/<table>/data.json
                                     .database/<db>/<table>/schema.json
```

初始化流程（`bootstrap-core` step）调用 SchemaRegistry 创建系统数据库和主库后，DatabaseManager 读取 `manifest.json` 失败（文件不存在），显示空白。同时，DatabaseManager 自己的创建操作写的也是扁平格式，与 SchemaRegistry 的操作路径完全分离。

目标是将 DatabaseManager 接入 core/ 服务层，让 SchemaRegistry 负责库/表元数据管理，DataRepository 负责数据 CRUD。

## Goals / Non-Goals

**Goals:**
- DatabaseManager 的数据库/表列表从 SchemaRegistry 读取
- DatabaseManager 的数据 CRUD 从 DataRepository 读取
- 初始化后数据库页面能看到 system 和 main 两个数据库及其表
- 数据库页面的创建/编辑/删除操作同步到 SchemaRegistry + DataRepository
- 兼容现有工作空间文件布局（已初始化用户无感知）

**Non-Goals:**
- 不修改 SchemaRegistry 和 DataRepository 的核心接口
- 不改动工作空间目录结构约定
- 不增加新 UI 功能（仅修复数据源）
- 不改动 DatabaseManager 的 UI 渲染逻辑（模板、表单、网格等）

## Decisions

### 1. DatabaseManager 构造函数注入 schemaRegistry + dataRepository

**选择理由**：架构规划明确要求视图接入 core/ 服务。`schemaRegistry` 已在 app.js 中实例化，可直接传入。`dataRepository` 按需在 DatabaseManager 内部创建（`DataRepository.for(api, schemaRegistry, db, table)`）。

**替代方案**：
- 在 app.js 中预先创建所有可能的 DataRepository 实例——不需要，按需创建更简单
- 保持 `{ api, state }` 签名，通过全局对象访问——违反了依赖注入的明确性原则

### 2. 数据库列表：用 schemaRegistry.listDatabases() 替换 manifest.json 读取

当前 `_loadDatabases()` 读 `.database/manifest.json`，改为调用 `this.schemaRegistry.listDatabases()`，返回格式相同（`{ id, label, createdAt }`），UI 渲染代码无需变化。

### 3. 表列表：用 schemaRegistry.listTables(db) 替换 db.json 读取

当前 `_loadTables(db)` 读 `.database/<db>/db.json`，改为调用 `this.schemaRegistry.listTables(db)`。SchemaRegistry 的 `listTables` 返回 `[{ id, label }]`，与当前 UI 期望格式兼容。

### 4. 数据 CRUD：用 DataRepository 替换直接文件操作

当前 `_loadData(db, table)` 读 `.database/<db>/<table>.json`，改为：
- 创建 `DataRepository.for(this.api, this.schemaRegistry, db, table)`
- 调用 `repo.find({ page, limit })` 获取分页数据
- 调用 `repo.create(data)`、`repo.update(id, updates)`、`repo.delete(id)` 替换当前的文件直接读写

字段定义从 `schemaRegistry.getTable(db, table)` 的返回值的 `fields` 数组获取。

### 5. 创建数据库/表：用 schemaRegistry 替代直接文件写

当前 `_createDatabase()` 和 `_createTable()` 直接创建文件和更新 manifest，改为调用：
- `schemaRegistry.createDatabase({ id, label })`
- `schemaRegistry.createTable(db, { id, label, fields })`

这确保了元数据一致性（同时更新 `.database/db.json` 和 `system.*` 表）。

### 6. 删除操作：用 schemaRegistry 替代

- `schemaRegistry.deleteDatabase(id)` 替代当前文件删除
- `schemaRegistry.deleteTable(db, id)` 替代当前文件删除

### 7. app.js 接线调整

```javascript
// app.js _initModules() 中
this.modules.database = new DatabaseManager({
  api: this.api,
  state: this.state,
  schemaRegistry: this.schemaRegistry
});
```

DatabaseManager 内部按需创建 DataRepository 实例。
无需修改其他视图。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| **SchemaRegistry 缺少某些方法**：当前 `deleteDatabase` 拒绝删除 system 库，DatabaseManager 需要这个能力 | 已有 `deleteDatabase` 方法；UI 层面阻止删除 system 库即可 |
| **DataRepository 分页接口差异**：`repo.find()` 返回 `{ records, total, page }`，当前 UI 的 `_loadData` 处理逻辑需微调 | 接口基本兼容（都有的 records 数组 + 总条数），适配成本低 |
| **已有用户工作空间的扁平格式数据丢失**：用户可能通过 UI 创建了数据 | 检测旧路径文件存在时先行迁移到新路径，或同时支持两种读路径 |
| **字段定义获取路径变化**：当前从 `db.json` 的 `tables[].fields` 获取，改为从 `schema.json` 读取 | `schemaRegistry.getTable()` 返回的对象包含 `fields`，格式一致 |

## Migration Plan

1. 修改 `DatabaseManager` 构造函数，接收 `schemaRegistry`
2. 替换 `_loadDatabases()` → `schemaRegistry.listDatabases()`
3. 替换 `_loadTables()` → `schemaRegistry.listTables(db)`
4. 替换数据读取 `_loadData()` → `DataRepository.find()`
5. 替换创建/编辑/删除记录 → `DataRepository.create/update/delete`
6. 替换创建/删除数据库/表 → `SchemaRegistry.createDatabase/deleteDatabase/createTable/deleteTable`
7. 修改 `app.js` 接线
8. 验证：初始化后 `#database` 能正确显示 system 和 main 库及其表
