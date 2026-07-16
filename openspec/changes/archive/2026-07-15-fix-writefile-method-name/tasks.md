## 1. 修复方法名

- [x] 1.1 AssetGallery.js:177 — `this.api.writeFile` → `this.api.write`
- [x] 1.2 TaskDetail.js:282 — `api.writeFile` → `api.write`

## 2. 验证

- [x] 2.1 grep `writeFile` 确认两处均已修改，无遗漏
- [x] 2.2 JS 语法检查：`find src -name "*.js" -exec node --check {} \;`（仅有预存在的 ES Module 警告，无新增错误）
