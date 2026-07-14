## Why

`.database/` 目录下有两个不同层级、不同语义的文件都叫 `db.json`，造成混淆：
- `.database/db.json` — **库级注册表**，列出所有数据库
- `.database/<库>/db.json` — **表级注册表**，列出该库中的表

同为 `db.json`，阅读代码和操作文件时难以区分，增加认知负担和维护成本。

## What Changes

将库级注册表 `.database/db.json` 重命名为 `.database/databases.json`，表级注册表 `.database/<库>/db.json` 保持不变。

变更范围（代码 + 文档）：
- `src/core/SchemaRegistry.js` — `DB_FILE` 常量路径
- `src/app.js` — bootstrap-core 步骤中的 `.database/db.json` 读写
- `src/scripts/migrate-v2.sh` — 脚本中 `.database/db.json` 创建
- `ARCHITECTURE.md` — 文档中 `.database/db.json` 引用
- `openspec/changes/rename-database-registry/` — 本次变更的提案/设计/任务文档

**不修改**已归档的设计文档（`openspec/changes/archive/` 下的历史记录）。

## Capabilities

### New Capabilities
无新增能力——纯重命名变更，无行为变化。

### Modified Capabilities
无规范级行为变更，不需要 delta spec。

## Impact

- **SchemaRegistry.js**: `DB_FILE` 常量从 `'.database/db.json'` 改为 `'.database/databases.json'`，所有引用自动生效
- **app.js**: bootstrap-core 中两处硬编码路径更新
- **migrate-v2.sh**: 创建根注册表的文件名更新
- **ARCHITECTURE.md**: 更新目录职责表和 `db.json` 章节中的文件路径
- **工作空间已有数据**：`~/.database/db.json` 需同步重命名，否则 SchemaRegistry 会视为"第一次启动"（因为读不到老文件），创建空白注册表
