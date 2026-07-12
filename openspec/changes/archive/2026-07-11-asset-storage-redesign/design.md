## Context

The Media Studio extension currently uses a flat directory structure where:

- `themes/` contains both config files (theme.json) and will eventually hold generated content
- `pipeline/` stages physically store asset files, causing path changes on every status transition
- `archive/` organizes by date only (YYYY/MM), losing theme grouping
- A single `.media-studio/index.json` handles both pipeline state and search — doesn't scale
- `_buildPath()` hardcodes `media-studio/` prefix, making path management rigid
- Chinese theme names used as directory names cause URL encoding issues with Hermes WebUI API

**Current structure:**
```
media-studio/
├── themes/手机壁纸/theme.json
├── pipeline/01-generating/ (mixed assets from all themes)
├── archive/2026/07/ (date-only, no theme context)
└── .media-studio/index.json (monolithic)
```

The redesign separates concerns into four clean layers, centralizes asset storage, and introduces a scalable indexing strategy.

## Goals / Non-Goals

**Goals:**
- Separate configuration from data — `configs/` for configs, `assets/` for generated files
- Assets stored once, never moved — pipeline stages use `.ref` reference files
- Archive organized by theme + date for intuitive browsing
- Layered index system that scales (pipeline state small/fast, history sharded by month)
- Asset naming convention for identification at a glance
- All 8 existing view modules continue working after path updates
- Zero server-side changes — all adaptation client-side

**Non-Goals:**
- Not migrating existing workspace data automatically (manual migration path)
- Not changing the API layer (`api.js` core methods) — only path construction
- Not changing Hermes WebUI server or its API
- Not adding full-text search engine — index remains JSON-based

## Decisions

### Decision 1: Four-layer directory architecture

**Chosen:** Config / Assets / Pipeline (ref views) / Index

```
media-studio/
├── configs/          ← Configurations (rarely changes, manually edited)
├── assets/           ← Asset pool (write-once, append-only)
├── pipeline/         ← Pipeline refs (ephemeral, high churn)
├── archive/          ← Published archive (append-only)
├── .trash/           ← Recoverable deletions
└── .index/           ← Auto-built indexes (regenerable)
```

**Rationale:** Each layer has different access patterns and performance characteristics. Separating them allows independent optimization.

### Decision 2: `.ref` files instead of physical moves for pipeline

**Chosen:** When an asset transitions between pipeline stages (`generating → pending-review → approved → scheduled → published`), the system writes/removes a lightweight `.ref` JSON file in the target/source stage directory instead of moving the actual asset file.

`.ref` file content:
```json
{ "asset": "assets/2026/07/11/手机壁纸__143022__001.png" }
```

**Rationale:** Assets never change path, so `.meta.json` sidecar references remain valid. Multiple pipeline stages can reference the same asset (useful for cross-stage queries). No file I/O overhead for large media files.

**Alternative considered (rejected):** Move files between pipeline stages. This works but invalidates any cached/absolute paths and makes cross-stage analysis harder.

### Decision 3: Sharded index by month

**Chosen:** Two-tier index system:
- `.index/pipeline.json` — Current pipeline state (generating/pending-review/approved/scheduled). Constrained to active assets (~1000 entries max). Read/written frequently.
- `.index/{YYYY}/{MM}/assets.json` — Historical assets, sharded by publish month. Read-only after month closes. Contains full metadata for search.
- `.index/manifest.json` — Lists available shards for discovery.

**Rationale:** Pipeline operations (the most frequent) only touch a small JSON file. Historical search fans out across monthly shards in parallel. No single file grows unbounded.

### Decision 4: Asset naming convention

**Chosen:** `{theme-name}__{HHmmss}__{seq}.{ext}`

Examples: `手机壁纸__143022__001.png`, `phone-wallpaper__143022__002.jpg`

**Rationale:** Human-readable at a glance. Theme prefix enables easy filtering. Timestamp prevents collisions. Sequence number supports batch generation.

### Decision 5: Theme directory names follow user input

**Chosen:** Whatever the user enters (Chinese, English, mixed) becomes the directory name under `configs/themes/{name}/`. The `theme.json` has a `slug` field for ASCII-safe identifier if needed.

**Rationale:** User preference (confirmed in discussion). The API layer `_buildPath()` must handle `encodeURIComponent` correctly for non-ASCII paths.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 🟡 **Migration pain** — Existing workspace has data in old structure | Provide a migration script; or user can start fresh with new workspace init |
| 🟢 **Ref file sync** — If `.ref` and `.meta.json` status get out of sync | Treat `.index/pipeline.json` as source of truth; `.ref` files are secondary views |
| 🟡 **Chinese paths in API** — Hermes WebUI may mishandle non-ASCII URLs | `encodeURIComponent` on all path segments; test with Chinese theme names |
| 🟢 **Index staleness** — Shards may not reflect recent renames/deletions | Rebuild index on demand; shards are append-only with tombstone markers |
| 🟢 **Performance** — 10 shards × 1MB each in parallel search | Browser can fetch 10 small JSONs in parallel; add client-side caching with ETag |
