# form-layout-patterns Specification

## ADDED Requirements

### Requirement: Standard form row uses ms-form-group

All stacked form rows (label above input) in modal dialogs across every view SHALL use `ms-form-group` as the row container. The `.ms-form-group` class SHALL have a `margin-bottom` of `12px`. No view SHALL use inline `margin-bottom` or `style.marginBottom` on form row containers.

#### Scenario: ms-form-group has 12px margin-bottom

- **WHEN** a `.ms-form-group` element is rendered
- **THEN** its computed `margin-bottom` SHALL be `12px`

#### Scenario: No inline margin-bottom on form rows

- **WHEN** any view renders a form row in a modal dialog
- **THEN** the row container SHALL NOT have inline `margin-bottom` or `style.marginBottom`

### Requirement: Standard form label uses native <label> inside ms-form-group

Labels inside `.ms-form-group` SHALL use native `<label>` elements. The label style SHALL be controlled by the existing `.ms-form-group label` CSS (`display: block; margin-bottom: 4px; font-size: 12px; font-weight: 500; color: var(--ms-text-secondary)`). No view SHALL use inline styles for label formatting (font-size, font-weight, color, margin-bottom).

#### Scenario: Label uses native <label> element

- **WHEN** a form row is rendered in any view
- **THEN** its label SHALL use a `<label>` element (not `<div>` styled as label)

#### Scenario: No inline label styles

- **WHEN** a `<label>` element is rendered inside `.ms-form-group`
- **THEN** it SHALL NOT have inline `font-size`, `font-weight`, `color`, or `margin-bottom` styles

### Requirement: Shared FormBuilder utility module

The system SHALL provide a shared `FormBuilder` utility module at `src/business/views/components/FormBuilder.js` that exports factory functions for creating standard form rows. The module SHALL replace all duplicated `_formField()`, `_fld()`, `_fldArea()`, and `_themeSel()` helper functions across views.

#### Scenario: FormBuilder provides formGroup function

- **WHEN** `FormBuilder.formGroup(id, labelText, inputElement)` is called
- **THEN** it SHALL return a `<div class="ms-form-group">` containing a `<label>` element and the provided input element

#### Scenario: FormBuilder provides label function

- **WHEN** `FormBuilder.label(text, htmlFor)` is called
- **THEN** it SHALL return a `<label>` element with the specified text and `for` attribute

#### Scenario: FormBuilder provides input factory functions

- **WHEN** `FormBuilder.input(placeholder, value)` is called
- **THEN** it SHALL return an `<input class="ms-form-input">` with the specified placeholder and value

#### Scenario: FormBuilder provides textarea factory function

- **WHEN** `FormBuilder.textarea(placeholder, value)` is called
- **THEN** it SHALL return a `<textarea class="ms-form-textarea">` with the specified placeholder and value

#### Scenario: FormBuilder provides select factory function

- **WHEN** `FormBuilder.select(options, selectedValue)` is called
- **THEN** it SHALL return a `<select class="ms-select">` populated with the specified `<option>` elements, with `selectedValue` pre-selected

### Requirement: Deprecate duplicated form helper functions

View files SHALL NOT define their own `_formField()`, `_fld()`, `_fldArea()`, or `_themeSel()` helper functions. All views SHALL import from the shared `FormBuilder` module instead.

#### Scenario: PlatformConfig uses FormBuilder

- **WHEN** PlatformConfig renders its create/edit modal
- **THEN** it SHALL use `FormBuilder.formGroup()` and related functions, NOT its own `_formField()`

#### Scenario: PublishManager uses FormBuilder

- **WHEN** PublishManager renders its create/mark-result modal
- **THEN** it SHALL use `FormBuilder.formGroup()` and related functions, NOT its own `_formField()`

#### Scenario: IdeaBoard uses FormBuilder

- **WHEN** IdeaBoard renders its detail/create-topic modal
- **THEN** it SHALL use `FormBuilder.formGroup()` and related functions, NOT its own `_fld()`, `_fldArea()`, or `_themeSel()`

#### Scenario: TopicBoard uses FormBuilder

- **WHEN** TopicBoard renders its create/edit modal
- **THEN** it SHALL use `FormBuilder.formGroup()` and related functions, NOT its own `_fld()` or `_themeSel()`

### Requirement: DatabaseManager uses standard form classes

DatabaseManager SHALL use `ms-form-group` instead of `ms-db-form-field`, and native `<label>` instead of `ms-db-form-label`. The `ms-db-form-field-row` SHALL be replaced with `ms-form-group-inline`. The custom CSS classes `ms-db-form-field`, `ms-db-form-label`, and `ms-db-form-field-row` SHALL be removed from `business/app.css`.

#### Scenario: Database form uses ms-form-group

- **WHEN** DatabaseManager renders the database create/edit form
- **THEN** its form rows SHALL use `<div class="ms-form-group">` with `<label>` elements, NOT `ms-db-form-field` or `ms-db-form-label`

#### Scenario: Table form uses ms-form-group-inline for field rows

- **WHEN** DatabaseManager renders the table create/edit form with dynamic field rows
- **THEN** field rows SHALL use `<div class="ms-form-group-inline">` instead of `<div class="ms-db-form-field-row">`

#### Scenario: Record form uses ms-form-group

- **WHEN** DatabaseManager renders the record create/edit form
- **THEN** its form rows SHALL use `<div class="ms-form-group">` with `<label>` elements

### Requirement: Deprecated CSS classes removed

The following CSS classes SHALL be removed from `business/app.css` and any view files referencing them:
- `.ms-db-form-field`
- `.ms-db-form-label`
- `.ms-db-form-field-row`

#### Scenario: No ms-db-form-field in CSS

- **WHEN** `business/app.css` is loaded
- **THEN** it SHALL NOT contain `.ms-db-form-field`, `.ms-db-form-label`, or `.ms-db-form-field-row` selectors

### Requirement: Modal dialog title standardization

All modal dialogs for creating new items SHALL use the format `新建{ItemName}`. All modal dialogs for editing items SHALL use the format `编辑{ItemName}`.

#### Scenario: Create modal titles use standard format

- **WHEN** any view opens a create/new modal dialog
- **THEN** the modal title SHALL be in the format `新建{X}` (e.g., `新建任务`, `新建模板`, `新建灵感`)

#### Scenario: Edit modal titles use standard format

- **WHEN** any view opens an edit modal dialog
- **THEN** the modal title SHALL be in the format `编辑{X}` (e.g., `编辑任务`, `编辑模板`)

### Requirement: View migration uses ms-form-group

Each of the following views SHALL be migrated to use `ms-form-group` as the form row container:
- TasksView (currently uses `ms-form-row` overridden to column)
- TemplatesView (currently uses inline `margin-bottom: 14px`)
- IdeaBoard (currently uses inline `margin-bottom: 14px` via `_fld()`)
- TopicBoard (currently uses inline `margin-bottom: 14px` via `_fld()`)
- PublishManager (currently uses inline `margin-bottom: 14px` via `_formField()`)
- PlatformConfig (currently uses inline `margin-bottom: 14px` via `_formField()`)
- ThemeStrategy (currently uses `ms-form-group` with 10px — spacing auto-updates)
- AssetGallery (currently uses `ms-form-row` overridden with inline `margin-bottom: 12px`)
- DatabaseManager (currently uses `ms-db-form-field` with 12px)

#### Scenario: TasksView uses ms-form-group

- **WHEN** TasksView renders create/edit task modal
- **THEN** form rows SHALL use `<div class="ms-form-group">` with `<label>`, NOT `<div class="ms-form-row">` with inline `flex-direction: column`

#### Scenario: TemplatesView uses ms-form-group

- **WHEN** TemplatesView renders create/edit template modal
- **THEN** form rows SHALL use `<div class="ms-form-group">`, NOT inline `margin-bottom: 14px`

#### Scenario: AssetGallery uses ms-form-group for detail display

- **WHEN** AssetGallery renders the asset detail modal
- **THEN** info rows SHALL use `<div class="ms-form-group">`, NOT `<div class="ms-form-row">` with inline overrides
