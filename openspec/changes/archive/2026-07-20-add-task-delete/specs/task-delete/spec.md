## ADDED Requirements

### Requirement: User can delete a task from task list
The system SHALL allow users to permanently delete a task from the task management view.

#### Scenario: Delete task with confirmation
- **WHEN** user clicks the delete button on a task card
- **THEN** system displays a confirmation dialog
- **WHEN** user confirms deletion
- **THEN** system permanently removes the task record from the data store
- **THEN** system refreshes the task list to reflect the deletion

#### Scenario: Cancel deletion
- **WHEN** user clicks the delete button on a task card
- **THEN** system displays a confirmation dialog
- **WHEN** user cancels the dialog
- **THEN** system does NOT delete the task
- **THEN** system closes the dialog without other side effects

#### Scenario: Delete task with associated assets/contents
- **WHEN** user attempts to delete a task that has associated assets or contents
- **THEN** system shows a warning in the confirmation dialog that related materials will be orphaned
- **WHEN** user confirms
- **THEN** system deletes the task record only
- **THEN** associated assets and contents remain in the database as orphaned records
