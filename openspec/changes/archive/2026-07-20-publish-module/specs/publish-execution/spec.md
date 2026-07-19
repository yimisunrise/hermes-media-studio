## ADDED Requirements

### Requirement: 立即发布

用户 SHALL 能对 `draft` 状态的发布包执行"立即发布"操作。
系统 SHALL 将所有关联的 Schedule 和 PublishLog 状态更新为 `publishing`。
系统 SHALL 将发布包状态更新为 `publishing`。

#### Scenario: 立即发布

- **WHEN** 用户在发布包详情中点击"立即发布"
- **THEN** 系统更新 Package.status 为 `publishing`
- **THEN** 系统为每个目标平台生成 Publishing 状态的记录
- **THEN** 系统在 PublishLog 中记录发布时间

### Requirement: 排期发布

用户 SHALL 能在创建发布包时设置排期时间。
系统 SHALL 将 Package 状态设置为 `scheduled`。
系统 SHALL 在排期时间到达时（当前手工模式）等待用户操作。

#### Scenario: 设置排期

- **WHEN** 用户在创建发布包时选择"排期发布"并设置时间
- **THEN** 系统创建状态为 `scheduled` 的 Package
- **THEN** 系统在 schedules 表中记录排期时间

### Requirement: 标记发布结果

用户 SHALL 能为每个平台手动填写发布结果。
系统 SHALL 要求填写发布 URL。
系统 SHALL 支持标记发布成功或失败。
系统 SHALL 在填写失败原因时允许填写错误信息。

#### Scenario: 标记发布成功

- **WHEN** 用户在手工发布后点击"标记已发布"
- **THEN** 系统展示表单，要求填写发布链接
- **WHEN** 用户填写链接并标记成功
- **THEN** PublishLog.status 更新为 `success`
- **THEN** PublishLog.publishedAt 更新为当前时间
- **THEN** PublishLog.url 更新为用户填入的链接

#### Scenario: 标记发布失败

- **WHEN** 用户在标记结果时选择"失败"
- **THEN** 系统要求填写错误原因
- **WHEN** 用户提交
- **THEN** PublishLog.status 更新为 `failed`
- **THEN** PublishLog.error 更新为用户填写的错误信息

### Requirement: 发布状态自动汇总

系统 SHALL 在每次 PublishLog 状态更新后自动检查所属 Package 的所有平台发布状态。
当所有平台均为 `success` 时，Package 自动变为 `published`。
当部分成功、部分失败时，Package 变为 `partially_published`。
当全部失败时，Package 变为 `failed`。

#### Scenario: 全部平台发布成功

- **WHEN** 用户标记最后一个平台的发布结果为成功
- **THEN** 系统自动将 Package.status 更新为 `published`

#### Scenario: 部分平台发布失败

- **WHEN** 部分平台标记成功、部分标记失败
- **THEN** 系统自动将 Package.status 更新为 `partially_published`

### Requirement: 重试发布

用户 SHALL 能为失败的 PublishLog 重新触发发布流程（将状态重置为 `publishing`）。

#### Scenario: 重试发布

- **WHEN** 某平台的发布状态为 `failed`
- **THEN** 系统展示"重试"按钮
- **WHEN** 用户点击重试
- **THEN** 系统重置 PublishLog.status 为 `publishing`
- **THEN** 系统递增 retryCount
