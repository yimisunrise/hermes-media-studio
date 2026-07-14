## Why

当前初始化页面（`_renderInitView`）仅展示一个扁平的目录列表，用户无法直观地看到初始化将创建的全部内容——包括目录、文件、数据库结构和配置文件。需要替换为完整的树形结构展示，让用户在点击"初始化"之前就能清楚了解工作空间的全貌。

## What Changes

- **替换** `_renderInitView()` 中的扁平目录列表为完整树形结构
- 树形结构区分目录（📁）和文件（📄）图标
- 默认全部展开
- 已存在的文件和目录显示 ✅ 勾选标记
- 初始化过程中，树形节点随 pipeline 步骤进度逐个标记为 ✅
- 初始化完成后，树形结构保持显示，全部节点标记 ✅

## Capabilities

### New Capabilities
- `init-layout`: 初始化页面树形内容展示，包括完整树形渲染、存在性检查、步骤进度联动

### Modified Capabilities
<!-- No existing specs modified -->

## Impact

- `src/app.js` — 修改 `_renderInitView()` 方法，替换扁平列表为树形 HTML 渲染
- `src/core/InitPipeline.js` — 可选：扩展步骤上下文，提供步骤到树节点的映射（或由 app.js 处理映射）
- `src/app.css` — 新增树形结构的样式规则（缩进、图标、勾选状态）
- 无新增依赖
