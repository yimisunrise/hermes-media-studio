## ADDED Requirements

### Requirement: DataRepository SHALL provide CRUD operations for any table
The system SHALL provide a DataRepository class that supports get, find, create, update, delete operations on any registered table.

#### Scenario: Get single record by id
- **WHEN** `repository.get("uuid-123")` is called
- **THEN** it returns the record with matching `id` from the table's data, or `null` if not found

#### Scenario: Find records with filtering
- **WHEN** `repository.find({ filter: { status: "active" }, sort: "createdAt", page: 1, limit: 20 })` is called
- **THEN** it returns `{ records: [...], total: N, page: 1 }` with client-side filtering and sorting applied

#### Scenario: Create a new record
- **WHEN** `repository.create({ title: "New Task", status: "draft" })` is called
- **THEN** a new record is generated with `id` (uuid), `createdAt`, `updatedAt`, written to the appropriate data file, and the created record is returned

#### Scenario: Update an existing record
- **WHEN** `repository.update("uuid-123", { status: "done" })` is called
- **THEN** only the `status` field is updated in the record, `updatedAt` is refreshed, and the updated record is returned

#### Scenario: Delete a record
- **WHEN** `repository.delete("uuid-123")` is called
- **THEN** the record is removed from the data file

### Requirement: DataRepository SHALL support transparent sharding
The system SHALL support single-file and monthly-shard storage modes as defined by `schema.shard.type`.

#### Scenario: Single-file mode writes to data.json
- **WHEN** `repository.create()` is called on a table with `shard.type: "none"`
- **THEN** data is written to `data.json`

#### Scenario: Monthly shard creates monthly files
- **WHEN** `repository.create()` is called on a table with `shard.type: "monthly"` and current month is 2026-07
- **THEN** data is written to `data.json` (current month shard), and when the month rolls over, existing `data.json` is archived to `data-202607.json`

#### Scenario: Cross-shard read merges all shards
- **WHEN** `repository.find()` is called on a sharded table
- **THEN** records from all monthly shard files are merged transparently

### Requirement: DataRepository SHALL auto-populate default values
The system SHALL apply `defaultValue` from schema field definitions when creating records if the field is not provided.

#### Scenario: Default value auto-filled
- **WHEN** `repository.create({ title: "Task" })` is called and the schema defines `status.defaultValue: "draft"`
- **THEN** the created record has `status: "draft"`

### Requirement: DataRepository SHALL handle reference field integrity
The system SHALL resolve reference fields by loading the referenced table's display-field value. Missing referenced records SHALL return null without crashing.

#### Scenario: Reference field resolves display value
- **WHEN** a record has `type: "ref-uuid-456"` referencing `task-types`
- **THEN** the returned record includes a resolved `_type` field with the display value

#### Scenario: Missing reference returns null
- **WHEN** the referenced record does not exist
- **THEN** the reference field is returned as `null` without error

### Requirement: DataRepository SHALL be instantiated per table
The system SHALL provide a `DataRepository.for(api, schemaRegistry, database, tableName)` factory that returns a repository bound to a specific table.

#### Scenario: Factory creates table-bound repository
- **WHEN** `DataRepository.for(api, schemaRegistry, "main", "tasks")` is called
- **THEN** the returned repository operates only on the `main.tasks` table
