## ADDED Requirements

### Requirement: Config directory structure
The system SHALL provide a `configs/` directory under `media-studio/` that centralizes all configuration files, separated from asset data.

#### Scenario: Config directories created on init
- **WHEN** the workspace is initialized (user clicks "初始化")
- **THEN** the system SHALL create the following directories:
  - `configs/themes/`
  - `configs/platforms/`
  - `configs/workflows/`

#### Scenario: Old paths no longer used
- **WHEN** the extension reads theme/platform/workflow data
- **THEN** it SHALL use `configs/themes/`, `configs/platforms/`, `configs/workflows/` paths
- **AND** SHALL NOT use the old `themes/`, `platforms/`, `workflows/` top-level paths

### Requirement: Theme config structure
Each theme SHALL have its own subdirectory under `configs/themes/` named with the user-provided name.

#### Scenario: Create new theme
- **WHEN** user creates a theme named `手机壁纸`
- **THEN** the system SHALL create `configs/themes/手机壁纸/`
- **AND** SHALL write `configs/themes/手机壁纸/theme.json` with the theme metadata
- **AND** SHALL optionally write `configs/themes/手机壁纸/prompt-template.md`

#### Scenario: List themes
- **WHEN** `api.tree('configs/themes')` is called
- **THEN** the system SHALL return theme directories
- **AND** the UI SHALL display theme `displayName` from `theme.json`

### Requirement: Platform config structure
Platform configurations SHALL be stored as JSON files under `configs/platforms/`.

#### Scenario: Platform file path
- **WHEN** reading platform config for "小红书"
- **THEN** the system SHALL read from `configs/platforms/小红书.json`

### Requirement: Workflow config structure
Workflow definitions SHALL be stored as JSON files under `configs/workflows/`.

#### Scenario: Workflow file path
- **WHEN** reading a workflow definition
- **THEN** the system SHALL read from `configs/workflows/{name}.json`
