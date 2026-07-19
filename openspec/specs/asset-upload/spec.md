## MODIFIED Requirements

### Requirement: Asset upload via API

The system SHALL allow uploading asset files through the shared `AssetUploader` module, which uses binary write for raw file storage.

#### Scenario: Upload image file in AssetGallery
- **WHEN** user selects an image file in AssetGallery upload dialog
- **THEN** AssetGallery calls `AssetUploader.uploadFile(file, api, dataRepo)`
- **THEN** the file is stored as raw binary via `api.writeBinary()`
- **THEN** the asset record is created via DataRepository with correct filePath, fileName, mimeType, and fileSize

#### Scenario: Upload image file in TaskDetail
- **WHEN** user selects an image file in TaskDetail upload area
- **THEN** TaskDetail calls `AssetUploader.uploadFile(file, api, dataRepo)`
- **THEN** the file is stored as raw binary via `api.writeBinary()`
- **THEN** the asset record is created via DataRepository with correct filePath, fileName, mimeType, and fileSize

## ADDED Requirements

### Requirement: File cleanup on asset deletion

The system SHALL delete the associated disk file when an asset record is deleted.

#### Scenario: Delete asset with existing file
- **WHEN** user deletes an asset record
- **THEN** the system reads the `filePath` from the asset record
- **THEN** the corresponding file on disk is deleted via `api.delete(filePath)`
- **THEN** the database record is deleted

#### Scenario: Delete asset with missing file
- **WHEN** user deletes an asset record whose disk file no longer exists
- **THEN** the system still deletes the database record without error
- **THEN** no error is raised for the missing file

### Requirement: Preview path resolution

The system SHALL provide correct download URLs for asset preview.

#### Scenario: Asset card displays preview image
- **WHEN** AssetCard renders an asset with a valid filePath
- **THEN** it calls `api.getDownloadUrl(filePath)` to obtain the correct URL
- **THEN** the `src` attribute of the preview `<img>` is set to that URL
- **THEN** the image loads and displays correctly

### Requirement: Complete asset record metadata

The asset record SHALL include `fileName`, `mimeType`, and `fileSize` fields.

#### Scenario: Asset created with metadata
- **WHEN** an asset is created via upload
- **THEN** the record includes `fileName` (original display name), `mimeType` (MIME type), and `fileSize` (file size in bytes)
- **THEN** these fields are persisted in the database
