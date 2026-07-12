## ADDED Requirements

### Requirement: Pipeline ref files
Pipeline stages SHALL contain `.ref` JSON files that reference assets in `assets/`, instead of physically storing the assets themselves.

#### Scenario: Ref file structure
- **WHEN** an asset enters a pipeline stage
- **THEN** the system SHALL create a `.ref` file in the corresponding pipeline stage directory
- **AND** the `.ref` file SHALL contain: `{"asset": "assets/{YYYY}/{MM}/{DD}/{filename}.{ext}"}`
- **AND** the `.ref` filename SHALL match the asset filename (replacing extension with `.ref`)

#### Scenario: Pipeline directories
- **WHEN** the workspace is initialized
- **THEN** the following pipeline directories SHALL be created under `pipeline/`:
  - `pipeline/01-generating/`
  - `pipeline/02-pending-review/`
  - `pipeline/03-approved/`
  - `pipeline/04-scheduled/`
  - `pipeline/05-published/`

#### Scenario: Stage transition
- **WHEN** an asset transitions from stage A to stage B
- **THEN** the system SHALL add a `.ref` file in `pipeline/{stage-B}/`
- **AND** SHALL remove the `.ref` file from `pipeline/{stage-A}/`
- **AND** SHALL NOT move or modify the asset file in `assets/`

#### Scenario: Same asset in multiple stages
- **WHEN** a pipeline query asks for assets in a stage
- **THEN** the system SHALL read `.ref` files from that stage's directory
- **AND** SHALL resolve each ref to the actual asset path
- **AND** SHALL load the corresponding `.meta.json` sidecar for display data

### Requirement: Scheduled stage packages
The `pipeline/04-scheduled/` stage SHALL contain `.ref` files referencing the scheduled publish packages.

#### Scenario: Scheduled package ref
- **WHEN** a publish package is scheduled
- **THEN** the system SHALL write a `.ref` file in `pipeline/04-scheduled/`
- **AND** the ref SHALL point to the publish package in `archive/` or the assets list

### Requirement: Published stage completion
When an asset reaches `pipeline/05-published/`, it SHALL be considered complete and ready for archival.

#### Scenario: Published ref
- **WHEN** an asset is marked published
- **THEN** a `.ref` SHALL exist in `pipeline/05-published/`
- **AND** the asset SHALL be copied to `archive/` for long-term storage
