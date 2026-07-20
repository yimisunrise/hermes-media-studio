## 1. 内联样式迁移（ThemeStrategy）

- [ ] 1.1 将 ThemeStrategy.js 中卡片容器的 `style.cssText` 替换为 `class="ms-item-card"`
- [ ] 1.2 将 ThemeStrategy.js 中操作按钮容器的内联样式替换为 `class="ms-item-card-actions"`
- [ ] 1.3 迁移 ThemeStrategy.js 中状态标签内联样式为 `class="ms-task-status-badge"`
- [ ] 1.4 确认 ThemeStrategy.js 的 hover 和按钮行为符合规范

## 2. 灵感视图改造（IdeaBoard）

- [ ] 2.1 移除 IdeaBoard.js 中卡片的展开/折叠模式
- [ ] 2.2 在 IdeaBoard.js 卡片中添加 `ms-item-card-actions` 操作按钮容器（编辑、删除）
- [ ] 2.3 改为卡片点击打开详情/编辑 Modal
- [ ] 2.4 确认按钮 `stopPropagation` 和 hover 行为正确

## 3. 任务视图改造（TasksView）

- [ ] 3.1 将 TasksView.js 卡片底部始终可见的操作按钮迁移到 `ms-item-card-actions`（hover 显示）
- [ ] 3.2 确认卡片点击打开详情 Modal 行为保持不变
- [ ] 3.3 确认按钮 `stopPropagation` 和 hover 行为正确

## 4. 模板视图改造（TemplatesView）

- [ ] 4.1 将 TemplatesView.js 中卡片操作按钮容器改为 `class="ms-item-card-actions"`
- [ ] 4.2 添加卡片点击事件，打开模板详情/编辑 Modal
- [ ] 4.3 将删除操作的 `window.confirm` 替换为 Modal 确认弹窗
- [ ] 4.4 确认按钮 `stopPropagation` 和 hover 行为正确

## 5. 发布管理→卡片改造（PublishManager）

- [ ] 5.1 将 PublishManager.js 的 `<table>` 渲染替换为 `div.ms-item-card` 卡片列表
- [ ] 5.2 添加 `ms-item-card-actions` 操作按钮容器（编辑、删除）
- [ ] 5.3 添加卡片点击事件，打开发布任务详情 Modal
- [ ] 5.4 确认按钮 `stopPropagation` 和 hover 行为正确

## 6. 平台配置→卡片改造（PlatformConfig）

- [ ] 6.1 将 PlatformConfig.js 的 `<table>` 渲染替换为 `div.ms-item-card` 卡片列表
- [ ] 6.2 添加 `ms-item-card-actions` 操作按钮容器（编辑、删除）
- [ ] 6.3 添加卡片点击事件，打开配置项详情/编辑 Modal
- [ ] 6.4 确认按钮 `stopPropagation` 和 hover 行为正确

## 7. 验证

- [ ] 7.1 对所有修改过的视图文件运行 `node --check` 语法验证
- [ ] 7.2 逐个视图确认：hover 显示按钮、卡片点击开 Modal、按钮不冒泡
- [ ] 7.3 确认删除操作统一使用 Modal 确认弹窗
- [ ] 7.4 确认空状态统一使用 SVG 图标（无 emoji）
