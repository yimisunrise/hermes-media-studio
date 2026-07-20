## Why

任务管理目前只支持创建和删除，没有编辑功能。用户创建任务后无法修改标题、简报、关联选题或状态——标题自动截取 prompt 前80字可能不准确，简报写错了无法更正，关联选题选错了没法换，Agent 任务卡死时也无法手动修正状态。这严重影响了日常使用的灵活性。

## What Changes

- **任务卡片新增「编辑」按钮**：在卡片操作区添加编辑按钮，与灵感/选题视图的 UI 模式保持一致
- **新建编辑表单 Modal**：点击编辑按钮弹出表单，预填当前任务数据，允许修改可编辑字段
- **可编辑字段**：`title`（标题）、`prompt`（简报）、`topicId`（关联选题）、`status`（状态）
- **不可编辑字段**：`taskType`（任务类型）、`mode`（任务模式）——创建后锁定
- **保存后刷新列表**：调用 `DataRepository.update()` 持久化修改并重新渲染

## Capabilities

### New Capabilities
- `task-edit`: 支持对已创建任务的标题、简报、关联选题、状态进行修改编辑

### Modified Capabilities
- （无现有 spec 变更）

## Impact

- 仅修改 `src/business/views/TasksView.js` 一个文件
- 复用现有的 `taskRepo().update()` 方法和 Modal 组件
- 无需新增依赖或修改数据层
