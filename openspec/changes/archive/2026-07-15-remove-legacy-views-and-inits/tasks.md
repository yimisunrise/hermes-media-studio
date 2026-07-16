## 1. 依赖链调整

- [x] 1.1 `SchemaRegistry.init-def.js` 将 `dependsOn: ['workspace']` 改为 `dependsOn: ['orchestrator-core']`

## 2. manifest 清理

- [x] 2.1 删除 manifest.js 中 3 个菜单组（publishing / resources / operations）
- [x] 2.2 删除 manifest.js 中 views 数组的 5 个遗留视图条目
- [x] 2.3 删除 manifest.js 中 inits 数组的 2 个 init-def 条目

## 3. 文件删除

- [x] 3.1 删除 5 个遗留视图文件
- [x] 3.2 删除 2 个组件文件（MediaCard.js / MediaDetail.js）
- [x] 3.3 删除 2 个 init-def 文件（workspace / configs）

## 4. api.js 残余清理

- [x] 4.1 删除 `listPlatforms()` / `createPlatform()` / `updatePlatform()` 方法
- [x] 4.2 删除 `listCopywritings()` / `getCopywriting()` 方法
- [x] 4.3 确认无其他代码引用被删除的 api 方法

## 5. install.sh 清理

- [x] 5.1 移除旧目录创建逻辑（.index / tasks / copywriting / .trash / archive）

## 6. 验证

- [x] 6.1 JS 语法检查：`find src -name "*.js" -exec node --check --input-type=module {} \;`
- [x] 6.2 确认 manifest 视图/menu/init 数量：7 views / 3 menus / 3 inits
- [x] 6.3 确认 install.sh 不再引用已删除的目录路径
