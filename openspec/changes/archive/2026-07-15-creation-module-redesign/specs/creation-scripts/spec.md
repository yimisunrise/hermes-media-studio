## ADDED Requirements

### Requirement: Scripts are versioned

The system SHALL maintain multiple versions of a script associated with a task.
Each version SHALL increment the `version` integer field automatically.
Default starting version SHALL be 1.

#### Scenario: First script version created
- **WHEN** a copywriting task produces its first script version
- **THEN** a script record is created with version 1, status "draft", and the content

#### Scenario: Updated script version
- **WHEN** user edits and saves a script that already has version 1
- **THEN** a new script record is created with version 2, status "draft"

### Requirement: Script status lifecycle

Scripts SHALL have status: draft → finalized.
Finalized scripts SHALL NOT be editable.

#### Scenario: Finalize a script
- **WHEN** user clicks "定稿" on a draft script
- **THEN** the script status is set to "finalized"

#### Scenario: Cannot edit finalized script
- **WHEN** user attempts to modify a finalized script
- **THEN** the edit is rejected and an error is returned

### Requirement: Scripts are NOT sharded

Scripts SHALL use `shardType: 'none'` — all records in a single file.
This simplifies cross-version queries and version increment logic.

#### Scenario: All scripts in single store
- **WHEN** scripts are created across multiple months
- **THEN** all records reside in the same `.database/business/scripts/` file
