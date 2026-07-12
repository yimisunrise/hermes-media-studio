## 1. Router & Menu Changes

- [x] 1.1 Add `'init'` to the `VIEWS` constant in `router.js`
- [x] 1.2 Add "初始化" menu item under the `customize` group in `MENU_GROUPS` in `app.js`
- [x] 1.3 Add init SVG icon to `ICONS` map in `app.js`

## 2. Init View Implementation

- [x] 2.1 Register `'init'` route in `_initModules()` with a dedicated render handler
- [x] 2.2 Implement `_renderInitView(container)` method showing: title, tutorial text, workspace path display, directory list, and "初始化" button
- [x] 2.3 Implement init button click handler: call `_createWorkspaceDirectories()`, show progress, auto-navigate to `#kanban` on success

## 3. Auto-Redirect & Warning Banner

- [x] 3.1 Modify `init()` flow: replace `_showInitTip()` call with `router.navigate('init')` when workspace is not initialized
- [x] 3.2 Implement `_renderWarningBanner(container)` method for persistent warning when navigating away from init view without initializing
- [x] 3.3 Wire warning banner into router/view switching — show banner on all non-init views when `_workspaceReady === false`
- [x] 3.4 Handle warning banner dismissal when initialization completes

## 4. Init View Post-Initialization State

- [x] 4.1 Add "已完成" display state to `_renderInitView()` for when `_workspaceReady === true`
- [x] 4.2 Ensure init view shows directory list for reference but hides the "初始化" button after initialization

## 5. CSS Styling

- [x] 5.1 Add `.ms-init-view` container styles (centered layout, max-width, padding)
- [x] 5.2 Add `.ms-init-tutorial` styles for the tutorial text section
- [x] 5.3 Add `.ms-init-dir-list` styles for directory listing
- [x] 5.4 Add `.ms-init-button` styles for the prominent init button
- [x] 5.5 Add `.ms-warning-banner` styles for the persistent warning banner
- [x] 5.6 Add progress indicator styles for directory creation phase
- [x] 5.7 Remove unused setup dialog CSS (`.ms-setup-dialog`, `.ms-setup-overlay`, `.ms-setup-path`) if no longer referenced

## 6. Cleanup

- [x] 6.1 Remove `_showInitTip()` method and its call sites from `app.js` (replaced by auto-redirect)
- [x] 6.2 Remove `_showSetupDialog()` method from `app.js` (replaced by `_renderInitView()`)
- [x] 6.3 Remove unused CSS classes `.ms-init-tip`, `.ms-init-tip-icon`, `.ms-init-tip-text`, `.ms-init-tip-btn`

## 7. Verification

- [x] 7.1 Verify `lsp_diagnostics` clean on all changed files (`src/app.js`, `src/app.css`, `src/modules/router.js`)
- [ ] 7.2 Verify init view renders correctly with tutorial text and directory list *(browser)*
- [ ] 7.3 Verify clicking "初始化" creates all directories and navigates to `#kanban` *(browser)*
- [ ] 7.4 Verify warning banner appears on non-init views when not initialized *(browser)*
- [ ] 7.5 Verify warning banner disappears after initialization *(browser)*
- [ ] 7.6 Verify "初始化" menu item always visible before and after initialization *(browser)*
- [ ] 7.7 Verify init view shows "已完成" state when revisited after initialization *(browser)*
