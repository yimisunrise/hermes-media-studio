## Context

当前系统有 9 个业务视图，全部通过 `this.api.*` 方法调用 `framework/lib/api.js` 中的数据操作。新策划阶段的 3 个视图（ThemeStrategy、IdeaBoard、TopicBoard）需要读写 `business` 数据库的 themes/ideas/topics 表。

### 当前数据访问模式（现有视图）

```
View → this.api.xxx() → framework/lib/api.js → 直接文件 I/O
```

### 目标数据访问模式（新视图）

```
View → this.api.xxx() → framework/lib/api.js → DataRepository → SchemaRegistry → 文件 I/O
```

新视图仍通过 `this.api` 访问，但 api.js 内部改用 DataRepository 读写 business 库。

## Goals / Non-Goals

**Goals:**
- 在 SchemaRegistry 中创建 `business` 库，注册 themes/ideas/topics 三张表
- 实现 ThemeStrategy 视图（`#themes`）：主题库的增删改查
- 实现 IdeaBoard 视图（`#ideas`）：思路池的灵感记录与筛选
- 实现 TopicBoard 视图（`#topics`）：从 Idea 到 Topic 的选题操作
- 更新 manifest 注册新视图
- 新视图通过 `this.api` 访问 DataRepository 读写数据

**Non-Goals:**
- 不改动现有 9 个视图的数据访问方式（后续阶段处理）
- 不实现 HermesAgent 集成（后续阶段）
- 不实现 Content 编排/发布流程（后续阶段）
- 不改造看板（KanbanBoard）（后续阶段）

## Decisions

### 1. 新视图挂载到「资源管理」菜单组

| 视图 | 路由 | 菜单位置 |
|------|------|---------|
| ThemeStrategy | `#themes` | 运营配置（紧挨平台配置） |
| IdeaBoard | `#ideas` | 资源管理 |
| TopicBoard | `#topics` | 资源管理 |

ThemeStrategy 放在「运营配置」因为主题是长期策略性配置，与平台配置同级。
IdeaBoard 和 TopicBoard 放在「资源管理」因为思路和选题属于内容资源的上游。

### 2. 视图 api 方法名规范

遵循现有命名风格（`listPlatforms`、`readTaskIndex`），新增：

| 方法 | 用途 | 底层调用 |
|------|------|---------|
| `api.listThemes()` | 获取主题列表 | `dataRepo.list('business', 'themes')` |
| `api.createTheme(data)` | 创建主题 | `dataRepo.create('business', 'themes', data)` |
| `api.updateTheme(id, data)` | 更新主题 | `dataRepo.update('business', 'themes', id, data)` |
| `api.deleteTheme(id)` | 删除主题 | `dataRepo.delete('business', 'themes', id)` |
| `api.listIdeas(filter?)` | 获取灵感列表 | `dataRepo.list('business', 'ideas', filter)` |
| `api.createIdea(data)` | 记录灵感 | `dataRepo.create('business', 'ideas', data)` |
| `api.updateIdea(id, data)` | 更新灵感 | `dataRepo.update('business', 'ideas', id, data)` |
| `api.deleteIdea(id)` | 删除灵感 | `dataRepo.delete('business', 'ideas', id)` |
| `api.listTopics(filter?)` | 获取选题列表 | `dataRepo.list('business', 'topics', filter)` |
| `api.createTopic(data)` | 创建选题 | `dataRepo.create('business', 'topics', data)` |
| `api.updateTopic(id, data)` | 更新选题 | `dataRepo.update('business', 'topics', id, data)` |

### 3. ThemeStrategy 视图设计

列表页：卡片式布局，每个主题显示名称、描述、标签、主题色 swatch
编辑页：模态框/内联编辑，填写 name/description/tags/aspectRatio/color

交互流程：
```
进入视图 → 加载主题列表 → 卡片展示
  ├─ 添加 → 弹出编辑框 → 输入信息 → 保存 → 刷新列表
  ├─ 点击卡片 → 展开编辑 → 修改 → 保存
  └─ 删除 → 确认 → 删除 → 刷新列表
```

### 4. IdeaBoard 视图设计

```
进入视图 → 加载灵感列表 → 列表/卡片展示
  ├─ 顶部快速输入框（标题，Enter 即保存）
  ├─ 点击灵感 → 展开详情（编辑描述/关联主题/标签/链接）
  ├─ 筛选栏 → 按主题/标签/状态筛选
  └─ 删除 → 确认 → 删除
```

核心设计点：
- 快速录入：顶部有一个输入框，输入标题按 Enter 就创建一条 Idea（极轻量）
- 点击 Idea 行可以展开编辑补充信息
- 灵感的状态：active（活跃）/ used（已转为选题）/ archived（归档）

### 5. TopicBoard 视图设计

```
进入视图 → 加载选题列表
  ├─ 从 Idea 创建 Topic
  │    选择一个 Idea → 弹出创建框 → 填写标题/内容形态/截止日期 → 创建
  │    → Idea 状态自动变为 used
  ├─ 选题列表展示
  │    显示标题、来源 Idea、内容形态、状态、截止日期
  └─ 操作：编辑 / 标记完成 / 取消
```

### 6. DataRepository 计划在 api.js 中实例化

```
// framework/lib/api.js 或新增 business/data/repository.js
const dataRepo = new DataRepository({ schemaRegistry, ... });

// 视图通过 this.api 调用
this.api.listThemes() → dataRepo.list('business', 'themes')
```

不直接暴露 DataRepository 给视图层，保持通过 api 门面访问的一致性。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| DataRepository 的 list() 可能还不支持按字段筛选 | 初期在前端做内存过滤，后续增强 DataRepository |
| api.js 体积继续增长 | 新方法集中写在 api.js 末尾，标记 `// === Business: Planning ===` |
| 现有 9 个视图仍直接读文件，与新视图走不同路径 | 一致性不是本期目标，先保证新视图正确 |
