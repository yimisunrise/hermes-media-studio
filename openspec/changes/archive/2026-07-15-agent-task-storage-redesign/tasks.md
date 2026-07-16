## 1. AgentTaskPoller 核心重写

- [x] 1.1 修改 `AGENT_DIR` 常量为 `.agent-tasks`
- [x] 1.2 实现 `readIndex()` — 读 `.agent-tasks/index.json` 并返回解析内容；文件不存在返回默认结构 `{version:1, processing:null, tasks:{}}`
- [x] 1.3 实现 `writeIndex(data)` — 写 `.agent-tasks/index.json`（原子写入，先写临时文件再 rename）
- [x] 1.4 实现 `updateTaskStatus(uuid, status)` — 读取 index.json → 更新对应字段（含 processing 锁和时间戳）→ 写回
- [x] 1.5 重写 `createTask(type, briefContent, files, taskId)` — 在 `.agent-tasks/<uuid>/` 创建目录，写入 job.json + brief.md，可选 files/，调用 `updateTaskStatus` 写入 index.json
- [x] 1.6 实现 `readBrief(uuid)` — 读 `.agent-tasks/<uuid>/brief.md`
- [x] 1.7 实现 `writeResult(uuid, resultContent)` — 写 `.agent-tasks/<uuid>/result.md` 并调用 `updateTaskStatus(uuid, 'done')`
- [x] 1.8 实现 `readResult(uuid)` — 读 `.agent-tasks/<uuid>/result.md`
- [x] 1.9 删除旧方法：`scan()`、`pickup()`、`stageResult()`、`collect()`

## 2. AgentStatusSync 适配

- [x] 2.1 修改构造函数，接收 `AgentTaskPoller` 实例替代裸 `api`
- [x] 2.2 重写 `_poll()` — 调用 `poller.readIndex()` 读取全量状态，根据 `tasks[uuid].status` 判断状态变化
- [x] 2.3 对于 `status === 'generating'` 的任务：直接读取 `index.json` 中的状态，不再 try-catch 目录存在性
- [x] 2.4 对于 `status === 'done'` 的任务：调用 `poller.readResult(uuid)` 读取结果，同步到业务 DB

## 3. AgentHandler 适配

- [x] 3.1 调整 `submitTask()` — 确保传入 `AgentTaskPoller` 实例的调用链路适配新 API
- [x] 3.2 确保 `startSync()` / `stopSync()` 接口不变（对业务层透明）

## 4. 初始化逻辑修改

- [x] 4.1 修改 `business-db.init-def.js` 中的 `_ensureAgentDirs()` — 创建 `.agent-tasks/` 目录，写入初始 `index.json`
- [x] 4.2 移除旧的 `.agent/tasks/`、`.agent/processing/`、`.agent/results/` 目录创建逻辑

## 5. 安装脚本适配

- [x] 5.1 修改 `src/scripts/install.sh` — 将 `.agent/{tasks,processing,results}` 替换为 `.agent-tasks/`

## 6. 文档更新

- [x] 6.1 更新 `ARCHITECTURE.md` — 所有 `.agent/` 目录结构引用替换为 `.agent-tasks/`，重写 Agent 通信协议章节
- [x] 6.2 更新 `README.md` — 工作空间目录结构中的 `.agent/` 替换为 `.agent-tasks/`
- [x] 6.3 更新 `DESIGN.md` — Agent 通信协议相关描述同步更新
