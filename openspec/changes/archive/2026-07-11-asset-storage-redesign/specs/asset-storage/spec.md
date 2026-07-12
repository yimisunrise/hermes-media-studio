## ADDED Requirements

### Requirement: Centralized asset storage
All generated assets SHALL be stored in `assets/YYYY/MM/DD/` and SHALL NEVER be moved after creation.

#### Scenario: Asset created
- **WHEN** a new asset is generated (via API write or generation console)
- **THEN** the system SHALL save it to `assets/{YYYY}/{MM}/{DD}/{theme-name}__{HHmmss}__{seq}.{ext}`
- **AND** SHALL write a co-located `{filename}.meta.json` sidecar with full metadata
- **AND** SHALL NOT move the file on pipeline status changes

#### Scenario: Asset naming
- **WHEN** an asset filename is generated
- **THEN** it SHALL follow the pattern: `{theme-name}__{HHmmss}__{seq}.{ext}`
- **AND** `theme-name` SHALL match the user's theme directory name
- **AND** `HHmmss` SHALL be the creation time (24-hour format)
- **AND** `seq` SHALL be a zero-padded 3-digit sequence number

### Requirement: Asset never moves
Assets SHALL remain at their original `assets/` path throughout their lifecycle.

#### Scenario: Pipeline transition
- **WHEN** an asset transitions from `generating` to `pending-review`
- **THEN** the system SHALL NOT move the asset file
- **AND** SHALL NOT change the `.meta.json` path field
- **AND** SHALL only update the pipeline ref and index

#### Scenario: Publish to archive
- **WHEN** an asset is published
- **THEN** the system SHALL copy (not move) the asset file to `archive/{theme-name}/{YYYY}/{MM}/`
- **AND** SHALL update `.meta.json` publish_history
- **AND** SHALL keep the original asset in `assets/` unchanged

### Requirement: Sidecar metadata
Each asset SHALL have a co-located `.meta.json` sidecar file with full metadata.

#### Scenario: Metadata written on creation
- **WHEN** an asset is created
- **THEN** the system SHALL write `assets/{...}/{filename}.{ext}.meta.json`
- **AND** the metadata SHALL include: `theme`, `workflow`, `generation.params`, `status`, `created_at`

#### Scenario: Metadata updated
- **WHEN** asset metadata changes (review notes, status, publish history)
- **THEN** the system SHALL update the sidecar `.meta.json` file
- **AND** SHALL record the change in `status_history`
