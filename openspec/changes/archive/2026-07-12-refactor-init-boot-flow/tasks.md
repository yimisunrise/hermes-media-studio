## 1. 初始化标记迁移 (`.system/boot.json`)

- [x] 1.1 在 `src/modules/api.js` 中将 `checkInitialized()` 的检测路径从 `.index/init.json` 改为 `.system/boot.json`
- [x] 1.2 在 `src/app.js` 中将 `_writeInitMarker()` 的写入路径从 `.index/init.json` 改为 `.system/boot.json`，格式改为 `{ version, init_state: "complete", last_boot, directories }`

## 2. 未初始化时菜单隐藏

- [x] 2.1 在 `src/app.js` 的 `_createPanel()` 中，根据 `this._workspaceReady` 状态过滤 `MENU_GROUPS`：未初始化时只显示 `system` 分组下的 `init` 菜单项
- [x] 2.2 在 `src/app.js` 的 `_initModules()` 中，对非 `init` 路由请求做检查：未初始化时强制跳转到 `#init`

## 3. 验证

- [x] 3.1 验证语法：`find src -name "*.js" -exec node --check {} \;`
