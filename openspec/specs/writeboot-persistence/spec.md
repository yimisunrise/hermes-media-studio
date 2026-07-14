## ADDED Requirements

### Requirement: Boot JSON state persistence on partial updates

The system SHALL preserve all existing fields in `.system/boot.json` when only a subset of fields is provided to `writeBoot()`.

#### Scenario: writeStepStatus preserves init_state

- **WHEN** `writeStepStatus('some-step', 'done')` is called after `init_state` has been set to `'done'` 
- **THEN** the resulting boot.json SHALL retain `init_state` as `'done'`

#### Scenario: markBootComplete overrides init_state

- **WHEN** `markBootComplete()` calls `writeBoot({ init_state: 'done', ... })`
- **THEN** the resulting boot.json SHALL have `init_state` set to `'done'`

#### Scenario: First boot write uses defaults

- **WHEN** `writeBoot()` is called before any boot.json exists on disk
- **THEN** the resulting payload SHALL contain all fields from `BOOT_DEFAULTS`, with any explicitly provided `data` fields taking precedence

#### Scenario: Concurrent field updates merge correctly

- **WHEN** `writeBoot()` is called with a `steps` object
- **THEN** the resulting `steps` in boot.json SHALL merge existing steps (from the current file) with the newly provided steps, without removing previously recorded step entries
