## MODIFIED Requirements

### Requirement: Boot JSON state persistence on partial updates

The system SHALL preserve all existing fields in `.system/boot.json` when only a subset of fields is provided to `writeBoot()`.

**Note:** `boot.json` is now simplified to store only app-level metadata (first_boot_at, version, app_version). Module-level init state is tracked in `.system/init/<module>.json` files instead. The `steps` field in boot.json is no longer written by the init system.

#### Scenario: writeStepStatus writes module marker instead of boot.json steps

- **WHEN** a module init step completes
- **THEN** the orchestrator SHALL write `.system/init/<module-name>.json`
- **AND** SHALL NOT write `steps` to `.system/boot.json`

#### Scenario: markBootComplete is removed

- **WHEN** all modules complete initialization
- **THEN** no `markBootComplete()` call SHALL be made
- **AND** the app SHALL determine readiness by checking marker versions, not `boot.json.init_state`
