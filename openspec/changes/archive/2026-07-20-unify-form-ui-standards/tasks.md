## 1. CSS 调整

- [x] 1.1 将 `framework/app.css` 中 `.ms-form-group` 的 `margin-bottom` 从 `10px` 改为 `12px`
- [x] 1.2 在 `business/app.css` 中 `.ms-db-form-field` / `.ms-db-form-label` / `.ms-db-form-field-row` 前添加弃用注释标记（`/* @deprecated — 迁移至 ms-form-group */`）

## 2. 创建 FormBuilder 共享工具

- [x] 2.1 创建 `src/business/views/components/FormBuilder.js`，导出 `formGroup()`、`label()`、`input()`、`textarea()`、`select()` 工厂函数
- [x] 2.2 `formGroup()` 返回 `<div class="ms-form-group">` + `<label>` + 传入的 input 元素
- [x] 2.3 工厂函数创建带标准类名的原生 DOM 元素（`ms-form-input`、`ms-form-textarea`、`ms-select`）

## 3. 迁移 ThemeStrategy（最小改动）

- [x] 3.1 ThemeStrategy 已使用 `ms-form-group`，仅需确认 1.1 的 CSS 变更生效后视觉正常（间距 10px→12px）
- [x] 3.2 移除任何残留的内联 `margin-bottom` / `style.marginBottom`

## 4. 迁移 PlatformConfig（首个使用 FormBuilder 的视图）

- [x] 4.1 导入 FormBuilder 模块
- [x] 4.2 将 `_formField()` 调用的行替换为 `FormBuilder.formGroup()`
- [x] 4.3 删除 `_formField()` 辅助函数定义
- [x] 4.4 验证：打开新建/编辑平台模态框，确认表单渲染正确

## 5. 迁移 AssetGallery（只读显示，简单）

- [x] 5.1 将详情模态框中的 `<div class="ms-form-row">` 替换为 `<div class="ms-form-group">`
- [x] 5.2 将标签从 `<div class="ms-form-label">` + 内联样式 替换为 `<label>`
- [x] 5.3 移除内联 `margin-bottom:12px`、`font-size:12px` 等样式

## 6. 迁移 TasksView

- [x] 6.1 将创建/编辑任务模态框中的 `<div class="ms-form-row" style="flex-direction:column;...">` 替换为 `<div class="ms-form-group">`
- [x] 6.2 将 `<label class="ms-form-label">` 替换为 `<label>`
- [x] 6.3 移除内联 `flex-direction: column` 和 `align-items: stretch`

## 7. 迁移 TemplatesView

- [x] 7.1 导入 FormBuilder 模块
- [x] 7.2 将手动创建的 `<div>` + 内联 `margin-bottom:14px` 行替换为 FormBuilder 调用
- [x] 7.3 将内联样式标签替换为 `<label>` 元素
- [x] 7.4 移除所有 `style.cssText = 'margin-bottom:14px'` 和标签内联样式

## 8. 迁移 PublishManager

- [x] 8.1 导入 FormBuilder 模块
- [x] 8.2 将 _formField() 调用的行替换为 FormBuilder.formGroup()
- [x] 8.3 删除 `_formField()` 辅助函数定义（与 PlatformConfig 重复的代码）
- [x] 8.4 迁移标记发布结果模态框中的手动表单构建

## 9. 迁移 IdeaBoard

- [x] 9.1 导入 FormBuilder 模块
- [x] 9.2 将 `_fld()` / `_fldArea()` / `_themeSel()` 调用的行替换为 FormBuilder 调用
- [x] 9.3 删除 `_fld()` / `_fldArea()` / `_themeSel()` 辅助函数定义

## 10. 迁移 TopicBoard

- [x] 10.1 导入 FormBuilder 模块
- [x] 10.2 将 `_fld()` / `_themeSel()` 调用的行替换为 FormBuilder 调用
- [x] 10.3 删除 `_fld()` / `_themeSel()` 辅助函数定义

## 11. 迁移 DatabaseManager（最复杂）

- [x] 11.1 将数据库表单中的 `ms-db-form-field` → `ms-form-group`，`ms-db-form-label` → 原生 `<label>`
- [x] 11.2 将表表单中的 `ms-db-form-field-row` → `ms-form-group-inline`
- [x] 11.3 将记录表单中的 `ms-db-form-field` / `ms-db-form-label` 替换为标准类
- [x] 11.4 验证：打开新建/编辑数据库/表/记录模态框，确认所有表单渲染正确

## 12. 模态框标题统一

- [x] 12.1 ThemeStrategy: `新增主题` → `新建主题`
- [x] 12.2 PlatformConfig: `添加平台` → `新建平台`
- [x] 12.3 TopicBoard: `创建选题` → `新建选题`
- [x] 12.4 IdeaBoard: `详细灵感` → `新建灵感`（创建模式下）
- [x] 12.5 确认已有 `新建{X}` / `编辑{X}` 模式的视图保持不动

## 13. 清理

- [x] 13.1 从 `business/app.css` 中移除 `.ms-db-form-field` / `.ms-db-form-label` / `.ms-db-form-field-row` 的弃用 CSS
- [x] 13.2 移除 `.ms-gen-dialog .ms-form-row { margin-bottom: 12px }`（不再需要）
- [x] 13.3 JS 语法检查：`find src -name "*.js" -exec node --check {} \;`
- [x] 13.4 逐个打开受影响的视图模态框，目测确认表单渲染正确
