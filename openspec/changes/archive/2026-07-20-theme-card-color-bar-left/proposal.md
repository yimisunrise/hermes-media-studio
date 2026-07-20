## Why

当前 ThemeStrategy（主题策略）卡片使用顶部水平色条（4px 高的 swatch div）展示主题色，而看板（Kanban）卡片使用左侧 border-left 色条。为统一视觉语言并更直观地展示主题色标识，将颜色条移至卡片左侧，与看板卡片风格一致。

## What Changes

- **ThemeStrategy.js**：移除卡片顶部水平色条 swatch `<div>`，改为在卡片 `.ms-item-card` 上设置 `border-left: 4px solid <theme.color>`
- **app.css**（可选）：为 `ms-item-card` 增加对左侧边框圆角的支持（如果现有样式不够），确保左侧色条视觉平滑

纯视觉改动，无数据模型变更，无 API 变动。

## Capabilities

### New Capabilities
无新增能力——此变更属于已有 `theme-management` 能力范围内的 UI 调整，不改变任何功能规格。

### Modified Capabilities
- `theme-management`：主题策略卡片颜色标识从顶部水平条改为左侧垂直边框，视觉呈现方式变更，不影响功能行为。

## Impact

- **Affected files**: `src/business/views/ThemeStrategy.js`（移除 swatch div + 添加 border-left 内联样式）
- **Possibly**: `src/business/app.css`（如需调整 `.ms-item-card` 的 border-radius 行为）
- 无数据层影响，无 API 变更，无新增依赖
