## ADDED Requirements

### Requirement: AGENTS.md reflects target architecture

The project's `AGENTS.md` file SHALL be updated to accurately describe the target architecture (`src/lib/`, `src/core/`, `src/views/`, `src/utils/` split). It SHALL NOT describe obsolete directory structures or patterns.

**Current problem**: AGENTS.md describes the Era 1 architecture (modules/ based, `export default`, positional args) but does not include the Era 3 `core/` service layer or `views/` directory.

#### Scenario: Architecture section updated

- **WHEN** AGENTS.md is updated
- **THEN** the architecture diagram SHALL show `lib/`, `core/`, `views/`, `utils/` directories
- **AND** constructor pattern descriptions SHALL show `constructor({ api, state })`
- **AND** all deprecated file paths SHALL be replaced with target paths

#### Scenario: Era references removed

- **WHEN** AGENTS.md contains descriptions of old patterns (Era 0/1)
- **THEN** they SHALL be replaced with the canonical target pattern
- **AND** a "Migration in Progress" section MAY be added listing legacy locations

#### Scenario: Script commands verified

- **WHEN** AGENTS.md shell commands are updated
- **THEN** `node --check` paths in commands SHALL reference new file locations

### Requirement: Module JSDoc comments reference correct paths

All JS files SHALL have correct import/require paths in their JSDoc comments and module-level documentation.

#### Scenario: File-level doc updated

- **WHEN** a file is moved from `modules/` to `views/` or `lib/`
- **THEN** the file's top comment or JSDoc SHALL reference its new path
- **AND** any `@module` or `@file` tags SHALL be updated

### Requirement: Core index.js export list updated

`src/core/index.js` SHALL be the single source of truth for all core service exports. When a core file is removed or renamed, the index SHALL be updated.

#### Scenario: ProcessEngine removed from index

- **WHEN** ProcessEngine.js is deleted
- **THEN** `core/index.js` SHALL remove the ProcessEngine re-export
- **AND** any `@module` doc referencing ProcessEngine SHALL be removed

#### Scenario: NotificationBus removed from index

- **WHEN** NotificationBus.js is deleted
- **THEN** `core/index.js` SHALL remove the NotificationBus re-export
