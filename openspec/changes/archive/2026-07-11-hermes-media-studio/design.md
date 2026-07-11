## Context

Hermes Media Studio 是一个基于 Hermes WebUI Extension 机制构建的纯前端扩展，旨在将"文件管理"升级为"自媒体内容生产流水线"。当前项目处于初始阶段，无任何代码实现。Workspace 目录结构尚未创建。

技术约束：
- **纯前端**：零后端代码，仅通过 WebUI Workspace API（fetch）操作文件系统
- **无框架**：Vanilla JS（ES2020+），CSS Variables 兼容 WebUI 主题
- **无外部依赖**：所有 JS/CSS 本地 served，不加载 CDN
- **离线可用**：不依赖外部服务
- **命名空间隔离**：CSS `ms-` 前缀，DOM ID `media-studio-` 前缀

## Goals / Non-Goals

**Goals:**
- 搭建 Media Studio Extension 的基础架子：入口、路由、API 层、状态管理
- 实现看板视图（Kanban）：四列状态 + 主题筛选 + 素材卡片
- 实现审核模式（Review）：网格缩略图 + 键盘快捷键 + 批量操作
- 实现素材详情浮层：显示完整生成参数
- 创建 Workspace 初始化脚本和目录结构约定
- 实现 Sidecar 元数据驱动状态管理（不移动物理文件）
- 实现发布包生成器：选择素材 + 文案 → 平台专用 Markdown
- 实现发布日历：日/周视图 + 拖拽排期 + 发布归档
- 实现工作流浏览器：展示 `workflows/` 目录下的 API JSON
- 实现批量生成触发：选择工作流 + 主题 + 数量
- 实现数据看板：主题表现统计 + 爆款复刻 + 发布历史

**Non-Goals:**
- 不修改 Hermes WebUI 核心代码
- 不使用任何后端框架或数据库
- 不实现自动发布到平台 API（需企业资质）
- 不实现自动数据抓取（Phase 5 范围）
- 不实现 SSE 实时生成进度（可用轮询替代）

## Decisions

### D1：Extension 加载方式
**决策**：通过环境变量 `HERMES_WEBUI_EXTENSION_DIR` + `HERMES_WEBUI_EXTENSION_SCRIPT_URLS`/`STYLESHEET_URLS` 加载
**理由**：WebUI 原生支持的加载方式，无需修改 WebUI 源码
**备选**：直接修改 WebUI 的 HTML 模板 → 破坏可逆性原则

### D2：状态管理
**决策**：全局内存对象（`window.__MS_STATE__`）+ 每次视图切换/操作后从 Workspace 重新读取
**理由**：Workspace 文件系统是唯一真实来源（SSOT），内存状态只是缓存加速。选择简单对象而非 EventEmitter，降低复杂度
**备选**：localStorage → 不满足"一切数据存 Workspace"的设计原则；IndexedDB → 过度设计

### D3：素材物理路径策略
**决策**：素材永驻 `archive/YYYY/MM/`，`pipeline/` 各阶段目录存放符号链接或索引文件，状态变更只修改 `.meta.json` 中的 `status`
**理由**：物理文件移动在大规模素材下性能差，且破坏 Git 历史追踪。Sidecar `.meta.json` 模式使每次操作都是 1 次文件写入

### D4：路由方案
**决策**：Hash-based 路由（`#kanban`, `#review`, `#calendar`, `#dashboard`, `#package-editor`）
**理由**：纯前端扩展无法修改 WebUI 服务端路由，Hash 路由是最简单可靠的方式。URL 可分享/书签

### D5：API 端点探测
**决策**：扩展启动时自动探测 Workspace API 端点（tree/read/write/mkdir/delete/rename/upload）
**理由**：不同 WebUI 版本的 API 路径可能有差异，探测策略确保兼容性
**实现**：对每个候选 URL 发 HEAD 请求，200 或 405 都视作端点存在

### D6：发布包格式
**决策**：Markdown + YAML Frontmatter
**理由**：Workspace 天然支持 Markdown 渲染和编辑；Frontmatter 结构化的元数据 + 正文自由排版；可直接被平台复制粘贴使用

### D7：看板数据聚合策略
**决策**：每次视图加载时实时扫描 `pipeline/01-generating`~`05-published` 目录，读取 `.meta.json` 聚合
**理由**：数据量在可接受范围内（单主题数百张），实时读取保证数据一致性。未来可通过 `.media-studio/index.json` 缓存加速
**优化**：分页加载（每页 50 张）+ 虚拟滚动

### D8：CSS 隔离策略
**决策**：CSS 类名以 `ms-` 为前缀，DOM ID 以 `media-studio-` 为前缀，必要时使用 `!important` 覆盖 WebUI 默认样式
**理由**：WebUI 可能在未来的版本中更新 CSS，使用强隔离避免样式冲突
**备选**：Shadow DOM → 增加了复杂度，且对 WebUI 主题变量穿透更困难

### D9：模块结构
**决策**：按功能模块拆分 JS 文件（`modules/`），每个模块类实例化时接收 API client 和 state 实例
**理由**：模块间松耦合，每个模块可独立测试和开发。Pipeline 数据聚合放在 `api.js` 中作为 API 层扩展

### D10：首期实现策略
**决策**：采用垂直切片（Vertical Slice）而非水平分层，每个特性从 UI 到数据完整实现后再进入下一个
**理由**：用户可尽早获得可用的功能反馈。首选实现"看板视图"——这是最高价值、最痛的点
**顺序**：Kanban → Review → Package Editor → Calendar → Generation Console → Dashboard

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  app.js (入口 + 路由)                                     │
│  - 初始化 API client、State                              │
│  - 注册 Hash 路由监听                                     │
│  - 渲染导航栏 + 视图容器                                   │
├──────────────────────────────────────────────────────────┤
│  modules/                                                 │
│  ├── api.js              Workspace API 封装               │
│  │                      + Pipeline 聚合                   │
│  │                      + 端点探测                        │
│  ├── state.js           全局状态（内存）                   │
│  ├── router.js          Hash 路由                         │
│  ├── KanbanBoard.js     看板视图                           │
│  ├── ReviewMode.js      审核模式                           │
│  ├── PackageEditor.js   发布包编辑器                       │
│  ├── CalendarView.js    发布日历                           │
│  ├── StatsDashboard.js  数据看板                           │
│  ├── GenerationConsole.js 工作流浏览器+批量生成           │
│  ├── ThemeStrategy.js   主题策略中心                       │
│  ├── MediaArchive.js    素材母库                           │
│  ├── MediaCard.js       素材卡片组件                       │
│  ├── ThemeSelector.js   主题选择器                         │
│  ├── PlatformSelector.js 平台选择器                       │
│  └── MediaDetail.js     素材详情浮层                       │
├──────────────────────────────────────────────────────────┤
│  utils/                                                   │
│  ├── dom.js              DOM 工具函数                     │
│  ├── format.js           格式化（日期、数字、文件大小）      │
│  ├── meta.js             .meta.json 读写 + 状态变更        │
│  └── search.js           素材搜索索引                      │
└──────────────────────────────────────────────────────────┘
```

### State Flow

```
User Action (click/drag/key)
    │
    ▼
Module handler
    │
    ├─► api.js ──► Workspace API ──► File System
    │                                   │
    │                              .meta.json updated
    │                                   │
    └─► state.js ──► re-render view
```

### Data Model (Key Entities)

```
Asset:
  physical: archive/YYYY/MM/<name>.png
  metadata: archive/YYYY/MM/<name>.png.meta.json  (status, generation params, review, publish_history)

Pipeline Index:
  pipeline/01-generating/     → symlinks or references to generating assets
  pipeline/02-pending-review/ → references to pending-review assets
  pipeline/03-approved/       → references to approved assets
  pipeline/04-scheduled/      → dated publish packages (.md)
  pipeline/05-published/      → dated published packages (.md)

Theme Config:
  themes/<name>/theme.json    → style, generation defaults, publishing config

Platform Template:
  platforms/<name>/template.md → platform-specific formatting
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| WebUI API 版本变更 | 扩展无法工作 | 启动时自动探测端点，提供降级提示 |
| 大量素材导致看板加载慢 | 用户体验下降 | 分页加载 + 虚拟滚动 + 本地索引缓存（`.media-studio/index.json`）|
| 浏览器标签页刷新丢失状态 | 内存状态重置 | 每次视图切换从 Workspace 重新读取，内存仅作渲染缓存 |
| 用户误操作删除素材 | 数据丢失 | 删除操作先移至 `.trash/` 目录，保留 30 天可恢复 |
| 扩展与 WebUI 主题冲突 | 界面显示异常 | CSS `ms-` 前缀强隔离 + 充分测试各 WebUI 主题 |
| 无后端文件锁 | 并发操作冲突 | 单用户场景为主；写入时先读后写，不做乐观锁（避免复杂度） |
