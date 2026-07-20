## Why

TemplatesView 的 "创作简报" / "文稿内容" 标签切换后，底部蓝色活动指示线始终停留在"创作简报"上，未跟随切换。这是一个视觉 bug，影响用户体验。

## What Changes

- 在 `TemplatesView.js` 中保存 tab 按钮引用数组，切换 tab 时同步更新所有按钮的 `borderBottomColor` 样式，使蓝色底线跟随当前激活标签

## Capabilities

### New Capabilities

<!-- 无新能力，纯 bug fix -->

### Modified Capabilities

<!-- 无 spec 级别的需求变更 -->

## Impact

- 仅修改 `src/business/views/TemplatesView.js` 一个文件
