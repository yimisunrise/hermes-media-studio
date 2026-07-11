## ADDED Requirements

### Requirement: Workspace initialization detection
The extension SHALL detect whether the media management directory structure exists in the session workspace.

#### Scenario: Structure exists
- **WHEN** the extension probes the workspace
- **THEN** it SHALL check for the existence of `media-studio/pipeline/01-generating` via `api.tree('pipeline/01-generating')`
- **AND** if the directory exists, SHALL skip initialization and proceed to normal startup

#### Scenario: Structure does not exist
- **WHEN** the directory check returns an error (directory not found)
- **THEN** the extension SHALL enter the initialization flow
- **AND** SHALL show the setup dialog to the user

### Requirement: User-guided setup dialog
The extension SHALL display a setup dialog asking the user to confirm workspace initialization.

#### Scenario: Dialog displays workspace info
- **WHEN** the setup dialog is shown
- **THEN** it SHALL display the detected workspace path
- **AND** SHALL list the directories that will be created:
  - `media-studio/pipeline/01-generating/`
  - `media-studio/pipeline/02-pending-review/`
  - `media-studio/pipeline/03-approved/`
  - `media-studio/pipeline/04-scheduled/`
  - `media-studio/pipeline/05-published/`
  - `media-studio/themes/`
  - `media-studio/platforms/`
  - `media-studio/workflows/`
  - `media-studio/archive/`
  - `media-studio/.trash/`

#### Scenario: User confirms initialization
- **WHEN** the user clicks "Initialize" 
- **THEN** the extension SHALL call `api.mkdir()` for each directory in sequence
- **AND** SHALL show a progress indicator during directory creation
- **AND** SHALL proceed to normal startup on completion

#### Scenario: User declines initialization
- **WHEN** the user clicks "Cancel" or closes the dialog
- **THEN** the extension SHALL show an empty state with a "Retry" button
- **AND** SHALL allow the user to retry initialization later

### Requirement: Initialization error handling
The extension SHALL handle errors during workspace initialization gracefully.

#### Scenario: Directory creation fails
- **WHEN** `api.mkdir()` fails for a directory during initialization
- **THEN** the extension SHALL report the specific failure to the user
- **AND** SHALL offer "Retry" and "Skip" options

#### Scenario: Partial initialization
- **WHEN** some but not all directories are created before a failure
- **THEN** the extension SHALL report which directories were created and which failed
- **AND** the detection logic SHALL recognize partial initialization on next startup
