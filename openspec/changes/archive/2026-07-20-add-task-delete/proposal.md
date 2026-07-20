## Why

任务管理视图（`TasksView`）是目前唯一没有删除功能的 CRUD 视图。灵感、选题、主题、素材等 6 个业务视图均已支持删除操作，`TasksView` 的缺失导致了明显的不一致。用户无法删除误创建或重复的任务，只能将其标记为"已关闭"或"已归档"，数据永久残留。底层 `DataRepository.delete()` 框架能力已完整实现，只需在 UI 层补全入口。

## What Changes

- 在任务列表的每个任务卡片上添加"删除"操作入口
- 点击删除时弹出确认对话框（使用项目中一致的 Modal 模式）
- 确认后调用 `DataRepository.delete()` 物理删除任务记录
- 对已关联素材/文稿的任务，在确认对话框中给出提示说明

## Capabilities

### New Capabilities

（无新增能力 — 此变更不引入新的业务能力，仅在现有 `TasksView` 中补全已具备的 UI 操作入口）

### Modified Capabilities

（无规格级行为变更 — 删除行为是已有框架能力，本次仅为 UI 补齐）

## Impact

- **文件变更**: 仅 `src/business/views/TasksView.js`
- **数据影响**: `DataRepository.delete()` 物理删除任务记录，已存在的关联素材/文稿不受影响（引用关系保留）
- **测试**: 无测试套件，无需变更
