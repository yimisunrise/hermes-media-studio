## 1. DB 状态模型扩展

- [x] 1.1 business-db.init-def.js：tasks 表 status 字段 enum 追加 `closed`、`archived`，版本 1.1.0 → 1.2.0

## 2. 移除 ReviewMode

- [x] 2.1 删除 `src/business/views/ReviewMode.js`
- [x] 2.2 manifest.js：移除 `{ hash: 'review', ... }` 条目，菜单组 `production` 中移除 `'review'`

## 3. KanbanBoard — 拖拽 + 4 列 + 关闭/归档 + TaskDetail

- [x] 3.1 COLUMN_ORDER 改为 `['pending', 'generating', 'review', 'approved']`，STATUS_LABELS 对应更新（去掉 rejected），隐藏 closed/archived 状态
- [x] 3.2 任务卡片设置 `draggable="true"`，`dragstart` 记录 task id
- [x] 3.3 列 body 监听 `dragover`（阻止默认+高亮）和 `drop`（取 id → update status → refresh）
- [x] 3.4 卡片点击改为打开 TaskDetail.open() 而非 hash 导航
- [x] 3.5 review 列卡片加「关闭」按钮 → update 为 `closed` → refresh
- [x] 3.6 approved 列卡片加「归档」按钮 → update 为 `archived` → refresh

## 4. TasksView — 去按钮 + 已归档 toggle

- [x] 4.1 移除 `NEXT_TRANSITIONS` 映射表、`_transitionTask()` 方法、`_renderTaskCard()` 中的 actions 区域
- [x] 4.2 筛选栏加「显示已归档」checkbox，未勾选时 `status != 'archived'` 过滤

## 5. 验证

- [x] 5.1 JS 语法检查全部修改文件
