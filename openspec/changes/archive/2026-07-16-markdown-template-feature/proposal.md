## Why

当前任务创建和文稿编辑都是空白输入——每次需要从零编写创作简报或文稿内容，缺乏可复用的结构化起点。这导致重复劳动、质量参差不齐、团队协作时缺乏统一模板规范。通过引入 Markdown 模板功能，用户可以从预定义模板快速填充内容，提高创作效率和一致性。

## What Changes

- 新增 `templates` 业务表，通过 DataRepository 统一管理模板数据
- 新增模板管理视图 `TemplatesView`（`#templates`），支持模板的创建、编辑、删除、按类型筛选
- 在任务创建表单中增加「选择模板」功能，选中后填充创作简报 textarea
- 在任务详情（TaskDetail）的文稿区域增加「从模板新建」入口，选中后创建预填模板内容的文稿
- 模板内容中的 `{{变量名}}` 占位符保留供用户手动替换，不做自动替换
- 将模板视图注册到「生产管理」菜单组（看板 / 任务 / 素材 / 模板）

## Capabilities

### New Capabilities
- `template-management`: Markdown 模板的 CRUD 管理——创建、编辑、删除、按类型（brief/content）筛选
- `template-task-integration`: 任务创建时选择 brief 类型模板，自动填充创作简报
- `template-content-integration`: 文稿新建时选择 content 类型模板，自动填充文稿正文

### Modified Capabilities

（无）

## Impact

- **`src/business/manifest.js`**: 新增 `templates` 视图注册 + 更新 menuGroups
- **`src/business/data/index.js`**: （可选）新增 `templateRepo` 快捷工厂
- **`src/business/views/TasksView.js`**: 任务创建表单增加模板选择 UI
- **`src/business/views/TaskDetail.js`**: 文稿区域增加「从模板新建」按钮
- **`src/business/views/ContentEditor.js`**: 增加接受模板内容初始化的能力
- **`src/business/views/TemplatesView.js`**: 新建视图文件（模板管理）
- **`.database/business/`**: 新增 `templates` 表（schema.json + data.json）
- 无新增外部依赖
