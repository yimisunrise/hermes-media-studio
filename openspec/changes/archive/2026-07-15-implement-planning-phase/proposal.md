## Why

自媒体创作者从灵感产生到内容发布需要完整的流程管理。当前系统有素材管理、发布、审核等功能，但缺少最前端的「策划」环节——灵感记录、主题管理和选题决策。没有策划阶段，创作者的灵感分散在各处，选题缺乏依据，HermesAgent 也无法根据主题风格进行针对性创作。

实现策划阶段，打通 Theme → Idea → Topic 链路，为后续的创作/编排/发布环节提供上游数据基础。

## What Changes

- 在 SchemaRegistry 中创建 `business` 库，注册 themes / ideas / topics 三张表
- 实现 ThemeStrategy 视图（`#themes`）：主题库的增删改查
- 实现 IdeaBoard 视图（`#ideas`）：思路池——灵感随手记 + 筛选浏览
- 实现 TopicBoard 视图（`#topics`）：选题面板——从 Idea 创建 Topic，进入执行阶段
- 更新 manifest，注册三个新视图到菜单组
- 更新 DESIGN.md 数据模型（Theme 移除 style/promptTemplate/platforms，Topic 移除 targetPlatforms）

## Capabilities

### New Capabilities
- `theme-management`: 主题库的增删改查，定义创作系列的名称、风格描述、标签、画面比例、主题色
- `idea-board`: 灵感随手记，支持标题+描述+关联主题+标签+参考链接，按状态/主题/标签筛选
- `topic-board`: 从 Idea 创建 Topic，确定内容形态和截止日期，进入创作流程

### Modified Capabilities
- （无）

## Impact

- `src/business/views/` — 新增 ThemeStrategy.js / IdeaBoard.js / TopicBoard.js
- `src/business/manifest.js` — 新增 3 个视图注册 + 菜单组调整
- `src/framework/core/SchemaRegistry.js` — 注册 business 库 schema
- `src/business/init/` — 可能需要新的 init-def 创建 business 库
- DESIGN.md — 数据模型字段调整
