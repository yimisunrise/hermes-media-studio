## 1. Project Scaffold & Workspace Foundation

- [x] 1.1 Create extension source directory structure (`src/`, `src/modules/`, `src/modules/components/`, `src/modules/utils/`)
- [x] 1.2 Create `app.js` entry point with router initialization, API client bootstrap, and nav bar rendering
- [x] 1.3 Create `app.css` with CSS variables, `ms-` prefixed class names, and responsive layout grid
- [x] 1.4 Implement `modules/api.js` with Workspace API endpoint detection (probe strategy) and basic CRUD methods (tree, read, write, mkdir, delete, rename)
- [x] 1.5 Implement `modules/state.js` with global state object and event-based view update notification
- [x] 1.6 Implement `modules/router.js` with hash-based routing (`#kanban`, `#review`, `#calendar`, `#dashboard`, `#package-editor`)
- [x] 1.7 Implement `modules/utils/meta.js` for `.meta.json` read/write and `changeStatus()` with status history tracking
- [x] 1.8 Implement `modules/utils/dom.js` with DOM helpers (create element, render template, show/hide, debounce)
- [x] 1.9 Implement `modules/utils/format.js` for date formatting, number formatting, file size display
- [x] 1.10 Implement `modules/utils/search.js` for building and querying `.media-studio/index.json` search index
- [x] 1.11 Implement pipeline data aggregation in `api.js` (`loadKanbanData()`) with theme/date filtering support
- [x] 1.12 Create `install.sh` script that creates Workspace directory structure and outputs env config hints
- [x] 1.13 Create `uninstall.sh` script that removes extension files and cleans env config

## 2. Kanban Board View

- [x] 2.1 Implement `modules/components/ThemeSelector.js` with multi-select dropdown, reading themes from `themes/` directory
- [x] 2.2 Implement `modules/components/MediaCard.js` with thumbnail rendering, theme badge, generation param summary, and hover preview overlay
- [x] 2.3 Implement `modules/KanbanBoard.js` with four-column layout, column count badges, and theme/date filtering integration
- [x] 2.4 Add drag-and-drop support for moving cards between columns, triggering `changeStatus()` on drop
- [x] 2.5 Add date range filter (today/this week/this month/custom) to Kanban toolbar
- [x] 2.6 Add global search input to Kanban toolbar with keyword-based asset filtering
- [x] 2.7 Add "批量生成" and "新建发布包" action buttons to Kanban toolbar

## 3. Review Mode

- [x] 3.1 Implement `modules/ReviewMode.js` with full-screen grid layout of pending-review assets
- [x] 3.2 Implement keyboard shortcut system: `1`=approve, `2`=delete, `3`=defer, `4`=star, `5`=note, arrow keys=select, Enter=full preview, Esc=exit
- [x] 3.3 Implement card selection with checkboxes and bulk action bar (批量通过, 批量删除, 批量标星, 批量加入排期)
- [x] 3.4 Implement `modules/components/MediaDetail.js` full-screen modal with image, all generation params, status history, publish history
- [x] 3.5 Implement similar asset grouping (same workflow + seed base shown as variant group)
- [x] 3.6 Add theme filter and count display ("12 张待审核") in review mode header

## 4. Publish Package Editor

- [x] 4.1 Implement `modules/components/PlatformSelector.js` reading platform configs from `platforms/` directory
- [x] 4.2 Implement `modules/PackageEditor.js` with full form: platform/theme selection, date/time picker, title/subtitle, asset selection, body editor, tags
- [x] 4.3 Implement selected asset grid with cover image assignment in the editor
- [x] 4.4 Implement Markdown + YAML Frontmatter package file generation and write to `pipeline/04-scheduled/<date>/`
- [x] 4.5 Implement linked_copy update on each selected asset's `.meta.json` when package is saved
- [x] 4.6 Implement platform template application (title length limits, image count rules, tag suggestions)
- [x] 4.7 Add "AI 生成文案" placeholder button for future Agent integration
- [x] 4.8 Add "应用模板" button that auto-fills body based on platform template

## 5. Publish Calendar

- [x] 5.1 Implement `modules/CalendarView.js` with monthly calendar grid reading `pipeline/04-scheduled/` and `05-published/`
- [x] 5.2 Add week view toggle with 7-column time-slot layout
- [x] 5.3 Implement drag-and-drop rescheduling: drag package to new date updates both file path and `scheduled_at`
- [x] 5.4 Implement "标记已发布" workflow: URL prompt → update Frontmatter → move to `05-published/` → update asset `publish_history`
- [x] 5.5 Implement visual distinction between scheduled (pending) and published (done) packages

## 6. Generation Console

- [x] 6.1 Implement `modules/GenerationConsole.js` with workflow file list from `workflows/` directory
- [x] 6.2 Implement workflow parameter preview (model, resolution, sampler, steps, CFG, prompt)
- [x] 6.3 Implement batch generation dialog: workflow selector, theme selector, quantity input, variant strategy
- [x] 6.4 Implement generation job placeholder creation in `pipeline/01-generating/` with status `"generating"`
- [x] 6.5 Implement progress display in Kanban "生成中" column with cancel capability
- [x] 6.6 Implement auto-metadata injection stub for generation completion callback

## 7. Data Dashboard

- [x] 7.1 Implement `modules/StatsDashboard.js` with aggregate stats computation across all assets with publish_history
- [x] 7.2 Implement theme performance comparison bars (publish count, avg views, viral count)
- [x] 7.3 Implement top 5 viral assets display with thumbnail, stats, and "复刻" action
- [x] 7.4 Implement viral asset replication modal showing generation params and "生成同参数变体" button
- [x] 7.5 Implement publish history timeline sorted by date descending
- [x] 7.6 Implement manual data entry form for post-publish stats (views, likes, comments, shares)
- [x] 7.7 Add time range selector (7天/30天/90天/全部) for all dashboard metrics

## 8. Theme Strategy Center

- [x] 8.1 Implement `modules/ThemeStrategy.js` with theme CRUD (list, create, edit)
- [x] 8.2 Implement theme configuration form for `theme.json` fields: style, generation defaults, publishing config, performance
- [x] 8.3 Implement multi-theme comparison table with key metrics side-by-side
- [x] 8.4 Implement inventory warning system (low stock alert when <5 approved assets)
- [x] 8.5 Implement prompt template editor for `themes/<name>/prompt-template.md`

## 9. Media Archive

- [x] 9.1 Implement `modules/MediaArchive.js` with `archive/YYYY/MM/` directory browser
- [x] 9.2 Implement global search with keyword, theme, tag, and date range filters
- [x] 9.3 Implement asset detail view showing linked copies ("使用记录") per asset
- [x] 9.4 Implement trash recovery mechanism with `.trash/` directory and 30-day retention display

## 10. Extension Packaging

- [x] 10.1 Create `README.md` with installation instructions, screenshots, and env config guide
- [x] 10.2 Create `update.sh` script for git-pull based updates
- [x] 10.3 Add environment variable configuration output to install script
- [x] 10.4 Verify CSS isolation (`ms-` prefix) across all modules with no WebUI style leaks
