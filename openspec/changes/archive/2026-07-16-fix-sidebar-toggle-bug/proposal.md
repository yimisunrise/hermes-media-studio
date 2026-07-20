## Why

点击宿主 WebUI 主菜单按钮切换到聊天面板时，侧栏（`aside.sidebar`）的显示/隐藏状态出现交替性错误。具体表现为：从 Media Studio 扩展切回聊天时，侧栏首次隐藏、第二次显示、第三次又隐藏，无法稳定保持可见状态。这是因为扩展的 `SidebarManager._deactivate()` 调用 `switchPanel()` 后，宿主的 inline onclick 又再次调用 `switchPanel()`（带 `fromRailClick:true`），触发了宿主的"同一面板点击→折叠侧栏"逻辑，导致侧栏被非预期地折叠。

## What Changes

- **修复 `SidebarManager._onNavTabClick`**：在捕获阶段检测到宿主 nav-tab 点击时，阻止事件传播（`stopPropagation`）以防止宿主的 inline onclick 再次触发 `switchPanel`，并由扩展自行调用 `switchPanel`（不带 `fromRailClick`），避免触发折叠逻辑
- **修复 `SidebarManager._deactivate`**：移除对 `switchPanel` 的调用，将面板切换职责交给调用方（调用方根据不同场景决定是否需要调用 `switchPanel`）
- 无新增能力，纯 BUG 修复

## Capabilities

### New Capabilities

无新增能力，纯 BUG 修复

### Modified Capabilities

无变更（框架层的 BUG 修复，不涉及 spec 级别的行为变化）

## Impact

- 仅修改 `src/framework/lib/sidebar.js` 一个文件
- `SidebarManager` 的事件处理逻辑变更：`_onNavTabClick` 使用 `stopPropagation` 阻止宿主事件；`_deactivate` 不再负责面板恢复
- 不影响现有 menu/views/router 等其他模块
