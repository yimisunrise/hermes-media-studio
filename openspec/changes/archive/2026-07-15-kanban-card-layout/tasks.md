## 1. JS 布局调整

- [x] 1.1 KanbanBoard.js `_renderTaskCard`：DOM 顺序改为 标题 → 时间 → footer 容器
- [x] 1.2 footer 容器内：左侧放入 type badge + mode badge，右侧放入 action button（如适用）

## 2. CSS 样式调整

- [x] 2.1 `.ms-task-summary`：加粗、字号 14px
- [x] 2.2 新增 `.ms-kanban-card-footer`：flex space-between, align-items center
- [x] 2.3 移除 `align-self: flex-start` 从 badge 和 button（由 footer 控制定位）
- [x] 2.4 移除 `.ms-kanban-action-btn` 的 `margin-top: 4px`

## 3. 验证

- [x] 3.1 JS 语法检查
