## ADDED Requirements

### Requirement: Card uses ms-item-card CSS class

Every card item in list views SHALL use the `ms-item-card` CSS class for the outer container element.

#### Scenario: ThemeStrategy cards use ms-item-card
- **GIVEN** ThemeStrategy view is rendered
- **WHEN** inspecting card container elements
- **THEN** each card SHALL have `class="ms-item-card"` (not inline `style.cssText`)

#### Scenario: IdeaBoard cards use ms-item-card
- **GIVEN** IdeaBoard view is rendered
- **WHEN** inspecting card container elements
- **THEN** each card SHALL have `class="ms-item-card"`

#### Scenario: TasksView cards use ms-item-card
- **GIVEN** TasksView is rendered
- **WHEN** inspecting card container elements
- **THEN** each card SHALL have `class="ms-item-card"`

#### Scenario: TemplatesView cards use ms-item-card
- **GIVEN** TemplatesView is rendered
- **WHEN** inspecting card container elements
- **THEN** each card SHALL have `class="ms-item-card"`

#### Scenario: PublishManager uses cards not table
- **GIVEN** PublishManager is rendered
- **WHEN** inspecting the list container
- **THEN** items SHALL be rendered as `div.ms-item-card` elements, NOT `table`/`tr` elements

#### Scenario: PlatformConfig uses cards not table
- **GIVEN** PlatformConfig is rendered
- **WHEN** inspecting the list container
- **THEN** items SHALL be rendered as `div.ms-item-card` elements, NOT `table`/`tr` elements

### Requirement: Action buttons use ms-item-card-actions CSS class

Action buttons (edit, delete, etc.) on each card SHALL be contained in a `div` with `class="ms-item-card-actions"`, which is hidden by default and shown on card hover via CSS.

#### Scenario: Buttons hidden by default, shown on hover
- **GIVEN** a card list view is rendered
- **WHEN** no card is hovered
- **THEN** `.ms-item-card-actions` SHALL have `display: none` (computed style)
- **WHEN** user hovers over a card
- **THEN** `.ms-item-card-actions` SHALL have `display: flex` (computed style)

#### Scenario: No inline display style on actions container
- **GIVEN** a card list view is rendered
- **WHEN** inspecting `.ms-item-card-actions` elements
- **THEN** NONE SHALL have `style` attribute with `display` property

### Requirement: Button click does not trigger card click

Every action button (inside `ms-item-card-actions`) SHALL call `e.stopPropagation()` in its click handler.

#### Scenario: Edit button click does not open card modal
- **GIVEN** a card with an edit button is rendered
- **WHEN** user clicks the edit button
- **THEN** the card click event SHALL NOT fire

#### Scenario: Delete button click does not open card modal
- **GIVEN** a card with a delete button is rendered
- **WHEN** user clicks the delete button
- **THEN** the card click event SHALL NOT fire

### Requirement: Card click opens detail/edit Modal

Each card SHALL have a `click` event handler that opens a Modal dialog for viewing/editing the item's details.

#### Scenario: IdeaBoard card click opens Modal (not expand)
- **GIVEN** IdeaBoard view is rendered with cards
- **WHEN** user clicks a card
- **THEN** a Modal dialog SHALL open (not an inline expand/collapse)

#### Scenario: TemplatesView card click opens Modal
- **GIVEN** TemplatesView is rendered with cards
- **WHEN** user clicks a card
- **THEN** a Modal dialog SHALL open (not do nothing)

#### Scenario: All card views respect same click behavior
- **GIVEN** any card list view (IdeaBoard, TopicBoard, ThemeStrategy, TasksView, TemplatesView, PublishManager, PlatformConfig)
- **WHEN** user clicks a card
- **THEN** a Modal dialog SHALL open

### Requirement: Delete confirmation uses Modal, not window.confirm

All delete operations on cards SHALL use the project's Modal dialog class for confirmation, with the message text displayed and a danger-styled confirmation button.

#### Scenario: TemplatesView delete uses Modal
- **GIVEN** TemplatesView is rendered
- **WHEN** user clicks the delete button on a template card
- **THEN** a Modal dialog SHALL appear (not `window.confirm`)

#### Scenario: Delete Modal has danger button
- **GIVEN** a delete confirmation Modal is open
- **WHEN** inspecting the confirm button
- **THEN** the confirm button SHALL have `style="color:var(--ms-danger)"` or equivalent danger styling

### Requirement: Status badges use ms-task-status-badge class

All status-related `<span>` elements on cards SHALL use the `ms-task-status-badge` CSS class.

#### Scenario: ThemeStrategy status badges
- **GIVEN** ThemeStrategy is rendered
- **WHEN** inspecting status indicator elements
- **THEN** they SHALL use `class="ms-task-status-badge"`

### Requirement: Empty state uses ms-empty class

When a list view has no items, it SHALL render an empty state element with `class="ms-empty"` and an inline SVG icon (not emoji).

#### Scenario: Empty list shows SVG not emoji
- **GIVEN** a list view has zero items
- **WHEN** inspecting the empty state element
- **THEN** the icon SHALL be an `<svg>` element, NOT an emoji character
