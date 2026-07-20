## Context

当前 Hermes Media Studio 的所有业务数据通过 DataRepository 管理，存储在 `.database/business/` 下的 JSON 文件中。任务创建表单的创作简报（`prompt` 字段）目前为空 textarea，文稿编辑器（`ContentEditor`）新建时正文为空。缺少模板系统来提供可复用的起点。

本项目遵循框架-业务分离架构，零构建，纯 ES Module。数据层通过 `SchemaRegistry` + `DataRepository` 提供通用 CRUD，新表只需在 `business-db.init-def.js` 中注册 schema 即可自动创建。

## Goals / Non-Goals

**Goals:**
- 新增 `templates` 业务表，定义模板的 schema（名称、类型、内容、标签等）
- 实现模板管理视图（`TemplatesView`），支持 CRUD + 按 brief/content 类型筛选
- 在任务创建表单中嵌入模板选择器，选中 brief 模板后填充创作简报 textarea
- 在 TaskDetail 文稿区增加「从模板新建」按钮，选中 content 模板后创建预填内容的文稿
- 模板变量 `{{变量名}}` 保持原样，不做自动替换，由用户手动替换
- 将 `templates` 视图注册到「生产管理」菜单组

**Non-Goals:**
- 不做模板变量自动识别/替换引擎
- 不做模板嵌套/引用
- 不做模板版本管理（用 DataRepository 的现有能力即可）
- 不做模板导入/导出
- 不修改现有数据表 schema

## Decisions

### 1. 模板存储方式：DataRepository 表记录（而非文件系统）
选择 DataRepository 表，而非直接读写 `/configs/templates/` 目录下的 Markdown 文件。
- 与现有业务数据管理方式一致，统一走 SchemaRegistry + DataRepository
- 可利用 DataRepository 的 CRUD、筛选、分页能力
- 模板内容长（text 字段）存储在 data.json 中，框架足够承载

### 2. 模板选择器 UI 模式：下拉式按钮 + 弹出选择面板
任务创建表单空间有限，不适合直接用 select 元素（模板名可能很长）。采用「选择模板」按钮 → 弹出一个小面板展示模板列表 → 点击后填充。
- 不引入新 UI 组件依赖，复用现有 Modal 或自制轻量浮层
- 文稿编辑器端同样使用此模式

### 3. 模板类型区分：type 枚举字段
用一个 `type` 字段区分 brief/content，取代两个独立表。因为：
- 字段高度相似（name, content, description, tags）
- 模板管理视图只需一个 tab/筛选器即可区分
- 未来扩展新类型（如 `email`、`script`）只需改枚举值

### 4. 模板变量约定：双花括号 `{{变量名}}`
- 采用标准 Mustache 风格但不做解析
- 用户自己按 `Ctrl+F` 查找替换
- 变量名由模板创建者自由定义，系统不限制命名规范

### 5. 视图命名空间：遵循现有 `ms-` / `media-studio-` 约定
- CSS 类名：`ms-template-*`
- ID：`media-studio-template-*`
- 与看板、任务等视图保持一致的命名风格

## Risks / Trade-offs

- **[复杂度] 任务创建表单增加模板选择后，表单长度会增加。** → 模板选择器用紧凑的按钮+弹出面板，不改变表单整体布局
- **[数据一致性] 模板删除后，已使用该模板创建的任务/文稿不会受影响。** → 这是预期行为，模板只是创建时的填充工具，不建立引用关系。可以接受
- **[首次体验] 无内置模板，新用户首次使用可能不知道如何使用。** → 在模板管理视图增加空状态提示（"暂无模板，点击新建"）
