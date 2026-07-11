## ADDED Requirements

### Requirement: 任务创建
系统 SHALL 支持用户在"任务"视图中创建新的创作任务。创建表单 SHALL 包含：
- 任务类型：素材任务 / 文案任务
- 任务模式：手工 / Agent
- 创作简报（brief）：文本描述

#### Scenario: 创建素材任务（手工）
- **WHEN** 用户在任务列表页点击"新建任务"
- **THEN** 显示创建表单
- **WHEN** 用户选择"素材任务"+"手工"模式并填写简报
- **THEN** 系统在 `tasks/<uuid>/` 创建目录，写入 `.meta.json`（状态=initialized）和 `brief.md`
- **THEN** 任务显示在任务列表中

#### Scenario: 创建文案任务（Agent）
- **WHEN** 用户选择"文案任务"+"Agent"模式
- **THEN** 系统在 `tasks/<uuid>/` 创建目录，写入 `.meta.json`（状态=initialized, mode=agent）和 `brief.md`
- **THEN** 任务显示在任务列表中

### Requirement: 任务存储结构
每个任务 SHALL 存储在 `tasks/<uuid>/` 子目录中：
- `.meta.json`：任务元数据
- `brief.md`：创作简报

#### Scenario: 任务目录验证
- **WHEN** 任务创建成功
- **THEN** `tasks/<uuid>/.meta.json` 存在，内容包含任务类型、模式、状态、创建时间、ID
- **THEN** `tasks/<uuid>/brief.md` 存在，内容为用户填写的创作简报

### Requirement: 任务列表视图
系统 SHALL 在 `#tasks` 路由下显示任务列表。列表 SHALL 展示：
- 任务标题/brief 摘要
- 类型（素材/文案）和模式（手工/Agent）
- 当前状态（带颜色标签）
- 创建时间
- 状态操作按钮（仅手工模式）

#### Scenario: 任务列表展示
- **WHEN** 用户导航到任务视图
- **THEN** 系统扫描 `tasks/` 目录读取所有任务
- **THEN** 以列表形式展示每个任务的关键信息
- **THEN** 不同类型的任务显示不同的颜色标识

### Requirement: 手工任务状态变更
手工任务 SHALL 支持用户在任务列表中手动修改状态。状态变更 SHALL 更新 `.meta.json` 中的 `status` 和 `status_history`。

#### Scenario: 修改手工任务状态
- **WHEN** 用户在任务列表中点击某手工任务的状态操作按钮
- **THEN** 显示可选的下一个状态（根据配置文件中的合法流转）
- **WHEN** 用户选择新状态
- **THEN** 系统更新 `tasks/<uuid>/.meta.json` 中的状态和流转历史

### Requirement: 素材任务状态机
素材任务 SHALL 遵循以下状态流转：
```
initialized → generating → pending_review → approved (最终)
                                 ↘ rejected (废弃)
```

#### Scenario: 素材任务完整流转
- **WHEN** 素材任务创建
- **THEN** 状态为 initialized
- **WHEN** 状态变为 generating
- **THEN** 任务出现在看板的"生成中"列
- **WHEN** 状态变为 pending_review
- **THEN** 任务出现在看板的"待审核"列，出现在审批列表
- **WHEN** 审批通过
- **THEN** 状态变为 approved，任务结束
- **WHEN** 审批驳回
- **THEN** 状态变为 rejected，任务废弃，不在看板显示

### Requirement: 文案任务状态机
文案任务 SHALL 遵循以下状态流转：
```
initialized → generating → pending_review → approved → scheduled → published → archived
                                           ↘ rejected (废弃)
```

#### Scenario: 文案任务完整流转
- **WHEN** 文案任务创建
- **THEN** 状态为 initialized
- **WHEN** 审批通过
- **THEN** 状态变为 approved
- **WHEN** 排期
- **THEN** 状态变为 scheduled
- **WHEN** 发布
- **THEN** 状态变为 published
- **WHEN** 归档
- **THEN** 状态变为 archived，不在看板显示

### Requirement: Agent 模式任务扫描
Agent 模式任务 SHALL 由 Hermes Agent 外部系统扫描任务目录并驱动状态流转。系统 SHALL 提供 Agent 可读取和修改的数据。

#### Scenario: Agent 扫描任务
- **WHEN** Hermes Agent 扫描 `tasks/<uuid>/` 目录
- **THEN** Agent 可读取 `brief.md` 和 `.meta.json`
- **THEN** Agent 可在目录中写入成果文件
- **THEN** Agent 可修改 `.meta.json` 中的状态

### Requirement: 任务成果产出
素材任务 SHALL 产出图片、视频文件，保存到素材库（`assets/YYYY/MM/DD/`）。文案任务 SHALL 产出 Markdown 格式图文，保存到图文库（`copywriting/YYYY/MM/<uuid>/`）。

#### Scenario: 素材任务产出
- **WHEN** 素材任务完成
- **THEN** 成果文件存在于 `assets/` 目录
- **THEN** `.meta.json` 中的 `outputs` 字段记录成果路径

#### Scenario: 文案任务产出
- **WHEN** 文案任务完成
- **THEN** 成果文件存在于 `copywriting/` 目录
- **THEN** `.meta.json` 中的 `outputs` 字段记录成果路径
