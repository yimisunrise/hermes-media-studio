## ADDED Requirements

### Requirement: User can create a creation task

The system SHALL allow users to create creation tasks from any supported view.
A creation task SHALL require at minimum a `title` and `taskType` (media | copywriting).
Optional fields SHALL include `topicId` (reference to topics), `prompt`, `mode` (manual | agent, default manual).

#### Scenario: Create a media task with prompt
- **WHEN** user creates a task with taskType "media", title "产品宣传片-夏季系列", and a prompt describing the video content
- **THEN** a new task record is created with status "pending", mode "manual", and the given title/taskType/prompt

#### Scenario: Create an agent-mode task
- **WHEN** user creates a task with mode "agent" and provides a topic reference
- **THEN** a new task record is created with status "pending", mode "agent", and is queued for agent pickup

### Requirement: Task status lifecycle

The system SHALL enforce the following status transitions for tasks:
- pending → generating (when work starts)
- generating → review (when result is ready for review)
- review → approved | rejected (when reviewer decides)
- approved | rejected → (terminal states)

#### Scenario: Start generating a pending task
- **WHEN** user clicks "开始生成" on a pending task
- **THEN** the task status changes to "generating"

#### Scenario: Submit for review
- **WHEN** generation completes and result is saved
- **THEN** the task status changes to "review"

#### Scenario: Approve a task
- **WHEN** reviewer clicks "通过" on a task in review
- **THEN** the task status changes to "approved"

#### Scenario: Reject a task
- **WHEN** reviewer clicks "驳回" on a task in review
- **THEN** the task status changes to "rejected"

### Requirement: Tasks are sharded monthly

The system SHALL store task records in monthly-sharded data files.
Tasks created in different months SHALL reside in separate shards.
Cross-month queries SHALL aggregate results from all relevant shards.

#### Scenario: Monthly shard isolation
- **WHEN** tasks are created in January and February
- **THEN** their records are persisted in different shard files under `.database/business/tasks/`

### Requirement: User can list and filter tasks

The system SHALL provide task listing with filtering by:
- Status: pending / generating / review / approved / rejected
- Task type: media / copywriting
- Mode: manual / agent
- Date range: created within a specified period
Sort SHALL default to `-createdAt` (newest first).

#### Scenario: Filter tasks by status
- **WHEN** user selects status filter "review"
- **THEN** only tasks with status "review" are shown, sorted by newest first

#### Scenario: Filter tasks by type
- **WHEN** user selects taskType filter "copywriting"
- **THEN** only copywriting tasks are shown

### Requirement: User can update task result summary

The system SHALL allow setting a `resultSummary` text field on tasks after generation completes.
This SHALL be updated automatically by ResultParser when Agent results are processed.

#### Scenario: Result summary populated by agent
- **WHEN** ResultParser processes a completed agent task
- **THEN** the task's `resultSummary` is updated with the generation result text

### Requirement: System enforces reference integrity for topicId

The system SHALL allow topicId to reference an existing topic in the `topics` table.
If the referenced topic is deleted, the task SHALL still be accessible but the topic reference may be stale.

#### Scenario: Task references a topic
- **WHEN** a task with topicId pointing to an existing topic is created
- **THEN** the topic reference is stored and can be used for cross-filtering
