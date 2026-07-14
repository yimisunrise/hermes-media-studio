## Context

Media Studio 的初始化管线（InitPipeline）执行一系列步骤完成工作空间初始化。每步成功后调用 `SchemaRegistry.writeStepStatus()` 将步骤状态写入 `boot.json`。但 `writeBoot()` 方法以 `BOOT_DEFAULTS`（`init_state: 'pending'`）作为基础展开对象，`writeStepStatus()` 不传递 `init_state` 字段，导致每次写入都覆盖掉已设置的 `init_state`。

最终结果：`markBootComplete()` 正确设置 `init_state: 'done'` 后，管线自动调用 `writeStepStatus('mark-done', 'done')` 将 `init_state` 重置为 `'pending'`。页面上内存状态正确（`_workspaceReady = true`），但磁盘文件始终记录 `init_state: 'pending'`。

## Goals / Non-Goals

**Goals:**
- 修复 boot.json 的 `init_state` 在管线执行后被意外重置为 `'pending'` 的问题
- 确保 `writeBoot()` 在更新部分字段时不丢失其他已有字段
- 保持 `markBootComplete()` 设置 `init_state: 'done'` 的能力

**Non-Goals:**
- 不改变 `readBoot()` 的行为
- 不重构 `BOOT_DEFAULTS` 的结构
- 不改动 InitPipeline 的执行逻辑

## Decisions

### 决定：将基础展开源从 `BOOT_DEFAULTS` 改为当前文件内容

`writeBoot(data)` 当前实现：
```js
const payload = { ...BOOT_DEFAULTS, ...data, updated_at: ... };
```

改为：
```js
const current = await this.readBoot();
const payload = { ...current, ...data, updated_at: ... };
```

**理由**：
- `current` 是磁盘上 boot.json 的当前内容，包含所有已设置的字段（`init_state`、`boot_id` 等）
- `data` 覆盖在 `current` 之上，显式传入的字段（如 `markBootComplete` 的 `init_state: 'done'`）仍可正确生效
- 未显式传入的字段（如 `writeStepStatus` 不传 `init_state`）从 `current` 继承，不会被意外重置
- `readBoot()` 在文件不存在时返回 `BOOT_DEFAULTS`，所以首次写入行为不变

**放弃的方案**：
- 在 `writeStepStatus` 中显式传入 `init_state` → 需要调用方了解内部实现细节，耦合度高
- 在 `writeBoot` 中先 `delete payload.init_state` 除非 data 包含 → 逻辑复杂隐晦

## Risks / Trade-offs

- [低] `readBoot()` 额外的一次文件读取 → 仅发生在初始化管线和状态写入时，非热路径，性能无影响
- [低] 如果 `boot.json` 被人为编辑为非法状态 → `readBoot()` 返回 `BOOT_DEFAULTS`，行为退化到当前状态（即重置为 `pending`），这是合理的防御性兜底
