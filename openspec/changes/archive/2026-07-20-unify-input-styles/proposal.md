## Why

应用中 input、select、textarea 等表单元素在不同功能视图（IdeaBoard、TopicBoard、PublishManager、PlatformConfig 等）之间存在不一致的 border-radius、padding、font-size 和隐式高度，导致 UI 显得零散、不专业。这种不一致源自缺乏统一的设计变量和 CSS 基类，各视图开发者自行定义样式甚至使用行内 style.cssText 覆盖。

## What Changes

- 在 `framework/app.css` 中新增统一的表单元素 CSS 变量体系（`--ms-input-height`、`--ms-input-padding`、`--ms-input-radius` 等）
- 新增 `.ms-input-sm` 紧凑变体类，覆盖需要更小尺寸的场景（过滤栏、弹窗内字段）
- 统一所有 input、select、textarea 的 `border-radius` 为 `var(--ms-radius-sm)`（4px）
- 移除所有视图文件中直接写在 input/select 上的行内 `padding`、`border-radius`、`height` 样式覆盖
- 将分散的 `.ms-form-input`、`.ms-form-group`、`.ms-data-entry-field` 等类的 padding/radius 统一引用 CSS 变量

## Capabilities

### New Capabilities
- `form-elements`: 统一的表单元素样式系统，包含 CSS 变量定义、基准类（`.ms-input`、`.ms-select`、`.ms-textarea`）、紧凑变体（`.ms-input-sm`），以及所有视图对输入元素的样式引用标准

### Modified Capabilities
<!-- 无现有 spec 的行为级变更 -->

## Impact

- **`framework/app.css`**: 新增 CSS 变量和表单元素基准类
- **`business/app.css`**: 移除 `.ms-form-group`、`.ms-data-entry-field` 等冗余类中的硬编码 padding/radius，改为引用变量
- **视图文件**: 以下 JS 文件需移除行内样式覆盖：
  - `views/IdeaBoard/IdeaBoard.js` — 过滤栏 input padding 覆盖
  - `views/TopicBoard/TopicBoard.js` — 过滤栏 input padding 覆盖
  - `views/PublishManager/PublishManager.js` — 平台配置 input padding/height 覆盖
  - `views/PlatformConfig/PlatformConfig.js` — input padding 覆盖
  - `views/DatabaseManage/DBEdit.js` — `.ms-db-edit-input` 自定义 padding/radius
  - `views/Content/ContentEditor.js` — 标题 input font-size 覆盖
- 无新增外部依赖，纯 CSS + 行内样式清理
