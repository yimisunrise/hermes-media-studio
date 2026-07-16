# css-style-cleanup Specification

## Purpose
TBD - created by archiving change cleanup-legacy-code. Update Purpose after archive.
## Requirements
### Requirement: Remove Dashboard zombie CSS

The system SHALL remove Dashboard-specific CSS rules from `src/business/app.css` (approximately lines 663-696) that reference selectors from the old Kanban/ReviewMode UI code.

The following CSS rules SHALL be removed:
- `.kanban-column` 
- `.kanban-column h3`
- `.kanban-card`
- `.kanban-card + .kanban-card`
- `.review-grid`
- `.review-card`
- `.review-card:hover`
- `.review-actions button`

#### Scenario: Remove zombie CSS
- **WHEN** the implementation removes lines 663-696 from app.css
- **THEN** the removed selectors SHALL no longer exist in app.css
- **THEN** no view or component references any removed class name

