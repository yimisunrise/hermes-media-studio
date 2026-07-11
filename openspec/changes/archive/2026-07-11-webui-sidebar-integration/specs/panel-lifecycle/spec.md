## ADDED Requirements

### Requirement: Panel activation on sidebar click
When the user clicks the Media Studio sidebar button, the extension SHALL become visible and native WebUI panels SHALL be hidden.

#### Scenario: Activate Media Studio
- **WHEN** the user clicks `.ms-rail-btn`
- **THEN** the `#media-studio-app` container SHALL become visible (`display: flex`)
- **THEN** all native panel containers under `main` SHALL be hidden (`display: none`)

#### Scenario: Deactivate on native panel click
- **WHEN** the user clicks any native `.nav-tab[data-panel]` button
- **THEN** `#media-studio-app` SHALL be hidden (`display: none`)
- **THEN** the `.ms-rail-btn` SHALL lose its `active` class

#### Scenario: First-time activation renders initial view
- **WHEN** the sidebar button is clicked for the first time
- **THEN** Media Studio SHALL initialize and render the Kanban view by default

### Requirement: Lifecycle events
The extension SHALL dispatch custom lifecycle events for internal module coordination.

#### Scenario: `ms:activated` event dispatched
- **WHEN** Media Studio is activated via sidebar click
- **THEN** a custom event `ms:activated` SHALL be dispatched on `document`
- **THEN** the Media Studio hash router SHALL resume handling route changes

#### Scenario: `ms:deactivated` event dispatched
- **WHEN** the user navigates to a native WebUI panel
- **THEN** a custom event `ms:deactivated` SHALL be dispatched on `document`
- **THEN** the Media Studio hash router MAY pause or defer re-renders

### Requirement: Hash router integration
The Media Studio hash router SHALL remain active when the extension is visible and defer when hidden.

#### Scenario: Hash change while active
- **WHEN** Media Studio is active and the hash changes to `#kanban`
- **THEN** the Kanban view SHALL render in the view container

#### Scenario: Hash preserved on deactivation
- **WHEN** Media Studio is deactivated and reactivated
- **THEN** the last active hash route SHALL be restored automatically

### Requirement: Backward compatibility with Extension Tab
The extension SHALL continue to work when opened via the WebUI Extension Tab.

#### Scenario: Extension Tab still works
- **WHEN** the user opens Media Studio via the WebUI Extension Tab (non-sidebar path)
- **THEN** the in-app nav toolbar SHALL render and function as before
- **THEN** sidebar button injection SHALL NOT interfere with Tab-based usage
