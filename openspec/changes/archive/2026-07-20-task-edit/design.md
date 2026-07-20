## Context

当前 `TasksView` 在操作区域只有一个「删除」按钮，没有编辑入口。用户创建任务后无法修改任意字段。

项目已有成熟的编辑模式参考：
- `TopicBoard._editTopic()` — 卡片上放编辑按钮 → Modal 表单 → `update()` → 刷新
- `IdeaBoard._openDetail(idea)` — 同一 Modal 做创建/编辑，条件判断

任务数据模型（核心字段）：
- `title`, `prompt`, `topicId`, `taskType`, `mode`, `status`, `createdAt`

## Goals / Non-Goals

**Goals:**
- 任务卡片操作区添加「编辑」按钮
- 点击后弹出 Modal 表单，预填当前任务数据
- 允许修改 `title`, `prompt`, `topicId`, `status`
- `taskType` 和 `mode` 在编辑表单中只读显示（锁定）
- 保存后调用 `taskRepo().update()` 并刷新列表

**Non-Goals:**
- 不修改 TaskDetail 详情 Modal（编辑独立在卡片上触发）
- 不做批量编辑
- 不修改数据层或 Schema
- 不改 taskType/mode 编辑逻辑——即使技术上可以实现，也按用户要求锁定

## Decisions

1. **编辑入口放在卡片操作区**（与选题/灵感一致）
   - 在 `_renderTaskCard()` 的 `.ms-item-card-actions` 中添加「编辑」按钮
   - 已有「删除」按钮的同一区域

2. **独立编辑 Modal 而非复用创建 Modal**
   - 创建表单有关联选题必填校验、模板选择器等复杂逻辑
   - 编辑表单逻辑更简单（预填 + 保存），拆开更清晰
   - 但表单布局与创建保持一致（参考创建表单的 HTML 结构）

3. **只读字段用 `<span>` 标签显示而非 disabled input**
   - disabled input 视觉上容易混淆用户
   - 直接用 span 显示值，更清晰表明不可修改

4. **状态字段使用 `<select>` 下拉选择**
   - 参考 TopicBoard 的状态选择器
   - 状态选项: pending → generating → review → approved → closed → archived

5. **topicId 使用 `<select>` 下拉加载所有选题**
   - 与创建表单一致，动态从 API 加载

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 用户修改状态跳过了正常流程（如从 pending 直接到 approved） | 当前无工作流校验，这是 schema 层的缺失，不在本 change 范围内。编辑功能仅提供灵活性，后续可加状态机校验 |
| 编辑时 topicId 下拉列表数据量大 | 目前选题数量有限，不做分页；后续需要时再优化 |
| 编辑任务时状态可能正在 Agent 处理中 | 用户手动操作覆盖可能导致状态不一致——这是功能使用的责任，编辑提供的是"能改"的灵活性 |
