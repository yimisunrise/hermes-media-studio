## ADDED Requirements

### Requirement: Modal 可以通过 JavaScript 代码创建和控制
系统 SHALL 提供一个 `Modal` 类，支持创建浮动模态框，并控制其生命周期。

#### Scenario: 创建并打开 modal
- **WHEN** 调用 `new Modal(options).open()`
- **THEN** 在页面上生成一个覆盖层（.ms-overlay）和一个模态容器（.ms-modal）
- **THEN** 模态容器 SHALL 包含 header、body、footer 三个区块

#### Scenario: 关闭 modal
- **WHEN** 调用 `modal.close()`
- **THEN** 覆盖层和模态容器从 DOM 中移除

### Requirement: Modal 支持三段式布局（header / body / footer）
系统 SHALL 提供 `setHeader()`、`setBody()`、`setFooter()` 方法，分别设置标题栏、内容区和底部操作栏。

#### Scenario: 设置 header 内容
- **WHEN** 调用 `modal.setHeader('标题')`
- **THEN** `.ms-modal-header` 中显示文本"标题"

#### Scenario: 设置 body 内容（HTML 字符串）
- **WHEN** 调用 `modal.setBody('<div class="content">正文</div>')`
- **THEN** `.ms-modal-body` 内包含对应 HTML 内容

#### Scenario: 设置 body 内容（DOM 元素）
- **WHEN** 调用 `modal.setBody(document.createElement('div'))`
- **THEN** `.ms-modal-body` 内包含该 DOM 元素

#### Scenario: 设置 footer 内容
- **WHEN** 调用 `modal.setFooter('<button>取消</button><button>保存</button>')`
- **THEN** `.ms-modal-footer` 内包含对应按钮

### Requirement: Modal 支持尺寸预设与自定义
系统 SHALL 提供 `size` 选项（`sm`|`md`|`lg`）快速设置 modal 宽度，同时支持 `width` 和 `maxWidth` 覆盖。

#### Scenario: 使用 size 预设
- **WHEN** 创建 `new Modal({ size: 'md' })`
- **THEN** modal 容器的宽度为 480px

#### Scenario: 使用自定义 width
- **WHEN** 创建 `new Modal({ width: '680px' })`
- **THEN** modal 容器的宽度为 680px

### Requirement: Modal 支持 overlay 点击关闭
系统 SHALL 支持通过点击覆盖层背景关闭 modal。

#### Scenario: 点击 overlay 关闭 modal
- **WHEN** 用户点击 `.ms-overlay` 背景区域（非 modal 内部）
- **THEN** modal 关闭并从 DOM 中移除

#### Scenario: 禁用 overlay 点击关闭
- **WHEN** 创建 `new Modal({ closeOnOverlay: false })`
- **THEN** 点击 overlay 背景不会关闭 modal

### Requirement: Modal 支持自定义追加容器
系统 SHALL 支持指定 modal 的父容器，默认追加到 `document.body`。

#### Scenario: 追加到 document.body
- **WHEN** 创建 `new Modal({})`
- **THEN** overlay 追加到 `document.body`

#### Scenario: 追加到指定容器
- **WHEN** 创建 `new Modal({ container: someElement })`
- **THEN** overlay 追加到 `someElement`

### Requirement: Modal 具有统一的视觉样式
系统 SHALL 为所有 modal 提供一致的覆盖层背景、圆角、阴影和动画。

#### Scenario: 统一的 overlay 背景
- **WHEN** modal 打开
- **THEN** overlay 背景为 `rgba(0,0,0,0.6)` 半透明黑色

#### Scenario: modal 容器有统一的阴影和圆角
- **WHEN** modal 打开
- **THEN** modal 容器具有 `box-shadow` 和 `border-radius`

#### Scenario: 打开时有淡入动画
- **WHEN** modal 打开
- **THEN** overlay 有 `ms-fade-in` 动画，持续约 0.15 秒

### Requirement: Modal 可通过 `el` 属性访问容器 DOM
系统 SHALL 在 Modal 实例上暴露 `el` 属性，指向 `.ms-modal` 容器元素。

#### Scenario: 通过 el 访问容器
- **WHEN** 创建 modal 并调用 `m.open()`
- **THEN** `m.el` 指向 DOM 中的 `.ms-modal` 元素
- **THEN** 可以通过 `m.el.querySelector(...)` 查找内部元素
