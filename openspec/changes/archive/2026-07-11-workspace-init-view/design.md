## Context

The Media Studio extension currently handles workspace initialization via a non-blocking tip bar (`_showInitTip()`) in the view container, with a modal overlay dialog (`_showSetupDialog()`) triggered by clicking "立即初始化". This works but has UX gaps:

- The tip bar is small and easy to miss
- The setup dialog is a modal overlay that feels disconnected from the app's page-based navigation model
- There's no menu entry for initialization — users who skip cannot easily find it again
- Users who skip get no persistent reminder about incomplete initialization

The extension already has a hash-router (`Router`), menu system (`MENU_GROUPS`), and view rendering pipeline. This change leverages those existing systems to turn initialization into a first-class view.

**Current state (relevant code):**

- `app.js`: `MENU_GROUPS` defines menu structure; `init()` → `_showInitTip()` for uninitialized state; `_showSetupDialog()` renders a modal; `_createWorkspaceDirectories()` creates the directory structure
- `router.js`: `VIEWS` array whitelists known views; `Router.register()` maps view names to render functions; unknown hashes redirect to `#kanban`
- The API client (`api.js`) already has `checkInitialized()` and all directory creation methods

## Goals / Non-Goals

**Goals:**
- Add "初始化" menu item under "定制化" group, always visible
- Create a dedicated init view (`#init`) rendered as a full-page view, not a modal overlay
- Auto-navigate to `#init` on extension load when workspace is not initialized
- Init view shows tutorial text + directory list on top, "初始化" button on bottom
- Successful initialization auto-navigates to `#kanban`
- If user navigates away from init view without initializing, show a persistent warning banner across all views
- The menu item and route remain available after initialization (user can revisit)

**Non-Goals:**
- Not changing the API layer (`api.js`) — `checkInitialized()` and `mkdir()` are already implemented
- Not changing the directory creation logic (`_createWorkspaceDirectories()`)
- Not changing any of the 8 existing view modules
- Not adding multi-step wizard or interactive tutorial — single-page init view only

## Decisions

### Decision 1: Init as a router-backed view instead of conditional modal

**Option A (chosen):** Add `init` as a proper router view. Register it in `VIEWS`, register a render function, and add a menu item. The `init()` flow checks `_workspaceReady` and calls `router.navigate('init')`.

**Option B (rejected):** Keep current modal approach. This doesn't integrate with the menu system, doesn't support the warning banner pattern, and makes the init feel like a blocker rather than a page.

### Decision 2: Menu item always visible

**Chosen:** The "初始化" menu item is part of the static `MENU_GROUPS` definition. It's always visible regardless of initialization state. After initialization, clicking it navigates to the init view which shows a "已完成" state instead of the init button.

### Decision 3: Warning banner as a composable component

**Chosen:** Create a `_showWarningBanner()` method that prepends a dismissible banner to the view container when `_workspaceReady === false` and current view is not `init`. On initialization completion, hide the banner.

### Decision 4: Init view is not a separate module class

**Chosen:** The init view is simple enough to live in `app.js` as a method (`_renderInitView`). The 8 existing view modules follow a class pattern with `render(container, params)`, but the init view is transient and stateless — it doesn't need its own file.

### Decision 5: Warning banner uses existing CSS pattern

**Chosen:** Reuse the `.ms-empty` / `.ms-loading` pattern for the warning banner with a distinct class (`.ms-warning-banner`). No new component system needed.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| User navigates away from init view before reading tutorial | Warning banner persists across all views until initialization is complete |
| Menu item "初始化" exists but does nothing after init | After init, the init view shows a "已完成" status with option to view directory structure |
| Hash `#init` is not a standard view — other code might reference it | `VIEWS` whitelist ensures it's treated as a valid hash; no existing code references `init` |
| Projecting modal setup to full-page view might need more CSS | The app already has a flex-based layout (`ms-view-container`) that the init view can reuse |
