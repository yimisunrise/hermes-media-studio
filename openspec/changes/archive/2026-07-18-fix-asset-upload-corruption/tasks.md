## 1. API 层：新增二进制写入能力

- [x] 1.1 在 `src/framework/lib/api.js` 中新增 `writeBinary(relPath, arrayBuffer)` 方法
- [x] 1.2 两阶段写入策略：先尝试 `Content-Type: application/octet-stream` 裸二进制 POST（session_id/path 通过查询参数传递），失败则回退到 base64 JSON 写入。裸二进制写入时磁盘文件为原始字节，OS 可原生打开

## 2. 共享上传模块

- [x] 2.1 新建 `src/business/services/AssetUploader.js`，实现 `uploadFile(file, api, dataRepo)` 方法
- [x] 2.2 实现 `readAsArrayBuffer` 读取文件内容
- [x] 2.3 实现文件名消毒函数（移除 `/`、`\`、`..`、控制字符）
- [x] 2.4 生成 `assets/YYYY-MM/uuid-sanitized-filename.ext` 路径
- [x] 2.5 调用 `api.writeBinary()` 写入原始文件
- [x] 2.6 通过 `dataRepo` 创建资产记录（含 fileName/mimeType/fileSize）

## 3. 重构 AssetGallery 上传

- [x] 3.1 将 `src/business/views/AssetGallery.js` 中的 `readAsDataURL` 上传逻辑替换为调用 `AssetUploader.uploadFile()`
- [x] 3.2 移除旧的数据 URL 写入和手动创建记录的冗余代码

## 4. 重构 TaskDetail 上传

- [x] 4.1 将 `src/business/views/TaskDetail.js` 中的 `readAsDataURL` 上传逻辑替换为调用 `AssetUploader.uploadFile()`
- [x] 4.2 移除旧的冗余上传代码（含 `_uploadAsset` 方法和 `shortId` 导入）

## 5. 修复预览路径

- [x] 5.1 修复 `AssetCard.js` 中图片预览 URL 构造，使用 `api.readAsDataURL()` 异步加载
- [x] 5.2 确保缩略图 `<img src>` 能正确加载已上传的图片

## 6. 删除时清理磁盘文件

- [x] 6.1 在 `AssetGallery._deleteAsset()` 和 `TaskDetail._reloadAssetList` 删除逻辑中，先调用 `api.delete(filePath)` 删除磁盘文件，再删除数据库记录
- [x] 6.2 处理磁盘文件不存在时的优雅降级（try/catch 内不抛出异常）

## 7. Schema 补齐

- [x] 7.1 为 assets 表补齐 `fileName` / `mimeType` / `fileSize` 字段定义
- [x] 7.2 验证现有资产记录兼容性（updateTable 幂等执行，初始化时也更新已有表 schema）
