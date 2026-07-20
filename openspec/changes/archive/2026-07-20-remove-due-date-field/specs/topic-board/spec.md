## REMOVED Requirements

### Requirement: User can create a topic from an idea

**Reason**: `dueDate` 字段从未在前端展示或用于任何业务逻辑，属于冗余数据收集。

**Changes**:
- 从创建选题的必填/可选字段列表中移除 `dueDate (optional): 截止日期`
- 更新 Scenario 描述，移除 "sets a dueDate" 步骤

**Updated requirement**:

The system SHALL allow users to select an idea with status "active" and create a topic from it.
When creating a topic, the user SHALL specify:
- title (required): 选题标题 (pre-filled from idea title)
- contentType (required): graphic / video / text
- themeId (optional, auto-filled from idea's theme): 关联主题

#### Scenario: Create topic from idea
- **WHEN** user selects an active idea, opens the topic creation dialog, confirms title and contentType "video"
- **THEN** a new topic record is created with status "draft", and the source idea's status changes to "used"

### Requirement: User can view all topics

**Reason**: `dueDate` 字段从未在卡片渲染中展示。

**Changes**:
- 从列表展示字段中移除 `dueDate`

**Updated requirement**:

The system SHALL display all topics in a list view, showing:
- title, contentType label, source idea title, associated theme name, status

#### Scenario: View topic list
- **WHEN** user navigates to TopicBoard view
- **THEN** all topics are displayed with title, content type badge, source idea, theme, and status

### Requirement: User can update a topic

**Reason**: `dueDate` 字段从未用于任何业务逻辑。

**Changes**:
- 从可编辑字段列表中移除 `dueDate`

**Updated requirement**:

The system SHALL allow users to edit the title, contentType, and status of a topic.
