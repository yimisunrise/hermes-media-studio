## ADDED Requirements

### Requirement: init-def files consolidated under src/init/

All module init-definition files SHALL reside in `src/init/` directory, following the "responsibility aggregation" rule rather than scattering across module directories.

#### Scenario: InitOrchestrator.init-def.js moved

- **WHEN** the file `src/core/InitOrchestrator.init-def.js` existed
- **THEN** after cleanup it SHALL be at `src/init/InitOrchestrator.init-def.js`
- **AND** imports in `app.js` SHALL reference the new path

#### Scenario: SchemaRegistry.init-def.js moved

- **WHEN** the file `src/core/SchemaRegistry.init-def.js` existed
- **THEN** after cleanup it SHALL be at `src/init/SchemaRegistry.init-def.js`
- **AND** imports in `app.js` SHALL reference the new path

### Requirement: InitPipeline removed

The `InitPipeline` class SHALL be removed entirely, including its export from `src/core/index.js`.

#### Scenario: InitPipeline.js deleted

- **WHEN** the cleanup is applied
- **THEN** `src/core/InitPipeline.js` SHALL NOT exist
- **AND** `src/core/index.js` SHALL NOT export InitPipeline

#### Scenario: No regressions in InitOrchestrator

- **WHEN** InitPipeline is removed
- **THEN** InitOrchestrator SHALL continue to work
- **AND** no other module SHALL import InitPipeline
