## ADDED Requirements

### Requirement: Template-based content creation
The TaskDetail view SHALL provide a "从模板新建" option when creating new content documents.

#### Scenario: Template button is next to new content button
- **WHEN** user opens TaskDetail for a task
- **THEN** in the 关联文稿 section, a "从模板新建" button SHALL be displayed next to the existing "+ 新建文稿" button

#### Scenario: Template selector shows content templates
- **WHEN** user clicks "从模板新建"
- **THEN** a popup/panel SHALL appear listing all content-type templates with name and description
- **THEN** each template SHALL show a preview of the content or its description

#### Scenario: Content is created from template
- **WHEN** user selects a content-type template
- **THEN** a new content record SHALL be created with:
  - title: template name (user can change later)
  - content: template's Markdown content (with `{{变量名}}` placeholders preserved)
  - status: draft
  - version: 1
- **THEN** the ContentEditor SHALL open with the pre-filled content
- **THEN** the user can edit the content freely

#### Scenario: Template variables remain as-is for content
- **WHEN** a content template contains `{{变量名}}` placeholders
- **THEN** they SHALL be inserted verbatim into the editor without substitution
- **THEN** the user can manually edit them
