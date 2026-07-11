## ADDED Requirements

### Requirement: Workspace directory auto-initialization
The system SHALL provide an install script that creates the initial Workspace directory structure at `~/workspace/media-studio/`.

#### Scenario: Install creates full directory tree
- **WHEN** the install script runs
- **THEN** it SHALL create directories: `workflows/`, `pipeline/01-generating/`, `pipeline/02-pending-review/`, `pipeline/03-approved/`, `pipeline/04-scheduled/`, `pipeline/05-published/`, `themes/`, `platforms/`, `archive/`, `.media-studio/`
- **AND** it SHALL create a `README.md` with project description

### Requirement: Sidecar metadata file management
The system SHALL manage `.meta.json` sidecar files alongside each asset file for storing metadata.

#### Scenario: Read existing metadata
- **WHEN** the system reads `xxx.png.meta.json`
- **THEN** it SHALL return parsed JSON object with fields: `id`, `filename`, `theme`, `workflow`, `generation`, `status`, `status_history`, `review`, `linked_copy`, `publish_history`, `is_starred`, `created_at`, `updated_at`

#### Scenario: Create metadata for new asset
- **WHEN** a new asset is added to the archive
- **THEN** the system SHALL create a `.meta.json` sidecar with `id` (UUID), `filename`, `status: "generating"`, `created_at`, and empty arrays for `status_history`, `linked_copy`, `publish_history`

### Requirement: Status change via metadata only
The system SHALL change asset status solely by updating the `status` field in `.meta.json`, without moving the physical file.

#### Scenario: Change status updates meta.json
- **WHEN** `changeStatus(assetPath, "approved", "note text")` is called
- **THEN** the system SHALL update `meta.status` to `"approved"`
- **AND** SHALL append entry to `meta.status_history` with `status`, `changed_at` (ISO timestamp), and `note`
- **AND** SHALL update `meta.updated_at`

### Requirement: Pipeline index synchronization
The system SHALL maintain index files in pipeline directories that reference assets by their archive path, using symlinks or text-based index files.

#### Scenario: Status sync creates pipeline reference
- **WHEN** an asset's status changes to `"pending-review"`
- **THEN** the system SHALL create a reference file (or symlink) in `pipeline/02-pending-review/` pointing to the archive asset path

#### Scenario: Status sync removes old pipeline reference
- **WHEN** an asset's status changes from `"pending-review"` to `"approved"`
- **THEN** the system SHALL remove the reference from `pipeline/02-pending-review/`
- **AND** SHALL create a reference in `pipeline/03-approved/`

### Requirement: API endpoint probe on startup
The system SHALL probe available Workspace API endpoints at startup by testing candidate URLs.

#### Scenario: Successful endpoint detection
- **WHEN** the extension initializes
- **THEN** it SHALL test candidate URLs for `tree`, `read`, `write`, `mkdir`, `delete`, `rename`, `upload` operations via HEAD requests
- **AND** SHALL store discovered endpoints for the session

#### Scenario: Endpoint fallback
- **WHEN** a primary candidate URL returns non-2xx/non-405
- **THEN** the system SHALL try the next candidate URL for that operation

### Requirement: Pipeline data aggregation
The system SHALL provide a method to aggregate all assets from pipeline stages into structured data for view rendering.

#### Scenario: Load kanban data with filters
- **WHEN** `loadKanbanData({ theme: "童话仙境" })` is called
- **THEN** the system SHALL scan pipeline stage directories `01-generating` through `04-scheduled`
- **AND** SHALL read `.meta.json` for each asset found
- **AND** SHALL filter results to only assets matching the `"童话仙境"` theme
- **AND** SHALL return grouped data by pipeline stage

### Requirement: Trash recovery mechanism
Deleted assets SHALL be moved to a `.trash/` directory within the workspace before permanent deletion.

#### Scenario: Delete moves to trash
- **WHEN** an asset is deleted
- **THEN** the system SHALL move the asset file and its `.meta.json` to `workspace/.trash/` with a timestamp prefix
- **AND** SHALL NOT permanently delete the files
