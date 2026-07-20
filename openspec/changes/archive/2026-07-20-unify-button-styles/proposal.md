## Why

Button elements across the application have inconsistent padding, border-radius, and font-size vs the already-unified input/select elements. Button styles are hard-coded in 7 CSS classes and 28 inline `style.cssText` overrides across 10 view files, with values diverging from the standard `--ms-input-*` CSS variables. Buttons should match input/select height and border-radius for a coherent form element appearance.

## What Changes

- Create `--ms-btn-*` CSS variables in `:root` (or reuse `--ms-input-*` variables for button sizing) to centralize button dimensions
- Update `.ms-btn` base class to use CSS variables aligned with `.ms-input` height (~34px, border-radius 4px)
- Update `.ms-btn-sm` compact variant to use variables aligned with `.ms-input-sm` height (~24px)
- Create `.ms-btn-danger` CSS class for danger/delete button variant — eliminates 7 duplicate inline styles
- Clean up 28 inline `style.cssText` and `style.*` overrides on buttons across 10 view files
- Minor: `.ms-menu-group-header` and `.ms-menu-item` border-radius 8px → `var(--ms-radius)`
- Minor: `.ms-toast-dismiss` and `.ms-modal-header-close` to use consistent sizing variables where appropriate

## Capabilities

### New Capabilities
- *(none — button styles extend the existing `form-elements` capability)*

### Modified Capabilities
- `form-elements`: Add button style requirements — border-radius, padding, font-size variables, danger variant, no inline overrides

## Impact

- **Framework CSS**: `src/framework/app.css` — `.ms-btn`, `.ms-btn-sm`, `.ms-btn-icon` property values updated to use variables
- **Business CSS**: `src/business/app.css` — `.ms-kanban-action-btn` may align with `.ms-btn-sm` variables
- **View files** (10 files): Clean up inline button styles in `IdeaBoard.js`, `TopicBoard.js`, `TasksView.js`, `TemplatesView.js`, `PublishManager.js`, `PlatformConfig.js`, `ThemeStrategy.js`, `ContentEditor.js`, `AssetCard.js`, `TaskDetail.js`, `AssetGallery.js`, `DatabaseManager.js`
- **No new dependencies**, no API changes, no breaking visual changes (existing heights preserved via variable defaults)
