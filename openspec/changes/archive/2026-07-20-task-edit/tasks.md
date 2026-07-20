## 1. 编辑表单 Modal

- [x] 1.1 在 TasksView.js 中新增 `_editTask(task)` 方法：创建 Modal，预填当前任务数据（title、prompt、topicId、status），taskType 和 mode 以只读 span 展示
- [x] 1.2 编辑 Modal 的表单布局复现创建表单的结构（字段标签、排列方式、样式），但去除模板选择器等创建专用功能
- [x] 1.3 选题下拉（topicId）在弹出时从 API 加载所有选题列表，当前选中项高亮
- [x] 1.4 状态下拉（status）展示所有可选项（pending/generating/review/approved/closed/archived），当前状态选中
- [x] 1.5 保存按钮调用 `taskRepo().update(task.id, changedFields)`，成功后关闭 Modal 并刷新列表，失败时弹出错误提示
- [x] 1.6 取消按钮关闭 Modal，不做任何修改

## 2. 卡片编辑按钮

- [x] 2.1 在 `_renderTaskCard()` 的 `.ms-item-card-actions` 区域，在「删除」按钮前添加「编辑」按钮
- [x] 2.2 编辑按钮绑定 `_editTask(task)` 事件，并调用 `e.stopPropagation()` 防止触发卡片点击打开详情
