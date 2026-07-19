## ADDED Requirements

### Requirement: 平台列表

系统 SHALL 提供平台配置的列表视图。
列表 SHALL 展示平台名称、类型、是否启用等关键字段。
用户 SHALL 能查看、添加、编辑、删除平台。

#### Scenario: 查看平台列表

- **WHEN** 用户进入 PlatformConfig 视图
- **THEN** 系统展示所有平台的列表，包含名称、类型、启用状态

#### Scenario: 删除平台

- **WHEN** 用户删除一个平台
- **THEN** 系统移除该平台配置
- **THEN** 已有发布包中的 platformIds 引用保留（不级联删除发布数据）

### Requirement: 添加平台

系统 SHALL 支持用户添加新的发布平台。
系统 SHALL 要求填写平台名称和类型。
系统 SHALL 允许选择性填写 slug、发布配置（publishConfig）和 API 配置（apiConfig）。

#### Scenario: 添加平台

- **WHEN** 用户在 PlatformConfig 点击"添加平台"
- **THEN** 系统展示表单，包含名称、类型、slug、发布配置、API 配置字段
- **WHEN** 用户填写名称和类型并提交
- **THEN** 系统创建平台记录
- **WHEN** 用户未填写名称
- **THEN** 系统提示名称必填

### Requirement: 编辑平台

系统 SHALL 支持编辑已有平台的配置信息。

#### Scenario: 编辑平台

- **WHEN** 用户点击平台列表中的编辑按钮
- **THEN** 系统展示当前配置的编辑表单
- **WHEN** 用户修改并保存
- **THEN** 系统更新平台记录

### Requirement: 平台启停

系统 SHALL 支持启用或禁用平台。
已禁用的平台 SHALL 不出现在发布包的平台选择列表中。

#### Scenario: 禁用平台

- **WHEN** 用户在平台配置中将某平台设为禁用
- **THEN** 系统保存启用状态为 false
- **WHEN** 用户在 PublishManager 创建发布包
- **THEN** 已禁用的平台不在平台选择列表中显示
