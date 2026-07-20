## ADDED Requirements

### Requirement: User can edit a task from the task card
The system SHALL allow users to edit an existing task directly from the task card in the task list view.

#### Scenario: Edit button visible on task card
- **WHEN** user views the task list
- **THEN** each task card SHALL display an "编辑" button in the card action area

#### Scenario: Clicking edit opens pre-filled form modal
- **WHEN** user clicks the "编辑" button on a task card
- **THEN** a modal SHALL open with a form pre-filled with the task's current field values

### Requirement: Editable fields
The editing form SHALL allow modification of the following fields. Other fields SHALL be displayed as read-only.

#### Scenario: Title field is editable
- **WHEN** user edits a task
- **THEN** the `title` field SHALL be editable in a text input pre-filled with current value

#### Scenario: Prompt field is editable
- **WHEN** user edits a task
- **THEN** the `prompt` field SHALL be editable in a textarea pre-filled with current value

#### Scenario: Topic selector is editable
- **WHEN** user edits a task
- **THEN** the `topicId` field SHALL be a select dropdown loaded with all available topics, with the current selection highlighted

#### Scenario: Status selector is editable
- **WHEN** user edits a task
- **THEN** the `status` field SHALL be a select dropdown with options: 待处理(pending), 生成中(generating), 待审核(review), 已通过(approved), 已关闭(closed), 已归档(archived), with the current status selected

### Requirement: Immutable fields
The following fields SHALL NOT be editable in the edit form and SHALL be displayed as read-only.

#### Scenario: Task type is read-only
- **WHEN** user opens the edit form
- **THEN** the `taskType` field SHALL display as a read-only label showing the current value

#### Scenario: Task mode is read-only
- **WHEN** user opens the edit form
- **THEN** the `mode` field SHALL display as a read-only label showing the current value

### Requirement: Save edits to task
The system SHALL persist field changes when the user saves the edited task.

#### Scenario: Save updates the record
- **WHEN** user modifies fields and clicks "保存"
- **THEN** the system SHALL call `taskRepo().update(taskId, changedFields)` to persist changes
- **THEN** the modal SHALL close
- **THEN** the task list SHALL refresh to reflect the updated values

#### Scenario: Save failure shows error
- **WHEN** user clicks "保存" and the update API call fails
- **THEN** the system SHALL display an error alert with the failure message
- **THEN** the modal SHALL remain open so the user can retry

### Requirement: Cancel editing
The user SHALL be able to discard changes without saving.

#### Scenario: Cancel closes without saving
- **WHEN** user clicks "取消" button in the edit modal
- **THEN** the modal SHALL close without making any changes
