## ADDED Requirements

### Requirement: Auto-init overlay display

When `InitOrchestrator.run()` executes any module handlers (i.e., at least one module needs initialization), the app SHALL display a centered overlay covering the full viewport, with:
- Title text: "正在初始化工作空间"
- Current step label text (from module's `label` field)
- Animated progress indicator (CSS spinner or pulsing dot)

#### Scenario: Show overlay during first-time init

- **WHEN** the app starts and modules need initialization
- **THEN** an overlay with class `ms-init-overlay` SHALL appear
- **AND** the overlay SHALL contain the text "正在初始化工作空间"

#### Scenario: Update step label during init

- **WHEN** the orchestrator starts executing a module
- **THEN** the overlay SHALL update to show the module's `label`

### Requirement: Overlay auto-dismiss

After all modules are initialized, the overlay SHALL fade out (transition duration 300ms) and be removed from the DOM. The app SHALL then navigate to `#kanban`.

#### Scenario: Overlay hides after completion

- **WHEN** `orchestrator.run()` returns `{ ok: true }`
- **THEN** the overlay SHALL fade out within 300ms
- **THEN** the router SHALL navigate to `#kanban`

#### Scenario: No init needed, no overlay

- **WHEN** all modules are already initialized (all markers match versions)
- **THEN** no overlay SHALL be displayed
- **AND** the app SHALL navigate directly to `#kanban`
