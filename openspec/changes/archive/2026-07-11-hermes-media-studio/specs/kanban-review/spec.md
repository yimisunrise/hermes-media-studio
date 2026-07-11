## ADDED Requirements

### Requirement: Kanban four-column view
The system SHALL display a Kanban board with four columns representing the asset pipeline stages: "生成中" (Generating), "待审核" (Pending Review), "已审核" (Approved), "排期" (Scheduled).

#### Scenario: Kanban loads with correct columns
- **WHEN** the Kanban view is loaded
- **THEN** it SHALL display four columns with headers "🔄 生成中", "🔍 待审核", "✅ 已审核", "📅 排期"
- **AND** each column SHALL display the count of assets in that stage

#### Scenario: Column shows asset cards
- **WHEN** assets exist in a pipeline stage
- **THEN** the corresponding Kanban column SHALL display asset cards with: thumbnail preview, theme tag, generation parameter summary (model, resolution, seed)

### Requirement: Kanban theme filtering
The system SHALL allow users to filter the Kanban board by one or more themes.

#### Scenario: Filter by single theme
- **WHEN** the user selects "童话仙境" in the theme filter dropdown
- **THEN** the Kanban board SHALL only display assets with theme "童话仙境"
- **AND** the asset count badges SHALL update to reflect filtered counts

#### Scenario: Filter by multiple themes
- **WHEN** the user selects both "手机壁纸" and "电脑壁纸"
- **THEN** the Kanban board SHALL display assets matching either selected theme

### Requirement: Kanban date range filtering
The system SHALL allow users to filter the Kanban board by date range (today, this week, this month, custom range).

#### Scenario: Filter by date range
- **WHEN** the user selects "本周" as date filter
- **THEN** the Kanban board SHALL only display assets where `created_at` falls within the current week

### Requirement: Asset card hover preview
The system SHALL show a larger preview of the asset with complete generation parameters when the user hovers over a card.

#### Scenario: Hover shows detail overlay
- **WHEN** the user hovers over an asset card for 300ms
- **THEN** a floating overlay SHALL appear showing: enlarged image, seed, prompt, negative_prompt, model, sampler, steps, CFG, workflow source, generated_at timestamp

### Requirement: Drag card between columns
The system SHALL allow users to drag asset cards between Kanban columns to change their status.

#### Scenario: Drag from pending to approved
- **WHEN** the user drags an asset card from "待审核" column to "已审核" column
- **THEN** the system SHALL call `changeStatus(assetPath, "approved")`
- **AND** the card SHALL move to the "已审核" column
- **AND** the column counts SHALL update

### Requirement: Immersive review mode
The system SHALL provide a full-screen grid review mode optimized for bulk operations.

#### Scenario: Enter review mode
- **WHEN** the user clicks "审核模式" or presses shortcut key
- **THEN** the system SHALL display a full-screen grid of pending-review assets arranged in rows
- **AND** each card SHALL show: thumbnail, theme badge, star rating, action buttons (1-5)

#### Scenario: Keyboard shortcut for review actions
- **WHEN** the user presses `1` while an asset card is selected in review mode
- **THEN** the system SHALL mark the asset as `"approved"`
- **WHEN** the user presses `2`
- **THEN** the system SHALL mark the asset as `"deleted"` (move to trash)
- **WHEN** the user presses `3`
- **THEN** the system SHALL mark the asset as `"deferred"`
- **WHEN** the user presses `4` or `S`
- **THEN** the system SHALL toggle `is_starred` on the asset
- **WHEN** the user presses `5` or `N`
- **THEN** the system SHALL open a note input dialog for the asset

#### Scenario: Navigation between cards
- **WHEN** the user presses `→` or `←`
- **THEN** the selection SHALL move to the next or previous card respectively

### Requirement: Bulk operations in review mode
The system SHALL support batch selection and bulk actions in review mode.

#### Scenario: Bulk approve selected assets
- **WHEN** the user selects multiple cards using checkboxes and clicks "批量通过"
- **THEN** the system SHALL mark all selected assets as `"approved"`
- **AND** SHALL update the grid to remove processed items

#### Scenario: Bulk delete selected assets
- **WHEN** the user selects multiple cards and clicks "批量删除"
- **THEN** the system SHALL move all selected assets to trash

### Requirement: Media detail modal
The system SHALL display a full-screen modal with complete asset details when the user opens an asset for inspection.

#### Scenario: Full preview mode
- **WHEN** the user double-clicks an asset card or presses Enter with a card selected
- **THEN** the system SHALL open a full-screen overlay showing:
  - Full-resolution image
  - All generation parameters (prompt, negative_prompt, seed, model, width, height, sampler, steps, CFG)
  - Status history timeline
  - Publish history (if any)
  - Linked copies list

### Requirement: Similar asset grouping
The system SHALL automatically group similar assets (same workflow + seed variants) in review mode.

#### Scenario: Grouped display
- **WHEN** multiple assets share the same `workflow` and `seed` base
- **THEN** they SHALL be displayed as a group in review mode with a "变体" (variant) badge
- **AND** the group SHALL be expandable to view individual assets
