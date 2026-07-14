## 1. Workspace Detection & Session ID

- [x] 1.1 Add `detectWorkspace()` method to WorkspaceAPI that reads `window.S.session.workspace` and `window.S.session.session_id`
- [x] 1.2 Add session readiness polling in `app.init()` — wait up to 5s for `S.session` to initialize before proceeding
- [x] 1.3 Expose `api.sessionId` getter and `api.workspacePath` property for use by all operations
- [x] 1.4 Update `app.init()` call sequence: probe → detectWorkspace → checkInit → prompt → startup

## 2. API Endpoint Rewrite (api.js)

- [x] 2.1 Replace `CANDIDATE_ENDPOINTS` with static endpoint map using real WebUI URLs (`/api/list`, `/api/file`, `/api/file/save`, `/api/file/create`, `/api/file/create-dir`, `/api/file/delete`, `/api/file/rename`, `/api/file/move`)
- [x] 2.2 Remove `upload` endpoint (dead code, never used)
- [x] 2.3 Replace `probe()` — send `GET /api/list?session_id=X&path=.` to verify API, remove multi-candidate probing
- [x] 2.4 Rewrite `_url()` — remove `?path=` template logic; build query params with `session_id` for GET endpoints
- [x] 2.5 Rewrite `tree(path)` — use `/api/list` with `?session_id=X&path=media-studio/<rel>`, normalize `{entries[]}` response
- [x] 2.6 Rewrite `read(path)` — use `/api/file` with `?session_id=X&path=media-studio/<rel>`, extract `content` field
- [x] 2.7 Rewrite `write(path, content)` — use `POST /api/file/save` with `{session_id, path, content}` JSON body; fall back to `POST /api/file/create` if save returns 404
- [x] 2.8 Rewrite `mkdir(path)` — use `POST /api/file/create-dir` with `{session_id, path}` JSON body; accept 400 "already exists"
- [x] 2.9 Rewrite `delete(path)` — use `POST /api/file/delete` with `{session_id, path, recursive: true}` JSON body
- [x] 2.10 Rewrite `rename(oldPath, newPath)` — detect same-directory vs cross-directory; use `POST /api/file/rename` for same-dir, `POST /api/file/move` for cross-dir
- [x] 2.11 Remove hardcoded `WORKSPACE_ROOT = 'media-studio'` — use workspace-relative path consistently
- [x] 2.12 Update `_normalizeTree()` to handle `entries` array format from real API
- [x] 2.13 Remove deprecated `exists()` method or rewrite it to use direct `/api/list` with path check
- [x] 2.14 Update `loadKanbanData()` and `_walkArchive()` to use new path format (paths are now `<workspaceRoot>/media-studio/<rel>`)

## 3. Workspace Initialization UI

- [x] 3.1 Add `checkInitialized()` method: probe `api.tree('pipeline/01-generating')` to detect existing structure
- [x] 3.2 Create setup dialog HTML template showing workspace path, directory list, and Initialize/Cancel buttons
- [x] 3.3 Add setup dialog CSS to app.css (`.ms-setup-dialog`, `.ms-setup-overlay`, `.ms-setup-path`)
- [x] 3.4 Implement `createWorkspaceStructure()` — iterate directory list calling `api.mkdir()`, show progress
- [x] 3.5 Add initialization error handling — report failures, offer Retry/Skip
- [x] 3.6 Wire the setup dialog into `app.init()` flow: if not initialized, show dialog before launching modules

