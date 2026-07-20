## Context

ThemeStrategy 卡片当前在顶部渲染一个水平颜色条（`<div>` swatch，`width:100%; height:4px`）来标识主题色。看板卡片则使用 `border-left` 在卡片左侧实现色条。此设计将 ThemeStrategy 切换到相同的 `border-left` 模式，统一视觉语言。

**当前状态**（卡片顶部水平色条）：

```
┌─────────────────────────────────────┐
│ ██████████████████████████████████  │  ← swatch div
│  标题                         [✎ ✕] │
│  标签1  标签2              日期     │
│  描述...                            │
└─────────────────────────────────────┘
```

**目标状态**（左侧垂直色条，与看板一致）：

```
┌─────────────────────────────────────┐
║│  标题                         [✎ ✕] │
║│  标签1  标签2              日期     │
║│  描述...                            │
└─────────────────────────────────────┘
```

## Goals / Non-Goals

**Goals：**
- 将 ThemeStrategy 卡片的主题色标识从顶部水平条移到左侧垂直条
- 与看板卡片的 `border-left` 模式一致
- 移除额外的 swatch DOM 元素，简化渲染
- 零功能变化

**Non-Goals：**
- 不涉及其他视图（IdeaBoard、TopicsView 等）的卡片样式调整
- 不改动 `ms-item-card` 的基础 CSS 定义（此样式为所有内容卡片共享，目前不应注入主题色）
- 不修改主题数据的 schema 或 API

## Decisions

### 方案 A（选定）：`border-left` 内联样式

移除 swatch `<div>`，在卡片上添加内联样式：

```javascript
// 删除：
const swatch = document.createElement('div');
swatch.style.cssText = `width:100%;height:4px;border-radius:2px;margin-bottom:10px;background:${theme.color || '#e94560'};`;

// 添加：
card.style.borderLeft = `4px solid ${theme.color || '#e94560'}`;
```

**理由：**
- 与看板卡片（`.ms-kanban-card`）的 `border-left` 模式完全一致，已验证在生产中使用
- 无需新增 CSS 类或 `::before` 伪元素
- `.ms-item-card` 已有 `border: 1px solid var(--ms-border)`，`border-left` 内联样式优先级高于 CSS 类中的 `border-color`，hover 时 `border-color: var(--ms-accent)` 不会覆盖左侧颜色
- 颜色值动态（每个主题独立），必须用内联样式，使用 `border-left` 比伪元素方案更直接

### 关于 border-radius 的考虑

`.ms-item-card` 有 `border-radius: var(--ms-radius)`。看板卡片已在使用相同模式（`border: 1px solid var(--ms-border)` + `border-left: 3px solid <color>`），同样的 border-radius 表现良好。左侧 4px 边框会自然跟随圆角，与看板视觉一致。

### 关于 hover 状态的考虑

当前 CSS：
```css
.ms-item-card:hover { border-color: var(--ms-accent); }
```

内联 `border-left: 4px solid ${color}` 设置了具体的 `border-left-color`，其优先级高于 CSS 类中的 `border-color` 属性。hover 时左侧色条保持不变，其他三边变为主色——此行为符合预期。

## Risks / Trade-offs

- **[低风险] border-radius 处 4px 边框与 1px 边框的过渡**：与看板卡片相同模式，已验证可行。合并时确认视觉效果即可。
- **[低风险] 与 `unify-card-views` change 的任务 1.x（内联样式迁移）冲突**：`unify-card-views` 计划将 ThemeStrategy 中的内联样式迁移到 CSS 类。左侧色条的颜色值因主题而异，必须保留为内联样式，与 `unify-card-views` 的诉求不冲突。实施时注意协调，避免两边同时修改。
