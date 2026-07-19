import { empty } from '../../framework/utils/dom.js';
import { Modal } from '../../framework/ui/Modal.js';
import { platformRepo } from '../data/index.js';

const PLATFORM_TYPE_LABELS = {
  xiaohongshu: '小红书',
  douyin: '抖音',
  bilibili: 'B站',
  weixin: '微信公众号',
  weibo: '微博',
  other: '其他'
};

export class PlatformConfig {
  constructor({ api, state, schemaRegistry }) {
    this.api = api;
    this.state = state;
    this._sr = schemaRegistry;
    this._platforms = [];
  }

  _repo() { return platformRepo(this.api, this._sr); }

  async render(container) {
    empty(container);
    await this._load();

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--ms-border);';
    const title = document.createElement('span');
    title.style.fontWeight = '600';
    title.style.fontSize = '15px';
    title.textContent = '平台配置';
    toolbar.appendChild(title);

    const addBtn = document.createElement('button');
    addBtn.className = 'ms-btn ms-btn-primary ms-btn-sm';
    addBtn.textContent = '添加平台';
    addBtn.addEventListener('click', () => this._openEditor(null));
    toolbar.appendChild(addBtn);
    container.appendChild(toolbar);

    const content = document.createElement('div');
    content.style.padding = '16px';
    container.appendChild(content);
    this._content = content;

    if (this._platforms.length === 0) {
      content.innerHTML = '<div class="ms-empty" style="padding:48px;text-align:center;color:var(--ms-text-secondary);">暂无平台配置，点击上方「添加平台」添加第一个发布平台</div>';
      return;
    }

    this._renderList();
  }

  async _load() {
    try {
      const result = await this._repo().find({ sort: 'name' });
      this._platforms = result.records || [];
    } catch (e) {
      console.error('加载平台列表失败', e);
      this._platforms = [];
    }
  }

  _renderList() {
    empty(this._content);

    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';
    table.innerHTML = `
      <thead>
        <tr style="border-bottom:1px solid var(--ms-border);">
          <th style="text-align:left;padding:8px 12px;color:var(--ms-text-secondary);font-weight:500;">名称</th>
          <th style="text-align:left;padding:8px 12px;color:var(--ms-text-secondary);font-weight:500;">类型</th>
          <th style="text-align:left;padding:8px 12px;color:var(--ms-text-secondary);font-weight:500;">标识</th>
          <th style="text-align:center;padding:8px 12px;color:var(--ms-text-secondary);font-weight:500;">状态</th>
          <th style="text-align:right;padding:8px 12px;color:var(--ms-text-secondary);font-weight:500;">操作</th>
        </tr>
      </thead>
      <tbody id="ms-platform-tbody"></tbody>
    `;
    this._content.appendChild(table);

    const tbody = table.querySelector('#ms-platform-tbody');

    for (const p of this._platforms) {
      const row = document.createElement('tr');
      row.style.cssText = 'border-bottom:1px solid var(--ms-border);transition:background 0.15s;';
      row.addEventListener('mouseenter', () => { row.style.background = 'var(--ms-bg-card)'; });
      row.addEventListener('mouseleave', () => { row.style.background = ''; });
      row.innerHTML = `
        <td style="padding:10px 12px;color:var(--ms-text-primary);">${this._escapeHtml(p.name)}</td>
        <td style="padding:10px 12px;color:var(--ms-text-secondary);">${PLATFORM_TYPE_LABELS[p.type] || p.type || '-'}</td>
        <td style="padding:10px 12px;color:var(--ms-text-secondary);font-family:monospace;font-size:12px;">${this._escapeHtml(p.slug || '-')}</td>
        <td style="padding:10px 12px;text-align:center;">
          <span style="display:inline-block;padding:1px 8px;border-radius:3px;font-size:11px;font-weight:500;background:${p.enabled !== false ? 'rgba(39,174,96,0.15)' : 'rgba(160,160,160,0.15)'};color:${p.enabled !== false ? 'var(--ms-success,#27ae60)' : 'var(--ms-text-secondary)'};">${p.enabled !== false ? '启用' : '禁用'}</span>
        </td>
        <td style="padding:10px 12px;text-align:right;">
          <button class="ms-btn ms-btn-sm ms-platform-edit" style="margin-right:4px;">编辑</button>
          <button class="ms-btn ms-btn-sm ms-platform-toggle" style="margin-right:4px;">${p.enabled !== false ? '禁用' : '启用'}</button>
          <button class="ms-btn ms-btn-sm ms-platform-del" style="color:var(--ms-danger);">删除</button>
        </td>
      `;
      tbody.appendChild(row);

      row.querySelector('.ms-platform-edit').addEventListener('click', () => this._openEditor(p));
      row.querySelector('.ms-platform-toggle').addEventListener('click', async () => {
        try {
          await this._repo().update(p.id, { enabled: p.enabled === false ? true : false });
          await this._load();
          this._renderList();
        } catch (e) { console.error('切换平台状态失败', e); }
      });
      row.querySelector('.ms-platform-del').addEventListener('click', () => this._deletePlatform(p));
    }
  }

  _openEditor(platform) {
    const isEdit = !!platform;

    const body = document.createElement('div');

    const nameRow = this._formField('平台名称 *', 'input', platform ? platform.name : '', '如：小红书主号');
    const nameInput = nameRow.querySelector('input');
    body.appendChild(nameRow);

    const typeRow = this._formField('平台类型', 'select', platform ? platform.type : 'xiaohongshu');
    const typeSelect = typeRow.querySelector('select');
    typeSelect.innerHTML = Object.entries(PLATFORM_TYPE_LABELS).map(([v, l]) =>
      `<option value="${v}" ${(platform ? platform.type : 'xiaohongshu') === v ? 'selected' : ''}>${l}</option>`
    ).join('');
    body.appendChild(typeRow);

    const slugRow = this._formField('标识符', 'input', platform ? (platform.slug || '') : '', '英文标识，如 my-xiaohongshu');
    const slugInput = slugRow.querySelector('input');
    body.appendChild(slugRow);

    const configRow = this._formField('发布配置 (JSON)', 'textarea', platform ? JSON.stringify(platform.publishConfig || {}, null, 2) : '', '{\n  "defaultTags": ["tag1"]\n}');
    body.appendChild(configRow);

    const footer = document.createElement('div');
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'ms-btn ms-btn-sm';
    cancelBtn.textContent = '取消';
    footer.appendChild(cancelBtn);
    const saveBtn = document.createElement('button');
    saveBtn.className = 'ms-btn ms-btn-primary ms-btn-sm';
    saveBtn.textContent = isEdit ? '保存' : '添加';
    saveBtn.addEventListener('click', async () => {
      const data = {
        name: nameInput.value.trim(),
        type: typeSelect.value,
        slug: slugInput.value.trim(),
        publishConfig: {}
      };
      try {
        const configVal = configRow.querySelector('textarea').value.trim();
        if (configVal) data.publishConfig = JSON.parse(configVal);
      } catch (e) {}
      if (!data.name) { nameInput.focus(); nameInput.style.borderColor = 'var(--ms-danger)'; return; }
      try {
        if (isEdit) {
          await this._repo().update(platform.id, data);
        } else {
          await this._repo().create(data);
        }
        m.close();
        await this._load();
        this._renderList();
      } catch (e) { console.error('保存平台失败', e); }
    });
    footer.appendChild(saveBtn);

    const m = new Modal({ title: isEdit ? '编辑平台' : '添加平台', size: 'md' });
    m.setBody(body);
    m.setFooter(footer);
    m.open();
    cancelBtn.addEventListener('click', () => m.close());
    setTimeout(() => nameInput.focus(), 100);
  }

  async _deletePlatform(platform) {
    const body = document.createElement('div');
    body.style.cssText = 'padding:20px 18px;text-align:center;';
    body.innerHTML = `<div style="font-size:16px;margin-bottom:12px;">确认删除平台「${this._escapeHtml(platform.name)}」？</div><div style="font-size:12px;color:var(--ms-text-secondary);">已有发布包中的引用不受影响，已禁用的平台建议保留。</div>`;

    const footer = document.createElement('div');
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'ms-btn ms-btn-sm';
    cancelBtn.textContent = '取消';
    footer.appendChild(cancelBtn);
    const delBtn = document.createElement('button');
    delBtn.className = 'ms-btn ms-btn-sm';
    delBtn.style.cssText = 'padding:6px 16px;border:none;border-radius:var(--ms-radius-sm);cursor:pointer;font-size:12px;font-weight:500;background:var(--ms-danger);color:#fff;';
    delBtn.textContent = '确认删除';
    delBtn.addEventListener('click', async () => {
      try {
        await this._repo().delete(platform.id);
        await this._load();
        this._renderList();
      } catch (e) { console.error('删除平台失败', e); }
      m.close();
    });
    footer.appendChild(delBtn);

    const m = new Modal({ size: 'sm' });
    m.setBody(body);
    m.setFooter(footer);
    m.open();
    cancelBtn.addEventListener('click', () => m.close());
  }

  _formField(label, type, value, placeholder) {
    const row = document.createElement('div');
    row.style.marginBottom = '14px';

    const labelEl = document.createElement('div');
    labelEl.className = 'ms-form-label';
    labelEl.textContent = label;
    row.appendChild(labelEl);

    if (type === 'select') {
      const select = document.createElement('select');
      select.className = 'ms-select';
      select.style.cssText = 'width:100%;padding:6px 10px;font-size:13px;border:1px solid var(--ms-border);border-radius:var(--ms-radius-sm);background:var(--ms-bg-primary);color:var(--ms-text-primary);';
      if (value) select.value = value;
      row.appendChild(select);
    } else if (type === 'textarea') {
      const textarea = document.createElement('textarea');
      textarea.className = 'ms-form-textarea';
      textarea.placeholder = placeholder || '';
      textarea.value = value || '';
      textarea.style.minHeight = '80px';
      textarea.style.fontFamily = 'monospace';
      textarea.style.fontSize = '12px';
      row.appendChild(textarea);
    } else {
      const input = document.createElement('input');
      input.className = 'ms-form-input';
      input.placeholder = placeholder || '';
      input.value = value || '';
      row.appendChild(input);
    }
    return row;
  }

  _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  destroy() {}
}
