## Context

`SchemaRegistry.createTable()` 将表元数据写入两个位置：
- `schema.json`: 完整表定义（含 `fields` 数组）
- `db.json` 的 `tables` 数组：仅存 `{id, label}`，不含字段数

`listTables()` 读取 `db.json.tables` 返回无字段信息的数据 → 列表渲染 `t.fields ? t.fields.length : 0` 始终为 0。

## Goals / Non-Goals

**Goals:**
- 表列表正确显示字段数量
- 创建表、编辑表时字段数自动同步
- 零额外 API 调用

**Non-Goals:**
- 不改变 `schema.json` 的数据结构
- 不改 `listTables()` 的返回格式（保持返回 `tables` 数组）

## Decisions

**方案 A：在 `db.json` 存储 `fieldCount`**

在 `createTable()` 的 `db.json` table entry 中加入 `fieldCount`， `updateTable()` 更新字段时同步刷新。渲染模板从 `t.fieldCount` 读取。

```
createTable()                         updateTable()
  schema.json ← fields                  schema.json ← updated fields
  db.json.tables.push({                   db.json 更新 fieldCount
    id, label, fieldCount
  })
```

理由：
- 零额外 API 开销（`listTables` 已有全部数据）
- 修改范围最小（仅 3 处改动）
- `updateTable()` 更新字段时同步刷新 count

**模板修改：**
- `t.fields ? t.fields.length : 0` → `t.fieldCount ?? 0`

## Risks / Trade-offs

- 已有表（已有 `db.json` 记录）没有 `fieldCount` → `?? 0` 安全降级
- `fieldCount` 不保证与 `schema.json.fields.length` 完全一致（数据冗余风险）→ 可视作缓存，可接受
