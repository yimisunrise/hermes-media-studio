## Context

Media Studio 扩展在 `MediaStudioApp.init()` 时从 `S.session` 读取 `session_id` 和 `workspace` 路径后，将其永久缓存在 `WorkspaceAPI` 实例的私有字段 `_sessionId` / `_workspacePath` 中。getter 方法短路到缓存，永不重新读取 `S.session`。`_workspaceReady` 同样在 `init()` 期间一次设置后永不重新评估。

然而 WebUI 可能在不同时机更新 `S.session`：
- 用户切换工作空间（workspace 路径变化）
- 在同一工作空间内创建新的聊天对话（session_id 变化）
- WebUI 重新初始化或热重载

当前缓存策略导致扩展在这些场景下使用过期的凭证和工作空间路径。

## Goals / Non-Goals

**Goals:**
- `WorkspaceAPI` 每次访问 `sessionId` / `workspacePath` 时都能读取到 `S.session` 的最新值
- `_workspaceReady` 在侧边栏激活时重新验证，而非永久缓存
- `checkInitialized()` 对所有错误类型（不仅仅是 404）都能触发 session 刷新重试
- 最小化代码改动量，不引入新依赖或复杂状态管理

**Non-Goals:**
- 不改变模块间通信方式（继续使用事件和直接方法调用）
- 不改变 WorkspaceAPI 的公开 API 签名
- 不涉及 UI 组件改动
- 不添加轮询或定期刷新机制（按需刷新即可）

## Decisions

### Decision 1: Session/Workspace getter 改为每次从 S.session 读取

**方案**：移除 `sessionId` 和 `workspacePath` getter 的缓存短路逻辑，改为每次调用都从 `S.session` 读取。保留 `detectWorkspace()` 作为显式刷新的方法入口。

```js
// 之前：缓存短路
get sessionId() {
    if (this._sessionId) return this._sessionId;  // ← 永不重新读取
    if (S?.session?.session_id) {
        this._sessionId = S.session.session_id;
    }
    return this._sessionId;
}

// 之后：每次从 S.session 读取
get sessionId() {
    // 每次读取 S.session 的最新值
    if (S?.session?.session_id) {
        this._sessionId = S.session.session_id;   // 更新缓存但每次检查
        return this._sessionId;
    }
    return this._sessionId;  // 兜底：如果 S.session 不可用，返回最后的已知值
}
```

**为什么不保留缓存**：用户明确指出"同一个工作空间也可能创建不同聊天对话"，意味着 `S.session.session_id` 可以在不切换工作空间的情况下改变。缓存必然导致过期。

**备选方案考虑**：添加 `invalidateCache()` 方法让调用者手动清除缓存。但这种方式依赖调用者记得在合适的时机调用，容易遗漏。直接读取更可靠。

### Decision 2: `ms:activated` 时重新检测初始化

**方案**：在 `app.js` 的 `ms:activated` 事件处理器中，先调用 `api.detectWorkspace()` 刷新 session/workspace，再调用 `api.checkInitialized()` 重新检查初始化状态，更新 `this._workspaceReady`。

```js
// 之前：只导航
document.addEventListener('ms:activated', () => {
    const currentHash = window.location.hash;
    this.router.navigate(currentHash ? currentHash.slice(1) : 'kanban');
});

// 之后：先重新检测，再导航
document.addEventListener('ms:activated', async () => {
    // 重新检测工作空间和会话
    this.api.detectWorkspace();
    this._workspaceReady = await this.api.checkInitialized();
    
    const currentHash = window.location.hash;
    if (!currentHash || currentHash === '#') {
        this.router.navigate('kanban');
    } else {
        this.router.navigate(currentHash.slice(1));
    }
});
```

**为什么不把重新检测放到路由层**：路由层 (`router.js`) 是纯 hash 分发器，不应感知业务状态。将状态检测放在 `app.js` 的激活事件中更合适。

### Decision 3: `checkInitialized()` 增强错误容错

**方案**：当前 `checkInitialized()` 仅在 `err.message?.includes('404')` 时触发 session 刷新和重试。改为对所有 HTTP 错误（4xx、5xx）都尝试刷新一次，网络错误（TypeError）则立即返回 false（重试无意义）。

```js
async checkInitialized() {
    try {
        await this.read('.index/manifest.json');
        return true;
    } catch (err) {
        // HTTP 错误码（包括 404、403、500 等）都可能因 session 过期引起
        if (err.message?.match(/\b[4-5]\d{2}\b/)) {
            const refreshed = await this.tryRefreshSession();
            if (refreshed) {
                try {
                    await this.read('.index/manifest.json');
                    return true;
                } catch { return false; }
            }
        }
        // 网络错误（TypeError）直接返回 false
        return false;
    }
}
```

### Decision 4: 保持 `detectWorkspace()` 语义但扩大调用范围

**方案**：`detectWorkspace()` 本身逻辑不变（从 `S.session` 读取并写入私有字段），但在以下时机自动调用：
1. `ms:activated` 事件触发时（Decision 2）
2. `checkInitialized()` 错误重试路径中（已包含 `tryRefreshSession()` 调用）

不需要在每次 API 调用前调用，因为 getter 的惰性读取（Decision 1）已保证每次获取最新值。

### Decision 5: getter 不能覆盖独立 session（Bug 修复）

**问题**：当 `checkInitialized()` 失败时，`tryRefreshSession()` → `_createStandaloneSession()` 创建一个新的独立 session 并写入 `this._sessionId`。但重试路径中 `this.read()` → `this._getUrl()` 会访问 `this.sessionId` getter，getter 总是先读取 `S?.session?.session_id` —— 如果 `S.session` 仍保留着旧的 session_id，getter 返回旧值，重试完全无效。

**方案**：增加 `_usingStandaloneSession` 标志位。当 `_createStandaloneSession()` 创建独立 session 后将此标志设为 `true`，`sessionId` getter 检测到此标志时优先返回 `this._sessionId` 而非 `S.session.session_id`。当 `detectWorkspace()` 确认 `S.session` 有有效值时清除此标志。

```js
// api.js
_usingStandaloneSession = false;  // 新增字段

_createStandaloneSession() {
    // ... existing logic ...
    if (data?.session?.session_id) {
        this._sessionId = data.session.session_id;
        this._workspacePath = data.session.workspace || null;
        this._usingStandaloneSession = true;  // 标记正在使用独立 session
        return true;
    }
    return false;
}

get sessionId() {
    // 如果正在使用独立 session，优先使用缓存值（S.session 可能仍为旧值）
    if (this._usingStandaloneSession) {
        return this._sessionId;
    }
    if (S?.session?.session_id) {
        this._sessionId = S.session.session_id;
        return this._sessionId;
    }
    return this._sessionId;
}

detectWorkspace() {
    if (S?.session?.session_id) {
        this._sessionId = S.session.session_id;
        this._workspacePath = S.session.workspace || null;
        this._usingStandaloneSession = false;  // S.session 有效，切回主通道
        return true;
    }
    return false;
}
```

### Decision 6: 初始化后创建 `.index/init.json` 作为初始化标记

**问题**：`_createWorkspaceDirectories()` 只创建目录，不创建任何文件。`checkInitialized()` 探测 `.index/manifest.json`，但这个文件从未被创建过。仅靠 `_renderInitView()` 中硬编码的 `this._workspaceReady = true` 维持当前会话工作，页面刷新或工作空间切换后 `checkInitialized()` 必然返回 false。

**方案**：
1. 在 `app.js` 中定义 `APP_VERSION` 常量
2. 初始化创建目录成功后，写入 `.index/init.json` 记录版本信息和目录快照
3. `checkInitialized()` 改为探测 `.index/init.json` 而非 `.index/manifest.json`
4. 未来可基于 version 做目录结构迁移

```js
// app.js
const APP_VERSION = '1.0.0';  // 应用版本，用于未来迁移

_writeInitMarker() {
    return this.api.writeJSON('.index/init.json', {
        version: APP_VERSION,
        created_at: new Date().toISOString(),
        directories: DIRS_TO_CREATE
    });
}

// _createWorkspaceDirectories 成功后调用
async _createWorkspaceDirectories(progressEl) {
    let allOk = true;
    for (let i = 0; i < DIRS_TO_CREATE.length; i++) {
        // ... mkdir each ...
    }
    if (allOk) {
        try {
            await this._writeInitMarker();
        } catch (e) {
            console.error('write init.json failed:', e);
            allOk = false;
        }
    }
    return allOk;
}

// api.js — checkInitialized() 改为探测 init.json
async checkInitialized() {
    try {
        await this.read('.index/init.json');
        return true;
    } catch (err) {
        // ... rest same ...
    }
}
```

## Appendix: Bug Supplement

### Bug 1: getter 覆盖独立 session

首次发现于 `fix-session-caching` 变更验证阶段。`sessionId` getter 每次从 `S.session` 读取，覆盖了 `tryRefreshSession()` 创建的独立 session，导致重试路径永远使用过期 session。

**修复**：`_usingStandaloneSession` 标志位控制 getter 优先级。

### Bug 2: 初始化标记文件不存在

`checkInitialized()` 探测 `.index/manifest.json`，但初始化流程只创建目录文件，从未创建此文件，导致初始化检测永远失败。

**修复**：创建 `.index/init.json` 作为新的初始化标记文件。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 每次访问 `sessionId` 都读取 `S.session`，频繁访问时性能开销 | `S.session` 是内存对象，读取无 I/O 开销，性能影响可忽略 |
| `ms:activated` 时 `checkInitialized()` 可能因网络延迟阻塞 UI | `checkInitialized()` 是异步的，UI 渲染在 await 之后才进行；但等待期间无法显示内容。可考虑先渲染上次缓存视图，后台再刷新 |
| `S.session` 在 `ms:activated` 时可能仍为 null（WebUI 异步启动） | 保留 `_waitForSession()` 的兜底逻辑；如果 session 不可用，navigation 不会触发渲染 |
