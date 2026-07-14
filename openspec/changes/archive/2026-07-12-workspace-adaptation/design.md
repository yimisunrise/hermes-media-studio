## Context

The Hermes Media Studio extension is a vanilla JS frontend that loads as an injected script inside Hermes WebUI. It manages a media asset lifecycle pipeline (generate → review → approve → schedule → publish → archive) by reading/writing files in a workspace directory structure.

**Current state:** The extension hardcodes `/api/workspace/` endpoints that don't exist, uses a fixed `WORKSPACE_ROOT = 'media-studio'` path, and makes unauthenticated fetch calls. The WebUI's real file API operates session-workspace-relative with `session_id` required on every request.

**Constraints:**
- Extension runs in-page — shares global `S` object with WebUI
- All file APIs are session-workspace-relative — extension must work within the user's session workspace
- No server-side modifications allowed unless unavoidable
- All 8 existing view modules consume `api.tree/read/write/delete/rename/mkdir` — the API interface must remain backward-compatible
- The extension should not assume the directory structure exists — user may need to initialize it

## Goals / Non-Goals

**Goals:**
- Extension auto-detects the current session workspace and verifies API connectivity
- Extension uses the correct WebUI API endpoints with proper `session_id` authentication
- Extension detects if the media management directory structure exists and prompts the user to initialize it
- Zero server-side code changes — all adaptation is client-side
- All 8 existing modules continue working without modification

**Non-Goals:**
- Not adding user authentication flows (session already exists from WebUI)
- Not modifying the WebUI server or its API
- Not adding file upload capability (dead `upload` code removed, not fixed)
- Not migrating existing workspace data — data must be re-initialized in the session workspace

## Decisions

### Decision 1: Direct endpoint mapping instead of runtime probing

**Option A (chosen):** Replace the probing system with compile-time endpoint map. The real WebUI endpoints are known, stable, and versioned. Probing adds latency and complexity with no benefit.

**Option B (rejected):** Keep probing but change candidate URLs. This adds 3 seconds of startup delay for no value — the API surface is not going to change at runtime.

### Decision 2: session_id from global S.session

The global `S` object (from `ui.js:8`) is available in-page — all WebUI JS and extensions share the same global scope. `S.session.session_id` is the canonical session identifier.

The extension must handle the case where `S.session` is not yet initialized (async boot). The `app.init()` will retry/wait for session availability before proceeding.

**Session_id is passed as:**
- Query parameter for GET requests: `/api/list?session_id=X&path=.`
- JSON body field for POST requests: `{session_id: "X", path: "...", ...}`

### Decision 3: Workspace path from S.session.workspace

`S.session.workspace` contains the absolute path of the session's workspace (e.g., `/home/yimi/workspace`). The extension's directory structure will be created at `<workspace>/media-studio/`. This replaces the hardcoded `WORKSPACE_ROOT`.

### Decision 4: User-prompted initialization with setup dialog

When `api.probe()` succeeds but the `media-studio/` directory is absent, the extension shows:
1. Workspace path display (so user knows where files will go)
2. Directory structure overview (which dirs will be created)
3. "Initialize" button to confirm

If user declines, the extension shows an empty state with a retry button.

### Decision 5: Keep same module interface

All `api.tree()`, `api.read()`, `api.write()`, `api.mkdir()`, `api.delete()`, `api.rename()` method signatures remain identical. Modules are constructor-injected with `{api, state}` — no interface changes needed.

### Decision 6: Remove upload endpoint

The `upload` endpoint candidate exists in the current `CANDIDATE_ENDPOINTS` but is never called by any module. It will be removed from the new design to reduce dead code.

## Risks / Trade-offs

- **Session not ready on first render**: If `S.session` is null when the extension initializes, the app must wait. Mitigation: poll `S.session` with 100ms interval up to 5 seconds, then show error.
- **Workspace directory already exists**: If another extension or process already created `media-studio/`, initialization should be skipped gracefully. Mitigation: check for existing pipeline subdirectory before showing setup dialog.
- **Permission denied**: The WebUI workspace API enforces workspace boundaries. Since we operate within the session workspace, this should not be an issue. Mitigation: if API calls fail with 403/404 during init, surface the error to the user.
- **Backward compatibility with existing workspace data**: If a user already has `media-studio/` with data from a previous version, the old endpoint format won't work. Mitigation: the detection logic separates "endpoint probe" (always uses new endpoints) from "workspace init" (checks existing structure).
