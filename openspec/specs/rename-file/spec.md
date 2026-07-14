## ADDED Requirements

无新增能力——该变更为纯文件重命名，无行为变更。

### Requirement: 库级注册表文件重命名
系统 SHALL 将 `.database/db.json` 重命名为 `.database/databases.json`。

#### Scenario: 重命名后 SchemaRegistry 读取新文件
- **WHEN** SchemaRegistry 调用 `_readDbRegistry()`
- **THEN** 它 SHALL 读取 `.database/databases.json` 而非 `.database/db.json`

#### Scenario: 已有工作空间兼容
- **WHEN** 已有工作空间中存在旧的 `.database/db.json`
- **THEN** 迁移脚本 SHALL 将其重命名为 `.database/databases.json`
