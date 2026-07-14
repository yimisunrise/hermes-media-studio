## 1. SchemaRegistry 常量修改

- [x] 1.1 将 `DB_FILE` 常量值从 `'.database/db.json'` 改为 `'.database/databases.json'`
- [x] 1.2 验证所有通过 `DB_FILE` 引用的方法（`_readDbRegistry`、`_writeDbRegistry`）无需额外修改

## 2. bootstrap-core 初始化步骤更新

- [x] 2.1 `src/app.js` 中 bootstrap-core 步骤：将 `.database/db.json` 写路径改为 `.database/databases.json`
- [x] 2.2 ~~兼容逻辑~~（用户无历史数据，跳过，已从代码中移除）

## 3. 迁移脚本更新

- [x] 3.1 `src/scripts/migrate-v2.sh`：将创建根注册表的文件名从 `db.json` 改为 `databases.json`

## 4. 文档更新

- [x] 4.1 `ARCHITECTURE.md`：更新 4.2 目录层职责表格中的文件路径
- [x] 4.2 `ARCHITECTURE.md`：更新 4.4 `db.json` 职责章节中的文件路径和代码示例
- [x] 4.3 `ARCHITECTURE.md`：更新 6.1 SchemaRegistry API 伪代码中的文件路径

## 5. 验证

- [x] 5.1 JS 语法检查：`find src -name "*.js" -exec node --check {} \;`（预存错误，非本次引入）
- [x] 5.2 Shell 语法检查：`bash -n src/scripts/migrate-v2.sh` ✓
- [x] 5.3 确认无残留的 `.database/db.json` 硬编码引用 ✓（迁移兼容代码除外）
