## Context

当前 `.database/` 目录下有两层 `db.json`：

```
.database/
├── db.json                ← 库级注册表 { databases: [...] }
├── system/
│   ├── db.json            ← 表级注册表 { id, label, tables: [...] }
│   ├── database/...
│   └── table/...
└── main/
    └── db.json            ← 表级注册表 { id, label, tables: [...] }
```

二者职责不同但文件名相同，阅读代码和排查问题时容易混淆。用户选择**方案C**：库级注册表改为 `databases.json`，表级注册表保持 `db.json` 不变。

## Goals / Non-Goals

**Goals:**
- 库级注册表文件重命名：`.database/db.json` → `.database/databases.json`
- 更新所有代码中的路径引用（SchemaRegistry、app.js、migrate-v2.sh）
- 更新 ARCHITECTURE.md 中的文件路径描述
- 提供工作空间已有数据的迁移方案

**Non-Goals:**
- 不修改表级注册表 `.database/<库>/db.json` 的命名
- 不修改已归档的设计文档（`openspec/changes/archive/`）
- 不改变任何数据结构或行为逻辑

## Decisions

### 1. 纯常量级修改，不引入兼容层

`DB_FILE = '.database/db.json'` 是 SchemaRegistry 中的常量，修改文件名后所有通过 `_readDbRegistry()` / `_writeDbRegistry()` 的路径自动更新。无需代理/兼容层。

`_readDbMeta(database)` 和 `_writeDbMeta(database)` 使用 `${database}` 变量构建路径，读的是 `.database/<id>/db.json`，不受影响。

### 2. 首次启动 vs 已有工作空间

- **首次启动**：`migrate-v2.sh` 和 `bootstrapSystemDb()` 直接创建 `databases.json`，无兼容问题。
- **已有工作空间**（已有 `.database/db.json` 但尚未改名）：SchemaRegistry 的 `_readDbRegistry()` 在文件不存在时返回 `{ databases: [] }`（空注册表）。此时需要**重命名已有文件**，否则下次启动会丢失已有库注册信息。

### 3. 不修改已归档文档

归档的设计文档（`openspec/changes/archive/`）是历史记录，保留原文件名引用。不影响代码和当前设计文档。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 已有 `.database/db.json` 未同步重命名，导致 SchemaRegistry 读到空注册表 | 在 bootstrap-core 或 migrate-v2.sh 中加入文件存在性检查：如果存在旧的 `db.json` 则重命名为 `databases.json` |
| 有其他未发现的代码引用该路径 | 通过 grep/ast-grep 全面搜索 `.database/db.json` 模式，确认所有引用均已更新 |
