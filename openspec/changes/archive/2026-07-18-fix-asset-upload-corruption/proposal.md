## Why

用户上传的图片素材在磁盘上存储为 Data URL 文本（如 `data:image/png;base64,...`）而非原始二进制，导致文件损坏无法预览。同时存在预览路径不匹配、删除不清理磁盘文件、上传代码重复、文件名未消毒等连带问题。

## What Changes

- **修复上传核心流程**：`FileReader.readAsDataURL` 改为 `readAsArrayBuffer`，通过新增的 API 二进制写入通道直接存储原始文件字节
- **修复预览路径**：统一文件存储路径与前端引用路径，确保 AssetCard 中图片缩略图正确加载
- **删除时清理磁盘文件**：删除资产记录时同步删除对应磁盘文件
- **数据库 Schema 补齐**：`fileName` / `mimeType` / `fileSize` 字段正式定义
- **提取共享上传模块**：将 AssetGallery 和 TaskDetail 中重复的上传逻辑抽取为 `AssetUploader` 共享服务
- **文件名消毒**：拼接文件路径前过滤特殊字符

## Capabilities

### New Capabilities
- `asset-uploader`: 共享资产上传服务模块，封装 FileReader → ArrayBuffer → 二进制 API 写入的完整流程，供 AssetGallery 和 TaskDetail 复用

### Modified Capabilities
- `asset-upload`: 上传方式从 `api.write(dataUrl)` 改为通过新的二进制写入端点传输原始文件；增加删除文件的磁盘清理步骤；增加文件名消毒

## Impact

- `src/api.js`：新增 `writeBinary(relPath, blob)` 方法或后端二进制写入通道
- `src/ui/AssetGallery.js`：重构上传逻辑，使用共享 `AssetUploader` 模块
- `src/ui/TaskDetail.js`：重构上传逻辑，使用共享 `AssetUploader` 模块
- `src/ui/AssetCard.js`：修复预览路径构造方式
- `src/db/DataRepository.js`：删除时同步删除文件
- `src/db/schema.js` 或对应 DDL：补齐 `fileName` / `mimeType` / `fileSize` 字段
- 新增 `src/ui/AssetUploader.js`：共享上传模块
