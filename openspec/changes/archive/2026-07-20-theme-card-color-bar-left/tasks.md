## 1. 修改 ThemeStrategy.js 卡片渲染

- [x] 1.1 移除 `_renderCard()` 中的 swatch div（第 76-78 行），删除 swatch 元素的创建和添加到 card 的操作
- [x] 1.2 在 `_renderCard()` 中添加 `card.style.borderLeft = \`4px solid ${theme.color || '#e94560'}\``，实现对卡片左侧边框的着色

## 2. 验证

- [x] 2.1 运行 `node --check` 确认语法无误
- [x] 2.2 在浏览器中打开主题策略视图，确认卡片左侧显示垂直色条且颜色正确
- [x] 2.3 确认 hover 时左侧色条不变色，其余三边变主色
- [x] 2.4 确认新增/编辑主题后颜色能正确更新到卡片左侧边框
