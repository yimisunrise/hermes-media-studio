## 1. Framework CSS — 定义变量与基准类

- [x] 1.1 在 `framework/app.css` 的 `:root {}` 中新增 5 个 `--ms-input-*` CSS 变量（radius/padding/font-size/sm-padding/sm-font-size）
- [x] 1.2 更新 `.ms-input` 基准类使用 `--ms-input-radius`、`--ms-input-padding`、`--ms-input-font-size`
- [x] 1.3 更新 `.ms-select` 基准类使用 `--ms-input-radius`、`--ms-input-padding`、`--ms-input-font-size`
- [x] 1.4 新增 `.ms-input-sm` 紧凑变体类（使用 `--ms-input-sm-padding`、`--ms-input-sm-font-size`、`--ms-input-radius`）

## 2. Business CSS — 业务层样式统一

- [x] 2.1 更新 `.ms-form-group input`、`.ms-form-group select` 使用 `--ms-input-radius` 替代硬编码 `8px`
- [x] 2.2 更新 `.ms-form-group-content input` 使用 `--ms-input-radius`（CSS 中无此选择器，跳过）
- [x] 2.3 更新 `.ms-data-entry-field` padding 使用 `--ms-input-padding`
- [x] 2.4 检查并统一 `business/app.css` 中其他硬编码的 input padding/radius（无其他需要处理的）

## 3. 视图行内样式清理

- [x] 3.1 IdeaBoard.js — 移除过滤栏 input 上的 `style.cssText` padding/border-radius 覆盖，添加 `.ms-input-sm` 类
- [x] 3.2 TopicBoard.js — 移除过滤栏 input 上的 `style.cssText` padding/border-radius 覆盖，添加 `.ms-input-sm` 类
- [x] 3.3 PublishManager.js — 移除平台配置 input 上的 `style.cssText` padding/height 覆盖
- [x] 3.4 PlatformConfig.js — 移除 input 上的 `style.cssText` padding 覆盖
- [x] 3.5 DBEdit.js — 将 `.ms-db-edit-input` 的 border-radius 改为 `var(--ms-input-radius)`，padding 改为 `--ms-input-sm-padding`（紧凑场景）
- [x] 3.6 ContentEditor.js — 检查标题 input 的 font-size 覆盖，若需保留则通过 CSS 类控制

## 4. 验证

- [x] 4.1 全局搜索 `style.*padding`、`style.*borderRadius`、`style.*height` 确保无遗漏行内覆盖
- [x] 4.2 运行 `find src -name "*.js" -exec node --check {} \;` 验证 JS 语法无错误（所有错误均为 ES module 预存问题，非本次变更引入）
- [x] 4.3 逐视图视觉确认 input/select 高度和圆角一致
