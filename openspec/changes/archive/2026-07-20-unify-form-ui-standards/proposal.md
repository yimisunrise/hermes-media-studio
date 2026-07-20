## Why

当前应用中所有视图的表单存在三种不同间距值（10px / 12px / 14px）、四种表单行构建方式（ms-form-row 误用为列布局 / ms-form-group / 纯内联样式 / ms-db-form-field 平行体系）、三种标签实现方式。这导致视觉不一致、代码重复、维护成本高。需要在元素级样式统一（form-elements spec 已完成）的基础上，进一步统一表单行布局层。

## What Changes

- **统一表单行容器**：所有堆叠表单（标签在上、输入框在下）统一使用 `ms-form-group` CSS 类
- **统一行间距**：`ms-form-group` 的 `margin-bottom` 从 `10px` 改为 `12px`
- **创建共享 FormBuilder 工具**：提取 `_formField()`、`_fld()` 等重复 helper 到共享模块
- **迁移 10 个视图**：逐一改用标准 `ms-form-group` + `ms-form-label` 模式
  - TasksView、TemplatesView、IdeaBoard、TopicBoard、PublishManager、PlatformConfig、ThemeStrategy（间距调整）、AssetGallery、DatabaseManager、ContentEditor
- **废弃平行 CSS 体系**：移除 `ms-db-form-field` / `ms-db-form-label`，DatabaseManager 改用标准类
- **统一模态框标题**：新建用 `新建{X}`，编辑用 `编辑{X}`
- **消除内联样式**：移除所有表单相关 `style.marginBottom`、`style.margin-bottom` 内联覆盖
- **消除代码重复**：删除 PlatformConfig/PublishManager 重复的 `_formField()`，删除 IdeaBoard/TopicBoard 重复的 `_fld()`/`_themeSel()`

## Capabilities

### New Capabilities
- `form-layout-patterns`: 定义标准表单行布局模式（`ms-form-group` 容器 + 原生 `<label>` + `ms-form-input`/`ms-form-textarea`），提供共享 FormBuilder 工具模块

### Modified Capabilities
- `form-elements`: 更新 `.ms-form-group` 的 `margin-bottom` 从 `10px` 改为 `12px`

## Impact

- **CSS**: `framework/app.css`（修改 `ms-form-group` 间距）+ `business/app.css`（废弃 `ms-db-form-*` 类）
- **10 个视图文件**：`src/business/views/` 下 9 个视图 + `views/components/` 下新建共享工具
- **功能逻辑不变**：纯 UI 结构与 CSS 统一，不触碰数据流或业务逻辑
- **无 npm 依赖**：共享工具用原生 ES module
