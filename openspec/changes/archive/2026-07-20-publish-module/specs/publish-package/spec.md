## ADDED Requirements

### Requirement: 创建发布包

用户 SHALL 能从已定稿的 Content 创建发布包。
系统 SHALL 只展示 `status` 为 `finalized` 的 Content 作为可选项。
系统 SHALL 默认使用 Content 的 `title` 作为发布包的标题，用户可修改。
系统 SHALL 允许用户选择一个或多个平台作为发布目标。

#### Scenario: 从定稿内容创建发布包

- **WHEN** 用户点击"创建发布包"
- **THEN** 系统展示已定稿 Content 列表供选择
- **WHEN** 用户选择 Content、填写标题、选择平台、点击"保存草稿"
- **THEN** 系统创建 status 为 `draft` 的 Package，并在列表中展示

#### Scenario: 从 ContentEditor 创建发布包

- **WHEN** 用户在 ContentEditor 中查看已定稿的 Content
- **THEN** ContentEditor 显示"创建发布包"按钮
- **WHEN** 用户点击该按钮
- **THEN** 跳转到 PublishManager 并自动选中该 Content

### Requirement: 发布包列表

系统 SHALL 提供发布包的列表视图。
列表 SHALL 展示标题、状态、目标平台数、创建时间等关键信息。
列表 SHALL 按创建时间倒序排列。
用户 SHALL 能点击发布包进入详情页。

#### Scenario: 查看发布包列表

- **WHEN** 用户进入 PublishManager 视图
- **THEN** 系统展示所有发布包的列表，按创建时间倒序
- **THEN** 每行显示标题、状态标记、平台数和创建日期

### Requirement: 发布包状态管理

系统 SHALL 定义发布包状态：`draft` → `scheduled` / `publishing` → `published` / `partially_published` / `failed`。
系统 SHALL 在发布包状态变化时自动记录时间戳。
系统 SHALL 在后台自动计算状态：当所有平台的 PublishLog 都为 `success` 时，Package 自动变为 `published`。

#### Scenario: 发布包状态流转

- **WHEN** 用户创建发布包
- **THEN** 状态为 `draft`
- **WHEN** 用户点击"立即发布"
- **THEN** 状态变为 `publishing`
- **WHEN** 所有平台均发布成功
- **THEN** 状态变为 `published`
- **WHEN** 部分平台失败、部分成功
- **THEN** 状态变为 `partially_published`

#### Scenario: 删除草稿发布包

- **WHEN** 用户删除一个 `draft` 状态的发布包
- **THEN** 系统移除该发布包及其关联的排期和日志记录

### Requirement: 发布包与关联数据级联

系统 SHALL 在创建发布包时，自动为每个选中的平台生成一条 Schedule 记录和一条 PublishLog 记录。
系统 SHALL 在删除发布包时级联删除关联的 Schedule 和 PublishLog。

#### Scenario: 创建发布包时生成关联记录

- **WHEN** 用户创建一个发布包，选择 3 个平台
- **THEN** 系统同时创建 3 条 Schedule 记录和 3 条 PublishLog 记录
- **THEN** 每条记录均正确关联 Package ID 和 Platform ID
