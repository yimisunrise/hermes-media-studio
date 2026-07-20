## Context

Hermes Media Studio 是一个纯前端 WebUI 扩展，无构建步骤，使用 Vanilla JS 和原生 ES Module。CSS 命名空间约定为 `ms-` 前缀。所有视图位于 `src/business/views/`，框架层工具在 `src/framework/`。

当前存在 5 种浮动层实现，分布在 10 个调用点，每种实现在 overlay 创建、CSS 类名、z-index、背景色、动画、布局方式上都不一致。核心问题是无共享抽象层，每个视图从零开始通过 `document.createElement` 构建 modal。

### 现有调用点清单

| 视图 | 方法 | CSS 类 | 宽度 | 追加位置 |
|------|------|--------|------|----------|
| ThemeStrategy | `_openEditor` | `.ms-modal-overlay` | 480px | `this._container` |
| ThemeStrategy | `_deleteTheme` | `.ms-modal-overlay` | 360px | `this._container` |
| TaskDetail | `open` | `.ms-task-modal-overlay` | 680px inline | `document.body` |
| TaskDetail | `_openContentEditor` | `.ms-task-modal-overlay` | 820px inline | `document.body` |
| TasksView | `_showCreateForm` | `.ms-task-modal-overlay` | 480px | `document.body` |
| AssetGallery | `_showAssetDetail` | `.ms-task-modal-overlay` | 480px | `document.body` |
| DatabaseManager | `_showDbForm` | `.ms-db-form-overlay` | 400~600px | `document.body` |
| DatabaseManager | `_showTableForm` | `.ms-db-form-overlay` | 400~700px | `document.body` |
| DatabaseManager | `_buildRecordForm` | `.ms-db-form-overlay` | 400~600px | `document.body` |
| IdeaBoard | 6处调用 | 纯内联 style | 多种 | `document.body` |
| TopicBoard | (同 IdeaBoard 辅助函数) | 纯内联 style | 多种 | `document.body` |

## Goals / Non-Goals

**Goals:**
- 提供一个共享的 `Modal` 类，封装 overlay/modal 的完整生命周期（创建、展示、关闭、销毁）
- 统一 CSS 覆盖层样式：一套 `.ms-overlay` / `.ms-modal` + 内部区块类
- 所有 10 个现有调用点迁移到新 Modal 组件
- 删除冗余的 CSS 类和辅助函数

**Non-Goals:**
- 不改变已有 modal 的业务逻辑和交互行为（submit/close 回调保留原样）
- 不重构 modal 内部的具体表单字段布局或样式（仅迁移创建方式）
- 不引入第三方依赖
- 不改变 `.ms-init-overlay`（启动覆盖层，用途不同）

## Decisions

### 决策 1: 组件形态 — 类（Class）而非函数

状态管理：Modal 需要在调用侧保留引用以便绑定事件（`m.el.querySelector(...)`），函数式方案需要返回引用同样复杂。
结论：使用 `class Modal`。

```js
const m = new Modal({ title: '编辑', size: 'md' });
m.setBody(`<div>...</div>`);
m.setFooter(`<button>取消</button><button>保存</button>`);
m.open();
// 后续通过 m.el 访问容器 DOM，通过 m.close() 关闭
```

备选方案对比：
- **纯函数** `showModal(opts)` → 返回 `{ close, el }`。可行但调用方需要解构，不如 class 直观。
- **HTML 自定义元素** `<ms-modal>` → 需要 Custom Elements 注册和 Shadow DOM，对 Vanilla JS 项目过重。

### 决策 2: CSS 类名 — `.ms-overlay` + `.ms-modal` + 区块类

新的统一 CSS 类名体系：
- `.ms-overlay` — 覆盖层背景（替代 `.ms-modal-overlay` / `.ms-task-modal-overlay` / `.ms-db-form-overlay`）
- `.ms-modal` — modal 容器（统一现有 3 种 modal 容器）
- `.ms-modal-header` — 标题栏（替代各视图手动创建的 header）
- `.ms-modal-body` — 可滚动内容区
- `.ms-modal-footer` — 底部操作栏

z-index：统一设为 `1000`（覆盖现有 999~1000 区间，仅 InitOverlay 的 9999 不变）。
背景：统一 `rgba(0,0,0,0.6)`（采用多数模式的 0.6）。
动画：统一 `ms-fade-in 0.15s ease`（采用 DB 表单已有的 fade-in）。

放置在 `src/framework/app.css` 中（框架层），同时从 `src/business/app.css` 中删除重复定义。

### 决策 3: Modal 尺寸管理 — 预设 + 自定义

提供 3 个预设值，同时保留 `width`/`maxWidth` 覆盖能力：

```js
const SIZE_MAP = {
  sm: '360px',
  md: '480px',
  lg: '640px',
};
```

任选其一：
```js
new Modal({ size: 'md' })          // 预设
new Modal({ width: '680px' })      // 自定义
new Modal({ size: 'lg', maxWidth: '800px' })  // 预设+调整
```

### 决策 4: 追加容器 — 默认 document.body，可覆盖

ThemeStrategy 的两个 modal 追加到 `this._container`（视图容器内），其余追加到 `document.body`。Modal 的 `container` 选项默认 `document.body`，调用方按需传入。

### 决策 5: 迁移策略 — 逐个视图替换，不批量重构

每个视图的 modal 创建逻辑独立，迁移时只替换创建方式，不改动业务逻辑。具体来说：
- createElement 链 → `new Modal().setBody()`
- innerHTML 构造 → 保留 HTML 字符串直接传给 `setBody`
- 事件绑定（querySelector + addEventListener）→ 绑定到 `m.el.querySelector()`
- 关闭逻辑 → `m.close()` 的 `closeOnOverlay` 默认为 true

## Risks / Trade-offs

- **风险**: 某个 modal 的结构特殊（如 TaskDetail._openContentEditor 使用 flex 布局 + 70vh 高度），无法直接套用统一布局。
  **缓解**: Modal 支持自定义 size/width/maxWidth，且 `setBody` 接受 HTML 字符串，特殊布局通过 body 内容自行控制。
- **风险**: ThemeStrategy 的 modal 追加到 `this._container`，如果 container 的 CSS `position` 不是 relative/fixed/absolute，overlay 的 `position:fixed` 会相对于视口而非容器。
  **缓解**: 这是 ThemeStrategy 原有的行为，迁移前后一致，不加变更。
- **风险**: 迁移过程中可能遗漏某处调用。
  **缓解**: tasks.md 按视图逐一列出，每个任务的验收标准包含「检查该视图的所有 modal 调用点已迁移」。
