## Context

文案任务详情页（`TaskDetail.js`）和文稿编辑器（`ContentEditor.js`）是创作生产流程中的核心界面。当前：

- **关联文稿区域**：三个子元素在 `space-between` 布局下分为左/中/右，「从模板新建」按钮在右侧，但「新建文稿」按钮位于中间位置，布局不够清晰
- **文稿编辑器**：工具栏缺少模板选择入口，用户无法在编辑过程中直接套用模板内容

模板选择功能已在 `TaskDetail.js`（从模板新建）和 `TasksView.js`（选择模板填充简报）中实现，`ContentEditor.js` 可复用相同的数据访问模式。

## Goals / Non-Goals

**Goals:**
- 清理关联文稿区域的按钮布局：删除冗余按钮，简化命名
- 在文稿编辑器中添加模板选择能力，复用已有 `type: 'content'` 模板数据
- 模板选择面板在编辑器中右对齐，符合视觉一致性

**Non-Goals:**
- 不修改模板数据模型或仓储层
- 不修改模板选择面板的视觉样式体系（复用已有 `ms-template-selector-panel` 类）
- 不涉及 `TasksView.js` 中已有的模板选择逻辑

## Decisions

### 1. 关联文稿区域：删除 templateBtn 后自动右对齐

`contentHeader` 使用 `display:flex; justify-content:space-between`。当前有三个子元素：
- contentTitle（左） + newContentBtn（中） + templateBtn（右）

删除 templateBtn 后，两个子元素在 `space-between` 下自动分居左右，无需额外 CSS 调整即可实现「新建按钮右对齐」。

**替代方案考虑**：使用 `margin-left: auto` 将按钮推到右侧 → 不必要，`space-between` 已满足。

### 2. ContentEditor 中模板选择的交互语义

与 TaskDetail 的「从模板新建」不同——后者通过选择模板创建一个全新的文稿记录。ContentEditor 中的模板选择**不创建新记录**，而是将模板的 `content` 字段填充到当前编辑器的 textarea 中，触发预览更新。

**行为**：
- 选择模板 → `textarea.value = template.content` → 自动触发 `input` 事件的 debounce 预览更新
- 文稿标题保持不变
- 用户可在此基础上继续编辑，再决定保存草稿或定稿

### 3. 模板选择面板定位

使用 `position:absolute; top:100%; right:0` 相对于外层 `position:relative` 容器实现右对齐。已在 `TasksView.js` 中验证这种模式有效。

### 4. import 变更

- **TaskDetail.js**：移除 `templateRepo` 导入（唯一使用处在被删除的 templateBtn 逻辑中）
- **ContentEditor.js**：新增 `templateRepo` 导入（当前仅导入 `contentRepo, repo`）

## Risks / Trade-offs

- [低] ContentEditor 的 `_renderToolbar()` 在 `_loadContent()` 时会被重新调用（清空并重建）。模板选择按钮作为 toolbar 的一部分会在重建时重新创建，状态丢失。→ 影响可接受，面板本就是临时 UI，重建后用户再次点击即可。
- [低] 模板选择面板与编辑器已有的 `input` 事件 debounce 配合：填充内容后预览在 200ms 内更新。→ 已确认 `_loadContent()` 内部使用`empty()` + 重建，`textarea` 重新绑定的事件会自动生效。
