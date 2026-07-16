## Why

当前任务的完整生命周期分散在三个界面：**KanbanView**（只显示不操作）、**TasksView**（有状态按钮但无拖拽）、**ReviewMode**（孤立审核页，功能与 TasksView 重叠）。用户需要反复切换视图才能完成一个任务从创建到审核的全流程。Agent 自动流转（pending→generating→review）上线后，ReviewMode 的边际价值进一步降低。

将 Kanban 改造为任务工作流的核心界面——支持拖拽改状态、新增关闭/归档终点态、卡片直接打开任务详情——移除 ReviewMode，把 TasksView 的状态按钮统一到拖拽操作中。

## What Changes

- **KanbanView**：列从 5 个改为 4 个（待处理→生成中→待审核→已完成）；实现拖拽改变任务状态；卡片点击打开 TaskDetail 弹窗；待审核列加「关闭」按钮；已完成列加「归档」按钮；已关闭/已归档不显示
- **TasksView**：移除任务卡片上所有的状态切换按钮（保留创建、删除等管理操作）；加「显示已归档」toggle
- **ReviewMode**：移除整个视图及其注册
- **business-db**：tasks 表 status 字段追加 `closed`、`archived` 枚举值

## Capabilities

### New Capabilities
- `kanban-workflow`: 看板作为主工作流界面，支持拖拽状态变更、关闭/归档、卡片直接打开任务详情

### Modified Capabilities

（无现有 spec 级行为变更——纯 UI 重组和状态模型扩展）

## Impact

| 文件 | 改动类型 |
|------|---------|
| `src/business/views/KanbanView.js` | 大幅改动：4 列、拖拽、TaskDetail 集成、关闭/归档按钮 |
| `src/business/views/TasksView.js` | 移除状态按钮、添加已归档 toggle |
| `src/business/views/ReviewMode.js` | 删除 |
| `src/business/manifest.js` | 移除 ReviewMode 路由注册 |
| `src/business/init/business-db.init-def.js` | tasks.status 枚举 + `closed`/`archived` |
