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
      content.innerHTML = '<div class="ms-empty"><svg class="ms-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg><div>暂无平台配置，点击上方「添加平台」添加第一个发布平台</div></div>';
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

    for (const p of this._platforms) {
      const card = document.createElement('div');
      card.className = 'ms-item-card';

      const info = document.createElement('div');
      info.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';

      const nameEl = document.createElement('div');
      nameEl.style.fontWeight = '600';
      nameEl.style.fontSize = '14px';
      nameEl.textContent = p.name;
      info.appendChild(nameEl);

      const actions = document.createElement('div');
      actions.className = 'ms-item-card-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'ms-btn ms-btn-sm ms-btn-icon';
      editBtn.textContent = '✎';
      editBtn.title = '编辑';
      editBtn.addEventListener('click', (e) => { e.stopPropagation(); this._openEditor(p); });
      actions.appendChild(editBtn);

      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'ms-btn ms-btn-sm ms-btn-icon';
      toggleBtn.textContent = p.enabled !== false ? '⏻' : '⏼';
      toggleBtn.title = p.enabled !== false ? '禁用' : '启用';
      toggleBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await this._repo().update(p.id, { enabled: p.enabled === false ? true : false });
          await this._load();
          this._renderList();
        } catch (e) { console.error('切换平台状态失败', e); }
      });
      actions.appendChild(toggleBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'ms-btn ms-btn-sm ms-btn-icon';
      delBtn.textContent = '✕';
      delBtn.title = '删除';
      delBtn.style.color = 'var(--ms-danger)';
      delBtn.addEventListener('click', (e) => { e.stopPropagation(); this._deletePlatform(p); });
      actions.appendChild(delBtn);

      info.appendChild(actions);
      card.appendChild(info);

      const meta = document.createElement('div');
      meta.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12px;color:var(--ms-text-secondary);';

      const typeLabel = document.createElement('span');
      typeLabel.textContent = PLATFORM_TYPE_LABELS[p.type] || p.type || '-';
      meta.appendChild(typeLabel);

      const slugEl = document.createElement('span');
      slugEl.style.cssText = 'font-family:monospace;font-size:11px;color:var(--ms-text-secondary);';
      slugEl.textContent = p.slug || '';
      if (p.slug) meta.appendChild(slugEl);

      const statusBadge = document.createElement('span');
      statusBadge.className = 'ms-task-status-badge';
      statusBadge.style.cssText = 'margin-left:auto;font-size:10px;padding:1px 8px;border-radius:3px;';
      statusBadge.style.background = p.enabled !== false ? 'rgba(39,174,96,0.15)' : 'rgba(160,160,160,0.15)';
      statusBadge.style.color = p.enabled !== false ? 'var(--ms-success,#27ae60)' : 'var(--ms-text-secondary)';
      statusBadge.textContent = p.enabled !== false ? '启用' : '禁用';
      meta.appendChild(statusBadge);

      card.appendChild(meta);

      card.addEventListener('click', () => this._openEditor(p));

      this._content.appendChild(card);
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

    const m = new Modal({ title: isEdit ? '编辑平台' : '添加平台', size: 'md' });
    m.setBody(body);
    m.setFooter(`
      <button class="ms-btn ms-btn-sm" id="pc-cancel">取消</button>
      <button class="ms-btn ms-btn-primary ms-btn-sm" id="pc-save">${isEdit ? '保存' : '添加'}</button>
    `);
    m.open();

    m.el.querySelector('#pc-cancel').addEventListener('click', () => m.close());
    m.el.querySelector('#pc-save').addEventListener('click', async () => {
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
    setTimeout(() => nameInput.focus(), 100);
  }

  async _deletePlatform(platform) {
    const body = document.createElement('div');
    body.style.cssText = 'padding:20px 18px;text-align:center;';
    body.innerHTML = `<div style="font-size:16px;margin-bottom:12px;">确认删除平台「${this._escapeHtml(platform.name)}」？</div><div style="font-size:12px;color:var(--ms-text-secondary);">已有发布包中的引用不受影响，已禁用的平台建议保留。</div>`;

    const m = new Modal({ size: 'sm' });
    m.setBody(body);
    m.setFooter(`
      <button class="ms-btn ms-btn-sm" id="pc-del-cancel">取消</button>
      <button class="ms-btn ms-btn-sm" id="pc-del-confirm" style="padding:6px 16px;border:none;border-radius:var(--ms-radius-sm);cursor:pointer;font-size:12px;font-weight:500;background:var(--ms-danger);color:#fff;">确认删除</button>
    `);
    m.open();

    m.el.querySelector('#pc-del-cancel').addEventListener('click', () => m.close());
    m.el.querySelector('#pc-del-confirm').addEventListener('click', async () => {
      try {
        await this._repo().delete(platform.id);
        await this._load();
        this._renderList();
      } catch (e) { console.error('删除平台失败', e); }
      m.close();
    });
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
