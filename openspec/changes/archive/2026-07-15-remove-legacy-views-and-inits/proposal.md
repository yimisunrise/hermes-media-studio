## Why

创作模块已完成 DataRepository 迁移和重写，但 5 个旧视图（publish/archive/copywriting/calendar/platforms）、3 个旧菜单组（publishing/resources/operations）、2 个旧 init-def（workspace/configs）以及 api.js 中的平台/文案业务方法仍然存在于 manifest 和代码中。它们指向已废弃的 file-based API，持续造成混淆。

## What Changes

- **删除 5 个遗留视图文件**：PublishView.js / MediaArchive.js / CopywritingView.js / CalendarView.js / PlatformConfig.js
- **删除 3 个菜单组**：publishing / resources / operations
- **删除 2 个 init-def**：workspace（创建旧目录结构）/ configs（写入过期配置）
- **修改 schema-registry.init-def**：`dependsOn` 从 `['workspace']` 改为 `['orchestrator-core']`
- **清理 api.js 残余业务方法**：listPlatforms / createPlatform / updatePlatform / listCopywritings / getCopywriting
- **清理安装脚本**：`src/scripts/install.sh` 移除旧目录创建逻辑
- **删除组件文件**：MediaCard.js / MediaDetail.js（仅被 MediaArchive 引用）

## Capabilities

### New Capabilities
（无新功能）

### Modified Capabilities
（无 spec 级别的行为变更——纯删除遗留代码）

## Impact

- **BREAKING**: manifest.js views/menus/inits 各减少约一半条目
- manifest.js 从 12 views / 6 menus / 5 inits 缩减为 7 views / 3 menus / 3 inits
- api.js 再减少约 50 行（平台/文案方法）
- install.sh 简化
- 无功能影响——遗留视图已被所有用户界面入口移除
