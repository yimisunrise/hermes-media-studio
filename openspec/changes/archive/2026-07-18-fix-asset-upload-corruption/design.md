## Context

Hermes Media Studio 是一个纯前端扩展，通过 WebUI 的 `WorkspaceAPI` 与后端交互。当前图片上传流程使用 `FileReader.readAsDataURL` 将文件转为 Base64 Data URL 字符串，再通过 `api.write(relPath, dataUrl)` 以 JSON POST 写入磁盘。导致磁盘文件为 Data URL 文本而非原始二进制，浏览器/OS 无法解码显示。

同时存在以下问题：
- AssetCard 预览路径与文件实际存储路径不匹配，缩略图无法加载
- 删除资产时仅删除数据库记录，磁盘文件残留
- AssetGallery 和 TaskDetail 两处上传逻辑 100% 重复
- 文件名为用户输入，拼入文件路径时未消毒

## Goals / Non-Goals

**Goals:**
- 上传图片以原始二进制格式写入磁盘，文件可在外部正常打开
- AssetCard 缩略图能正确加载预览
- 删除资产时同步清理对应磁盘文件
- AssetGallery 和 TaskDetail 共用上传逻辑
- 文件名消毒防止路径穿越

**Non-Goals:**
- 不改变后端存储架构（仍通过 WorkspaceAPI 通道）
- 不引入新的外部依赖
- 不改变现有的数据库记录模型（仅补齐字段）

## Decisions

### 1. 二进制写入策略：新增 `api.writeBinary` 方法

**方案**：在 `api.js` 中新增 `writeBinary(relPath, blob)` 方法。利用 WebUI WorkspaceAPI 的底层 HTTP 能力，通过 FormData + POST 上传原始文件字节至后端，后端以裸二进制写入。

**备选考虑**：
- 在现有 `write()` 中加参数：破坏现有接口契约，影响其他写入调用
- 使用 `fetch` 替代 WorkspaceAPI：与代码库其他请求方式不一致，增加维护成本

**选择**：新增独立方法，职责清晰，不影响现有调用方。

### 2. 上传流程重构：提取 `AssetUploader` 共享模块

将 AssetGallery 和 TaskDetail 中重复的以下逻辑提取为 `src/ui/AssetUploader.js`：
- FileReader `readAsArrayBuffer` 读取文件
- 生成 UUID 文件名，构造 `assets/YYYY-MM/uuid-filename.ext` 路径
- 调用 `api.writeBinary(relPath, arrayBuffer)` 
- 通过 `DataRepository` 创建资产记录（含 fileName/mimeType/fileSize）
- 文件名消毒（替换 `../`、空字符、不可见字符）

**理由**：DRY 原则，一处修改两边生效，降低维护成本。

### 3. 文件路径消毒

**规则**：移除路径分隔符（`/`、`\`）、空字符、控制字符。文件名截断至安全长度（255 字节）。使用用户原始文件名作为显示名，UUID 前缀作为实际存储名。

### 4. 预览路径修正

AssetCard 中图片预览 URL 从 `/<filePath>` 改为完整的 media-studio 路径前缀。前端通过 `api.getDownloadUrl(filePath)` 获取正确的访问路径，而非直接拼接磁盘路径。

### 5. 删除时文件清理

在 `DataRepository.deleteAsset()` 中新增步骤：读取记录中的 `filePath`，调用 `api.delete(filePath)` 删除磁盘文件，然后再删除数据库记录。

### 6. Schema 补齐

在数据库 schema 中为 assets 表定义 `fileName`、`mimeType`、`fileSize` 字段（若尚不存在），或通过 DataRepository 写入时确保这些属性被持久化。

## Risks / Trade-offs

- **二进制写入性能**：大文件上传可能阻塞 UI 线程 → FileReader 使用 `readAsArrayBuffer` 而非同步读取，考虑未来对大文件使用流式上传
- **后端写入路径不确定性**：WebUI 的 WorkspaceAPI `write()` 行为可能随版本变更 → `writeBinary` 保留 fallback 策略，若二进制通道不可用则退化为 DataURL + 后端转换
- **文件名消毒过严**：某些合法文件名（如 Unicode 字符）可能被过滤 → 采用白名单策略（仅过滤明确危险的字符）
- **Schema 变化**：中间数据库版本兼容问题 → 添加 schema 迁移检查，仅在字段不存在时创建

## Open Questions

- 后端 WorkspaceAPI 是否支持裸二进制（Content-Type: application/octet-stream）写入？需要实证验证
- 若不支持，备选为将 ArrayBuffer 转为 Blob 并通过 FormData 传输
