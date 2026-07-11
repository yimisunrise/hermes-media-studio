## Why

Hermes Media Studio extension currently hardcodes `/api/workspace/` endpoints that don't exist in the real Hermes WebUI, and expects workspace data at a fixed path outside the user's session workspace. This makes the extension completely non-functional when loaded — the API probe fails, the workspace root is unreachable, and the app shows a persistent "无法连接到 Workspace API" error.

This change adapts the extension to integrate with the real Hermes WebUI API surface, auto-detect the current session workspace, and let users decide whether to initialize the media management directory structure within their workspace.

## What Changes

- **api.js completely rewritten**: Replace endpoint probing (`/api/workspace/*`) with direct use of real WebUI endpoints (`/api/list`, `/api/file`, `/api/file/save`, etc.), inject `session_id` from global `S.session.session_id`, normalize response formats
- **Workspace auto-detection**: Extension detects the current session workspace via `S.session.workspace` and exposes the workspace path to the user
- **User-guided initialization**: If the media management directory structure (`media-studio/pipeline/`, `media-studio/themes/`, etc.) doesn't exist in the workspace, show a setup dialog asking the user to confirm creation
- **app.js startup flow redesigned**: New init pipeline: probe API → detect workspace → check init → prompt user → launch modules
- **Remove dead code**: `upload` endpoint (defined but never called), old probe logic, unused `exists()` optimization opportunity

## Capabilities

### New Capabilities
- `workspace-detection`: Auto-detect the current Hermes WebUI session workspace and determine if media management directories need initialization
- `api-integration`: Full integration with real Hermes WebUI file API endpoints (`/api/list`, `/api/file`, `/api/file/save`, `/api/file/delete`, `/api/file/rename`, `/api/file/move`, `/api/file/create-dir`) with proper `session_id` authentication
- `workspace-init`: User-guided initialization flow that creates the required media management directory structure within the session workspace

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- **`src/modules/api.js`**: Major rewrite (~80% of file changes) — replace probe system, add session_id auth, normalize response shapes
- **`src/app.js`**: Significant restructuring (~40% of file changes) — new async init pipeline with workspace detection and setup prompt
- **`src/app.css`**: Minor additions — dialog styling for workspace setup prompt
- **All modules**: Transparent — they continue to use the same `api.operation()` interface, no module-level changes needed
- **No server-side changes**: All changes are client-side only; the extension adapts to the existing WebUI API
