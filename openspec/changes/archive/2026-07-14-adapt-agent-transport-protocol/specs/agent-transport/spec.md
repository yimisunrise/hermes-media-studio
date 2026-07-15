## ADDED Requirements

### Requirement: Create task
The system SHALL allow creating a new Agent task with job.json + brief.md + optional files.

#### Scenario: Create task successfully
- **WHEN** `createTask('comfyui-generate', briefMarkdown)` is called
- **THEN** a UUID directory SHALL be created under `.agent/tasks/<uuid>/`
- **AND** `job.json` SHALL be written with `{ type, taskId, status: 'pending', createdAt }`
- **AND** `brief.md` SHALL be written with the provided Markdown content
- **AND** the UUID SHALL be returned

#### Scenario: Create task with files
- **WHEN** `createTask(type, brief, ['./ref.png'])` is called
- **THEN** `files/ref.png` SHALL be copied into the task directory

#### Scenario: Create task fails partially
- **WHEN** writing `brief.md` fails
- **THEN** the entire task directory SHALL be removed
- **AND** the error SHALL be thrown

### Requirement: Scan pending tasks
The system SHALL scan `.agent/tasks/` for pending tasks by reading `job.json`.

#### Scenario: Scan finds tasks
- **WHEN** `scan()` is called and tasks exist
- **THEN** each task SHALL be returned as `{ uuid, job, dir }`
- **AND** `job` SHALL be the parsed content of `job.json`

#### Scenario: Scan ignores non-JSON directories
- **WHEN** a directory under `.agent/tasks/` has no `job.json`
- **THEN** it SHALL be silently skipped

#### Scenario: Scan with empty tasks directory
- **WHEN** `.agent/tasks/` does not exist or is empty
- **THEN** an empty array SHALL be returned

### Requirement: Pickup task
The system SHALL move a task from `.agent/tasks/<uuid>/` to `.agent/processing/<uuid>/` to prevent duplicate pickup.

#### Scenario: Pickup succeeds
- **WHEN** `pickup(uuid)` is called and the task exists
- **THEN** the directory SHALL be moved to `.agent/processing/<uuid>/`
- **AND** `true` SHALL be returned

#### Scenario: Pickup with missing task
- **WHEN** `pickup(uuid)` is called and the task does not exist
- **THEN** `false` SHALL be returned silently

### Requirement: Stage result
The system SHALL create a result directory and cleanup the processing directory after a task completes, but SHALL NOT write any result file content.

#### Scenario: Stage result successfully
- **WHEN** `stageResult(uuid)` is called
- **THEN** `.agent/results/<uuid>/` SHALL be created
- **AND** `.agent/processing/<uuid>/` SHALL be deleted

#### Scenario: Stage result with missing processing dir
- **WHEN** `stageResult(uuid)` is called and processing dir does not exist
- **THEN** the result directory SHALL still be created
- **AND** the function SHALL NOT throw
- **AND** `true` SHALL be returned

### Requirement: Collect results
The system SHALL scan `.agent/results/` for completed results and return their UUIDs and raw result.md text.

#### Scenario: Collect finds results
- **WHEN** `collect()` is called and results exist
- **THEN** each result SHALL be returned as `{ uuid, resultText }`
- **AND** `resultText` SHALL be the raw content of `result.md`
- **AND** the result directory SHALL be deleted after reading

#### Scenario: Collect with empty results directory
- **WHEN** `.agent/results/` does not exist or is empty
- **THEN** an empty array SHALL be returned

### Requirement: Read single result
The system SHALL allow reading a single result by UUID.

#### Scenario: Read result exists
- **WHEN** `readResult(uuid)` is called and the result exists
- **THEN** the raw content of `.agent/results/<uuid>/result.md` SHALL be returned

#### Scenario: Read result not found
- **WHEN** `readResult(uuid)` is called and the result does not exist
- **THEN** `null` SHALL be returned

### Requirement: Check pending status
The system SHALL check whether a scanned task has `status: 'pending'`.

#### Scenario: Task is pending
- **WHEN** `isPendingTask(task)` is called with `task.job.status === 'pending'`
- **THEN** `true` SHALL be returned

#### Scenario: Task is not pending
- **WHEN** `isPendingTask(task)` is called with any other status
- **THEN** `false` SHALL be returned
