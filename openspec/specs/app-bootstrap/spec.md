## ADDED Requirements

### Requirement: Auto-init at startup

The app's `init()` method SHALL create an InitOrchestrator, register all module init-defs, run the orchestrator, then proceed to module initialization and view rendering — without requiring user interaction.

#### Scenario: First-time startup auto-inits

- **WHEN** the app starts on a workspace with no init markers
- **THEN** the orchestrator SHALL execute all registered module handlers
- **AND** the overlay SHALL be visible during execution
- **AND** after completion, the app SHALL navigate to `#kanban`

#### Scenario: Subsequent startup skips init

- **WHEN** the app starts and all module markers match their declared versions
- **THEN** no module handlers SHALL be called
- **AND** the app SHALL navigate directly to `#kanban` without showing the overlay

### Requirement: Menu filter removal

The `_applyMenuFilter()` logic SHALL be removed. All menu groups SHALL be visible regardless of initialization state, since init is automatic and completes before the UI renders.

#### Scenario: All menu items visible at all times

- **WHEN** the app renders the menu panel
- **THEN** ALL menu groups and items SHALL be visible (no `display: none` on any menu element)
