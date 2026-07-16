## Why

旧架构迁移到 DataRepository+Schema 体系后，api.js 中的历史业务方法和一批旧目录/脚本/样式已经成为死代码。它们会造成代码阅读时的认知负担，在探索和调试中不断产生误导，因此需要全面清理。

## What Changes

- **api.js** 删除 16 个零引用的旧业务方法（管道索引 8 个 + 任务管理 8 个）
- **空目录清理**：删除 `workspace/pipeline/`、`.media-studio/`、`.trash/`、`archive/`
- **僵尸 CSS**：删除 `src/business/app.css` 中的 Dashboard 死样式
- **过期脚本**：删除 `src/scripts/migrate-v2.sh`
- **未引用代码**：删除 `src/business/agent/`（BriefBuilder/ResultParser/AgentHandler 在 `creation-module-redesign` 中已创建但未被任何模块引用）
- **过期文档**：删除 `src/README.md`
- **搜索索引**：删除 `src/framework/utils/search.js`

以上均为安全删除——所有代码在本次变更前已通过 5 路平行探索确认零引用。

## Capabilities

### New Capabilities
- `dead-code-cleanup`: 删除 api.js 中的零引用死代码（管道索引 8 个 + 任务管理 8 个）
- `directory-cleanup`: 删除空目录和过期脚本
- `css-style-cleanup`: 删除僵尸 CSS
- `unreferenced-module-cleanup`: 删除未引用的模块文件

### Modified Capabilities
<!-- 无 spec 级行为变更，均为实现层面的删除 -->

## Impact

- `src/framework/lib/api.js` — 减少 ~200 行，保留平台/文案方法（仍被 PublishView/PlatformConfig 使用）
- `src/business/app.css` — 减少 ~34 行僵尸 CSS
- `workspace/*` — 清理空目录
- `src/business/agent/` 4 个文件 — 完全删除（在 creation-module-redesign 中创建但至今未被引用）
- 无运行时行为变化，无 API 接口变化，无用户可见变化
