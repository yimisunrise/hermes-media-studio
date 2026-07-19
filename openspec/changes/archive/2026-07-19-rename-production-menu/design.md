## Context

当前菜单结构：

| 菜单 | label |
|------|-------|
| 选题策划 | `planning` |
| 生产流程 | `production` |
| 发布运营 | `publish` |
| 系统管理 | `system` |

本次变更仅将 `production` 组的 label 从 "生产流程" 改为 "内容创作"。

## Goals / Non-Goals

**Goals:**
- 菜单组 label 更精确地反映功能定位
- 保持四字命名风格统一

**Non-Goals:**
- 不修改菜单项或视图结构
- 不修改 menuGroup 的 id（`production` 保持不变）
- 不涉及国际化和 i18n

## Decisions

无设计决策。这是纯文本替换。

## Risks / Trade-offs

无风险。单行字符串修改，无运行时影响。
