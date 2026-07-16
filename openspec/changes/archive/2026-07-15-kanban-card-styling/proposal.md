## Why

看板中的任务卡片目前是纯文本 div，没有任何视觉样式——无背景、无圆角、无阴影、无悬停反馈。与其他模块的素材卡片（`.ms-media-card`）相比视觉效果差异过大，影响使用体验。

## What Changes

- 为 `.ms-kanban-card` 添加背景、圆角、阴影、间距、悬停效果
- 按列状态（pending/generating/review/approved）添加左侧色条区分
- 为 `.ms-kanban-action-btn`（关闭/归档）添加按钮样式

## Capabilities

### New Capabilities
- `kanban-card-styling`: 看板卡片的视觉样式定义

### Modified Capabilities

（无，纯新增 CSS，不改变现有行为或 HTML 结构）

## Impact

- `src/business/app.css`：新增约 60 行 CSS 规则
