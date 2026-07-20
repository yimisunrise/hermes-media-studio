## Context

任务管理视图 `TasksView.js` 目前支持创建、筛选、查看详情等操作，但缺少删除功能。底层 `DataRepository.delete()` 已在框架层完整实现，所有 CRUD 业务视图（IdeaBoard、TopicBoard、ThemeStrategy、AssetGallery 等）均使用它实现删除。本变更仅在 `TasksView` 中补全这一缺失的操作入口。

## Goals / Non-Goals

**Goals:**
- 在任务列表的任务卡片上提供删除操作入口
- 使用项目中一致的删除模式：删除按钮 → 确认对话框 → 物理删除 → 刷新列表
- 对关联了素材/文稿的任务给出适当提示

**Non-Goals:**
- 不实现级联删除（关联素材/文稿不受影响，与 ThemeStrategy/TopicBoard 行为一致）
- 不添加批量删除
- 不修改 `DataRepository` 或框架层
- 不影响看板（KanbanBoard）、审核（ReviewMode）、任务详情（TaskDetail）视图

## Decisions

| 决策 | 选项 | 选择 | 理由 |
|------|------|------|------|
| 删除入口位置 | 卡片内 / 详情弹窗内 / 两者 | **卡片内** | 项目惯例：IdeaBoard、TopicBoard 均直接在卡片上放删除按钮；TaskDetail 本身只是一个详情浮层，在里面加删除路径更长 |
| 确认模式 | `window.confirm` / Modal | **Modal** | 配合项目惯例（ThemeStrategy、TopicBoard、IdeaBoard 均使用 Modal），且 Modal 可以显示更丰富的提示文本（如"该任务关联了 N 个素材"） |
| 删除语义 | 软删除 / 物理删除 | **物理删除** | `DataRepository.delete()` 是物理删除；项目 AGENTS.md 明确写了"不兼容历史"；当前阶段无需回收站 |
| 关联数据提示 | 不提示 / 提示 | **提示** | 让用户知情，避免意外丢失引用，与 ThemeStrategy 的"关联灵感和选题不受影响"提示一致 |

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 用户误删任务 | 采用 Modal 二次确认 + 关联数据提示，与项目既有删除模式一致 |
| 删除后素材/文稿成为孤立记录 | Modal 中提示"关联素材/文稿不受影响"，用户已知情；其他实体（Theme/Topic）同理 |
