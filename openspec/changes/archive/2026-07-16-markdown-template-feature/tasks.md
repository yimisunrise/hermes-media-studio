## 1. 模板数据层

- [ ] 1.1 在 `business-db.init-def.js` 中注册 `templates` 表 schema（字段：id/name/type/content/description/tags/createdAt/updatedAt）
- [ ] 1.2 在 `src/business/data/index.js` 中新增 `templateRepo` 快捷工厂函数

## 2. 模板管理视图

- [ ] 2.1 创建 `src/business/views/TemplatesView.js`，实现模板列表渲染（按 type 分组显示，tab 切换 brief/content）
- [ ] 2.2 实现新建模板表单（含 name/type/content/description/tags 字段）
- [ ] 2.3 实现编辑模板功能（预填已有数据，保存时更新）
- [ ] 2.4 实现删除模板（带确认对话框）
- [ ] 2.5 实现空状态展示（"暂无模板，点击新建"）
- [ ] 2.6 在 `manifest.js` 注册模板视图（hash: `templates`）并加入「生产管理」菜单组

## 3. 任务创建集成（模板填充简报）

- [ ] 3.1 在 `TasksView._showCreateForm()` 中，在 textarea 上方添加「选择模板」按钮
- [ ] 3.2 实现模板选择弹出面板（加载 brief 类型模板列表，含名称+说明）
- [ ] 3.3 实现选中模板后填充 `#tv-prompt` textarea 的逻辑（替换现有内容，按钮文字更新为模板名）
- [ ] 3.4 处理「不使用模板」选项（清空 textarea 或保持现有内容）

## 4. 文稿编辑集成（从模板新建内容）

- [ ] 4.1 在 `TaskDetail.js` 的文稿区域增加「从模板新建」按钮（在 "+ 新建文稿" 旁）
- [ ] 4.2 实现模板选择弹出面板（加载 content 类型模板列表）
- [ ] 4.3 实现选中模板后创建文稿记录（content 预填模板 Markdown）并打开编辑器
- [ ] 4.4 确保 `ContentEditor` 接受并正确渲染预填充的模板内容
