## Context

当前初始化页面使用 `DIRS_TO_CREATE` 常量渲染一个扁平的目录列表，只显示目录名，不包含文件、数据库结构等完整信息。用户无法直观地理解初始化的全貌。

InitPipeline 创建的实际内容远比扁平列表丰富：
- 9 个顶层目录
- `.system/boot.json` 初始化标记文件
- `.database/` 完整数据库骨架（system 库 + main 库 + 注册表）
- `configs/workflows/task-lifecycle.json` 默认配置

需要将扁平列表替换为完整的树形结构。

## Goals / Non-Goals

**Goals:**
- 用树形结构替换初始化页面的扁平目录列表
- 树形结构包含所有目录、文件（boot.json、db.json、schema.json、data.json、task-lifecycle.json）
- 区分目录（📁）和文件（📄）图标
- 默认全部展开
- 已存在的项显示 ✅ 标记
- 初始化过程中，树节点随 pipeline 步骤进度逐个显示 ✅
- 初始化完成后全部标记 ✅

**Non-Goals:**
- 不改变初始化流程逻辑（pipeline 步骤不动）
- 不做树节点的折叠/展开交互（全部展开即可）
- 不添加搜索或过滤功能

## Decisions

| 决策 | 方案 | 理由 |
|------|------|------|
| 树形数据结构 | 在 app.js 中定义静态树形数组 `INIT_TREE`，每个节点标注所属 step | 简单直接，与 DIRS_TO_CREATE 同级管理 |
| 渲染方式 | 递归渲染 `<div>` 嵌套结构，用 padding-left 实现缩进 | 无需 CSS tree 组件，零依赖 |
| 步骤→节点映射 | 树节点通过 `step` 属性关联到 pipeline 步骤名 | onProgress 回调按 step 名称找到匹配节点，批量切换状态 |
| 存在性检查 | 页面加载时调用 `api.tree('.')` 获取顶层目录列表，匹配已存在的顶层节点 | 一次 API 调用即可，不需要逐个探测 |
| 进度更新 | onProgress 回调中解析 stepName，找到树中所有匹配该 step 的节点，添加 `.done` 类 | 批量更新高效，不依赖节点级状态追踪 |
| 文件类型图标 | 目录用 `📁`、文件用 `📄`，通过 CSS content 实现 | 简单零代码改动，纯 CSS |

## Risks / Trade-offs

- **API 调用延迟**：页面加载时调用 `api.tree('.')` 可能因 WebUI 响应慢而延迟展示
  → 先渲染无勾选的树，异步完成存在性检查后更新勾选状态
- **树结构与 pipeline 步骤解耦**：树节点标注的 step 名必须与 pipeline 注册的名一致
  → 在 _registerInitSteps 和 INIT_TREE 之间保持一致命名（已在 DIRS_TO_CREATE 体现）
- **`.database/` 不在 DIRS_TO_CREATE 中**：由 bootstrap-core 步骤创建，树结构中放在顶层
  → 树结构独立于 DIRS_TO_CREATE，可包含任意节点
