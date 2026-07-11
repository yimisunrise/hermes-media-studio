## ADDED Requirements

### Requirement: Desktop rail button injection
The extension SHALL inject a Media Studio button into the WebUI desktop sidebar rail (`.rail`).

#### Scenario: Inject button at rail bottom
- **WHEN** the extension script loads and DOM is ready (`document.readyState === 'complete'` or `DOMContentLoaded` fires)
- **THEN** a `<button class="rail-btn ms-rail-btn" data-panel="media-studio">` SHALL be inserted before the final element in `.rail`

#### Scenario: Button with icon and label
- **WHEN** the button is injected into `.rail`
- **THEN** it SHALL contain a `🎬` icon and the label `Media Studio`

#### Scenario: Idempotent injection
- **WHEN** the extension script loads but a `.ms-rail-btn` element already exists
- **THEN** no duplicate button SHALL be injected

#### Scenario: Separator before button
- **WHEN** the button is injected
- **THEN** an `<hr class="ms-rail-separator">` SHALL be inserted before the button if no separator already exists

#### Scenario: Click activates Media Studio
- **WHEN** the user clicks the `.ms-rail-btn`
- **THEN** the button SHALL gain an `active` class, and all other `.nav-tab` buttons SHALL lose their `active` class

### Requirement: Active state visual styling
The injected button SHALL visually indicate its active state using WebUI CSS variables.

#### Scenario: Active state color
- **WHEN** the `.ms-rail-btn` has the `active` class
- **THEN** its `color` SHALL be `var(--primary, #0098ff)` and its left border SHALL be `2px solid var(--primary, #0098ff)`

#### Scenario: Hover state
- **WHEN** the user hovers over `.ms-rail-btn`
- **THEN** its `background-color` SHALL use `var(--background-modifier-hover)` if available

### Requirement: WebUI theme compatibility
The button styling SHALL inherit from WebUI CSS variables with sensible fallbacks.

#### Scenario: Light/dark mode
- **WHEN** WebUI toggles between light and dark themes
- **THEN** the `.ms-rail-btn` SHALL automatically adapt without requiring re-render

#### Scenario: CSS variable fallback
- **WHEN** a WebUI CSS variable (e.g., `--primary`) is undefined
- **THEN** a hardcoded fallback color SHALL be used: `#0098ff` for accent, `#333` for text
