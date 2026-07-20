## ADDED Requirements

### Requirement: ID 生成长度与格式
系统生成的 ID 必须是固定 7 位字符串，使用 Base62 字符集（`0-9A-Za-z`）。

#### Scenario: 正常生成
- **WHEN** 调用 ID 生成函数
- **THEN** 返回一个 7 位 Base62 字符串

#### Scenario: 字符范围
- **WHEN** 检查生成的 ID 字符
- **THEN** 每个字符必须在 `0-9`、`A-Z`、`a-z` 范围内

### Requirement: ID 基于毫秒时间戳
ID 编码的数值来自 `Date.now()` 的毫秒级 Unix 时间戳，转换为 Base62。

#### Scenario: 毫秒级精度
- **WHEN** 在同一毫秒内连续生成 ID
- **THEN** 两个 ID 相同

#### Scenario: 时间有序性
- **WHEN** 在 t1 时刻生成 ID1，在 t2(t2>t1) 时刻生成 ID2
- **THEN** ID1 的字典序小于 ID2（字符串比较）

### Requirement: 碰撞处理
当生成的 ID 与数据库中已有 ID 冲突时，系统必须能够自动重试。

#### Scenario: 碰撞重试
- **WHEN** 生成的 ID 在目标表中已存在
- **THEN** 等待至少 1ms 后重新生成 ID

### Requirement: 全项目统一
所有数据库记录的主键 ID 必须使用同一套生成逻辑，避免 ID 格式混杂。

#### Scenario: DataRepository 使用
- **WHEN** `DataRepository.create()` 被调用且未显式传入 id
- **THEN** 自动使用新的短 ID 生成函数

#### Scenario: Meta 使用
- **WHEN** `meta.uuid()` 被调用
- **THEN** 返回新的 7 位短 ID

#### Scenario: 内联 randomUUID() 替换
- **WHEN** `TaskDetail.js`、`AssetGallery.js`、`AgentTaskPoller.js` 中需要生成 ID
- **THEN** 使用新的短 ID 生成函数而非 `crypto.randomUUID()`
