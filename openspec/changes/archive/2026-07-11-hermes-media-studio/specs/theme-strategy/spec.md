## ADDED Requirements

### Requirement: Theme CRUD management
The system SHALL allow users to create, read, update, and delete theme configurations.

#### Scenario: View theme list
- **WHEN** the user opens the theme strategy center
- **THEN** the system SHALL list all theme directories under `themes/`
- **AND** SHALL read and display each `theme.json` configuration

#### Scenario: Create new theme
- **WHEN** the user fills in the new theme form and clicks "创建"
- **THEN** the system SHALL create a new directory `themes/<theme-name>/`
- **AND** SHALL write a default `theme.json` with: `name`, `slug`, `description`, `category`, empty `style`, `generation` defaults, `publishing` defaults, empty `performance`

#### Scenario: Edit theme configuration
- **WHEN** the user modifies a theme's `theme.json` fields and clicks "保存"
- **THEN** the system SHALL update the `theme.json` file with the new values
- **AND** SHALL validate required fields before saving

### Requirement: Theme performance comparison
The system SHALL provide a side-by-side comparison of themes based on publishing data.

#### Scenario: Compare themes
- **WHEN** the user selects two or more themes for comparison
- **THEN** the system SHALL display a comparison table with columns: publish count, avg views, avg likes, engagement rate, viral count, inventory count
- **AND** SHALL highlight the winner in each metric

### Requirement: Theme inventory warning
The system SHALL show inventory levels for each theme and warn when stock is low.

#### Scenario: Low inventory alert
- **WHEN** a theme has fewer than 5 approved assets ready for publishing
- **THEN** a low-inventory warning SHALL appear next to that theme in the list
- **AND** SHALL show a "建议生成" (suggest generation) button that navigates to the generation console

### Requirement: Prompt template management
The system SHALL support per-theme prompt templates stored in `themes/<name>/prompt-template.md`.

#### Scenario: Edit prompt template
- **WHEN** the user opens a theme's prompt template editor
- **THEN** the system SHALL load and display `themes/<name>/prompt-template.md` in a text editor
- **AND** SHALL save changes back to the same file
