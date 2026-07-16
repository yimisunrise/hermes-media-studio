## ADDED Requirements

### Requirement: 看板 4 列显示
看板 SHALL 只显示 4 列：待处理(pending)、生成中(generating)、待审核(review)、已完成(approved)。closed 和 archived 状态的任务不显示。

#### Scenario: 看板只显示 4 个列
- **WHEN** 用户打开看板
- **THEN** 看板展示 4 列，分别标注为"待处理"、"生成中"、"待审核"、"已完成"

#### Scenario: 已关闭和已归档任务不显示
- **WHEN** 任务状态为 closed 或 archived
- **THEN** 该任务不在看板的任何列中显示

### Requirement: 拖拽修改任务状态
系统 SHALL 支持通过拖拽将任务卡片从一个列移动到另一个列，移动后立即更新任务的 status 字段。不允许拖到同一列。

#### Scenario: 拖拽到不同列
- **WHEN** 用户将一张卡片从列 A 拖拽到列 B
- **THEN** 该任务的 status 更新为列 B 对应的状态值，看板刷新后卡片出现在列 B

#### Scenario: 拖回同一列
- **WHEN** 用户尝试将卡片拖拽到它当前所在的列
- **THEN** 拖拽被忽略，状态不变

### Requirement: 审核列关闭按钮
待审核列 SHALL 每张卡片显示「关闭」按钮，点击后将任务状态设为 closed 并从看板中移除。

#### Scenario: 关闭任务
- **WHEN** 用户在待审核列点击卡片的「关闭」按钮
- **THEN** 该任务状态变为 closed，从看板消失

### Requirement: 已完成列归档按钮
已完成列 SHALL 每张卡片显示「归档」按钮，点击后将任务状态设为 archived 并从看板中移除。

#### Scenario: 归档任务
- **WHEN** 用户在已完成列点击卡片的「归档」按钮
- **THEN** 该任务状态变为 archived，从看板消失

### Requirement: 卡片点击打开详情
看板中的任务卡片 SHALL 支持点击打开 TaskDetail 弹窗，显示任务完整信息和关联素材/文稿。

#### Scenario: 点击卡片
- **WHEN** 用户点击看板中的一张任务卡片
- **THEN** 系统打开 TaskDetail 弹窗，展示该任务的完整详情

---

## REMOVED Requirements

### Requirement: ReviewMode 审核页
**Reason**: 审核功能合并到看板的工作流中（看板拖拽 + 关闭按钮），不再需要独立审核页。
**Migration**: 使用看板的待审核列进行审核操作（拖拽到已完成 + 关闭按钮）。

### Requirement: 任务列表状态切换按钮
**Reason**: 状态变更加入看板的拖拽而非按钮，减少操作入口的分散。
**Migration**: 在 TasksView 中不再显示状态切换按钮，改为使用看板的拖拽操作。
