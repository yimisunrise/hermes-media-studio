## ADDED Requirements

### Requirement: DatabaseManager SHALL use SchemaRegistry for database metadata

DatabaseManager SHALL use `SchemaRegistry.listDatabases()` to retrieve the list of databases, instead of reading `.database/manifest.json` directly. Database creation and deletion SHALL use `SchemaRegistry.createDatabase()` and `SchemaRegistry.deleteDatabase()`.

#### Scenario: Database list comes from SchemaRegistry

- **WHEN** DatabaseManager loads the database list
- **THEN** it SHALL call `this.schemaRegistry.listDatabases()`
- **AND** the returned array of `{ id, label, createdAt }` SHALL be rendered in the left panel

#### Scenario: System database is visible after initialization

- **WHEN** workspace initialization completes (InitPipeline runs bootstrap-core)
- **THEN** navigating to `#database` SHALL show both `system` and `main` databases

#### Scenario: Creating a database uses SchemaRegistry

- **WHEN** user creates a new database via the UI
- **THEN** DatabaseManager SHALL call `this.schemaRegistry.createDatabase({ id, label })`
- **AND** the new database SHALL appear in both `.database/db.json` and `system.database` table

#### Scenario: Deleting a database uses SchemaRegistry

- **WHEN** user deletes a database (non-system) via the UI
- **THEN** DatabaseManager SHALL call `this.schemaRegistry.deleteDatabase(id)`
- **AND** the database SHALL be removed from the registry

### Requirement: DatabaseManager SHALL use SchemaRegistry for table metadata

DatabaseManager SHALL use `SchemaRegistry.listTables(db)` to retrieve tables and `SchemaRegistry.getTable(db, id)` for table schema details. Table creation and deletion SHALL use SchemaRegistry methods.

#### Scenario: Table list from SchemaRegistry

- **WHEN** DatabaseManager loads tables for a selected database
- **THEN** it SHALL call `this.schemaRegistry.listTables(db)`
- **AND** the returned array of `{ id, label }` SHALL be rendered in the middle panel

#### Scenario: Table schema from SchemaRegistry

- **WHEN** DatabaseManager needs field definitions for a table
- **THEN** it SHALL call `this.schemaRegistry.getTable(db, table)`
- **AND** use the returned `fields` array for data grid columns and form generation

#### Scenario: Creating a table uses SchemaRegistry

- **WHEN** user creates a new table via the UI
- **THEN** DatabaseManager SHALL call `this.schemaRegistry.createTable(db, { id, label, fields })`
- **AND** the table schema SHALL be written to `.database/<db>/<table>/schema.json`

#### Scenario: Table deletion uses SchemaRegistry

- **WHEN** user deletes a table via the UI
- **THEN** DatabaseManager SHALL call `this.schemaRegistry.deleteTable(db, id)`
- **AND** the table data and schema SHALL be removed

### Requirement: DatabaseManager SHALL use DataRepository for record CRUD

DatabaseManager SHALL use `DataRepository.find()`, `create()`, `update()`, and `delete()` for all data record operations, instead of direct file reads/writes to `.database/<db>/<table>.json`.

#### Scenario: Read records with pagination

- **WHEN** DatabaseManager loads data for a table
- **THEN** it SHALL create a `DataRepository` instance bound to that database and table
- **AND** call `repository.find({ page, limit: pageSize })`
- **AND** use the returned `{ records, total, page }` for grid rendering and pagination

#### Scenario: Create record via DataRepository

- **WHEN** user creates a new record via the UI form
- **THEN** DatabaseManager SHALL call `repository.create(data)`
- **AND** the record SHALL be written to `.database/<db>/<table>/data.json`
- **AND** the data grid SHALL refresh

#### Scenario: Update record via DataRepository

- **WHEN** user saves an inline-edit on a record
- **THEN** DatabaseManager SHALL call `repository.update(id, updates)`
- **AND** only the specified fields SHALL be modified in the stored record
- **AND** `updatedAt` SHALL be refreshed

#### Scenario: Delete record via DataRepository

- **WHEN** user confirms deletion of a record
- **THEN** DatabaseManager SHALL call `repository.delete(id)`
- **AND** the record SHALL be removed from the data file

### Requirement: DatabaseManager SHALL receive schemaRegistry via constructor injection

DatabaseManager constructor SHALL accept `schemaRegistry` in its destructured parameter alongside `api` and `state`. The `app.js` instantiation SHALL pass the existing `schemaRegistry` instance.

#### Scenario: Constructor signature updated

- **WHEN** DatabaseManager is instantiated
- **THEN** its constructor SHALL accept `{ api, state, schemaRegistry }`
- **AND** `this.schemaRegistry` SHALL be set from the parameter

#### Scenario: app.js passes schemaRegistry

- **WHEN** `app.js` creates the DatabaseManager instance in `_initModules()`
- **THEN** it SHALL pass `schemaRegistry: this.schemaRegistry` in the constructor parameter
