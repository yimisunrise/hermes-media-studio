## ADDED Requirements

### Requirement: 平台列表
系统 SHALL 在 `#platforms` 路由下显示平台列表。每个平台项 SHALL 展示：
- 平台名称
- 发布类型列表
- 编辑/禁用操作按钮

#### Scenario: 平台列表展示
- **WHEN** 用户导航到平台配置视图
- **THEN** 系统扫描 `configs/platforms/` 目录加载所有平台
- **THEN** 以列表形式展示每个平台的名称和发布类型

### Requirement: 平台添加
系统 SHALL 支持用户添加新平台。添加表单 SHALL 包含：
- 平台名称（必填）
- 发布类型（至少一个，可添加多个）

#### Scenario: 添加平台
- **WHEN** 用户点击"添加平台"按钮
- **THEN** 显示添加表单
- **WHEN** 用户填写名称和发布类型并提交
- **THEN** 在 `configs/platforms/<name>.json` 创建配置文件
- **THEN** 平台出现在列表中

### Requirement: 平台编辑
系统 SHALL 支持用户编辑已有平台的名称和发布类型。

#### Scenario: 编辑平台
- **WHEN** 用户在平台列表中点击某个平台的编辑按钮
- **THEN** 显示编辑表单（预填当前数据）
- **WHEN** 用户修改发布类型并保存
- **THEN** 更新 `configs/platforms/<id>.json` 中的配置

### Requirement: 平台不可删除
系统 SHALL 不支持删除平台。平台可被禁用（在列表中标为"已禁用"状态），但不可物理删除。

#### Scenario: 禁用平台
- **WHEN** 用户点击"禁用"按钮
- **THEN** 平台标记为禁用状态，在发布表单中不再可选
- **WHEN** 用户点击"启用"按钮
- **THEN** 平台恢复正常可用状态

### Requirement: 自定义发布类型
每个平台 SHALL 支持自定义发布类型。例如头条可配置为 "微头条"、"文章"、"视频"等多个发布类型。

#### Scenario: 发布类型配置
- **WHEN** 用户编辑平台
- **THEN** 发布类型为可配置的多值字段
- **THEN** 用户可添加或删除发布类型
- **WHEN** 删除发布类型
- **THEN** 已有发布记录中的类型不受影响
