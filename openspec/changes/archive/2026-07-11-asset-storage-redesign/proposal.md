## Why

The current directory structure has `themes/`, `pipeline/`, `archive/` at the top level with intermixed concerns: theme configs live alongside assets, pipeline stages physically move files, archive loses theme context, and Chinese directory names cause API encoding issues. As asset volume grows, the single search index approach also becomes a bottleneck.

This change restructures the workspace into four clean layers — config, asset storage, pipeline views, and indexes — with a scalable sharded index to handle growing asset counts.

## What Changes

- **BREAKING**: Directory structure overhaul — new `configs/`, `assets/`, `pipeline/` (ref-based), `archive/` (theme-grouped), `.index/` (sharded)
- **BREAKING**: `themes/`, `platforms/`, `workflows/` move under `configs/` — configuration separated from data
- **BREAKING**: Assets no longer stored in pipeline stage directories — centralized under `assets/YYYY/MM/DD/`
- **BREAKING**: Pipeline stages become `.ref` file views instead of physical file storage
- `archive/` reorganized by `{theme-id}/{YYYY}/{MM}/` — preserves theme context in archive
- Single `.index.json` replaced by layered sharded index: `pipeline.json` + monthly `assets.json` shards
- Asset naming convention: `{theme-name}__{HHmmss}__{seq}.{ext}`
- `_buildPath()` updated to support the new `assets/` and `configs/` paths
- `api.mkdir()` init creates the new directory structure
- **BREAKING**: `_loadThemes()` now reads from `configs/themes/` instead of `themes/`
- **All 8 view modules**: `tree()`, `read()`, `write()` call paths updated to reflect new directory layout

## Capabilities

### New Capabilities
- `config-restructure`: Centralize all configurations (themes, platforms, workflows) under `configs/`, separating them from asset data. Theme directories use user-provided names (Chinese/English), with `configs/themes/{name}/meta.json` for metadata.
- `asset-storage`: Centralized asset pool under `assets/YYYY/MM/DD/` with naming convention `{theme}__{time}__{seq}.{ext}`. Sidecar `.meta.json` stays co-located. Assets never move after creation.
- `pipeline-ref`: Pipeline stages become lightweight `.ref` directories containing JSON reference files that point to assets in `assets/`. Stage transitions add/remove `.ref` files instead of moving the actual asset files.
- `sharded-index`: Replace single `.index.json` with a layered approach: `pipeline.json` for current pipeline state (small, fast), and monthly shards `{YYYY}/{MM}/assets.json` for historical search. Manifest file tracks available shards.

### Modified Capabilities
<!-- No existing specs to modify — new codebase -->

## Impact

- **`src/modules/api.js`**: `_buildPath()` updated; new methods for ref-based pipeline operations; index shard read/write
- **`src/app.js`**: `DIRS_TO_CREATE` updated to new structure; `_renderInitView()` updated tutorial paths
- **`src/modules/ThemeStrategy.js`**: Reads theme config from `configs/themes/{name}/`; creation writes to new path
- **`src/modules/components/ThemeSelector.js`**: Reads from `configs/themes/`
- **`src/modules/components/PlatformSelector.js`**: Reads from `configs/platforms/`
- **`src/modules/GenerationConsole.js`**: Reads workflows from `configs/workflows/`
- **`src/modules/KanbanBoard.js`**: Reads pipeline from ref-based `.ref` files via new index
- **`src/modules/ReviewMode.js`**: Status changes update ref index instead of moving files
- **`src/modules/PackageEditor.js`**: Archive path references updated
- **`src/modules/CalendarView.js`**: Scheduled package paths updated
- **`src/modules/StatsDashboard.js`**: Archive walking paths updated
- **`src/modules/MediaArchive.js`**: `currentPath` updated to `assets/`; browse logic updated
- **`src/modules/utils/search.js`**: Index paths updated to `.index/`; shard-aware search
- **`src/modules/utils/meta.js`**: Status change logic uses ref-based pipeline update
- **`hermes-webui-media-studio-design.md`**: Complete rewrite of §3.2 Directory Structure
