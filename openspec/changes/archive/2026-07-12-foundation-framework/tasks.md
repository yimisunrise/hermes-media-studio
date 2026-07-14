## 1. Foundation Setup

- [x] 1.1 Create `src/core/` directory with module scaffold
- [x] 1.2 Add `src/utils/dom.js` with createElement, debounce, throttle, empty utilities
- [x] 1.3 Create `src/scripts/migrate-v2.sh` for workspace migration (creates `.system/` + `.database/` skeleton)
- [x] 1.4 Add CSS toast styles to `src/app.css` under `ms-` namespace

## 2. NotificationBus

- [x] 2.1 Implement `NotificationBus` class with success/error/warning/info methods
- [x] 2.2 Implement DOM toast rendering with auto-dismiss timer
- [x] 2.3 Implement `on(type, fn)` event subscription with off() return
- [x] 2.4 Verify: lsp_diagnostics clean, manual toast test

## 3. SchemaRegistry + Boot

- [x] 3.1 Define hardcoded `TABLE_SCHEMA` constant with table self-description fields
- [x] 3.2 Implement `.system/boot.json` read/write with init_state state machine
- [x] 3.3 Implement `SchemaRegistry.listDatabases()` reading `.database/db.json`
- [x] 3.4 Implement `SchemaRegistry.createDatabase()` with directory creation + db.json update + system.database record
- [x] 3.5 Implement `SchemaRegistry.deleteDatabase()` with recursive directory delete + cleanup
- [x] 3.6 Implement `SchemaRegistry.listTables(database)` reading `.database/<db>/db.json`
- [x] 3.7 Implement `SchemaRegistry.getTable(database, id)` with schema.json read + cache
- [x] 3.8 Implement `SchemaRegistry.createTable()` with schema.json + data.json creation + db.json update + system.table record
- [x] 3.9 Implement `SchemaRegistry.updateTable()` and `deleteTable()`
- [x] 3.10 Verify: lsp_diagnostics clean

## 4. DataRepository

- [x] 4.1 Implement `DataRepository.for(api, schemaRegistry, database, tableName)` factory
- [x] 4.2 Implement `repository.get(id)` with single-record lookup
- [x] 4.3 Implement `repository.find({ filter, sort, page, limit })` with client-side filtering/sorting/pagination
- [x] 4.4 Implement `repository.create(data)` with id generation, defaults, autoSet fields
- [x] 4.5 Implement `repository.update(id, patch)` with partial update and updatedAt refresh
- [x] 4.6 Implement `repository.delete(id)`
- [x] 4.7 Implement transparent shard detection: single-file vs monthly shard mode
- [x] 4.8 Implement shard merge: cross-shard reads return unified record list
- [x] 4.9 Implement `repository.count(filter)` 
- [x] 4.10 Verify: lsp_diagnostics clean

## 5. ProcessEngine

- [x] 5.1 Implement `ProcessEngine.loadProcess(definition)` with state/transition validation
- [x] 5.2 Implement `ProcessEngine.getNextStates(currentState)` returning valid transitions
- [x] 5.3 Implement `ProcessEngine.transition(record, fromState, toState, context)` with validation
- [x] 5.4 Implement lifecycle hooks: onEnter, onLeave, onTransition
- [x] 5.5 Verify: lsp_diagnostics clean

## 6. FileScanner

- [x] 6.1 Implement `FileScanner` constructor with { api, db, notificationBus }
- [x] 6.2 Implement recursive scan of `incoming/` directory (arbitrary depth)
- [x] 6.3 Implement dedup check via `system.files` lookup by (file_size, original_name)
- [x] 6.4 Implement UUID rename + 2-step move to `.files/YYYY/MM/`
- [x] 6.5 Implement sidecar `.meta.json` write with original metadata
- [x] 6.6 Implement `system.files` table record creation
- [x] 6.7 Implement empty directory cleanup after scan
- [x] 6.8 Implement `.files/manifest.json` update
- [x] 6.9 Return { processed, skipped, errors } summary
- [x] 6.10 Verify: lsp_diagnostics clean

## 7. AgentTaskPoller

- [x] 7.1 Implement `scan()` — list `.agent/tasks/` directories, parse job.json
- [x] 7.2 Implement `pickup(uuid)` — mv tasks/{uuid} → processing/{uuid}
- [x] 7.3 Implement `deliver(uuid, result, files)` — write result.json + files, cleanup processing/
- [x] 7.4 Implement `collect()` — scan `.agent/results/`, read results, return list
- [x] 7.5 Verify: lsp_diagnostics clean

## 8. app.js Integration

- [x] 8.1 Add boot sequence: NotificationBus → .system/boot.json → SchemaRegistry → DataRepository → ProcessEngine → FileScanner → AgentTaskPoller
- [x] 8.2 Implement FIRST_BOOT path: create `.system/` + `.database/` skeleton
- [x] 8.3 Implement NORMAL_BOOT path: load schemas, check init_state
- [x] 8.4 Mount core modules on `window.HermesFramework` namespace
- [x] 8.5 Wire up FileScanner scan() on startup
- [x] 8.6 Wire up AgentTaskPoller collect() on startup and refresh
- [x] 8.7 Add FileScanner manual trigger button to UI
- [x] 8.8 Verify: node --check on all new JS files, lsp_diagnostics clean

## 9. Migration & Smoke Test

- [x] 9.1 Run `migrate-v2.sh` to bootstrap workspace directories
- [x] 9.2 Verify `.system/boot.json` created with correct init_state
- [x] 9.3 Start app, verify boot sequence completes without error
- [x] 9.4 Manual smoke: create database + table via SchemaRegistry, CRUD records
- [x] 9.5 Manual smoke: drop file into incoming/, run FileScanner scan(), verify result
- [x] 9.6 Manual smoke: simulate Agent task delivery, verify collect() picks it up

## 10. DatabaseManager View

- [x] 10.1 Implement `DatabaseManager` class with constructor({ api, schemaRegistry, dataRepository, notificationBus })
- [x] 10.2 Implement database list mode: display all databases from SchemaRegistry, create/delete actions
- [x] 10.3 Implement table list mode: display tables within selected database, create/delete schema
- [x] 10.4 Implement data browser mode: display table data as sortable grid with pagination
- [x] 10.5 Implement create-record modal: form fields auto-generated from schema field list
- [x] 10.6 Implement edit-record inline: single-row editing with save/cancel
- [x] 10.7 Implement delete-record with confirmation dialog
- [x] 10.8 Add `ICONS.database` SVG to app.js
- [x] 10.9 Add "数据库管理" menu group with `#database` hash to MENU_GROUPS in app.js
- [x] 10.10 Add `database` to VIEWS array in router.js
- [x] 10.11 Register DatabaseManager in app.js _initModules(): import → construct → router.register
- [x] 10.12 Verify: node --check, lsp_diagnostics clean, manual UI smoke test
