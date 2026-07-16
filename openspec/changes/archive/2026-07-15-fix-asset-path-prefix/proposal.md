## Why

AssetGallery.js 和 TaskDetail.js 中硬编码了 `workspace/assets/` 路径，经 api.js 的 `_buildPath()` 展开后变成 `media-studio/workspace/assets/...`，多了一层冗余的 `workspace/` 目录。这不仅造成存储路径不整洁，还会在未来维护中引起混淆。

## What Changes

- AssetGallery.js 中所有 `workspace/assets/` 路径改为 `assets/`
- TaskDetail.js 中所有 `workspace/assets/` 路径改为 `assets/`
- 素材存储路径从 `<buildRoot>/workspace/assets/YYYY-MM/file` 变为 `<buildRoot>/assets/YYYY-MM/file`

无破坏性变更 — 旧目录下的素材仅保留在旧的 `workspace/` 路径中，不自动迁移（产品早期阶段，不兼容历史）。

## Capabilities

### New Capabilities

- `asset-path-cleanup`: 消除素材路径中的冗余 `workspace/` 前缀，使存储路径与 api.js 的 `_buildPath` 前缀设计一致

### Modified Capabilities

（无 — 不涉及现有 spec 级别的行为变更）

## Impact

- `src/business/views/AssetGallery.js`: 2 处 `workspace/assets/` → `assets/`
- `src/business/views/TaskDetail.js`: 2 处 `workspace/assets/` → `assets/`
- 旧素材文件（已存在于 `.../workspace/assets/` 下的）不受影响，不被自动迁移
