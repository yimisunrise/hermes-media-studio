## ADDED Requirements

### Requirement: 图文存储格式
图文 SHALL 以 Markdown + .meta.json sidecar 格式存储在 `copywriting/YYYY/MM/<uuid>/` 目录中。
- `content.md`：Markdown 格式的图文内容
- `.meta.json`：元数据（标题、类型、状态、来源任务、图片列表、发布记录等）

#### Scenario: 图文创建
- **WHEN** 文案任务产出成果
- **THEN** 在 `copywriting/YYYY/MM/<uuid>/` 创建目录
- **THEN** 写入 `content.md` 和 `.meta.json`
- **THEN** Markdown 中的图片路径引用 `assets/` 目录

### Requirement: 图文引用素材路径
图文 Markdown 中的图片 SHALL 使用相对路径引用素材库（`../../assets/YYYY/MM/DD/filename.jpg`）。

#### Scenario: 图片引用
- **WHEN** 文案包含图片
- **THEN** Markdown 中使用 `![](../../assets/2026/07/11/xxx.jpg)` 格式引用
- **THEN** 路径相对于 `copywriting/YYYY/MM/` 解析

### Requirement: 图文分片索引
图文库 SHALL 使用分片索引支持搜索和按日期浏览。索引 SHALL 按 `YYYY/MM` 分片，存储在 `.index/copywriting/YYYY/MM/index.json`。

#### Scenario: 分片索引构建
- **WHEN** 新图文创建
- **THEN** 系统更新对应月份的分片索引
- **WHEN** 搜索图文
- **THEN** 系统加载 `.index/copywriting/manifest.json`，读取所有分片，合并结果

### Requirement: 图文浏览
系统 SHALL 在 `#copywriting` 路由下显示图文列表。列表 SHALL 支持：
- 按日期排序展示
- 点击查看详情（Markdown 渲染）
- 状态筛选（待审核、已审核、已发布等）

#### Scenario: 图文列表展示
- **WHEN** 用户导航到图文库视图
- **THEN** 系统通过分片索引加载所有图文
- **THEN** 以列表形式展示，每项显示标题、类型、状态、创建时间
- **THEN** 用户可点击查看完整 Markdown 渲染

### Requirement: 图文分类
图文 SHALL 支持以下内容类型：
- 标题 + 图文混排（带多张图片的富文本文章）
- 描述 + 多图（最多 9 张图）
- 单视频

#### Scenario: 图文类型标识
- **WHEN** 图文创建
- **THEN** `.meta.json` 中的 `type` 字段记录图文类型
- **WHEN** 在图文库列表展示
- **THEN** 每项显示其内容类型标签
