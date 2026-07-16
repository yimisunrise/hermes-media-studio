# Hermes Media Studio

---

**温馨提示：当前还处于开发中，功能还不能使用！**

---

**自媒体内容生产驾驶舱** — 基于 [Hermes WebUI](https://github.com/nesquena/hermes-webui) Extension 机制的纯前端扩展，将文件管理升级为从灵感到发布的全流程生产流水线。

![status](https://img.shields.io/badge/status-active-brightgreen)
![hermes-webui](https://img.shields.io/badge/hermes--webui-%3E%3D0.50.0-blue)
![license](https://img.shields.io/badge/license-MIT-lightgrey)

---

## 功能概览

| 模块 | 路由 | 用途 |
|------|------|------|
| **灵感** | `#ideas` | 极轻量灵感随手记，支持快速输入和筛选 |
| **选题** | `#topics` | 从灵感转为可执行选题，指定内容形态和截止时间 |
| **主题** | `#themes` | 创作主题/风格定义，关联灵感和选题 |
| **看板** | `#kanban` | 五列流水线可视化：待处理 → 生成中 → 待审核 → 已通过 → 已拒绝 |
| **审核** | `#review` | 键盘驱动的批量审核工作流 |
| **任务** | `#tasks` | 生产任务管理 + 任务详情（含关联素材和文稿） |
| **素材** | `#assets` | 素材网格管理，支持上传/类型筛选/删除 |
| **数据库** | `#database` | 元数据驱动数据库管理（系统管理） |

> 更多业务细节参见 [DESIGN.md](DESIGN.md)。

---

## 工作原理

```
浏览器 (Extension JS/CSS)
    │
    ├─ 注入 Rail 按钮 → 侧栏面板（Manifest 驱动菜单）
    │
    ├─ Workspace API ──→ 元数据驱动数据库（JSON 文件存储）
    │                         │
    │                         ├─ .system/boot.json        ← 引导状态
    │                         ├─ .database/               ← Schema + 数据注册
    │                         │   ├─ system/              ← 框架库（库/表元数据）
    │                         │   └─ business/            ← 业务库（6 张业务表）
    │                         └─ .agent-tasks/            ← Agent 任务队列
    │
    └─ Hermes Agent ──→ 文件系统通信（job.json + brief.md）
```

### 三层架构

```
┌──────────────────────────────────────────────┐
│  业务层 (business/)                           │
│  Manifest 定义 → ViewManager 加载 → 业务视图   │
│  7 个视图、3 个菜单组、3 个初始化模块            │
├──────────────────────────────────────────────┤
│  框架层 (framework/)                          │
│  引导编排 / SchemaRegistry / DataRepository   │
│  MenuManager / ViewManager / Router / State   │
│  AgentTaskPoller / BootManager / InitOrchestrator│
├──────────────────────────────────────────────┤
│  数据层（.system/ + .database/ + 文件系统）      │
│  Schema 定义 → 自动 CRUD → JSON 持久化         │
│  透明分片 / 跨表引用 / UUID 索引                │
└──────────────────────────────────────────────┘
```

所有数据以 JSON 文件 + 文件系统目录形式存储，天然可 Git 版本控制，卸载扩展不丢失数据。

> 详细架构设计参见 [ARCHITECTURE.md](ARCHITECTURE.md)。

---

## 前置要求

- **Hermes WebUI** >= v0.50.0（Extension 机制 + Workspace API）
- **Hermes Agent**（可选，用于 AI 辅助生成和自动发布）
- 现代浏览器（Chrome 90+ / Firefox 90+ / Edge 90+）

---

## 安装

### 方法一：从 WebUI 扩展库安装（推荐）

打开 Hermes WebUI → **Settings → Extensions**，在扩展库中找到 **Media Studio**，点击 **Install** 即可。安装后刷新页面即可看到 Rail 上的 Media Studio 图标。

### 方法二：手动配置

#### 1. 克隆或下载本项目

```bash
git clone https://github.com/yimisunrise/hermes-media-studio.git
cd hermes-media-studio
```

#### 2. 配置 WebUI 环境变量

编辑 WebUI 项目目录下的 `.env` 文件（如不存在则新建）：

```bash
# 扩展静态文件目录（指向本项目 src/ 目录）
export HERMES_WEBUI_EXTENSION_DIR=/path/to/hermes-media-studio/src

# 注入脚本和样式
export HERMES_WEBUI_EXTENSION_SCRIPT_URLS=/extensions/app.js
export HERMES_WEBUI_EXTENSION_STYLESHEET_URLS=/extensions/app.css

# 工作空间目录（素材存储位置）
export HERMES_WORKSPACE=/path/to/hermes-media-studio/workspace
```

#### 3. 初始化工作空间

```bash
# 创建必要的目录结构
mkdir -p /path/to/workspace/{.system/init,.database/system,.agent-tasks,assets,configs/{themes,platforms}}
```

或使用安装脚本：

```bash
chmod +x src/scripts/install.sh
HERMES_WORKSPACE=/path/to/workspace ./src/scripts/install.sh
```

#### 4. 启动 WebUI

```bash
cd /path/to/hermes-webui
./ctl.sh restart
```

> **注意**：修改 `.env` 后不要直接使用 `./ctl.sh restart`，先确认旧进程已退出：
> ```bash
> lsof -i :8787 -P -n | grep LISTEN   # 检查端口
> kill <PID>
> ./ctl.sh start
> ```

#### 5. 验证

访问 WebUI，检查：
1. Rail 侧栏出现 Media Studio 图标按钮
2. 打开浏览器控制台，无 `Failed to load logo.svg` 等错误
3. 点击图标可展开侧栏面板

> **首次启动时**，扩展会自动运行初始化流程（创建 workspace 目录 → 初始化系统数据库 → 创建业务数据库与表结构），进度在覆盖层中显示。

---

## 工作空间目录结构

```
workspace/
├── .system/                        # 框架引导状态
│   ├── boot.json                   # 初始化标记
│   └── init/                       # InitOrchestrator 模块标记
│       ├── orchestrator-core.json
│       ├── schema-registry.json
│       └── business-db.json
│
├── .database/                      # 数据库层（Schema + 数据）
│   ├── databases.json              # 库注册表
│   ├── system/                     # 系统库（元数据自管理）
│   │   ├── db.json
│   │   ├── database/               # database 表
│   │   └── table/                  # table 表（自举锚点）
│   │
│   └── business/                   # 业务库
│       ├── db.json
│       ├── themes/                 # 主题管理
│       ├── ideas/                  # 灵感记录
│       ├── topics/                 # 选题管理
│       ├── tasks/                  # 生产任务（月分片）
│       ├── assets/                 # 素材文件（月分片）
│       └── contents/               # 文稿（版本化管理）
│
├── .agent-tasks/                   # Agent 任务通信协议
│   ├── index.json                  # 集中状态管理（version/processing/tasks map）
│   └── <uuid>/
│       ├── job.json                # 机器索引
│       ├── brief.md                # 任务简报（LLM 可读）
│       ├── files/                  # 参考附件
│       └── result.md               # YAML frontmatter + Markdown
│
├── assets/                         # 素材文件（按 YYYY-MM/ 分片）
│   └── YYYY-MM/                    # 月份目录
│       └── {uuid}-{filename}       # UUID 命名文件
│
└── configs/                        # 业务配置
    ├── themes/
    └── platforms/
```

---

## 使用指南

### 快速开始

1. 点击 Rail 上的 Media Studio 图标进入面板
2. 如工作空间未初始化，按提示等待初始化完成
3. 从 **选题策划** → **灵感** 开始记录灵感

### 创作生产流程

```
Theme ──→ Idea ──→ Topic ──→ Task ──┬──→ Asset（素材）
  （主题）  （灵感）  （选题）  （任务）  └──→ Content（文稿）
```

### 选题策划（当前开发阶段）

三个视图配合完成从策划到选题的流程：

- **灵感**（`#ideas`）：极轻量灵感记录，支持快速输入和详细录入，可按状态/主题筛选
- **选题**（`#topics`）：将灵感转为可执行选题，指定内容形态和截止时间
- **主题**（`#themes`）：主题策略管理，创建主题并关联灵感和选题

### 创作生产流程

当前创作模块支持完整的 Task→Asset/Content 生产链路：

- **任务**（`#tasks`）：创建生产任务（关联选题必填），管理任务状态流转
- **看板**（`#kanban`）：五列流水线可视化看板
- **审核**（`#review`）：键盘驱动的批量审核工作流
- **素材**（`#assets`）：素材网格管理，支持上传到 `workspace/assets/` 和删除
- **任务详情**：点击任务卡片，查看/上传关联素材，新建/编辑文稿

### 审核模式快捷键

| 按键 | 操作 |
|------|------|
| `1` | 通过 |
| `2` | 拒绝 |
| `←` `→` | 上/下一个任务 |

---

## 开发

```bash
# 验证 JS 语法（唯一可用的验证方式）
find src -name "*.js" -exec node --check {} \;

# 验证 Shell 脚本
bash -n src/scripts/install.sh
```

无测试套件、无类型检查、无 linter 配置。

### 技术栈

- **语言**：Vanilla JavaScript（ES Modules）
- **样式**：原生 CSS（命名空间 `ms-` 前缀，`media-studio-` ID 前缀）
- **构建**：无构建步骤，浏览器直接加载
- **图标**：内联 SVG（Lucide 风格）

### 项目结构

```
src/
├── app.js                          # 入口：bootstrapFramework → bootstrapBusiness
├── app.css                         # @import framework/app.css + business/app.css
├── assets/logo.svg                 # Rail 按钮图标
│
├── framework/                      # 可复用框架（零业务依赖）
│   ├── app.js                      # 引导编排
│   ├── app.css                     # 框架样式
│   ├── lib/                        # 基础设施
│   │   ├── api.js                  # Workspace API 客户端
│   │   ├── router.js               # Hash 路由
│   │   ├── state.js                # 事件驱动状态管理
│   │   └── sidebar.js              # WebUI Rail/侧栏注入
│   ├── boot/
│   │   └── BootManager.js          # 引导状态管理
│   ├── core/
│   │   ├── index.js                # 统一导出 5 个核心类
│   │   ├── SchemaRegistry.js       # 库/表元数据管理
│   │   ├── DataRepository.js       # 通用 CRUD + 透明分片
│   │   ├── InitOrchestrator.js     # 模块化初始化编排
│   │   └── AgentTaskPoller.js      # Agent 任务通信（传输层）
│   ├── ui/
│   │   ├── MenuManager.js          # Manifest 驱动菜单渲染 + 内联 SVG 图标
│   │   └── ViewManager.js          # Manifest 驱动视图加载 + 错误边界
│   └── utils/
│       ├── dom.js                  # DOM 工具函数
│       └── format.js               # 格式化工具
│
├── business/                       # 业务层（Manifest 注入）
│   ├── index.js                    # 业务引导入口
│   ├── manifest.js                 # 契约：7 视图 + 3 菜单组 + 3 initDefs
│   ├── app.css                     # 业务样式
│   ├── data/
│   │   └── index.js                # 仓储工厂：repo / taskRepo / assetRepo / contentRepo
│   ├── init/                       # 初始化定义
│   │   ├── InitOrchestrator.init-def.js
│   │   ├── SchemaRegistry.init-def.js
│   │   └── business-db.init-def.js
│   ├── views/                      # 业务视图
│   │   ├── InitOverlay.js          # 初始化覆盖层
│   │   ├── KanbanBoard.js          # 看板流水线
│   │   ├── ReviewMode.js           # 审核模式
│   │   ├── TasksView.js            # 任务管理 + 选题必填
│   │   ├── TaskDetail.js           # 任务详情（素材+文稿）
│   │   ├── AssetGallery.js         # 素材网格管理
│   │   ├── ContentEditor.js        # 文稿 Markdown 编辑器
│   │   ├── IdeaBoard.js            # 灵感看板（选题策划）
│   │   ├── TopicBoard.js           # 选题看板（选题策划）
│   │   ├── ThemeStrategy.js        # 主题策略（选题策划）
│   │   ├── DatabaseManager.js      # 数据库管理
│   │   └── components/
│   │       └── AssetCard.js        # 素材卡片组件
│
└── scripts/
    ├── install.sh                  # 初始化工作空间
    ├── uninstall.sh                # 卸载扩展
    └── update.sh                   # 更新（git pull）
```

### 核心概念

**Manifest 驱动**：业务通过 `manifest.js` 向框架声明视图、菜单、初始化模块，框架不 import 任何业务文件。

**元数据驱动数据库**：所有业务数据通过 `SchemaRegistry` + `DataRepository` 管理，Schema 定义决定存储和 CRUD 行为：
- 表结构 → `schema.json`（字段类型、校验规则、分片配置）
- 通用 CRUD → `DataRepository`（自动 ID 生成、时间戳、跨分片查询）
- 分片存储 → 月度分片透明处理

**Agent 通信协议**：通过 `.agent-tasks/` 目录与 Hermes Agent 通信，采用 index.json 集中状态管理 + 双文件设计：
- `job.json`（机器索引，供扩展快速扫描）
- `brief.md`（LLM/人类可读的任务简报）

---

## 卸载

```bash
# 运行卸载脚本
./src/scripts/uninstall.sh

# 或手动操作：
# 1. 删除 WebUI 环境变量中的扩展配置
# 2. 重启 WebUI
```

> 工作空间中的素材文件不受影响。

---

## License

MIT
