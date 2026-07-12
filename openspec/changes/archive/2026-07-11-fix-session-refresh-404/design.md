## Context

Media Studio Extension 作为一个 Hermes WebUI Extension，通过全局对象 `S.session.session_id` 获取当前会话 ID，用于后续 API 调用鉴权。Hermes WebUI 在页面加载时异步初始化 session，某些场景（页面刷新、session 过期）下 `S.session.session_id` 返回的 ID 在 WebUI 服务端内存注册表中已不存在。

当前代码流：

```
init()
  → api._waitForSession()          // 等 S.session 出现
  → api.detectWorkspace()          // 读取 workspace 路径
  → api.probe()                     // 检查 API 可达性 (path = ".")
  → api.checkInitialized()          // tree("pipeline/01-generating")
                                       ↓
                                  // 404 → 返回 false → 误判为"未初始化"
```

`checkInitialized()` 目前对 404 不区分是"路径不存在"还是"session 失效"，一律返回 `false`。而 `init()` 的 fallback 只提示用户手动初始化，没有重试机制。

## Goals / Non-Goals

**Goals:**
- 检测并区分 404 的根因（session 过期 vs 路径真的不存在）
- 当 session 过期时，自动创建新 session 并重试
- 保持向后兼容 — 现有 API 行为不变

**Non-Goals:**
- 不修改 Hermes WebUI 的服务端 session 管理
- 不改变工作区初始化流程
- 不涉及文件操作 API 的改动

## Decisions

### Decision 1: 在 `checkInitialized()` 中嵌入重试逻辑，而不是新增独立验证步骤

在 `probe()` 和 `checkInitialized()` 之间新增一个 session 验证步骤会增加一次额外的 API 调用，对用户可见延迟。更好的方案是在 `checkInitialized()` 内部检测到 404 时，主动尝试重建 session。

- **选择**: 在 `tree()` 方法中捕获 404 错误，首次失败时尝试创建新 session
- **替代方案 A**: 新增 `_ensureFreshSession()` 在 `probe()` 后调用 → 额外 API 调用，延迟增加
- **替代方案 B**: 在 `_waitForSession()` 中验证 session → 会阻塞 UI 启动

### Decision 2: 仅在 `checkInitialized` 场景下触发 session 重建，而非全局拦截

全局拦截所有 404（如在 `tree()` / `read()` / `write()` 统一处理）风险较高——可能掩盖其他真正的 404 错误，或导致循环重试。所以将自动刷新逻辑限定在 `checkInitialized()` 和可调用的 `tryRefreshSession()` 方法上。

- **选择**: 在 `checkInitialized()` 中显式调用 `tryRefreshSession()`
- **替代方案**: 在 `tree()` 中统一拦截 404 并 retry → 可能对非 session 相关的 404 产生副作用

### Decision 3: session 重建通过现有的 `_createStandaloneSession()` 实现

`_createStandaloneSession()` 已经通过 `POST /api/session/new` 创建新 session 并更新本地 `_sessionId` 和 `_workspacePath`。复用该方法不需要新端点。

## Risks / Trade-offs

- **[Risk] 连续重试导致无限循环** → 限制重试次数（最多 1 次），超过后仍返回原始错误
- **[Risk] `_createStandaloneSession()` 创建的新 session workspace 与 WebUI 不同** → 观察日志输出；如果 session workspace 不匹配，tree call 仍然可能 404，但这时是正确的拒绝（路径真的不存在）
