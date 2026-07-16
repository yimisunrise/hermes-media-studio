## Context

扩展左上角标题文案修改。共涉及 2 处代码文件、1 行修改各。此前 `sidebar.js:134` 的 subtitle 已改为"自媒体运营助手"。

## Goals / Non-Goals

**Goals:**
- `manifest.js` 的 `label` 字段从"内容生产流水线"改为"运营助手"
- `sidebar.js` Rail 按钮的 `title` 属性同步更新

**Non-Goals:**
- 不修改 `sidebar.js:134` 的 subtitle（已正确）
- 不涉及功能逻辑变更

## Decisions

直接替换字符串。无架构决策。

## Risks / Trade-offs

无风险。纯文案修改，回退只需 git checkout。
