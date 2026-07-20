## Why

文案任务详情页面中，关联文稿的操作按钮布局和命名缺乏一致性，文稿编辑器中缺少模板选择入口，导致用户无法在编辑过程中快速套用模板内容。

## What Changes

1. **关联文稿区域按钮调整**：删除「从模板新建」按钮，将「新建文稿」按钮改为右对齐并重命名为「新建」
2. **文稿编辑器添加模板选择**：在编辑器工具栏「保存草稿」左侧新增「模板选择」按钮，模板选择面板右对齐

## Capabilities

### New Capabilities

无新增能力。本次变更仅涉及现有 UI 的布局调整和功能入口补充。

### Modified Capabilities

无 spec 级别行为变更。`template-content-integration` 已有模板选择能力，本次仅在 ContentEditor 中复用同一能力。

## Impact

- **TaskDetail.js**：删除「从模板新建」按钮及其事件处理逻辑、模板选择面板代码、templateRepo 导入
- **ContentEditor.js**：新增 templateRepo 导入、「模板选择」按钮及其面板交互逻辑
- **data/index.js**：无变更（templateRepo 已导出）
