## 1. 数据层基础

- [x] 1.1 创建 `business/data/index.js` 仓储工厂，导出 `repo(api, schemaRegistry, tableName)` 快捷方法及 `taskRepo`/`assetRepo`/`scriptRepo` 专用仓储
- [x] 1.2 `business-db.init-def.js` 追加 `tasks` 表（月度分片，字段：id/topicId/title/taskType/status/prompt/mode/resultSummary/createdAt/updatedAt）
- [x] 1.3 `business-db.init-def.js` 追加 `assets` 表（月度分片，字段：id/taskId/type/url/filePath/thumbnail/metadata/status/createdAt/updatedAt）
- [x] 1.4 `business-db.init-def.js` 追加 `scripts` 表（不分片，字段：id/taskId/content/version/status/createdAt/updatedAt）

## 2. Framework 层清理

- [x] 2.1 `api.js` 移除 DataRepository import、`setSchemaRegistry()` 方法、`_themeRepo/_ideaRepo/_topicRepo` 字段
- [x] 2.2 `api.js` 移除所有业务代理方法（listTasks~deleteTopics 共 30 个方法）
- [x] 2.3 `ViewManager.js` 移除 `entry.hash === 'database'` 条件判断，所有视图统一注入 `schemaRegistry`

## 3. 现有策划视图迁移

- [x] 3.1 `ThemeStrategy.js` 引入 DataRepository，替换 `api.listThemes()`/`api.createTheme()`/`api.updateTheme()` 为仓储调用
- [x] 3.2 `IdeaBoard.js` 引入 DataRepository，替换 `api.listIdeas()`/`api.createIdea()`/`api.updateIdea()`/`api.deleteIdea()` 为仓储调用
- [x] 3.3 `TopicBoard.js` 引入 DataRepository，替换 `api.listTopics()`/`api.createTopic()`/`api.updateTopic()`/`api.deleteTopic()` 为仓储调用

## 4. 创作视图重写

- [x] 4.1 `TasksView.js` 完全重写：基于 `taskRepo.find()` 替代旧文件 API，状态标签对齐新枚举（pending/generating/review/approved/rejected），支持按类型/状态/模式筛选
- [x] 4.2 `KanbanBoard.js` 完全重写：基于 `taskRepo.find()` 替代 `.index/tasks.json` + `.index/pipeline.json` 读取，列映射为 pending→generating→review→approved→rejected
- [x] 4.3 `ReviewMode.js` 完全重写：基于 `taskRepo.find({ status: 'review' })` 替代 pipeline/ 目录扫描，审批操作调用 `taskRepo.update(id, { status })`

## 5. Agent 集成层

- [x] 5.1 创建 `business/agent/BriefBuilder.js`：将 tasks 记录组装为 `.agent/jobs/<taskId>/brief.md` + `job.json`
- [x] 5.2 创建 `business/agent/ResultParser.js`：解析 agent 输出结果，更新 tasks 状态并创建 assets/scripts 记录
- [x] 5.3 创建 `business/agent/AgentHandler.js`：编排 BriefBuilder → AgentTaskPoller 触发 → 轮询 → ResultParser 闭环
- [x] 5.4 创建 `business/agent/index.js`：导出 AgentHandler 入口

## 6. 验证

- [x] 6.1 `find src -name "*.js" -exec node --check {} \;` 全部通过
- [x] 6.2 端到端验证：各视图加载无错误，CRUD 操作正常
