## Context

当前看板（KanbanBoard）仅用于展示，没有任何交互操作。任务的状态变更分散在 TasksView 的按钮和独立的 ReviewMode 审核页中。Agent 自动流转上线后，用户在三个视图间反复切换才能完成全流程。本次将看板改造为唯一的工作流操作界面。

## Goals / Non-Goals

**Goals:**
- 看板成为任务工作流的唯一操作界面：拖拽改状态、卡片点开详情、列内关闭/归档
- 状态模型精简为 4 列 + 2 个终点态（关闭、归档）
- 移除 ReviewMode 及其菜单/路由注册
- TasksView 去掉状态按钮，增加已归档筛选

**Non-Goals:**
- 不改变 TasksView 的创建、删除、筛选功能
- 不改动 AgentHandler/AgentStatusSync 的自动流转机制
- 不改动 TaskDetail 弹窗组件本身（只改变它的打开入口）
- 不引入拖拽排序（只做跨列拖拽改状态）

## Decisions

### 1. 状态模型

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  待处理   │ ──▶│  生成中   │ ──▶│  待审核   │ ──▶│  已完成   │
│ (pending) │    │(generating)│    │ (review)  │    │(approved) │
└──────────┘    └──────────┘    └──────────┘    └──┬───────┘
                                                    │ 归档按钮
                                                    ▼
                                                已归档(archived)
                     待审核列有关闭按钮 → 已关闭(closed)
```

- 看板只显示 4 列：待处理、生成中、待审核、已完成
- `closed` 和 `archived` 是终点态，不在看板列中显示
- 仅 `review` 列卡片有「关闭」按钮，仅 `approved` 列卡片有「归档」按钮
- rejected 不单独成列——审核不通过直接点关闭，或拖回待处理/生成中

### 2. 拖拽实现：HTML5 Drag & Drop API

无需引入第三方库。KanbanBoard 使用原生 HTML5 Drag API：

- 每张卡片设置 `draggable="true"`
- `dragstart` 记录被拖卡片的 `task.id`
- 每个列 body 监听 `dragover` / `drop`：
  - `dragover` 阻止默认 + 添加视觉高亮
  - `drop` 取到拖拽卡片的 id + 目标列的 status key → 调用 `this._ts().update(id, { status })` → 刷新看板
- 禁止拖到同一列（无意义操作），不做列内排序

### 3. 卡片点击打开 TaskDetail

当前卡片点击是 `window.location.hash = '#tasks/${task.id}'`。改为直接调用 `TaskDetail.open(this.api, this.state, this._sr, task)` — 与 TasksView 当前做法一致。

### 4. ReviewMode 移除

- 删除 `src/business/views/ReviewMode.js`
- manifest 中移除 `{ hash: 'review', ... }` 条目和菜单组引用

### 5. TasksView 去按钮 + 已归档 toggle

- 移除 `_transitionTask()` 方法
- 移除 `_renderTaskCard()` 中的 action buttons 区域（第 207-219 行）
- 移除 `NEXT_TRANSITIONS` 映射表
- 筛选栏加一个 checkbox：「显示已归档」
  - 默认不勾选，`_loadAndRender` 按 status != 'archived' 过滤
  - 勾选后显示所有状态（包括 archived）
  - 结果按 createdAt 倒序排列

### 6. DB Migration

- `business-db.init-def.js`：`tasks` 表 status 字段 enum 追加 `'closed'`、`'archived'`
- 版本号 1.1.0 → 1.2.0
- `getTable` 幂等守卫不变

## Risks / Trade-offs

- **列间拖拽误操作**：拖拽即刻持久化，没有二次确认 → 用户在 review→approved 或 review→generating 之间拖拽是合理操作，不需要确认。误拖 pending→generating 同理。
- **刷新时机**：每次 drop 立即 update + refresh，拖拽方用户即刻看到结果。
- **closed/archived 不可逆**：当前设计关闭/归档后没有「撤销」——但 DataRepository 有 update，可以在 TasksView 或 DB Manager 中手动恢复。暂不处理。
