# 遗留代码清理规格

## 删除清单

### 视图文件
- `src/business/views/PublishView.js` — 内容发布管理（旧 file-based API）
- `src/business/views/MediaArchive.js` — 媒体档案库（旧 file-based API）
- `src/business/views/CopywritingView.js` — 文案管理（旧 file-based API）
- `src/business/views/CalendarView.js` — 内容日历（旧 file-based API）
- `src/business/views/PlatformConfig.js` — 平台配置（旧 file-based API）

### 组件文件
- `src/business/views/components/MediaCard.js` — 仅被 MediaArchive 引用
- `src/business/views/components/MediaDetail.js` — 仅被 MediaArchive 引用

### 菜单组
- `publishing` — 仅含 PublishView
- `resources` — 含 MediaArchive / CopywritingView / CalendarView
- `operations` — 仅含 PlatformConfig

### init-defs
- `workspace.init-def.js` — 创建废弃目录（.index/ tasks/ copywriting/ .trash/ 等）
- `configs.init-def.js` — 写入过期的 task-lifecycle.json

### api.js 方法
- `listPlatforms()` / `createPlatform()` / `updatePlatform()` — 仅被删除视图使用
- `listCopywritings()` / `getCopywriting()` — 仅被删除视图使用

### install.sh 目录创建
- 移除 `.index/`、`tasks/`、`copywriting/`、`pipeline/`、`.trash/`、`archive/` 目录创建逻辑

## 修改文件

- `src/business/manifest.js` — 从 views/menus/inits 数组中移除条目
- `src/framework/lib/api.js` — 删除 Platform/Copywriting 业务方法
- `src/scripts/install.sh` — 移除旧目录创建逻辑
- `src/business/init/SchemaRegistry.init-def.js` — `dependsOn` 改为 `['orchestrator-core']`

## 删除文件

- `src/business/views/PublishView.js`
- `src/business/views/MediaArchive.js`
- `src/business/views/CopywritingView.js`
- `src/business/views/CalendarView.js`
- `src/business/views/PlatformConfig.js`
- `src/business/views/components/MediaCard.js`
- `src/business/views/components/MediaDetail.js`
- `src/business/init/workspace.init-def.js`
- `src/business/init/configs.init-def.js`
