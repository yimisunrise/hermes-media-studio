## Context

旧架构迁移之后，遗留了多类死代码：api.js 中的旧业务方法、空目录、僵尸 CSS、过期脚本，以及 `creation-module-redesign` 中创建后未被引用的 agent 模块。这些代码已被 5 路平行探索确认零引用，可以安全删除。

## Goals / Non-Goals

**Goals:**
- 删除 api.js 中所有零引用的旧文件 API 业务方法
- 删除空目录和过期 shell 脚本
- 删除僵尸 CSS 样式
- 删除未引用的模块代码
- 删除过期文档
- 删除搜索索引工具（search.js 零引用）

**Non-Goals:**
- 不迁移遗留视图（PublishView/PlatformConfig/CopywritingView/CalendarView 等仍使用旧 API 的文件操作）
- 不修改 api.js 中平台/文案相关方法（仍被上述视图使用）
- 不重构任何业务逻辑
- 不涉及浏览器端行为变化

## Decisions

| 决策 | 选择 | 理由 |
|---|---|---|
| api.js 删除方式 | 按方法块整块删除 | 16 个方法已确认零引用，整块删除更清晰 |
| 空目录处理 | 删除整个目录 | 仅含 .gitkeep，无业务数据 |
| agent/ 模块 | 删除整个目录 | 4 个文件均零引用，且未被 manifest.js 注册 |
| search.js | 删除整个文件 | 零引用，框架也未引用 |
| 过期文档 | 删除 | 内容完全过期（描述不存在的 modules/ 架构） |

## Risks / Trade-offs

- **误删风险极低**：所有删除项已通过 5 路平行 explore agent + grep 双重复核零引用
- **api.js 留空行**：删除方法块后保留空行注释标记，便于后续阅读
