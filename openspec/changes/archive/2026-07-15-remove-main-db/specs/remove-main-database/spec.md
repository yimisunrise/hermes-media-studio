## ADDED Requirements

### Requirement: Remove main database creation from initialization

The system SHALL NOT create a `main` database during initialization.

#### Scenario: Main database is no longer created
- **WHEN** the SchemaRegistry initialization handler runs
- **THEN** it SHALL NOT create `.database/main/` directory or register a `main` database in `databases.json`
- **AND** the initialization SHALL complete successfully, creating only `.database/system/` and `databases.json` without any `main` entry
