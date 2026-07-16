## ADDED Requirements

### Requirement: ContentEditor view

The system SHALL provide a Markdown editor for creating and managing written content.

#### Scenario: Edit in Markdown
- **WHEN** the user opens the content editor
- **THEN** the system SHALL display a split-pane layout with a textarea (left) for Markdown source and a rendered preview (right)
- **AND** the preview SHALL update in real-time as the user types

#### Scenario: Create new content
- **WHEN** the user creates new content from a task detail
- **THEN** the system SHALL create a record via `contentRepo.create({ taskId, topicId, title, content: '', version: 1, status: 'draft' })`
- **AND** open the editor for the new content

#### Scenario: Save draft
- **WHEN** the user clicks "保存草稿"
- **THEN** the system SHALL update the content record via `contentRepo.update(id, { content, title })`
- **AND** show a confirmation without navigation

#### Scenario: Finalize content
- **WHEN** the user clicks "定稿"
- **THEN** the system SHALL update `contentRepo.update(id, { status: 'finalized' })`
- **AND** the editor SHALL switch to read-only mode

#### Scenario: Create new version from finalized
- **WHEN** the user clicks "创建新版本" on a finalized content
- **THEN** the system SHALL create a new record with `version: previousVersion + 1, status: 'draft'`
- **AND** copy the previous content as starting text

#### Scenario: View content history
- **WHEN** the user views content versions for a task
- **THEN** the system SHALL list all versions by `contentRepo.find({ filter: { taskId }, sort: '-version' })`
- **AND** allow switching between versions to view

### Requirement: Contents database table (REPLACES scripts table)

The system SHALL use a `contents` table (replacing the old `scripts` table) for storing written content.

#### Scenario: Contents table fields
- **WHEN** the system creates a content record
- **THEN** the fields SHALL be: id, taskId, topicId, version, title, content (Markdown), status (draft/finalized/archived), createdAt, updatedAt
- **AND** the table SHALL NOT be sharded by month (content data volume is small)

## MODIFIED Requirements

### Requirement: scripts → contents table rename

The existing `scripts` table definition SHALL be renamed to `contents` in `business-db.init-def.js` with updated field definitions.

#### Scenario: Rename and adjust fields
- **WHEN** the system initializes the business database
- **THEN** it SHALL create a `contents` table instead of `scripts`
- **AND** `contents` SHALL have fields: id(string), taskId(string), topicId(string), version(number), title(string), content(string), status(string), createdAt(string), updatedAt(string)
- **AND** the `data/index.js` SHALL export `contentRepo` instead of `scriptRepo`, pointing to the `contents` table
