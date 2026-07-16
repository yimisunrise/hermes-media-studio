## 1. 修正 AssetGallery 路径

- [x] 1.1 将 AssetGallery.js 第 165 行 `'workspace/assets/'` 改为 `'assets/'`
- [x] 1.2 将 AssetGallery.js 第 168 行 `'workspace/assets/'` 改为 `'assets/'`

## 2. 修正 TaskDetail 路径

- [x] 2.1 将 TaskDetail.js 第 272 行 `'workspace/assets/'` 改为 `'assets/'`
- [x] 2.2 将 TaskDetail.js 第 275 行 `'workspace/assets/'` 改为 `'assets/'`

## 3. 验证

- [x] 3.1 JS 语法检查：`find src -name "*.js" -exec node --check {} \;`（预置问题：所有文件均为 ES module，`node --check` 在 CommonJS 模式下报 import/export 错误）
- [x] 3.2 确认无其他文件硬编码了 `workspace/assets/` 路径模式（grep 返回零结果）
