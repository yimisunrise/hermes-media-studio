---

## 1. 数据层调整

- [x] 1.1 修改 `business-db.init-def.js`：`scripts` 表改名 `contents`，调整字段为 id/taskId/topicId/version/title/content/status/createdAt/updatedAt
- [x] 1.2 修改 `data/index.js`：`scriptRepo` → `contentRepo`，表名 `contents`

## 2. 任务详情视图（TaskDetail）

- [x] 2.1 创建 `src/business/views/TaskDetail.js`：任务详情弹窗/页面，展示基础信息 + 关联素材 + 关联文稿
- [x] 2.2 在 TasksView.js 中集成：点击任务行打开 TaskDetail
- [x] 2.3 创建任务时 topicId 改为必填（下拉框加载选题列表）

## 3. 素材管理（AssetGallery）

- [x] 3.1 创建 `src/business/views/AssetGallery.js`：网格布局素材列表、类型/日期筛选、上传/删除操作
- [x] 3.2 创建 `src/business/views/components/AssetCard.js`：素材卡片组件（缩略图/图标 + 文件名 + 大小 + 日期）
- [x] 3.3 在 TaskDetail 中嵌入素材区：关联素材列表 + 上传入口

## 4. 文稿编辑器（ContentEditor）

- [x] 4.1 创建 `src/business/views/ContentEditor.js`：Markdown 分屏编辑 + 实时预览 + 保存/定稿/版本管理
- [x] 4.2 在 TaskDetail 中嵌入文稿区：关联文稿列表 + 打开编辑器入口

## 5. manifest 注册

- [x] 5.1 在 `manifest.js` 中注册 AssetGallery 视图（hash: assets, group: production）
- [x] 5.2 确认 TopicBoard 等视图的选题选择器可被 TaskDetail 复用

## 6. 验证

- [x] 6.1 JS 语法检查：`find src -name "*.js" -exec node --check {} \; 2>&1 | grep "SyntaxError" | grep -v "input-type" | wc -l`
- [x] 6.2 确认 assetRepo / contentRepo 引用正确
