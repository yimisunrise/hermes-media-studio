## Context

当前 `.ms-kanban-card` 没有任何 CSS 样式——卡片是一个纯文本 div，无背景色、无圆角、无阴影、无悬停反馈，与项目其他模块（如 `.ms-media-card`）的视觉品质差距大。

## Goals / Non-Goals

**Goals:**
- 卡片有清晰的视觉容器（背景、圆角、阴影）
- 悬停时有反馈（高亮边框、浮起、阴影）
- 按列状态用左侧色条区分（pending 橙、generating 蓝、review 红、approved 绿）
- 关闭/归档按钮有基本样式和 hover 状态

**Non-Goals:**
- 不改变 HTML 结构或 JS 逻辑
- 不添加新的 CSS 变量
- 不做响应式或动画变化

## Decisions

所有改动集中在 `src/business/app.css`，遵循现有的 CSS 变量体系（`--ms-bg-card`、`--ms-radius`、`--ms-border` 等）和代码风格（BEM-like 类名、属性顺序）。

## Risks / Trade-offs

- 列色条使用 `[data-column]` 属性选择器，需确保 KanbanBoard.js 中的列容器正确设置了 `data-column` 属性（已确认）
