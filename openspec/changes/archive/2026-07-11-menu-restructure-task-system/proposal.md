## Why

当前 Media Studio 的菜单结构和功能划分已无法满足日益增长的业务需求：
- "生成"视图无法管理复杂的创作任务类型（素材/文案、手工/Agent）
- 缺少图文成果的管理能力
- 平台配置缺乏可扩展性（发布类型自定义）
- 菜单层级和功能命名不合理（如"定制化→主题"无实际用途）
- 看板缺少对任务状态的清晰可视化

需要一次系统性的菜单重构和功能优化，引入任务系统、图文库、平台配置等新能力。

## What Changes

### 菜单结构重构（BREAKING）
- **生产流程**：看板（简化筛选）、审批（支持素材+文案）、任务（替代"生成"）
- **发布管理**：发布（替代"发布包"，新增发布表单）
- **资源管理**：素材库（保留）、图文库（新增）、日历（从发布管理移入）
- **运营配置**（原"定制化"）：初始化、平台配置（新增）；主题（删除）、数据（删除）

### 任务系统（新）
- 任务分类：素材任务（图片/视频）、文案任务（Markdown 图文）
- 任务模式：手工、Agent
- 每种任务类型有独立的状态机
- 任务数据存储在 `tasks/<uuid>/` 目录中

### 图文库（新）
- 文案文件以 Markdown + .meta.json sidecar 存储
- 引用素材库路径作为图片
- 分片索引，支持搜索

### 平台配置（新）
- 平台 CRUD（不可删除）
- 每个平台可自定义发布类型（如头条：微头条/文章/视频）

### 配置驱动状态机（新）
- 任务生命周期在 `configs/workflows/task-lifecycle.json` 中定义
- 前端自动根据配置渲染看板列和状态流转按钮

### 删除功能
- 主题管理（"定制化→主题"）
- 数据统计看板

## Capabilities

### New Capabilities
- `menu-restructure`: 侧边栏菜单重组，路由更新，删除旧视图注册
- `task-system`: 任务 CRUD、目录存储、列表视图、两种类型/模式
- `config-driven-state-machine`: 配置文件定义任务状态机，看板自动渲染
- `copywriting-library`: 图文库存储、浏览、分片索引、搜索
- `platform-config`: 平台列表 CRUD、自定义发布类型
- `publish-records`: 发布表单、发布历史记录清单

### Modified Capabilities
<!-- No existing specs to modify — this is a new capability set -->

## Impact

- **路由系统**（`router.js`）：新增 `tasks`、`publish`、`copywriting`、`platforms` 视图；移除 `generation`、`themes`、`dashboard`、`package-editor`
- **菜单配置**（`app.js`）：`MENU_GROUPS` 和 `ICONS` 需按新结构重写
- **新建目录**：`tasks/`、`copywriting/`、`.index/copywriting/`
- **配置文件**：`configs/workflows/task-lifecycle.json`
- **视图模块**：新建 `TasksView.js`、`CopywritingView.js`、`PlatformConfig.js`、`PublishView.js`；删除 `StatsDashboard.js`、`ThemeStrategy.js`、`PackageEditor.js`（或重构）
- **看板**（`KanbanBoard.js`）：移除顶部筛选，改为展示任务卡片
- **审批**（`ReviewMode.js`）：支持任务类型区分，不同渲染
- **日历**：从发布管理移入资源管理，改为统计成果数量
