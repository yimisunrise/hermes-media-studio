## ADDED Requirements

### Requirement: SchemaRegistry SHALL manage databases
The system SHALL provide a SchemaRegistry class that can list, create, and delete databases. Database metadata SHALL be stored in `.database/db.json` and replicated to `system.database` table records.

#### Scenario: List databases returns registered databases
- **WHEN** `schemaRegistry.listDatabases()` is called
- **THEN** it returns an array of `{ id, label, createdAt }` objects from `.database/db.json`

#### Scenario: Create a new database
- **WHEN** `schemaRegistry.createDatabase({ id: "main", label: "主库" })` is called
- **THEN** a `.database/main/` directory is created with `db.json` and the database is registered in both `.database/db.json` and `system.database` table

#### Scenario: Delete a database
- **WHEN** `schemaRegistry.deleteDatabase("main")` is called
- **THEN** `.database/main/` directory is removed and the database entry is removed from `.database/db.json` and `system.database` table

### Requirement: SchemaRegistry SHALL manage tables
The system SHALL allow creating, updating, and deleting table schemas within a database. Each table SHALL have a `schema.json` file in its directory.

#### Scenario: Create a table with schema
- **WHEN** `schemaRegistry.createTable("main", { id: "tasks", label: "任务", fields: [...] })` is called
- **THEN** `.database/main/tasks/schema.json` is created, `data.json` is initialized, and `db.json` is updated

#### Scenario: List tables in a database
- **WHEN** `schemaRegistry.listTables("main")` is called
- **THEN** it returns the list of table IDs from `.database/main/db.json`

#### Scenario: Get table schema with caching
- **WHEN** `schemaRegistry.getTable("main", "tasks")` is called
- **THEN** it reads and caches `.database/main/tasks/schema.json`, returning the parsed schema object

### Requirement: SchemaRegistry SHALL use hardcoded TABLE_SCHEMA as bootstrap anchor
The system SHALL define a hardcoded `TABLE_SCHEMA` constant that describes the `table` table itself, breaking the circular dependency during boot.

#### Scenario: TABLE_SCHEMA is loadable before any file read
- **WHEN** SchemaRegistry initializes
- **THEN** `TABLE_SCHEMA` is available in memory without reading any file
