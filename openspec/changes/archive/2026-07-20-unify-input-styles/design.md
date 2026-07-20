## Context

Hermes Media Studio 是一个纯前端扩展，零构建步骤，所有样式通过 CSS 文件和行内 style 定义。当前表单元素（input、select、textarea）在不同视图间存在严重的不一致：

| 属性 | 当前值分布 | 问题 |
|------|-----------|------|
| border-radius | 3px / 4px / 8px | 三个不同值 |
| padding | 6px 12px / 8px 12px / 8px 10px / 6px 8px / 3px 6px / 3px 8px / 4px 8px | 七种组合 |
| 隐式高度 | ~34px / ~30px / ~24px | 三个高度区间 |
| 行内覆盖 | 6 个视图文件存在 style.cssText 直接覆盖 | 覆盖 CSS 类定义 |

框架层 `framework/app.css` 已有部分基准类（`.ms-input`、`.ms-select`），但业务层和特定视图多有覆盖。无 CSS 变量体系。

## Goals / Non-Goals

**Goals:**
- 统一所有 input/select/textarea 的 border-radius 为 `var(--ms-radius-sm)`（4px）
- 定义 `--ms-input-height` 和 `--ms-input-padding` CSS 变量作为唯一 padding 来源
- 新增 `.ms-input-sm` 紧凑变体（用于过滤栏、弹窗等空间受限场景）
- 移除所有视图文件中针对 input/select 的行内 padding/radius/height 覆盖
- 所有表单元素隐式高度一致（~32px 标准，~26px 紧凑）

**Non-Goals:**
- 不改变表单元素的布局结构（flex/grid 排列不变）
- 不改动按钮（button）样式
- 不改变颜色、边框色、背景色
- 不引入新的外部依赖或构建工具
- 不重构视图的业务逻辑

## Decisions

### 1. CSS 变量方案（而非 Sass/Less 变量）

- **方案**: 在 `framework/app.css` 中用 `:root {}` 定义 `--ms-input-*` CSS 变量
- **理由**: CSS 变量是原生标准，无需构建步骤，运行时可变，与本项目的"零构建"原则完全吻合
- **替代考虑**: 硬编码值（拒绝——无法统一管理）；PostCSS 插件（拒绝——引入构建步骤）

### 2. 变量默认值

```
--ms-input-radius: var(--ms-radius-sm, 4px);
--ms-input-padding: 6px 12px;
--ms-input-font-size: 13px;
--ms-input-height: calc(var(--ms-input-font-size) + 2 * var(--ms-input-padding-v) + 2px);
```

其中 `--ms-input-padding-v` 为垂直方向 6px，通过 `padding-block` 控制。线高固定为 1.4（18.2px），总高度 ≈ 13px + 12px + 2px = ~32px。

### 3. 紧凑变体 `.ms-input-sm`

```
--ms-input-sm-padding: 3px 8px;
--ms-input-sm-font-size: 12px;
```

总高度 ≈ 12px + 6px + 2px = ~26px。适用于过滤栏、弹窗、内联编辑。

### 4. 行内覆盖清理策略

每个视图文件的清理策略：
- **完全移除**：如果行内 `style.cssText` 只设置了 padding/radius/height → 直接删除整个 `style.cssText`
- **保留非重叠属性**：如果 style 还设置了颜色、宽度等 → 只移除 padding/radius/height 子串
- **统一走 CSS 类**：不依赖行内样式定义尺寸

### 5. 选择器优先级处理

为了覆盖 WebUI 宿主可能注入的样式，框架基准类保持适度特异性（`.ms-input:where(input, select, textarea)`），但不用 `!important`。

## Risks / Trade-offs

- **[行内覆盖遗漏]** 可能有个别视图文件未被发现 → **缓解**: 清理后全局搜索 `style.*padding`、`style.*borderRadius`、`style.*height` 再验证
- **[回退值兼容]** 现有 `var(--ms-radius-sm)` 已在部分类中使用，但未在 `framework/app.css` 定义 → **缓解**: 确认变量定义在 `:root` 中，或提供 `4px` 后备
- **[隐式高度偏移]** 统一 padding 后某些输入框高度变化 1-3px，可能影响布局 → **缓解**: 优先检查紧凑空间（过滤栏、弹窗），这些场景使用 `.ms-input-sm`
- **[textarea 特殊处理]** textarea 可能需要不同 padding 策略 → **缓解**: `.ms-textarea` 使用 `--ms-input-padding` 但允许覆盖 `min-height`
