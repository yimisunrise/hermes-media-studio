## 1. InitOrchestrator 核心实现

- [ ] 1.1 新建 `src/core/InitOrchestrator.js`，实现 class InitOrchestrator：constructor、register、run、getPending、isComplete
- [ ] 1.2 实现 `register(moduleDef)` — 验证必填字段（name、version、handler），去重检测，存入内部 registry
- [ ] 1.3 实现版本比对逻辑 — 读取 `.system/init/<name>.json`，对比 version 字段，决定 skip 或执行
- [ ] 1.4 实现依赖拓扑排序 — 基于 `dependsOn` 构建全序，检测循环依赖并抛出明确错误
- [ ] 1.5 实现 `run()` 执行引擎 — 按序执行 handler，处理进度回调、成功写标记、失败处理（required vs non-required）
- [ ] 1.6 实现模块标记写入 — handler 成功后写 `.system/init/<name>.json`（含 name、version、completedAt）
- [ ] 1.7 更新 `src/core/index.js`，导出 InitOrchestrator，保留 InitPipeline 导出（过渡期兼容）

## 2. 模块 init-def 文件

- [ ] 2.1 新建 `src/core/InitOrchestrator.init-def.js` — 框架自身初始化（创建 `.system/init/` 目录），不依赖其他模块
- [ ] 2.2 新建 `src/init/workspace.init-def.js` — 创建 DIRS_TO_CREATE 中的目录结构（提取自 app.js），依赖 InitOrchestrator
- [ ] 2.3 新建 `src/core/SchemaRegistry.init-def.js` — bootstrapSystemDb + 创建 main 数据库（提取自 app.js 的 bootstrap-core 步骤），依赖 workspace
- [ ] 2.4 新建 `src/init/configs.init-def.js` — 写入默认 task-lifecycle.json 配置（提取自 app.js 的 seed-configs 步骤），依赖 workspace

## 3. 启动 Overlay 组件

- [ ] 3.1 新建 `src/views/InitOverlay.js` — 全屏居中 overlay 组件，含 show()、update(label)、hide()、hideAll() 方法
- [ ] 3.2 实现 Overlay CSS 样式 — `.ms-init-overlay` 全屏 fixed 定位、深色背景、居中文本、动画 spinner、淡出过渡
- [ ] 3.3 实现 show() 渲染 — 创建 DOM 元素：标题 "正在初始化工作空间" + 步骤文本容器 + 动画指示器
- [ ] 3.4 实现 update(label) — 更新步骤文本，反映当前执行的模块
- [ ] 3.5 实现 hide() — 300ms 淡出过渡后移除 DOM
- [ ] 3.6 实现 hideAll() — 静态方法，确保任何残留 overlay 被清理

## 4. app.js 重构

- [ ] 4.1 简化 `init()` 流程：等待 session → probe → 创建 orchestrator → register 所有 init-def → run() → init 模块 → 渲染
- [ ] 4.2 集成 overlay：run() 前显示 overlay，完成后淡出，无待办模块时不显示
- [ ] 4.3 删除 `_registerInitSteps()` 方法
- [ ] 4.4 删除 `DIRS_TO_CREATE` 和 `INIT_TREE` 常量
- [ ] 4.5 删除 `_renderInitView()` 和 `_checkTreeExistence()` 方法
- [ ] 4.6 删除 `_applyMenuFilter()` 方法
- [ ] 4.7 删除 `_renderWarningBanner()` 方法（不再需要，因为 init 是自动的）
- [ ] 4.8 简化 `_initModules()`：移除 init 路由保护（if viewName !== 'init'）
- [ ] 4.9 简化 `_initSidebar()`：移除 ms:activated 事件中重新检查 init 状态和菜单过滤的逻辑
- [ ] 4.10 删除 `#init` 路由注册

## 5. 清理与迁移

- [ ] 5.1 确认 `SchemaRegistry.markBootComplete()` 和 `writeStepStatus()` 不再被新的 init 流程调用（但保留方法本身以防其他调用方）
- [ ] 5.2 检查 `SchemaRegistry.readBoot()` / `isFirstBoot()` 的调用链，确保 init 状态判断改为检查模块标记
- [ ] 5.3 检查 `src/lib/sidebar.js` 中与 init 相关的逻辑，移除或适配
- [ ] 5.4 删除 `_workspaceReady` 属性和相关判断逻辑（init 完成后不再需要此状态标志）
- [ ] 5.5 迁移兼容：检测到旧版 boot.json（init_state=done 但无模块标记）时，自动写所有模块标记为已完成
- [ ] 5.6 JS 语法检查：`find src -name "*.js" -exec node --check {} \;`
