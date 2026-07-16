## 1. 公共 CSS 类

- [x] 1.1 app.css 添加 `.ms-panel-section`（flex:1 纵向容器）
- [x] 1.2 app.css 添加 `.ms-panel-header`（flex space-between, padding:12px 16px, border-bottom）
- [x] 1.3 app.css 添加 `.ms-panel-filterbar`（flex gap:8px, padding:6px 16px, flex-wrap）
- [x] 1.4 app.css 添加 `.ms-panel-body`（padding:12px 16px, overflow-y:auto, flex:1）
- [x] 1.5 app.css 添加 `.ms-item-card`（bg-card + border + radius + padding + cursor + transition + :hover）

## 2. IdeaBoard 重构

- [x] 2.1 页面结构改用 `.ms-panel-section` / `.ms-panel-header` / `.ms-panel-filterbar` / `.ms-panel-body`
- [x] 2.2 卡片移除内联 `style.cssText`，改用 `.ms-item-card` 类
- [x] 2.3 移除 JS hover handler（`onmouseenter/leave` 改 CSS `:hover`）

## 3. TopicBoard 重构

- [x] 3.1 页面结构改用 `.ms-panel-section` / `.ms-panel-header` / `.ms-panel-filterbar` / `.ms-panel-body`
- [x] 3.2 卡片移除内联样式，改用 `.ms-item-card`
- [x] 3.3 移除 JS hover handler

## 4. TasksView 重构

- [x] 4.1 移除 `_injectStyles()` 方法及其注入的 `<style>` 块
- [x] 4.2 页面结构改用 `.ms-panel-section` / `.ms-panel-header` / `.ms-panel-filterbar` / `.ms-panel-body`
- [x] 4.3 卡片改用 `.ms-item-card`，将原有 `.ms-task-card` 特有样式迁移到 app.css

## 5. 验证

- [x] 5.1 JS 语法检查（`node --check`）
