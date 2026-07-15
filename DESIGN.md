# Hermes Media Studio — 业务设计文档

> 个人自媒体内容生产驾驶舱 — 从灵感到发布的全流程管理。
>
> 本文档定义产品定位、用户流程、数据模型和业务规则，
> 是业务层重构和开发的统一参考。

---

## 一、产品定位

### 1.1 一句话描述

面向**个人自媒体创作者**的内容生产管理工具，覆盖从灵感记录到多平台发布的全流程，通过与 **HermesAgent** 深度集成实现关键环节的自动化。

### 1.2 目标用户

- **个人创作者**（当前核心）
- 支持的内容形态：图文、短视频、纯文字
- 典型使用场景：下班后运营自己的小红书/抖音/B站账号
- 核心诉求：减少重复劳动、规范创作流程、数据驱动决策

### 1.3 核心价值

| 价值 | 说明 |
|------|------|
| **流程闭环** | 从灵感记录到发布追踪，一个工具覆盖全链路 |
| **自动化** | AI 生成素材、自动编排、定时发布、数据采集，减少手工操作 |
| **数据驱动** | 所有内容资产结构化存储，支持复盘和策略优化 |
| **零构建** | 纯浏览器扩展，无安装成本，数据以文件形式存在，天然可版本控制 |

---

## 二、用户流程

### 2.1 总览

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  策 划    │   │  选 题    │   │  创 作    │   │  编 排    │   │  发 布    │   │  追 踪    │
│          │   │          │   │          │   │          │   │          │   │          │
│ 主题库    │   │ 思路→选题 │   │ 素材生成   │   │ 内容编排   │   │ 排期发布   │   │ 数据采集   │
│ 灵感记录  │   │ 方向确认  │   │ 文稿撰写   │   │ 封面设计   │   │ 多平台分发  │   │ 效果分析   │
│ 选题策略  │   │          │   │ AI辅助    │   │ 预览审核   │   │          │   │ 策略反馈   │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
     │               │              │              │              │              │
     └───────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
                                       时间线
```

### 2.2 阶段详解

#### 阶段一：策划

创作者日常的灵感积累和主题规划。

```
用户行为                    系统能力
─────────                  ────────
随手记录灵感              → 保存到「思路池」(Idea)
                                 ├ 标题/一句话描述
                                 ├ 关联主题 (Theme)
                                 └ 标签/参考链接

管理主题库                 → 增删改查主题 (Theme)
                                 ├ 主题名称 + 风格描述
                                 ├ 目标平台偏好
                                 └ prompt 模板（给 ComfyUI 用）

浏览/筛选思路             → 按主题/标签/时间筛选
```

**关键设计点**：
- Idea 的录入应该极轻量——打开就能记，类比"备忘录"
- Theme 可以复用——同一个主题可以产出多篇内容

#### 阶段二：选题

从思路池中选定一个 Idea，决定"今天做这个"。

```
用户行为                    系统能力
─────────                  ────────
从思路池选择一个 Idea     → 创建 Topic
                                  ├ 确定内容形态（图文/视频/文字）
                                  ├ 关联主题 Theme
                                  └ 确定交付时间

（可选）查看主题历史      → 展示该主题下已发布内容的概览
```

**关键设计点**：
- Topic 是 Idea 的"执行实例"——一个 Idea 可以产生多个 Topic（不同平台不同版本）
- 选定 Topic 后，系统可以自动进入创作阶段

#### 阶段三：创作

核心生产环节——准备素材和撰写文稿。

```
用户行为                    系统能力                        HermesAgent 介入
─────────                  ────────                        ────────────────
创建生产任务               → Task                          驱动 ComfyUI
                                 ├ type: media/copywriting     生成图片/视频
                                 ├ mode: manual/agent
                                 └ status 状态机流转

准备素材                  → Asset                         （Agent）生成素材
  ├ 从网络下载               ├ 文件 + meta                     后自动采集结果
  ├ ComfyUI 生成            ├ 归属 Task                     写入 Asset 记录
  └ 本地已有素材              ├ 标签/主题
                              └ 流水线状态

撰写文稿                  → Content                        （Agent）辅助生成
  ├ Markdown 编辑            ├ 版本管理（draft→finalized）    文案初稿
  ├ 实时预览                 ├ 关联 Task/Topic              多版本建议
  └ 定稿/草稿切换            └ 定稿后只读
```

**素材生命周期**：
```
生成中 → 待审核 → 已审核 → 已使用 → 归档
```

**文稿生命周期**：
```
草稿 → 定稿
     ↘ 新版本（定稿后可创建新版本继续编辑）
```

**关键设计点**：
- Task 是"生产任务"，Asset 和 Content 是"产出物"——一对多关系
- 一个 Task 可以产出一张图（asset）+ 一篇文稿（content）
- Agent 模式：系统自动创建 Task → HermesAgent 执行 → 结果自动回填
- 手工模式：用户自己准备素材，系统只做记录和流转

#### 阶段四：编排

将素材和文稿组合成最终发布形态。

```
用户行为                    系统能力                        HermesAgent 介入
─────────                  ────────                        ────────────────
选择 Task（待编排内容）    → 展示该 Task 下的 Assets + Scripts

手工编排                  → 创建 Content                    （Agent）自动编排
  ├ 选择封面                  ├ type: 图文/视频/纯文字           素材+文案→成品
  ├ 排列素材顺序              ├ 关联 Assets + Scripts         批量生成预览
  ├ 编辑文案/标题             ├ 预览视图
  └ 调整格式                  └ 定稿/保存草稿

定稿确认                  → Content.status = finalized
```

**关键设计点**：
- Content 是"发布前最终的成品"——区别于 Task（生产任务）和 Package（发布格式）
- 一个 Task 可以有多个 Content（同一素材配不同文案 → 不同平台）
- 编排完成后进入审核环节

#### 阶段五：发布

排期、审核、发布到各平台。

```
用户行为                    系统能力                        HermesAgent 介入
─────────                  ────────                        ────────────────
创建发布包                → Package                         （Agent）自动发布
  ├ 选择 Content              ├ 关联 Content                  按排期自动触发
  ├ 选择目标平台              ├ 关联 Platform(s)              调用平台 API
  ├ 设定排期时间              └ 状态: draft/scheduled/published  回填发布结果
  └ 确认发布

（可选）立即发布           → Package.status = published
（可选）排期发布           → Package.status = scheduled → 到时间自动变 published

查看发布日历              → 日历视图展示排期
```

**Platform（平台配置）数据结构**：

```json
{
  "id": "xiaohongshu",
  "name": "小红书",
  "type": "social",            // social / video / article
  "publishConfig": {           // 发布参数模板
    "titleMaxLength": 20,
    "bodyMaxLength": 1000,
    "mediaLimit": 18
  },
  "apiConfig": {               // HermesAgent 发布用
    "authType": "cookie",
    "endpoint": "..."
  }
}
```

**关键设计点**：
- Package 是"发布的记录"——发布后不可修改，只可归档
- 一个 Package 可以同时发往多个平台（但最好是同一条 Content 的不同适配版本）
- Agent 自动发布需在发布前做完整预览确认

#### 阶段六：追踪

发布后的数据采集和分析。

```
用户行为                    系统能力                        HermesAgent 介入
─────────                  ────────                        ────────────────
查看发布效果              → 展示 Analytics                    （Agent）定时采集
  ├ 阅读量/播放量              ├ 关联 Package                  各平台数据
  ├ 点赞/收藏/评论/转发         ├ 时间维度：日/周/月           自动写入 Analytics
  ├ 趋势曲线                   └ 平台维度对比

爆款检测                  → 识别高互动内容                    （Agent）异常检测
  ├ 互动率 > 阈值              通知 → 考虑追发/复刻
  └ 相比历史数据突增

数据复盘                  → 主题维度聚合分析
  ├ 哪个主题表现好
  ├ 哪种内容形态互动高
  └ 最佳发布时间
```

**关键设计点**：
- Analytics 数据由 HermesAgent 定时采集，系统只做展示和分析
- 初期可手动录入数据（降低 Agent 开发依赖）
- "爆款检测"可以触发新一轮选题（从 Analytics 反哺到 Idea）

### 2.3 完整数据流

```
Theme ──┬──→ Idea ──→ Topic ──→ Task ──┬──→ Asset
         │                              └──→ Script
         │                                      │
         │                                      ▼
         │                                   Content ←── 编排
         │                                      │
         │                                      ▼
         │                                   Package ──→ Platform
         │                                      │
         │                                      ▼
         │                                 PublishLog ──→ Analytics
         │                                                │
         └────────────────────────────────────────────────┘
                    （反馈：主题表现 → 优化选题策略）
```

---

## 三、数据模型

### 3.1 实体清单

| 实体 | 标识 | 阶段 | 核心字段 | 说明 |
|------|------|------|---------|------|
| **Theme** | `themes` | 策划 | id, name, description, tags, aspectRatio, color, status | 创作主题/风格定义 |
| **Idea** | `ideas` | 策划 | id, title, summary, themeId, tags, refLinks, createdAt | 灵感记录 |
| **Topic** | `topics` | 选题 | id, ideaId, themeId, contentType, dueDate, status | 选题执行实例 |
| **Task** | `tasks` | 创作 | id, topicId, type, mode, status, brief, assignedAgent | 生产任务（已有） |
| **Asset** | `assets` | 创作 | id, taskId, topicId, filePath, fileName, type, mimeType, fileSize, status | 素材文件（已实现） |
| **Content** | `contents` | 创作 | id, taskId, topicId, title, content(Markdown), version, status | 文稿/文案（已实现，版本化管理） |
| **Package** | `packages` | 发布 | id, contentId, platformIds[], scheduledAt, status, publishedUrls | 发布包 |
| **Platform** | `platforms` | 配置 | id, name, type, publishConfig, apiConfig | 平台定义（已有雏形） |
| **Schedule** | `schedules` | 发布 | id, packageId, platformId, scheduledAt, status | 排期条目 |
| **PublishLog** | `publish-logs` | 发布 | id, packageId, platformId, publishedAt, url, status, error | 发布记录 |
| **Analytics** | `analytics` | 追踪 | id, packageId, platformId, date, metrics{views,likes,comments,shares} | 数据指标 |

### 3.2 核心关系图

```
Theme(1) ──→ Idea(N)       一个主题可以有多个灵感
Idea(1)  ──→ Topic(N)      一个灵感可以有多个选题（多平台适配）
Topic(1) ──→ Task(N)       一个选题可以拆分多个生产任务
Task(1)  ──→ Asset(N)      一个任务产出一个或多个素材
Task(1)  ──→ Content(N)    一个任务产出一个或多个文稿版本
Content(1)─→ Package(N)    一个内容可发往多个平台
Package(1)─→ PublishLog(N) 一个发布包产生多条发布记录
Package(1)─→ Analytics(N)  一个发布包有多条数据记录
```

### 3.3 存储设计

所有业务数据通过 `SchemaRegistry` + `DataRepository` 管理，统一存储在 `.database/business/` 库中：

```
.database/
├── databases.json
├── system/                 # 框架系统库（已有）
│   ├── db.json
│   ├── database/
│   └── table/
│
└── business/               # 业务库（全部 12 张表）
    ├── db.json             # 表清单
    ├── themes/             # 主题
    ├── ideas/              # 灵感
    ├── topics/             # 选题
    ├── tasks/              # 任务（月分片）
    ├── assets/             # 素材（月分片）
    ├── contents/           # 文稿（版本化管理）
    ├── packages/           # 发布包
    ├── platforms/          # 平台
    ├── schedules/          # 排期（月分片）
    ├── publish-logs/       # 发布日志（月分片）
    └── analytics/          # 数据分析（月分片）
```

### 3.4 完整 Schema 定义

#### ① themes

```json
{
  "id": "themes", "label": "主题", "displayField": "name",
  "shard": { "type": "none" },
  "fields": [
    { "id": "id", "type": "uuid", "isId": true },
    { "id": "name", "type": "string", "label": "主题名称", "required": true },
    { "id": "description", "type": "text", "label": "风格描述" },
    { "id": "tags", "type": "array", "label": "标签", "items": { "type": "string" } },
    { "id": "aspectRatio", "type": "string", "label": "画面比例", "defaultValue": "9:16" },
    { "id": "color", "type": "string", "label": "主题色" },
    { "id": "status", "type": "enum", "label": "状态", "enum": ["active", "archived"], "defaultValue": "active" },
    { "id": "createdAt", "type": "datetime", "autoSet": "created" },
    { "id": "updatedAt", "type": "datetime", "autoSet": "updated" }
  ]
}
```

#### ② ideas

```json
{
  "id": "ideas", "label": "灵感", "displayField": "title",
  "shard": { "type": "none" },
  "fields": [
    { "id": "id", "type": "uuid", "isId": true },
    { "id": "title", "type": "string", "label": "灵感标题" },
    { "id": "summary", "type": "text", "label": "思路描述" },
    { "id": "themeId", "type": "reference", "label": "关联主题", "ref": { "database": "business", "table": "themes" } },
    { "id": "tags", "type": "array", "label": "标签", "items": { "type": "string" } },
    { "id": "refLinks", "type": "array", "label": "参考链接", "items": { "type": "string" } },
    { "id": "status", "type": "enum", "label": "状态", "enum": ["active", "used", "archived"], "defaultValue": "active" },
    { "id": "createdAt", "type": "datetime", "autoSet": "created" },
    { "id": "updatedAt", "type": "datetime", "autoSet": "updated" }
  ]
}
```

#### ③ topics

```json
{
  "id": "topics", "label": "选题", "displayField": "title",
  "shard": { "type": "none" },
  "fields": [
    { "id": "id", "type": "uuid", "isId": true },
    { "id": "ideaId", "type": "reference", "label": "来源灵感", "ref": { "database": "business", "table": "ideas" } },
    { "id": "themeId", "type": "reference", "label": "关联主题", "ref": { "database": "business", "table": "themes" } },
    { "id": "title", "type": "string", "label": "选题标题", "required": true },
    { "id": "contentType", "type": "enum", "label": "内容形态", "enum": ["graphic", "video", "text"] },

    { "id": "dueDate", "type": "datetime", "label": "截止日期" },
    { "id": "status", "type": "enum", "label": "状态", "enum": ["draft", "in_progress", "completed", "cancelled"], "defaultValue": "draft" },
    { "id": "createdAt", "type": "datetime", "autoSet": "created" },
    { "id": "updatedAt", "type": "datetime", "autoSet": "updated" }
  ]
}
```

#### ④ tasks（月分片）

```json
{
  "id": "tasks", "label": "任务", "displayField": "title",
  "shard": { "type": "monthly" },
  "fields": [
    { "id": "id", "type": "uuid", "isId": true },
    { "id": "topicId", "type": "reference", "label": "关联选题", "ref": { "database": "business", "table": "topics" } },
    { "id": "title", "type": "string", "label": "任务标题" },
    { "id": "type", "type": "enum", "label": "任务类型", "enum": ["media", "copywriting", "compose"] },
    { "id": "mode", "type": "enum", "label": "执行模式", "enum": ["manual", "agent"], "defaultValue": "manual" },
    { "id": "status", "type": "enum", "label": "状态", "enum": ["initialized", "generating", "pending_review", "approved", "rejected"], "defaultValue": "initialized" },
    { "id": "brief", "type": "text", "label": "任务简述" },
    { "id": "assignedAgent", "type": "string", "label": "指定 Agent" },
    { "id": "createdAt", "type": "datetime", "autoSet": "created" },
    { "id": "updatedAt", "type": "datetime", "autoSet": "updated" }
  ]
}
```

#### ⑤ assets（月分片）

```json
{
  "id": "assets", "label": "素材", "displayField": "fileName",
  "shard": { "type": "monthly" },
  "fields": [
    { "id": "id", "type": "uuid", "isId": true },
    { "id": "taskId", "type": "reference", "label": "来源任务", "ref": { "database": "business", "table": "tasks" } },
    { "id": "filePath", "type": "string", "label": "文件路径", "required": true },
    { "id": "fileName", "type": "string", "label": "文件名" },
    { "id": "type", "type": "enum", "label": "素材类型", "enum": ["image", "video", "audio", "document"] },
    { "id": "mimeType", "type": "string", "label": "MIME 类型" },
    { "id": "fileSize", "type": "number", "label": "文件大小（字节）" },
    { "id": "meta", "type": "json", "label": "扩展元数据" },
    { "id": "pipelineStage", "type": "string", "label": "流水线阶段" },
    { "id": "status", "type": "enum", "label": "状态", "enum": ["draft", "pending_review", "approved", "rejected"], "defaultValue": "draft" },
    { "id": "agentTaskId", "type": "string", "label": "Agent 任务 UUID" },
    { "id": "createdAt", "type": "datetime", "autoSet": "created" },
    { "id": "updatedAt", "type": "datetime", "autoSet": "updated" }
  ]
}
```

#### ⑥ contents（文稿，替代原 scripts）

```json
{
  "id": "contents", "label": "文稿", "displayField": "title",
  "shard": { "type": "none" },
  "fields": [
    { "id": "id", "type": "uuid", "isId": true },
    { "id": "taskId", "type": "reference", "label": "来源任务", "ref": { "database": "business", "table": "tasks" } },
    { "id": "topicId", "type": "reference", "label": "关联选题", "ref": { "database": "business", "table": "topics" } },
    { "id": "title", "type": "string", "label": "文稿标题" },
    { "id": "content", "type": "text", "label": "正文（Markdown）" },
    { "id": "version", "type": "number", "label": "版本号", "defaultValue": 1 },
    { "id": "status", "type": "enum", "label": "状态", "enum": ["draft", "finalized"], "defaultValue": "draft" },
    { "id": "createdAt", "type": "datetime", "autoSet": "created" },
    { "id": "updatedAt", "type": "datetime", "autoSet": "updated" }
  ]
}
```

#### ⑧ packages

```json
{
  "id": "packages", "label": "发布包", "displayField": "title",
  "shard": { "type": "none" },
  "fields": [
    { "id": "id", "type": "uuid", "isId": true },
    { "id": "contentId", "type": "reference", "label": "关联内容", "ref": { "database": "business", "table": "contents" } },
    { "id": "title", "type": "string", "label": "发布标题" },
    { "id": "platformIds", "type": "array", "label": "目标平台", "items": { "type": "reference", "ref": { "database": "business", "table": "platforms" } } },
    { "id": "scheduledAt", "type": "datetime", "label": "排期时间" },
    { "id": "status", "type": "enum", "label": "状态", "enum": ["draft", "scheduled", "publishing", "published", "partially_published", "failed"], "defaultValue": "draft" },
    { "id": "createdAt", "type": "datetime", "autoSet": "created" },
    { "id": "updatedAt", "type": "datetime", "autoSet": "updated" }
  ]
}
```

#### ⑨ platforms

```json
{
  "id": "platforms", "label": "平台", "displayField": "name",
  "shard": { "type": "none" },
  "fields": [
    { "id": "id", "type": "uuid", "isId": true },
    { "id": "name", "type": "string", "label": "平台名称", "required": true },
    { "id": "slug", "type": "string", "label": "标识符" },
    { "id": "type", "type": "enum", "label": "平台类型", "enum": ["xiaohongshu", "douyin", "bilibili", "weixin", "weibo", "other"] },
    { "id": "publishTypes", "type": "array", "label": "支持发布类型", "items": { "type": "string" } },
    { "id": "enabled", "type": "boolean", "label": "是否启用", "defaultValue": true },
    { "id": "publishConfig", "type": "json", "label": "发布配置" },
    { "id": "apiConfig", "type": "json", "label": "API 配置" },
    { "id": "createdAt", "type": "datetime", "autoSet": "created" },
    { "id": "updatedAt", "type": "datetime", "autoSet": "updated" }
  ]
}
```

#### ⑩ schedules（月分片）

```json
{
  "id": "schedules", "label": "排期", "displayField": "id",
  "shard": { "type": "monthly" },
  "fields": [
    { "id": "id", "type": "uuid", "isId": true },
    { "id": "packageId", "type": "reference", "label": "关联发布包", "ref": { "database": "business", "table": "packages" } },
    { "id": "platformId", "type": "reference", "label": "发布平台", "ref": { "database": "business", "table": "platforms" } },
    { "id": "scheduledAt", "type": "datetime", "label": "排期时间", "required": true },
    { "id": "status", "type": "enum", "label": "状态", "enum": ["pending", "publishing", "completed", "failed", "cancelled"], "defaultValue": "pending" },
    { "id": "createdAt", "type": "datetime", "autoSet": "created" },
    { "id": "updatedAt", "type": "datetime", "autoSet": "updated" }
  ]
}
```

#### ⑪ publish-logs（月分片）

```json
{
  "id": "publish-logs", "label": "发布日志", "displayField": "id",
  "shard": { "type": "monthly" },
  "fields": [
    { "id": "id", "type": "uuid", "isId": true },
    { "id": "packageId", "type": "reference", "label": "关联发布包", "ref": { "database": "business", "table": "packages" } },
    { "id": "platformId", "type": "reference", "label": "发布平台", "ref": { "database": "business", "table": "platforms" } },
    { "id": "scheduledAt", "type": "datetime", "label": "计划发布时间" },
    { "id": "publishedAt", "type": "datetime", "label": "实际发布时间" },
    { "id": "url", "type": "string", "label": "发布链接" },
    { "id": "status", "type": "enum", "label": "状态", "enum": ["scheduled", "publishing", "success", "failed"], "defaultValue": "scheduled" },
    { "id": "error", "type": "text", "label": "错误信息" },
    { "id": "retryCount", "type": "number", "label": "重试次数", "defaultValue": 0 },
    { "id": "createdAt", "type": "datetime", "autoSet": "created" },
    { "id": "updatedAt", "type": "datetime", "autoSet": "updated" }
  ]
}
```

#### ⑫ analytics（月分片）

```json
{
  "id": "analytics", "label": "数据", "displayField": "recordedAt",
  "shard": { "type": "monthly" },
  "fields": [
    { "id": "id", "type": "uuid", "isId": true },
    { "id": "packageId", "type": "reference", "label": "关联发布包", "ref": { "database": "business", "table": "packages" } },
    { "id": "platformId", "type": "reference", "label": "数据来源平台", "ref": { "database": "business", "table": "platforms" } },
    { "id": "recordedAt", "type": "datetime", "label": "数据日期", "required": true },
    { "id": "views", "type": "number", "label": "浏览量", "defaultValue": 0 },
    { "id": "likes", "type": "number", "label": "点赞数", "defaultValue": 0 },
    { "id": "comments", "type": "number", "label": "评论数", "defaultValue": 0 },
    { "id": "shares", "type": "number", "label": "分享数", "defaultValue": 0 },
    { "id": "favorites", "type": "number", "label": "收藏数", "defaultValue": 0 },
    { "id": "raw", "type": "json", "label": "原始 JSON 数据" },
    { "id": "createdAt", "type": "datetime", "autoSet": "created" },
    { "id": "updatedAt", "type": "datetime", "autoSet": "updated" }
  ]
}
```

---

## 四、HermesAgent 集成设计

### 4.1 架构边界

扩展与 HermesAgent 的交互机制分为两层：

```
framework/core/AgentTaskPoller.js         business/agent/
                                      ┌──────────────────────────────────┐
  ┌────────────────────────────┐       │                                  │
  │  传输层（框架能力）           │       │  业务任务层（业务逻辑）            │
  │                            │       │                                  │
  │  .agent/tasks/ → job.json  │       │  brief.md 内容生成               │
  │  .agent/processing/        │       │  ├─ comfyui-generate             │
  │  .agent/results/ → result  │       │  ├─ ai-copywrite                 │
  │                            │       │  ├─ ai-compose                   │
  │  scan() / pickup()         │       │  ├─ publish                      │
  │  deliver() / collect()     │──────▶│  └─ collect-analytics            │
  │                            │       │                                  │
  │  job.json 读写             │       │  result.md 解析 + 按类型派发      │
  │  队列管理（mv 打标/清理）    │       │  ├─ 注册 handler: type → fn      │
  │                            │       │  ├─ 更新 Task 状态               │
  │  不解析 brief.md           │       │  ├─ 创建 Asset/Script 记录        │
  │  不解析 result.md 内容      │       │  └─ 触发 UI 刷新                 │
  └────────────────────────────┘       │                                  │
                                       └──────────────────────────────────┘
                                            ↑
                                     业务层注册表，每种 type 一个 handler
```

- **框架层**：`AgentTaskPoller` 只负责文件搬移、队列生命周期、结果清理
- **业务层**：`business/agent/` 负责任务简报生成、结果解析、业务回填

### 4.2 任务传输协议

采用**双文件设计**——`job.json`（机器索引）+ `brief.md`（人类/LLM 可读的任务简报）。

#### 4.2.1 目录结构

```
.agent/tasks/<uuid>/
├── job.json              ← 薄元数据（扩展快速扫描）
├── brief.md              ← 完整任务简报（Agent 读取执行）
└── files/                ← 参考附件（可选）
    ├── workflow.json
    └── reference.png

.agent/processing/<uuid>/ ← Agent 拾取后 mv 至此

.agent/results/<uuid>/
└── result.md             ← YAML frontmatter + Markdown 正文
```

#### 4.2.2 job.json（机器索引）

只存索引字段，供扩展 scan() 快速扫描任务队列：

```json
{
  "type": "comfyui-generate",
  "taskId": "a1b2c3d4-...",
  "status": "pending",
  "createdAt": "2026-07-14T10:00:00.000Z"
}
```

#### 4.2.3 brief.md（任务简报）

YAML frontmatter 做结构化标记，正文用自然语言描述任务要求。
Agent（LLM 驱动）直接读取整份文档理解任务。

```markdown
---
type: comfyui-generate
taskId: a1b2c3d4-...
createdAt: 2026-07-14T10:00:00.000Z
---

# 素材生成任务

## 规范说明

作为 HermesAgent，请严格按以下规范执行：

### 输入
- 本目录下 `files/` 中可能包含参考文件
- 任务参数在下方「任务要求」中

### 输出要求
请创建 `result.md`，格式如下：

```markdown
---
success: true/false
summary: 一句话描述
files:
  - 路径1
  - 路径2
metadata: {}
---
执行详情...
```

### 注意事项
- 生成的素材文件放在本目录下
- 不要修改 brief.md

## 任务要求

生成 3 张赛博朋克风格手机壁纸，参考 files/workflow.json
```

#### 4.2.4 result.md（结果报告）

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

#### 4.2.5 YAML frontmatter 解析（扩展侧）

扩展 `collect()` 时只需解析 result.md 的 YAML frontmatter 即可获取结构化数据，不需要第三方库：

```javascript
function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { frontmatter: {}, body: md };
  // 解析 key: value 和 - array 条目
  // 返回 { success, summary, files[], ... }
}
```

### 4.3 业务任务类型

| 类型 | 用途 | 输入 (brief.md) | 输出 (result.md frontmatter) |
|------|------|-----------------|------------------------------|
| `comfyui-generate` | ComfyUI 图片/视频生成 | prompt, workflow, 主题, 数量 | files: [图片路径], seeds: [] |
| `ai-copywrite` | AI 文案撰写/改写 | 主题, 平台, 风格, 参考素材 | versions: [{title, body}] |
| `ai-compose` | AI 自动编排内容 | assets[], script, template | content: {...} |
| `publish` | 自动发布到平台 | contentId, 平台配置, 排期时间 | results: [{platform, url}] |
| `collect-analytics` | 采集各平台数据 | 发布链接/packageId, 平台 | metrics: {views, likes, ...} |

### 4.4 通信流程

```
扩展侧                                      Agent 侧
─────                                      ────────
1. 业务层创建 Task（mode=agent）
   业务层组装 brief.md
   传输层写入 job.json + brief.md
   到 .agent/tasks/<uuid>/
                                      ↓
                                 2. Agent 轮询 scan
                                    → 发现 tasks/（读 job.json）
                                      ↓
                                 3. mv → processing/（防重复拾取）
                                      ↓
                                 4. Agent 读取 brief.md 执行任务
                                    ├ 调用 ComfyUI / LLM API
                                    └ 保存产出文件
                                      ↓
                                 5. Agent 写入 result.md
                                    到 .agent/results/<uuid>/
   ↑
6. 传输层 collect()
   → 采集 results/
   → 返回 result.md 文本
   → 清理 results/<uuid>/
   ↓
7. 业务层按 type 派发 handler
   → 解析 result.md frontmatter
   → 创建 Asset / 更新 Task 状态
   → 触发 UI 刷新
```

### 4.5 自动回填闭环示例

以 ComfyUI 素材生成为例：

```
用户在看板点击「AI 生成素材」
  │
  ├─ 1. 业务层创建 Task（mode=agent, status=generating）
  ├─ 2. 业务层组装 brief.md + 传输层写入 .agent/tasks/<uuid>/
  │
  ├─ 3. HermesAgent 拾取 → 调用 ComfyUI → 生成图片
  │
  ├─ 4. 传输层 collect() 采集到结果
  ├─ 5. 业务层 handler('comfyui-generate') 派发
  │     ├─ 解析 result.md → 获取图片路径
  │     ├─ 创建 Asset 记录，关联 Task
  │     ├─ 更新 Task.status → pending_review
  │     └─ 通知 UI 刷新
  │
  └─ 6. 看板刷新 → 新素材出现在「待审核」列
```

### 4.6 实现规划

| 组件 | 位置 | 状态 |
|------|------|------|
| AgentTaskPoller（传输层） | `framework/core/AgentTaskPoller.js` | ✅ 已有雏形，需适配双文件协议 |
| YAML frontmatter 解析 | `framework/utils/` 或 `business/agent/` | ❌ 待实现 |
| brief.md 生成器 | `business/agent/briefs/` | ❌ 待实现 |
| 结果派发器 | `business/agent/dispatcher.js` | ❌ 待实现 |
| 各 type handler | `business/agent/handlers/` | ❌ 待实现 |

---

## 五、视图与业务模块规划

### 5.1 当前视图清单

当前 manifest 注册 7 个视图，3 个菜单组：

```
选题策划: 灵感 / 选题 / 主题
生产流程: 看板 / 审核 / 任务 / 素材
系统管理: 数据库
```

| 视图 | 路由 | 数据源 | 状态 |
|------|------|--------|------|
| KanbanBoard | `#kanban` | taskRepo | ✅ 已迁移到 DataRepository |
| ReviewMode | `#review` | taskRepo | ✅ 已迁移到 DataRepository |
| TasksView | `#tasks` | taskRepo + repo | ✅ 已迁移，含 TaskDetail |
| AssetGallery | `#assets` | assetRepo | ✅ 已实现，含 AssetCard |
| IdeaBoard | `#ideas` | repo ideas | ✅ 已实现（策划模块） |
| TopicBoard | `#topics` | repo topics | ✅ 已实现（策划模块） |
| ThemeStrategy | `#themes` | repo themes | ✅ 已实现（策划模块） |
| ContentEditor | 内嵌于 TaskDetail | contentRepo | ✅ 已实现（Markdown 编辑） |
| DatabaseManager | `#database` | SchemaRegistry | ✅ 系统管理 |

### 5.2 待建视图（未来阶段）

| 视图 | 路由 | 职责 |
|------|------|------|
| **发布包管理** (PackageManager) | `#publish` | 内容编排 + 多平台发布 |
| **平台配置** (PlatformConfig) | `#platforms` | 发布平台 CRUD |
| **发布日历** (PublishCalendar) | `#calendar` | 排期月/周视图 |
| **数据看板** (Dashboard) | `#dashboard` | Analytics 展示 + 爆款检测 |

---

## 六、实施路线

### 阶段一：策划模块（✅ 已完成）

- `business` 库创建，themes/ideas/topics 三张表注册
- ThemeStrategy 视图（主题库：增删改查）
- IdeaBoard 视图（灵感随手记 + 筛选）
- TopicBoard 视图（选题面板：从 Idea 创建 Topic）

### 阶段二：创作模块（✅ 已完成）

- 创作模块迁移到 DataRepository（TasksView/KanbanBoard/ReviewMode）
- AssetGallery 视图（素材网格 + 上传/筛选/删除）
- ContentEditor 视图（Markdown 分屏编辑 + 版本管理）
- TaskDetail 视图（任务 + 素材 + 文稿统一管理）
- `scripts` 表 → `contents` 表重命名

### 阶段三：发布模块（待开发）

1. Package 发布包管理
2. Platform 平台配置
3. PublishCalendar 发布日历

### 阶段四：Agent 集成（待开发）

1. ComfyUI 素材生成闭环
2. AI 文案辅助
3. 自动发布

### 阶段五：分析与优化（待开发）

1. Analytics 数据采集
2. Dashboard 展示
3. 爆款检测与策略反馈

---

## 七、设计原则

1. **数据驱动** — 所有业务数据通过 SchemaRegistry + DataRepository 管理，不做直接文件 I/O
2. **渐进自动化** — 手工模式和 Agent 模式共存，用户可按需选择自动化程度
3. **闭环反馈** — 数据追踪结果反哺选题策略，形成持续优化循环
4. **轻量无侵入** — 不强制用户改变习惯，灵感记录要极快，创作流程要灵活
5. **扩展性** — 数据模型支持未来增加内容形态（音频、直播等）和更多平台

---

> 本文档与 `ARCHITECTURE.md`（架构设计）互补：
> - ARCHITECTURE.md → 系统架构、框架能力、技术约束
> - DESIGN.md （本文）→ 产品定位、业务模型、用户流程、数据定义
