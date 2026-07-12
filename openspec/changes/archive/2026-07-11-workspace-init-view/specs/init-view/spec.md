## ADDED Requirements

### Requirement: Init menu item
The system SHALL display a "初始化" menu item in the "定制化" menu group that navigates to the init view.

#### Scenario: Menu visible at all times
- **WHEN** the extension loads and renders the menu panel
- **THEN** the "定制化" group SHALL contain a "初始化" menu item
- **AND** clicking it SHALL navigate to the `#init` view

#### Scenario: Menu persists after initialization
- **WHEN** workspace initialization is complete
- **THEN** the "初始化" menu item SHALL remain visible and clickable
- **AND** navigating to `#init` SHALL show the initialization completion status

### Requirement: Init view layout
The init view SHALL display as a full-page view within the standard view container (`#media-studio-view-container`), replacing the current modal overlay approach.

#### Scenario: Init view content structure
- **WHEN** the init view is rendered
- **THEN** the top section SHALL display a title and tutorial description explaining what workspace initialization does
- **AND** SHALL list the directories that will be created under `media-studio/`
- **AND** the middle-bottom section SHALL display a prominent "初始化" button
- **AND** SHALL display the detected workspace path

#### Scenario: Init view directory list
- **WHEN** the init view is shown
- **THEN** it SHALL display the following directories to be created:
  - `pipeline/01-generating/`
  - `pipeline/02-pending-review/`
  - `pipeline/03-approved/`
  - `pipeline/04-scheduled/`
  - `pipeline/05-published/`
  - `themes/`
  - `platforms/`
  - `workflows/`
  - `archive/`
  - `.trash/`

### Requirement: Auto-redirect to init view
The extension SHALL automatically navigate to the init view when the workspace is not initialized.

#### Scenario: Extension loads without initialized workspace
- **WHEN** the extension finishes API probe and detects workspace is not initialized via `checkInitialized()`
- **THEN** the extension SHALL auto-redirect to `#init`
- **AND** SHALL NOT redirect to the default view (`#kanban`)

#### Scenario: Extension loads with initialized workspace
- **WHEN** `checkInitialized()` returns `true`
- **THEN** the extension SHALL proceed to normal startup with the default view

### Requirement: One-click initialization
The init view SHALL support one-click directory structure creation.

#### Scenario: User clicks "初始化"
- **WHEN** the user clicks the "初始化" button in the init view
- **THEN** the extension SHALL call `api.mkdir()` for each directory in sequence
- **AND** SHALL disable the button and show a progress indicator during creation
- **AND** SHALL auto-navigate to `#kanban` on successful completion
- **AND** SHALL set `_workspaceReady = true`

#### Scenario: Directory creation fails
- **WHEN** one or more directory creations fail
- **THEN** the extension SHALL show an error message listing the failed directories
- **AND** SHALL enable the button again with "重试" label

### Requirement: Warning banner for uninitialized state
The extension SHALL display a persistent warning banner when the user navigates to other views without initializing.

#### Scenario: Navigate away without initialization
- **WHEN** the current view is NOT `init` and `_workspaceReady` is `false`
- **THEN** a warning banner SHALL appear at the top of the view area
- **AND** the banner SHALL contain text: "工作空间尚未初始化，部分功能不可用"
- **AND** the banner SHALL have a dismiss button or auto-dismiss with a visual cue

#### Scenario: Banner disappears after initialization
- **WHEN** workspace initialization completes successfully
- **THEN** the warning banner SHALL be removed
- **AND** SHALL NOT reappear unless the workspace becomes uninitialized again

### Requirement: Init view after initialization
The init view SHALL reflect the initialization state when revisited.

#### Scenario: Navigate to init after initialization
- **WHEN** the user clicks "初始化" menu item after workspace is already initialized
- **THEN** the init view SHALL display a "已完成" status message
- **AND** SHALL show the workspace path and directory structure (for reference)
- **AND** SHALL NOT show the "初始化" button
