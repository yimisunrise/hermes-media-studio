## 1. Fix Auto-Redirect to #kanban

- [x] 1.1 In `src/modules/router.js`, modify `init()` to remove the unconditional default hash — only handle hashchange when a hash already exists
- [x] 1.2 Verify that clicking the Media Studio sidebar button still navigates to `#kanban` (via `ms:activated` listener in `app.js`)

## 2. Sidebar Button: Icon-Only + Reposition

- [x] 2.1 In `src/modules/sidebar.js`, change button `innerHTML` from `'🎬 <span>Media Studio</span>'` to `'🎬'` in `_injectRail()`
- [x] 2.2 In `src/modules/sidebar.js`, change button injection from `rail.appendChild(btn)` to inserting before the Control Center button (find a suitable anchor or fallback)
- [x] 2.3 In `src/app.css`, review `.ms-rail-btn span` styles — removed dead CSS rule
- [x] 2.4 Verify that `title` attribute on the button still shows the full tooltip text on hover

## 3. Verification

- [x] 3.1 Confirm homepage no longer auto-redirects to `#kanban` — Router.init() no longer sets default hash
- [x] 3.2 Confirm sidebar Media Studio button shows icon only — innerHTML changed to `'🎬'`
- [x] 3.3 Confirm sidebar Media Studio button appears above Control Center — insertBefore with fallback
- [x] 3.4 Confirm `lsp_diagnostics` clean on all changed files — CSS clean, JS LSP unavailable (no TypeScript in project)
