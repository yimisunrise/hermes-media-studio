# Hermes Media Studio

**Media asset lifecycle management extension for ComfyUI WebUI Workspace** — Kanban review pipeline, publish calendar, data dashboard, generation console, and media archive.

## Overview

Hermes Media Studio transforms your Workspace into a full-featured media production studio with seven integrated capabilities:

| Module | View | Purpose |
|--------|------|---------|
| Kanban Board | `#kanban` | Pipeline visualization (generating → review → approved → scheduled) |
| Review Mode | `#review` | Keyboard-driven bulk approval workflow |
| Package Editor | `#package-editor` | Multi-asset publish package creation with Markdown + YAML frontmatter |
| Publish Calendar | `#calendar` | Monthly/weekly view of scheduled and published packages |
| Generation Console | `#generation` | Batch generation job management |
| Data Dashboard | `#dashboard` | Performance analytics with viral detection |
| Theme Strategy | `#theme-strategy` | Theme configuration and inventory management |
| Media Archive | `#archive` | Global search and historical asset browsing |

## Requirements

- **ComfyUI WebUI** with Workspace extension (API endpoint support for `tree`, `read`, `write`, `mkdir`, `delete`, `rename`)
- Modern browser (Chrome 90+, Firefox 90+, Edge 90+)

## Installation

### 1. Deploy extension files

Place the `src/` directory contents into your Workspace root:

```
<workspace-root>/
├── app.js          # Media Studio entry point
├── app.css         # Media Studio styles
├── modules/
│   ├── api.js
│   ├── state.js
│   ├── router.js
│   ├── KanbanBoard.js
│   ├── ReviewMode.js
│   ├── PackageEditor.js
│   ├── CalendarView.js
│   ├── GenerationConsole.js
│   ├── StatsDashboard.js
│   ├── ThemeStrategy.js
│   ├── MediaArchive.js
│   ├── components/
│   │   ├── ThemeSelector.js
│   │   ├── MediaCard.js
│   │   ├── MediaDetail.js
│   │   └── PlatformSelector.js
│   └── utils/
│       ├── dom.js
│       ├── format.js
│       ├── meta.js
│       └── search.js
└── scripts/
    ├── install.sh
    ├── uninstall.sh
    └── update.sh
```

### 2. Run installer

```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

The installer will:
- Create the required directory structure (`pipeline/`, `themes/`, `platforms/`, `workflows/`, `archive/`, `.trash/`, `.media-studio/`)
- Output environment variable configuration hints

### 3. Configure environment variables

Add the following to your WebUI environment or `.env` file based on the installer output:

```
MEDIA_STUDIO_WORKSPACE_ROOT=<path-to-workspace-root>
MEDIA_STUDIO_API_BASE=http://localhost:8188/api/workspace
```

## Workspace Directory Structure

```
<workspace-root>/
├── pipeline/                  # Asset pipeline stages
│   ├── 01-generating/         # In-progress generation jobs
│   ├── 02-pending-review/     # Assets awaiting review
│   ├── 03-approved/           # Approved assets
│   ├── 04-scheduled/          # Scheduled publish packages
│   └── 05-published/          # Published packages
├── themes/                    # Theme configurations
│   └── <theme-name>/
│       ├── theme.json         # Theme parameters
│       └── prompt-template.md # Generation prompt template
├── platforms/                 # Platform publishing configs
│   └── <platform-name>.json
├── workflows/                 # Generation workflow definitions
│   └── <workflow-name>.json
├── archive/                   # Archived originals
│   └── YYYY/MM/
├── .trash/                    # Deleted assets (30-day retention)
└── .media-studio/             # Internal indexes
    └── index.json             # Search index
```

## Usage

### Asset Pipeline
1. **Generation** → assets appear in "生成中" column automatically
2. **Review** → navigate to Review Mode (`#review`), use keyboard shortcuts:
   - `1` = approve, `2` = delete, `3` = defer, `4` = star, `5` = add note
   - Arrow keys = navigate, Enter = full preview, Esc = exit
3. **Approval** → approved assets move to pipeline for publishing
4. **Scheduling** → use Package Editor to create publish packages

### Package Editor
- Select platform and theme for publishing
- Choose assets from approved pool
- Markdown body editor with YAML frontmatter
- Platform template auto-application
- "AI 生成文案" placeholder for future integration

### Dashboard
- Overview cards: published count, total views, likes, comments, shares
- Theme performance comparison bars
- Top 5 viral assets with one-click remake
- Manual data entry for post-publish stats

## Publish Package Format

Generated packages are Markdown files with YAML frontmatter:

```yaml
---
title: "Post Title"
subtitle: ""
platform: twitter
theme: fantasy
scheduled_at: "2025-01-15T10:00:00+08:00"
status: scheduled
published_url: ""
tags:
  - tag1
  - tag2
assets:
  - path: archive/2025/01/asset1.png
  - path: archive/2025/01/asset2.png
cover: archive/2025/01/asset1.png
template: standard
---

Post body content in Markdown...
```

## Development

```bash
# Verify syntax
find src -name "*.js" -exec node --check {} \;

# Verify shell scripts
bash -n scripts/install.sh
bash -n scripts/uninstall.sh
bash -n scripts/update.sh
```

## Uninstall

```bash
./scripts/uninstall.sh
```

This removes extension files and cleans environment configuration.

## License

Internal tool — Hermes Media Studio
