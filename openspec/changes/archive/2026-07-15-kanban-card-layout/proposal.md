## Why

当前看板卡片的内容顺序是：类型标签→摘要→时间→操作按钮。信息层级不清晰——最重要的标题最先出现但没被强调，模式/类型标签挤在顶部。需要改为从上到下的清晰布局：标题→时间→底部操作栏，信息层级一目了然。

## What Changes

- KanbanBoard.js `_renderTaskCard` DOM 顺序调整：标题 → 时间 → footer 容器
- 新增 `.ms-kanban-card-footer` 容器，内部 flex space-between 布局
- 类型/模式标签移至 footer 左侧，操作按钮移至 footer 右侧
- CSS 调整：标题加粗、footer 样式、去除 badge/button 的 align-self

## Capabilities

### New Capabilities

（无——`kanban-card-styling` 的能力继续沿用，本次仅调整布局）

### Modified Capabilities

- `kanban-card-styling`: 卡片内部 DOM 结构和 CSS 布局调整（标题位置、footer 容器、badge/button 定位）

## Impact

- `src/business/views/KanbanBoard.js`：_renderTaskCard 中 DOM 构建顺序 + 新增 footer 容器
- `src/business/app.css`：新增 `.ms-kanban-card-footer` 规则，调整 `.ms-task-summary`、`.ms-kanban-action-btn`、badge 样式
