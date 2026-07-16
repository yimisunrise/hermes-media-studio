## ADDED Requirements

### Requirement: BriefBuilder generates agent job files

The system SHALL provide a BriefBuilder module that converts a `tasks` record into the agent-consumable format:
- `brief.md`: Human-readable task description with title, prompt, topic context
- `job.json`: Structured job definition with taskId, type, mode, and prompt

The generated files SHALL be placed in the `.agent/jobs/<taskId>/` directory.

#### Scenario: Generate brief for media task
- **WHEN** BriefBuilder is called for a media task with title "产品宣传片" and a detailed prompt
- **THEN** a `brief.md` is generated with the title and prompt, and a `job.json` is generated with taskId, taskType "media", mode, and prompt

#### Scenario: Brief includes topic context
- **WHEN** the task has a topicId reference to an existing topic
- **THEN** the brief SHALL include the topic's title and summary as context

### Requirement: ResultParser processes agent output

The system SHALL provide a ResultParser module that reads agent output from `.agent/results/<taskId>/` directory.
The parser SHALL:
- Update the task's `resultSummary` and status
- Create `assets` records for media generation results
- Create `scripts` records for copywriting generation results

#### Scenario: Parse media generation result
- **WHEN** ResultParser finds a result for a media task containing a video file path and metadata
- **THEN** it updates task status to "review", creates an asset record with type "video" and the file path, and sets asset status to "completed"

#### Scenario: Parse copywriting result
- **WHEN** ResultParser finds a result for a copywriting task containing script content
- **THEN** it updates task status to "review", creates a script record with version 1, status "draft", and the content

### Requirement: AgentHandler orchestrates the full agent flow

The system SHALL provide an AgentHandler that:
1. Calls BriefBuilder to generate job files
2. Triggers AgentTaskPoller to pick up and dispatch the job
3. Polls for result completion
4. Calls ResultParser to process results
5. Returns updated task/asset/script records

#### Scenario: Full agent flow for media task
- **WHEN** AgentHandler.process() is called for a pending media task with mode "agent"
- **THEN** job files are generated, agent dispatch is triggered, result is polled, and on completion the task status becomes "review" with an associated asset

#### Scenario: Agent flow timeout
- **WHEN** agent does not complete within the configured timeout period
- **THEN** AgentHandler returns a timeout error and task status remains "generating"
