## 1. Sidebar Module — Core Implementation

- [x] 1.1 Create `src/modules/sidebar.js` with DOM injection constants (SELECTORS) and init function
- [x] 1.2 Implement desktop rail button injection (insert button + separator into `.rail`, idempotent check)
- [x] 1.3 Implement click handler: toggle active class, show/hide `#media-studio-app`, dispatch `ms:activated`/`ms:deactivated` events
- [x] 1.4 Implement native panel click interceptor (listen for `.nav-tab` clicks to deactivate Media Studio)
- [x] 1.5 Implement lifecycle event wiring so `app.js` can listen for `ms:activated`/`ms:deactivated`

## 2. App.js Bootstrap Integration

- [x] 2.1 Import Sidebar module in `src/app.js`
- [x] 2.2 Call `Sidebar.init()` after API probe succeeds in the `init()` flow
- [x] 2.3 Wire `ms:activated` event to trigger initial view rendering (Kanban)
- [x] 2.4 Wire `ms:deactivated` event to pause hash router and release resources

## 3. Sidebar CSS Styling

- [x] 3.1 Add `.ms-rail-btn` styles to `src/app.css`: WebUI CSS variable inheritance, active state border/color, hover state
- [x] 3.2 Add `.ms-rail-separator` styles (thin `<hr>` before button)
- [x] 3.3 Ensure CSS is namespaced with `ms-` prefix, no style leaks to other rail buttons

## 4. Mobile Sidebar Adaptation

- [x] 4.1 Implement `.sidebar-nav` button injection in `src/modules/sidebar.js`
- [x] 4.2 Ensure mobile button click closes the mobile sidebar and activates Media Studio
- [x] 4.3 Add responsive CSS so desktop/mobile buttons respect WebUI viewport breakpoints

## 5. Verification & Edge Cases

- [x] 5.1 Verify idempotent injection: script reload does not create duplicate buttons
- [x] 5.2 Verify backward compatibility: Extension Tab still opens Media Studio correctly
- [x] 5.3 Verify lifecycle events fire correctly when switching between native panels and Media Studio
- [x] 5.4 Verify hash route is preserved and restored on reactivation
- [x] 5.5 Run `node --check` on all modified JS files
