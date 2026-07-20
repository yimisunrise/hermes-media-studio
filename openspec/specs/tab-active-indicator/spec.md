## ADDED Requirements

### Requirement: Tab active indicator follows current tab

The template management view SHALL visually indicate which tab is currently active.
When a user clicks a different tab, the active indicator (blue underline) MUST move to the newly selected tab.

#### Scenario: Click second tab
- **WHEN** user clicks the "文稿内容" tab
- **THEN** the blue underline appears under "文稿内容"
- **AND** the "创作简报" tab loses the blue underline

#### Scenario: Click back to first tab
- **WHEN** user clicks the "创作简报" tab again
- **THEN** the blue underline appears under "创作简报"
