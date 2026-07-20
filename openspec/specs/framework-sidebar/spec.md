## ADDED Requirements

### Requirement: SidebarManager 停用时正确恢复宿主侧栏

SidebarManager 从激活状态切换到停用时，宿主侧栏的显示状态必须与直接点击宿主 nav-tab 一致，不出现异常折叠/展开交替。

#### Scenario: 从扩展切回宿主面板时侧栏可见
- **WHEN** 用户激活 Media Studio 扩展后，点击宿主 nav-tab（如"聊天"）
- **THEN** 宿主切换到目标面板，侧栏可见（等同于直接点击该 nav-tab 的行为）

#### Scenario: 连续两次切回宿主面板时侧栏状态稳定
- **WHEN** 用户执行：激活扩展 → 点击"聊天" → 激活扩展 → 点击"聊天"
- **THEN** 两次切换到聊天时，侧栏均为可见状态，不出现交替隐藏/显示

#### Scenario: 用户手动折叠侧栏后不受影响
- **WHEN** 用户手动折叠宿主侧栏后，激活并退出扩展
- **THEN** 侧栏保持折叠状态
