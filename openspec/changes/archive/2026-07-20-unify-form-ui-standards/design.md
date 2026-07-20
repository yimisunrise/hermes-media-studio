## Context

Hermes Media Studio 的视图文件经过多次开发迭代，形成了四种不同的表单行构建方式与三种间距标准。之前已完成 `form-elements` spec（统一 input/select/textarea 的元素级样式：border-radius、padding、height），但表单行布局层（行容器、行间距、标签样式、构建 helpers）仍高度不一致。

**当前状态**：10 个视图文件各自用不同方式构建表单，形成 `ms-form-row`（误用为列）、`ms-form-group`、纯内联 div、`ms-db-form-field` 四套并行体系。间距有 10px / 12px / 14px 三种。辅助函数如 `_formField()`、`_fld()` 在不同文件间重复。

**约束条件**：
- 无构建步骤，浏览器直接加载 ES module
- 无 npm 依赖，无新框架
- 不改变业务逻辑与数据流
- CSS 变量体系（`--ms-input-*`）已建立

## Goals / Non-Goals

**Goals:**
- 所有堆叠表单行统一使用 `ms-form-group` 作为行容器
- 统一行间距为 `12px`（CSS 类控制，零内联覆盖）
- 统一标签使用原生 `<label>`，样式由 `ms-form-group label` CSS 控制
- 创建 `FormBuilder` 共享工具，消除全部重复的 `_formField()` / `_fld()` / `_themeSel()` 辅助函数
- DatabaseManager 废弃专属 `ms-db-form-field` / `ms-db-form-label` 体系，改用标准类
- 模态框标题统一为 `新建{X}` / `编辑{X}`

**Non-Goals:**
- 不改动表单元素级样式（`form-elements` spec 已完成：border-radius、padding、height）
- 不改动 Modal 框架本身
- 不改动 ContentEditor 的专属编辑区样式（`ms-editor-title-input`、`ms-content-editor-textarea`）
- 不改动筛选栏布局（`ms-panel-filterbar`）
- 不改动业务逻辑与数据流
- 不引入 npm 依赖或构建步骤

## Decisions

### Decision 1: 使用 `ms-form-group` 作为标准表单行容器（而非修改 `ms-form-row`）

- **选项 A**：修改 `ms-form-row` CSS 使其适配列布局（当前所有使用者均覆盖为 `flex-direction: column`）
- **选项 B**：使用 `ms-form-group`（已正确定义为堆叠标签+输入布局）
- **选择 B**，理由：
  - `ms-form-row` 的语义是水平并排（label + input 在一行），不应为列布局扭曲其本意
  - `ms-form-group` 已定义完整的堆叠布局：标签 `display: block`、`margin-bottom: 4px`、input 全宽
  - `ms-form-group` 已内建 `ms-form-group-inline`、`ms-form-error` 等扩展能力
  - 仅修改间距值（10px → 12px），无需改动结构

### Decision 2: 统一间距为 12px

- **当前值**：10px（`ms-form-group` / ThemeStrategy）、12px（`ms-form-row` / TasksView / AssetGallery / DatabaseManager）、14px（TemplatesView / IdeaBoard / TopicBoard / PublishManager / PlatformConfig）
- **选择 12px**，理由：
  - 是覆盖率最广的值（3 个视图 + 1 个 CSS 体系使用）
  - 10px 在某些视觉密度高的场景偏紧，14px 在紧凑布局中偏松
  - 12px 是 Material Design 和大多数设计系统的标准表单间距

### Decision 3: 共享 FormBuilder 工具作为独立 ES module

- **位置**：`src/business/views/components/FormBuilder.js`
- **接口**：`formGroup(id, labelText, inputElement, options?)` 加便捷工厂方法
- **为何不放入 `framework/utils/`**：此工具涉及业务层视图构建模式（标签文本、国际化），不属于框架通用 utils
- **为何不合并到 `framework/ui/`**：`framework/ui/` 存放通用 UI 组件（Modal、Toast），FormBuilder 是业务层视图构建辅助

### Decision 4: DatabaseManager 不使用专属表单类

- **当前**：`ms-db-form-field`（margin-bottom: 12px）、`ms-db-form-label`、`ms-db-form-field-row` — 完全平行于标准体系
- **改为**：使用 `ms-form-group` 替代 `ms-db-form-field`，使用原生 `<label>` 替代 `ms-db-form-label`，使用 `ms-form-group-inline` 替代 `ms-db-form-field-row`
- **理由**：消除平行 CSS 体系，减少维护负担，与其他视图视觉一致

### Decision 5: 逐个视图迁移，不统一重构

- **方案**：在 FormBuilder 就绪后，逐个视图文件迁移（每个视图 1 个 commit-like 任务），优先级从影响面小到大
- **理由**：10 个视图同时改引入的回归风险较大，逐个迁移可独立测试验证

### Decision 6: 不修改 contentEditable 编辑器（ContentEditor）

- 保留 `ms-editor-title-input` 和 `ms-content-editor-textarea` 的自定义类名
- 理由：这些是富文本编辑区域，非标准表单输入，样式需求不同（大字号标题、代码编辑字体）

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| FormBuilder 接口变更影响多个视图 | 先在 1-2 个视图试用，稳定后再批量迁移 |
| DatabaseManager 表单结构复杂（动态字段行、内联编辑），迁移可能漏掉边缘情况 | 先提取并测试动态字段行逻辑，再移除旧 CSS 类 |
| 模态框标题修改可能影响用户习惯（如"详细灵感"→"新建灵感"） | 纯文案变更，无功能影响，可快速回退 |
| `ms-db-form-field-row` 的 `gap: 6px` 需迁移到 `ms-form-group-inline` | `ms-form-group-inline` 已有 `gap: 10px`，视觉需微调确认 |
| 现有测试覆盖不足，难以自动验证回归 | 迁移后逐个视图打开模态框目测确认表单渲染正确 |
