## Context

扩展的 `SidebarManager` 在激活/停用时直接操作宿主 DOM 的 inline style（`sidebar.style.display = 'none'` / `''`），但宿主的侧栏折叠/展开机制完全基于 CSS 类（`.layout.sidebar-collapsed`）。两套独立的状态管理机制不同步导致 BUG。

### 宿主的侧栏管理机制

宿主的 `switchPanel(name, opts)` 函数在 `opts.fromRailClick === true` 且桌面宽度时，会检测当前面板状态：

```javascript
if (opts.fromRailClick && _isDesktopWidth()) {
    if (_isSidebarCollapsed()) {
        expandSidebar();        // 已折叠 → 展开
    } else if (prevPanel === nextPanel) {
        toggleSidebar(true);    // 同一面板 → 折叠
        return false;
    }
}
```

宿主的 nav-tab 按钮使用 **inline onclick** 属性：
```html
<button onclick="switchPanel('chat', {fromRailClick:true})" ...>
```

侧栏折叠基于 CSS 类 `.layout.sidebar-collapsed`:
```css
.layout.sidebar-collapsed .sidebar:not(.mobile-open) {
    min-width: 0px; opacity: 0; transform: translateX(-14px);
    border-right-color: transparent; pointer-events: none; overflow: hidden;
}
```

### 扩展的当前行为

| 函数 | 对侧栏的操作 | 对宿主的操作 |
|------|------------|------------|
| `_activate()` | `sidebar.style.display = 'none'` | 移除 host tab 的 active 类 |
| `_deactivate()` | `sidebar.style.display = ''` | 恢复 active 类 + 调用 `switchPanel(prevPanel)` |

### BUG 执行路径

```
初始: _currentPanel='chat', layout无sidebar-collapsed, sidebar可见

Step2: 点击 Media Studio → _activate()
  → sidebar.style.display='none' (但 _currentPanel 仍是 'chat')

Step3: 点击"聊天" → [捕获] _onNavTabClick → _deactivate()
  → sidebar.style.display='' 恢复
  → switchPanel('chat')           ← 无 fromRailClick, 正常切换
  → [目标] inline onclick
  → switchPanel('chat', {fromRailClick:true})
  → prevPanel('chat') === nextPanel('chat')
  → toggleSidebar(true)           ★ 侧栏被折叠!
  → .layout 加上 sidebar-collapsed

Step4: 点击 Media Studio → _activate()
  → sidebar.style.display='none'

Step5: 点击"聊天" → [捕获] _onNavTabClick → _deactivate()
  → sidebar.style.display='' 恢复
  → switchPanel('chat')
  → [目标] inline onclick
  → switchPanel('chat', {fromRailClick:true})
  → _isSidebarCollapsed() === true (Step3 留下的)
  → expandSidebar() → toggleSidebar(false)
  → .layout 移除 sidebar-collapsed ★ 又可见了

Step6→... 交替重复
```

## Goals / Non-Goals

**Goals:**
- 从扩展切回宿主任意面板时，侧栏保持可见（等同于直接点击该面板的初始状态）
- 不要影响宿主的正常侧栏折叠/展开功能（用户手动折叠侧栏后，切换面板应保持折叠状态）
- 最小化代码改动，仅修改 `src/framework/lib/sidebar.js`

**Non-Goals:**
- 不改变宿主的 `switchPanel` 行为或 CSS
- 不引入新的状态管理机制
- 不改动现有扩展的激活/停用流程

## Decisions

### Decision 1: 用 `stopPropagation` 阻止宿主 inline onclick

**方案**：在 `_onNavTabClick` 捕获阶段调用 `e.stopPropagation()`，然后由扩展自己调用 `switchPanel(panel)` 来激活目标面板。

**理由**：
- 宿主的 inline onclick 是目标阶段事件，`stopPropagation` 在捕获阶段调用可以阻止其触发
- 扩展自行调用 `switchPanel` 时不传 `fromRailClick`，完全绕过折叠逻辑
- 宿主面板正常切换到目标面板，侧栏状态不会被干扰
- 这是最小的入侵性改动，不需要操作宿主内部状态

**风险**：`stopPropagation` 会阻止事件到达目标元素。但宿主的交互逻辑全部在 inline onclick 中，该 handler 会由我们替代执行。

### Decision 2: 拆离 `_deactivate` 的面板恢复职责

**方案**：将 `_deactivate` 中的 `switchPanel` 调用和 active 类恢复逻辑移除，交由调用方决定是否需要恢复宿主面板。

**理由**：
- `_deactivate` 有两种调用场景：① `_onNavTabClick`（宿主面板已被点击）② `_onRailBtnClick`（用户点击扩展按钮退出）
- 场景①不需要恢复面板（宿主已经处理了），场景②才需要
- 将决策权上移给调用方，职责更清晰

### Decision 3: `_onRailBtnClick` 调 `_deactivate` 后继续使用 `switchPanel`

**方案**：`_onRailBtnClick` 在 `_deactivate()` 之后继续保留调用 `switchPanel(_prevHostPanel)` 的逻辑，但改为直接调 `window.switchPanel` 传给 `_deactivate` 调用。

**替代方案**：给 `_deactivate` 加参数 `restoreHost = true`。但职责分离更清晰的做法是让调用方自己决定。

**最终方案**：`_deactivate` 只做 UI 清理，返回 `_prevHostPanel`。调用方根据需要决定是否调用 `switchPanel`。

## Risks / Trade-offs

- **`stopPropagation` 影响范围** → 只会阻止宿主 inline onclick，其他 capture/bubble handler 不受影响（宿主所有 nav-tab 行为都在 onclick 属性中）
- **`_onRailBtnClick` 调用 `switchPanel` 时机** → 在 `_deactivate` 之后调用，与之前行为一致，无风险
- **兼容性** → 纯 JS 改动，不需要修改 CSS 或 HTML 结构
