## Context

当前 Hermes Media Studio 已完成策划（Theme/Idea/Topic）、创作（Task/Asset/Content）、编排（Content finalization）的全流程。Content 表已有 `finalized` 状态，是发布流程的起点。

发布模块是"从灵感到发布"闭环的最后一段——将已定稿的 Content 分发到各社交媒体平台。本模块的表结构、状态机和视图设计已在 `DESIGN.md` 中详细定义，本次实现以 DESIGN.md 为规范参考。

## Goals / Non-Goals

**Goals:**
- 实现 4 张新表的数据库定义和版本化升级（business-db → 1.4.0）
- 实现 4 个数据访问层 repo（packageRepo / platformRepo / scheduleRepo / publishLogRepo）
- 实现 3 个视图：PublishManager（发布管理）、PlatformConfig（平台配置）、PublishCalendar（发布日历）
- 实现 Manifest 扩展：新增"发布运营"菜单组 + 3 个视图注册
- 实现发布包从 Content 创建、选择平台、立即发布/排期的基础流程
- 手工发布模式：用户手动在各平台发布后回填链接和结果
- 现有视图集成：TaskDetail / ContentEditor 增加发布入口

**Non-Goals:**
- Agent 自动发布（需要 HermesAgent 集成，属阶段四）
- Schedule 定时自动触发发布（依赖 Agent 集成）
- PublishLog 的自动重试和失败通知（后期迭代）
- 跨平台发布模板和内容格式转换（后期迭代）
- 发布后的数据采集与分析（阶段六）

## Decisions

### 1. 表结构全部按 DESIGN.md 实现

DESIGN.md 已为 4 张新表（packages、platforms、schedules、publish-logs）定义了完整的字段、分片和枚举。实现时直接遵循 DESIGN.md 中的表定义，不做修改。

**注意**：business-db.init-def.js 中现有表的 `shardType` 字段命名与 DESIGN.md 略有差异（现有代码用 `shardType: 'monthly'`，DESIGN.md 用 `shard: { type: 'monthly' }`）。实现时**统一使用现有代码中的 `shardType` 模式**以保持一致。

### 2. 视图使用现有框架模式

所有视图均复用现有架构：
- 类模式：`class PublishManager { constructor({api, state, schemaRegistry}) {} render(container) {} destroy() {} }`
- 数据访问：通过 `data/index.js` 中的 repo 工厂函数获取 `DataRepository` 实例
- 模态框：复用 `framework/ui/Modal.js`
- 路由 hash：`#publish`、`#platforms`、`#calendar`
- CSS 命名空间：`ms-` 前缀，使用 WebUI CSS 变量

### 3. 发布流程：以 Package 为核心

```
用户操作流：
1. 在 PublishManager 视图点击"创建发布包"
2. 选择已定稿的 Content（下拉列表，只展示 status=finalized 的 content）
3. 填写发布标题（默认取 Content.title）
4. 选择一个或多个目标 Platform（从已启用的平台列表中多选）
5. 选择发布方式：立即发布 / 排期发布
   - 立即发布 → Package.status = "publishing"，每个平台生成一条 Schedule + PublishLog
   - 排期发布 → 设置 scheduledAt，Package.status = "scheduled"
6. 手工模式下：用户在平台发布后，回到系统点击"标记已发布"，填写 URL
7. 所有平台都标记完成 → Package.status = "published"
8. 部分完成 → Package.status = "partially_published"
```

### 4. PublishCalendar 复用现有 CSS

CSS 中已存在完整的 `.ms-calendar-*` 样式类（月份网格、日期单元格、事件标记），PublishCalendar 视图直接使用。

日历数据按月查询 schedules 表（schedules 表本身是月分片），按日期分组后在日历网格中展示排期条目。

### 5. 手工发布模式第一优先

实现路径：
- Package 创建后立即进入 `draft` 状态
- 用户点击"发布"→ 状态变为 `publishing`
- 每个平台生成 `schedules` 和 `publish-logs` 条目
- 用户在各平台发布内容后，回到系统为每条日志填写发布 URL
- PublishLog.status 改为 `success`（或 `failed`）
- 当所有平台的 PublishLog 都完成时，Package 状态自动更新

### 6. 版本升级策略

business-db 模块版本从 `1.3.0` → `1.4.0`。InitOrchestrator 检测到版本变化后，会重新执行 `handler`。handler 中的 `updateTable` 逻辑会合并新表定义到现有 schema 中。

## Risks / Trade-offs

- **[数据一致性]** 手工模式下，用户填写发布链接的时机不可控（可能忘了填）→ 设计"标记已发布"入口，并在 Package 状态栏显示未完成的平台列表
- **[ESM 兼容性]** 视图文件使用原生 ES module 导入，避免使用构建工具特有的语法
- **[分片复杂度]** schedules 和 publish-logs 按月度分片，PublishCalendar 查询时需要跨分片查询最近多个月份 → 查询逻辑需按月份范围逐一查分片表后合并
- **[平台配置膨胀]** apiConfig 字段当前预留，但无 Agent 支持时用不到 → 初期不验证 apiConfig 的完整性，仅存储
- **[与现有视图耦合]** TaskDetail 和 ContentEditor 的集成需要更新两个已有文件 → 修改最小化，只加按钮和入口，不做逻辑侵入
