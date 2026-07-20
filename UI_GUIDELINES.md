# Hermes Media Studio UI 设计规范

> 本规范定义了 Hermes Media Studio 扩展中卡片/列表的统一展示和交互模式。**配套 AI 开发规范见 `.opencode/skills/hermes-ui-patterns/SKILL.md`**，AI 在处理视图相关任务时会自动加载该规范。

---

## 设计原则

1. **一致性** — 所有列表视图的展示形态和操作逻辑保持一致
2. **可发现性** — 操作按钮通过鼠标悬停自然揭示，不干扰内容阅读
3. **低认知负担** — 用户进入每个视图的操作预期相同：悬停看操作，点击看详情
4. **CSS 驱动优先** — 能用 CSS 实现的效果（hover、过渡动画）优先于 JS 事件

---

## 卡片交互模型

### 基本交互

| 操作 | 行为 | 说明 |
|------|------|------|
| **鼠标悬停卡片** | 卡片边框高亮，右上角显示操作按钮 | 使用 `ms-item-card:hover` + `ms-item-card-actions` |
| **悬停操作按钮** | 按钮变色（危险操作变红） | 通过 CSS `:hover` 控制 |
| **点击卡片主体** | 打开详情/编辑弹窗（Modal） | 所有视图一致 |
| **点击操作按钮** | 执行对应操作（编辑/删除等） | `stopPropagation` 避免触发卡片点击 |

### 卡片结构

```
┌─────────────────────────────────────────┐
│  标题/主要内容                     [✎ ✕] │  ← hover 时操作按钮右上角出现
│  状态标签  分类标签  日期/时间            │  ← 元信息行
│  摘要/描述（可选，1-2 行截断）            │  ← 可选的附加内容
└─────────────────────────────────────────┘
```

### 按钮行为

- **编辑按钮**（✎）：打开编辑表单 Modal，预填当前数据
- **删除按钮**（✕）：弹出确认 Modal，确认后执行删除，无二次确认
- **更多操作**（⁝）：弹出下拉菜单（用于 3+ 操作的场景）

---

## 当前视图适配状态

| 视图 | 当前形态 | 目标形态 | 主要改动 |
|------|---------|---------|---------|
| **灵感（IdeaBoard）** | 点击展开卡片底部显示按钮 | hover 显示按钮 + 点击打开 Modal | 删除展开模式，改为 hover actions + Modal |
| **选题（TopicBoard）** | ✅ 基本符合 | 同左 | 仅微调（确认使用 Modal 编辑） |
| **主题策略（ThemeStrategy）** | ✅ 交互符合，但全是内联样式 | 改用 CSS 类 | 迁移内联样式为 `ms-item-card` 类 |
| **任务管理（TasksView）** | 按钮始终可见，卡片点击开详情 | hover 显示按钮 | 将底部按钮改为 `ms-item-card-actions` |
| **模板管理（TemplatesView）** | 按钮始终可见，卡片无点击 | hover 显示按钮 + 卡片点击开详情 | 使用 `ms-item-card-actions` 类 + 添加卡片点击 |
| **发布管理（PublishManager）** | 表格形态 | 卡片形态 | 从 `<table>` 迁移为 `ms-item-card` 列表 |
| **平台配置（PlatformConfig）** | 表格形态 | 卡片形态 | 从 `<table>` 迁移为 `ms-item-card` 列表 |

---

## CSS 类参考

### 卡片容器

| CSS 类 | 用途 | 定义位置 |
|--------|------|---------|
| `.ms-item-card` | 通用内容卡片 | `business/app.css:48` |
| `.ms-media-card` | 带缩略图的网格卡片 | `business/app.css:279` |
| `.ms-kanban-card` | 看板卡片 | `business/app.css:168` |

### 卡片子元素

| CSS 类 | 用途 | 定义位置 |
|--------|------|---------|
| `.ms-item-card-actions` | 操作按钮容器（hover 显示） | `business/app.css:110` |
| `.ms-task-status-badge` | 状态标签 | `business/app.css:72` |
| `.ms-task-type-badge` | 类型标签 | `business/app.css:207` |
| `.ms-task-mode-badge` | 模式标签 | `business/app.css:217` |
| `.ms-kanban-card-footer` | 看板卡片底部 | `business/app.css:240` |
| `.ms-card-footer-spacer` | 弹性撑开 | `business/app.css:246` |

### 按钮

| CSS 类 | 用途 | 定义位置 |
|--------|------|---------|
| `.ms-btn` | 基础按钮 | `framework/app.css` |
| `.ms-btn-sm` | 小号按钮 | `framework/app.css` |
| `.ms-btn-icon` | 图标按钮 | `framework/app.css` |
| `.ms-btn-primary` | 主要按钮 | `framework/app.css` |

### 布局

| CSS 类 | 用途 | 定义位置 |
|--------|------|---------|
| `.ms-panel-section` | 面板容器 | `business/app.css:6` |
| `.ms-panel-header` | 面板头部 | `business/app.css:15` |
| `.ms-panel-filterbar` | 面板过滤栏 | `business/app.css:30` |
| `.ms-panel-body` | 面板内容区 | `business/app.css:42` |
| `.ms-empty` | 空状态容器 | `framework/app.css:371` |

---

## 代码约定

### 命名空间

- CSS 类名：`ms-` 前缀（如 `ms-item-card`、`ms-task-status-badge`）
- DOM ID：`media-studio-` 前缀（如 `media-studio-app`）
- 不要使用可能与 WebUI 冲突的裸 CSS 类名

### UI 文本

- 全部 UI 文本使用中文（标签、注释、消息）
- 图标使用内联 SVG（Lucide 风格），**不使用 emoji**
- CSS 变量使用 `var(--bg, #1a1a2e)` 模式继承 WebUI 主题令牌

### 构建

- 无构建步骤，浏览器直接加载扩展文件
- 模块导入使用原生 ES Module
- 不使用 npm 包

---

## 常见错误检查

- [ ] 卡片使用了内联 `style.cssText` 而非 `ms-item-card` 类？
- [ ] 操作按钮使用了 `display:flex` 内联样式而非 `ms-item-card-actions`？
- [ ] 按钮的 click 事件缺少 `e.stopPropagation()`？
- [ ] 删除操作使用了 `window.confirm` 而非 Modal？
- [ ] 空状态使用了 emoji 而非 SVG？
- [ ] 卡片点击执行了展开/折叠而非打开 Modal？
- [ ] 使用了 `<table>` 来展示列表数据（数据库管理器除外）？

---

*本规范随项目演进持续更新。变更需通过 OpenSpec 流程提交。*
