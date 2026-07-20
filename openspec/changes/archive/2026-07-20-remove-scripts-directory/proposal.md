## Why

`src/scripts/` 目录下的三个脚本（`install.sh`、`uninstall.sh`、`update.sh`）功能极其简单（`mkdir -p` / `rm -rf` / `git pull`），已不再需要专门的脚本文件维护。删除后可减少项目冗余文件，降低维护成本。

## What Changes

- **删除** `src/scripts/` 整个目录（含 `install.sh`、`uninstall.sh`、`update.sh`）
- **更新** `AGENTS.md` — 移除快速上手中的 shell 验证命令、命令参考表中的脚本条目
- **更新** `README.md` — 安装/卸载部分用内联命令替代脚本调用，移除开发部分对 shell 脚本的引用
- **更新** `ARCHITECTURE.md` — 目录树中移除 `scripts/` 分支

## Capabilities

### New Capabilities

无。本次变更为纯粹的目录清理和文档更新，不引入任何新能力。

### Modified Capabilities

无。不涉及任何 spec 级别的需求变更。

## Impact

- **删除文件**：`src/scripts/install.sh`、`src/scripts/uninstall.sh`、`src/scripts/update.sh`
- **修改文档**：`AGENTS.md`、`README.md`、`ARCHITECTURE.md`
- 归档变更中的历史引用（`openspec/changes/archive/`）不受影响
