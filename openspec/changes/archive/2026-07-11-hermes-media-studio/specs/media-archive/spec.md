## ADDED Requirements

### Requirement: Archive directory structure
The system SHALL store all assets in `archive/YYYY/MM/` directories organized by year and month.

#### Scenario: Asset stored by date
- **WHEN** a new asset is generated
- **THEN** the physical PNG file SHALL be stored in `archive/<YYYY>/<MM>/` based on current date
- **AND** the `.meta.json` sidecar SHALL be stored alongside the PNG

### Requirement: Global asset search
The system SHALL support searching across all archived assets by multiple criteria.

#### Scenario: Search by keyword
- **WHEN** the user types "童话" in the search bar
- **THEN** the system SHALL return assets matching the keyword in: filename, theme name, prompt text, and review tags

#### Scenario: Filter by date range
- **WHEN** the user sets date range filter to "2026-07-01" to "2026-07-31"
- **THEN** the system SHALL only return assets with `created_at` in that range

#### Scenario: Filter by theme and tags
- **WHEN** the user selects theme "手机壁纸" and enters tag "治愈"
- **THEN** the system SHALL return assets with theme "手机壁纸" AND review tags containing "治愈"

### Requirement: Asset reuse tracking
The system SHALL track when an asset is reused across multiple publish packages.

#### Scenario: Linked copy tracking
- **WHEN** an asset is included in a publish package
- **THEN** the package path SHALL be appended to the asset's `linked_copy` array in `.meta.json`

#### Scenario: View reuse history
- **WHEN** the user views an asset's details
- **THEN** the "使用记录" section SHALL list all packages that include this asset
- **AND** each entry SHALL show the package title, platform, and publish date

### Requirement: Search index cache
The system SHALL maintain a search index at `.media-studio/index.json` for faster queries.

#### Scenario: Index is built on first search
- **WHEN** the first search query is executed
- **THEN** the system SHALL scan all `archive/` directories and build a search index in `.media-studio/index.json`
- **AND** SHALL use this index for subsequent searches

#### Scenario: Index is refreshed
- **WHEN** new assets are added after the index was built
- **THEN** the system SHALL append new entries to the index
- **AND** SHALL mark the index as stale if not refreshed in 24 hours
