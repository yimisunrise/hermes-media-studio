# Hermes Media Studio

**自媒体内容生产驾驶舱** — 基于 [Hermes WebUI](https://github.com/nesquena/hermes-webui) Extension 机制的纯前端扩展，将文件管理升级为生产流水线。

![screenshot](https://img.shields.io/badge/status-active-brightgreen)
![hermes-webui](https://img.shields.io/badge/hermes--webui-%3E%3D0.50.0-blue)
![license](https://img.shields.io/badge/license-MIT-lightgrey)

---

## 功能概览

| 模块 | 路由 | 用途 |
|------|------|------|
| **看板** | `#kanban` | 四列流水线可视化：生成中 → 待审核 → 已审核 → 发布日历 |
| **审核** | `#review` | 键盘驱动的批量审核工作流 |
| **生成** | `#generation` | ComfyUI 工作流管理 & 批量生成任务触发 |
| **日历** | `#calendar` | 发布排期月/周视图，拖拽安排 |
| **发布包** | `#package-editor` | 多素材 + 文案 + 平台模板 → 一键发布包 |
| **数据** | `#dashboard` | 主题表现统计、爆款检测与一键复刻 |
| **主题策略** | `#themes` | 主题配置管理、库存预警 |
| **素材库** | `#archive` | 全局搜索与历史素材浏览 |

---

## 工作原理

```
浏览器 (Extension JS/CSS)
    │
    ├─ 注入 Rail 按钮 → 侧栏面板
    │
    ├─ Workspace API ──→ 文件系统（JSON / Markdown / 素材）
    │                         │
    │                         ├─ pipeline/01-generating/
    │                         ├─ pipeline/02-pending-review/
    │                         ├─ pipeline/03-approved/
    │                         ├─ pipeline/04-scheduled/
    │                         ├─ pipeline/05-published/
    │                         ├─ themes/
    │                         ├─ platforms/
    │                         ├─ workflows/
    │                         └─ archive/
    │
    └─ Hermes Agent Plugin ──→ ComfyUI (批量生成)
```

所有数据以纯文件 + ` .meta.json` sidecar 形式存储，天然可 Git 版本控制，卸载扩展不丢失数据。

---

## 前置要求

- **Hermes WebUI** >= v0.50.0（Extension 机制 + Workspace API）
- **Hermes Agent**（可选，用于 ComfyUI 批量生成）
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
mkdir -p /path/to/workspace/{pipeline/{01-generating,02-pending-review,03-approved,04-scheduled,05-published},themes,platforms,workflows,archive,.trash,.media-studio}
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

---

## 工作空间目录结构

```
workspace/
├── pipeline/                  # 素材流水线各阶段
│   ├── 01-generating/         # 生成中
│   ├── 02-pending-review/     # 待审核
│   ├── 03-approved/           # 已审核通过
│   ├── 04-scheduled/          # 已排期
│   └── 05-published/          # 已发布
├── themes/                    # 主题配置
│   └── <theme-name>/
│       ├── theme.json         # 风格参数
│       └── prompt-template.md # 生成提示词模板
├── platforms/                 # 平台发布模板
│   └── <platform-name>.json
├── workflows/                 # ComfyUI 工作流定义
│   └── <workflow-name>.json
├── archive/                   # 素材归档
│   └── YYYY/MM/
├── .trash/                    # 回收站（30 天自动清理）
└── .media-studio/             # 内部索引
    └── index.json
```

---

## 使用指南

### 快速开始

1. 点击 Rail 上的 Media Studio 图标（🎬 风格图标）进入面板
2. 如工作空间未初始化，按提示创建目录结构
3. 从 **看板** 开始浏览流水线

### 素材流水线

```
生成 → 待审核 → 已审核 → 排期 → 发布
```

- **生成**：在「生成控制台」选择工作流和主题，触发批量生成
- **审核**：使用键盘快捷键高效操作
- **排期**：将审核通过的素材拖拽到发布日历
- **发布**：生成含有 YAML frontmatter 的 Markdown 发布包

### 审核模式快捷键

| 按键 | 操作 |
|------|------|
| `1` | 通过 |
| `2` | 删除（移入回收站） |
| `3` | 稍后处理 |
| `4` | 标星 |
| `5` | 添加备注 |
| `←` `→` | 上/下一个素材 |
| `Enter` | 全屏预览 |
| `Esc` | 退出预览 |

### 发布包格式

```yaml
---
title: "我的小红书笔记"
platform: xiaohongshu
theme: 手机壁纸
scheduled_at: "2026-07-15T10:00:00+08:00"
status: scheduled
tags:
  - 壁纸
  - 手机
assets:
  - path: archive/2026/07/wallpaper-001.png
  - path: archive/2026/07/wallpaper-002.png
cover: archive/2026/07/wallpaper-001.png
template: standard
---

笔记正文内容（支持 Markdown）…
```

---

## 配置

### 发布平台

在 `platforms/` 目录下创建 JSON 文件：

```json
{
  "id": "xiaohongshu",
  "name": "小红书",
  "fields": [
    { "key": "title", "label": "标题", "type": "text", "maxLength": 20 },
    { "key": "body", "label": "正文", "type": "textarea", "maxLength": 1000 }
  ],
  "templates": [
    { "id": "standard", "label": "标准模板", "bodyTemplate": "...模板内容..." }
  ]
}
```

### 主题策略

在 `themes/` 目录下创建主题配置：

```json
{
  "id": "phone-wallpaper",
  "name": "手机壁纸",
  "tags": ["壁纸", "竖屏", "手机"],
  "publishStrategy": {
    "bestTime": "12:00",
    "platforms": ["xiaohongshu", "toutiao"]
  },
  "style": "赛博朋克",
  "aspectRatio": "9:16"
}
```

---

## 开发

```bash
# 代码检查
npx eslint src/

# 验证 JS 语法
find src -name "*.js" -exec node --check {} \;

# 验证 Shell 脚本
bash -n src/scripts/install.sh
```

### 技术栈

- **语言**：Vanilla JavaScript（ES Modules）
- **样式**：原生 CSS（命名空间 `ms-` 前缀）
- **构建**：无构建步骤，浏览器直接加载
- **图标**：Lucide 风格内联 SVG

### 扩展架构

```
src/
├── app.js                    # 应用入口 & 菜单定义
├── app.css                   # 全局样式
├── assets/
│   └── logo.svg              # Rail 按钮图标（Lucide 风格）
├── modules/
│   ├── api.js                # Workspace API 客户端
│   ├── state.js              # 全局状态管理
│   ├── router.js             # Hash 路由
│   ├── sidebar.js            # Rail & 侧栏注入
│   ├── KanbanBoard.js        # 看板视图
│   ├── ReviewMode.js         # 审核模式
│   ├── PackageEditor.js      # 发布包编辑器
│   ├── CalendarView.js       # 发布日历
│   ├── StatsDashboard.js     # 数据看板
│   ├── GenerationConsole.js  # 生成控制台
│   ├── ThemeStrategy.js      # 主题策略
│   ├── MediaArchive.js       # 素材库
│   ├── components/           # 可复用 UI 组件
│   └── utils/                # 工具函数
└── scripts/
    ├── install.sh
    ├── uninstall.sh
    └── update.sh
```

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
