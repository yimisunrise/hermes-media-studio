## ADDED Requirements

### Requirement: Init page displays full content tree

The init page SHALL display a complete tree structure of all content created during initialization, replacing the current flat directory list. The tree SHALL include directories, files, database skeletons, and configuration files. Directories SHALL use a folder icon, files SHALL use a file icon. The tree SHALL be fully expanded by default.

#### Scenario: Tree replaces flat list
- **WHEN** the init page renders
- **THEN** the flat directory list (`DIRS_TO_CREATE`) SHALL be replaced by a tree structure containing all directories, files, database items, and config files

#### Scenario: Directories and files use distinct icons
- **WHEN** the tree is rendered
- **THEN** directories SHALL display with `📁` icon and files with `📄` icon

#### Scenario: Tree is fully expanded
- **WHEN** the tree is rendered
- **THEN** all nodes SHALL be visible without requiring user interaction to expand

### Requirement: Existing items show checked status

Before initialization begins, the tree SHALL indicate which items already exist on disk. Items that already exist SHALL display a ✅ checkmark beside their name.

#### Scenario: Top-level dirs checked on page load
- **WHEN** the init page renders and `api.tree('.')` returns existing entries
- **THEN** matching top-level tree nodes SHALL show ✅ checkmark

#### Scenario: Checkmark updates asynchronously
- **WHEN** the existence check API call completes after the page renders
- **THEN** the tree SHALL update to reflect found items without page reload

### Requirement: Pipeline progress updates tree in real-time

During pipeline execution, tree nodes SHALL receive ✅ checkmarks as their corresponding pipeline step completes. The onProgress callback from `pipeline.run()` SHALL update tree nodes whose `step` attribute matches the completed step name.

#### Scenario: Step completion marks matching nodes
- **WHEN** pipeline step `create-dirs` completes
- **THEN** all tree nodes with `step: 'create-dirs'` SHALL show ✅ checkmark

#### Scenario: All steps complete marks entire tree
- **WHEN** `pipeline.run()` returns `{ ok: true }`
- **THEN** all tree nodes SHALL show ✅ checkmark
