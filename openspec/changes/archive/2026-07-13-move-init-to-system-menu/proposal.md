## Why

当前"初始化"菜单项位于"运营配置"分组下，但其功能属于工作空间初始化管理，与系统层面的设置（如"数据库"）语义上更接近。将其移到"系统管理"分组，使菜单分组逻辑更清晰、更符合用户直觉。

## What Changes

- 将"初始化"菜单项从"运营配置"(`operations`)分组移入"系统管理"(`system`)分组
- "运营配置"分组保留，仅包含"平台配置"菜单项
- "系统管理"分组变为包含"初始化"和"数据库"两个菜单项
- 修改范围仅限于 `src/app.js` 中 `MENU_GROUPS` 常量的配置

## Capabilities

### New Capabilities

无新增能力。

### Modified Capabilities

无能力变更。此改动仅涉及 UI 菜单重组，不改变任何功能的 behavior。

## Impact

- **修改文件**：`src/app.js` — `MENU_GROUPS` 常量中的菜单项归属调整
- 无运行时行为变化
- 无 API 或数据模型变更
