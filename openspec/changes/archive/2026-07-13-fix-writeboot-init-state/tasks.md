## 1. SchemaRegistry 修复

- [x] 1.1 修改 `writeBoot()` 方法，将基础展开源从 `BOOT_DEFAULTS` 改为 `await this.readBoot()` 的当前文件内容
- [x] 1.2 验证 JS 语法：`node --check src/core/SchemaRegistry.js`

## 2. 验证

- [x] 2.1 手动检查：确认 `writeStepStatus()` 调用后 `boot.json` 中的 `init_state` 不会被重置为 `'pending'`
- [x] 2.2 场景测试：确认首次写入（boot.json 不存在）时行为不变（`readBoot()` 返回 `BOOT_DEFAULTS`）
