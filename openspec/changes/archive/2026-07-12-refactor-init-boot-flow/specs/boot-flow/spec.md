## ADDED Requirements

### Requirement: Boot marker written to `.system/boot.json`
After a successful initialization, the system SHALL write a boot marker to `.system/boot.json` with fields: `version`, `init_state` (`"complete"`), `last_boot` (ISO timestamp), and `directories` (array of created dirs).

#### Scenario: Successful init writes boot.json
- **WHEN** user clicks "初始化工作空间" and all directories are created
- **THEN** the system writes `.system/boot.json` with `init_state: "complete"` and a valid `last_boot` timestamp

### Requirement: Menu hidden when not initialized
When the workspace is not initialized (`checkInitialized()` returns `false`), the system SHALL hide all menu groups except the `system` group's `init` item. Only the "初始化" page SHALL be accessible.

#### Scenario: Uninitialized workspace shows only init menu
- **WHEN** workspace is not initialized and the panel is rendered
- **THEN** only the "初始化" menu item is visible in the sidebar

#### Scenario: Uninitialized redirects non-init routes
- **WHEN** user navigates to a non-init route (e.g., `#kanban`) while workspace is not initialized
- **THEN** the system redirects to `#init`

### Requirement: Boot marker detection
`checkInitialized()` SHALL detect `.system/boot.json` instead of `.index/init.json` to determine if the workspace is initialized.

#### Scenario: boot.json exists returns true
- **WHEN** `.system/boot.json` exists and is readable
- **THEN** `checkInitialized()` returns `true`

#### Scenario: boot.json missing returns false
- **WHEN** `.system/boot.json` does not exist or is unreadable
- **THEN** `checkInitialized()` returns `false`
