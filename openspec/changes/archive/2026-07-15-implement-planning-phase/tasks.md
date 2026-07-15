## 1. 基础设施：business 库注册

- [ ] 1.1 在 SchemaRegistry 中注册 `business` 数据库（注册 3 个 schema.json：themes / ideas / topics）
- [ ] 1.2 在 api.js 中添加 DataRepository 实例化和 business 数据操作方法（listThemes / createTheme / listIdeas / createIdea / listTopics / createTopic 等）
- [ ] 1.3 验证：启动系统后 business 库的 3 张表正确创建

## 2. ThemeStrategy 视图

- [ ] 2.1 创建 `src/business/views/ThemeStrategy.js`：视图骨架 + render 方法
- [ ] 2.2 实现主题列表卡片展示（名称/描述/标签/色块/创建时间）
- [ ] 2.3 实现添加主题功能（模态框编辑 → 保存）
- [ ] 2.4 实现编辑主题功能（点击卡片展开编辑或编辑按钮）
- [ ] 2.5 实现删除主题功能（确认弹窗 → 删除）
- [ ] 2.6 实现空状态展示

## 3. IdeaBoard 视图

- [ ] 3.1 创建 `src/business/views/IdeaBoard.js`：视图骨架 + render 方法
- [ ] 3.2 实现快速录入栏（输入框 + Enter 即创建）
- [ ] 3.3 实现灵感列表展示（标题/状态/关联主题/创建时间）
- [ ] 3.4 实现灵感展开详情编辑（描述/关联主题/标签/参考链接）
- [ ] 3.5 实现筛选功能（按状态/主题/标签文本搜索）
- [ ] 3.6 实现删除灵感功能
- [ ] 3.7 实现空状态展示

## 4. TopicBoard 视图

- [ ] 4.1 创建 `src/business/views/TopicBoard.js`：视图骨架 + render 方法
- [ ] 4.2 实现从 Idea 创建 Topic 的弹窗（选择 Idea → 填写标题/内容形态/截止日期）
- [ ] 4.3 实现创建时自动将源 Idea 标记为 used
- [ ] 4.4 实现选题列表展示（标题/来源 Idea/内容形态标签/主题/状态/截止日期）
- [ ] 4.5 实现编辑 Topic（标题/内容形态/状态）
- [ ] 4.6 实现空状态展示

## 5. Manifest 和菜单注册

- [ ] 5.1 在 `manifest.js` 中注册 ThemeStrategy（#themes）、IdeaBoard（#ideas）、TopicBoard（#topics）
- [ ] 5.2 更新菜单分组：ThemeStrategy 加入「运营配置」，IdeaBoard + TopicBoard 加入「资源管理」
- [ ] 5.3 验证：三个新视图正确出现在对应菜单中，路由正常跳转
