## 1. 基础设施确认

- [x] 1.1 检查 `SchemaRegistry` 是否有 `updateDatabase()` 方法，如没有则添加（读取 `.database/<db>/db.json` → 更新字段 → 写回）
- [x] 1.2 检查 `SchemaRegistry.createTable()` 是否支持不传 `fields` 创建空表

## 2. 创建/编辑数据库表单

- [x] 2.1 实现 `_showDbForm(existing)` 方法：创建/编辑数据库的自定义弹窗，包含 ID 输入框 + 名称输入框 + 取消/保存按钮
- [x] 2.2 ID 输入框：创建时可编辑，编辑时 `disabled`
- [x] 2.3 表单校验：ID 非空（仅创建时）、名称非空
- [x] 2.4 保存逻辑：创建时调 `schemaRegistry.createDatabase()`，编辑时调 `schemaRegistry.updateDatabase()`
- [x] 2.5 保存成功后关闭弹窗、刷新数据库列表、选中当前数据库

## 3. 数据库列表加编辑按钮

- [x] 3.1 在 `_renderDatabaseList()` 的列表项模板中，删除按钮前增加编辑按钮（`data-action="edit-db" data-db="..."`）
- [x] 3.2 在全局 click 事件监听中增加 `action === 'edit-db'` 分支，调用 `_showDbForm(现有数据库对象)`
- [x] 3.3 `_loadDatabases()` 获取完整对象（含 label）传递给编辑入口

## 4. 创建/编辑表表单（含字段编辑器）

- [x] 4.1 实现 `_showTableForm(db, existing)` 方法：自定义弹窗，包含表 ID + 表名称 + 字段定义编辑器
- [x] 4.2 字段定义编辑器实现：动态行列表，每行包含字段 ID 输入框 + 标签输入框 + 类型下拉框（string/text/integer/float/boolean/datetime/date/enum/reference/array/json）+ 删除按钮
- [x] 4.3 实现"+ 添加字段"按钮：追加新行（默认 type=string）
- [x] 4.4 表 ID 输入框：创建时可编辑，编辑时 `disabled`
- [x] 4.5 表单校验：表 ID 非空、表名称非空
- [x] 4.6 保存逻辑：收集字段编辑器所有行数据（过滤空行），创建时调 `schemaRegistry.createTable()`，编辑时调 `schemaRegistry.updateTable()` + 刷新表列表

## 5. 表列表加编辑按钮

- [x] 5.1 在 `_renderTableList()` 的列表项模板中，删除按钮前增加编辑按钮（`data-action="edit-table" data-db="..." data-table="..."`）
- [x] 5.2 在全局 click 事件监听中增加 `action === 'edit-table'` 分支，调用 `_showTableForm(db, 现有表对象)`
- [x] 5.3 `_loadTables()` 获取完整表 schema（含 fields）传递给编辑入口

## 6. 验证

- [x] 6.1 运行 `find src -name "*.js" -exec node --check {} \;` 确认无语法错误
- [x] 6.2 浏览器验证：创建数据库 → 编辑数据库名称 → 删除数据库
- [x] 6.3 浏览器验证：创建表（含多个字段）→ 编辑表名称和字段 → 删除表
- [x] 6.4 浏览器验证：创建记录、编辑记录、删除记录功能不受影响
