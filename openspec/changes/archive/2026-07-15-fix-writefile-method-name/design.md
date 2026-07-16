## Context

素材上传功能在当前版本完全不可用。`AssetGallery._uploadFile()` 和 `TaskDetail._onUpload()` 调用 `this.api.writeFile()`，但 `WorkspaceAPI` 类的方法名为 `write()`。该方法是 ``writefile` 功能在 `api.js` 重构时（业务方法剥离后）被改名为 `write`，但调用方未同步更新。

## Goals / Non-Goals

**Goals:**
- 修复 AssetGallery 和 TaskDetail 中的上传功能
- 保证方法调用与 `WorkspaceAPI.write()` 签名匹配

**Non-Goals:**
- 不改变 `WorkspaceAPI` 的接口
- 不引入额外的参数校验或重试逻辑
- 不涉及上传流程之外的任何修改

## Decisions

| 决策 | 选择 | 理由 |
|------|------|------|
| 修复方式 | 调用方改为 `write()` | 保持 API 层稳定，不新增冗余方法别名。`write()` 已有完整的 404→create 回退逻辑，不需要重复实现 |

## Risks / Trade-offs

- 无 —— 纯方法名修正，不影响其他调用方，不影响 API 行为
