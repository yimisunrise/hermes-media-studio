## 1. 配置驱动状态机

- [ ] 1.1 创建 `configs/workflows/task-lifecycle.json` 配置文件，定义素材任务和文案任务的状态机（状态列表、kanban_states、transitions、color）
- [ ] 1.2 创建 `src/modules/utils/stateMachine.js`——读取配置文件并解析状态机定义，提供合法性校验（isValidTransition, getNextStates, getKanbanStates），有内置默认配置兜底

## 2. 菜单结构重构

- [ ] 2.1 重写 `app.js` 中的 `MENU_GROUPS`——按新四级分组组织（生产流程、发布管理、资源管理、运营配置）
- [ ] 2.2 新增/更新 `ICONS`——为 task、publish、copywriting、platforms 新增 SVG 图标
- [ ] 2.3 更新 `router.js` 中的 `VIEWS` 数组——添加 tasks/publish/copywriting/platforms，移除 generation/themes/dashboard/package-editor
- [ ] 2.4 更新 `app.js` 中的模块注册和视图渲染映射——新视图绑定到对应模块
- [ ] 2.5 删除或注释 `StatsDashboard.js`、`ThemeStrategy.js`、`PackageEditor.js` 的导入和注册
- [ ] 2.6 更新 `app.js` 中的 `DIRS_TO_CREATE`——添加 `tasks/` 和 `copywriting/` 目录

## 3. 任务系统——存储层

- [ ] 3.1 在 `api.js` 中添加任务操作方法：`listTasks()`、`createTask()`、`getTask()`、`updateTaskStatus()`、`readTaskBrief()`
- [ ] 3.2 在 `api.js` 中添加 `_buildTaskPath(uuid)` 辅助方法——生成 `tasks/<uuid>/` 路径
- [ ] 3.3 添加任务索引：`writeTaskIndex()`/`readTaskIndex()`——在 `.index/tasks.json` 维护任务清单

## 4. 任务系统——视图层

- [ ] 4.1 创建 `src/modules/TasksView.js`——任务列表视图，展示所有任务（类型、模式、状态、创建时间）
- [ ] 4.2 实现任务创建表单 UI——选择类型（素材/文案）、模式（手工/Agent）、填写 brief
- [ ] 4.3 实现手工任务状态变更 UI——根据 stateMachine 的 getNextStates 渲染操作按钮
- [ ] 4.4 不同类型任务卡片差异渲染——素材任务和文案任务使用不同颜色和字段

## 5. 看板重构

- [ ] 5.1 重写 `KanbanBoard.js`——移除顶部主题/时间/搜索筛选栏
- [ ] 5.2 看板改为从 `tasks/` 目录读取任务数据，而非从 pipeline 读取
- [ ] 5.3 看板列根据 stateMachine.getKanbanStates() 动态生成
- [ ] 5.4 看板卡片展示任务信息（类型、模式、状态），使用配置中的颜色
- [ ] 5.5 看板过滤：跳过 status=initialized 的任务，不展示 rejected/archived 状态列

## 6. 审批界面更新

- [ ] 6.1 更新 `ReviewMode.js`——从读取 pipeline 改为读取 tasks 中状态为 pending_review 的任务
- [ ] 6.2 区分任务类型渲染——素材任务展示图片/视频预览，文案任务展示 Markdown 渲染
- [ ] 6.3 审批操作（通过/驳回）调用 updateTaskStatus 更新任务状态

## 7. 平台配置

- [ ] 7.1 创建 `src/modules/PlatformConfig.js`——平台列表视图
- [ ] 7.2 实现平台添加/编辑表单 UI——平台名称、发布类型（多值）
- [ ] 7.3 实现平台禁用/启用功能
- [ ] 7.4 在 `api.js` 中添加平台操作方法：`listPlatforms()`、`createPlatform()`、`updatePlatform()`

## 8. 发布记录

- [ ] 8.1 创建 `src/modules/PublishView.js`——发布表单 + 发布记录列表
- [ ] 8.2 实现发布表单——选择平台（仅已启用）、发布类型（动态加载）、发布文案（从图文库选）、发布时间
- [ ] 8.3 发布记录存储和展示——按时间倒序排列，支持筛选
- [ ] 8.4 提交发布时更新关联文案的状态为 scheduled

## 9. 图文库

- [ ] 9.1 创建 `src/modules/CopywritingView.js`——图文列表视图
- [ ] 9.2 实现图文库分片索引——`.index/copywriting/YYYY/MM/` 按月分片，复用 search.js 的 shard 模式
- [ ] 9.3 图文详情渲染——Markdown 渲染展示，图片路径解析
- [ ] 9.4 支持按状态筛选（待审核/已审核/已发布等）
- [ ] 9.5 在 `api.js` 中添加图文操作方法：`listCopywritings()`、`getCopywriting()`

## 10. 日历更新

- [ ] 10.1 更新 `CalendarView.js`——从统计发布包数据改为统计每日素材和图文成果数量
- [ ] 10.2 日历读取 `assets/` 和 `copywriting/` 按日的分布数据

## 11. 文档更新

- [ ] 11.1 更新 `hermes-webui-media-studio-design.md`——添加新架构说明（任务系统、图文库、配置驱动状态机、新菜单结构）
- [ ] 11.2 更新 `AGENTS.md`——添加任务系统目录结构、配置驱动状态机说明、平台配置数据模型

## 12. 验证

- [ ] 12.1 JS 语法检查——所有修改和新建文件通过 `node --check`
- [ ] 12.2 运行时验证——菜单显示正确的四级分组
- [ ] 12.3 运行时验证——创建素材任务（手工）成功后可在任务列表和看板中看到
- [ ] 12.4 运行时验证——创建文案任务（Agent）成功
- [ ] 12.5 运行时验证——审批界面显示待审核任务，素材和文案渲染不同
- [ ] 12.6 运行时验证——添加平台，配置发布类型
- [ ] 12.7 运行时验证——创建发布记录，选择平台/类型/文案
- [ ] 12.8 运行时验证——图文库展示图文列表，分片索引工作
- [ ] 12.9 运行时验证——日历展示素材和图文统计
- [ ] 12.10 运行时验证——旧路由（#generation, #themes, #dashboard）自动跳转
