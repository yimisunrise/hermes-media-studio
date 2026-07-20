## Why

当前项目中有 5 种不同的浮动层实现方式（框架模态、任务模态、数据库表单、内联覆盖、初始化覆盖），分布在 10 个调用点。它们各自维护独立的 CSS 类和 z-index 层级，导致样式不一致（背景透明度 0.6/0.7 混用、无统一动画、阴影不统一）、大量代码重复（如 IdeaBoard/TopicBoard 的 11 个辅助函数完全重复），且无共享组件可供复用。每次新增表单都需要从零编写 overlay/modal 创建逻辑。

## What Changes

- **新增 `src/framework/ui/Modal.js`** — 共享 Modal 组件类，统一管理 overlay 创建、header/body/footer 布局、关闭逻辑、动画
- **统一 CSS 覆盖层样式** — 用一套 `.ms-overlay` / `.ms-modal` / `.ms-modal-*` 替代现有的 4 组零散 CSS（`.ms-modal-overlay`、`.ms-task-modal-overlay`、`.ms-db-form-overlay`、内联样式）
- **迁移所有调用点** — 将 10 个现有浮动表单/模态调用点迁移到新 Modal 组件
- **清理冗余代码** — 删除 IdeaBoard/TopicBoard 中的 11 个重复辅助函数（`_ovl`、`_modal`、`_hdr`、`_fld` 等）
- **删除旧 CSS 类** — 删除 `.ms-modal-overlay`、`.ms-modal`、`.ms-task-modal-overlay`、`.ms-task-modal`、`.ms-db-form-overlay`、`.ms-db-form` 等废弃类

## Capabilities

### New Capabilities

- `shared-modal`: 可复用的浮动层 Modal 组件，支持标题/正文/底部操作栏三段式布局、overlay 点击关闭、动画、自定义宽高、指定追加容器

### Modified Capabilities

无。此为全新能力，不影响已有 spec。

## Impact

- 新增文件: `src/framework/ui/Modal.js`
- CSS 变更: `src/framework/app.css`（统一覆盖层样式）、`src/business/app.css`（删除重复定义）
- 修改文件: 10 个调用点的视图文件
- 无外部依赖变更
