## ADDED Requirements

### Requirement: User can create an idea instantly

The system SHALL provide a quick-input field at the top of the IdeaBoard for instant idea creation.
Typing a title and pressing Enter SHALL create a new idea record with status "active".
The quick-input field SHALL be cleared after successful creation.

#### Scenario: Instant idea creation with Enter
- **WHEN** user types "赛博朋克壁纸系列" in the quick-input field and presses Enter
- **THEN** a new idea record is created with title "赛博朋克壁纸系列", status "active", and appears at the top of the list

#### Scenario: Empty quick-input ignored
- **WHEN** user presses Enter with an empty quick-input field
- **THEN** no idea is created and the field remains focused

### Requirement: User can edit idea details

The system SHALL allow users to click on an idea to expand its detail view.
The detail view SHALL support editing and adding these fields:
- title (required): 灵感标题
- summary (optional): 思路描述
- themeId (optional, reference): 关联主题
- tags (optional, array): 标签
- refLinks (optional, array): 参考链接
- status: active / used / archived

#### Scenario: Open idea detail and add description
- **WHEN** user clicks on an existing idea in the list
- **THEN** the idea expands to show editable fields for summary, themeId, tags, refLinks

#### Scenario: Update idea fields
- **WHEN** user modifies the summary and selects a theme, then saves
- **THEN** the idea record is updated with the new values

### Requirement: User can filter ideas

The system SHALL provide filter controls allowing users to filter ideas by:
- Status: active / used / archived
- Theme: select from existing themes
- Tags: text search

#### Scenario: Filter by status
- **WHEN** user selects status filter "used"
- **THEN** only ideas with status "used" are shown

#### Scenario: Filter by theme
- **WHEN** user selects a specific theme from the theme filter
- **THEN** only ideas associated with that theme are shown

### Requirement: User can delete an idea

The system SHALL allow users to delete an idea with confirmation.

#### Scenario: Delete an idea
- **WHEN** user clicks delete on an idea and confirms
- **THEN** the idea record is permanently removed

### Requirement: Used ideas show status indicator

Ideas that have been converted to a topic SHALL display a "used" status indicator.
The status "used" SHALL prevent the idea from being selected for creating another topic.

#### Scenario: Used idea shows non-interactive
- **WHEN** user views an idea with status "used"
- **THEN** the idea card shows a "已选题" badge and the "转为选题" action is hidden
