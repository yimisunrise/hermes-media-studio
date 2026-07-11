## ADDED Requirements

### Requirement: Mobile sidebar button injection
The extension SHALL inject a Media Studio entry into the mobile sidebar (`div.sidebar-nav`) that mirrors the desktop rail behavior.

#### Scenario: Inject button in mobile sidebar
- **WHEN** the extension script loads and DOM is ready
- **THEN** a link/button with `🎬 Media Studio` SHALL be inserted into `.sidebar-nav` before its last child

#### Scenario: Mobile activation behavior
- **WHEN** the user taps the mobile Media Studio button
- **THEN** the Media Studio container SHALL become visible
- **THEN** the mobile sidebar SHALL close (same as native panel behavior)

### Requirement: Desktop/mobile sync
The desktop and mobile sidebar entries SHALL share the same activation state.

#### Scenario: State synced across viewports
- **WHEN** Media Studio is activated on desktop (`.rail` button clicked) and the viewport is resized to mobile
- **THEN** the mobile sidebar entry SHALL reflect the active state when opened
- **WHEN** Media Studio is deactivated
- **THEN** both desktop and mobile buttons SHALL show inactive state

### Requirement: Responsive visibility
The desktop and mobile buttons SHALL respect WebUI's responsive layout.

#### Scenario: Desktop button hidden on mobile
- **WHEN** the viewport width is below WebUI's mobile breakpoint
- **THEN** the `.ms-rail-btn` in `.rail` MAY be hidden via CSS if `.rail` itself is hidden

#### Scenario: Mobile button hidden on desktop
- **WHEN** the viewport width is above WebUI's mobile breakpoint
- **THEN** the `.sidebar-nav` entry SHALL be hidden when the sidebar is closed (WebUI default behavior)
