## 1. Framework CSS — Button variable alignment

- [x] 1.1 Update `.ms-btn` in `framework/app.css` to use `--ms-input-radius`, `--ms-input-padding`, `--ms-input-font-size` (replacing hard-coded padding and `var(--ms-radius)`)
- [x] 1.2 Update `.ms-btn-sm` in `framework/app.css` to use `--ms-input-sm-padding` and `--ms-input-sm-font-size` (aligning height with `.ms-input-sm`)
- [x] 1.3 Create `.ms-btn-danger` class in `framework/app.css` with danger background/color/border-color (matches `.ms-btn-primary` pattern)
- [x] 1.4 Add `.ms-btn-danger:hover` state to `framework/app.css`

## 2. Business CSS — Button alignment

- [x] 2.1 Update `.ms-kanban-action-btn` in `business/app.css` to use `--ms-input-sm-padding` and `--ms-input-sm-font-size` (align with `.ms-btn-sm` compact sizing)
- [x] 2.2 Update `.ms-menu-group-header` and `.ms-menu-item` border-radius from hard-coded `8px` to `var(--ms-radius)` in `framework/app.css`

## 3. View file cleanup — Delete confirm buttons (inline HTML template)

- [x] 3.1 `IdeaBoard.js:312` — Remove inline `style` from "确认删除" button, ensure `class="ms-btn ms-btn-sm ms-btn-danger"`
- [x] 3.2 `TopicBoard.js:286` — Same pattern as 3.1
- [x] 3.3 `TasksView.js:203` — Same pattern as 3.1
- [x] 3.4 `TemplatesView.js:342` — Same pattern as 3.1
- [x] 3.5 `PlatformConfig.js:212` — Same pattern as 3.1
- [x] 3.6 `ThemeStrategy.js:264` — Same pattern as 3.1

## 4. View file cleanup — style.cssText on buttons

- [x] 4.1 `TasksView.js:182` — Replace `delBtn.style.cssText = '...danger...'` with `className = 'ms-btn ms-btn-sm ms-btn-danger'`
- [x] 4.2 `TemplatesView.js:51` — Replace `tabBtn.style.cssText` for tab button with CSS class approach (`.ms-tab-btn` + `.ms-tab-btn-active`)

## 5. View file cleanup — Direct style.* property overrides

- [x] 5.1 `IdeaBoard.js:176`, `PlatformConfig.js:110`, `ThemeStrategy.js:126` — Replace `delBtn.style.color = 'var(--ms-danger)'` with `.ms-btn-icon` + `.ms-btn-danger` class combination or keep as simple color-only inline (danger icon, not form button)
- [x] 5.2 `ContentEditor.js:293-297` — Keep `btn.style.marginLeft` and dynamic `borderColor`/`color` overrides (dynamic state indicator, not sizing)
- [x] 5.3 `PublishManager.js:476` — Replace inline `style="margin-right:8px"` with a container/gap approach or keep as-is (spacing, not sizing)

## 6. Verification

- [x] 6.1 Global grep for remaining button inline padding/font-size/border-radius overrides — confirm zero
- [x] 6.2 JS syntax check on all modified files
- [x] 6.3 Visual confirmation in WebUI (manual — runtime check for button height consistency across views)
