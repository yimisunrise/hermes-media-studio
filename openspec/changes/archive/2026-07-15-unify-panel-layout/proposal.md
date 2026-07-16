## Why

目前灵感列表、选题列表、任务列表三个面板的布局和样式不一致：
- IdeaBoard/TopicBoard 使用 `ce()` 内联样式 + JS `onmouseenter/leave` 实现 hover 效果
- TasksView 使用注入的 `<style>` CSS 类块、`max-width:960px` 居中布局
- 三个面板的头部、筛选栏、卡片容器各自有不同的 padding/gap/结构

用户在三个面板间切换时操作习惯不一致，视觉风格不统一。需要提取公共 CSS 类，重构三个面板使用统一布局系统。

## What Changes

- 在 `app.css` 中新增公共面板 CSS 类：`.ms-panel-section`、`.ms-panel-header`、`.ms-panel-filterbar`、`.ms-panel-body`、`.ms-item-card`
- IdeaBoard: 移除内联样式和 JS hover handler，改用公共 CSS 类
- TopicBoard: 移除内联样式和 JS hover handler，改用公共 CSS 类
- TasksView: 移除注入 `<style>` 块，改用公共 CSS 类 + `app.css` 规则
- IdeaBoard/TopicBoard 中的 `ce/bn/sp/btn` 重复辅助函数保持不变（降低风险）

## Capabilities

### New Capabilities
- `panel-layout-system`: 列表面板的公共布局 CSS 系统

### Modified Capabilities
- `kanban-card-styling`: `.ms-item-card` 顶层卡片样式需要与看板卡片的 `.ms-kanban-card` 区分（不共用）、无修改

## Impact

- `src/business/app.css`：新增约 50 行公共 CSS 类
- `src/business/views/IdeaBoard.js`：内联样式 → CSS 类
- `src/business/views/TopicBoard.js`：内联样式 → CSS 类
- `src/business/views/TasksView.js`：移除 `_injectStyles`，移除 `ms-tasks-view` wrapper
