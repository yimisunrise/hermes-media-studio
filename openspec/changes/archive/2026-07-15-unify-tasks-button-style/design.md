## Context

`ms-btn-sm` 是本项目的标准按钮尺寸变体，已使用于灵感页面的"记录灵感"、选题页面的"从灵感创建"等 header 操作按钮。任务管理页面的"新建任务"按钮构建时遗漏了该 class，导致按钮偏大。

## Goals / Non-Goals

**Goals:**
- 在 `TasksView.js` 的"新建任务"按钮添加 `ms-btn-sm`

**Non-Goals:**
- 不涉及 CSS 变量修改
- 不涉及其他页面的按钮样式
- 不涉及按钮逻辑/功能变更

## Decisions

仅一处改动：`createBtn.className = 'ms-btn ms-btn-primary'` → `createBtn.className = 'ms-btn ms-btn-primary ms-btn-sm'`。与灵感/选题页面的 `btn()` 辅助函数生成的 class 完全对齐。

## Risks / Trade-offs

无风险。纯视觉微调，不涉及布局或功能。
