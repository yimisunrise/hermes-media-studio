## 架构概览

```
创作模块
┌──────────────────────────────────────────────┐
│  视图层 (Views)                               │
│  ┌─────────────┐ ┌──────────┐ ┌───────────┐  │
│  │ AssetGallery │ │ContentEditor││TaskDetail │  │
│  └──────┬──────┘ └────┬─────┘ └─────┬─────┘  │
│         │             │             │         │
│  ┌──────┴──────┐ ┌────┴─────┐ ┌─────┴─────┐  │
│  │ AssetCard   │ │ContentCard│ │ ...       │  │
│  └─────────────┘ └──────────┘ └───────────┘  │
├──────────────────────────────────────────────┤
│  数据层 (Data)                                │
│  DataRepository.for(business, table)         │
│  ┌──────────┐ ┌────────────┐ ┌───────────┐   │
│  │ tasks    │ │ assets     │ │ contents  │   │
│  │ (月分片) │ │ (月分片)   │ │ (不分片)  │   │
│  └──────────┘ └────────────┘ └───────────┘   │
├──────────────────────────────────────────────┤
│  文件存储 (Storage)                           │
│  workspace/assets/                           │
│  └── YYYY-MM/ 按月份组织                     │
└──────────────────────────────────────────────┘
```

## 表结构

### assets 表（月度分片）
- id: uuid
- taskId: ref -> tasks.id
- topicId: ref -> topics.id（素材可直接归属选题，不一定关联任务）
- type: enum(image/video/audio/document/other)
- fileName: string（原始文件名）
- filePath: string（assets/YYYY-MM/filename 相对路径）
- mimeType: string
- fileSize: number
- thumbnailPath: string?（图片缩略图路径）
- metadata: object?（额外元数据：分辨率、时长等）
- status: enum（uploading/completed/failed）
- createdAt, updatedAt

### contents 表（不分片，每条文稿量小）
- id: uuid
- taskId: ref -> tasks.id（必填）
- topicId: ref -> topics.id
- version: number（递增版本）
- title: string
- content: string（Markdown 源码）
- status: enum(draft/finalized/archived)
- createdAt, updatedAt

## 数据流

### 素材上传流程
1. 用户在 AssetGallery 点击上传或任务详情中拖拽文件
2. 文件写入 `workspace/assets/YYYY-MM/{uuid}-{filename}`
3. assetRepo.create({ filePath, fileName, type, taskId, ... })
4. 视图刷新显示新素材

### 文稿编辑流程
1. 用户在任务详情中创建文稿
2. contentRepo.create({ taskId, title, content: '', version: 1 })
3. Markdown 编辑器实时保存到 contentRepo
4. 用户可定稿（finalize），定稿后 contentRepo.update(id, { status: 'finalized' })
5. 每次 create（新版本）自增 version

## 已有配置清单

### 已有但不需修改
- `DatabaseRepository` 通用 CRUD 已完备 ✓
- `data/index.js` 中的 `assetRepo` / `scriptRepo`（改为 contentRepo）工厂 ✓
- `business-db.init-def.js` 中的 assets/scripts 表定义 ✓
- SchemaRegistry 初始化流程 ✓

### 需要修改
- `business-db.init-def.js`：scripts → contents 表名调整（表字段也对应调整）
- `data/index.js`：scriptRepo → contentRepo 重命名 + 表名调整
- `manifest.js`：注册新视图
- 相关视图引用调整

### 数据仍留存问题
- `scripts` 表在已归档的多项变更中被定义为无分片、status=draft/finalized 字段。新的 contents 表与之高度一致，可以就表名做改动扩展
- 现有的 `workspace/` 目录已经包含 platforms/themes/workflows 子目录，assets/ 将作为新子目录加入
