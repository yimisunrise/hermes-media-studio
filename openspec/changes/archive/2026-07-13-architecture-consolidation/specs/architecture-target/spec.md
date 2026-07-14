## ADDED Requirements

### Requirement: Target architecture blueprint

The system SHALL define a stable target directory structure with explicit file-to-directory mapping. All new development SHALL place files according to this blueprint. Files SHALL NOT be moved until they are touched for functional changes (touch-to-migrate principle).

**Target structure**:
```
src/
├── app.js              # 入口（不变）
├── app.css             # 全部样式（不变）
├── lib/                # 核心基础设施
│   ├── api.js          # WorkspaceAPI
│   ├── state.js        # AppState
│   ├── router.js       # Hash 路由
│   └── sidebar.js      # 侧边栏注入
├── core/               # 服务层
│   ├── SchemaRegistry.js
│   ├── DataRepository.js
│   ├── InitPipeline.js
│   ├── FileScanner.js
│   ├── AgentTaskPoller.js
│   └── index.js
├── views/              # 全部 UI 视图
│   ├── KanbanBoard.js
│   ├── ReviewMode.js
│   ├── TasksView.js
│   ├── PublishView.js
│   ├── CopywritingView.js
│   ├── CalendarView.js
│   ├── PlatformConfig.js
│   ├── MediaArchive.js
│   ├── GenerationConsole.js
│   ├── PackageEditor.js
│   ├── StatsDashboard.js
│   ├── ThemeStrategy.js
│   └── DatabaseManager.js
├── utils/              # 单一工具目录
│   ├── format.js
│   ├── meta.js
│   ├── search.js
│   └── stateMachine.js
└── scripts/            # Shell 脚本（不变）
```

#### Scenario: File placement follows blueprint

- **WHEN** a new JS file is created for a UI view component
- **THEN** it SHALL be placed in `src/views/`
- **AND** it SHALL use `export default class ClassName` syntax
- **AND** its constructor SHALL accept a single destructured parameter `{ api, state }`

#### Scenario: Touch-to-migrate on file edit

- **WHEN** an existing file outside its target directory is edited for functional changes (not just bugfix)
- **THEN** the file SHALL be moved to its target directory as part of the same change
- **AND** all import references SHALL be updated

### Requirement: Constructor signature convention

All view classes SHALL use a single destructured parameter `{ api, state }` for their constructor. No positional arguments. No other dependency injection patterns.

#### Scenario: New view follows convention

- **WHEN** a new view is created
- **THEN** its constructor SHALL be `constructor({ api, state })`
- **AND** invocation SHALL be `new View({ api, state })`

#### Scenario: Old view migrated

- **WHEN** an existing view with positional arguments or different injection pattern is edited
- **THEN** its constructor SHALL be updated to `constructor({ api, state })`
- **AND** all call sites SHALL be updated accordingly

### Requirement: Style unification

All visual styling SHALL use the `ms-` namespaced CSS classes defined in `app.css`. The system SHALL NOT use inline `element.style.cssText`, dynamically injected `<style>` tags, or computed style assignments for layout and appearance.

#### Scenario: Removing dynamic style injection

- **WHEN** a view currently injects `<style>` dynamically or sets `style.cssText`
- **THEN** those styles SHALL be moved to `app.css` with `ms-` prefixed class names
- **AND** the view SHALL use `class="ms-classname"` instead of inline styles

#### Scenario: Visual regression check

- **WHEN** styles are moved from inline/dynamic to `app.css`
- **THEN** the visual appearance SHALL be verified to match before and after

### Requirement: State machine convergence

The system SHALL use exactly one state machine implementation. The `src/modules/utils/stateMachine.js` (config-driven) is the canonical implementation. `core/ProcessEngine.js` SHALL be removed as it duplicates functionality.

#### Scenario: ProcessEngine removal

- **WHEN** ProcessEngine.js is removed
- **THEN** no other file SHALL reference ProcessEngine
- **AND** stateMachine.js SHALL handle all state machine concerns

### Requirement: Single utils directory

The system SHALL maintain exactly one `src/utils/` directory. `src/modules/utils/` SHALL be merged into `src/utils/` and the `modules/utils/` directory SHALL be removed.

#### Scenario: Utils files migrated

- **WHEN** a file from `modules/utils/` is moved to `src/utils/`
- **THEN** all import references SHALL be updated to the new path
- **AND** `src/utils/dom.js` SHALL be removed (unused)

#### Scenario: Final state

- **WHEN** all migrations are complete
- **THEN** `src/modules/utils/` SHALL NOT exist
- **AND** `src/utils/` SHALL contain: format.js, meta.js, search.js, stateMachine.js
