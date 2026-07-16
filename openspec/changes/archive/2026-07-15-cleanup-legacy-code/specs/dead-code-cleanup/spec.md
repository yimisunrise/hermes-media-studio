## ADDED Requirements

### Requirement: Remove legacy pipeline/index methods from api.js

The system SHALL remove all legacy pipeline and index management methods from `api.js` that have been superseded by DataRepository.

The following methods SHALL be removed:
- `loadKanbanData()` — replaced by `taskRepo.find()`
- `loadDashboardStats()` — replaced by `taskRepo.count()`
- `readPipelineRef(uuid)` — pipeline 目录已废弃
- `writePipelineRef(uuid)` — 同上
- `readPipelineIndex()` — 同上
- `getWorkspaceStats()` — 零引用
- `getAllStats()` — 零引用
- `searchContent()` — 零引用

#### Scenario: Remove methods by block deletion
- **WHEN** the implementation removes lines 333-566 of api.js
- **THEN** these 8 methods SHALL no longer exist in the file
- **THEN** no import, view, or module references these methods

### Requirement: Remove legacy task management methods from api.js

The system SHALL remove all legacy task management methods from `api.js` that have been superseded by `taskRepo` from `business/data/index.js`.

The following methods SHALL be removed:
- `_buildTaskPath(uuid)` — 零引用
- `readTaskIndex()` — 替换为 `taskRepo.find()`
- `writeTaskIndex(index)` — 替换为 `taskRepo.create()`
- `listTasks()` — 替换为 `taskRepo.find()`
- `createTask(data)` — 替换为 `taskRepo.create()`
- `getTask(uuid)` — 替换为 `taskRepo.get()`
- `updateTaskStatus(uuid, status, note)` — 替换为 `taskRepo.update()`
- `readTaskBrief(uuid)` — 零引用

#### Scenario: Remove task management methods
- **WHEN** the implementation removes lines 611-721 of api.js
- **THEN** these 8 methods SHALL no longer exist in the file
- **THEN** no view or module references these methods

### Requirement: Verify no imports break after removal

After removing the methods, the system SHALL verify that no other file imports or references the removed methods.

#### Scenario: JS syntax check passes after removal
- **WHEN** all code removals are applied
- **THEN** `find src -name "*.js" -exec node --check --input-type=module {} \;` SHALL pass with no syntax errors
