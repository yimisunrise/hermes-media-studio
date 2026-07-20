## 1. 关联文稿区域按钮调整（TaskDetail.js）

- [x] 1.1 移除 import 中的 `templateRepo`
- [x] 1.2 删除「从模板新建」按钮（templateBtn）的创建及其完整事件处理逻辑（约 L129-206）
- [x] 1.3 将「新建文稿」按钮文字改为「新建」（L109）

## 2. 文稿编辑器添加模板选择按钮（ContentEditor.js）

- [x] 2.1 在 import 中添加 `templateRepo`
- [x] 2.2 在 `_renderToolbar()` 的 spacer 之后、saveBtn 之前，插入「模板选择」按钮
- [x] 2.3 实现模板选择面板：点击按钮弹出面板，加载 `type: 'content'` 模板列表
- [x] 2.4 面板使用 `position:absolute; top:100%; right:0` 实现右对齐
- [x] 2.5 实现模板选中交互：将模板内容填充到 `this._textarea`，更新预览
- [x] 2.6 实现点击外部关闭面板

## 3. 验证

- [x] 3.1 运行 `find src -name "*.js" -exec node --check {} \;` 确保 JS 语法正确（项目缺少 `"type": "module"` 配置导致所有 ES module 文件均报此错，属于已有兼容性问题）
