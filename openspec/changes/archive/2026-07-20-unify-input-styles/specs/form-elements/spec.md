# form-elements Specification

## ADDED Requirements

### Requirement: CSS variable definitions for form elements

The system SHALL define the following CSS custom properties in `:root {}` within `framework/app.css`:

- `--ms-input-radius`: border-radius for input/select/textarea, defaulting to `var(--ms-radius-sm, 4px)`
- `--ms-input-padding`: padding for input/select/textarea (horizontal), defaulting to `6px 12px`
- `--ms-input-font-size`: font-size for input/select/textarea, defaulting to `13px`
- `--ms-input-sm-padding`: padding for compact variant, defaulting to `3px 8px`
- `--ms-input-sm-font-size`: font-size for compact variant, defaulting to `12px`

#### Scenario: Variables are defined in :root

- **WHEN** the system loads `framework/app.css`
- **THEN** the `:root` selector SHALL contain all five `--ms-input-*` CSS custom properties with the specified default values

### Requirement: Unified border-radius for all form elements

All input, select, and textarea elements across every view SHALL use `var(--ms-input-radius)` as their border-radius. No element SHALL use a hard-coded border-radius value (3px, 8px) for its form input styling.

#### Scenario: Input uses CSS variable for border-radius

- **WHEN** an `<input>` element is rendered in any view
- **THEN** its computed border-radius SHALL equal `var(--ms-input-radius)` (< 5px when `--ms-radius-sm` is 4px)

#### Scenario: Select uses CSS variable for border-radius

- **WHEN** a `<select>` element is rendered in any view
- **THEN** its computed border-radius SHALL equal `var(--ms-input-radius)`

#### Scenario: Textarea uses CSS variable for border-radius

- **WHEN** a `<textarea>` element is rendered in any view
- **THEN** its computed border-radius SHALL equal `var(--ms-input-radius)`

### Requirement: No inline style overrides for padding/radius/height on form elements

No view file SHALL set `style.cssText`, `style.padding`, `style.borderRadius`, or `style.height` directly on input, select, or textarea elements for the purpose of sizing or corner rounding. All sizing and border-radius SHALL be controlled through CSS classes and CSS variables.

#### Scenario: Remove inline padding from IdeaBoard filter

- **WHEN** the system renders the IdeaBoard filter bar
- **THEN** its input elements SHALL NOT have inline `padding` or `borderRadius` in `style.cssText`

#### Scenario: Remove inline padding from TopicBoard filter

- **WHEN** the system renders the TopicBoard filter bar
- **THEN** its input elements SHALL NOT have inline `padding` or `borderRadius` in `style.cssText`

#### Scenario: Remove inline padding from PublishManager config

- **WHEN** the system renders PublishManager platform configuration
- **THEN** its input elements SHALL NOT have inline `padding` or `height` in `style.cssText`

### Requirement: Compact variant for space-constrained inputs

The system SHALL provide a `.ms-input-sm` CSS class that applies reduced padding (`--ms-input-sm-padding`) and font-size (`--ms-input-sm-font-size`) for use in filter bars, dialogs, and inline editing contexts.

#### Scenario: .ms-input-sm applies compact padding

- **WHEN** an element has class `ms-input-sm`
- **THEN** its computed padding SHALL be `3px 8px` (via `--ms-input-sm-padding`)

#### Scenario: .ms-input-sm applies compact font-size

- **WHEN** an element has class `ms-input-sm`
- **THEN** its computed font-size SHALL be `12px` (via `--ms-input-sm-font-size`)

### Requirement: Consistent implicit height across views

Input, select, and textarea elements using the standard class SHALL have the same computed height (~32px) regardless of which view renders them. Elements using `.ms-input-sm` SHALL have the same compact height (~26px).

#### Scenario: Standard inputs have uniform height

- **WHEN** an `<input>` with standard class is rendered in any view
- **THEN** its computed height SHALL equal the height of a standard `<input>` in any other view (within 1px tolerance)

#### Scenario: Compact inputs have uniform height

- **WHEN** an `<input>` with `ms-input-sm` class is rendered in any view
- **THEN** its computed height SHALL equal the height of any other compact input (within 1px tolerance)

### Requirement: .ms-form-group classes reference CSS variables

The `.ms-form-group` and `.ms-form-group-content` classes in `business/app.css` SHALL use `--ms-input-radius` and `--ms-input-padding` variables instead of hard-coded values.

#### Scenario: ms-form-group uses variable radius

- **WHEN** `.ms-form-group input` or `.ms-form-group select` is rendered
- **THEN** its border-radius SHALL derive from `--ms-input-radius`, not a hard-coded `8px`

### Requirement: .ms-db-edit-input uses variable radius

The `.ms-db-edit-input` class in views SHALL use `--ms-input-radius` instead of the current hard-coded `3px` border-radius.

#### Scenario: DBEdit input uses variable radius

- **WHEN** the DBEdit view renders an input with `.ms-db-edit-input`
- **THEN** its border-radius SHALL derive from `--ms-input-radius`
