## Why

当前初始化流程与 ARCHITECTURE.md 设计的引导层不一致：初始化标记使用 `.index/init.json` 而非 `.system/boot.json`，且未初始化时所有菜单仍然显示（仅带警告）。需要对齐架构设计，使引导流程成为框架启动的基础设施，并在未初始化时提供清晰的 UI 引导体验。

## What Changes

- **初始化标记迁移**：从 `.index/init.json` 改为 `.system/boot.json`，格式按 ARCHITECTURE.md：`{ version, init_state, last_boot, directories }`
- **菜单隐藏逻辑**：工作空间未初始化时，菜单仅显示"系统管理→初始化"入口，其他所有菜单分组和菜单项隐藏
- **路由保护**：未初始化时，非 `init` 路由自动跳转到 `#init`
- **删除旧的 `.index/init.json` 检测**：`checkInitialized()` 改为检测 `.system/boot.json`

## Capabilities

### New Capabilities

- `boot-flow`: 按 ARCHITECTURE.md 设计的引导层，`.system/boot.json` 作为初始化标记

### Modified Capabilities

<!-- 无现有 specs 需要修改 -->

## Impact

- **修改文件**：
  - `src/app.js` — `_writeInitMarker()` 写入路径/格式；`_createPanel()` 菜单过滤；启动跳转逻辑
  - `src/modules/api.js` — `checkInitialized()` 检测 `.system/boot.json`
- 无需迁移脚本：`.index/init.json` 将不再被检测，已初始化用户只需重新执行一次初始化
