## 1. api.js 死代码清理

- [x] 1.1 删除 `loadKanbanData()` ~ `searchContent()` 管道索引方法（约第333-566行）
- [x] 1.2 删除 `_buildTaskPath()` ~ `readTaskBrief()` 任务管理方法（约第611-721行）
- [x] 1.3 删除残留的旧 import（`_kanbanIndex`、`_pipelineIndex` 等已无引用的实例字段）
- [x] 1.4 JS 语法验证：`find src -name "*.js" -exec node --check --input-type=module {} \;`

## 2. 目录与脚本清理

- [x] 2.1 删除空目录：`workspace/pipeline/`、`workspace/.media-studio/`、`workspace/.trash/`、`workspace/archive/`（含 .gitkeep）
- [x] 2.2 删除过期迁移脚本：`src/scripts/migrate-v2.sh`

## 3. CSS 僵尸样式清理

- [x] 3.1 删除 `src/business/app.css` 中 `.ms-dashboard` 整段样式（约第663-683行）及媒体查询中的 `.ms-dashboard-overview`
- [x] 3.2 确认无视图引用被删除的 CSS 类名

## 4. 未引用模块清理

- [x] 4.1 删除 `src/business/agent/` 目录（4 个文件，均零引用）
- [x] 4.2 删除 `src/README.md`（过期文档）
- [x] 4.3 删除 `src/framework/utils/search.js`（零引用工具函数）
- [x] 4.4 最终验证：JS 语法检查 + 文件状态确认
