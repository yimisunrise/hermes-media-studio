/**
 * FormBuilder — 共享表单行工厂工具
 *
 * 所有堆叠表单行统一使用 ms-form-group 作为行容器。
 * 标签使用原生 <label>，样式由 CSS 控制。
 *
 * 用法:
 *   import { formGroup, input, textarea, select } from '../components/FormBuilder.js';
 *   const g = formGroup('标题', input({ id:'my-id', placeholder:'输入...' }));
 *
 * 注意: input()/textarea()/select() 创建的是 DOM 元素，不是 ms-form-group。
 *       必须用 formGroup() 包裹后再添加到模态框。
 */

/**
 * 创建一个 ms-form-group 容器
 * @param {string} labelText - 标签文本
 * @param {HTMLElement} inputEl - 已创建的 input/select/textarea 元素
 * @param {object} [opts] - 可选参数
 * @param {string} [opts.id] - 容器 id（可选）
 * @returns {HTMLDivElement}
 */
export function formGroup(labelText, inputEl, opts) {
  const row = document.createElement('div');
  row.className = 'ms-form-group';
  if (opts && opts.id) row.id = opts.id;

  const lbl = document.createElement('label');
  lbl.textContent = labelText;
  row.appendChild(lbl);

  row.appendChild(inputEl);
  return row;
}

/**
 * 创建原生 <input> 元素
 * @param {object} cfg
 * @param {string} [cfg.id]
 * @param {string} [cfg.type] - 默认 'text'
 * @param {string} [cfg.value]
 * @param {string} [cfg.placeholder]
 * @param {string} [cfg.className] - 默认 'ms-form-input'
 * @returns {HTMLInputElement}
 */
export function input(cfg) {
  const el = document.createElement('input');
  el.className = cfg.className || 'ms-form-input';
  if (cfg.id) el.id = cfg.id;
  if (cfg.type) el.type = cfg.type;
  if (cfg.placeholder != null) el.placeholder = cfg.placeholder;
  if (cfg.value != null) el.value = cfg.value;
  return el;
}

/**
 * 创建原生 <textarea> 元素
 * @param {object} cfg
 * @param {string} [cfg.id]
 * @param {string} [cfg.value]
 * @param {string} [cfg.placeholder]
 * @param {string} [cfg.minHeight] - CSS min-height 值（如 '60px'）
 * @returns {HTMLTextAreaElement}
 */
export function textarea(cfg) {
  const el = document.createElement('textarea');
  el.className = 'ms-form-textarea';
  if (cfg.id) el.id = cfg.id;
  if (cfg.placeholder != null) el.placeholder = cfg.placeholder;
  if (cfg.value != null) el.value = cfg.value;
  if (cfg.minHeight) el.style.minHeight = cfg.minHeight;
  return el;
}

/**
 * 创建原生 <select> 元素
 * @param {object} cfg
 * @param {string} [cfg.id]
 * @param {string} [cfg.value] - 当前选中值
 * @param {Array<{value:string,text:string}>} cfg.options - 选项列表
 * @param {string} [cfg.emptyOption] - 空选项文本（如 '无'），省略则不添加空选项
 * @param {boolean} [cfg.styleAutoWidth] - 是否设置 width:auto（默认 false）
 * @returns {HTMLSelectElement}
 */
export function select(cfg) {
  const el = document.createElement('select');
  el.className = 'ms-form-input';
  if (cfg.id) el.id = cfg.id;
  if (cfg.styleAutoWidth) el.style.width = 'auto';

  if (cfg.emptyOption != null) {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = cfg.emptyOption;
    el.appendChild(o);
  }

  if (cfg.options) {
    for (const opt of cfg.options) {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.text;
      if (cfg.value != null && opt.value === cfg.value) o.selected = true;
      el.appendChild(o);
    }
  }

  return el;
}

/**
 * 创建主题选择器 <select>（带主题选项填充）
 * @param {object} cfg
 * @param {string} [cfg.id]
 * @param {Array<{id:string,name:string}>} cfg.themes - 主题列表
 * @param {string} [cfg.value] - 当前主题 ID
 * @returns {HTMLSelectElement}
 */
export function themeSelect(cfg) {
  const el = select({
    id: cfg.id,
    styleAutoWidth: true,
    emptyOption: '无',
    options: (cfg.themes || []).map(t => ({ value: t.id, text: t.name })),
    value: cfg.value
  });
  return el;
}
