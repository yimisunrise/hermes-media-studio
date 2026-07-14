## Context

DatabaseManager 当前使用浏览器原生 `prompt()` 实现数据库和表的创建，使用 `confirm()` 实现删除确认。`_buildRecordForm()` 已经提供了成熟的自定义弹窗模式（`.ms-db-form-overlay` + `.ms-db-form`），CSS 样式体系已完整就绪。本项目无 npm/构建步骤，所有交互通过原生 DOM API 实现。

## Goals / Non-Goals

**Goals:**
- 数据库创建/编辑使用页面内自定义弹窗，替代 `prompt()`
- 表创建/编辑使用页面内自定义弹窗（含可视化字段定义编辑器），替代 `prompt(x3)`
- 数据库列表和表列表增加编辑按钮，hover 显示
- 创建和编辑复用同一表单组件，区别在于预填数据和禁用 ID 修改

**Non-Goals:**
- 替换删除确认的 `confirm()`（本次不涉及，后续可优化）
- 记录编辑的 `_buildRecordForm()`（已有且正常工作，不改动）
- 修改 SchemaRegistry 或 DataRepository 的 API

## Decisions

### D1: 复用 `_buildRecordForm()` 的弹窗模式
- **选择**：所有新建弹窗复用 `.ms-db-form-overlay` + `.ms-db-form` 结构和交互模式（overlay 点击关闭、关闭按钮、取消/确认按钮）
- **理由**：样式和交互已存在且经过验证，保持 UI 一致性
- **替代方案**：全局 Dialog 组件——当前仅 DatabaseManager 需要，过度设计

### D2: 创建/编辑表单合一
- **选择**：`_showDbForm(existing?)` 和 `_showTableForm(db, existing?)` 两个方法，参数传 null 为创建，传对象为编辑
- **理由**：表单结构完全一致，减少重复代码
- **替代方案**：分离创建和编辑方法——增加维护成本

### D3: 数据库编辑时 ID 禁用修改
- **选择**：编辑模式时 ID 输入框 `disabled`，关联系统注册表的 ID 不允许变更
- **理由**：数据库 ID 是系统标识，修改后需要级联更新所有表路径，复杂度高且非本次范围

### D4: 表字段定义使用动态行编辑器
- **选择**：参考 `PlatformConfig._openPlatformEditor()` 的发布类型编辑模式——每行三个控件（ID 输入 + 标签输入 + 类型下拉），行末删除按钮，底部"+ 添加字段"
- **理由**：无需用户理解 JSON 语法，可视化编辑降低出错率
- **替代方案**：JSON textarea——虽然实现简单但用户体验差

### D5: 编辑按钮 hover 显示
- **选择**：与删除按钮相同的 hover 显示模式（`.ms-db-delete-btn` 的 `opacity: 0 → 0.5 on hover`），复用现有 CSS 类
- **理由**：保持一致的操作入口风格，保持列表项简洁

## Risks / Trade-offs

- **字段编辑在表单中一次性提交**：用户必须先完成所有字段添加再保存，不能逐字段保存。但考虑到表的字段结构相对稳定，一次性编辑是合理的设计
- **数据库编辑禁用 ID**：如果用户确实需要重命名数据库，当前不支持。可后续通过添加"重命名"功能解决
- **`SchemaRegistry` 没有 `updateDatabase()` 方法**：当前 `createDatabase` 只是写入 `db.json`，编辑时需要确认 `SchemaRegistry` 是否有更新方法，如果没有需要添加
