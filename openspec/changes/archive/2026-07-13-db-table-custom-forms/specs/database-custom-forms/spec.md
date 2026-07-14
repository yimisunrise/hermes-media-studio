## ADDED Requirements

### Requirement: DatabaseManager 使用自定义弹窗创建数据库
DatabaseManager 创建数据库时 SHALL 使用页面内自定义弹窗，而非浏览器原生 `prompt()`

#### Scenario: 点击数据库面板的 + 按钮弹出创建表单
- **WHEN** 用户点击数据库面板顶部的 `+` 按钮
- **THEN** 弹出创建数据库表单弹窗，包含"数据库 ID"和"数据库名称"两个输入框，以及"取消"和"保存"按钮

#### Scenario: 表单提交时校验 ID 非空
- **WHEN** 用户不填写数据库 ID，直接点击"保存"
- **THEN** 表单提示"请输入数据库 ID"，不提交

#### Scenario: 表单提交时校验名称非空
- **WHEN** 用户不填写数据库名称，直接点击"保存"
- **THEN** 表单提示"请输入数据库名称"，不提交

#### Scenario: 保存成功后关闭弹窗并刷新列表
- **WHEN** 用户填写完数据库信息并点击"保存"
- **THEN** 弹窗关闭，数据库列表刷新，新数据库自动选中

### Requirement: DatabaseManager 支持编辑数据库
数据库列表中的数据库项 SHALL 提供编辑入口，编辑复用创建表单

#### Scenario: hover 显示编辑按钮
- **WHEN** 鼠标悬停在数据库列表项上
- **THEN** 列表项右侧显示编辑按钮（图标  ✏️）

#### Scenario: 点击编辑按钮弹出预填表单
- **WHEN** 用户点击数据库的编辑按钮
- **THEN** 弹出编辑表单，数据库 ID 禁用修改，名称输入框预填当前值

#### Scenario: 编辑保存后更新列表
- **WHEN** 用户修改数据库名称并点击"保存"
- **THEN** 弹窗关闭，数据库列表刷新显示新名称

### Requirement: DatabaseManager 使用自定义弹窗创建表
DatabaseManager 创建表时 SHALL 使用页面内自定义弹窗，包含可视化字段定义编辑器

#### Scenario: 点击表面板的 + 按钮弹出创建表单
- **WHEN** 用户点击表面板顶部的 `+` 按钮
- **THEN** 弹出创建表表单弹窗，包含"表 ID"、"表名称"输入框，以及可视化字段定义编辑器

#### Scenario: 字段编辑器初始显示一行空字段
- **WHEN** 创建表表单打开
- **THEN** 字段定义区显示一行空字段输入：字段 ID 输入框、标签输入框、类型下拉框（默认 string）

#### Scenario: 用户可以添加多行字段
- **WHEN** 用户点击字段编辑区的"+ 添加字段"按钮
- **THEN** 新增一行字段输入

#### Scenario: 用户可以删除字段行
- **WHEN** 用户点击某行字段的删除按钮（✕）
- **THEN** 该行被移除

#### Scenario: 表单提交时校验表 ID 非空
- **WHEN** 用户不填写表 ID 直接点击"保存"
- **THEN** 表单提示"请输入表 ID"

#### Scenario: 保存成功后关闭弹窗并刷新表列表
- **WHEN** 用户填写完表信息并点击"保存"
- **THEN** 弹窗关闭，表列表刷新，新表自动选中

### Requirement: DatabaseManager 支持编辑表
数据库中的表项 SHALL 提供编辑入口，编辑复用创建表单

#### Scenario: hover 显示编辑按钮
- **WHEN** 鼠标悬停在表列表项上
- **THEN** 列表项右侧显示编辑按钮（图标 ✏️），位于删除按钮之前

#### Scenario: 点击编辑按钮弹出预填表单
- **WHEN** 用户点击表的编辑按钮
- **THEN** 弹出编辑表单，表 ID 禁用修改，表名称和字段定义预填当前值

#### Scenario: 编辑保存后更新列表
- **WHEN** 用户修改表信息并点击"保存"
- **THEN** 弹窗关闭，表列表刷新，字段数更新

### Requirement: 字段类型下拉框支持可选类型
字段编辑器的类型下拉框 SHALL 提供以下选项：string、text、integer、float、boolean、datetime、date、enum、reference、array、json

#### Scenario: 类型下拉包含所有类型
- **WHEN** 用户点击类型下拉框
- **THEN** 显示所有 11 种类型选项
