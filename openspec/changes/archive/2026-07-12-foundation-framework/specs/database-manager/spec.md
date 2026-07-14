# DatabaseManager Spec

## Purpose

Provide a visual UI for managing databases and tables in the framework — list/create/delete databases, list/create/delete/update table schemas, and browse/edit/delete table data — without requiring AutoRenderer.

## Dependencies

- SchemaRegistry (list/create/delete databases and tables)
- DataRepository (CRUD table data)
- NotificationBus (operation feedback)
- WorkspaceAPI (file operations for SchemaRegistry)

## View Structure (3-column cascading layout)

```
┌──────────────────────────────────────────────────────────────┐
│  Header: 数据库管理                                          │
├──────────┬──────────────┬───────────────────────────────────┤
│ 左栏     │ 中栏         │ 右栏                              │
│ 库列表    │ 表列表       │ 数据网格                          │
│          │              │                                   │
│ ○ system │ ○ tasks      │ id │ title    │ status │ actions  │
│ ● main   │ ○ assets     │ 1  │ "发布.." │ draft  │ [✏️][🗑️] │
│ ○ blog   │ ○ files      │ 2  │ "产品.." │ review │ [✏️][🗑️] │
│          │              │                                   │
│ [+ 新建库]│ [+ 新建表]   │ [+ 新建记录]   │ ⟨1/3⟩          │
├──────────┴──────────────┴───────────────────────────────────┤
│  Status bar: 当前路径 main / tasks  ·  共 12 条记录          │
└──────────────────────────────────────────────────────────────┘
```

## Hash Routing

| Hash | Mode | Description |
|------|------|-------------|
| `#database` | Database List | Show all databases |
| `#database/{db}` | Table List | Show tables in database `{db}` |
| `#database/{db}/{table}` | Data Browser | Show data records in `{db}.{table}` |

## Modes

### Mode 1: Database List (left column only, full width)

**Actions:**
- Click database → switch to table list mode (`#database/{db}`)
- `[+ 新建库]` button → opens inline form (name + label fields)
- Delete icon on hover → confirmation → SchemaRegistry.deleteDatabase()

**Edge cases:**
- Empty state: "还没有数据库，点击 [+ 新建库] 创建第一个"
- Delete system db: blocked with warning "系统库不可删除"
- Creating with invalid name: validation error via NotificationBus

### Mode 2: Table List (left + middle columns)

Left column shows databases (active one highlighted), middle column shows tables.

**Left column (database list) reduced:**
- Databases listed vertically, current one highlighted
- Click to switch database

**Middle column (table list):**
- Tables listed with icon + label
- Click → data browser mode (`#database/{db}/{table}`)
- `[+ 新建表]` button → modal with schema editor (ID + label + fields JSON)
- Delete icon → confirmation → SchemaRegistry.deleteTable()

**Edge cases:**
- Empty table list: "还没有表，点击 [+ 新建表] 创建第一个"
- Deleting last table in db: warning "删除所有表后数据库为空"
- Creating with duplicate table id: SchemaRegistry error → NotificationBus.error()

### Mode 3: Data Browser (all 3 columns)

Right column shows data grid for selected table.

**Data grid features:**
- `[+ 新建记录]` button → modal form with fields from schema
- Click row → inline edit mode (row becomes editable)
- Delete icon → confirmation dialog → DataRepository.delete()
- Pagination: "⟨ 上一页  1/3  下一页 ⟩"
- Sort: click column header to toggle asc/desc
- Auto-refresh after create/update/delete

**Field → Form control mapping (hardcoded):**

| Field Type | Form Control | Grid Display |
|-----------|-------------|-------------|
| uuid | Hidden, auto-generated | Plain text |
| string | `<input type="text">` | Plain text |
| text | `<textarea>` | Truncated + expand |
| integer | `<input type="number" step="1">` | Right-aligned |
| float | `<input type="number" step="any">` | Right-aligned |
| boolean | `<input type="checkbox">` | ✓ / ✗ |
| datetime | `<input type="datetime-local">` | Formatted date |
| date | `<input type="date">` | Formatted date |
| enum | `<select>` with options | Colored badge |
| reference | `<select>`, loads referenced table data | displayField value |
| array | Comma-separated input | Tag list |
| json | `<textarea>` with validation | Formatted preview |

**Edge cases:**
- Empty table: "还没有数据，点击 [+ 新建记录] 添加第一条"
- Reference field with no data: dropdown shows "无可用数据"
- Required field validation: field highlighted red, tooltip "此项必填"
- JSON parse error on save: NotificationBus.error with parse details
- Delete last record: grid shows empty state, pagination resets

## API

```javascript
class DatabaseManager {
  constructor({ api, schemaRegistry, dataRepository, notificationBus })

  render(container, params)
  //  ├── params.mode = 'database' | 'table' | 'data'
  //  ├── params.db (optional): selected database
  //  ├── params.table (optional): selected table
  //  ├── Clears container, renders 3-column layout
  //  └── Invokes sub-render for current mode

  // Internal
  _renderDatabaseList(container)
  _renderTableList(container, db)
  _renderDataGrid(container, db, table, page, sort)
  _showCreateForm(type, db, table)    // type: 'database' | 'table' | 'record'
  _showEditForm(db, table, record)
}
```

## Registering in app.js

```javascript
// 1. ICONS.database = '<svg>...' SVG string
// 2. MENU_GROUPS: add item { hash: 'database', label: '数据库', icon: ICONS.database }
// 3. VIEWS in router.js: add 'database'
// 4. Import + construct + register in app.js _initModules():
//    import { DatabaseManager } from './views/DatabaseManager.js';
//    this.modules.database = new DatabaseManager({
//      api: this.api,
//      schemaRegistry: this.schemaRegistry,
//      dataRepository: this.dataRepository,
//      notificationBus: this.notificationBus
//    });
//    this.router.register('database', renderInContainer('database'));
```

## CSS

Add to `src/app.css` under `ms-` namespace:

- `.ms-db-manager` — main container, grid layout 3 columns
- `.ms-db-panel` — each column panel
- `.ms-db-panel-header` — panel title
- `.ms-db-panel-list` — scrollable list
- `.ms-db-item` — database/table item row
- `.ms-db-item.active` — selected item highlight
- `.ms-db-data-grid` — table wrapper
- `.ms-db-data-row` — data row
- `.ms-db-data-cell` — data cell
- `.ms-db-form-overlay` — modal overlay for create/edit forms
- `.ms-db-form` — form container inside overlay
- `.ms-db-form-field` — labeled field row
- `.ms-db-pagination` — pagination bar
