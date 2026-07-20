---
name: hermes-ui-patterns
description: Hermes Media Studio 卡片/列表 UI 统一交互规范。当在 src/business/views/ 下创建新视图、修改现有卡片列表展示、添加操作按钮时，必须加载此 skill 以确保一致的 UI 交互风格。涉及 Inspiration（灵感）、Topic（选题）、Theme（主题策略）、Task（任务管理）、Template（模板）、Publish（发布管理）、PlatformConfig（平台配置）等视图的列表展示必须遵循此 skill。
license: MIT
metadata:
  author: hermes-media-studio
  version: "1.0"
---

# Hermes UI Patterns

本项目存在 5 种不同的按钮可见性机制、3 种卡片布局、以及 4 种卡片点击行为——这种分裂导致用户每次进入不同视图都需重新适应。本 skill 定义了统一的交互规范，所有视图列表展示必须遵循。

> 配套人工可读文档见 `UI_GUIDELINES.md`，内含设计原则和卡片结构示意。

---

## 核心规则

### 规则 1：列表数据统一使用卡片展示（不使用 HTML `<table>`）

- 发布管理（PublishManager）和平台配置（PlatformConfig）等少量表格形态的视图需迁移为卡片
- 卡片使用 `ms-item-card` 类（已定义于 `src/business/app.css` L48-61）
- 异常说明：**数据库管理器（DatabaseManager）** 的数据网格可保留表格形态，因其实质是元数据驱动的动态表编辑器

### 规则 2：操作按钮采用 hover 显示，不默认可见

- 所有卡片级别的操作按钮（编辑、删除等）初始隐藏，鼠标悬停卡片时显示
- 使用已有 CSS 类 `.ms-item-card-actions`（CSS L110-120）实现，避免 JS `mouseenter/mouseleave`
- **不要使用**内联 `display:flex` 覆盖该 CSS 行为（如 TemplatesView 的 `.ms-template-actions` 做法）

```css
/* ✅ 正确的做法：使用已有的 ms-item-card-actions 类 */
.ms-item-card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: none;     /* 默认隐藏，hover 时由父级 :hover 显示 */
  gap: 4px;
}

/* ❌ 不要做：用内联 display:flex 让按钮始终可见 */
```

### 规则 3：点击卡片打开查看/编辑弹窗（Modal）

- 所有卡片点击应打开一个 Modal 弹窗，展示详情或编辑表单
- **不要**在卡片上执行展开/折叠（IdeaBoard 的展开模式应改为 Modal 弹窗）
- **不要**让卡片点击无反应（TemplatesView 当前无点击事件）
- 使用 `e.stopPropagation()` 阻止操作按钮的点击冒泡到卡片点击事件

### 规则 4：按钮使用 `stopPropagation` 防止卡点点击触发

```javascript
// ✅ 正确的做法
btn.onclick = (e) => {
  e.stopPropagation();
  this._editItem(item);
};
```

### 规则 5：使用共享 CSS 类，避免内联样式

- 卡片容器：使用 `class="ms-item-card"` 而非 `style.cssText`
- 操作按钮容器：使用 `class="ms-item-card-actions"` 而非内联 `style.display`
- 通用按钮：使用 `class="ms-btn ms-btn-sm ms-btn-icon"` 而非自行写样式
- 危险操作按钮：添加 `style="color:var(--ms-danger)"` 
- 只有视图特化的样式（如任务状态徽章颜色）才使用视图独有类名

### 规则 6：删除操作统一使用 Modal 确认弹窗

- **不要使用** `window.confirm()`（TemplatesView 当前使用，应改为 Modal）
- 使用项目统一的 `Modal` 类（来自 `framework/ui/`），确认文案清晰，危险操作用红色按钮

### 规则 7：空状态使用 `ms-empty` 框架类

- 空状态容器使用 `class="ms-empty"`
- 图标使用内联 SVG（**不要使用 emoji**，如 📋、🎯）
- 文字提示简洁清晰，如"暂无数据，点击上方新建"

### 规则 8：状态标签一致

- 表示状态的 `<span>` 使用 `class="ms-task-status-badge"`（适用于所有视图的状态展示）
- 类型标签使用 `class="ms-task-type-badge"`
- 危险/警告状态的文字颜色使用 `var(--ms-danger)` / `var(--ms-warning)`

---

## 卡片布局分类

根据内容密度不同，分为三种卡片类型：

### A. 内容卡片（Content Card）— 默认

适用于大部分列表场景（灵感、选题、任务、模板等）。

```
┌─────────────────────────────────────────┐
│  [状态点] 标题文字                  [✎ ✕] │  ← hover 时右上角显示操作按钮
│  状态标签  主题标签  2024-01-15           │  ← 元信息行
│  摘要/描述文字（可选，1-2行）              │  ← 可选附加内容
└─────────────────────────────────────────┘
```

- CSS：`ms-item-card` + `ms-item-card-actions`
- 操作按钮：hover 显示，右上角
- 卡片点击：打开详情/编辑弹窗
- 示例视图：TopicBoard、TasksView（需改造）

### B. 网格卡片（Grid Card）— 有缩略图

适用于素材库等需要展示图片的场景。

```
┌───────────┐
│  🖼️       │
│  缩略图    │
│           │
├───────────┤
│ 名称      │
│ 主题标签   │
│ 参数信息   │
└───────────┘
```

- CSS：`ms-asset-grid`（grid 容器）+ `ms-media-card`（卡片）
- 操作按钮：hover 显示，右上角 overlay
- 卡片点击：打开详情 Modal
- 示例视图：AssetGallery（当前正确）

### C. 看板卡片（Kanban Card）— 流水线

适用于看板列的卡片，按钮始终显示于 footer。

```
┌─────────────────────┐
│ 标题                │
│ 类型徽章  模式徽章    │
│ 创建时间            │
├─────────────────────┤
│    [关闭] [归档]     │  ← 始终可见，spacer 右对齐
└─────────────────────┘
```

- CSS：`ms-kanban-card` + `ms-kanban-card-footer`
- 操作按钮：始终可见，位于底部 footer（spacer 右对齐）
- 卡片点击：进入审核/详情（看板特有的拖拽行为保持）
- 示例视图：KanbanBoard（当前正确，保持不变量）

### 卡片类型选择指南

| 场景 | 使用类型 | 理由 |
|------|---------|------|
| 纯文本/少量元数据 | A. 内容卡片 | 通用场景 |
| 需要展示图片/缩略图 | B. 网格卡片 | 视觉优先 |
| 看板流水线中的列 | C. 看板卡片 | 拖拽 + 快速操作 |
| 大量数据的列表 | A. 内容卡片 | 垂直列表易于扫描 |
| 平台配置/设置项 | A. 内容卡片 | 每项内容精简，卡片足够 |

---

## 代码模板

### 内容卡片渲染模板

```javascript
_renderCard(item) {
  const card = document.createElement('div');
  card.className = 'ms-item-card';

  // --- 卡片内容 ---
  const info = document.createElement('div');
  // ...填充信息、标签、元数据等...

  // --- 操作按钮（hover 显示） ---
  const actions = document.createElement('div');
  actions.className = 'ms-item-card-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'ms-btn ms-btn-sm ms-btn-icon';
  editBtn.innerHTML = '✎';
  editBtn.onclick = (e) => {
    e.stopPropagation();
    this._editItem(item);
  };

  const delBtn = document.createElement('button');
  delBtn.className = 'ms-btn ms-btn-sm ms-btn-icon';
  delBtn.innerHTML = '✕';
  delBtn.style.color = 'var(--ms-danger)';
  delBtn.onclick = (e) => {
    e.stopPropagation();
    this._deleteItem(item);
  };

  actions.append(editBtn, delBtn);
  card.append(info, actions);

  // --- 卡片点击 ---
  card.onclick = () => this._openDetail(item);

  return card;
}
```

### 空状态模板

```javascript
_renderEmpty() {
  const el = document.createElement('div');
  el.className = 'ms-empty';
  el.innerHTML = `
    <svg class="ms-empty-icon" width="48" height="48" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
      <polyline points="13 2 13 9 20 9"/>
    </svg>
    <div>暂无数据</div>
  `;
  return el;
}
```

### 网格卡片模板（素材库风格）

```javascript
_renderGridCard(item) {
  const card = document.createElement('div');
  card.className = 'ms-media-card';

  const thumb = document.createElement('div');
  thumb.className = 'ms-media-card-thumb';
  // ...缩略图内容...

  const info = document.createElement('div');
  info.className = 'ms-media-card-info';
  // ...信息内容...

  const actions = document.createElement('div');
  actions.className = 'ms-item-card-actions';  // 复用相同类

  // ...操作按钮...

  card.append(thumb, info, actions);
  card.onclick = () => this._openDetail(item);
  return card;
}
```

---

## 实施清单（适用于所有列表视图）

创建或修改视图时逐条核对：

- [ ] **卡片容器**使用 `ms-item-card` 类（内容卡片）或 `ms-media-card` 类（网格卡片）
- [ ] **操作按钮容器**使用 `ms-item-card-actions` 类，CSS hover 控制显示/隐藏
- [ ] **所有操作按钮**的 click 事件包含 `e.stopPropagation()`
- [ ] **卡片点击**打开详情/编辑 Modal（而非展开/折叠，而非无反应）
- [ ] **删除操作**使用 Modal 确认弹窗（非 `window.confirm`）
- [ ] **空状态**使用 `ms-empty` 类 + 内联 SVG 图标（非 emoji）
- [ ] **状态标签**使用 `ms-task-status-badge` 类（或 `ms-task-type-badge`）
- [ ] **无内联样式**用于卡片容器和操作按钮容器（视图特化样式可保留）
- [ ] **删除按钮**使用 `style="color:var(--ms-danger)"` 标记危险操作
- [ ] **SVG 图标**优先，不使用 emoji 字符

---

## 不适用范围

以下场景不需要应用此规范：

- 数据库管理器（`DatabaseManager.js`）的数据网格——因其元数据驱动的动态表特性
- 审核模式（`ReviewMode.js`）——键盘驱动的批量操作，与传统卡片交互不同
- 文稿编辑器（`ContentEditor.js`）——编辑界面，非列表展示
- 任务详情弹窗（`TaskDetail.js`）——详情弹窗，非列表页

---

## 参考

- `src/business/app.css` L48-61 — `.ms-item-card` 定义
- `src/business/app.css` L110-120 — `.ms-item-card-actions` 定义
- `src/business/app.css` L168-186 — `.ms-kanban-card` 定义
- `src/business/app.css` L279-293 — `.ms-media-card` 定义
- `src/framework/app.css` — 框架级基础样式（按钮、表单、Modal）
- `UI_GUIDELINES.md` — 人工可读的设计规范文档
