## 1. TasksView 添加删除功能

- [x] 1.1 在 `_renderTaskCard()` 中为任务卡片添加删除按钮（红色样式，位于卡片底部或右上角，点击时停止事件冒泡）
- [x] 1.2 实现 `_deleteTask(task)` 方法：弹确认 Modal → 调用 `this._ts().delete(task.id)` → 刷新列表
- [x] 1.3 在确认 Modal 中显示关联数据提示：根据 `task.taskType` 类型显示素材/文稿关联警告
- [x] 1.4 确认 Modal 使用项目一致的 Modal 组件（参考 TopicBoard._deleteTopic 模式）

## 2. 验证

- [x] 2.1 执行 JS 语法检查：`node --input-type=module --check src/business/views/TasksView.js` → 语法正确
- [ ] 2.2 确认删除操作走通完整流程：点击删除 → Modal 确认 → 记录从 data.json 移除 → 列表刷新
- [ ] 2.3 确认删除后关联的素材/文稿数据在数据库中保留
