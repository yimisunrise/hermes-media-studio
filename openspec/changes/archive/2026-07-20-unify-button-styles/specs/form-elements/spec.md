## ADDED Requirements

### Requirement: Button border-radius matches input border-radius

All `<button>` elements using `.ms-btn` class SHALL use the same border-radius as input/select elements (`var(--ms-input-radius)`). No button SHALL use a different border-radius variable or hard-coded value for its corner rounding.

#### Scenario: Button uses same border-radius as input

- **WHEN** a `<button>` with class `.ms-btn` is rendered
- **THEN** its computed border-radius SHALL equal `var(--ms-input-radius)`

#### Scenario: Button-sm uses same border-radius

- **WHEN** a `<button>` with class `.ms-btn-sm` is rendered
- **THEN** its computed border-radius SHALL equal `var(--ms-input-radius)`

### Requirement: Button height matches input height

The `.ms-btn` class SHALL produce the same computed height as `.ms-input` (same vertical padding, same font-size). The `.ms-btn-sm` class SHALL produce the same height as `.ms-input-sm` (via `--ms-input-sm-padding` and `--ms-input-sm-font-size`).

#### Scenario: Standard button height equals standard input height

- **WHEN** a `.ms-btn` and a `.ms-input` are rendered side by side
- **THEN** their computed heights SHALL be equal (within 1px tolerance)

#### Scenario: Compact button height equals compact input height

- **WHEN** a `.ms-btn-sm` and a `.ms-input-sm` are rendered side by side
- **THEN** their computed heights SHALL be equal (within 1px tolerance)

### Requirement: Danger button variant

The system SHALL provide a `.ms-btn-danger` CSS class that styles buttons for destructive actions (delete, remove, confirm dangerous operation). The class SHALL use `var(--ms-danger)` for background and border-color, with white text.

#### Scenario: Danger button uses danger color

- **WHEN** a `<button>` has class `ms-btn-danger`
- **THEN** its background SHALL be `var(--ms-danger)` and text color SHALL be `#fff`

### Requirement: No inline style overrides for button sizing/radius

No view file SHALL set `style.cssText`, `style.padding`, `style.borderRadius`, `style.height`, or `style.fontSize` on `<button>` elements for the purpose of sizing or corner rounding. All button sizing and border-radius SHALL be controlled through CSS classes and CSS variables.

#### Scenario: No inline padding on delete confirm buttons

- **WHEN** any "确认删除" button is rendered across all views
- **THEN** its SHALL NOT have inline `padding`, `borderRadius`, or `fontSize` in `style` attribute or `.style.cssText`

#### Scenario: No inline styles on danger buttons

- **WHEN** any danger button is rendered in any view
- **THEN** its SHALL NOT have inline `padding`, `borderRadius`, or `fontSize` in `.style.cssText`

## MODIFIED Requirements

### Requirement: CSS variable definitions for form elements

The system SHALL define the following CSS custom properties in `:root {}` within `framework/app.css`:

- `--ms-input-radius`: border-radius for input/select/textarea/button, defaulting to `var(--ms-radius-sm, 4px)`
- `--ms-input-padding`: padding for input/select/textarea/button (horizontal), defaulting to `6px 12px`
- `--ms-input-font-size`: font-size for input/select/textarea/button, defaulting to `13px`
- `--ms-input-sm-padding`: padding for compact variant, defaulting to `3px 8px`
- `--ms-input-sm-font-size`: font-size for compact variant, defaulting to `12px`

#### Scenario: Variables are defined in :root

- **WHEN** the system loads `framework/app.css`
- **THEN** the `:root` selector SHALL contain all five `--ms-input-*` CSS custom properties with the specified default values

### Requirement: Unified border-radius for all form elements

All input, select, textarea, **and button** elements across every view SHALL use `var(--ms-input-radius)` as their border-radius. No element SHALL use a hard-coded border-radius value (3px, 8px) for its form element styling.

#### Scenario: Input uses CSS variable for border-radius

- **WHEN** an `<input>` element is rendered in any view
- **THEN** its computed border-radius SHALL equal `var(--ms-input-radius)`

#### Scenario: Select uses CSS variable for border-radius

- **WHEN** a `<select>` element is rendered in any view
- **THEN** its computed border-radius SHALL equal `var(--ms-input-radius)`

#### Scenario: Textarea uses CSS variable for border-radius

- **WHEN** a `<textarea>` element is rendered in any view
- **THEN** its computed border-radius SHALL equal `var(--ms-input-radius)`

#### Scenario: Button uses CSS variable for border-radius

- **WHEN** a `<button>` element with class `.ms-btn` or `.ms-btn-sm` is rendered in any view
- **THEN** its computed border-radius SHALL equal `var(--ms-input-radius)`

### Requirement: No inline style overrides for padding/radius/height on form elements

No view file SHALL set `style.cssText`, `style.padding`, `style.borderRadius`, or `style.height` directly on input, select, textarea, **or button** elements for the purpose of sizing or corner rounding. All sizing and border-radius SHALL be controlled through CSS classes and CSS variables.

#### Scenario: Remove inline padding from IdeaBoard filter

- **WHEN** the system renders the IdeaBoard filter bar
- **THEN** its input and button elements SHALL NOT have inline `padding` or `borderRadius` in `style.cssText`

#### Scenario: Remove inline padding from TopicBoard filter

- **WHEN** the system renders the TopicBoard filter bar
- **THEN** its input and button elements SHALL NOT have inline `padding` or `borderRadius` in `style.cssText`

#### Scenario: Remove inline padding from PublishManager config

- **WHEN** the system renders PublishManager platform configuration
- **THEN** its input and button elements SHALL NOT have inline `padding` or `height` in `style.cssText`

#### Scenario: Remove inline danger button styles

- **WHEN** any confirm-delete button is rendered in any view
- **THEN** its SHALL NOT have inline `padding`, `borderRadius`, `fontSize`, or `background` in `style` attribute or `.style.cssText`

### Requirement: Consistent implicit height across views

Input, select, textarea, **and button** elements using the standard class SHALL have the same computed height (~32px) regardless of which view renders them. Elements using `.ms-input-sm` or `.ms-btn-sm` SHALL have the same compact height (~26px).

#### Scenario: Standard elements have uniform height

- **WHEN** an `<input>` or `<button>` with standard class is rendered in any view
- **THEN** its computed height SHALL equal the height of a standard element in any other view (within 1px tolerance)

#### Scenario: Compact elements have uniform height

- **WHEN** an element with `ms-input-sm` or `ms-btn-sm` class is rendered in any view
- **THEN** its computed height SHALL equal the height of any other compact element (within 1px tolerance)
