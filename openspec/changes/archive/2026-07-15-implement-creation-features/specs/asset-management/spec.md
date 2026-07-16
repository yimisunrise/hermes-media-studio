## ADDED Requirements

### Requirement: AssetGallery view

The system SHALL provide a gallery view for browsing and managing media assets.

#### Scenario: Browse assets in grid mode
- **WHEN** the user navigates to the asset gallery view
- **THEN** the system SHALL display assets in a grid layout with thumbnail previews for image assets and type icons for video/audio/document assets
- **AND** the grid SHALL show: thumbnail/icon, filename, type badge, file size, creation date

#### Scenario: Filter assets
- **WHEN** the user selects filters (type, date range, associated task)
- **THEN** the system SHALL query `assetRepo.find({ filter: {...} })` and re-render the grid

#### Scenario: Upload media file
- **WHEN** the user uploads a media file
- **THEN** the system SHALL copy the file to `workspace/assets/YYYY-MM/{uuid}-{filename}`
- **AND** create a record via `assetRepo.create(...)` with filePath, fileName, type, mimeType, fileSize
- **AND** display the new asset in the gallery immediately

#### Scenario: Delete asset
- **WHEN** the user confirms deletion of an asset
- **THEN** the system SHALL delete the file from `workspace/assets/` and the record via `assetRepo.delete(id)`

### Requirement: Asset storage on filesystem

The system SHALL store media files on the filesystem and metadata in the database.

#### Scenario: File organization
- **WHEN** a media file is uploaded
- **THEN** the file SHALL be stored at `workspace/assets/YYYY-MM/{uuid}-{originalFilename}`
- **AND** the `assets` database record SHALL contain `filePath`, `fileName`, `mimeType`, `fileSize`, `type`

#### Scenario: Thumbnail generation
- **WHEN** an image is uploaded
- **THEN** the system SHOULD generate a thumbnail reference (stored as path, not in DB blob)

### Requirement: Task asset association

The system SHALL associate assets with tasks for context.

#### Scenario: View task assets
- **WHEN** the user opens a task detail view
- **THEN** the system SHALL list all assets where `asset.taskId === task.id`
- **AND** display each asset with thumbnail/icon, filename, and actions (preview, download, remove association)

#### Scenario: Add asset to task
- **WHEN** the user uploads a file from the task detail view
- **THEN** the system SHALL create the asset with `taskId` set to the current task's id
- **AND** display it immediately in the task's asset list

## MODIFIED Requirements

### Requirement: Assets database table (MODIFIED from original creation-module-redesign spec)

The existing `assets` table definition (in business-db.init-def.js) SHALL remain as-is with its existing monthly shard, id, taskId, type, url/filePath, status, createdAt/updatedAt fields. The current definition is sufficient for this implementation.

#### Scenario: Existing fields suffice
- **WHEN** the system creates assets
- **THEN** it SHALL use the existing `assets` table with fields: id, taskId, topicId, type, fileName, filePath, mimeType, fileSize, thumbnailPath, metadata, status, createdAt, updatedAt
