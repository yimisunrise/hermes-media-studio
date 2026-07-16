## 1. BriefBuilder 模块

- [ ] 1.1 创建 `src/business/agent/BriefBuilder.js`：接收 task record（含 topicId/taskType/title/prompt），返回 `{ job: {...}, brief: "..." }`。job 包含 type/taskId/status/createdAt，brief 为 YAML frontmatter + Markdown 正文

## 2. AgentHandler 模块

- [ ] 2.1 创建 `src/business/agent/AgentHandler.js`：接收 api/schemaRegistry/agentTaskPoller，暴露 `submitTask(taskRecord)` 方法。内部调用 BriefBuilder.build() → AgentTaskPoller.createTask()

## 3. 模块入口与集成

- [ ] 3.1 创建 `src/business/agent/index.js`：导出 BriefBuilder 和 AgentHandler
- [ ] 3.2 修改 `src/business/views/TasksView.js`：在创建 Agent 模式任务后（`mode === 'agent'`）调用 `agentHandler.submitTask()`

## 4. 目录初始化

- [ ] 4.1 修改 `src/business/init/business-db.init-def.js`：在执行逻辑中创建 `.agent/tasks/`、`.agent/processing/`、`.agent/results/` 目录

## 5. 验证

- [ ] 5.1 JS 语法检查：`find src -name "*.js" -exec node --check {} \;`（仅检查语法，ES Module 预存警告忽略）
