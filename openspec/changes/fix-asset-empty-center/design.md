## Context

素材管理页面（`AssetGallery.js`）使用 CSS Grid 排列素材卡片。当无数据时，空状态 `.ms-asset-empty` 作为 grid 子项渲染在 `.ms-asset-grid` 容器中。

当前 `.ms-asset-grid` 定义：
```css
.ms-asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
```

`auto-fill` 会根据容器宽度创建尽可能多的列轨道（1200px 容器约 6 列 200px）。空状态 div 作为 grid 子项只占据第一个 cell（~200px），导致文字虽然在该 cell 内居中，但在整个页面范围内偏左。

## Goals / Non-Goals

**Goals:**
- 空状态文字在页面（grid 容器）中水平居中
- 最小化改动，不改变现有 HTML 结构或 JS 逻辑

**Non-Goals:**
- 不改变素材网格布局行为
- 不涉及功能逻辑或交互变更
- 不做视觉重设计（仅修复居中问题）

## Decisions

### 方案：`grid-column: 1 / -1` + `text-align: center`

在 `.ms-asset-empty` 上增加两条 CSS 声明：

```css
.ms-asset-empty {
  grid-column: 1 / -1;  /* 跨越所有 grid 列 */
  text-align: center;    /* 文字水平居中 */
}
```

**理由：**
- `grid-column: 1 / -1` 让空状态元素从第一列跨越到最后一列，不再被限制在单个 cell 中
- `text-align: center` 确保内部的块级文字居中（flex 容器的 `align-items: center` 在跨列后仍然生效，但加 text-align 作为兜底）
- 改动只需修改 CSS 样式块中的一条规则，不涉及 JS、HTML 或其它文件

**被否决的方案：**

| 方案 | 否决理由 |
|------|---------|
| 改 `auto-fill` 为 `auto-fit` | 会影响网格布局的轨道折叠行为，可能引入其它布局问题 |
| 空状态移出 grid 容器 | 需要修改 JS 渲染逻辑，改动量和风险更大 |
| 新增 wrapper 容器 | 增加不必要的 DOM 层级 |

## Risks / Trade-offs

- **无风险**：此变更仅为 CSS 规则扩展，不改变现有布局的其它方面。`.ms-asset-empty` 只在空状态时才作为 grid 子项出现，不影响正常素材卡片的网格排列。
