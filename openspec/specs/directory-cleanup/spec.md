# directory-cleanup Specification

## Purpose
TBD - created by archiving change cleanup-legacy-code. Update Purpose after archive.
## Requirements
### Requirement: Remove empty legacy data directories

The system SHALL remove the following empty directories that were part of the old file-based architecture:
- `workspace/pipeline/` — 旧管道目录
- `.media-studio/` — 旧媒体工作室缓存
- `.trash/` — 旧回收站
- `archive/` — 旧归档

Each directory SHALL contain only `.gitkeep` or be completely empty.

#### Scenario: Remove empty directories
- **WHEN** the implementation removes these directories
- **THEN** `workspace/pipeline/` SHALL no longer exist
- **THEN** `.media-studio/` SHALL no longer exist
- **THEN** `.trash/` SHALL no longer exist
- **THEN** `archive/` SHALL no longer exist

### Requirement: Remove expired migration script

The system SHALL remove `src/scripts/migrate-v2.sh` as it contains paths and logic from a previous architecture that no longer applies.

#### Scenario: Remove expired script
- **WHEN** the implementation removes the file
- **THEN** `src/scripts/migrate-v2.sh` SHALL no longer exist

