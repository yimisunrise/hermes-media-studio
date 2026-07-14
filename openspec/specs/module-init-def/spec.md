## ADDED Requirements

### Requirement: Module init definition format

Each module SHALL declare its initialization logic through an `init-def.js` file co-located with the module. The init definition SHALL be an exported `initDef` object conforming to the following schema:

- `name` (string, required): Unique module identifier in kebab-case
- `version` (string, required): Semver string for change tracking
- `label` (string, required): Human-readable Chinese label
- `required` (boolean, optional, default: true): If true, init failure blocks app startup
- `dependsOn` (string[], optional): Array of module names this module depends on
- `handler` (async function, required): `async (ctx) => { ... }` where ctx provides `{ api, schemaRegistry, orchestrator, onProgress }`

#### Scenario: Valid init-def exported from module

- **WHEN** a module defines `export const initDef = { name, version, label, handler }` in its `init-def.js`
- **THEN** the orchestrator SHALL accept the definition without throwing

#### Scenario: Missing required fields

- **WHEN** an init-def is missing `name`, `version`, or `handler`
- **THEN** the orchestrator SHALL throw a validation error during registration

### Requirement: Handler context object

The handler SHALL receive a context object with:
- `api`: WorkspaceAPI instance for file operations
- `schemaRegistry`: SchemaRegistry instance for database operations
- `orchestrator`: InitOrchestrator instance (for advanced use cases)
- `onProgress`: Callback function `(msg: string) => void` for overlay progress updates

#### Scenario: Handler receives context

- **WHEN** a module init handler is called
- **THEN** `ctx.api` SHALL be the WorkspaceAPI instance
- **AND** `ctx.onProgress` SHALL be a function
