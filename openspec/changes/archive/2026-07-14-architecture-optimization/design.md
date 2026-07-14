## Context

Media Studio 前端当前由一个 352 行的 `app.js` 作为唯一入口，承担了启动引导、菜单渲染、视图实例化、路由注册、导航高亮、生命周期暂停等 6 个不同关注点。同时存在代码死重（废弃的 InitPipeline、未挂载的 5 个视图）、隐式接口约定（视图间无统一契约）、以及 Router 和 app.js 之间的视图列表重复维护。

当前文件结构：

```
src/app.js          ← 352 行 God Object
src/lib/router.js   ← 硬编码 VIEWS 列表
src/core/           ← 包含 2 个 init-def + 废弃的 InitPipeline
src/init/           ← 只有 2 个 init-def
src/views/          ← 9 个已挂载 + 5 个未挂载视图
```

## Goals / Non-Goals

**Goals:**
- `app.js` 从 352 行缩减到 ~60 行，只做入口启动
- 拆分出 MenuManager（菜单渲染/交互/高亮）和 ViewManager（视图实例化/路由注册/生命周期）
- Router 消除 VIEWS 常量，做到完全动态
- 所有视图实现统一的 ViewInterface 契约（constructor / render / pauseRefresh / destroy）
- InitPipeline 彻底移除，init-def 统一到 `src/init/`
- 移除 5 个未挂载视图和废弃样式
- NotificationBus 正式注入替代 null

**Non-Goals:**
- 不改动 core 层数据管理逻辑（SchemaRegistry / DataRepository / AgentTaskPoller）
- 不改动 WorkspaceAPI（lib/api.js）
- 不改动 Sidebar（lib/sidebar.js）
- 不改动任何业务视图的内部渲染逻辑（只改接口签名）
- 不引入任何外部依赖、构建工具或 TypeScript

## Decisions

### Decision 1: 拆分方向 — ViewManager 还是 ViewController？

**方案 A (选择)**：拆分为 `MenuManager` + `ViewManager` 两个独立模块
- MenuManager：负责 `_createPanel()` + `_updateNavActive()` + MENU_GROUPS 常量
- ViewManager：负责 `_initModules()` + `renderInContainer()` + `_pauseAutoRefresh()` + `_updateNavActive` 的调用
- AppBootstrap 保留在 app.js 中作为入口编排者

**方案 B**：拆分出 MenuManager + ViewContainer + Router 三合一
- 过度设计，Router 职责已经清晰，不需要合并
- 复杂度增加但收益不大

**理由**：菜单渲染是纯 UI 逻辑（DOM 创建、事件绑定），视图管理是编排逻辑（实例化、依赖注入、路由注册），两者分离后各自可以独立测试。

### Decision 2: 视图接口形式

**选择**：不用基类继承，用 JSDoc `@interface` 约定 + ViewManager 的静态检查
- 继承基类在无构建步骤的 ES module 环境中会引入 `super()` 调用和隐式耦合
- JSDoc + 运行时 duck-check 更轻量：`if (typeof view.render !== 'function') throw`
- 视图不需要 import 任何基类，保持零依赖

**约定**：

```js
/**
 * @interface ViewInterface
 * constructor(deps)         // 接收依赖对象
 * render(container, params) // 渲染到 DOM 容器
 * pauseRefresh()            // (可选) 暂停后台刷新
 * destroy()                 // (可选) 清理 DOM 和事件
 */
```

### Decision 3: Router 动态视图推导

**方案 A (选择)**：直接从 `this.routes` 的 keys 推导合法视图列表
```js
_navigate(view, params) {
  if (!this.routes[view]) {
    view = this._defaultView;  // 回退到默认视图
    window.location.hash = view;
  }
  // ...
}
```

**方案 B**：维护单独的合法视图 Set
- 不如直接从 routes 推导，两个地方又会产生不一致

**理由**：routes 已经是权威数据源，不值得再做一次镜像。移除 VIEWS 常量意味着新增视图只需要 `router.register()` 一处修改。

### Decision 4: Init-def 统一目录

将所有 init-def 移到 `src/init/`：
```
src/init/
├── InitOrchestrator.init-def.js   ← (从 core/ 移入)
├── SchemaRegistry.init-def.js     ← (从 core/ 移入)
├── workspace.init-def.js          ← (已存在)
└── configs.init-def.js            ← (已存在)
```

统一规则：**按职责聚合**——所有 "初始化定义" 归 init/，不按归属模块分散。

### Decision 5: 废弃视图处理

5 个未挂载视图：
| 文件 | 状态 | 处理 |
|------|------|------|
| GenerationConsole.js | 从未挂载，无路由引用 | **移除** |
| ThemeStrategy.js | 从未挂载，无路由引用 | **移除** |
| PackageEditor.js | 未挂载，但 MediaArchive.js 无引用，MediaCard.js 也无引用 | **移除** |
| StatsDashboard.js | 从未挂载 | **移除** |
| InitOverlay.js | 正在被 app.js 使用 | **保留** |

移除的文件也将从 `app.css` 中清理对应的废弃样式。

### Decision 6: NotificationBus 接入

- SchemaRegistry 构造时传入 `new NotificationBus()` 而非 `null`
- 暂不全面接入到所有模块（scope 限制），只确保 SchemaRegistry 不再接收 null

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 拆分后模块间事件通信变复杂 | MenuManager 和 ViewManager 通过 app.js 协调，不建立模块间直接依赖 |
| 视图接口改动需要更新 9 个视图文件 | 每个视图改动量极小（~2 行），且纯机械操作 |
| 移除 InitPipeline 后如果有外部引用会 break | 当前 InitPipeline 未被除 core/index.js 外的任何文件 import |
| 移除废弃视图后如果有人正在使用相关内容（极不可能） | 遵循"不保留历史兼容"原则，可从 git 恢复 |
