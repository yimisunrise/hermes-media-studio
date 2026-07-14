## 1. SchemaRegistry 存储 fieldCount

- [x] 1.1 `createTable()`: `db.json.tables.push` 中加入 `fieldCount: (schema.fields || []).length`
- [x] 1.2 `updateTable()`: 更新 schema 后，同步更新 `db.json` 中对应 table 的 `fieldCount`

## 2. DatabaseManager 渲染 fieldCount

- [x] 2.1 `_renderTableList()`: `t.fields ? t.fields.length : 0` → `t.fieldCount ?? 0`

## 3. 验证

- [x] 3.1 语法检查：`find src -name "*.js" -exec node --check {} \;`
- [x] 3.2 浏览器验证：创建含字段的表，确认列表显示正确字段数
- [x] 3.3 浏览器验证：编辑表增减字段后，列表字段数同步更新
- [x] 3.4 确认存量表（无 `fieldCount`）安全显示 0
