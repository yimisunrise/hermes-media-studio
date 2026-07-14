## ADDED Requirements

### Requirement: Remove unused src/utils/dom.js

The file `src/utils/dom.js` SHALL be removed. It contains utility functions (`createElement`, `debounce`, `throttle`, `empty`) that have no remaining call sites. These functions exist in `modules/utils/dom.js` which is the live version.

#### Scenario: File deleted

- **WHEN** `src/utils/dom.js` is removed
- **THEN** no import or reference from any other file SHALL reference `src/utils/dom.js`
- **AND** `node --check` on all JS files SHALL pass

### Requirement: Remove unused core/NotificationBus.js

The file `core/NotificationBus.js` SHALL be removed. It is initialized as `null` in `core/ProcessEngine.js` and never used. No view or service imports or references it.

#### Scenario: File with zero references deleted

- **WHEN** `NotificationBus.js` is removed
- **THEN** `grep -r "NotificationBus" src/` SHALL return zero results (excluding the file itself)
- **AND** `core/index.js` export list SHALL be updated to exclude NotificationBus

### Requirement: Remove unused core/ProcessEngine.js

The file `core/ProcessEngine.js` SHALL be removed. Its state machine functionality is duplicative of `stateMachine.js` (config-driven). No view or module references ProcessEngine.

**Reason**: ProcessEngine was introduced in Era 3 but never integrated with any view. The config-driven stateMachine.js (Era 2) is the active, tested state machine implementation.

#### Scenario: Removal with re-export check

- **WHEN** `ProcessEngine.js` is removed
- **THEN** `grep -r "ProcessEngine" src/` SHALL return zero results
- **AND** `core/index.js` export list SHALL be updated

### Requirement: Remove unused core/FileScanner.js

The file `core/FileScanner.js` SHALL be reviewed for usage. If unused by any view or service, it SHALL be removed.

**Reason**: FileScanner was part of the core/ service layer but no view calls into it. The workspace directory scanning is handled ad-hoc by individual views.

#### Scenario: Verify before removal

- **WHEN** evaluating FileScanner for removal
- **THEN** `grep -r "FileScanner" src/` SHALL be checked
- **AND** if zero references exist outside the file itself, it SHALL be removed
