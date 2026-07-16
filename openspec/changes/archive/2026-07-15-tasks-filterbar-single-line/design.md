## Context

筛选栏当前 CSS `flex-wrap: wrap` 导致三个子元素（类型 select、状态 select、归档 checkbox）在布局中被折为三行，浪费垂直空间。

## Goals / Non-Goals

**Goals:**
- 三个筛选元素强制显示在一行
- 仅移除造成换行的 CSS 属性

**Non-Goals:**
- 不改动 DOM 结构
- 不改动筛选逻辑
- 不改变其他视图的 filterbar

## Decisions

- 方案 A：移除 `flex-wrap: wrap` — 最简单，保证子元素不换行。窄屏下可能溢出，但溢出远比三行好。

## Risks / Trade-offs

- 窄屏布局可能溢出 → 可接受，且后续可通过 `overflow-x: auto` 优化
