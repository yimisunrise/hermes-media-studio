## ADDED Requirements

### Requirement: 配置文件定义任务生命周期
系统 SHALL 从 `configs/workflows/task-lifecycle.json` 读取任务生命周期定义。配置文件 SHALL 定义每个任务类型的：
- 所有状态列表
- 看板可见状态列表
- 合法状态流转（每个状态可到达的下一个状态）
- 终止状态（不再流转）
- 卡片颜色

#### Scenario: 配置文件加载
- **WHEN** 系统启动或任务视图渲染时
- **THEN** 从 `configs/workflows/task-lifecycle.json` 读取配置
- **WHEN** 配置文件不存在或格式错误
- **THEN** 系统使用内置默认配置

### Requirement: 看板根据配置动态渲染
看板视图 SHALL 根据配置文件中每个任务类型的 `kanban_states` 动态生成列。每一列 SHALL 展示该状态下的任务卡片。

#### Scenario: 看板动态列
- **WHEN** 素材任务的 `kanban_states` 为 `["generating", "pending_review", "approved"]`
- **THEN** 看板显示 3 列：生成中、待审核、已审核
- **WHEN** 文案任务的 `kanban_states` 为 `["generating", "pending_review", "approved", "scheduled", "published"]`
- **THEN** 看板显示 5 列
- **WHEN** 配置文件新增状态
- **THEN** 看板自动新增对应列

### Requirement: 状态流转 UI 根据配置渲染
任务列表中的状态操作按钮 SHALL 根据配置文件中 `transitions` 定义渲染。只有合法的目标状态 SHALL 显示为可操作选项。

#### Scenario: 状态操作按钮
- **WHEN** 某任务当前状态为 "pending_review"
- **THEN** 根据配置，操作按钮显示 "approved" 和 "rejected" 两个选项
- **WHEN** 用户点击 "approved"
- **THEN** 状态流转到 "approved"
- **WHEN** 当前状态无合法流转（如 "approved" 的 transitions 为空数组）
- **THEN** 不显示操作按钮

### Requirement: 任务卡片颜色由配置控制
看板和列表中任务卡片的颜色 SHALL 由配置文件中每个任务类型的 `color` 字段控制。

#### Scenario: 卡片颜色区分
- **WHEN** 素材任务在看板中显示
- **THEN** 使用配置的颜色（蓝色系）
- **WHEN** 文案任务在看板中显示
- **THEN** 使用配置的颜色（绿色系）
- **WHEN** 配置文件更新颜色值
- **THEN** 卡片颜色立即更新

### Requirement: 配置驱动状态机默认配置
系统 SHALL 内置一份默认配置，在 `configs/workflows/task-lifecycle.json` 不存在时使用。

#### Scenario: 默认配置
- **WHEN** 首次启动且无配置文件
- **THEN** 系统使用硬编码的默认状态机（素材：initialized→generating→pending_review→approved/rejected，文案：initialized→generating→pending_review→approved→scheduled→published→archived）
