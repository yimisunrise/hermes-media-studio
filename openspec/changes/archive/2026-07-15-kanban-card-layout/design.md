## Context

当前 `.ms-kanban-card` 的 DOM 顺序是：类型标签 → 模式标签 → 摘要 → 时间 → 操作按钮。标签在顶部导致信息层级不清晰——最重要的标题（摘要）被排在标签之后，用户需要扫描才能找到。本次将布局改为标题→时间→底部栏的顺序，底部栏内标签左对齐、按钮右对齐。

## Goals / Non-Goals

**Goals:**
- 标题（加粗）作为卡片最突出的第一行
- 时间紧随标题之后，灰色小字
- 新增底部栏容器，flex space-between 分隔标签区域和按钮区域
- 类型/模式标签从顶部移至底部栏左侧

**Non-Goals:**
- 不改动列布局、拖拽逻辑、数据获取
- 不新增样式变量或主题依赖

## Decisions

- 用 `display: flex; justify-content: space-between; align-items: center` 的 footer 容器实现左/右分离
- 标题改用 `font-weight: 600; font-size: 14px` 以区别于其他文字
- 按钮不再需要 `margin-top: 4px`（footer 中垂直居中）
- DOM 操作在 `_renderTaskCard` 中局部重排，不涉及外部组件

## Risks / Trade-offs

- 无——纯 DOM 顺序 + CSS 调整，不改变功能逻辑
