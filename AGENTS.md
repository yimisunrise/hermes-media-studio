# Hermes Media Studio — Agents Guide

## 这是什么

注入到 **Hermes WebUI** 的纯前端扩展，管理媒体素材生产流水线（生成 → 审核 → 排期 → 发布）。无构建步骤、无框架、无 npm 依赖。

## 快速上手

```bash
# 开发：检查 JS 语法（唯一可用的验证方式）
find src -name "*.js" -exec node --check {} \;

# 验证 shell 脚本
bash -n src/scripts/install.sh
```

无测试套件、无类型检查、无 linter 配置。无 CI。

## 架构

```
src/
├── app.js              # 入口：启动 → 探测 API → 检测工作空间 → 初始化模块
├── app.css             # 全部样式（ms-* 命名空间）
├── modules/
│   ├── api.js          # WorkspaceAPI — 通过 WebUI 端点进行文件 CRUD
│   ├── state.js        # AppState — 内存事件发射器（SSOT 是工作空间文件）
│   ├── router.js       # 基于 hash 的路由（#kanban, #review 等）
│   ├── sidebar.js      # 注入 Rail 按钮 + 切换宿主面板
│   ├── KanbanBoard.js
│   ├── ReviewMode.js
│   ├── PackageEditor.js
│   ├── CalendarView.js
│   ├── StatsDashboard.js
│   ├── GenerationConsole.js
│   ├── ThemeStrategy.js
│   ├── MediaArchive.js
│   ├── components/
│   │   ├── MediaCard.js
│   │   ├── MediaDetail.js
│   │   ├── ThemeSelector.js
│   │   └── PlatformSelector.js
│   └── utils/
│       ├── dom.js       # createElement, debounce, throttle, empty 等
│       ├── format.js    # 日期、数字、文件大小、slug 格式化
│       ├── meta.js      # .meta.json sidecar 读写/状态变更
│       └── search.js    # 通过 .index/ 分片实现索引搜索
├── assets/logo.svg
└── scripts/
    ├── install.sh       # 通过 mkdir -p 创建工作空间目录
    ├── uninstall.sh     # rm -rf 工作空间（需确认）
    └── update.sh        # git pull
```

**关键约束：** 扩展**注入**到 WebUI 页面中运行——共享全局 `S` 对象和同一 DOM。不得破坏宿主应用。

## 关键约定

### 命名空间隔离
- CSS 类名：以 `ms-` 为前缀（如 `ms-kanban`、`ms-media-card`）
- DOM ID：以 `media-studio-` 为前缀（如 `media-studio-app`、`media-studio-view-container`）
- 切勿使用可能与 WebUI 冲突的裸 CSS 类名或短 ID

### 模块模式
每个视图模块都是一个类，通过构造函数接收 `{ api, state }`：
```js
this.modules.kanban = new KanbanBoard({ api: this.api, state: this.state });
```
每个模块实现 `render(container, params)`——当路由激活对应 hash 时由路由器调用。`render()` 必须支持多次调用（先清空容器再渲染）。

### API 客户端（`WorkspaceAPI`）
- 所有操作都是**工作空间相对路径**，解析到 `media-studio/<relPath>`
- 每次请求都携带 `S.session.session_id` 作为 `session_id`
- 端点硬编码（无运行时探测）：
  - GET：`/api/list`、`/api/file`
  - POST：`/api/file/save`、`/api/file/create`、`/api/file/create-dir`、`/api/file/delete`、`/api/file/rename`、`/api/file/move`
- 写入操作：先尝试 `save`（覆盖），404 则回退到 `create`（新建文件）
- `readJSON`/`writeJSON` 用于操作 `.meta.json` 和 `.index/` 文件
- `loadKanbanData()` 读取 `.index/pipeline.json`；回退：遍历 pipeline/ 目录
- `_walkArchive()` 先从 `configs/themes/` 发现主题，再遍历 `archive/<theme>/YYYY/MM/`

### 状态管理（`AppState`）
- 内存事件发射器，提供 `set(key, value)`、`get(key)`、`on(event, callback)`
- SSOT 是工作空间文件系统——状态只是渲染缓存
- 同时发射键特定事件和通配符 `*` 事件
- 便捷方法：`setFilter()`、`setAssets()`、`toggleAssetSelection()`

### 路由器
- 基于 hash：`#kanban`、`#review`、`#package-editor`、`#calendar`、`#dashboard`、`#generation`、`#themes`、`#archive`、`#init`
- 路由器注册视图函数；每个函数接收从 hash `#view/param1/param2` 解析的参数

### 侧边栏集成
- 在 WebUI 的 `.rail` 导航中注入一个按钮 + 分隔线
- 激活时：隐藏宿主侧边栏、隐藏宿主 main 子元素、显示 `#media-studio-app`
- 停用时：恢复所有内容、清除 hash
- 必须幂等——防止重复注入

### 工作空间目录结构（位于 `<workspace>/media-studio/` 下）
```
configs/themes/<name>/theme.json + prompt-template.md
configs/platforms/<name>.json
configs/workflows/<name>.json
assets/YYYY/MM/DD/<theme>__HHmmss__<seq>.ext (+ .meta.json sidecar)
pipeline/{01-generating,02-pending-review,03-approved,04-scheduled,05-published}/*.ref
archive/<theme>/YYYY/MM/
.trash/
.index/manifest.json + pipeline.json + YYYY/MM/assets.json
```

### 元数据（`.meta.json` sidecar）
每个素材有一个 sidecar 文件，记录状态、生成参数、审核数据、发布历史：
```json
{ "id": "uuid", "theme": "...", "workflow": "...", "generation": { "seed": 42, "prompt": "...", ... },
  "status": "approved", "status_history": [...], "review": { "rating": 4, "note": "...", "tags": [...] },
  "linked_copy": [...], "publish_history": [...], "is_starred": false }
```
- `changeStatus(api, path, newStatus, note)` 更新 meta 并同步流水线索引
- 物理文件从不移动——状态仅记录在 meta 中
- 流水线阶段通过 `.ref` 文件和 `.index/pipeline.json` 追踪

## 重要注意事项

- **全部交流使用中文**：任何回答、注释、代码评审、PR 描述等一律用中文，包括本文件的指令语言
- **无构建步骤**：浏览器直接加载扩展文件，模块导入必须兼容原生 ES 模块加载
- **会话可用性**：异步 WebUI 启动期间 `S.session` 可能为 null。扩展最多轮询 8 秒，必要时通过 `POST /api/session/new` 创建独立会话
- **`.index/manifest.json`** 是规范初始化标记——`checkInitialized()` 探测此文件
- **CSS 变量**：扩展使用 `var(--bg, #1a1a2e)` 模式继承 WebUI 主题令牌，并提供深色回退值
- **全部 UI 文本为中文**（标签、注释、消息）——保持此约定
- **拖放**：看板列使用原生 HTML5 拖放进行状态变更
- **内联 SVG 图标**：UI 图标中不使用 emoji——在 `app.js` 的 `ICONS` 对象中定义为 SVG 字符串
- **安全性**：扩展以完整 WebUI 会话权限运行。宿主的皮肤值清理机制会阻止 CSS 注入

## OpenSpec 工作流

本项目使用 `openspec` 管理变更：
- `.opencode/skills/openspec-*` — propose/explore/apply/archive 技能文件
- `openspec/config.yaml` — schema：`spec-driven`
- `openspec/changes/` — 每个变更包含 `design.md`、`proposal.md`、`tasks.md`、`specs/`
- 打开变更：`/openspec-propose` → `/openspec-apply-change` → `/openspec-archive-change`

## 命令参考

| 操作 | 命令 |
|------|------|
| JS 语法检查 | `find src -name "*.js" -exec node --check {} \;` |
| Shell 语法检查 | `bash -n src/scripts/install.sh` |
| 初始化工作空间 | `src/scripts/install.sh` |
| 卸载 | `src/scripts/uninstall.sh`（需确认，有破坏性） |
| 更新 | `src/scripts/update.sh`（git pull） |
| 运行时 hash 路由 | `#kanban`、`#review`、`#package-editor`、`#calendar`、`#dashboard`、`#generation`、`#themes`、`#archive`、`#init` |
