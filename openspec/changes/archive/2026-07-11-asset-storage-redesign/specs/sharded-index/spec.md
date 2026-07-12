## ADDED Requirements

### Requirement: Layered index structure
The system SHALL maintain indexes in `.index/` with a two-tier structure: a small pipeline state index and monthly historical shards.

#### Scenario: Index directories created on init
- **WHEN** the workspace is initialized
- **THEN** the system SHALL create the `.index/` directory

#### Scenario: Pipeline index
- **WHEN** the pipeline state is queried (kanban board load)
- **THEN** the system SHALL read `.index/pipeline.json`
- **AND** the pipeline JSON SHALL contain an array of active assets with: `{ id, path, theme, status, created_at }`
- **AND** the pipeline index SHALL only contain assets with status `generating`, `pending-review`, `approved`, or `scheduled`

#### Scenario: Historical shards
- **WHEN** a published asset completes its lifecycle
- **THEN** the system SHALL append it to the monthly shard at `.index/{YYYY}/{MM}/assets.json`
- **AND** SHALL remove it from `.index/pipeline.json`
- **AND** the shard SHALL contain full metadata: `{ id, path, theme, workflow, tags, publish_history, created_at }`

### Requirement: Manifest file
The system SHALL maintain `.index/manifest.json` listing all available shards.

#### Scenario: Manifest structure
- **WHEN** any index operation occurs
- **THEN** `.index/manifest.json` SHALL contain: `{ "version": 1, "shards": ["2026/07", "2026/08", ...] }`
- **AND** a new shard SHALL be created when the first asset is published in a new month

### Requirement: Search across shards
The search functionality SHALL query all relevant shards and aggregate results.

#### Scenario: Global search
- **WHEN** user searches for assets across all time
- **THEN** the system SHALL read `.index/manifest.json` to discover shards
- **AND** SHALL query each monthly shard (in parallel for performance)
- **AND** SHALL merge and rank results

#### Scenario: Search within date range
- **WHEN** user searches with a date range filter
- **THEN** the system SHALL only query shards overlapping the date range

### Requirement: Index rebuild
The system SHALL support rebuilding indexes from source data.

#### Scenario: Rebuild pipeline index
- **WHEN** the `.ref` files in pipeline stages are scanned
- **THEN** the system SHALL regenerate `.index/pipeline.json` from scratch

#### Scenario: Rebuild historical shards
- **WHEN** the archive directory is scanned
- **THEN** the system SHALL regenerate all monthly shards under `.index/`

### Requirement: Scalability
The index system SHALL handle growing asset counts without degradation.

#### Scenario: Large asset count
- **WHEN** there are 50,000+ published assets
- **THEN** each monthly shard SHALL contain ~4,000-5,000 entries (at 10/day)
- **AND** `.index/pipeline.json` SHALL remain under 1,000 entries
- **AND** no single query SHALL load more than 12 shards (1 year)
