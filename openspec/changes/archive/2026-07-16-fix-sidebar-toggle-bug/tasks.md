## 1. 修改 `_onNavTabClick` — 阻止宿主事件双重触发

- [x] 1.1 在 `_onNavTabClick` 的 `if (this._active)` 分支中，调用 `e.stopPropagation()` 阻止宿主 inline onclick 触发
- [x] 1.2 在 `stopPropagation` 之后，调用 `window.switchPanel(tab.dataset.panel)` 自行切换宿主面板（不传 `fromRailClick` 参数）
- [x] 1.3 确保 `_deactivate()` 调用在 `stopPropagation` 之前执行（先清理再阻止）

## 2. 修改 `_deactivate` — 剥离面板恢复职责

- [x] 2.1 移除 `_deactivate` 中的 `switchPanel(this._prevHostPanel)` 调用
- [x] 2.2 移除 `_deactivate` 中的 active 类恢复和 `_prevHostPanel` 清理逻辑
- [x] 2.3 `_deactivate` 只保留 UI 清理职责：恢复 sidebar / main children / titlebar，隐藏媒体工作室，清除 hash，触发 `ms:deactivated` 事件

## 3. 修改 `_onRailBtnClick` — 调用方负责恢复面板

- [x] 3.1 在 `_onRailBtnClick` 的 `_deactivate()` 调用之后，补充 `window.switchPanel(this._prevHostPanel)` 调用
- [x] 3.2 确保 `_prevHostPanel` 在 `_deactivate` 中被保留（不再被清理）

## 4. 验证

- [ ] 4.1 执行 BUG 复现步骤：聊天可见 → 扩展 → 聊天（侧栏应可见）→ 扩展 → 聊天（侧栏仍可见）
- [ ] 4.2 验证其他面板（Tasks / Kanban 等）切换不受影响
- [ ] 4.3 验证手动折叠侧栏后，扩展激活/停用不改变折叠状态
- [x] 4.4 代码审查：确认 `_onNavTabClick` 在捕获阶段 `stopPropagation` → 阻止宿主 inline onclick；顺序为 `_deactivate` → `stopPropagation` → `switchPanel` ✓
