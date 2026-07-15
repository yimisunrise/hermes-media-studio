## 1. 调整 AgentTaskPoller API

- [x] 1.1 修改 `deliver()` 改为 `stageResult(uuid)`——仅创建 `.agent/results/<uuid>/` 目录 + 清理 `.agent/processing/<uuid>/`
- [x] 1.2 修改 `collect()` 改为返回 `{ uuid, resultText }[]`——扫描 results 目录，读取 `result.md` 原文，采集即清理
- [x] 1.3 新增 `createTask(type, briefContent, files?)`——创建 UUID 目录，写入 `job.json` + `brief.md`，复制附件
- [x] 1.4 新增 `readResult(uuid)`——读取 `.agent/results/<uuid>/result.md` 原文，不存在返回 null

## 2. 保留不动的方法

- [x] 2.1 验证 `scan()` 不变——已正确读取 `job.json` 返回任务列表
- [x] 2.2 验证 `pickup(uuid)` 不变——已正确 mv tasks → processing
- [x] 2.3 验证 `isPendingTask()` 不变——已正确判断 job.status

## 3. 验证

- [x] 3.1 `node --check src/framework/core/AgentTaskPoller.js` 语法检查通过
- [x] 3.2 `collect()` 返回 text 而非 parsed JSON，确认无调用方依赖旧格式
