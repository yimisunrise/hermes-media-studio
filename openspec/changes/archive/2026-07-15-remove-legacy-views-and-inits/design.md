## 清理策略

### 总览

遗留代码分四层删除，每层独立验证：

```
Manifest 删除
├─ views (5): publish / archive / copywriting / calendar / platforms
├─ menus (3): publishing / resources / operations
└─ inits (2): workspace / configs
    └─ schema-registry: dependsOn ['orchestrator-core'] 更新

文件系统删除
├─ src/business/views/PublishView.js
├─ src/business/views/MediaArchive.js
├─ src/business/views/CopywritingView.js
├─ src/business/views/CalendarView.js
├─ src/business/views/PlatformConfig.js
├─ src/business/views/components/MediaCard.js
├─ src/business/views/components/MediaDetail.js
└─ src/scripts/install.sh（修改）

api.js 清理
├─ listPlatforms() / createPlatform() / updatePlatform()
└─ listCopywritings() / getCopywriting()

init-def 清理
├─ workspace.init-def.js（删除文件）
└─ configs.init-def.js（删除文件）
```

### 依赖链处理

schema-registry.init-def.js 当前 `dependsOn: ['workspace']`。实际上：
- `bootstrapSystemDb()` 内部调用 `api.mkdir('.database/system')` 创建自身目录
- `createDatabase()` 内部调用 `api.mkdir('.database/main')` 创建自身目录
- 不依赖 workspace 创建的任何目录

只需将 `dependsOn` 改为 `['orchestrator-core']` 即可安全删除 workspace。

### 删除顺序

1. 先改 schema-registry.init-def.js（解除对 workspace 的依赖）
2. 再删除 manifest 中的 workspace/configs init 引用 + init-def 文件
3. 删除 manifest 中的 views/menus 引用 + 视图文件
4. 清理 api.js
5. 清理 install.sh
6. 删除组件文件

### 遗留视图与 api.js 的关系

| 视图 | 使用的 api 方法 | 删除时是否影响其他代码 |
|---|---|---|
| PublishView | api.listPlatforms() / .createPlatform() | 仅自用 |
| PlatformConfig | api.listPlatforms() / .createPlatform() / .updatePlatform() | 仅自用 |
| MediaArchive | api.raw() / 引用 MediaCard/MediaDetail | 组件只被此视图用 |
| CopywritingView | api.listCopywritings() / .getCopywriting() | 仅自用 |
| CalendarView | api.readJSON() / .writeJSON() | 仅自用 |

所有视图的 api 方法均只被自身使用，删除无副作用。
