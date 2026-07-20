## ADDED Requirements

### Requirement: Template selection in task creation form
The task creation form (`TasksView._showCreateForm()`) SHALL provide a way for users to select a brief-type template to pre-fill the creative brief textarea.

#### Scenario: Template selector is available
- **WHEN** user opens the "新建任务" modal
- **THEN** a "选择模板" button SHALL be displayed above or beside the 创作简报 textarea

#### Scenario: Template selector shows brief templates
- **WHEN** user clicks "选择模板"
- **THEN** a popup/panel SHALL appear listing all brief-type templates with name and description
- **THEN** the list SHALL include an option "(不使用模板)" to clear selection

#### Scenario: Selected template fills the brief
- **WHEN** user selects a template from the list
- **THEN** the template's Markdown content SHALL be inserted into the 创作简报 textarea
- **THEN** any existing content in the textarea SHALL be replaced
- **THEN** the selector popup SHALL close
- **THEN** the button text SHALL update to show the selected template name

#### Scenario: Template variables remain as-is
- **WHEN** a template contains `{{变量名}}` placeholders
- **THEN** they SHALL be inserted verbatim into the textarea without any substitution
- **THEN** user can manually edit them after insertion
