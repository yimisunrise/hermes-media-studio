## ADDED Requirements

### Requirement: Extension detects current session workspace
The WorkspaceAPI SHALL detect the current WebUI session workspace path on initialization.

#### Scenario: Session workspace available
- **WHEN** the extension calls `api.detectWorkspace()`
- **THEN** it SHALL return the workspace path from `window.S.session.workspace`
- **AND** the detected workspace path SHALL match the session's configured workspace

#### Scenario: Session not yet initialized
- **WHEN** `window.S.session` is null at probe time
- **THEN** the extension SHALL poll for session availability at 100ms intervals
- **AND** SHALL timeout after 5 seconds with a clear error message

#### Scenario: Workspace path resolution
- **WHEN** the workspace path is detected
- **THEN** the extension SHALL expose it via `api.workspacePath` property
- **AND** all file operations SHALL be relative to this workspace root

### Requirement: Session_id acquired for API authentication
The extension SHALL obtain the current `session_id` for authenticating all API calls.

#### Scenario: Session_id from globals
- **WHEN** `window.S.session.session_id` is available
- **THEN** the extension SHALL read it and use it for all subsequent API calls

#### Scenario: Session_id propagated to GET requests
- **WHEN** making a GET request to `/api/list`, `/api/file`, or `/api/file/raw`
- **THEN** the extension SHALL append `?session_id=<id>` as a query parameter

#### Scenario: Session_id propagated to POST requests
- **WHEN** making a POST request to any `/api/file/*` endpoint
- **THEN** the extension SHALL include `"session_id": "<id>"` in the JSON request body
