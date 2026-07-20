## 1. 删除 src/scripts/ 目录

- [x] 1.1 删除 `src/scripts/install.sh`
- [x] 1.2 删除 `src/scripts/uninstall.sh`
- [x] 1.3 删除 `src/scripts/update.sh`
- [x] 1.4 删除空的 `src/scripts/` 目录

## 2. 更新 AGENTS.md

- [x] 2.1 快速上手部分 — 移除 `bash -n src/scripts/install.sh` 行
- [x] 2.2 命令参考表 — 移除 Shell 语法检查、初始化工作空间、卸载、更新 4 行

## 3. 更新 README.md

- [x] 3.1 安装部分 — 将 `./src/scripts/install.sh` 用法替换为等价 `mkdir -p` 命令
- [x] 3.2 开发部分 — 移除 `bash -n src/scripts/install.sh` 行
- [x] 3.3 卸载部分 — 将 `./src/scripts/uninstall.sh` 替换为等价 `rm -rf` 命令

## 4. 更新 ARCHITECTURE.md

- [x] 4.1 目录树 — 移除 `scripts/` 分支及其子条目

## 5. 验证

- [x] 5.1 确认 `src/scripts/` 已不存在
- [x] 5.2 确认 grep `install.sh\|uninstall.sh\|update.sh` 在活跃文档中已无匹配
