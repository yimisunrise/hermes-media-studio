## ADDED Requirements

### Requirement: Module registration

The InitOrchestrator SHALL provide a `register(moduleDef)` method to accept module init definitions. Duplicate module names SHALL throw an error.

#### Scenario: Register single module

- **WHEN** `orchestrator.register(moduleDef)` is called with a valid initDef
- **THEN** the module SHALL be recorded in the orchestrator's registry

#### Scenario: Duplicate module name

- **WHEN** `orchestrator.register(moduleDef)` is called twice with the same `name`
- **THEN** the second call SHALL throw an error

### Requirement: Version-based skip logic

The orchestrator SHALL compare each module's declared version against its persisted marker in `.system/init/<name>.json`:
- If marker exists AND version matches → skip (mark as completed)
- If marker missing or version differs → execute handler
- After successful execution → write marker file

#### Scenario: Already initialized, version matches

- **WHEN** `orchestrator.run()` encounters a module whose `.system/init/<name>.json` has `version: "1.0.0"` and the module declares `version: "1.0.0"`
- **THEN** the handler SHALL NOT be called

#### Scenario: Version mismatch triggers re-init

- **WHEN** `orchestrator.run()` encounters a module whose marker has `version: "1.0.0"` but declares `version: "1.1.0"`
- **THEN** the handler SHALL be called

#### Scenario: No marker file triggers init

- **WHEN** `orchestrator.run()` encounters a module with no `.system/init/<name>.json` file
- **THEN** the handler SHALL be called

### Requirement: Dependency ordering

The orchestrator SHALL execute modules in topological order based on `dependsOn` declarations. Modules with no dependencies run first.

#### Scenario: Module with dependsOn runs after dependency

- **WHEN** module B declares `dependsOn: ['A']` and is registered after A
- **THEN** module A SHALL execute before module B

#### Scenario: Circular dependency detection

- **WHEN** module A depends on B and B depends on A
- **THEN** `orchestrator.run()` SHALL throw a circular dependency error before any execution

### Requirement: Module marker persistence

After successful execution, the orchestrator SHALL write a JSON marker to `.system/init/<name>.json` containing `{ name, version, completedAt }`.

#### Scenario: Write marker after init

- **WHEN** a module handler completes without error
- **THEN** the orchestrator SHALL write a marker file at `.system/init/<name>.json` with the module's name, version, and completion timestamp

### Requirement: Init failure handling

If a required module's handler throws, the orchestrator SHALL stop execution, write a failure marker, and return the error. If a non-required module fails, it SHALL be skipped and execution continues.

#### Scenario: Required module failure stops pipeline

- **WHEN** a module with `required: true` handler throws
- **THEN** the orchestrator SHALL NOT execute any remaining modules
- **AND** SHALL return `{ ok: false, failedModule: '<name>' }`

#### Scenario: Non-required module failure is skipped

- **WHEN** a module with `required: false` handler throws
- **THEN** the orchestrator SHALL log the warning and continue with remaining modules
