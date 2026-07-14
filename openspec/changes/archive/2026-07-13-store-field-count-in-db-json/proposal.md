## Why

数据库表列表始终显示"0 字段"，因为 `SchemaRegistry.createTable()` 只将 `{id, label}` 写入 `db.json` 的 `tables` 数组，而 `fields` 仅存在 `schema.json` 中。`listTables()` 读取 `db.json` 无法获得字段数量。

## What Changes

- `SchemaRegistry.createTable()`: 在 `db.json` 的 table entry 中记录 `fieldCount`
- `SchemaRegistry.updateTable()`: 更新 table entry 中的 `fieldCount`
- `DatabaseManager._renderTableList()`: 从 `t.fieldCount` 读取字段数
- 修复 `DatabaseManager._showTableForm()` 编辑时字段行类型下拉框 `selected` 逻辑

## Capabilities

### New Capabilities
- `table-field-count`: 表列表显示准确的字段数量

### Modified Capabilities

<!-- None -->

## Impact

- `src/core/SchemaRegistry.js` — 修改 `createTable` 和 `updateTable` 存储 `fieldCount`
- `src/views/DatabaseManager.js` — 修改 `_renderTableList` 读取 `fieldCount`
