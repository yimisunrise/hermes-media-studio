## ADDED Requirements

### Requirement: Extension uses correct WebUI API endpoints
The WorkspaceAPI SHALL use the real Hermes WebUI API endpoints for all file operations, replacing the non-existent `/api/workspace/*` endpoints.

#### Scenario: Directory listing uses /api/list
- **WHEN** `api.tree('pipeline/01-generating')` is called
- **THEN** the extension SHALL send `GET /api/list?session_id=<sid>&path=media-studio/pipeline/01-generating`
- **AND** SHALL normalize the response `{entries: [{name, path, type, size, mtime_ns}]}` to `[{name, path}]`

#### Scenario: File read uses /api/file
- **WHEN** `api.read('themes/neon/theme.json')` is called
- **THEN** the extension SHALL send `GET /api/file?session_id=<sid>&path=media-studio/themes/neon/theme.json`
- **AND** SHALL return the `content` field as a string

#### Scenario: File write uses POST /api/file/save
- **WHEN** `api.write('pipeline/04-scheduled/post.md', content)` is called
- **THEN** the extension SHALL send `POST /api/file/save` with JSON body `{session_id, path, content}`
- **AND** the `path` field SHALL be relative to the workspace root

#### Scenario: File create uses POST /api/file/create
- **WHEN** writing to a file that SHALL be created (not overwritten)
- **THEN** the extension SHALL send `POST /api/file/create` with JSON body `{session_id, path, content}`

#### Scenario: Directory creation uses POST /api/file/create-dir
- **WHEN** `api.mkdir('themes/neon')` is called
- **THEN** the extension SHALL send `POST /api/file/create-dir` with JSON body `{session_id, path}`

#### Scenario: File deletion uses POST /api/file/delete
- **WHEN** `api.delete('pipeline/04-scheduled/post.md')` is called
- **THEN** the extension SHALL send `POST /api/file/delete` with JSON body `{session_id, path}`
- **AND** SHALL include `recursive: true` when deleting directories

#### Scenario: File rename uses POST /api/file/rename
- **WHEN** `api.rename('old.md', 'new.md')` is called within the same directory
- **THEN** the extension SHALL send `POST /api/file/rename` with JSON body `{session_id, path: <old>, new_name: <basename>}`

#### Scenario: File move uses POST /api/file/move
- **WHEN** `api.rename('src/a.md', 'dest/a.md')` is called across directories
- **THEN** the extension SHALL send `POST /api/file/move` with JSON body `{session_id, path: <old>, dest_dir: <target_dir>}`

### Requirement: Response format normalization
The extension SHALL normalize real API response formats to match what existing modules expect.

#### Scenario: Tree response normalization
- **WHEN** the API returns `{entries: [{name, path, type, size, mtime_ns}]}`
- **THEN** `_normalizeTree()` SHALL extract the `entries` array
- **AND** SHALL return it as `[{name, path}]` (preserving additional fields)

#### Scenario: Read response normalization
- **WHEN** the API returns `{path, content, size, lines}`
- **THEN** `read()` SHALL return the `content` string

#### Scenario: Write response used
- **WHEN** the API returns `{ok, path, size}`
- **THEN** `write()` SHALL return the full response object (callers use `.catch(() => ({}))`)

### Requirement: API availability verification
The extension SHALL verify API endpoint availability at startup.

#### Scenario: Probe with real endpoints
- **WHEN** the extension starts
- **THEN** it SHALL send `GET /api/list?session_id=<sid>&path=.` to verify the API works
- **AND** SHALL set `api.ready = true` only on HTTP 200

#### Scenario: API not reachable
- **WHEN** the probe request fails (non-200, network error, timeout)
- **THEN** the extension SHALL set `api.ready = false`
- **AND** SHALL surface a user-visible error message
