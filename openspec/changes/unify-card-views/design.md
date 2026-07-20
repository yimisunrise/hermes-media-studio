## Context

当前 7 个列表视图各有独立的交互实现，共存在 5 种按钮可见性机制、3 种卡片布局、4 种点击行为。所有视图在 `src/business/views/` 下，使用 Vanilla JS（ES Modules）+ 原生 CSS 构建，无框架依赖。

统一规范已沉淀为 `.opencode/skills/hermes-ui-patterns/SKILL.md`，本变更按该规范改造所有视图。

## Goals / Non-Goals

**Goals:**
- 所有列表视图统一为 3 种卡片类型之一（内容卡片、网格卡片、看板卡片）
- 内容卡片操作按钮统一 hover 显示（`ms-item-card-actions` 类）
- 内容卡片点击统一打开 Modal 弹窗
- 删除操作统一使用 Modal 确认弹窗
- 迁移内联样式为 CSS 类（ThemeStrategy 当前 100% 内联）
- 表格形态视图（PublishManager、PlatformConfig）改为卡片列表

**Non-Goals:**
- 不修改看板（KanbanBoard）——其拖拽 + footer 按钮模式是看板特化的合理设计
- 不修改数据库管理器（DatabaseManager）——其表格形态是元数据驱动的动态表编辑器
- 不修改审核模式（ReviewMode）——键盘驱动的批量操作流程
- 不修改文稿编辑器（ContentEditor）——编辑界面非列表页
- 不引入新的 CSS 类——复用现有 `app.css` 定义的类体系
- 不涉及框架层或数据层文件

## Decisions

### D1: CSS 驱动 hover 显示，而非 JS 事件

- **选择**：使用 `.ms-item-card:hover .ms-item-card-actions { display: flex; }` CSS 规则
- **替代方案**：JS `mouseenter/mouseleave` 事件控制
- **理由**：CSS 方案零运行时开销、不需要在每张卡片上绑定事件、维护成本低

### D2: 卡片点击使用 Modal 而非展开模式

- **选择**：所有卡片点击打开独立 Modal 弹窗
- **替代方案**：卡片底部展开区域（IdeaBoard 当前的做法）/ 无点击事件（TemplatesView 的做法）
- **理由**：Modal 提供更大的内容空间、不需要把数据塞进卡片 DOM、关闭/编辑更自然

### D3: 直接改造现有视图文件，不抽取公共组件

- **选择**：在每个视图内部应用统一模式，不创建 `CardList` 或 `Card` 基类
- **替代方案**：抽取一个公共的 `CardList.js` 组件
- **理由**：当前各视图的渲染逻辑差异较大（数据字段不同、筛选条件不同、布局不同），强行抽象反而会引入 over-spec 的接口。保留每个视图独立的 `_renderCard` 方法

### D4: PublishManager 和 PlatformConfig 直接改为静态卡片列表

- **选择**：直接将表格 `<table>` 替换为 `ms-item-card` 卡片列表
- **替代方案**：保留表格但添加 hover actions
- **理由**：这两个视图的数据量小（当前<50条），卡片格式在视觉和信息密度之间更平衡。若未来数据量大可考虑分页，但卡片布局本身支持分页

### D5: TemplatesView 保留头部"新建"按钮的始终可见

- **选择**：仅列表卡片的操作按钮改为 hover 显示；视图级操作按钮（新建、批量操作）保持始终可见
- **理由**：视图级按钮（`ms-panel-header` 中的按钮）是导航操作，不是卡片级别的数据操作

## Risks / Trade-offs

- **[兼容风险] 表格→卡片**：PublishManager 和 PlatformConfig 当前以表格显示，用户可能习惯表格的多行扫描。**缓解**：卡片在一屏内显示条目数少于表格，但内容和字段相同。可考虑后续在卡片上添加「列表视图」切换按钮
- **[回归] IdeaBoard 展开模式删除**：当前展开后显示完整内容+操作按钮，改为 Modal 后用户操作路径改变。**缓解**：Modal 提供等价的操作能力，且编辑体验更好
- **[工作量] PublishManager 和 PlatformConfig**：这两个视图是纯表格 render，改为卡片需要重写 `_renderList` 方法，但每个视图约 150-200 行，改动量可控
