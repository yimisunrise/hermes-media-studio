## Context

当前初始化流程存在两个问题：
1. 初始化标记使用 `.index/init.json`，与 ARCHITECTURE.md 设计的引导层（`.system/boot.json`）不一致
2. 未初始化时所有菜单仍可见（仅带警告横幅），用户容易被误导导航到不可用的功能页面

## Goals / Non-Goals

**Goals:**
- 将初始化标记从 `.index/init.json` 迁移到 `.system/boot.json`，格式对齐架构设计
- 未初始化时菜单只显示"初始化"入口，其余隐藏
- 未初始化时对非 `init` 路由做保护性跳转

**Non-Goals:**
- 不实现 ARCHITECTURE.md 完整的 7 步引导流程（`.database/` 骨架等）
- 不修改现有的核心模块（SchemaRegistry, DataRepository 等）
- 不做旧的 `.index/init.json` → `.system/boot.json` 自动迁移（用户重新初始化即可）

## Decisions

| 决策 | 方案 | 理由 |
|------|------|------|
| boot.json 格式 | `{version, init_state: "complete", last_boot, directories}` | 对齐 ARCHITECTURE.md Section VII，预留 `init_state` 字段 |
| 菜单隐藏方式 | `_createPanel()` 中根据 `this._workspaceReady` 过滤 `MENU_GROUPS` | 避免维护两份菜单配置，渲染时动态过滤 |
| 路由保护 | 在 `init()` 启动逻辑 + `router.navigate()` 拦截中判断 | 双重保障：启动时跳转 + 运行时拦截 |
| 不兼容旧标记 | 直接检测 `.system/boot.json`，不回退到 `.index/init.json` | 简化逻辑，旧用户只需重新初始化一次 |

## Risks / Trade-offs

- [低] 已初始化用户升级后需要重新执行初始化 → `.system/boot.json` 不存在，`checkInitialized()` 返回 `false`，用户看到初始化页面，点击按钮即可完成
