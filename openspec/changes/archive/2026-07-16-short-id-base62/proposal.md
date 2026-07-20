## Why

当前数据库记录主键使用 UUID v4（36 位字符串如 `8eec30d0-4d42-4c39-bda9-12c42baceb86`），在调试、日志、URL 中过长且难以阅读。需要一个更短的 ID 格式，同时保持唯一性和有序性。

## What Changes

- 将 `DataRepository.newId()` 和 `meta.uuid()` 中的 UUID v4 生成替换为 **7 位 Base62 毫秒时间戳编码**
- 仅修改 ID 生成函数，不改变表结构定义、数据存储方式或外部接口
- 新旧 ID 格式可在数据库中共存，无需数据迁移

## Capabilities

### New Capabilities
- `short-id`: 7 位 Base62 毫秒时间戳 ID 生成，时间有序、零额外状态

### Modified Capabilities

（无 — 仅是 ID 生成策略的内部替换，不改变现有功能的规格行为）

## Impact

- **`src/framework/core/DataRepository.js`**: 修改 `newId()` 函数
- **`src/framework/utils/meta.js`**: 修改 `uuid()` 函数
- **`src/business/views/TaskDetail.js`**: 两处内联的 `crypto.randomUUID()` 调用
- **`src/business/views/AssetGallery.js`**: 两处内联的 `crypto.randomUUID()` 调用
- **`src/framework/core/AgentTaskPoller.js`**: 一处 `crypto.randomUUID()` 调用
- 表结构定义（`business-db.init-def.js`）的 `type: 'uuid'` 维持不变，因为它只是 Schema 标记而非生成逻辑
- 现有 UUID 格式数据不受影响，新旧格式可共存
