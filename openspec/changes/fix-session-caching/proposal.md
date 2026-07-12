## Why

Media Studio 扩展在初始化时从 `S.session` 读取 `session_id` 和 `workspace` 路径后永久缓存，之后即使 WebUI 切换工作空间或创建新的聊天对话，也不会重新读取。这导致：

1. 切换工作空间后，扩展使用过期的 session_id 请求 API，操作在错误的工作空间上
2. `_workspaceReady` 初始化状态一次检查后永久缓存，工作空间切换后不重新验证，导致已初始化的空间显示"未初始化"横幅
3. 即使同一个工作空间，WebUI 可能创建不同的聊天对话（session_id 不同），缓存 session_id 会导致请求使用过期凭证

## What Changes

1. **`WorkspaceAPI` 的 `sessionId` 和 `workspacePath` getter 取消永久缓存**：每次调用都从 `S.session` 重新读取，而非短路到私有字段
2. **`detectWorkspace()` 改为按需重读**：不再是仅初始化调用一次，而是在每个关键路径上主动刷新
3. **`checkInitialized()` 增强错误容错**：非 404 错误也触发 session 重试，而非直接返回 false
4. **`ms:activated` 事件触发重新检测**：侧边栏激活时重新运行 `detectWorkspace()` + `checkInitialized()`，而不是只用缓存值
5. **移除 `_sessionId` / `_workspacePath` 的永久缓存语义**：不再作为"一次写入永久有效"的缓存字段

## Capabilities

### New Capabilities

无。这是现有功能的缺陷修复，不引入新能力。

### Modified Capabilities

无。修复的是实现层面的行为（session 读取策略、初始化检测时机），不改变任何功能的对外规格。

## Impact

- **`src/modules/api.js`**：`sessionId` / `workspacePath` getter 逻辑重写；`checkInitialized()` 容错增强；`detectWorkspace()` 语义调整
- **`src/app.js`**：`_workspaceReady` 的缓存策略调整；`ms:activated` 处理函数增加重新检测逻辑
- **向后兼容**：无 API 变更，无数据迁移，无配置变更
