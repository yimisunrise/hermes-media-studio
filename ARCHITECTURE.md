# Hermes Media Studio — 架构设计

> 元数据驱动的数据管理 + 流程编排框架，框架-业务分离架构。
> 纯 ES 模块，零构建工具，浏览器扩展环境。

---

## 一、设计原则

1. **框架-业务分离** — `framework/` 提供通用引导/数据管理/UI 编排能力，`business/` 通过 manifest 注入业务配置，框架零依赖业务
2. **元数据驱动** — 数据 schema 和流程定义全部由元数据驱动，不写硬编码数据代码
3. **自举引导** — 框架用自身能力管理自身元数据（`table` 表自引用），`BootManager` + `InitOrchestrator` 分两层处理初始化
4. **零构建** — 纯 ES 模块，无 npm、无打包、无编译步骤
5. **数据层独立** — `SchemaRegistry` + `DataRepository` 构成独立数据管理子系统，框架和业务都可通过它存取数据
6. **Manifest 契约** — 业务通过 `manifest.js` 向框架声明视图、菜单、初始化模块，框架据此动态加载

---

## 二、三层架构总览

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  业务层 (Business Layer) — src/business/                             │
│                                                                      │
│  职责: 业务视图、初始化定义、业务配置                                   │
│  入口: business/index.js — bootstrapBusiness(ctx)                    │
│  契约: manifest.js — views(9) + menuGroups(5) + initDefs(4)         │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  bootstrapBusiness(ctx)                                      │   │
│  │  ├── manifest.initDefs → orchestrator.register()             │   │
│  │  ├── orchestrator.migrateIfNeeded() → run()                  │   │
│  │  ├── MenuManager(manifest).render(panel)                     │   │
│  │  ├── ViewManager(manifest).initModules()                     │   │
│  │  ├── router.init() + Sidebar.init()                          │   │
│  │  └── router.navigate('kanban')                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  框架层 (Framework Layer) — src/framework/                           │
│                                                                      │
│  职责: 会话管理、引导编排、UI 容器、菜单/视图框架、DOM 工具             │
│  入口: framework/app.js — bootstrapFramework(container)              │
│  无业务导入: framework/ 中任何文件都不 import business/               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  lib/     WorkspaceAPI / Router / AppState / SidebarManager  │   │
│  │  core/    SchemaRegistry / DataRepository / InitOrchestrator │   │
│  │          AgentTaskPoller / + index 统一导出                   │   │
│  │  boot/    BootManager — .system/boot.json 生命周期管理        │   │
│  │  ui/      MenuManager / ViewManager — manifest 驱动的渲染器   │   │
│  │  utils/   dom / format / meta / search / stateMachine        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  数据层 (Data Layer) — 运行时 + 文件系统                              │
│                                                                      │
│  职责: 库/表元数据管理、通用记录 CRUD、文件附件扫描、Agent 通信         │
│  存储: 所有数据以 JSON 文件存储在 Workspace 文件系统中                │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  SchemaRegistry                                              │   │
│  │  ├── 管理库 (database 表)                                     │   │
│  │  └── 管理表 (table 表，自举)                                   │   │
│  │                                                               │   │
│  │  DataRepository                                               │   │
│  │  ├── CRUD: get / find / create / update / delete              │   │
│  │  ├── 透明分片 (按月或单文件)                                   │   │
│  │  └── 客户端过滤/排序/分页                                      │   │
│  │                                                               │   │
│  │  AgentTaskPoller                                              │   │
│  │  ├── scan / pickup / deliver / collect                        │   │
│  │  └── .agent/ 目录通信协议 (扩展侧)                             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 层间通信规则

| 方向 | 方式 | 示例 |
|------|------|------|
| 框架 → 业务 | 框架创建 Ctx 传给业务 | `bootstrapFramework()` 返回上下文对象 |
| 业务 → 框架 | 业务调用框架模块 | `new MenuManager({ manifest })` |
| 业务 → 数据 | 通过框架的 SchemaRegistry | `orchestrator.run()` → handler 内使用 `ctx.schemaRegistry` |
| 框架 → 数据 | 直接使用 SchemaRegistry | `bootstrapFramework()` 内创建 SchemaRegistry 实例 |

### 关键约束

```
framework/  → 不可 import business/    ← 硬性约束（已通过代码检查验证）
business/   → 可 import framework/     ← 正常依赖
business/   → 不可直接操作 DOM 容器    ← 通过 ViewManager 传入的 container 操作
manifest.js → 是业务对框架的唯一契约    ← 框架只读取 manifest，不解释业务含义
```

---

## 三、核心概念

### 数据库 (Database)

一个数据库是一个独立的数据空间，拥有独立的表集合。库的 schema 和数据统一存储在 `.database/<数据库名>/` 目录下。

- `system` — 框架内置库，管理数据库注册和表结构定义
- 用户可创建任意数量的业务库（如 `main`、`blog`、`analytics`）

### 表 (Table)

表是数据的结构化定义，包含字段列表、存储配置、索引。

- 每个表有一个 directory: `.database/<库>/<表名>/`，内含 schema.json + data.json
- 单文件模式: `.database/<库>/<表名>/data.json`
- 分片模式: `.database/<库>/<表名>/data.json`（当前月度）+ `data-YYYYMM.json`（历史月度）

### 字段类型

| 类型 | UI 控件 | 说明 |
|------|---------|------|
| `uuid` | 隐藏，自动生成 | 唯一标识 |
| `string` | `<input type="text">` | 短文本 |
| `text` | `<textarea>` | 长文本 |
| `integer` | `<input type="number">` | 整数 |
| `float` | `<input type="number" step="any">` | 浮点数 |
| `boolean` | `<input type="checkbox">` | 布尔值 |
| `datetime` | `<input type="datetime-local">` | 日期时间 |
| `date` | `<input type="date">` | 日期 |
| `enum` | `<select>` | 枚举选择 |
| `reference` | `<select>`（加载关联表数据） | 跨表引用 |
| `file` | 文件选择器 + 上传/引用 | 文件附件 |
| `array` | 标签式输入 | 数组/列表 |
| `json` | `<textarea>` + 格式校验 | 任意 JSON |

### 流程 (Process)

流程是业务逻辑的编排定义。当前通过以下方式实现：

- **InitOrchestrator** — 模块化的初始化流程编排（依赖拓扑排序、版本化标记）
- **stateMachine** — 基于 `configs/workflows/task-lifecycle.json` 的状态机
- 流程定义不存储在框架中，由用户通过业务配置实现

---

## 四、存储目录结构

### 4.1 总览

```
media-studio/                          ← 工作空间根目录（WorkspaceAPI 命名空间）
│
├── .system/                           ← 【引导层】框架初始化状态和版本
│   ├── boot.json                      ← 初始化标记: version / init_state / last_boot
│   └── init/                          ← InitOrchestrator 模块标记
│       ├── orchestrator-core.json     ← {"version":"1.0.0","completedAt":"..."}
│       ├── workspace.json
│       ├── schema-registry.json
│       └── configs.json
│
├── .database/                         ← 【数据库层】所有库/表的 schema + 数据
│   ├── databases.json                 ← 库注册: {"databases": ["system", "main", ...]}
│   │
│   ├── system/                        ← 系统库（框架内置，管理自身元数据）
│   │   ├── db.json                    ← 表清单: {"tables": ["database", "table"]}
│   │   ├── database/                  ← database 表（schema + data）
│   │   └── table/                     ← table 表（自举锚点）
│   │
│   ├── main/                          ← 业务库（用户数据）
│   │   ├── db.json                    ← {"tables": ["tasks", "assets", ...]}
│   │   ├── tasks/                     ← 表目录（schema + data）
│   │   └── assets/
│   │
│   └── ...                            ← 用户创建的库
│
├── .files/                            ← 【文件层】文件附件存储，UUID 命名
│   ├── manifest.json                  ← shard 清单 + 最后扫描时间
│   └── YYYY/MM/<uuid>.<ext>          ← UUID 命名文件 + .meta.json sidecar
│
├── .index/                            ← 【索引层】搜索索引、聚合缓存
│   ├── manifest.json
│   ├── pipeline.json                  ← 流水线索引
│   ├── tasks.json                     ← 任务索引
│   └── copywriting/                   ← 文案索引分片
│
├── .agent/                            ← 【代理层】Hermes-Agent 任务通信协议
│   ├── tasks/<uuid>/                  ← 扩展写入：待处理任务
│   │   ├── job.json                   ← 机器索引（type/status/taskId）
│   │   ├── brief.md                   ← 任务简报（Markdown，Agent/人类可读）
│   │   └── files/                     ← 参考附件（可选）
│   ├── processing/<uuid>/             ← agent mv 至此：正在处理（防重复拾取）
│   └── results/<uuid>/                ← agent 写入：执行结果
│       └── result.md                  ← 执行结果（YAML frontmatter + Markdown 正文）
│
├── incoming/                          ← 【投递层】外部文件投递区
│   └── ...                            ← 任意子目录结构
│
├── configs/                           ← 【业务配置层】
│   ├── themes/                        ← 主题配置
│   ├── platforms/                     ← 平台发布配置
│   └── workflows/                     ← 工作流定义（如 task-lifecycle.json）
│
├── pipeline/                          ← 【流水线层】素材各阶段引用
│   ├── 01-generating/
│   ├── 02-pending-review/
│   ├── 03-approved/
│   ├── 04-scheduled/
│   └── 05-published/
│
├── assets/                            ← 【素材层】按主题/日期分片
├── archive/                           ← 【归档层】已归档素材
├── tasks/                             ← 【任务层】任务目录（UUID 命名）
├── copywriting/                       ← 【文案层】文案条目
└── .trash/                            ← 【回收站】删除素材暂存
```

### 4.2 目录层职责

| 层级 | 示例路径 | 职责 |
|------|---------|------|
| 引导层 | `.system/boot.json` | 记录框架初始化状态、版本号 |
| 模块标记 | `.system/init/<name>.json` | InitOrchestrator 模块完成标记，按版本号跟踪 |
| 库注册 | `.database/databases.json` | 列出所有库名称 |
| 库目录 | `.database/<db>/` | 一个库的完整数据空间 |
| 表注册 | `.database/<db>/db.json` | 列出该库所有表名称 |
| 表定义 | `.../<table>/schema.json` | 字段列表、类型、校验规则、分片配置 |
| 表数据 | `.../<table>/data.json` | 当前月度数据（单文件模式或当前分片） |
| 分片数据 | `.../<table>/data-YYYYMM.json` | 历史月度数据（只读），按年月归档 |

### 4.3 分片规则

```
单文件模式: data.json                          ← 小表，所有数据在一个文件
分片模式:   data.json（当前月） + data-YYYYMM.json（历史月）

切换时机: schema.shard.type 决定
  - "none"          → 单文件，所有数据在 data.json
  - "monthly"       → 月度分片，当前月在 data.json，历史月归档为 data-YYYYMM.json
```

命名规则：
- 使用**连字符**而非点号：`data-202607.json`（避免与文件扩展名混淆）
- 年月格式 `YYYYMM`：`data-202607.json` 表示 2026 年 7 月
- 当前月始终读写 `data.json`，历史分片只读（写时创建新分片，旧分片变成只读）

### 4.4 db.json / databases.json 职责

`databases.json` 和 `db.json` 只做**登记**，不做数据存储：

```json
// .database/databases.json — 库级注册（记录所有库）
{ "databases": ["system", "main"] }

// .database/main/db.json — 表级注册（记录该库的所有表）
{ "tables": ["tasks", "assets"] }
```

- 增删库时同步更新 `.database/databases.json`，增删表时同步更新对应的 `.database/<库>/db.json`
- `databases.json` / `db.json` 是**物理登记**（文件系统层面必须知道有哪些目录）
- 删除表时，从 `db.json` 移除引用，数据文件可选保留回收
- 框架以 `databases.json` / `db.json` 为权威，`system.database` / `system.table` 表是它的可查询视图
- 增删库/表时优先更新登记文件，再更新表数据（确保物理层先就绪）

### 4.5 文件附件存储（设计阶段，尚未实现）

```
incoming/                                      incoming/YYY/MM/<uuid>.<ext>
     │                                              │
     │  FileScanner.scan() (待实现)                  │
     │  ├── 递归遍历 incoming/ 下所有文件              │
     │  ├── 去重检查 (size + original_name)           │
     │  ├── UUID 重命名 + move 到 .files/             │
     │  └── 写入 DB 记录 + sidecar meta               │
     ▼                                              ▼
  .files/YYYY/MM/<uuid>.<ext>              .files/YYYY/MM/<uuid>.meta.json
```

### 4.6 Agent 任务通信协议

Hermes-Agent 是一个独立进程（非浏览器扩展），通过文件系统与扩展通信。
协议采用**双文件设计**：`job.json`（机器索引）+ `brief.md`（人类/LLM 可读的任务简报）。

#### 4.6.1 目录结构

```
.agent/
├── tasks/<uuid>/                     ← 扩展写入：待处理任务
│   ├── job.json                      ← 机器索引（扩展快速扫描用）
│   ├── brief.md                      ← 任务简报（Agent 主体读取，人类可读）
│   └── files/                        ← 参考附件（可选）
├── processing/<uuid>/                ← agent mv 至此：正在处理（防重复拾取）
└── results/<uuid>/                   ← agent 写入：执行结果
    └── result.md                     ← YAML frontmatter + Markdown 正文
```

#### 4.6.2 job.json（机器索引）

薄薄一层，只供扩展快速扫描任务队列用，不包含详细参数：

```json
{
  "type": "comfyui-generate",
  "taskId": "a1b2c3d4-...",
  "status": "pending",
  "createdAt": "2026-07-14T10:00:00.000Z"
}
```

#### 4.6.3 brief.md（任务简报）

Agent 读取这份 Markdown 执行任务。包含 YAML frontmatter 做结构化标记，
正文用自然语言描述任务要求、规范说明、参数、附件路径等。

```markdown
---
type: comfyui-generate
taskId: a1b2c3d4-...
createdAt: 2026-07-14T10:00:00.000Z
---

# 素材生成任务

## 规范说明

作为 HermesAgent，请严格按以下规范执行：
...
```

#### 4.6.4 result.md（结果报告）

Agent 执行完成后写入。扩展解析 YAML frontmatter 获取结构化结果，
正文供人类阅读执行详情。

```markdown
---
success: true
summary: 成功生成 3 张赛博朋克壁纸
files:
  - cyber-01.png
  - cyber-02.png
  - cyber-03.png
seeds:
  - 12345
  - 12346
  - 12347
---

执行详情：
1. 读取 workflow.json
2. 设置 seed 分别为 12345/12346/12347
3. 生成完成
```

#### 4.6.5 协议要点

| 要点 | 说明 |
|------|------|
| UUID 目录协议 | tasks/processing/results 都使用 UUID 目录名，任务 + 附件在同一个目录下 |
| 双文件设计 | job.json 供机器快速扫描，brief.md 供 Agent 详细读取，各取所需 |
| Markdown 结果 | result.md 用 YAML frontmatter 存储结构化字段，正文存执行详情 |
| mv 打标 | agent 拾取后 mv 到 processing/，防止重复拾取，crash 后可从 processing/ 恢复 |
| 采集即清理 | 扩展采集结果后直接 rm 清理，results/ 不留历史，避免膨胀 |
| 无锁 | 单进程 agent 无并发竞争，简单可靠 |
| 无状态 | agent 不维护内部任务队列，完全以文件系统为信源 |

---

## 五、Schema 定义格式

### 表结构定义（`schema.json`）

```json
{
  "id": "tasks",
  "label": "创作任务",
  "description": "管理每日创作任务",
  "fields": [
    {
      "name": "id",
      "type": "uuid",
      "label": "ID",
      "isId": true,
      "required": true
    },
    {
      "name": "title",
      "type": "string",
      "label": "标题",
      "required": true,
      "validation": { "maxLength": 200 }
    },
    {
      "name": "status",
      "type": "enum",
      "label": "状态",
      "enum": ["draft", "active", "review", "done"],
      "defaultValue": "draft"
    },
    {
      "name": "priority",
      "type": "integer",
      "label": "优先级",
      "min": 1,
      "max": 5,
      "defaultValue": 3
    },
    {
      "name": "budget",
      "type": "float",
      "label": "预算",
      "min": 0
    },
    {
      "name": "isUrgent",
      "type": "boolean",
      "label": "加急",
      "defaultValue": false
    },
    {
      "name": "type",
      "type": "reference",
      "label": "任务类型",
      "ref": { "database": "main", "table": "task-types" },
      "displayField": "name"
    },
    {
      "name": "deadline",
      "type": "date",
      "label": "截止日期"
    },
    {
      "name": "tags",
      "type": "array",
      "label": "标签",
      "items": { "type": "string" }
    },
    {
      "name": "description",
      "type": "text",
      "label": "详细描述"
    },
    {
      "name": "createdAt",
      "type": "datetime",
      "label": "创建时间",
      "autoSet": "now"
    },
    {
      "name": "updatedAt",
      "type": "datetime",
      "label": "更新时间",
      "autoSet": "now"
    }
  ],
  "shard": {
    "type": "none"
  }
}
```

### 自举元 Schema（硬编码于 `SchemaRegistry.js`）

```javascript
const TABLE_SCHEMA = {
  id: 'table',
  label: '表注册表',
  fields: [
    { id: 'id', type: 'string', label: '标识', required: true },
    { id: 'database', type: 'string', label: '所属库', required: true },
    { id: 'label', type: 'string', label: '名称' },
    { id: 'shardType', type: 'string', label: '分片类型', defaultValue: 'none' },
    { id: 'createdAt', type: 'datetime', label: '创建时间', autoSet: 'created' }
  ],
  displayField: 'label',
  shard: { type: 'none' }
};
```

---

## 六、核心模块详解

### 6.1 BootManager — 引导状态管理

**路径**: `framework/boot/BootManager.js`

```javascript
class BootManager {
  constructor({ api })                    // 只需 WorkspaceAPI
  async readBoot()                        // 读 .system/boot.json，不存在返回默认值
  async writeBoot(data)                   // 写（合并现有数据）
  async isFirstBoot()                     // init_state === 'pending'
  async markBootComplete()                // 写 boot_id + init_state=done
  async writeStepStatus(stepName, status) // 旧版兼容：记录单步骤状态
}
```

**职责**: 管理 `.system/boot.json` 的读写和首次引导检测。从 SchemaRegistry 剥离，独立负责引导生命周期。`boot.json` 是框架的唯一初始化标记，必须在数据库就绪前可读。

### 6.2 InitOrchestrator — 初始化编排

**路径**: `framework/core/InitOrchestrator.js`

```javascript
class InitOrchestrator {
  constructor({ api, schemaRegistry, bootManager })
  register(moduleDef)                     // 注册 init-def 模块
  async getPending()                      // 获取未完成（或版本变更）的模块列表
  async isComplete()                      // 所有模块已完成？
  async run({ onProgress })               // 按依赖拓扑顺序执行所有待运行模块
  async migrateIfNeeded()                 // 从旧 boot.json 迁移到 .system/init/ 标记
}
```

**职责**: 模块化初始化流程编排。每个模块通过 init-def.js 声明 init 逻辑，依赖关系通过拓扑排序解析。模块完成状态持久化到 `.system/init/<name>.json`，按版本号跟踪。提供从旧版 `boot.json` 的迁移路径。

**与 BootManager 的关系**:
- `BootManager` 管理**资源层初始化**（`.system/boot.json` 是否存在）
- `InitOrchestrator` 管理**业务层初始化**（模块标记是否写入）
- 两者独立：BootManager 先运行，InitOrchestrator 在其之上叠加模块化逻辑

### 6.3 SchemaRegistry — 元数据管理

**路径**: `framework/core/SchemaRegistry.js`

```javascript
class SchemaRegistry {
  constructor({ api, notificationBus })    // notificationBus 预留参数（尚未实现）

  // 系统库自举
  async bootstrapSystemDb()               // 创建 .database/system/ 目录树 + 系统表

  // 数据库管理
  async listDatabases()                   // → [{ id, label, createdAt }, ...]
  async createDatabase(def)               // 建库 → 写目录 + 更新 databases.json
  async deleteDatabase(id)                // 删库 → 清理整个目录 + 数据库注册
  async updateDatabase(id, updates)       // 更新库元数据

  // 表管理
  async listTables(database)              // → 读 .database/<db>/db.json
  async getTable(database, id)            // → 加载 schema.json（带缓存）
  async createTable(database, schemaDef)  // 写 schema + data.json + 注册
  async updateTable(database, id, patch)  // 更新 schema.json
  async deleteTable(database, id)         // 删表目录 + 更新注册
}
```

### 6.4 DataRepository — 通用 CRUD

**路径**: `framework/core/DataRepository.js`

```javascript
class DataRepository {
  static for(api, schemaRegistry, database, tableName)  // 工厂方法

  async get(id)                           // 按 id 查单条（跨分片）
  async find({ filter, sort, page, limit }) // 列表查询（跨分片合并）
  async create(data)                      // 新建（自动 uuid + autoSet）
  async update(id, patch)                 // 局部更新
  async delete(id)                        // 删除
  async count(filter)                     // 统计
}
```

**职责**: 为指定表提供通用 CRUD。透明处理分片定位、跨分片合并、默认值填充。

### 6.5 AgentTaskPoller — Agent 任务采集器（传输层）

**路径**: `framework/core/AgentTaskPoller.js`

```javascript
class AgentTaskPoller {
  constructor({ api })                     // 只需 WorkspaceAPI

  async scan()                             // 扫描 .agent/tasks/ 未拾取任务（读 job.json）
  async pickup(uuid)                       // mv tasks → processing（防重复）
  async deliver(uuid, result, files)       // 写入结果 + cleanup processing
  async collect()                          // 采集 .agent/results/ 已完成结果
}
```

**职责**: **仅负责传输层**——任务队列管理、文件搬移、结果采集。不解析业务内容，不关心 brief.md/result.md 的具体字段。业务层的任务类型注册、结果分发由 `business/agent/` 实现。

**协议边界**:
- 写入 job.json（薄元数据）后返回 UUID，业务层用此 UUID 关联后续结果
- scan() 只读 job.json，不解析 brief.md
- collect() 返回 result.md 原始文本，不负责解析 frontmatter
- 结果清理由 collect() 自动完成，业务层无需关心

### 6.6 ViewManager — 视图管理器

**路径**: `framework/ui/ViewManager.js`

```javascript
class ViewManager {
  constructor({ api, state, schemaRegistry, viewContainer, router, onViewChange, manifest })

  async initModules()                      // 遍历 manifest.views → 动态 import → 注册路由
  async _renderView(viewName, params)      // 切换视图：loading → empty → render()
  destroyAll()                             // 销毁所有视图实例
  pauseAll()                               // 暂停所有视图的自动刷新
}
```

**职责**: 从 manifest 读取视图注册表，通过动态 `import()` 加载业务视图模块。每个视图通过路由 hash 切换。提供错误边界：模块加载失败 → console.warn 并跳过；渲染失败 → 显示错误信息。

### 6.7 MenuManager — 菜单管理器

**路径**: `framework/ui/MenuManager.js`

```javascript
class MenuManager {
  constructor({ manifest })                // 接收 MANIFEST 对象

  render(container, navigate)              // 渲染菜单组 + 菜单项
  setActiveView(viewName)                  // 高亮当前视图对应的菜单项
  destroy()                                // 清理
}
```

**职责**: 从 manifest 读取菜单组定义和内联 SVG 图标，渲染可展开/折叠的侧栏菜单。菜单项点击通过 `navigate` 回调触发路由切换。ICONS 对象（14 个 SVG）硬编码在 MenuManager 中。

---

## 七、引导流程

```
浏览器加载 /extensions/app.js
│
├── [1] app.js — 入口
│   ├── 等待 DOMContentLoaded
│   ├── 创建 #media-studio-app 容器
│   └── bootstrapFramework(container)
│
├── [2] framework/app.js — bootstrapFramework
│   ├── 创建 DOM：panel(菜单) + viewContainer(视图)
│   ├── new WorkspaceAPI()
│   ├── new AppState()
│   ├── new Router(state)
│   │
│   ├── _waitForSession() ← 最多轮询 8 秒等 S.session
│   │   └── 超时且 S._bootReady → 创建独立会话
│   │
│   ├── api.detectWorkspace()
│   ├── api.probe() ← 验证 API 连通性
│   │
│   ├── new BootManager({ api })
│   ├── new SchemaRegistry({ api, notificationBus: null })
│   ├── new InitOrchestrator({ api, schemaRegistry, bootManager })
│   │
│   └── return { api, state, router, bootManager, schemaRegistry, orchestrator, panel, viewContainer }
│
└── [3] business/index.js — bootstrapBusiness(ctx)
    │
    ├── 注册 init-defs ← manifest.initDefs → orchestrator.register()
    │   ├── orchestrator-core: 创建 .system/init/ 目录
    │   ├── workspace: 创建 8 个工作空间目录
    │   ├── schema-registry: bootstrapSystemDb + main 库
    │   └── configs: 写入默认 task-lifecycle.json
    │
    ├── orchestrator.migrateIfNeeded()
    │   └── 检测旧 boot.json(init_state=done) + 无 .system/init/ → 迁移
    │
    ├── orchestrator.run()
    │   └── 按依赖拓扑执行，显示 InitOverlay 进度
    │
    ├── MenuManager(manifest).render(panel)
    │
    ├── ViewManager(manifest).initModules()
    │   └── 动态 import 9 个视图 → 注册路由
    │
    ├── router.init()
    ├── Sidebar.init() ← 注入 Rail 按钮 + 移动端链接
    └── router.navigate('kanban')
```

### 初始化模块依赖拓扑

```
orchestrator-core (无依赖)
    │
    ├── workspace (dependsOn: orchestrator-core)
    │
    └── schema-registry (dependsOn: workspace)
    │       │
    │       └── configs (dependsOn: workspace)
    │
    执行顺序: orchestrator-core → workspace → schema-registry → configs
```

---

## 八、模块文件结构

```
src/
├── app.js                              # 入口：bootstrapFramework → bootstrapBusiness
├── app.css                             # @import framework/app.css + business/app.css
├── assets/logo.svg                     # Rail 按钮图标
│
├── framework/                          # 可复用框架（零业务依赖）
│   ├── app.js                          # 引导：session → probe → core 实例化
│   ├── app.css                         # 框架样式（布局/菜单/表单/弹窗/滚动条/工具类）
│   │
│   ├── lib/                            # 基础设施
│   │   ├── api.js                      # Workspace API 客户端（818 行）
│   │   ├── router.js                   # Hash 路由
│   │   ├── state.js                    # 事件驱动状态管理
│   │   └── sidebar.js                  # WebUI Rail/侧栏集成（单例模块）
│   │
│   ├── boot/
│   │   └── BootManager.js              # .system/boot.json 生命周期
│   │
│   ├── core/                           # 核心模块
│   │   ├── index.js                    # 统一导出 5 个核心类
│   │   ├── SchemaRegistry.js           # 库/表元数据管理
│   │   ├── DataRepository.js           # 通用 CRUD + 分片
│   │   ├── InitOrchestrator.js         # 模块化初始化编排
│   │   └── AgentTaskPoller.js          # Agent 任务通信
│   │
│   ├── ui/                             # UI 编排
│   │   ├── MenuManager.js              # Manifest 驱动菜单
│   │   └── ViewManager.js              # Manifest 驱动视图 + 错误边界
│   │
│   └── utils/                          # 工具函数
│       ├── dom.js                      # createElement / empty / debounce / 等
│       ├── format.js                   # 格式化工具
│       ├── meta.js                     # 素材元数据读写
│       ├── search.js                   # 搜索工具
│       └── stateMachine.js             # 状态机（依赖业务配置文件）
│
├── business/                           # 业务层（manifest 注入）
│   ├── index.js                        # 业务引导
│   ├── manifest.js                     # 契约：9 views + 5 menuGroups + 4 initDefs
│   ├── app.css                         # 业务样式（看板/审核/日历/数据库管理）
│   │
│   ├── init/                           # 初始化定义
│   │   ├── InitOrchestrator.init-def.js
│   │   ├── workspace.init-def.js
│   │   ├── SchemaRegistry.init-def.js
│   │   └── configs.init-def.js
│   │
│   ├── views/                          # 业务视图
│   │   ├── InitOverlay.js              # 初始化覆盖层
│   │   ├── KanbanBoard.js              # 看板流水线
│   │   ├── ReviewMode.js               # 审核模式
│   │   ├── TasksView.js                # 任务管理
│   │   ├── PublishView.js              # 发布包编辑器
│   │   ├── MediaArchive.js             # 素材库
│   │   ├── CopywritingView.js          # 图文库
│   │   ├── CalendarView.js             # 发布日历
│   │   ├── PlatformConfig.js           # 平台配置
│   │   ├── DatabaseManager.js          # 数据库管理
│   │   └── components/                 # 可复用 UI 组件
│   │       ├── MediaCard.js
│   │       └── MediaDetail.js
│
└── scripts/
    ├── install.sh                      # 初始化工作空间
    ├── uninstall.sh                    # 卸载扩展
    ├── update.sh                       # 更新（git pull）
    └── migrate-v2.sh                   # v2 目录迁移脚本
```

---

## 九、框架边界

### 框架核心提供的能力

| 层 | 能力 | 组件 |
|----|------|------|
| 引导 | 会话等待 + API 探测 | `framework/app.js` + `api.js` |
| 引导 | boot.json 读写 + 首次检测 | `BootManager` |
| 引导 | 模块化初始化编排 | `InitOrchestrator` |
| 数据 | 库注册管理 | `SchemaRegistry` |
| 数据 | 表结构定义、校验、持久化 | `SchemaRegistry` |
| 数据 | 通用 CRUD 操作 | `DataRepository` |
| 数据 | 透明分片存储 | `DataRepository` |
| 数据 | Agent 任务收发（扩展侧） | `AgentTaskPoller` |
| UI | Manifest 驱动视图加载 + 错误边界 | `ViewManager` |
| UI | Manifest 驱动菜单渲染 | `MenuManager` |
| UI | 状态管理 + 事件通知 | `AppState` |
| UI | Hash 路由 | `Router` |
| UI | WebUI Rail/侧栏注入 | `SidebarManager` |
| UI | DOM 工具函数 | `utils/dom.js` |

### 框架不做的

- 不包含具体业务逻辑（业务在 `business/` 中实现）
- 不提供用户/权限系统
- 不规定视图内部布局（业务视图自行实现）
- 不提供 Agent 进程本身（AgentTaskPoller 只负责文件层通信）
- 不提供外部集成（API/Webhook 等）
- 不存储业务配置（配置在 `configs/` 目录，由业务写入）

### 尚未实现的框架组件

| 组件 | 状态 | 说明 |
|------|------|------|
| `FileScanner` | 设计阶段 | 文件附件扫描（incoming/ → .files/） |
| `ProcessEngine` | 设计阶段 | 通用状态机引擎 |
| `NotificationBus` | 设计阶段 | 全局通知/Toast 系统 |

---

## 十、架构现状

### 已完成

| 里程碑 | 说明 |
|--------|------|
| 框架-业务分离 | `framework/` (18 文件) 与 `business/` (18 文件) 完全解耦 |
| Manifest 驱动 | `ViewManager` / `MenuManager` 通过 manifest 配置 |
| 三层入口 | `app.js(24行)` → `framework/app.js` → `business/index.js` |
| 引导拆分 | BootManager 独立 + InitOrchestrator 模块化 |
| CSS 分离 | framework/business CSS 独立，app.css 仅 @import |
| SchemaRegistry 精简 | 移除了 boot 逻辑，仅含 schema CRUD |
| 旧目录清理 | `lib/` / `utils/` / `core/` / `ui/` / `views/` / `init/` 已删除 |

### 待处理

| 事项 | 说明 |
|------|------|
| `api.js` 瘦身 | 818 行中混有大量业务方法（kanban/dashboard/platform/copywriting/task），应移至 `business/` |
| `ARCHITECTURE.md` 同步 | 本文档已完成同步 |
| 文件附件扫描 | `FileScanner` 待实现 |
| 通用状态机 | `ProcessEngine` 待实现 |
| 通知系统 | `NotificationBus` 待实现 |
| `api.js` 中业务方法分离 | loadKanbanData/loadDashboardStats 等应移至业务层 |
| Agent 双文件协议适配 | `AgentTaskPoller` 需适配 job.json + brief.md 双文件写入 |
| 业务任务层实现 | `business/agent/`（brief生成 + result解析 + handler 派发）待创建 |
| 业务数据统一 | 现有业务数据（tasks/pipeline/publish-records）迁移到 `business` 库 |

---

## 十一、关键设计决策记录

| 决策 | 结论 | 理由 |
|------|------|------|
| 框架-业务目录结构 | `framework/` + `business/` | 可复用框架与业务完全分离，新业务只需替换 `business/` |
| 业务注入方式 | manifest 契约对象 | 框架不 import 任何业务文件，业务通过 manifest 声明视图/菜单/初始化 |
| manifest 视图导入 | 动态 `import()` | 浏览器原生 ES module 动态加载，无需打包工具 |
| 引导分层 | BootManager + InitOrchestrator | BootManager 管系统级(.system/boot.json)，InitOrchestrator 管模块级 |
| 初始化版本化 | `.system/init/<name>.json` 含 version | 模块版本变更时自动重新执行 init |
| System 库有几张表 | 2 张 | `database` + `table`，仅管理元数据 |
| 视图/布局配置 | 不在 framework 中 | 视图层走自定义业务 UI，框架只提供数据层和流程层 |
| schema 是否包含 UI 配置 | 不包含 | schema 只定义数据结构，视图层走自定义业务 UI |
| 存储分片策略 | schema 级声明 | schema.shard 配置，DataRepository 透明处理 |
| 自举锚点 | 硬编码 TABLE_SCHEMA | 打破循环依赖 |
| 元数据缓存 | 启动时全加载 | 数据量小，简化一致性 |
| Schema 与数据存储 | 统一在 `.database/` | schema 和数据是同一事物的两面，分开增加路径复杂度 |
| 引导层 | `.system/boot.json` 独立于 `.database/` | 打破循环依赖 — 初始化标记必须在数据库就绪前可读 |
| 分片命名 | 扁平 `data-YYYYMM.json` | 省去 mkdir HTTP 往返，连字符避免扩展名歧义 |
| 库注册 | 每层 `db.json` 分散式 | 增删库/表不影响他人，符合文件系统即数据库理念 |
| 物理层 vs 逻辑层权威 | `db.json` 为物理权威 | `system.database/table` 表是 `db.json` 的可查询视图 |
| Agent 通信目录 | `.agent/`（dot-dir 隐藏） | 与 `.database/` / `.index/` 保持一致 |
| Agent 任务结构 | UUID 命名目录（含附件） | 一个目录包含所有相关内容，避免松散文件 |
| Agent 任务描述格式 | **双文件**：job.json（机器索引）+ brief.md（LLM/人类可读） | 机器快速扫描用 JSON，Agent 理解用 Markdown，各取所需 |
| Agent 结果格式 | result.md（YAML frontmatter + Markdown 正文） | 扩展解析 frontmatter 得结构化数据，人类阅读正文了解详情 |
| Agent 传输层 vs 业务层 | AgentTaskPoller 仅传输层，business/agent/ 负业务解析 | 框架与业务分离，AgentTaskPoller 不关心业务内容 |
| Agent 防重复拾取 | mv tasks → processing | 文件系统 mv 是原子操作，简单可靠 |
| Agent 结果采集 | 扩展启动/刷新时 collect | 扩展是浏览器端，不适合持久轮询，刷新时批量采集足够 |
| API 客户端设计 | 类 + 实例方法 | 每个视图可持有独立 API 引用，易于测试 |
| 状态管理 | 事件驱动（订阅/发布） | 视图切换时取消订阅，避免内存泄漏 |
| CSS 命名空间 | `ms-` 前缀类名 / `media-studio-` 前缀 ID | 避免与 WebUI 宿主样式冲突 |
| 组件导入路径 | 相对路径 `../../framework/` 从 business/ | 浏览器原生 ES module 仅支持相对路径和 URL |
| ICONS 存储位置 | 硬编码在 MenuManager.js | 内联 SVG 无外部依赖，14 个图标不影响可维护性 |
| 旧版迁移策略 | `InitOrchestrator.migrateIfNeeded()` | 检测旧 boot.json + 无模块标记 → 自动写入完成标记 |
