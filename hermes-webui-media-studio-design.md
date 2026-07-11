# Hermes WebUI Media Studio 扩展

## 自媒体内容生产管线 — 需求方案与架构设计

> 版本：v1.0  
> 日期：2026-07-11  
> 目标项目：nesquena/hermes-webui (Extension 机制) + Hermes Agent (Plugin 机制)

---

## 1. 项目背景与目标

### 1.1 背景

用户当前通过 ComfyUI 手工配置文生图/文生视频工作流，导出 API JSON 后由 Hermes Agent 调用生成素材。素材按主题（手机壁纸、电脑壁纸、童话仙境等）分目录存放，经过人工审核、排期、文案撰写后，手动在各平台（头条、小红书等）发布。

现有流程存在以下痛点：
- **目录结构随时间爆炸**：每个主题 × 4 个状态目录，查找困难
- **审核是考古式操作**：无缩略图网格、无批量操作、无键盘快捷键
- **发布是纯体力搬运**：无"发布包"概念，多平台需不同文案格式
- **无数据回流闭环**：发布后无法追踪表现，无法数据驱动优化
- **素材与元数据分离**：ComfyUI 生成参数（seed、prompt）与图片文件分离，爆款难以复刻

### 1.2 目标

基于 Hermes WebUI 的 **Extension 机制**（纯前端）和 Hermes Agent 的 **Plugin 机制**（后端能力），构建一个"自媒体内容生产驾驶舱"，将"文件管理"升级为"生产流水线"。

核心设计原则：
- **Workspace 即数据库**：所有数据以纯文件（Markdown + JSON + 素材）形式存在，天然可 Git 版本控制
- **元数据驱动状态**：用 `.meta.json` sidecar 文件标记素材状态，物理路径永不改变
- **看板视图替代目录浏览**：聚合所有主题的待审核素材，支持批量操作
- **发布包概念**：素材 + 文案 + 平台模板 = 一键生成的发布就绪文件
- **数据闭环**：手动录入发布后数据，自动分析主题表现与爆款复刻

---

## 2. 需求方案

### 2.1 功能需求

#### FR-01 工作流管理
- 在扩展中浏览 `configs/workflows/` 目录下的 ComfyUI API JSON 文件
- 预览工作流参数（模型、分辨率、采样步数等）
- 一键触发 Agent 批量生成素材（指定主题、数量、变体策略）

#### FR-02 看板视图（Kanban）
- 四列看板：生成中 / 待审核 / 已审核 / 发布日历
- 支持按主题筛选（手机壁纸、电脑壁纸、童话仙境等）
- 支持按日期范围筛选
- 素材卡片显示：缩略图、主题标签、生成参数摘要

#### FR-03 审核模式
- 网格缩略图浏览（所有主题混排，可筛选）
- 批量选择 + 键盘快捷键：`1`=通过，`2`=删除，`3`=稍后，`4`=标星，`5`=备注
- 悬停预览大图，显示完整生成参数（seed、prompt、workflow 来源）
- 相似素材分组（同一工作流+seed 变体自动聚类）

#### FR-04 发布包生成
- 选择已审核素材 + 文案 → 生成平台专用发布包
- 发布包为 Markdown 文件，包含：
  - Frontmatter：平台、标题、标签、封面、素材列表
  - 正文：根据平台模板自动排版
- 支持多平台模板：头条、小红书、抖音、知乎等

#### FR-05 发布日历
- 以日历形式展示排期（日/周视图）
- 拖拽发布包到指定日期
- 发布完成后一键标记，自动归档

#### FR-06 数据看板
- 主题表现统计：发布量、平均互动、爆款数量
- 爆款素材复刻：查看爆款参数（seed、workflow、prompt），一键生成同参数变体
- 发布历史时间线

#### FR-07 主题策略中心
- 管理主题配置（theme.json）：风格、标签、最佳发布时间、提示词模板
- 主题表现对比
- 主题素材库存量预警

#### FR-08 素材母库
- 所有素材物理归档在 `archive/YYYY/MM/`
- 支持全局搜索（按主题、标签、prompt 关键词、日期）
- 支持素材复用（一张素材可配多份文案，用于不同平台/A-B 测试）

### 2.2 非功能需求

| 编号 | 需求 | 说明 |
|------|------|------|
| NFR-01 | 纯前端扩展 | 基于 WebUI Extension 机制，零后端代码，通过现有 Workspace API 操作文件 |
| NFR-02 | 可逆性 | 卸载扩展时只需移除环境变量，不污染 WebUI 核心，不丢失数据 |
| NFR-03 | 命名空间隔离 | CSS 类名、DOM ID 使用 `ms-` 前缀，避免与 WebUI 冲突 |
| NFR-04 | 离线可用 | 不依赖外部 CDN，所有资源本地 served |
| NFR-05 | 版本兼容 | 支持 Hermes WebUI >= v0.50.0 |
| NFR-06 | 响应式 | 支持桌面端（主要场景）和移动端基础浏览 |
| NFR-07 | 可扩展性 | 架构预留 Agent Plugin 对接点，未来可自动发布、自动数据分析 |

---

## 3. 架构设计

### 3.1 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Hermes WebUI                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Media Studio Extension (纯前端)                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │   │
│  │  │ 看板视图  │  │ 审核模式  │  │ 发布日历  │  │数据看板│  │   │
│  │  │ Kanban   │  │ Review   │  │ Calendar │  │ Stats  │  │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │   │
│  │       │             │             │            │       │   │
│  │  ┌────┴─────────────┴─────────────┴────────────┘       │   │
│  │  │         Workspace API Client (fetch)                │   │
│  │  │  /api/workspace/tree  /api/workspace/file           │   │   │
│  │  └─────────────────────┬───────────────────────────────┘   │   │
│  └────────────────────────┼───────────────────────────────────┘   │
│                           │                                       │
│  ┌────────────────────────┼───────────────────────────────────┐   │
│  │  Hermes Agent (后端)    │  ← 未来对接 Agent Plugin          │   │
│  │  ┌─────────────────────┴───────────────────────────────┐   │   │
│  │  │  Plugin: media-studio-agent                          │   │   │
│  │  │  • 调用 ComfyUI API 批量生成素材                     │   │   │
│  │  │  • 自动生成平台文案（头条/小红书风格）                  │   │   │
│  │  │  • 发布数据抓取与统计分析                             │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Workspace File System                      │
│  ~/workspace/media-studio/                                      │
│  ├── configs/  ├── assets/  ├── pipeline/  ├── archive/      │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 目录结构（Workspace 约定）

```
media-studio/
├── configs/                         # 配置层（主题、平台、工作流统一管理）
│   ├── themes/{name}/
│   │   ├── theme.json               # 主题配置（风格、标签、prompt）
│   │   └── prompt-template.md       # 生成提示词模板
│   ├── platforms/{name}.json        # 平台发布配置（模板、标签、规则）
│   └── workflows/{name}.json        # ComfyUI API JSON 工作流
├── assets/                          # 集中化素材池（物理文件永不移动）
│   └── {YYYY}/{MM}/{DD}/
│       └── {theme}__{HHmmss}__{seq}.{ext}
│       └── {theme}__{HHmmss}__{seq}.{ext}.meta.json
├── pipeline/                        # 流水线视图层（基于 .ref 引用文件，不移动真实文件）
│   ├── 01-generating/
│   ├── 02-pending-review/
│   ├── 03-approved/
│   ├── 04-scheduled/
│   │   └── 2026-07-11/
│   │       ├── 头条-童话仙境.md     # 发布包
│   │       └── 小红书-手机壁纸.md
│   └── 05-published/
│       └── {filename}.ref           # → {"asset": "assets/YYYY/MM/DD/file.png"}
├── archive/{theme}/{YYYY}/{MM}/      # 发布归档（按主题+日期分层）
├── .trash/                          # 回收站（可恢复删除）
└── .index/                          # 可扩展分层索引
    ├── manifest.json                # 全局清单
    ├── pipeline.json                # 流水线状态索引
    └── {YYYY}/{MM}/assets.json      # 月度分片索引
```

### 3.3 数据模型

#### 3.3.1 素材元数据（Sidecar）

每张素材 `xxx.png` 旁边放置 `xxx.png.meta.json`：

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "童话仙境-20260711-001.png",
  "theme": "童话仙境",
  "workflow": "童话仙境-文生图.json",
  "generation": {
    "prompt": "a magical fairy tale forest, golden hour lighting, floating particles, dreamy atmosphere, 8k uhd",
    "negative_prompt": "blurry, low quality, watermark",
    "seed": 42,
    "width": 1024,
    "height": 1024,
    "sampler": "dpmpp_2m",
    "steps": 30,
    "cfg": 7.5,
    "model": "sdxl_base",
    "generated_at": "2026-07-11T14:32:00Z"
  },
  "status": "approved",
  "status_history": [
    { "status": "generating", "changed_at": "2026-07-11T14:30:00Z", "note": "Agent 开始生成" },
    { "status": "pending-review", "changed_at": "2026-07-11T14:32:00Z", "note": "生成完成" },
    { "status": "approved", "changed_at": "2026-07-11T16:00:00Z", "note": "色调偏暖，适合傍晚发布" }
  ],
  "review": {
    "rating": 4,
    "note": "色调偏暖，适合傍晚发布",
    "tags": ["治愈", "森林", "金色"],
    "reviewed_at": "2026-07-11T16:00:00Z"
  },
  "linked_copy": [
    "pipeline/04-scheduled/2026-07-11/头条-童话仙境.md"
  ],
  "publish_history": [
    {
      "platform": "头条",
      "date": "2026-07-11",
      "title": "这5张童话仙境壁纸，治愈了我一整周",
      "url": "https://www.toutiao.com/article/xxx",
      "stats": {
        "views": 12500,
        "likes": 450,
        "comments": 32,
        "shares": 89,
        "collections": 120
      },
      "published_at": "2026-07-11T18:00:00Z"
    }
  ],
  "is_starred": false,
  "created_at": "2026-07-11T14:32:00Z",
  "updated_at": "2026-07-11T18:00:00Z"
}
```

#### 3.3.2 主题配置

```json
{
  "name": "童话仙境",
  "slug": "fairy-tale-wonderland",
  "description": "梦幻、治愈、童话风格的视觉内容",
  "category": "壁纸",
  "style": {
    "color_primary": "#d4a574",
    "color_secondary": "#8b9dc3",
    "color_background": "#1a1a2e",
    "font_heading": "serif",
    "font_body": "sans-serif",
    "mood": ["dreamy", "warm", "magical"]
  },
  "generation": {
    "default_workflow": "童话仙境-文生图.json",
    "default_prompt_template": "prompt-template.md",
    "recommended_seeds": [42, 123, 456],
    "variations_per_batch": 4
  },
  "publishing": {
    "best_hours": [18, 20, 21],
    "recommended_platforms": ["头条", "小红书"],
    "tags": ["童话", "仙境", "治愈", "壁纸", "梦幻"]
  },
  "performance": {
    "total_published": 12,
    "total_views": 156000,
    "average_engagement_rate": 0.038,
    "top_performing": ["童话仙境-20260701-003.png"],
    "last_updated": "2026-07-11T00:00:00Z"
  }
}
```

#### 3.3.3 发布包（Markdown）

```markdown
---
platform: "头条"
theme: "童话仙境"
title: "这5张童话仙境壁纸，治愈了我一整周"
subtitle: ""
tags: ["童话", "壁纸", "治愈系", "4K", "仙境"]
cover: "archive/2026/07/童话仙境-20260711-001.png"
assets:
  - "archive/2026/07/童话仙境-20260711-001.png"
  - "archive/2026/07/童话仙境-20260711-002.png"
  - "archive/2026/07/童话仙境-20260711-003.png"
  - "archive/2026/07/童话仙境-20260711-004.png"
  - "archive/2026/07/童话仙境-20260711-005.png"
status: "scheduled"
scheduled_at: "2026-07-11T18:00:00Z"
published_at: null
url: null
---

# 这5张童话仙境壁纸，治愈了我一整周

最近压力大的时候，就爱盯着这些画面发呆...

每一张都像走进了童话书里，金色的光斑、漂浮的粒子、梦幻的森林。

[图片1]
[图片2]
[图片3]
[图片4]
[图片5]

你最喜欢哪一张？评论区告诉我 👇

---

#童话仙境 #壁纸分享 #治愈系 #4K壁纸 #梦幻
```

#### 3.3.4 平台模板

```json
{
  "platform": "头条",
  "name": "今日头条",
  "template": {
    "title_max_length": 30,
    "title_style": "悬念式/数字式",
    "body_format": "markdown",
    "image_count": "3-9",
    "image_aspect_ratio": "16:9",
    "tag_style": "#话题",
    "cta": "你最喜欢哪一张？评论区告诉我 👇"
  },
  "default_tags": ["壁纸", "治愈", "4K"],
  "banned_words": ["最", "第一", "顶级"],
  "best_publish_hours": [7, 12, 18, 21]
}
```

### 3.4 状态流转

```
┌─────────────┐     Agent 生成      ┌─────────────┐
│   工作流     │ ─────────────────→ │   生成中     │
│  (workflow) │                    │ (generating)│
└─────────────┘                    └──────┬──────┘
                                        │ 生成完成
                                        ▼
                              ┌─────────────┐
                              │  待审核      │
                              │(pending-   │
                              │  review)    │
                              └──────┬──────┘
                                     │ 审核操作
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
              ┌─────────┐    ┌─────────┐    ┌─────────┐
              │  通过   │    │  删除   │    │  稍后   │
              │(approved)│    │(deleted)│    │(deferred)│
              └────┬────┘    └─────────┘    └─────────┘
                   │
                   ▼
            ┌─────────────┐
            │  已审核素材库 │
            │  (approved)   │
            └──────┬──────┘
                   │ 选择素材 + 文案
                   ▼
            ┌─────────────┐
            │  发布包生成   │
            │  (package)   │
            └──────┬──────┘
                   │ 排期
                   ▼
            ┌─────────────┐
            │  待发布      │
            │ (scheduled)  │
            └──────┬──────┘
                   │ 手动发布到平台
                   ▼
            ┌─────────────┐
            │  已发布      │
            │ (published)  │
            └──────┬──────┘
                   │ 录入数据
                   ▼
            ┌─────────────┐
            │  数据归档    │
            │  (archived)  │
            └─────────────┘
```

**关键规则**：
- 素材物理路径在 `archive/YYYY/MM/` 中永不改变
- `pipeline/` 各阶段目录中存放的是 **.ref 引用文件（JSON 格式）**，不是真实文件移动。每个 .ref 文件内容为 `{"asset": "assets/YYYY/MM/DD/theme__HHmmss__seq.ext"}`，指向 `assets/` 中的真实文件。这确保了物理文件的集中管理和流水线状态的灵活编排
- 状态变更只修改 `.meta.json` 中的 `status` 字段，记录 `status_history`
- 删除操作：物理文件移至 `.trash/`（可恢复），或从 `archive/` 彻底删除（可选）

---

## 4. 界面设计

### 4.1 核心视图

#### 视图 A：看板（Kanban）—— 默认首页

```
┌────────────────────────────────────────────────────────────────────┐
│  🎬 Media Studio                              [看板] [审核] [日历] [数据] │
├────────────────────────────────────────────────────────────────────┤
│  筛选: [全部主题 ▼] [手机壁纸 ✓] [电脑壁纸 ✓] [童话仙境 ✓]  [日期: 本周 ▼] │
│  搜索: [输入关键词搜索素材...]                    [🔍] [⚡ 批量生成] [📦 新建发布包] │
├──────────────────┬──────────────────┬──────────────────┬──────────────┤
│  🔄 生成中 (3)   │  🔍 待审核 (12)  │  ✅ 已审核 (28)  │  📅 排期 (5) │
│                  │                  │                  │              │
│  ┌────────────┐ │  ┌────────────┐ │  ┌────────────┐ │  07/11       │
│  │ [生成动画]  │ │  │ [缩略图]   │ │  │ [缩略图]   │ │  ├─ 头条×2   │
│  │ 童话仙境    │ │  │ 手机壁纸   │ │  │ 电脑壁纸   │ │  ├─ 小红书×1 │
│  │ 进度: 60%  │ │  │ 1:通过 2:删│ │  │ [加入排期] │ │  07/12       │
│  │ [取消]     │ │  │ 3:稍后 4:星│ │  │ [查看详情] │ │  ├─ 抖音×2   │
│  └────────────┘ │  └────────────┘ │  └────────────┘ │              │
│                  │                  │                  │              │
│  ┌────────────┐ │  ┌────────────┐ │  ┌────────────┐ │              │
│  │ [生成动画]  │ │  │ [缩略图]   │ │  │ [缩略图]   │ │              │
│  │ 手机壁纸    │ │  │ 童话仙境   │ │  │ 童话仙境   │ │              │
│  │ 进度: 30%  │ │  │ 1:通过 2:删│ │  │ [加入排期] │ │              │
│  └────────────┘ │  └────────────┘ │  └────────────┘ │              │
│                  │                  │                  │              │
└──────────────────┴──────────────────┴──────────────────┴──────────────┘
```

**交互**：
- 拖拽素材卡片在列间移动（待审核 → 已审核）
- 悬停卡片显示大图浮层 + 生成参数
- 点击卡片进入详情/预览模式

#### 视图 B：审核模式 —— 沉浸式审核

```
┌────────────────────────────────────────────────────────────────────┐
│  🔍 审核模式                      12 张待审核  主题: [全部 ▼]  [退出审核] │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │          │  │          │  │          │  │          │         │
│  │  大图    │  │  大图    │  │  大图    │  │  大图    │         │
│  │          │  │          │  │          │  │          │         │
│  │ 童话仙境 │  │ 手机壁纸 │  │ 童话仙境 │  │ 电脑壁纸 │         │
│  │ ⭐ 4.5   │  │ ⭐ 3.0   │  │ ⭐ 5.0   │  │ ⭐ 2.5   │         │
│  │ [1:通过] │  │ [1:通过] │  │ [1:通过] │  │ [1:通过] │         │
│  │ [2:删除] │  │ [2:删除] │  │ [2:删除] │  │ [2:删除] │         │
│  │ [3:稍后] │  │ [3:稍后] │  │ [3:稍后] │  │ [3:稍后] │         │
│  │ [4:标星] │  │ [4:标星] │  │ [4:标星] │  │ [4:标星] │         │
│  │ [5:备注] │  │ [5:备注] │  │ [5:备注] │  │ [5:备注] │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│                                                                    │
│  选中: 3 张  [批量通过] [批量删除] [批量标星] [批量加入排期]            │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**快捷键**：
- `1` / `Space`：通过
- `2` / `Delete`：删除
- `3`：稍后
- `4` / `S`：标星
- `5` / `N`：添加备注
- `→` / `←`：切换选中
- `Enter`：全屏预览
- `Esc`：退出审核模式

#### 视图 C：发布包编辑器

```
┌────────────────────────────────────────────────────────────────────┐
│  📦 新建发布包                                        [保存] [取消] │
├────────────────────────────────────────────────────────────────────┤
│  平台: [头条 ▼]  主题: [童话仙境 ▼]  发布日期: [2026-07-11 ▼] 18:00 │
│                                                                    │
│  标题: [这5张童话仙境壁纸，治愈了我一整周                    ]      │
│  副标题: [                                                  ]      │
│                                                                    │
│  已选素材 (5):                                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ [缩略图]│ │ [缩略图]│ │ [缩略图]│ │ [缩略图]│ │ [缩略图]│          │
│  │ 设为封面│ │       │ │       │ │       │ │       │          │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘          │
│  [+ 添加素材]                                                      │
│                                                                    │
│  正文:                                                             │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 最近压力大的时候，就爱盯着这些画面发呆...                    │    │
│  │                                                            │    │
│  │ 每一张都像走进了童话书里，金色的光斑、漂浮的粒子...          │    │
│  │                                                            │    │
│  │ [图片1] [图片2] [图片3] [图片4] [图片5]                      │    │
│  │                                                            │    │
│  │ 你最喜欢哪一张？评论区告诉我 👇                              │    │
│  └────────────────────────────────────────────────────────────┘    │
│  [AI 生成文案]  [应用模板]  [预览]                                  │
│                                                                    │
│  标签: #童话 #仙境 #治愈 #壁纸 #梦幻                                │
│  [AI 推荐标签]                                                     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

#### 视图 D：数据看板

```
┌────────────────────────────────────────────────────────────────────┐
│  📊 数据看板                              [7天] [30天] [90天] [全部] │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  总览:  发布 45 篇  总阅读 156万  总点赞 4.2万  爆款 5 篇            │
│                                                                    │
│  主题表现对比:                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  手机壁纸  ████████████████████  发布 30  均阅 2.1万  爆款 2   │    │
│  │  童话仙境  ████████              发布 8   均阅 5.8万  爆款 2   │    │
│  │  电脑壁纸  ██████                发布 7   均阅 1.8万  爆款 1   │    │
│  └────────────────────────────────────────────────────────────┘    │
│  ↑ 建议增加童话仙境生成量（互动率最高，但产量仅占 18%）                │
│                                                                    │
│  🏆 爆款素材 TOP 5:                                                │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐          │
│  │ [缩略图] │ [缩略图] │ [缩略图] │ [缩略图] │ [缩略图] │          │
│  │ 阅 8.9万 │ 阅 6.2万 │ 阅 5.1万 │ 阅 4.8万 │ 阅 4.3万 │          │
│  │ [复刻]   │ [复刻]   │ [复刻]   │ [复刻]   │ [复刻]   │          │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘          │
│                                                                    │
│  发布日历热力图:                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  日 一 二 三 四 五 六                                       │    │
│  │  ·  ·  ·  ·  ·  █  █  ← 周末发布量高                         │    │
│  │  █  ·  ·  █  ·  █  █                                        │    │
│  │  ·  ·  ·  ·  █  █  █                                        │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 4.2 导航入口

在 WebUI 侧边栏底部（Hermes Control Center 附近）添加固定入口：

```
┌─────────────────────────┐
│  💬 Chat                 │
│  📋 Tasks                │
│  🛠️ Skills               │
│  🧠 Memory               │
│  👤 Profiles             │
│  ...                     │
│  ─────────────────────── │
│  🎬 Media Studio  ← 新增 │
│  ⚙️ Control Center       │
└─────────────────────────┘
```

---

## 5. 扩展实现方案

### 5.1 技术栈

- **纯前端**：Vanilla JS（ES2020+），无框架
- **样式**：CSS Variables（兼容 WebUI 主题系统）
- **API**：WebUI 内置 Workspace API（fetch）
- **存储**：Workspace 文件系统（无 localStorage，无 IndexedDB）

### 5.2 核心模块

```
media-studio-extension/
├── app.js                          # 入口 + 路由
├── app.css                         # 全局样式
├── modules/
│   ├── api.js                      # Workspace API 封装 + 端点探测
│   ├── state.js                    # 全局状态管理（内存）
│   ├── router.js                   # 视图路由（看板/审核/日历/数据）
│   ├── components/
│   │   ├── KanbanBoard.js          # 看板视图
│   │   ├── ReviewMode.js           # 审核模式
│   │   ├── PackageEditor.js        # 发布包编辑器
│   │   ├── CalendarView.js         # 发布日历
│   │   ├── StatsDashboard.js       # 数据看板
│   │   ├── MediaCard.js            # 素材卡片组件
│   │   ├── ThemeSelector.js        # 主题选择器
│   │   └── PlatformSelector.js     # 平台选择器
│   └── utils/
│       ├── dom.js                  # DOM 工具
│       ├── format.js               # 格式化（日期、大小）
│       ├── meta.js                 # .meta.json 读写
│       └── search.js               # 基于 .index/ monthly shards 的素材搜索
```

### 5.3 API 端点探测策略

由于不同 WebUI 版本的 Workspace API 可能有差异，扩展启动时自动探测：

```javascript
async function probeEndpoints() {
  const candidates = {
    tree: ['/api/workspace/tree?path=', '/api/workspace/list?path='],
    read: ['/api/workspace/file?path=', '/api/workspace/read?path='],
    write: ['/api/workspace/file', '/api/workspace/write'],
    mkdir: ['/api/workspace/mkdir', '/api/workspace/folder'],
    delete: ['/api/workspace/delete', '/api/workspace/remove'],
    rename: ['/api/workspace/rename', '/api/workspace/move'],
    upload: ['/api/workspace/upload', '/api/upload']
  };

  const endpoints = {};
  for (const [key, urls] of Object.entries(candidates)) {
    for (const url of urls) {
      try {
        const res = await fetch(url.replace('?path=', '?path=media-studio'), { method: 'HEAD' });
        if (res.ok || res.status === 405) { // 405 = Method Not Allowed, 端点存在
          endpoints[key] = url;
          break;
        }
      } catch (e) { /* 继续探测下一个 */ }
    }
  }
  return endpoints;
}
```

### 5.4 关键实现细节

#### 5.4.1 素材状态管理（不移动文件）

```javascript
// 状态变更只修改 .meta.json
async function changeStatus(assetPath, newStatus, note = '') {
  const metaPath = `${assetPath}.meta.json`;
  const meta = await readMeta(metaPath);

  meta.status = newStatus;
  meta.status_history.push({
    status: newStatus,
    changed_at: new Date().toISOString(),
    note
  });
  meta.updated_at = new Date().toISOString();

  await writeFile(metaPath, JSON.stringify(meta, null, 2));

  // 同步更新 pipeline 索引（软链接或记录文件）
  await syncPipelineIndex(assetPath, newStatus);
}
```

#### 5.4.2 看板数据聚合

```javascript
async function loadKanbanData(filter = {}) {
  // 1. 扫描 pipeline/ 各阶段目录
  // 2. 读取每个 .meta.json
  // 3. 按主题/日期过滤
  // 4. 聚合为看板数据

  const stages = ['01-generating', '02-pending-review', '03-approved', '04-scheduled'];
  const kanban = { generating: [], pending: [], approved: [], scheduled: [] };

  for (const stage of stages) {
    const items = await apiTree(`pipeline/${stage}`);
    for (const item of items) {
      if (item.name.endsWith('.meta.json')) continue;
      const meta = await readMeta(`${item.path}.meta.json`);
      if (matchesFilter(meta, filter)) {
        kanban[stageKey(stage)].push({ ...item, meta });
      }
    }
  }

  return kanban;
}
```

#### 5.4.3 发布包生成

```javascript
async function generatePublishPackage(selection) {
  const { platform, theme, assets, copy, scheduledDate } = selection;

  // 读取平台模板
  const platformConfig = await readFile(`configs/platforms/${platform}/template.md`);

  // 读取主题配置
  const themeConfig = await readFile(`configs/themes/${theme}/theme.json`).then(JSON.parse);

  // 生成 Frontmatter
  const frontmatter = {
    platform,
    theme,
    title: copy.title || await generateTitle(themeConfig, assets),
    tags: [...themeConfig.publishing.tags, ...platformConfig.default_tags],
    cover: assets[0],
    assets,
    status: 'scheduled',
    scheduled_at: scheduledDate
  };

  // 生成正文
  const body = copy.body || await generateBody(platformConfig, assets, themeConfig);

  // 组装 Markdown
  const md = `---
${yamlDump(frontmatter)}
---

${body}`;

  // 写入 pipeline/04-scheduled/
  const filename = `${platform}-${theme}.md`;
  const path = `pipeline/04-scheduled/${scheduledDate.split('T')[0]}/${filename}`;
  await writeFile(path, md);

  // 更新素材 linked_copy
  for (const asset of assets) {
    await appendLinkedCopy(asset, path);
  }

  return path;
}
```

### 5.5 环境变量配置

```bash
# 启动 WebUI 时加载扩展
export HERMES_WEBUI_EXTENSION_DIR="$HOME/.hermes/webui-extension/media-studio"
export HERMES_WEBUI_EXTENSION_SCRIPT_URLS="/extensions/media-studio/app.js"
export HERMES_WEBUI_EXTENSION_STYLESHEET_URLS="/extensions/media-studio/app.css"

./start.sh
```

### 5.6 安全与隔离

- **命名空间**：所有 CSS 类名以 `ms-` 前缀，DOM ID 以 `media-studio-` 前缀
- **可逆性**：扩展只操作 `~/workspace/media-studio/` 目录，不触碰 WebUI 核心文件
- **无外部依赖**：所有 JS/CSS 本地 served，不加载 CDN
- **权限边界**：扩展拥有当前登录用户的完整 Workspace 权限，但无法绕过认证或访问其他用户数据

---

## 6. 发布方案

### 6.1 仓库结构

```
hermes-webui-media-studio/
├── README.md
├── install.sh                    # 一键安装脚本
├── uninstall.sh                  # 卸载脚本
├── update.sh                     # 更新脚本
├── src/
│   ├── app.js
│   ├── app.css
│   └── modules/
│       └── ...
├── docs/
│   ├── screenshot-kanban.png
│   ├── screenshot-review.png
│   └── architecture.md
└── .github/
    └── workflows/
        └── release.yml           # 自动发布 GitHub Release
```

### 6.2 安装方式

#### 方式一：一键安装（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/yourname/hermes-webui-media-studio/main/install.sh | bash
```

安装脚本自动：
1. 克隆仓库到 `~/.hermes/webui-extension/media-studio/`
2. 创建 `~/workspace/media-studio/` 初始目录结构
3. 输出环境变量配置提示
4. 可选：自动写入 `~/.bashrc` / `~/.zshrc`

#### 方式二：手动安装

```bash
git clone https://github.com/yourname/hermes-webui-media-studio.git   ~/.hermes/webui-extension/media-studio

# 创建 workspace 目录结构
mkdir -p ~/workspace/media-studio/{configs/{themes,platforms,workflows},assets,pipeline/{01-generating,02-pending-review,03-approved,04-scheduled,05-published},archive,.trash,.index}

# 启动 WebUI 并加载扩展
HERMES_WEBUI_EXTENSION_DIR="$HOME/.hermes/webui-extension" HERMES_WEBUI_EXTENSION_SCRIPT_URLS="/extensions/media-studio/app.js" HERMES_WEBUI_EXTENSION_STYLESHEET_URLS="/extensions/media-studio/app.css" ./start.sh
```

#### 方式三：Docker 预装（团队部署）

```dockerfile
FROM ghcr.io/nesquena/hermes-webui:latest

COPY --chown=hermeswebui:hermeswebui src/   /home/hermeswebui/.hermes/webui-extension/media-studio/

ENV HERMES_WEBUI_EXTENSION_DIR=/home/hermeswebui/.hermes/webui-extension
ENV HERMES_WEBUI_EXTENSION_SCRIPT_URLS=/extensions/media-studio/app.js
ENV HERMES_WEBUI_EXTENSION_STYLESHEET_URLS=/extensions/media-studio/app.css

EXPOSE 8787
```

### 6.3 更新机制

由于 WebUI Extension 不支持热更新，更新流程：

```bash
# 方式一：使用更新脚本
cd ~/.hermes/webui-extension/media-studio
./update.sh
# → git pull → 重启 WebUI

# 方式二：手动更新
cd ~/.hermes/webui-extension/media-studio
git pull origin main
./ctl.sh restart  # 或手动重启 WebUI
```

### 6.4 卸载

```bash
# 方式一：卸载脚本
~/.hermes/webui-extension/media-studio/uninstall.sh
# → 移除扩展目录 → 清理环境变量提示

# 方式二：手动卸载
rm -rf ~/.hermes/webui-extension/media-studio
# 从 shell profile 中移除 HERMES_WEBUI_EXTENSION_* 变量
# 可选：保留 ~/workspace/media-studio/ 数据目录
```

---

## 7. 演进路线（Roadmap）

### Phase 1：看板与审核（MVP，2-3 周）

目标：解决最痛的"考古式审核"问题

- [ ] 看板视图（Kanban）：四列状态 + 主题筛选
- [ ] 审核模式：网格缩略图 + 键盘快捷键 + 批量操作
- [ ] 素材详情浮层：显示生成参数（seed、prompt、workflow）
- [ ] 基础目录结构初始化（install.sh 自动创建）
- [ ] 符号链接/索引机制（状态变更不移动物理文件）

**验收标准**：用户可以在一个界面中完成所有主题的审核，无需打开多个文件夹

### Phase 2：发布包与日历（1-2 周）

目标：解决"纯体力搬运"问题

- [ ] 发布包生成器：选择素材 + 文案 → 生成平台专用 Markdown
- [ ] 平台模板系统：头条、小红书、抖音等模板配置
- [ ] 发布日历：日/周视图 + 拖拽排期
- [ ] 发布归档：标记已发布后自动归档

**验收标准**：用户可以在扩展内完成"选素材 → 写文案 → 排期 → 发布 → 归档"全流程

### Phase 3：生成控制台（1-2 周）

目标：打通 ComfyUI，减少手工操作

- [ ] 工作流浏览器：展示 `configs/workflows/` 目录下的 API JSON
- [ ] 批量生成触发：选择工作流 + 主题 + 数量 → 调用 Agent 生成
- [ ] 生成进度监控：SSE 实时显示生成状态
- [ ] 生成参数自动写入 `.meta.json`

**验收标准**：用户可以在扩展内一键触发批量生成，无需手动配置 ComfyUI

### Phase 4：数据看板（1-2 周）

目标：建立数据闭环，从"凭感觉"到"数据驱动"

- [ ] 主题表现统计：发布量、平均互动、爆款数量
- [ ] 爆款素材复刻：查看参数 + 一键生成同参数变体
- [ ] 发布历史时间线
- [ ] 手动录入发布后数据（阅读量、点赞、评论）

**验收标准**：用户可以基于数据看板决策"哪个主题应该多生成"

### Phase 5：Agent 深度集成（长期，可选）

目标：从"人操作工具"到"人监督 Agent 工作"

- [ ] Hermes Agent Plugin：自动调用 ComfyUI API
- [ ] 自动文案生成：根据素材 + 平台模板自动生成标题和正文
- [ ] 自动发布：对接平台 API（需企业资质）或浏览器自动化
- [ ] 自动数据抓取：抓取发布后数据回填到 `.meta.json`
- [ ] 智能排期：根据主题历史表现自动推荐最佳发布时间

**验收标准**：用户只需"选定主题和数量"，Agent 完成生成 → 审核辅助 → 文案 → 排期 → 发布 → 数据回流

---

## 8. 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| WebUI API 版本变更 | 扩展无法工作 | 启动时自动探测端点，提供降级提示 |
| 大量素材导致性能问题 | 看板加载缓慢 | 分页加载 + 虚拟滚动 + 本地索引缓存 |
| 多设备同步 | 扩展数据不同步 | 所有数据存 Workspace 文件，天然随 Git/Syncthing 同步 |
| 用户误操作删除素材 | 数据丢失 | 删除操作先移至 `.trash/` 目录，保留 30 天 |
| 扩展与 WebUI 主题冲突 | 界面显示异常 | CSS 使用 `!important` 隔离 + 充分测试各主题 |
| 未来 WebUI 架构变更 | 扩展不兼容 | 保持纯前端 + 仅使用公开 API，降低耦合 |

---

## 9. 附录

### 9.1 术语表

| 术语 | 说明 |
|------|------|
| **Workspace** | Hermes WebUI 的文件系统工作区，映射到本地目录 |
| **Extension** | Hermes WebUI 的前端扩展机制，通过环境变量注入 JS/CSS |
| **Sidecar** | 与主文件同名的 `.meta.json` 文件，存储元数据 |
| **Pipeline** | 内容生产流水线，包含生成 → 审核 → 发布 → 归档四个阶段 |
| **发布包** | 包含素材、文案、平台配置的 Markdown 文件，可直接用于发布 |
| **主题** | 内容风格分类（如手机壁纸、童话仙境），包含视觉规范和生成参数 |
| **Workflow** | ComfyUI 的 API JSON 工作流文件 |

### 9.2 参考链接

- [Hermes WebUI Extension 文档](https://github.com/nesquena/hermes-webui/blob/master/docs/EXTENSIONS.md)
- [Hermes WebUI 架构文档](https://github.com/nesquena/hermes-webui/blob/master/ARCHITECTURE.md)
- [Hermes Agent Plugin 开发指南](https://github.com/NousResearch/hermes-agent/blob/main/docs/PLUGINS.md)

---

> 本方案基于 Hermes WebUI Extension 机制和 Workspace 文件系统设计，所有数据以纯文件形式存储，不依赖外部数据库，确保可迁移性、可版本控制性和长期可维护性。
