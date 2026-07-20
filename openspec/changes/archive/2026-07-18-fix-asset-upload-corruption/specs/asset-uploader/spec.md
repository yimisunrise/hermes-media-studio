## ADDED Requirements

### Requirement: Shared asset upload service

The system SHALL provide a shared `AssetUploader` module that encapsulates file reading, binary upload, and asset record creation logic, to be used by both AssetGallery and TaskDetail.

#### Scenario: Upload file via AssetUploader
- **WHEN** consumer calls `AssetUploader.uploadFile(file, api, dataRepo)` with a valid File object
- **THEN** the file is read as ArrayBuffer via FileReader
- **THEN** the file path is generated as `assets/YYYY-MM/uuid-sanitized-filename.ext`
- **THEN** `api.writeBinary(relPath, arrayBuffer)` is called with the raw bytes
- **THEN** an asset record is created via `dataRepo.createAsset()` including `fileName`, `mimeType`, `fileSize`
- **THEN** the created asset record is returned to the caller

### Requirement: File path sanitization

The system SHALL sanitize user-provided filenames before constructing file storage paths.

#### Scenario: Filename with path traversal characters
- **WHEN** user uploads a file named `../../etc/passwd.png`
- **THEN** the path separator characters (`..`, `/`, `\`) are removed from the filename
- **THEN** the resulting filename contains only the display-safe portion

#### Scenario: Filename with special characters
- **WHEN** user uploads a file named `my image (1).png`
- **THEN** the filename is sanitized to `my_image_1_.png` (spaces and special characters replaced)

### Requirement: Binary write via API

The system SHALL provide a `api.writeBinary(relPath, arrayBuffer)` method that transfers raw file bytes to the server.

#### Scenario: Binary file write succeeds
- **WHEN** `api.writeBinary('assets/2025-07/uuid-file.png', arrayBuffer)` is called
- **THEN** the file is written as raw binary to the specified path on disk
- **THEN** the file can be opened natively by the operating system

#### Scenario: Binary file write fails
- **WHEN** `api.writeBinary()` encounters a server error
- **THEN** the method returns an error status or throws
- **THEN** no partial file remains on disk
