## Why

Hermes Media Studio 已覆盖从策划（主题/灵感/选题）到创作（素材/文稿/编排）的全流程，Content 已具备定稿（finalized）状态。当前缺失最关键的一环——发布。创作者无法将已完成的 Content 实际分发到目标平台。

实现发布模块是"流程闭环"的核心里程碑：让内容从系统内流转到真实的社交媒体平台（小红书、抖音、B站等），使 Hermes Media Studio 真正成为端到端的内容生产工具。

## What Changes

- **4 张新数据表**：`packages`、`platforms`、`schedules`（月分片）、`publish-logs`（月分片）
- **3 个新视图**：发布管理（#publish）、平台配置（#platforms）、发布日历（#calendar）
- **新菜单组**"发布运营"，包含 publish / calendar / platforms 三个入口
- **数据访问层**：4 个新 repo（packageRepo / platformRepo / scheduleRepo / publishLogRepo）
- **Manifest 扩展**：新增菜单组和视图注册
- **现有视图集成**：TaskDetail / ContentEditor 增加发布入口
- **版本升级**：business-db 从 1.3.0 → 1.4.0
- **发布模式**：优先实现手工模式，Agent 模式预留接口和字段

## Capabilities

### New Capabilities

- `publish-package`: 从已定稿的 Content 创建发布包，选择目标平台，设置排期或立即发布，跟踪发布状态
- `platform-config`: 管理发布目标平台的增删改查，配置平台名称、类型、发布参数和 API 连接信息
- `publish-calendar`: 日历视图展示所有发布排期，支持月视图浏览和排期管理
- `publish-execution`: 手工执行发布流程，记录发布结果（成功/失败/链接回填），支持重试

### Modified Capabilities

暂无现有 capbility 需要修改。

## Impact

- `business/business-db.init-def.js` — TABLE_DEFS 追加 4 张表定义，版本升至 1.4.0
- `business/data/index.js` — 追加 4 个 repo factory 函数
- `business/manifest/Manifest.js` — 追加菜单组和 3 个视图注册
- `business/view/` — 新建 3 个视图文件
- `business/view/TaskDetail.js` — 追加"创建发布包"入口按钮
- `business/view/ContentEditor.js` — 定稿状态增加发布链接展示
- `framework/ui/Modal.js` — 已有，发布表单直接复用
