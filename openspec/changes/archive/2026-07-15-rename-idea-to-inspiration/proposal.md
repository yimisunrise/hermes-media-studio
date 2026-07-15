## Why

当前应用中对同一概念混用了两种术语：「思路池/思路」和「灵感」。菜单、面板标题、弹窗、空状态提示中各不一致，影响用户体验和品牌一致性。统一为「灵感」更直观地表达 creative spark 的语义，也更符合内容创作者的用语习惯。

## What Changes

- 菜单标签「思路池」→「灵感」
- 面板标题「思路池」→「灵感」
- 所有 UI 文本中的「思路」→「灵感」（包括弹窗标题、按钮文字、空状态、错误日志、字段 label）
- 不涉及内部 JS 变量/函数/文件名（IdeaBoard, idea.title 等英文命名保持不变）

## Capabilities

### New Capabilities

无。本次变更为纯 UI 文本替换，不引入新 capability。

### Modified Capabilities

无。无 spec 级别的行为变更，仅 UI 文案改动。

## Impact

修改 4 个文件中的中文 UI 文本：

| 文件 | 改动说明 |
|------|----------|
| `src/business/views/IdeaBoard.js` | 面板标题、空状态、弹窗标题、按钮文字、错误日志 |
| `src/business/views/TopicBoard.js` | 空状态、按钮文字、「来源思路」标签 |
| `src/business/views/ThemeStrategy.js` | 删除确认弹窗中的「思路」引用 |
| `src/business/manifest.js` | 菜单 label |
| `src/business/init/business-db.init-def.js` | schema 字段 label「思路描述」 |

不涉及 API、数据存储结构、内部命名变更。无迁移需求。
