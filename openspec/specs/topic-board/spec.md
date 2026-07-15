## ADDED Requirements

### Requirement: User can create a topic from an idea

The system SHALL allow users to select an idea with status "active" and create a topic from it.
When creating a topic, the user SHALL specify:
- title (required): 选题标题 (pre-filled from idea title)
- contentType (required): graphic / video / text
- dueDate (optional): 截止日期
- themeId (optional, auto-filled from idea's theme): 关联主题

Upon topic creation, the source idea's status SHALL automatically change to "used".

#### Scenario: Create topic from idea with all fields
- **WHEN** user selects an active idea, opens the topic creation dialog, confirms title and contentType "video", sets a dueDate
- **THEN** a new topic record is created with status "draft", and the source idea's status changes to "used"

#### Scenario: Create topic without contentType
- **WHEN** user tries to create a topic without selecting contentType
- **THEN** the system shows a validation error and does not create the topic

#### Scenario: Used idea cannot be re-selected
- **WHEN** user opens the idea selection list in topic creation
- **THEN** ideas with status "used" are either hidden or shown as disabled

### Requirement: User can view all topics

The system SHALL display all topics in a list view, showing:
- title, contentType label, source idea title, associated theme name, status, dueDate

#### Scenario: View topic list
- **WHEN** user navigates to TopicBoard view
- **THEN** all topics are displayed with title, content type badge, source idea, theme, status, and due date

### Requirement: User can update a topic

The system SHALL allow users to edit the title, contentType, dueDate, and status of a topic.

#### Scenario: Mark topic as completed
- **WHEN** user changes a topic's status from "draft" to "completed"
- **THEN** the topic record is updated with the new status

### Requirement: User can cancel a topic

The system SHALL allow users to set a topic's status to "cancelled".
When a topic is cancelled, the source idea's status SHALL remain as "used" (not reverted to "active").

#### Scenario: Cancel a topic
- **WHEN** user sets a topic status to "cancelled"
- **THEN** the topic status is "cancelled" and the source idea remains "used"

### Requirement: Topic status lifecycle

Topics SHALL have the following status states:
- draft: newly created
- in_progress: actively being worked on
- completed: finished
- cancelled: abandoned

#### Scenario: Status transition draft → in_progress
- **WHEN** user changes topic status from "draft" to "in_progress"
- **THEN** the system updates the topic status without side effects on associated records
