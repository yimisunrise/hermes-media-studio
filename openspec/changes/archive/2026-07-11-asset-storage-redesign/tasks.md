## 1. API Layer — Path Restructure

- [x] 1.1 Update `_buildPath()` in `api.js` to support new directory layout — add `assets/` prefix for asset paths, `configs/` for config paths
- [x] 1.2 Add `_buildAssetPath(theme, ext)` method for generating asset storage paths with naming convention `{theme}__{HHmmss}__{seq}.{ext}`
- [x] 1.3 Add `_buildConfigPath(type, name)` method for config paths (`configs/themes/{name}/`, `configs/platforms/{name}.json`, `configs/workflows/{name}.json`)
- [x] 1.4 Update `loadKanbanData()` to read from `.index/pipeline.json` instead of scanning pipeline directories directly
- [x] 1.5 Update `_walkArchive()` to use new archive path: `archive/{theme}/{YYYY}/{MM}/`
- [x] 1.6 Update `loadDashboardStats()` to walk new archive layout
- [x] 1.7 Update `checkInitialized()` to check new structure (`configs/themes/` instead of old `themes/`)
- [x] 1.8 Add `writePipelineRef(stage, assetPath)` method — creates `.ref` file in pipeline stage
- [x] 1.9 Add `removePipelineRef(stage, assetPath)` method — removes `.ref` file from pipeline stage
- [x] 1.10 Add `readPipelineRefs(stage)` method — reads all `.ref` files from a pipeline stage and resolves asset paths
- [x] 1.11 Add index methods: `readPipelineIndex()`, `writePipelineIndex()`, `readShard(year, month)`, `writeShard(year, month, data)`
- [x] 1.12 Add `readIndexManifest()`, `writeIndexManifest()` for `.index/manifest.json`

## 2. Workspace Initialization — New Directory Structure

- [x] 2.1 Update `DIRS_TO_CREATE` in `app.js` with new directory layout:
  - `configs/themes/`, `configs/platforms/`, `configs/workflows/`
  - `assets/`
  - `pipeline/01-generating` through `pipeline/05-published`
  - `archive/`
  - `.trash/`
  - `.index/`
- [x] 2.2 Update `_renderInitView()` tutorial text and directory list to reflect new four-layer structure
- [x] 2.3 Update `_createWorkspaceDirectories()` to create all new directories in correct order (configs → assets → pipeline → archive → .trash → .index)
- [x] 2.4 Update `checkInitialized()` in `api.js` — change probe from old `pipeline/01-generating` to new root structure (e.g., probe `configs/themes/` OR check `.index/manifest.json` exists)
- [x] 2.5 Add migration detection: if old structure exists (`themes/` or old `pipeline/` at top level) but new `.index/` doesn't, show "检测到旧版本目录结构，是否迁移？" prompt
- [x] 2.6 Update `probe()` logic — after API connectivity check, verify at least one key directory exists from the new structure before marking initialized
- [x] 2.7 Add `createInitialManifest()` — after successful init, write initial `.index/manifest.json` with empty shard list and version info

## 3. Config Layer — Theme Strategy Migration

- [x] 3.1 Update `ThemeStrategy._loadThemes()` — read from `configs/themes/` instead of old `themes/`
- [x] 3.2 Update `ThemeStrategy._openThemeEditor()` — create new themes at `configs/themes/{name}/`
- [x] 3.3 Update `ThemeStrategy._openPromptTemplate()` — read/write templates at `configs/themes/{name}/prompt-template.md`
- [x] 3.4 Update `ThemeSelector.load()` — list themes from `configs/themes/`
- [x] 3.5 Update `PlatformSelector` — read from `configs/platforms/`
- [x] 3.6 Update `GenerationConsole` — read workflows from `configs/workflows/`

## 4. Asset Storage — Write Path Migration

- [x] 4.1 Update `KanbanBoard` — verified: reads via `loadKanbanData()` which already uses API's updated pipeline index
- [x] 4.2 Update `ReviewMode` — verified: status changes go through `changeStatus()` in meta.js, no direct file moves
- [x] 4.3 Update `ReviewMode` — asset paths in review grid already reference API-returned paths, works with `assets/`
- [x] 4.4 Update `MediaCard` component — asset thumbnails already reference API-returned paths
- [x] 4.5 Update `MediaDetail` component — detail view already reads from API-returned paths
- [x] 4.6 Update `PackageEditor` — publish package asset references already use API-returned paths
- [x] 4.7 Update `CalendarView` — scheduled packages already reference assets via API paths
- [x] 4.8 Update `StatsDashboard` — stats aggregation uses `loadDashboardStats()` which already uses updated API

## 5. Archive Restructure

- [x] 5.1 Update `MediaArchive` — `currentPath` changed from `'archive'` to `'assets'` for browsing
- [x] 5.2 Update `MediaArchive._browseArchive()` — browse `assets/{YYYY}/{MM}/{DD}/` instead of old `archive/`
- [x] 5.3 Update archive copy-on-publish logic — copy from `assets/` to `archive/{theme}/{YYYY}/{MM}/`
- [x] 5.4 Update `MediaArchive._browseTrash()` — trash path unchanged (still `.trash/`)

## 6. Search & Index Migration

- [x] 6.1 Update `search.js` — `INDEX_PATH` changed to `.index/`; `buildSearchIndex()` writes to shards
- [x] 6.2 Update `buildSearchIndex()` — read from new asset paths, group by YYYY/MM, write monthly shards
- [x] 6.3 Update `loadSearchIndex()` — read manifest, load all shards in parallel via Promise.all, merge
- [x] 6.4 Add shard discovery logic — read manifest, determine which shards to query
- [x] 6.5 Add parallel shard query — fetch multiple shards concurrently and merge results

## 7. Design Document Update

- [x] 7.1 Rewrite §3.2 Directory Structure with new four-layer design
- [x] 7.2 Update §3.4 状态流转 to reflect ref-based pipeline (.ref files instead of symlinks)
- [x] 7.3 Update §5.2 核心模块 to reflect new file paths and sharded search
- [x] 7.4 Add index sharding strategy to appropriate section (included in §3.2 directory tree comments)

## 8. Verification

- [x] 8.1 Verify syntax clean on all changed JS files — 9/9 pass
- [x] 8.2 Verify init creates correct new directory structure — runtime test passed ✓
- [x] 8.3 Verify theme creation writes to `configs/themes/{name}/` — runtime test passed ✓
- [x] 8.4 Verify platform configs read from `configs/platforms/` — runtime test passed ✓
- [x] 8.5 Verify workflow configs read from `configs/workflows/` — runtime test passed ✓
- [x] 8.6 Verify asset generation writes to `assets/YYYY/MM/DD/` with correct naming convention — runtime test passed ✓
- [x] 8.7 Verify pipeline stage transitions create/remove `.ref` files correctly — runtime test passed ✓
- [x] 8.8 Verify `.index/pipeline.json` reflects current pipeline state — runtime test passed ✓
- [x] 8.9 Verify archive publishes copy assets to `archive/{theme}/{YYYY}/{MM}/` — runtime test passed ✓
- [x] 8.10 Verify search works across shards — runtime test passed ✓
- [x] 8.11 Verify all 8 views load and render correctly with new paths — runtime test passed ✓
