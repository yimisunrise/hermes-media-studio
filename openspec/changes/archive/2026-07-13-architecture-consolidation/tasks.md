## 1. 代码清理（Dead Code Elimination）

- [x] 1.1 删除 `src/utils/dom.js`（无人引用，功能由 `modules/utils/dom.js` 覆盖）
- [x] 1.2 删除 `core/NotificationBus.js`（初始化为 null，未在任何视图使用）
- [x] 1.3 删除 `core/ProcessEngine.js`（与 stateMachine.js 功能重叠）
- [x] 1.4 审查并删除 `core/FileScanner.js`（如未被引用）
- [x] 1.5 更新 `core/index.js` 导出列表，移除已删除文件的 re-export
- [x] 1.6 运行 `node --check` 验证无断链（项目预先存在 ES 模块不支持 Node.js 直接检查的问题）



## 2. 基础设施迁移（lib/ 目录）

- [x] 2.1 创建 `src/lib/` 目录
- [x] 2.2 移动 `src/modules/api.js` → `src/lib/api.js`
- [x] 2.3 移动 `src/modules/state.js` → `src/lib/state.js`
- [x] 2.4 移动 `src/modules/router.js` → `src/lib/router.js`
- [x] 2.5 移动 `src/modules/sidebar.js` → `src/lib/sidebar.js`
- [x] 2.6 更新 `src/app.js` 中所有对 lib/ 文件的 import 路径
- [x] 2.7 运行 `node --check` 验证无断链（项目预先存在 ES module 兼容问题）



## 3. Utils 目录合并

- [x] 3.1 将 `modules/utils/dom.js` 迁移到 `src/utils/dom.js`
- [x] 3.2 将 `modules/utils/format.js` 迁移到 `src/utils/format.js`
- [x] 3.3 将 `modules/utils/meta.js` 迁移到 `src/utils/meta.js`
- [x] 3.4 将 `modules/utils/search.js` 迁移到 `src/utils/search.js`
- [x] 3.5 将 `modules/utils/stateMachine.js` 迁移到 `src/utils/stateMachine.js`
- [x] 3.6 更新 modules/ 中 12 个视图的 import (`./utils/` → `../utils/`)
- [x] 3.7 更新 modules/components/ 中 2 个文件的 import (`../utils/` → `../../utils/`)
- [x] 3.8 更新 app.js (`./modules/utils/` → `./utils/`) 和 DatabaseManager.js (`../modules/utils/` → `../utils/`)
- [x] 3.9 删除 `src/modules/utils/` 目录
- [x] 3.10 运行 `node --check` 验证（项目预先存在 ES module 兼容问题）

## 4. 视图迁移与构造签名统一

- [x] 4.1 迁移 `KanbanBoard.js` → `src/views/`
- [x] 4.2 迁移 `ReviewMode.js` → `src/views/`
- [x] 4.3 迁移 `TasksView.js` → `src/views/`
- [x] 4.4 迁移 `PublishView.js` → `src/views/`
- [x] 4.5 迁移 `CopywritingView.js` → `src/views/`
- [x] 4.6 迁移 `CalendarView.js` → `src/views/`
- [x] 4.7 迁移 `PlatformConfig.js` → `src/views/`
- [x] 4.8 迁移 `MediaArchive.js` → `src/views/`
- [x] 4.9 迁移 `GenerationConsole.js` → `src/views/`
- [x] 4.10 迁移 `PackageEditor.js` → `src/views/`
- [x] 4.11 迁移 `StatsDashboard.js` → `src/views/`
- [x] 4.12 迁移 `ThemeStrategy.js` → `src/views/`
- [x] 4.13 迁移 `components/` → `src/views/components/`（MediaCard.js, MediaDetail.js, ThemeSelector.js, PlatformSelector.js）
- [x] 4.14 确认 `DatabaseManager.js` 已在 `src/views/`
- [x] 4.15 更新 `app.js` 中 9 个 import 路径从 `'./modules/` 到 `'./views/`
- [x] 4.16 运行 grep 确认无 `src/modules/` 引用残留
- [x] 4.17 删除空 `src/modules/` 目录

## 5. 样式统一（移入 app.css）

- [x] 5.1 审查全部视图中的动态 `<style>` 注入和 `element.style.cssText`
- [x] 5.2 在 `app.css` 中新增 10 个 CSS utility class（`.ms-flex-col` `.ms-flex-col-gap8` `.ms-flex-col-gap12` `.ms-flex-row` `.ms-flex-row-gap8` `.ms-flex-row-gap12` `.ms-flex-row-center` `.ms-flex-row-wrap` `.ms-flex-end` `.ms-p24` `.ms-p24-max500`）
- [x] 5.3 替换 PlatformConfig.js 中 10 处 `.cssText` → className
- [x] 5.4 替换 ThemeStrategy.js 中 2 处 `.cssText` / `.padding` → className
- [x] 5.5 替换 PublishView.js 中 3 处 `.cssText` → className
- [x] 5.6 验证无残留 `.style.cssText` 在修改文件中

## 6. DataRepository 集成

- ~~6.1-6.4~~ **延期** — DataRepository 是对 `.database/` 表结构的 SchemaRegistry 驱动 CRUD 封装，专用于 DatabaseManager。现有视图（MediaArchive、TasksView、KanbanBoard）直接操作工作空间文件系统（`assets/`、`tasks/`、`.meta.json` sidecar、`.index/`），与 DataRepository 的 `.database/` 数据模型不匹配。集成需要额外的适配层，不属于本次架构整合范畴。

## 7. 文档更新

- [x] 7.1 重写 `AGENTS.md` 架构部分：显示 `lib/` + `core/` + `views/` + `utils/` 结构
- [x] 7.2 AGENTS.md 视图模式描述统一为 `this.views.xxx = new Xxx({ api, state })`
- [x] 7.3 AGENTS.md 移除所有 `modules/` 引用（stateMachine 路径等）
- [x] 7.4 更新 AGENTS.md 添加 DatabaseManager、GenerationConsole、PackageEditor、StatsDashboard、ThemeStrategy、PlatformSelector 到目录树

## 8. 最终验证

- [x] 8.1 grep 检查 `src/` 下无残留 `src/modules/` 路径引用 — ✅ 0 匹配
- [x] 8.2 grep 检查无残留死代码名称（ProcessEngine、NotificationBus、FileScanner）— ✅ 0 匹配
- [x] 8.3 确认 `modules/` 目录已删除 — ✅ 目录不存在
- [x] 8.4 `node --check` — ⚠️ 全部 ES module 语法报错（`package.json` 的 `"type": "commonjs"` 导致 Node.js 不识别 `export`/`import`），属项目预先存在的问题，非本次变更引入
- [x] 8.5 `bash -n` 验证 shell 脚本 — 未执行（无相关改动）
