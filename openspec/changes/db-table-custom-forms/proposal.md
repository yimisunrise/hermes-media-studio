## Why

DatabaseManager 当前创建数据库和表使用浏览器原生 `prompt()` 弹窗，需要多次弹出、无法预览输入内容、字段定义需要手写 JSON，体验不佳。同时数据库和表只有删除操作，缺少编辑功能。需要统一替换为页面内自定义表单，并补充编辑能力。

## What Changes

- 替换创建数据库的 `prompt()` 为自定义弹窗表单，同时支持编辑已有数据库
- 替换创建表的 `prompt()` 为自定义弹窗表单（含可视化字段构建器），同时支持编辑已有表
- 数据库列表和表列表各增加编辑按钮（hover 显示），点击弹出编辑表单
- 删除确认提示用 `confirm()` 暂时保留，后续可优化

## Capabilities

### New Capabilities
- `database-custom-forms`: DatabaseManager 中数据库和表的创建/编辑表单，替代浏览器原生弹窗，提供内嵌的字段定义编辑器

### Modified Capabilities
- （无现有 spec 变更）

## Impact

- `src/views/DatabaseManager.js` — 重写 `_showCreateDbForm()`、`_showCreateTableForm()`、新增 `_showEditDbForm()`、`_showEditTableForm()` 等方法，复用 `_buildRecordForm()` 的弹窗模式
- `src/app.css` — 可能新增少量样式
