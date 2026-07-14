## ADDED Requirements

### Requirement: View construction pattern unified

All view classes in `src/views/` SHALL have a constructor accepting a single destructured parameter `{ api, state }`. Views SHALL be instantiated via `new ViewName({ api, state })`.

**Files affected**: KanbanBoard.js, ReviewMode.js, TasksView.js, PublishView.js, CopywritingView.js, CalendarView.js, PlatformConfig.js, MediaArchive.js, GenerationConsole.js, PackageEditor.js, StatsDashboard.js, ThemeStrategy.js, DatabaseManager.js

#### Scenario: KanbanBoard migration

- **WHEN** KanbanBoard.js is in its current form with a different constructor pattern
- **THEN** its constructor SHALL be updated to `constructor({ api, state })`
- **AND** its file SHALL move from `src/modules/` to `src/views/`

#### Scenario: TasksView migration

- **WHEN** TasksView.js has dynamic style injection
- **THEN** the dynamic styles SHALL be extracted to `app.css` as `ms-` classes
- **AND** the view SHALL use `class="ms-classname"` attributes

#### Scenario: All views in views/ directory

- **WHEN** the migration is complete
- **THEN** every view SHALL reside in `src/views/`
- **AND** `src/modules/` SHALL NOT contain any view files

### Requirement: DataRepository integration

Views that perform direct file operations via WorkspaceAPI (readJSON/writeJSON) SHALL be migrated to use DataRepository for CRUD operations where a DataRepository method exists. Direct WorkspaceAPI calls for ad-hoc operations not covered by DataRepository remain permissible.

#### Scenario: MediaArchive uses DataRepository

- **WHEN** MediaArchive reads/writes asset meta files
- **THEN** it SHALL use `DataRepository.queryAssets()` or equivalent instead of direct `api.readJSON()`

#### Scenario: Fallback to WorkspaceAPI

- **WHEN** no DataRepository method covers the required operation
- **THEN** the view MAY use `api.readJSON()` / `api.writeJSON()` directly
- **AND** a note SHALL be added to consider extending DataRepository

### Requirement: Sidebar and router import path updates

`src/modules/sidebar.js` and `src/modules/router.js` (Era 0) SHALL be moved to `src/lib/`. All import paths referencing the old location SHALL be updated.

#### Scenario: Sidebar moved

- **WHEN** sidebar.js is moved from `src/modules/sidebar.js` to `src/lib/sidebar.js`
- **THEN** all `import` references to `./modules/sidebar.js` or `src/modules/sidebar.js` SHALL be updated

#### Scenario: Router moved

- **WHEN** router.js is moved from `src/modules/router.js` to `src/lib/router.js`
- **THEN** all `import` references SHALL be updated
