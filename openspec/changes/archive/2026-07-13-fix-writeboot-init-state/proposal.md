## Why

初始化管线完成后刷新页面，Media Studio 再次显示初始化界面。原因是 `SchemaRegistry.writeBoot()` 以 `BOOT_DEFAULTS`（含 `init_state: 'pending'`）为基础展开，而管线每步成功后调用的 `writeStepStatus()` 不传递 `init_state`，导致 `init_state` 被覆盖回 `'pending'`。磁盘上的 boot.json 始终记录 `init_state: 'pending'`，页面刷新后 `readBoot()` 读取到错误状态，重新显示初始化界面。

## What Changes

- `src/core/SchemaRegistry.js` — `writeBoot()` 方法：将基础展开源从 `BOOT_DEFAULTS` 改为当前 boot.json 文件内容（`readBoot()`），确保未显式覆盖的字段得以保留
- 行为变化：`writeStepStatus()` 不再意外重置 `init_state`；`markBootComplete()` 仍可正确设置 `init_state: 'done'`

## Capabilities

### New Capabilities

- `writeboot-persistence`: 确保 boot.json 的写入操作不会丢失未显式传入的状态字段

### Modified Capabilities

无

## Impact

- `src/core/SchemaRegistry.js` — 仅 `writeBoot()` 方法的一行改动
- 无 API 变更、无新增依赖、无破坏性变更
