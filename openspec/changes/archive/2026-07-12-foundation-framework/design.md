## Context

Hermes Media Studio 当前无统一数据层——各视图模块直接调用 WorkspaceAPI 操作文件系统。本次设计的目标是在不修改现有视图代码的前提下，构建两层核心框架（数据层 + 流程层），为后续业务开发提供基础设施。

所有核心模块使用纯 ES Module（浏览器扩展环境），零 npm 依赖，零构建步骤。

## Goals / Non-Goals

**Goals:**
- 提供统一的库/表元数据管理（SchemaRegistry）
- 提供通用 CRUD + 透明分片（DataRepository）
- 提供配置驱动的状态机引擎（ProcessEngine）
- 提供文件附件扫描入库（FileScanner）
- 提供 Agent 任务通信能力（AgentTaskPoller）
- 提供统一通知系统（NotificationBus）
- 提供 DatabaseManager 可视化数据库管理界面
- 启动引导流程自动初始化 `.system/` + `.database/` 目录骨架

**Non-Goals:**
- 不修改现有 `src/modules/` 下任何视图代码（DatabaseManager 是新增视图，不影响现有视图）
- 不替换现有文件存储方式（现有 pipeline/ archive/ configs/ 保持不变）
- 不提供通用 UI 自动渲染组件（DatabaseManager 的字段→表单映射是硬编码的）
- 不提供用户/权限系统
- 不构建 Agent 进程本身（只提供扩展侧通信能力）

## Decisions

### 架构分层：两层（数据层 + 流程层）

| 层 | 职责 | 模块 |
|----|------|------|
| 流程层 | 状态机驱动、状态转换、钩子触发 | ProcessEngine |
| 数据层 | 库/表管理、通用 CRUD、文件扫描、Agent 通信 | SchemaRegistry, DataRepository, FileScanner, AgentTaskPoller |
| 视图 | 数据库可视化管理 | DatabaseManager |
| 全局 | 通知系统 | NotificationBus |

其他视图层由具体业务视图实现，不纳入框架核心。

### 存储方案：文件系统即数据库

沿用 WorkspaceAPI 的文件操作模式，在 `media-studio/` 工作空间下：
- `.system/boot.json` — 引导标记（初始化状态机）
- `.database/` — 所有库/表的 schema + 数据
- `.files/` — 文件附件存储
- `.agent/` — Agent 任务通信目录

不使用 sql.js 等嵌入式数据库，保持零 npm 依赖和浏览器扩展兼容性。

### 自举策略：硬编码 TABLE_SCHEMA

定义 `TABLE_SCHEMA` 常量描述 `table` 表的字段结构，在 SchemaRegistry 初始化时直接内存加载，无需读取任何文件。System 库只有 2 张表：`database` 和 `table`。

### Schema 与数据统一存储

表 schema 定义存储在 `schema.json`，数据存储在 `data.json`（单文件）或 `data-YYYYMM.json`（分片模式），同一目录下。`db.json` 作为物理层注册文件，先写 db.json 再写表数据。

### 分片命名：扁平 data-YYYYMM.json

使用连字符命名 `data-202607.json`，不创建子目录，省去 mkdir HTTP 往返。当前月始终读写 `data.json`，历史月归档为 `data-YYYYMM.json`。

### Agent 通信：目录 + 固定文件名协议

通过 `.agent/tasks/` / `.agent/processing/` / `.agent/results/` 三级目录 + job.json / result.json 固定文件名实现扩展↔Agent 通信。mv 到 processing/ 实现原子拾取，采集即清理避免 results/ 膨胀。

### 数据库管理器视图

DatabaseManager 是框架的第一方业务视图，提供可视化的数据库/表/数据管理能力。不依赖 AutoRenderer——表单和数据网格手写定制。

**视图结构**（三栏级联）：
```
┌─ DatabaseManager ──────────────────────────┐
│  ┌─ 左栏 ─┐  ┌─ 中栏 ─┐  ┌─ 右栏 ──────┐  │
│  │ 库列表   │  │ 表列表   │  │ 数据网格     │  │
│  │ ─────── │  │ ─────── │  │ (分页/排序)  │  │
│  │ system  │  │ tasks   │  │ id │ title │  │
│  │ main    │  │ assets  │  │ 1  │ foo   │  │
│  │ blog    │  │ ─────── │  │ 2  │ bar   │  │
│  │ [+ 新建]│  │ [+ 新建]│  │ [+ 新建]    │  │
│  └─────────┘  └─────────┘  └─────────────┘  │
└─────────────────────────────────────────────┘
```

**Hash 路由**：`#database`（库列表）→ `#database/main`（表列表）→ `#database/main/tasks`（数据浏览）

**集成方式**：
- `ICONS.database`: 数据库图标 SVG（补充到 app.js ICONS 对象）
- `MENU_GROUPS`: 新增"系统管理"分组，"数据库"菜单项
- 视图类: `src/views/DatabaseManager.js`，非 `src/modules/`
- 注册：在 `_initModules()` 中 import、构造、router.register

**字段类型 → 表单控件映射**（硬编码在视图层）：

| 字段类型 | 创建/编辑表单控件 | 数据网格显示 |
|----------|------------------|-------------|
| uuid | 隐藏，自动生成 | 纯文本 |
| string | `<input type="text">` | 纯文本 |
| text | `<textarea>` | 截断 + 展开 |
| integer | `<input type="number" step="1">` | 数字右对齐 |
| float | `<input type="number" step="any">` | 数字右对齐 |
| boolean | `<input type="checkbox">` | 勾/叉 |
| datetime | `<input type="datetime-local">` | 格式化日期 |
| date | `<input type="date">` | 格式化日期 |
| enum | `<select>` | 标签色块 |
| reference | `<select>` 加载关联表数据 | 关联表 displayField |
| array | 逗号分隔 input | 标签列表 |
| json | `<textarea>` | 缩进展示 |

### 文件附件：2-step rename + 多态关联

API 约束（move 不支持同时改名）要求跨目录移动分两步：原地改名 → 再移动。`system.files` 表使用 `ref_table + ref_id` 实现多态关联，同一文件可被多条业务记录引用。

## Risks / Trade-offs

| 风险 | 化解 |
|------|------|
| 文件系统操作无事务 | 写操作顺序固化：先写物理文件（db.json）再写逻辑表记录 |
| 分片文件跨月读取性能 | 启动时全量加载，视图操作在内存中完成 |
| Agent crash 后 processing/ 残留 | 启动时检查 processing/，发现残留则报警提示人工恢复 |
| FileScanner rename + move 非原子 | 任一 rename 失败时文件留在原位（incoming/），下次扫描重试 |
| 无锁/无并发控制 | 单用户工具无并发写冲突，文件系统 mv rename 是原子操作 |
