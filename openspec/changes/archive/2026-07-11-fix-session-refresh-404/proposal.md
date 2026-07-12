## Why

页面刷新后，Hermes WebUI Extension 通过 `S.session.session_id` 获取到的 session ID 在 WebUI 服务端注册表中已失效，导致 `tree('pipeline/01-generating')` 调用返回 404（"Session not found"）。扩展没有检测和处理这种 session 过期场景，导致工作区状态被误判为"未初始化"。

## What Changes

- 在 `api.js` 中添加 session 有效性验证方法 `_ensureFreshSession()`
- 在 `checkInitialized()` 中检测 404 错误时自动尝试重建 session 并重试
- 如果重建 session 后仍然失败，返回 `false` 以触发正常的工作区初始化提示
- 添加 `tryRefreshSession()` 公共方法，供其他模块在 404 时触发 session 重建

## Capabilities

### New Capabilities
- `session-refresh`: 在 Hermes WebUI 环境下的 session 过期检测与自动恢复机制。覆盖从 session 失效检测、重建 session、到重试失败请求的完整链路。

### Modified Capabilities

（无 — 本仓库尚未定义 specs）

## Impact

- `src/modules/api.js`: 新增 `_ensureFreshSession()` 和 `tryRefreshSession()` 方法；修改 `checkInitialized()`、`tree()` 以支持 session 重建重试
- 所有现有 API 行为不变，仅增加 session 失效时的自动恢复路径
