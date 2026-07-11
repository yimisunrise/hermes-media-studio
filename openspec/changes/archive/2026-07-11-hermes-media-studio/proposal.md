## Why

自媒体创作者当前通过 ComfyUI 手工配置工作流 + Hermes Agent 调用生成素材，再手动管理文件、审核、排期、发布到多平台。整个流程存在四个核心痛点：
- **考古式审核**：无缩略图网格，无键盘快捷键，无批量操作，需打开多个文件夹查找素材
- **体力式搬运**：无"发布包"概念，多平台需不同文案格式，排期靠手动日历
- **数据黑盒**：无发布后数据回流，无法量化主题表现，爆款难以复刻
- **元数据分离**：ComfyUI 生成参数（seed、prompt）与图片文件分离，复刻成本高

需要一个将"文件管理"升级为"生产流水线"的驾驶舱，让创作者在一个界面内完成生成→审核→排期→发布→数据分析全流程。

## What Changes

基于 Hermes WebUI 的 Extension 机制（纯前端）构建 Media Studio 扩展，新增以下能力：

- **看板视图（Kanban）**：四列状态（生成中/待审核/已审核/排期），替代目录浏览，支持主题筛选和拖拽操作
- **审核模式（Review）**：沉浸式网格缩略图 + 键盘快捷键（1-5）+ 批量操作，支持悬停预览和生成参数查看
- **发布包生成（Package Editor）**：选择素材 + 文案 → 平台专用 Markdown 发布包，支持多平台模板（头条/小红书/抖音/知乎）
- **发布日历（Calendar）**：日/周视图排期，拖拽发布包到指定日期，一键标记发布归档
- **数据看板（Dashboard）**：主题表现统计、爆款素材识别与复刻、发布历史热力图
- **工作流管理（Workflow Browser）**：浏览 `workflows/` 目录下的 ComfyUI API JSON，一键触发批量生成
- **主题策略中心（Theme Strategy）**：主题配置管理（theme.json）、表现对比、库存预警
- **素材母库（Media Archive）**：所有素材归档在 `archive/YYYY/MM/`，支持全局搜索与素材复用

**核心设计原则**：
- Workspace 即数据库：所有数据以纯文件（Markdown + JSON + 素材）形式存在，天然可 Git 版本控制
- 元数据驱动状态：用 `.meta.json` sidecar 标记素材状态，物理路径永不改变
- 纯前端扩展：零后端代码，仅通过 WebUI Workspace API 操作文件系统

## Capabilities

### New Capabilities
- `kanban-review`: 看板四列视图 + 沉浸式审核模式，支持主题筛选、键盘快捷键、批量操作、素材详情浮层
- `publish-calendar`: 发布包生成器（选择素材+文案→Markdown）+ 平台模板系统 + 日/周发布日历 + 拖拽排期 + 发布归档
- `generation-console`: ComfyUI 工作流浏览器 + 批量生成触发 + 生成进度监控 + 参数自动写入 `.meta.json`
- `data-dashboard`: 主题表现统计（发布量/互动率/爆款数）+ 爆款素材复刻 + 发布历史时间线 + 手动数据录入
- `theme-strategy`: 主题 CRUD 配置 + 表现对比 + 库存预警 + 推荐设置管理
- `media-archive`: 素材母库归档管理 + 全局搜索（主题/标签/prompt/日期）+ 素材复用管理
- `workspace-foundation`: Workspace 目录结构初始化 + Sidecar 元数据驱动状态管理 + 符号链接/索引机制 + Pipeline 数据聚合

### Modified Capabilities
<!-- No existing specs to modify - this is the initial implementation -->

## Impact

- **Hermes WebUI**：通过 Extension 机制加载 JS/CSS，不影响核心代码。CSS 类名 `ms-` 前缀 + DOM ID `media-studio-` 前缀隔离
- **Workspace 目录**：约定 `~/workspace/media-studio/` 目录结构，扩展只操作该目录下的文件
- **无外部依赖**：所有 JS/CSS 本地 served，无 CDN 加载要求
- **可逆性**：卸载时清除环境变量即可，不污染 WebUI 核心，不丢失数据
