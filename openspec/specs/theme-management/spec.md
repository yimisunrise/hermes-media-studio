## ADDED Requirements

### Requirement: User can create a theme

The system SHALL allow users to create a new theme with the following fields:
- name (required): 主题名称
- description (optional): 风格描述
- tags (optional, array): 标签
- aspectRatio (optional, default "9:16"): 画面比例
- color (optional): 主题色

#### Scenario: Create a theme with required fields only
- **WHEN** user fills in the name field and clicks save
- **THEN** a new theme record is created with status "active" and default aspectRatio "9:16"

#### Scenario: Create a theme with all fields
- **WHEN** user fills in name, description, tags, aspectRatio, color and clicks save
- **THEN** a new theme record is created with all provided values

#### Scenario: Create a theme without name
- **WHEN** user clicks save without filling the name field
- **THEN** the system shows a validation error and does not create the record

### Requirement: User can view all themes

The system SHALL display all themes in a list/card view, sorted by creation time descending.
Each theme card SHALL show name, description, tags, color swatch（左侧垂直色条）, and created time.

#### Scenario: View theme list with data
- **WHEN** user navigates to ThemeStrategy view and there are existing themes
- **THEN** the system displays all themes as cards showing name, description, tags, color（左侧垂直色条）, createdAt

#### Scenario: View theme list with no data
- **WHEN** user navigates to ThemeStrategy view and there are no themes
- **THEN** the system shows an empty state message and a button to create the first theme

### Requirement: User can update a theme

The system SHALL allow users to edit any field of an existing theme.
Changes SHALL be persisted immediately upon save.

#### Scenario: Update a theme's name and description
- **WHEN** user edits the name and description of an existing theme and clicks save
- **THEN** the theme record is updated with the new values and updatedAt is refreshed

### Requirement: User can delete a theme

The system SHALL allow users to delete a theme.
The system SHALL show a confirmation dialog before deleting.

#### Scenario: Delete a theme with confirmation
- **WHEN** user clicks delete on a theme and confirms the dialog
- **THEN** the theme record is permanently removed

#### Scenario: Cancel theme deletion
- **WHEN** user clicks delete on a theme and cancels the confirmation dialog
- **THEN** the theme record is not deleted
