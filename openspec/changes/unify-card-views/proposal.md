## Why

Hermes Media Studio 的 7 个列表视图存在 6 种不同的交互模式——按钮可见性机制（5种）、卡片布局（3种）、点击行为（4种）。用户在视图间切换时需反复适应不同的操作方式，降低生产效率。本变更统一所有卡片视图的展示和交互，使整个系统的操作预期一致。

## What Changes

- 灵感看板（IdeaBoard）：将卡片点击展开改为 Modal 弹窗，操作按钮改为 hover 显示
- 主题策略（ThemeStrategy）：迁移全部内联样式为 CSS 类
- 任务管理（TasksView）：将始终可见的底部操作按钮改为 hover 显示
- 模板管理（TemplatesView）：添加卡片点击打开详情/编辑 Modal，操作按钮改为 hover 显示
- 发布管理（PublishManager）：从表格形态改为卡片列表
- 平台配置（PlatformConfig）：从表格形态改为卡片列表
- 统一使用 `ms-item-card` / `ms-item-card-actions` CSS 类体系
- 所有删除操作使用 Modal 确认弹窗（替代 `window.confirm`）
- 创建 `hermes-ui-patterns` AI skill 并已就位（`.opencode/skills/hermes-ui-patterns/SKILL.md`）

## Capabilities

### New Capabilities
- `card-view-interaction`: 定义统一的卡片展示和交互规范——hover 显示操作按钮、卡片点击打开 Modal、CSS 类驱动样式

### Modified Capabilities

无。本次变更不涉及现有 spec 级别行为变更，仅统一实现层面的展示和交互模式。

## Impact

- `src/business/views/IdeaBoard.js` — 移除展开模式，改为 Modal
- `src/business/views/ThemeStrategy.js` — 样式迁移（内联 → CSS 类）
- `src/business/views/TasksView.js` — 调整按钮显示逻辑
- `src/business/views/TemplatesView.js` — 添加卡片点击 + 改变按钮显示逻辑
- `src/business/views/PublishManager.js` — 表格 → 卡片（重构）
- `src/business/views/PlatformConfig.js` — 表格 → 卡片（重构）
- `src/business/app.css` — 现有卡片相关 CSS 类无需修改
- 影响范围限定在 6 个业务视图文件，不涉及框架层和数据层
