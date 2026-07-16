## ADDED Requirements

### Requirement: Asset upload via API

The system SHALL allow uploading asset files through `WorkspaceAPI.write()`.

#### Scenario: Upload image file in AssetGallery
- **WHEN** user selects an image file in AssetGallery upload dialog
- **THEN** AssetGallery calls `this.api.write(relPath, dataUrl)` with a `assets/YYYY-MM/uuid-filename.ext` relative path
- **THEN** the asset record is created via DataRepository with the correct filePath

#### Scenario: Upload image file in TaskDetail
- **WHEN** user selects an image file in TaskDetail upload area
- **THEN** TaskDetail calls `api.write(relPath, dataUrl)` with a `assets/YYYY-MM/uuid-filename.ext` relative path
- **THEN** the asset record is created via DataRepository with the correct filePath
