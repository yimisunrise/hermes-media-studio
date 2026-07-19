## 1. 数据层 — 表定义与数据访问

- [x] 1.1 在 `business-db.init-def.js` 的 `TABLE_DEFS` 中追加 4 张表定义（packages、platforms、schedules、publish-logs），版本升至 1.4.0
- [x] 1.2 在 `data/index.js` 中追加 4 个 repo 工厂函数（packageRepo、platformRepo、scheduleRepo、publishLogRepo）

## 2. 视图 — PlatformConfig（平台配置）

- [x] 2.1 创建 `views/PlatformConfig.js` 视图：展示平台列表，支持增删改查，使用 platformRepo 访问数据

## 3. 视图 — PublishManager（发布管理）

- [x] 3.1 创建 `views/PublishManager.js` 视图框架：发布包列表展示（标题/状态/平台数/时间），支持筛选
- [x] 3.2 实现"创建发布包"表单模态框：选择已定稿 Content、选择平台、填写标题、选择发布方式
- [x] 3.3 实现"立即发布"操作：更新 Package 状态为 publishing，为每个平台生成 Schedule + PublishLog
- [x] 3.4 实现"标记发布结果"操作：在每个平台的 PublishLog 上填写 URL、标记成功/失败，自动汇总 Package 状态

## 4. 视图 — PublishCalendar（发布日历）

- [x] 4.1 创建 `views/PublishCalendar.js` 视图：月视图日历，月份切换导航，展示各日期排期条目

## 5. Manifest 注册

- [x] 5.1 在 `manifest.js` 中注册 3 个新视图（publish / platforms / calendar）和"发布运营"菜单组

## 6. 现有视图集成

- [x] 6.1 在 `TaskDetail.js` 中添加"创建发布包"入口按钮（当关联 Content 已定稿时显示）
- [x] 6.2 在 `ContentEditor.js` 中添加发布状态链接（当 Content 已有发布包时显示关联状态）
