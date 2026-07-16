## 删除策略

直接删除 `SchemaRegistry.init-def.js` 中的 `main` 数据库创建代码，不做任何替代。

## 影响范围

**仅一个文件**: `src/business/init/SchemaRegistry.init-def.js`

### 删除的代码

当前 handler 中第13-27行创建 main 数据库的 3 个步骤：
1. `api.mkdir('.database/main')` — 创建目录
2. `api.writeJSON('.database/main/db.json', ...)` — 写入空数据库元数据
3. 更新 `databases.json` 注册 main 库

### 不受影响

- `DataRepository.for()` 始终使用 `'business'` 数据库，与 `main` 无关 ✓
- `SchemaRegistry.bootstrapSystemDb()` — 创建 `.database/system/`，独立于 main ✓
- `business-db.init-def` — 在 `business` 数据库上建表，不受影响 ✓
- 任何视图或仓储调用均不引用 `.database/main/` ✓
