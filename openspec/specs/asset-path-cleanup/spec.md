## ADDED Requirements

### Requirement: 素材上传使用无冗余前缀的路径

AssetGallery 和 TaskDetail 中素材上传/目录创建时，路径不应包含 `workspace/` 前缀，直接使用 `assets/` 作为相对路径传递给 `api.js`。

#### Scenario: AssetGallery 上传使用 assets/ 路径

- **WHEN** 用户在 AssetGallery 中选择文件并上传
- **THEN** 调用 `api.mkdir('assets/YYYY-MM')` 创建月份目录
- **THEN** 调用 `api.writeFile('assets/YYYY-MM/uuid-filename.ext', dataUrl)` 写入文件
- **THEN** Asset 记录中的 `filePath` 以 `assets/YYYY-MM/...` 开头

#### Scenario: TaskDetail 上传使用 assets/ 路径

- **WHEN** 用户在 TaskDetail 中选择文件并上传
- **THEN** 调用 `api.mkdir('assets/YYYY-MM')` 创建月份目录
- **THEN** 调用 `api.writeFile('assets/YYYY-MM/uuid-filename.ext', dataUrl)` 写入文件
