## ADDED Requirements

### Requirement: 表列表显示字段数量
数据库管理器中，每个表的列表项 SHALL 显示该表当前的字段数量。

#### Scenario: 新建表后字段数正确
- **WHEN** 用户创建一张新表（含 3 个字段：title, body, status）
- **THEN** 表列表中该表显示 "3 字段"

#### Scenario: 编辑表字段后刷新
- **WHEN** 用户编辑表定义，从 3 个字段改为 5 个字段
- **THEN** 表列表中该表显示 "5 字段"

#### Scenario: 无字段的表显示 0 字段
- **WHEN** 用户创建一张不传 fields 的空白表
- **THEN** 表列表中该表显示 "0 字段"

#### Scenario: 已有存量表兼容
- **WHEN** 数据库中已有旧表（`db.json` 记录不含 `fieldCount`）
- **THEN** 表列表安全降级显示 "0 字段"，不报错
