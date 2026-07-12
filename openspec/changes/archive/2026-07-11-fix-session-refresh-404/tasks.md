## 1. Session 刷新逻辑实现

- [x] 1.1 在 `MediaStudioAPI` 类中添加 `tryRefreshSession()` 公共方法——调用 `_createStandaloneSession()` 创建新 session，更新 `_sessionId` 和 `_workspacePath`，返回 boolean
- [x] 1.2 修改 `checkInitialized()`——在 `tree('pipeline/01-generating')` 捕获 404 时，调用 `tryRefreshSession()` 重建 session 后重试一次；重试仍失败则返回 `false`
- [x] 1.3 确保重试次数限制为最多 1 次（防无限循环）

## 2. 验证与测试

- [ ] 2.1 页面刷新后观察控制台确认不再出现 404 "Session not found" 错误
- [ ] 2.2 验证 session 过期时扩展自动恢复并正常加载 kanban 视图
- [ ] 2.3 确认工作区未初始化时（目录不存在）仍正确显示初始化提示
