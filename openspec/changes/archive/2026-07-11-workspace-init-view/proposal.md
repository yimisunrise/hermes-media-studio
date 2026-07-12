## Why

The current workspace initialization uses a non-blocking tip bar + modal dialog approach that feels disconnected from the rest of the Media Studio UX. When a user first loads the extension without an initialized workspace, they see a small tip bar in the view area instead of a dedicated onboarding page. There is no menu entry to trigger initialization manually, and users who skip initialization get no persistent reminder that their workspace is incomplete.

## What Changes

- **Add "初始化" menu item** under the "定制化" menu group, always visible regardless of initialization state
- **Create a dedicated init view** (`#init`) as a full-page initialization interface, replacing the current modal-based setup dialog
- **Auto-redirect on load**: If workspace is not initialized, automatically navigate to the init view instead of showing a tip bar
- **Persistent warning banner**: When user navigates away from init view without initializing, show a warning banner at the top of all views
- **Init view content**: Top section shows tutorial text + directory list to create; middle-bottom section shows the "初始化" button
- **Keep existing `_createWorkspaceDirectories()`** logic but present it as part of the init view instead of a modal overlay

## Capabilities

### New Capabilities
- `init-view`: Dedicated full-page workspace initialization view with tutorial text, directory listing, and one-click initialization button. Integrates into the existing router and menu system.

### Modified Capabilities
- `workspace-init` (from `workspace-adaptation` change): The initialization UI transitions from a modal dialog overlay (`_showSetupDialog()`) to a dedicated router-backed view (`#init`). The detection logic (`checkInitialized()`) and directory creation logic (`_createWorkspaceDirectories()`) remain unchanged.

## Impact

- **`src/app.js`**: Add `init` to `VIEWS` and `MENU_GROUPS`; modify `init()` flow to auto-navigate to `#init` when workspace not ready; add persistent warning banner logic; add init view render method
- **`src/app.css`**: Add styles for init view layout (tutorial section, button placement, warning banner)
- **`src/modules/router.js`**: Add `'init'` to the `VIEWS` constant
- **No changes to**: `api.js`, any of the 8 view modules, sidebar.js
