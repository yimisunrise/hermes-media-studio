## ADDED Requirements

### Requirement: Publish package editor
The system SHALL provide a form-based editor for creating publish packages from approved assets.

#### Scenario: Package editor loads form
- **WHEN** the user opens the publish package editor
- **THEN** the system SHALL display a form with fields: platform (dropdown), theme (dropdown), publish date, publish time, title, subtitle, asset selection grid, body text editor, tags input
- **AND** SHALL pre-populate recommended tags from the selected theme and platform config

#### Scenario: Select assets for package
- **WHEN** the user clicks "+ 添加素材" in the package editor
- **THEN** a modal SHALL open showing approved assets filtered by the selected theme
- **AND** the user SHALL be able to select multiple assets with checkboxes
- **AND** SHALL be able to mark one asset as the cover image

#### Scenario: Generate publish package file
- **WHEN** the user clicks "保存" after filling in all required fields
- **THEN** the system SHALL generate a Markdown file with YAML Frontmatter containing: `platform`, `theme`, `title`, `tags`, `cover`, `assets` list, `status: "scheduled"`, `scheduled_at`
- **AND** SHALL write the file to `pipeline/04-scheduled/<date>/<platform>-<theme>.md`
- **AND** SHALL update each selected asset's `linked_copy` array in `.meta.json`

### Requirement: Platform template system
The system SHALL use platform-specific templates to guide package creation.

#### Scenario: Apply platform template
- **WHEN** the user selects a platform (e.g., "头条") in the package editor
- **THEN** the system SHALL apply platform rules: enforce title max length (30 chars for 头条), suggest image count range (3-9 for 头条), set recommended CTA text, filter applicable tags

#### Scenario: AI-assisted copy generation
- **WHEN** the user clicks "AI 生成文案"
- **THEN** the system SHALL construct a prompt from the selected theme, platform, and asset descriptions
- **AND** SHALL call the Hermes Agent or display a placeholder for future Agent integration

### Requirement: Publish calendar view
The system SHALL display scheduled and published packages in a calendar interface with day/week views.

#### Scenario: Calendar shows scheduled packages
- **WHEN** the calendar view loads
- **THEN** it SHALL display a monthly calendar grid
- **AND** each day cell SHALL show scheduled packages grouped by platform
- **AND** packages with `status: "scheduled"` SHALL be visually distinct from `"published"` packages

#### Scenario: Week view toggle
- **WHEN** the user toggles to week view
- **THEN** the calendar SHALL display a weekly view with 7 columns
- **AND** each column SHALL list that day's scheduled packages with time slots

### Requirement: Drag-drop scheduling
The system SHALL allow users to drag packages onto calendar dates to set or change their schedule.

#### Scenario: Schedule a package by drag
- **WHEN** the user drags a scheduled package from one date to another in the calendar
- **THEN** the system SHALL update the package file's `scheduled_at` field
- **AND** SHALL physically move the file to the new date directory under `pipeline/04-scheduled/`

### Requirement: Publish completion workflow
The system SHALL support marking packages as published with a single click.

#### Scenario: Mark as published
- **WHEN** the user clicks "标记已发布" on a scheduled package
- **THEN** the system SHALL prompt for the published URL
- **AND** SHALL update the package Frontmatter: `status: "published"`, `published_at: now`, `url: <user input>`
- **AND** SHALL move the file from `pipeline/04-scheduled/` to `pipeline/05-published/`
- **AND** SHALL update each linked asset's `publish_history` in `.meta.json`

### Requirement: Publish archive
The system SHALL maintain a permanent archive of all published packages.

#### Scenario: Published packages in archive
- **WHEN** a package is marked as published
- **THEN** the file SHALL reside in `pipeline/05-published/<date>/<platform>-<theme>.md`
- **AND** SHALL retain all original Frontmatter plus `url` and `published_at`
- **AND** SHALL be readable and renderable as Markdown at any future time
