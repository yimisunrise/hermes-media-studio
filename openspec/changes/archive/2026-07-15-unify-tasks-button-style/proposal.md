## Why

任务管理页面的"新建任务"按钮缺少 `ms-btn-sm` 类，按钮尺寸比灵感/选题页面的同类操作按钮大，页面 header 区域视觉不统一。

## What Changes

- 给 `TasksView.js` 中"新建任务"按钮添加 `ms-btn-sm` 样式类，与灵感页面的"记录灵感"按钮（`ms-btn ms-btn-primary ms-btn-sm`）保持一致

## Capabilities

无。此次变更仅涉及 1 行 CSS 类名修改，不引入新能力或修改现有需求。

## Impact

- `src/business/views/TasksView.js` — 第 56 行，1 行修改
