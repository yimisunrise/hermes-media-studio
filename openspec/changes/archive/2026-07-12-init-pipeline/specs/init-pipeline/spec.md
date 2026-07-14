## ADDED Requirements

### Requirement: InitPipeline supports step registration
The InitPipeline SHALL allow registering initialization steps with a name, label, required flag, and handler function. Registered steps SHALL be executed in registration order when `run()` is called. If `required: true` step fails, the pipeline SHALL stop and return the failed step name. If `required: false` step fails, the pipeline SHALL log the error and continue.

#### Scenario: Register and run steps in order
- **WHEN** 3 steps are registered and `run()` is called
- **THEN** steps execute in registration order, each receiving the context object

#### Scenario: Required step failure stops pipeline
- **WHEN** a `required: true` step throws an error
- **THEN** `run()` returns `{ ok: false, failedStep: "<name>" }` and subsequent steps are skipped

### Requirement: boot.json tracks step status
The SchemaRegistry's boot.json format SHALL be extended with a `steps` field that records each step's status and completion timestamp. `init_state` values SHALL be: `"pending"` (uninitialized), `"booting"` (pipeline running), `"done"` (all steps complete).

#### Scenario: Pipeline updates step status on completion
- **WHEN** a step completes successfully
- **THEN** boot.json.steps[stepName] SHALL contain `{ "status": "done", "completedAt": "<ISO timestamp>" }`

#### Scenario: First step sets init_state to booting
- **WHEN** the first step begins executing
- **THEN** boot.json.init_state SHALL be set to `"booting"`

#### Scenario: All steps done sets init_state to done
- **WHEN** all steps complete successfully
- **THEN** boot.json.init_state SHALL be set to `"done"`

### Requirement: Built-in create-dirs step
The init pipeline SHALL include a built-in `create-dirs` step that creates all directories listed in `DIRS_TO_CREATE`. Directory creation SHALL happen sequentially with a progress callback.

#### Scenario: Creates all configured directories
- **WHEN** `create-dirs` step runs
- **THEN** each directory in `DIRS_TO_CREATE` is created via `api.mkdir()`

### Requirement: Built-in bootstrap-core step
The init pipeline SHALL include a built-in `bootstrap-core` step that initializes the database skeleton. It SHALL call `SchemaRegistry.bootstrapSystemDb()` to create the `.database/system/` library with `database` and `table` tables, create the `.database/main/` business library skeleton, and create the top-level `.database/db.json` registry.

#### Scenario: Bootstraps system database
- **WHEN** `bootstrap-core` step runs
- **THEN** `SchemaRegistry.bootstrapSystemDb()` is called, which creates `.database/system/` with `database/` and `table/` tables

#### Scenario: Creates main database skeleton
- **WHEN** `bootstrap-core` step runs
- **THEN** `.database/main/` directory is created with a `db.json` containing an empty table list

### Requirement: Built-in seed-configs step
The init pipeline SHALL include a built-in `seed-configs` step that ensures default configuration files exist. It SHALL check if `configs/workflows/task-lifecycle.json` exists and create a default if not.

#### Scenario: Creates default task-lifecycle.json when missing
- **WHEN** `seed-configs` step runs and `configs/workflows/task-lifecycle.json` does not exist
- **THEN** a default `task-lifecycle.json` is created with a basic media task type

#### Scenario: Skips when config already exists
- **WHEN** `seed-configs` step runs and `configs/workflows/task-lifecycle.json` already exists
- **THEN** the step does nothing

### Requirement: Built-in mark-done step
The init pipeline SHALL include a built-in `mark-done` step that finalizes initialization by updating `boot.json` with `init_state: "done"`, generating a `boot_id`, and setting `created_at`.

#### Scenario: Finalizes boot.json
- **WHEN** `mark-done` step runs
- **THEN** `boot.json.init_state` is `"done"`, `boot_id` is a valid UUID, and `created_at` is a valid timestamp

### Requirement: Pipeline integrates into app.js init flow
The app.js `init()` method SHALL instantiate `SchemaRegistry` and `InitPipeline` during startup. The `_createWorkspaceDirectories()` method SHALL be replaced by `pipeline.run()`. The init button in `_renderInitView()` SHALL trigger `pipeline.run()` instead of `_createWorkspaceDirectories()`.

#### Scenario: Init button triggers pipeline
- **WHEN** user clicks "初始化工作空间" button
- **THEN** `pipeline.run()` is called with a progress callback that updates the UI

#### Scenario: Pipeline success navigates to kanban
- **WHEN** `pipeline.run()` returns `{ ok: true }`
- **THEN** `_workspaceReady` is set to `true` and user is navigated to `#kanban`

#### Scenario: Pipeline failure shows error
- **WHEN** `pipeline.run()` returns `{ ok: false, failedStep }`
- **THEN** UI shows an error message indicating which step failed
