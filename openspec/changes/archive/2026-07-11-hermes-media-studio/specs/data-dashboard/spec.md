## ADDED Requirements

### Requirement: Theme performance overview
The system SHALL display aggregate performance statistics for each theme.

#### Scenario: Performance metrics display
- **WHEN** the user views the data dashboard
- **THEN** the system SHALL display for each theme: total published count, total views, total likes, number of "爆款" (viral) assets, average engagement rate
- **AND** SHALL compute these from `publish_history.stats` across all assets matching each theme

#### Scenario: Theme comparison bars
- **WHEN** the data dashboard loads
- **THEN** the system SHALL display horizontal bar charts comparing themes by publish count, average views, viral count
- **AND** SHALL highlight the best-performing theme with a visual indicator

### Requirement: Viral asset identification
The system SHALL identify and rank top-performing assets based on engagement metrics.

#### Scenario: Top 5 viral assets
- **WHEN** the data dashboard loads
- **THEN** the system SHALL display the top 5 assets by total engagement (views + likes + comments + shares)
- **AND** SHALL show each asset's thumbnail, total views, and a "复刻" (replicate) button

#### Scenario: Viral asset replication
- **WHEN** the user clicks "复刻" on a viral asset
- **THEN** the system SHALL display the asset's full generation parameters (seed, prompt, workflow, model)
- **AND** SHALL offer a "生成同参数变体" button that pre-fills the generation console with those parameters

### Requirement: Publish history timeline
The system SHALL display a chronological timeline of all published packages.

#### Scenario: Timeline view
- **WHEN** the user views the data dashboard
- **THEN** the system SHALL show a timeline of published packages ordered by `published_at` descending
- **AND** each entry SHALL display: date, platform icon, theme, title, thumbnail of cover asset, key stats (views, likes)

### Requirement: Manual data entry for published posts
The system SHALL allow users to manually enter post-performance data after publishing.

#### Scenario: Enter publish stats
- **WHEN** the user clicks "录入数据" on a published package
- **THEN** a form SHALL open with fields: views, likes, comments, shares, collections
- **AND** SHALL allow updating the `publish_history.stats` in each linked asset's `.meta.json`

#### Scenario: Bulk data import
- **WHEN** the user has multiple published packages with data to enter
- **THEN** the system SHALL provide a tabular input mode for batch entry
