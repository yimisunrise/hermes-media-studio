## ADDED Requirements

### Requirement: AgentTaskPoller SHALL collect completed agent results
The system SHALL provide an AgentTaskPoller class that scans `.agent/results/` and returns completed results for the extension to consume.

#### Scenario: Collect returns all uncollected results
- **WHEN** `agentTaskPoller.collect()` is called and `.agent/results/{uuid}/result.json` exists
- **THEN** it returns `[{ uuid, result, files }]` with the parsed result and available file attachments

#### Scenario: No results returns empty array
- **WHEN** `.agent/results/` is empty
- **THEN** `collect()` returns `[]`

### Requirement: AgentTaskPoller SHALL provide scan/pickup/deliver for agent-side use
The system SHALL expose `scan()` to list pending tasks, `pickup(uuid)` to claim a task (mv to processing/), and `deliver(uuid, result, files)` to write results.

#### Scenario: Scan lists pending task directories
- **WHEN** `scan()` is called and `.agent/tasks/{uuid}/` exists
- **THEN** it returns `[{ uuid, job, dir }]` with parsed job.json content

#### Scenario: Pickup moves task to processing
- **WHEN** `pickup("uuid-123")` is called
- **THEN** `.agent/tasks/uuid-123/` is moved to `.agent/processing/uuid-123/`

#### Scenario: Deliver writes result and cleans processing
- **WHEN** `deliver("uuid-123", { status: "success", output: {...} }, [...files])` is called
- **THEN** result.json is written to `.agent/results/uuid-123/`, files are copied, and `.agent/processing/uuid-123/` is removed

### Requirement: AgentTaskPoller SHALL be stateless
Every method call SHALL read the current filesystem state directly, not rely on in-memory state.

#### Scenario: Consecutive scans return fresh state
- **WHEN** `scan()` is called twice with an intervening pickup
- **THEN** the second call no longer includes the picked-up task

### Requirement: AgentTaskPoller SHALL operate through WorkspaceAPI
All file operations (list, read, write, rename, delete) SHALL go through the WorkspaceAPI, compatible with remote file access.

#### Scenario: All operations use API
- **WHEN** any AgentTaskPoller method is called
- **THEN** it uses `api.list()`, `api.file()` (read), `api.writeJSON()`, `api.rename()`, `api.delete()` exclusively
