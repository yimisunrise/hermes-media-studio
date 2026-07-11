## ADDED Requirements

### Requirement: Workflow file browser
The system SHALL display ComfyUI workflow API JSON files from the `workflows/` directory in a browsable list.

#### Scenario: Workflow list loads
- **WHEN** the user navigates to the generation console
- **THEN** the system SHALL list all `.json` files in the `workflows/` directory
- **AND** SHALL display each workflow's filename and file size

#### Scenario: Workflow parameter preview
- **WHEN** the user clicks on a workflow file
- **THEN** the system SHALL parse and display the workflow parameters: model name, resolution (width/height), sampler, steps, CFG scale, positive/negative prompt (if embedded)
- **AND** SHALL show a summary card with key generation settings

### Requirement: One-click batch generation trigger
The system SHALL allow users to trigger batch asset generation by selecting a workflow, theme, and quantity.

#### Scenario: Trigger generation job
- **WHEN** the user selects a workflow, a theme, sets quantity to 4, and clicks "开始生成"
- **THEN** the system SHALL construct a generation request with the selected parameters
- **AND** SHALL create placeholder assets in `pipeline/01-generating/` with status `"generating"`
- **AND** SHALL display a progress indicator for the new generation job

#### Scenario: Variant strategy selection
- **WHEN** the user opens the batch generation dialog
- **THEN** they SHALL choose a variant strategy: seed variation, prompt variation, or both
- **AND** the system SHALL use the theme's `variations_per_batch` default if not specified

### Requirement: Generation progress monitoring
The system SHALL show real-time progress for active generation jobs.

#### Scenario: Progress display
- **WHEN** a generation job is in progress
- **THEN** the system SHALL display in the Kanban "生成中" column: progress percentage, estimated time remaining, generated count vs total count

#### Scenario: Cancel generation job
- **WHEN** the user clicks "取消" on an active generation job
- **THEN** the system SHALL attempt to abort the job
- **AND** SHALL move any partially generated assets to `pipeline/02-pending-review/`

### Requirement: Auto-metadata injection on generation
The system SHALL automatically write generation parameters into each new asset's `.meta.json` upon generation completion.

#### Scenario: Generated asset has full metadata
- **WHEN** a generation job completes an asset
- **THEN** the `.meta.json` SHALL contain: `generation.prompt`, `generation.negative_prompt`, `generation.seed`, `generation.width`, `generation.height`, `generation.sampler`, `generation.steps`, `generation.cfg`, `generation.model`, `generation.generated_at`
- **AND** SHALL set `status: "pending-review"`
- **AND** SHALL move the asset reference to `pipeline/02-pending-review/`
