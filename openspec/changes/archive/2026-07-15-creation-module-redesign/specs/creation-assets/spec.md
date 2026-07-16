## ADDED Requirements

### Requirement: Assets are associated with a creation task

The system SHALL allow creating assets that belong to a specific task.
Each asset SHALL reference a `taskId` pointing to the `tasks` table.
An asset SHALL require at minimum a `type` (image | video | audio) and a `url` or `filePath`.

#### Scenario: Create asset from task result
- **WHEN** a media generation task completes and produces a video file
- **THEN** an asset record is created with type "video", the file path, taskId pointing to the completed task, and status "completed"

### Requirement: Asset status lifecycle

Assets SHALL have status: generating → completed | failed.
Default status on creation SHALL be "generating".

#### Scenario: Asset generation completes
- **WHEN** the generation result is finalized and file is confirmed present
- **THEN** the asset status is updated to "completed"

#### Scenario: Asset generation fails
- **WHEN** generation encounters an error
- **THEN** the asset status is updated to "failed"

### Requirement: Assets support metadata

The system SHALL store a `metadata` object field on assets for extensible information.
This SHALL include optional fields like dimensions, duration, file size, format.

#### Scenario: Asset metadata is stored
- **WHEN** an asset of type "image" is created with metadata containing dimensions and format
- **THEN** the metadata object is persisted alongside the asset record

### Requirement: Assets are sharded monthly

The system SHALL store asset records in monthly-sharded data files.
Sharding SHALL follow the same strategy as tasks for consistency.

#### Scenario: Assets sharded by month
- **WHEN** assets are created in different months
- **THEN** they are stored in separate monthly shard files
