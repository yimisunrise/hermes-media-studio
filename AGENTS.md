# Hermes Media Studio — Agents Guide

## 这是什么

注入到 **Hermes WebUI** 的纯前端扩展。无构建步骤、无框架、无 npm 依赖。

## 快速上手

```bash
# 开发：检查 JS 语法（唯一可用的验证方式）
find src -name "*.js" -exec node --check {} \;
```

无测试套件、无类型检查、无 linter 配置。无 CI。

## 编码约定

### 命名空间隔离
- CSS 类名：以 `ms-` 为前缀（如 `ms-kanban`、`ms-media-card`）
- DOM ID：以 `media-studio-` 为前缀（如 `media-studio-app`、`media-studio-view-container`）
- 切勿使用可能与 WebUI 冲突的裸 CSS 类名或短 ID

### UI 文本
- **全部 UI 文本为中文**（标签、注释、消息）
- 内联 SVG 图标，不在 UI 中使用 emoji
- CSS 变量：使用 `var(--bg, #1a1a2e)` 模式继承 WebUI 主题令牌，提供深色回退值

### 开发初期，不兼容历史
本应用处于开发早期阶段，所有设计、改动和调整**无需考虑兼容历史用户和数据**。保持代码简洁清晰，不要添加迁移/兼容逻辑。除非明确要求删除此规则，否则始终遵守。

## 重要注意事项

- **无构建步骤**：浏览器直接加载扩展文件，模块导入必须兼容原生 ES 模块加载
- **会话可用性**：异步 WebUI 启动期间 `S.session` 可能为 null。扩展最多轮询 8 秒，必要时通过 `POST /api/session/new` 创建独立会话
- **安全性**：扩展以完整 WebUI 会话权限运行。宿主的皮肤值清理机制会阻止 CSS 注入
- **全部交流使用中文**：任何回答、注释、代码评审、PR 描述等一律用中文

## OpenSpec 工作流

本项目使用 `openspec` 管理变更：
- `.opencode/skills/openspec-*` — propose/explore/apply/archive 技能文件
- `openspec/config.yaml` — schema：`spec-driven`
- `openspec/changes/` — 每个变更包含 `design.md`、`proposal.md`、`tasks.md`、`specs/`
- 打开变更：`/openspec-propose` → `/openspec-apply-change` → `/openspec-archive-change`

## 相关文档

| 文档 | 说明 |
|------|------|
| `ARCHITECTURE.md` | 架构设计：模块职责、数据流、文件路径约定 |
| `DESIGN.md` | 业务设计：产品定位、功能定义、用户流程（待创建，当前业务需重新设计） |

## 命令参考

| 操作 | 命令 |
|------|------|
| JS 语法检查 | `find src -name "*.js" -exec node --check {} \;` |
| 运行时 hash 路由 | `#kanban`、`#review`、`#tasks`、`#assets`、`#ideas`、`#topics`、`#themes`、`#database`、`#init` |
