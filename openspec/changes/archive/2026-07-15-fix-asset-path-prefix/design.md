## Context

当前素材上传路径在两个地方硬编码了 `workspace/assets/`：
- `src/business/views/AssetGallery.js`（第 165、168 行）
- `src/business/views/TaskDetail.js`（第 272、275 行）

这些路径最终传给 `api.js` 的 `_buildPath()` 方法，该方法会自动在所有路径前加 `media-studio/` 前缀。因此实际文件系统路径为：

```
<S.session.workspace>/media-studio/workspace/assets/YYYY-MM/uuid-file.ext
```

其中 `workspace/` 是冗余层。在 `api.js` 使用 `_buildPath` 统一前缀管理的情况下，各视图不应再自行添加目录前缀。

## Goals / Non-Goals

**Goals:**
- 消除 `workspace/assets/` → `assets/` 的硬编码路径
- 使素材存储路径统一为 `<buildRoot>/assets/YYYY-MM/uuid-file.ext`
- 保持现有功能不变

**Non-Goals:**
- 不迁移已有素材文件（旧路径下的文件保留在原位）
- 不修改 `api.js` 的 `_buildPath` 行为
- 不修改数据库中的 `filePath` 记录（这些记录仍指向旧路径，新上传的文件使用新路径）

## Decisions

### 决策：直接字符串替换，不做自动迁移

- **理由**：项目处于早期开发阶段（AGENTS.md 明确说明"不兼容历史"），旧素材文件数量很少或不存在。迁移逻辑增加复杂度且无实际收益。
- **替代方案考虑**：迁移脚本（太重量级），数据库 `filePath` 字段全量更新（不必要的风险）。

### 决策：两处文件各自独立修改

- **理由**：AssetGallery.js 和 TaskDetail.js 的路径拼装逻辑各自独立，放在同一个变更中修改即可，无需抽象为共享函数。

## Risks / Trade-offs

- **[低风险] 旧素材不可见**：旧上传的素材文件路径含 `workspace/`，新代码读 `assets/` 找不到它们。→ 项目初期，旧文件几乎不存在，此风险可接受。
- **[低风险] 数据库 filePath 不一致**：已存在的 Asset 记录中 `filePath` 字段含 `workspace/assets/`。→ 只影响记录的精确性，AssetGallery 通过 `_ar().list()` 读取记录后再显示，不直接依赖文件路径匹配。
