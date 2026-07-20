## ADDED Requirements

### Requirement: Template data model
The system SHALL store templates as records in a `templates` table within the `business` database, managed through the existing `DataRepository`.

#### Scenario: Template schema is defined
- **WHEN** the system initializes
- **THEN** a `templates` table SHALL be created with fields: id (uuid), name (string, required), type (enum: brief/content), content (text), description (text), tags (array), createdAt (datetime), updatedAt (datetime)

#### Scenario: Template record is created
- **WHEN** user creates a new template via the DataRepository create method
- **THEN** a new record SHALL be stored in `.database/business/templates/data.json` with auto-generated uuid and timestamps

### Requirement: Template CRUD management view
The system SHALL provide a `TemplatesView` at the `#templates` route for managing templates.

#### Scenario: View displays all templates grouped by type
- **WHEN** user navigates to `#templates`
- **THEN** the view SHALL display templates with a tab/switch to filter between "创作简报" (brief) and "文稿内容" (content) types
- **THEN** each template card SHALL show name, description, creation time

#### Scenario: User creates a new template
- **WHEN** user clicks "新建模板" button
- **THEN** a form SHALL open with fields: 模板名称 (required), 模板类型 (brief/content), 模板内容 (textarea, Markdown), 模板说明, 标签
- **THEN** after submitting, the new template SHALL appear in the template list

#### Scenario: User edits an existing template
- **WHEN** user clicks on a template card or edit button
- **THEN** the same form SHALL open pre-filled with existing values
- **THEN** after saving, the template record SHALL be updated

#### Scenario: User deletes a template
- **WHEN** user triggers delete on a template
- **THEN** a confirmation dialog SHALL appear
- **THEN** after confirming, the template SHALL be permanently removed

#### Scenario: Empty state is shown
- **WHEN** no templates exist for the selected type
- **THEN** the view SHALL display empty state text "暂无模板，点击新建" with a create button

### Requirement: Template type filtering
The view SHALL support filtering templates by the `type` field (brief/content).

#### Scenario: Type tab switching
- **WHEN** user switches from "创作简报" tab to "文稿内容" tab
- **THEN** the list SHALL update to show only content-type templates
- **THEN** the active tab SHALL be visually highlighted
