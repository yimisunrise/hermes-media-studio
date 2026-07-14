## ADDED Requirements

### Requirement: FileScanner SHALL scan incoming/ directory recursively
The system SHALL provide a FileScanner class that walks `incoming/` to arbitrary depth, discovers files, and moves them into `.files/YYYY/MM/` with UUID naming.

#### Scenario: Scan discovers and moves files
- **WHEN** `fileScanner.scan()` is called and `incoming/batch/design.png` exists
- **THEN** the file is renamed to UUID, moved to `.files/YYYY/MM/<uuid>.png`, sidecar `.meta.json` is written, and `system.files` table record is created

#### Scenario: Scan handles nested subdirectories
- **WHEN** `incoming/2026/07/12/batch/` contains nested files
- **THEN** all files at any depth are processed

### Requirement: FileScanner SHALL deduplicate by file_size + original_name
The system SHALL check `system.files` table for existing records with matching `file_size` and `original_name` before processing. Duplicates SHALL be deleted from incoming/ without creating new records.

#### Scenario: Duplicate file is skipped
- **WHEN** a file with same size and name as an existing record is found in incoming/
- **THEN** the file is deleted from incoming/ and no new record is created

#### Scenario: Non-duplicate file is processed
- **WHEN** a file with no matching size+name pair is found
- **THEN** it proceeds through the full rename→move→record flow

### Requirement: FileScanner SHALL use 2-step rename for cross-directory moves
The system SHALL first rename the file in-place to UUID name, then move it to the target `.files/` directory.

#### Scenario: 2-step rename followed by move
- **WHEN** processing `/incoming/batch/design.png`
- **THEN** step 1: `rename("incoming/batch/design.png", "incoming/batch/<uuid>.png")`, step 2: `rename("incoming/batch/<uuid>.png", ".files/2026/07/<uuid>.png")`

### Requirement: FileScanner SHALL clean up empty source directories
The system SHALL remove empty leaf directories in incoming/ after processing all contained files.

#### Scenario: Empty directory cleanup
- **WHEN** all files in `incoming/batch/` have been processed
- **THEN** the `incoming/batch/` directory is removed

### Requirement: FileScanner SHALL update .files/manifest.json
The system SHALL maintain a manifest file tracking shard directories and last scan timestamp.

#### Scenario: Manifest updated after scan
- **WHEN** `scan()` completes
- **THEN** `.files/manifest.json` is updated with current timestamp
