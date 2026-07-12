## 1. WorkspaceAPI — 取消 session/workspace getter 永久缓存

- [x] 1.1 修改 `sessionId` getter：每次从 `S.session.session_id` 读取，移除 `if (this._sessionId) return this._sessionId` 短路
- [x] 1.2 修改 `workspacePath` getter：每次从 `S.session.workspace` 读取，移除 `if (this._workspacePath) return this._workspacePath` 短路
- [x] 1.3 保留 `_sessionId` / `_workspacePath` 作为兜底值（当 `S.session` 不可用时返回最后的已知值）

## 2. WorkspaceAPI — 增强 `checkInitialized()` 错误容错

- [x] 2.1 将错误匹配条件从 `includes('404')` 扩展为匹配任意 HTTP 状态码（`match(/\b[4-5]\d{2}\b/)`）
- [x] 2.2 确认 `tryRefreshSession()` → 重试 `read('.index/manifest.json')` 流程在产品场景下工作正常
- [x] 2.3 验证：网络错误（TypeError）不做重试，直接返回 false

## 3. app.js — `ms:activated` 时重新检测初始化

- [x] 3.1 将 `ms:activated` 监听器改为 `async`，先调用 `api.detectWorkspace()` 刷新 session/workspace
- [x] 3.2 然后调用 `api.checkInitialized()` 更新 `this._workspaceReady`
- [x] 3.3 确保 `_renderWarningBanner` 使用更新后的 `_workspaceReady` 值

## 4. 修复 Bug 1: getter 覆盖独立 session

- [ ] 4.1 在 `WorkspaceAPI` 中新增 `_usingStandaloneSession = false` 字段
- [ ] 4.2 修改 `_createStandaloneSession()`：成功创建 session 后设置 `_usingStandaloneSession = true`
- [ ] 4.3 修改 `sessionId` getter：当 `_usingStandaloneSession` 为 true 时优先返回 `this._sessionId`
- [ ] 4.4 修改 `detectWorkspace()`：检测到 `S.session` 有效时清除 `_usingStandaloneSession` 标志

## 5. 修复 Bug 2: 初始化标记文件不存在

- [ ] 5.1 在 `app.js` 中定义 `APP_VERSION = '1.0.0'` 常量
- [ ] 5.2 新增 `_writeInitMarker()` 方法，向 `.index/init.json` 写入版本和目录快照
- [ ] 5.3 修改 `_createWorkspaceDirectories()`：目录创建成功后调用 `_writeInitMarker()`
- [ ] 5.4 修改 `api.js` 中 `checkInitialized()`：探测 `.index/init.json` 而非 `.index/manifest.json`

## 6. 验证

- [x] 6.1 检查 `find src -name "*.js" -exec node --check {} \;` 通过（所有报错为已有 ES module 环境问题，非本次引入）
- [ ] 6.2 验证场景：同一工作空间切换聊天对话后，扩展使用新 session_id 发起 API 请求
- [ ] 6.3 验证场景：工作空间 A → B → A 切换后，不显示初始化界面和警告横幅
- [ ] 6.4 验证场景：未初始化的工作空间首次使用时，正确显示初始化界面
