## 1. 基础设施 — Modal 组件 + CSS

- [x] 1.1 在 `src/framework/app.css` 中新增统一 overlay/modal CSS（`.ms-overlay`、`.ms-modal`、`.ms-modal-header`、`.ms-modal-body`、`.ms-modal-footer`），包含 z-index:1000、rgba(0,0,0,0.6) 背景、fade-in 动画
- [x] 1.2 创建 `src/framework/ui/Modal.js`，实现 Modal 类：constructor（options）、open()、close()、setHeader()、setBody()、setFooter()、el getter
- [x] 1.3 从 `src/framework/app.css` 中删除旧 `.ms-modal-overlay`、`.ms-modal`、`.ms-modal-close` CSS 类
- [x] 1.4 从 `src/business/app.css` 中删除 `.ms-task-modal-overlay`、`.ms-task-modal`、`.ms-task-modal-actions` CSS 类
- [x] 1.5 从 `src/business/app.css` 中删除 `.ms-db-form-overlay`、`.ms-db-form`、`.ms-db-form-header`、`.ms-db-form-body`、`.ms-db-form-footer`、`.ms-db-form-label`、`.ms-db-form-field` CSS 类
- [x] 1.6 JS 语法验证：`find src -name "*.js" -exec node --check {} \;`

## 2. 迁移 ThemeStrategy（2 个 modal）

- [x] 2.1 迁移 `ThemeStrategy._openEditor()` — 使用 `new Modal({ title, size: 'md', container })` 替代手动创建 overlay/modal
- [x] 2.2 迁移 `ThemeStrategy._deleteTheme()` — 使用 `new Modal({ size: 'sm', container })` 替代手动创建确认对话框
- [x] 2.3 验证打开/关闭/提交/删除各功能正常

## 3. 迁移 DatabaseManager（3 个 modal）

- [x] 3.1 迁移 `DatabaseManager._showDbForm()` — 使用 `new Modal({ size: 'md' })` 替代 `ms-db-form-overlay` 手动创建
- [x] 3.2 迁移 `DatabaseManager._showTableForm()` — 使用 `new Modal({ width: '700px' })` 替代手动创建
- [x] 3.3 迁移 `DatabaseManager._buildRecordForm()` — 使用 `new Modal({ size: 'md' })` 替代手动创建
- [x] 3.4 验证数据库 CRUD 各表单正常

## 4. 迁移 TasksView + AssetGallery + TaskDetail（4 个 modal）

- [x] 4.1 迁移 `TasksView._showCreateForm()` — 使用 `new Modal({ title, size: 'md' })`
- [x] 4.2 迁移 `AssetGallery._showAssetDetail()` — 使用 `new Modal({ title, size: 'md' })`
- [x] 4.3 迁移 `TaskDetail.open()` — 使用 `new Modal({ width: '680px' })`
- [x] 4.4 迁移 `TaskDetail._openContentEditor()` — 使用 `new Modal({ width: '820px' })`，body 保持现有 flex 高度设置（70vh）
- [x] 4.5 验证任务创建、素材详情、任务详情、文稿编辑各功能正常

## 5. 迁移 IdeaBoard（6 个 inline modal）

- [x] 5.1 删除 IdeaBoard 中的 11 个辅助函数（`ce`、`bn`、`sp`、`btn`、`_ovl`、`_modal`、`_hdr`、`_fld`、`_fldArea`、`_themeSel`、`_q`）
- [x] 5.2 迁移 IdeaBoard 中所有 6 处 inline modal 创建点，全部改用 `new Modal()`
- [x] 5.3 验证灵感创建/编辑/关联/删除各功能正常

## 6. 迁移 TopicBoard

- [x] 6.1 删除 TopicBoard 中的 11 个重复辅助函数（与 IdeaBoard 相同）
- [x] 6.2 迁移 TopicBoard 中所有 inline modal 创建点，全部改用 `new Modal()`
- [x] 6.3 验证选题创建/编辑/关联/删除各功能正常

## 7. 最终清理与验证

- [x] 7.1 确认所有旧 CSS 类已被删除无残留
- [x] 7.2 JS 语法检查全部通过：`find src -name "*.js" -exec node --check {} \;`
- [x] 7.3 Shell 语法检查：`bash -n src/scripts/install.sh`
