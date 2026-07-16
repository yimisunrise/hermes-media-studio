## Why

素材上传功能因方法名不匹配而报错：`AssetGallery._uploadFile()` 和 `TaskDetail._onUpload()` 调用 `this.api.writeFile()`，但 `WorkspaceAPI` 类暴露的方法是 `write()`。上传入口完全不可用。

## What Changes

- `AssetGallery.js:177` — `this.api.writeFile(relPath, dataUrl)` → `this.api.write(relPath, dataUrl)`
- `TaskDetail.js:282` — `api.writeFile(relPath, dataUrl)` → `api.write(relPath, dataUrl)`

## Capabilities

### New Capabilities
- `asset-upload`: 素材上传功能 —— 用户选择文件后上传到 workspace/assets/ 目录，在 AssetGallery 和 TaskDetail 中均可操作

### Modified Capabilities
*（无）*

## Impact

影响范围仅限于修复方法调用名，不涉及 API 行为变更。
