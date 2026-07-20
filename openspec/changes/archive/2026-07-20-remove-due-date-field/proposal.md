## Why

选题表单的「截止日期」目前只存不用——数据入库但从未在卡片展示、排序、过滤或任何业务逻辑中使用。此字段增加了表单复杂度而无实际价值，应予移除以简化 UI 和数据模型。

## What Changes

- 从 `TopicBoard.js` 创建/编辑表单移除截止日期输入框
- 从 `IdeaBoard.js` 创建选题表单移除截止日期输入框
- 从 `business-db.init-def.js` 移除 `dueDate` 字段定义（不影响已有数据，新记录不再写入）
- 从 `openspec/specs/topic-board/spec.md` 移除 `dueDate` 相关需求

## Capabilities

### New Capabilities

- *(none)*

### Modified Capabilities

- `topic-board`: 移除 `dueDate` 作为选题的创建/编辑/展示字段

## Impact

- `src/business/views/TopicBoard.js` — 移除 `_createTopic` 和 `_editTopic` 表单中的截止日期行
- `src/business/views/IdeaBoard.js` — 移除 `_createTopicFromIdea` 表单中的截止日期行
- `src/business/init/business-db.init-def.js` — 移除 `dueDate` 字段定义
- `openspec/specs/topic-board/spec.md` — 移除 `dueDate` 相关需求描述
- 已有数据不受影响，只是新建/编辑时不再收集该字段
