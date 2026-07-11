## ADDED Requirements

### Requirement: Remove automatic hash routing on page load
The system SHALL NOT automatically set `#kanban` hash when Media Studio initializes. Navigation to kanban SHALL only occur when the user explicitly activates Media Studio via the sidebar button.

#### Scenario: Page load without hash
- **WHEN** a user opens Hermes WebUI at `http://localhost:8787/` without a hash
- **THEN** the URL SHALL NOT change to `#kanban`
- **AND** the Media Studio view SHALL NOT be displayed

#### Scenario: Page load with existing hash
- **WHEN** a user opens Hermes WebUI at `http://localhost:8787/#review`
- **THEN** the hash SHALL remain `#review`
- **AND** the corresponding view SHALL be handled normally

#### Scenario: Activate Media Studio via sidebar
- **WHEN** a user clicks the Media Studio button in the sidebar
- **THEN** the URL SHALL navigate to `#kanban`
- **AND** the kanban view SHALL be displayed

### Requirement: Sidebar button icon-only display
The Media Studio sidebar button in the `.rail` SHALL display only the icon `🎬` without accompanying text label. The full label SHALL remain accessible via the `title` attribute on hover.

#### Scenario: Button renders without text
- **WHEN** the Media Studio extension loads and injects into `.rail`
- **THEN** the injected button SHALL contain only `🎬` icon
- **AND** SHALL NOT contain visible text "Media Studio"

#### Scenario: Tooltip shows full label
- **WHEN** a user hovers over the Media Studio sidebar icon
- **THEN** the tooltip SHALL display "Media Studio — 自媒体内容生产流水线"

### Requirement: Sidebar button positioned above settings
The Media Studio sidebar button SHALL be positioned after the existing upper navigation items and before the Control Center (settings) button.

#### Scenario: Button order in rail
- **WHEN** the Media Studio extension injects into `.rail`
- **THEN** the Media Studio button SHALL appear above the Control Center button
- **AND** the button SHALL appear after existing navigation tabs
