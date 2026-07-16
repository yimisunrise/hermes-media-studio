## Context

三个面板（IdeaBoard、TopicBoard、TasksView）各自用不同的方式实现布局：
- IdeaBoard/TopicBoard：`ce()` 辅助函数拼内联样式，JS hover handler 控制卡片边框色
- TasksView：`_injectStyles()` 注入 `<style>` 块，在 view 内作用域化

这种分化导致视觉不一致、维护成本高。

## Goals / Non-Goals

**Goals:**
- 在 `app.css` 中定义 5 个公共 CSS 类，供所有面板复用
- IdeaBoard/TopicBoard：移除卡片的内联样式和 JS hover handler，改用 CSS 类 + `:hover`
- TasksView：移除 `_injectStyles()` 和 injected `<style>` 块，改用公共 CSS 类
- 三个面板的头部、筛选栏、卡片容器布局统一

**Non-Goals:**
- 不合并或重构 `ce/bn/sp/btn` 辅助函数（不影响视觉一致性）
- 不改动数据流、事件处理、模态框等非布局逻辑

## Decisions

1. **CSS 类命名**：使用 `ms-panel-*` 前缀，遵循项目 BEM-like 约定

| CSS 类 | 用途 | 对应原样式源 |
|--------|------|------------|
| `.ms-panel-section` | 面板外层容器，flex:1 纵向 | IdeaBoard/TopicBoard 无 wrapper、TasksView `.ms-tasks-view` |
| `.ms-panel-header` | 头部：标题 + 操作按钮 | IdeaBoard/TopicBoard 内联 `padding:12px 16px` flex |
| `.ms-panel-filterbar` | 筛选栏：按钮/下拉/搜索 | IdeaBoard/TopicBoard 内联 `padding:6px 16px` flex |
| `.ms-panel-body` | 列表区域：可滚动 flex:1 | IdeaBoard/TopicBoard 内联 `padding:12px 16px` scroll |
| `.ms-item-card` | 列表卡片容器 + hover | IdeaBoard/TopicBoard 内联 + JS hover、TasksView `.ms-task-card` |

2. **IdeaBoard/TopicBoard** 不做全量重构——只替换元素 class 名和移除内联样式/JS hover，`ce/bn/sp/btn` 继续使用

3. **TasksView** 移除 `_injectStyles()`，将原有 CSS 规则中通用部分迁移到 app.css，view 特有规则保留在 app.css 中

## Risks / Trade-offs

- [原有卡片样式差异] → IdeaBoard/TopicBoard 卡片较窄（2 列网格），TasksView 卡片全宽，统一后会有细微间距调整，但用户已要求完全一致
- [inline style 残留] → 部分一次性元素（分隔线 `sep`、搜索输入框 inline `width`）继续使用内联，不提取到 CSS 类，避免过度抽象
