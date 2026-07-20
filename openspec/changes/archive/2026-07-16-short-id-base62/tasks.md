## 1. 核心 ID 生成函数

- [x] 1.1 在 `src/framework/utils/meta.js` 中实现 `shortId()` 函数（7 位 Base62 毫秒时间戳编码）
- [x] 1.2 在 `src/framework/core/DataRepository.js` 中将 `newId()` 替换为调用 `shortId()` 并添加碰撞重试逻辑
- [x] 1.3 将 `meta.js` 中的 `uuid()` 函数替换为调用 `shortId()`

## 2. 替换内联 randomUUID() 调用

- [x] 2.1 替换 `src/business/views/TaskDetail.js` 中的 `crypto.randomUUID()` 调用（两处）
- [x] 2.2 替换 `src/business/views/AssetGallery.js` 中的 `crypto.randomUUID()` 调用（两处）
- [x] 2.3 替换 `src/framework/core/AgentTaskPoller.js` 中的 `crypto.randomUUID()` 调用（一处）

## 3. 验证

- [x] 3.1 运行 `find src -name "*.js" -exec node --check {} \;` 确认语法无误
- [x] 3.2 检查无残留的 `crypto.randomUUID()` 调用（确认 6 处均已覆盖）
