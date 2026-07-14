## 1. DatabaseManager 构造函数改造

- [x] 1.1 修改 `DatabaseManager` 构造函数签名：添加 `schemaRegistry` 参数，保存为 `this.schemaRegistry`
- [x] 1.2 修改 `app.js` 的 `_initModules()`：创建 DatabaseManager 时传入 `schemaRegistry: this.schemaRegistry`
- [x] 1.3 修改 `app.js` 的 `_initModules()`：在 `sharedDeps` 或直接传参中包含 `schemaRegistry`

## 2. 数据库列表接入 SchemaRegistry

- [x] 2.1 替换 `_loadDatabases()`：调用 `this.schemaRegistry.listDatabases()` 替代读取 `manifest.json`
- [x] 2.2 替换 `_createDatabase()`：调用 `this.schemaRegistry.createDatabase({ id, label })` 替代直接文件写入
- [x] 2.3 替换 `_deleteDatabase()`：调用 `this.schemaRegistry.deleteDatabase(id)` 替代直接文件删除
- [x] 2.4 确保 `listDatabases()` 返回格式兼容当前 `_renderDatabaseList()` 渲染逻辑

## 3. 表列表接入 SchemaRegistry

- [x] 3.1 替换 `_loadTables(db)`：调用 `this.schemaRegistry.listTables(db)` 替代读取 `db.json`
- [x] 3.2 替换 `_createTable()`：调用 `this.schemaRegistry.createTable(db, { id, label, fields })` 替代直接文件写入
- [x] 3.3 替换 `_deleteTable()`：调用 `this.schemaRegistry.deleteTable(db, id)` 替代直接文件删除
- [x] 3.4 替换 `_getFieldsForTable()`：调用 `this.schemaRegistry.getTable(db, table)` 读取字段定义
- [x] 3.5 验证 `getTable()` 返回的 `fields` 数组格式与当前渲染代码兼容

## 4. 数据 CRUD 接入 DataRepository

- [x] 4.1 替换 `_loadData(db, table, page)`：创建 `DataRepository.for(api, schemaRegistry, db, table)` 实例，调用 `repo.find({ page, limit: this._pageSize })` 替代直接文件读取
- [x] 4.2 替换 `_showCreateRecordForm()`：在表单提交时调用 `repo.create(data)` 替代直接文件写入
- [x] 4.3 替换 `_saveEdit()`：调用 `repo.update(id, updates)` 替代直接文件写入
- [x] 4.4 替换 `_deleteRecord()`：调用 `repo.delete(id)` 替代直接文件删除
- [x] 4.5 调整 `_loadData()` 中字段获取方式：使用 `schemaRegistry.getTable()` 而非从 `db.json` 的 `tables[].fields` 读取
- [x] 4.6 调整 `_renderDataGrid()` 分页逻辑以适配 `DataRepository.find()` 返回的 `{ records, total, page }` 格式
- [x] 4.7 确认 `DataRepository` 默认值填充逻辑（`_applyDefaults`）与当前表单提交兼容

## 5. 验证与清理

- [x] 5.1 验证初始化后 `#database` 页面正确显示 `system` 和 `main` 两个数据库
- [x] 5.2 验证点击数据库后能看到对应的表列表
- [x] 5.3 验证表的创建/编辑/删除功能正常工作
- [x] 5.4 验证记录的创建/编辑/删除功能正常工作
- [x] 5.5 验证数据排序和分页功能正常工作
- [x] 5.6 运行 `find src -name "*.js" -exec node --check {} \;` 确认无语法错误
- [x] 5.7 清理 `DatabaseManager.js` 中不再使用的旧路径常量和辅助方法（`DB_NAMESPACE` 相关直接文件操作代码）
