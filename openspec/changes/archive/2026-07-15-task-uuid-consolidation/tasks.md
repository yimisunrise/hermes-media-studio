## 1. 核心修改

- [x] 1.1 修改 `AgentTaskPoller.createTask(type, briefContent, files, taskId?)`：增加第 4 个可选参数 `taskId`，传入时 `uuid = taskId` 而非自生成
- [x] 1.2 修改 `AgentHandler.submitTask()`：将 `taskRecord.id` 作为 taskId 传入 `createTask()`

## 2. 验证

- [x] 2.1 JS 语法检查：`find src -name "*.js" -exec node --check {} \;`（仅检查新增/修改文件，ES Module 预存警告忽略）
- [x] 2.2 确认向后兼容：未使用 taskId 的调用方行为不变
