## Why

当前 `SchemaRegistry.init-def.js` 在初始化时创建了一个名为 `main` 的数据库（`.database/main/`），但这个数据库在所有后续操作中从未被读取或写入。

所有业务数据均通过 `DataRepository.for(api, schemaRegistry, 'business', tableName)` 存入 `business` 数据库（`.database/business/`）。`main` 数据库是早期版本的遗留产物，属于死代码。

## What Changes

- 移除 `src/business/init/SchemaRegistry.init-def.js` 中创建 `main` 数据库的代码块（约第13-27行）
- 不涉及任何其他文件改动
- 不影响 `business` 数据库、DataRepository、SchemaRegistry 或其他任何功能
