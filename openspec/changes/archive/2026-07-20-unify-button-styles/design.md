## Context

Button styling is currently scattered across 2 CSS files (framework/app.css, business/app.css) and 10+ JS view files with 28 inline style overrides. The input/select/textarea elements were recently unified through `--ms-input-*` CSS variables. Buttons need to be brought into the same system to ensure consistent height and border-radius across all form elements.

Current button state:
- `.ms-btn`: `padding: 6px 14px; font-size: 13px; border-radius: var(--ms-radius)` — height matches `.ms-input` (~34px) but uses different variables
- `.ms-btn-sm`: `padding: 4px 10px; font-size: 12px` — height ~28px, does NOT match `.ms-input-sm` (~24px)
- 6 identical "确认删除" inline styles duplicating danger button styling
- No CSS variable system for button dimensions
- `.ms-btn-icon`, `.ms-toast-dismiss`, `.ms-modal-header-close` use independent hard-coded values

## Goals / Non-Goals

**Goals:**
- Buttons and inputs have the same height and border-radius when placed in the same context
- `.ms-btn` shares the same vertical padding and font-size as `.ms-input`
- `.ms-btn-sm` shares the same compact sizing as `.ms-input-sm`
- New `.ms-btn-danger` class eliminates 7 duplicate inline danger button styles
- `.ms-btn` uses `--ms-input-*` variables for dimension alignment (or aliased `--ms-btn-*` variables)
- All 28 inline style overrides on buttons are removed or migrated to CSS classes

**Non-Goals:**
- Not changing `.ms-btn-icon` (needs square padding for visual balance)
- Not changing `.ms-rail-btn` (special sidebar navigation style, not a form button)
- Not changing icon-only delete buttons in AssetCard/TaskDetail (<22px special sizes)
- Not extracting shared `btn()` helper function (IdeaBoard/TopicBoard) — out of scope

## Decisions

### Decision 1: Reuse `--ms-input-*` variables vs create separate `--ms-btn-*` variables

**Chosen: Reuse `--ms-input-*` variables for dimension properties (padding, font-size).**

Rationale:
- Buttons and inputs sit side-by-side (e.g., filter bars, form rows) and should visually match
- Using the same variables guarantees alignment — no risk of "button is 2px taller"
- Reduces total variable count; simpler mental model
- The horizontal padding difference (input 12px vs button 14px) is maintained by keeping `--ms-input-padding: 6px 12px` and `.ms-btn` using `var(--ms-input-padding)` — the horizontal padding difference is only ±2px which is negligible

### Decision 2: `.ms-btn-sm` compact sizing aligns with `.ms-input-sm`

**Chosen: `.ms-btn-sm` uses `var(--ms-input-sm-padding)` for vertical and `var(--ms-input-sm-font-size)` for font-size.**

Rationale:
- Currently `.ms-btn-sm` = 4px 10px / 12px → ~28px vs `.ms-input-sm` = 3px 6px / 12px → ~24px
- These appear in the same filter bars (IdeaBoard, TopicBoard) — need to match
- 3px vertical padding + 12px font-size gives ~24px height, appropriate for compact contexts

### Decision 3: `.ms-btn-icon` keeps independent padding

**Chosen: Keep `padding: 6px` hard-coded (no variable).**

Rationale:
- Icon buttons need square, generous click targets independent of text button sizing
- They're used in menus/tables where form alignment doesn't apply
- `min-width: 32px` and `padding: 6px` are intentional for touch/finger target size

### Decision 4: Create `.ms-btn-danger` as new variant

**Chosen: New class overriding background/color/border-color for danger actions.**

```css
.ms-btn-danger {
  background: var(--ms-danger);
  color: #fff;
  border-color: var(--ms-danger);
}
.ms-btn-danger:hover {
  background: var(--ms-danger-hover, #c0392b);
  border-color: var(--ms-danger-hover, #c0392b);
}
```

Rationale:
- 7 identical `style="padding:6px 16px;border:none;border-radius:var(--ms-radius-sm);background:var(--ms-danger);color:#fff;font-size:12px;"` across 6 files + TasksView.js
- A single class eliminates all duplication
- Stays consistent with `.ms-btn-primary` pattern (override background/color only)

### Decision 5: Inline overrides on buttons removed per category

- **Group A (HTML template inline styles, 10 instances)**: Replace with CSS class additions
- **Group B (style.cssText on button elements, 5 instances)**: Replace with className assignments + new classes
- **Group C (style.PROPERTY single overrides, 13 instances)**: 
  - `color: var(--ms-danger)` → `.ms-btn-danger` class (3 instances)
  - `marginLeft`/`margin-right` → utility classes or layout container
  - `borderBottomColor`/`color`/`fontWeight` on tabs → `.ms-tab-btn-active` class (TemplatesView)
  - `borderColor`/`color` on ContentEditor publish btn → keep as is (dynamic state indicator)

### Decision 6: `.ms-kanban-action-btn` stays self-contained

**Chosen: Keep `.ms-kanban-action-btn` in business/app.css with its own values, but align sizing with `.ms-btn-sm` variables.**

Rationale: It's a Kanban-specific component with different visual treatment (transparent bg, hover-only visibility). But its height should match `.ms-btn-sm` since they appear in similar density contexts.

## Risks / Trade-offs

- **[Visual Change] `.ms-btn-sm` height changes from ~28px to ~24px**: Might look too small on some buttons. Mitigation: 3px vertical padding is same as `.ms-input-sm`, already tested in the previous unification.
- **[Inline style removal] Removing inline `margin` values from buttons**: Could break layout if the margin was critical. Mitigation: Each removal reviewed individually; margin values moved to parent container where needed.
- **[Scope creep] `.ms-menu-group-header` and `.ms-menu-item` border-radius fix**: Low-risk, one-line CSS change from hard-coded 8px to `var(--ms-radius)`.
- **[Danger button sizing] `.ms-btn-danger` inherits `.ms-btn-sm` padding**: The current inline danger buttons use `padding:6px 16px` which differs from `.ms-btn-sm` default (4px 10px). Adding `.ms-btn-sm` to the class combo (`class="ms-btn ms-btn-sm ms-btn-danger"`) will match current appearance.
