## Why

当前菜单组"生产流程"的命名过于工业化，与面向自媒体创作者的工具定位不匹配。创作者是在"创作"内容，而非"生产"内容。更名为"内容创作"后，与"选题策划→内容创作→发布运营→系统管理"形成清晰的**想→做→发→管**语义递进。

## What Changes

- 菜单组 `production` 的 `label` 从 `"生产流程"` 改为 `"内容创作"`
- 仅修改 `manifest.js` 中的字符串常量，无逻辑变更

## Capabilities

### New Capabilities

无。本次变更为纯 UI 文字调整，不涉及能力变更。

### Modified Capabilities

无。

## Impact

- `src/business/manifest.js` — 菜单组 `production` 的 `label` 字段值修改
