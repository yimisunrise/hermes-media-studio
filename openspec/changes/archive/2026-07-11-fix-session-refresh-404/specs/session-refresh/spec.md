## ADDED Requirements

### Requirement: Session freshness validation
The MediaStudio API client SHALL validate that the session obtained from `S.session.session_id` is recognized by the Hermes WebUI server before using it for workspace operations.

#### Scenario: Valid session passes through
- **WHEN** the API client holds a session that is registered in the WebUI server
- **THEN** `tree()`, `read()`, and `write()` operations proceed without interruption

#### Scenario: Stale session triggers refresh on first 404
- **WHEN** `checkInitialized()` calls `tree()` and receives HTTP 404
- **THEN** the client SHALL attempt to create a new session via `POST /api/session/new`
- **AND** retry the failed `tree()` call with the new session
- **AND** if the retry succeeds, mark the workspace as initialized

#### Scenario: Refresh failure reports correctly
- **WHEN** session creation fails and the retry also fails
- **THEN** `checkInitialized()` SHALL return `false`
- **AND** the UI SHALL show the workspace initialization prompt as normal

### Requirement: Session refresh method
The API client SHALL expose a public method `tryRefreshSession()` that other modules can call when they detect a session-related failure.

#### Scenario: Direct refresh call
- **WHEN** `tryRefreshSession()` is called
- **THEN** the client SHALL attempt to create a new session via `POST /api/session/new`
- **AND** update its internal `_sessionId` and `_workspacePath`
- **AND** return `true` on success, `false` on failure

### Requirement: One-shot retry with no infinite loop
The session refresh mechanism SHALL retry at most once to avoid infinite retry loops.

#### Scenario: Retry limit enforced
- **WHEN** `checkInitialized()` calls `tree()` and gets 404
- **THEN** after session creation, it retries the `tree()` call exactly once
- **AND** if the retry also fails, returns `false` immediately without further retries
