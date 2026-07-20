## Context

`src/scripts/` 包含三个 Shell 脚本：`install.sh`（创建 workspace 目录结构）、`uninstall.sh`（删除 workspace）、`update.sh`（git pull）。三者功能极其简单，核心命令均不超过 2 行，不值得独立维护。

三份文档（`AGENTS.md`、`README.md`、`ARCHITECTURE.md`）引用了这些脚本，需同步更新。

## Goals / Non-Goals

**Goals:**
- 删除 `src/scripts/` 目录及其全部文件
- 更新 `AGENTS.md` 中快速上手和命令参考表的相关引用
- 更新 `README.md` 中安装、开发、卸载部分的相关引用
- 更新 `ARCHITECTURE.md` 中目录树的相关引用

**Non-Goals:**
- 不修改归档变更（`openspec/changes/archive/`）中的历史引用
- 不引入替代脚本或 skill
- 不改变 workspace 创建/卸载的实际操作方式（仅文档化）

## Decisions

1. **脚本功能直接内联到文档** — 而非迁移为 opencode skill。因为：① 每个脚本只有 1-2 行核心命令；② 这些属于一次性操作（安装/卸载/更新），不需要 AI 自动触发；③ 文档中直接写明命令更透明。

2. **AGENTS.md 命令参考表** — 移除 shell 验证和脚本相关行，保留 hash 路由参考行。JS 语法检查命令保留不动。

3. **ARCHITECTURE.md 目录树** — 直接删除 `scripts/` 分支，不添加替代条目。

## Risks / Trade-offs

- **用户习惯变更**：此前通过 `./src/scripts/install.sh` 安装的用户需要适应直接使用 `mkdir -p` — 文档中写明等价命令即可，风险低。
- **文档遗漏**：可能还有其他文件引用了这些脚本 — 通过 grep 已确认活跃文档仅 3 处，覆盖完整。
