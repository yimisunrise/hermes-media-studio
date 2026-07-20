import { empty } from '../../framework/utils/dom.js';
import { formatDateTime } from '../../framework/utils/format.js';
import { templateRepo } from '../data/index.js';
import { Modal } from '../../framework/ui/Modal.js';
import { formGroup, input, textarea } from './components/FormBuilder.js';

const TYPE_LABELS = { brief: '创作简报', content: '文稿内容' };
const TABS = [
  { key: 'brief', label: '创作简报' },
  { key: 'content', label: '文稿内容' }
];

export class TemplatesView {
  constructor({ api, state, schemaRegistry }) {
    this.api = api;
    this.state = state;
    this._sr = schemaRegistry;
    this._templates = [];
    this._activeTab = 'brief';
    this._tabBtns = [];
  }

  destroy() {
  }

  _ts() { return templateRepo(this.api, this._sr); }

  async render(container) {
    empty(container);

    const header = document.createElement('div');
    header.className = 'ms-panel-header';
    const title = document.createElement('span');
    title.style.cssText = 'font-weight:600;font-size:15px';
    title.textContent = '模板管理';
    header.appendChild(title);
    const createBtn = document.createElement('button');
    createBtn.className = 'ms-btn ms-btn-primary ms-btn-sm';
    createBtn.textContent = '新建模板';
    createBtn.addEventListener('click', () => this._showForm());
    header.appendChild(createBtn);
    container.appendChild(header);

    const tabBar = document.createElement('div');
    tabBar.className = 'ms-template-tabs';
    tabBar.style.cssText = 'display:flex;gap:0;padding:0 16px;border-bottom:1px solid var(--ms-border);';
    this._tabBtns = [];
    for (const tab of TABS) {
      const tabBtn = document.createElement('button');
      tabBtn.className = 'ms-btn ms-btn-sm ms-tab-btn';
      tabBtn.textContent = tab.label;
      if (tab.key === this._activeTab) {
        tabBtn.style.borderBottomColor = 'var(--ms-primary,#4a90d9)';
        tabBtn.style.color = 'var(--ms-primary,#4a90d9)';
        tabBtn.style.fontWeight = '600';
      }
      tabBtn.addEventListener('click', () => {
        this._activeTab = tab.key;
        this._updateTabStyles();
        this._renderList();
      });
      tabBar.appendChild(tabBtn);
      this._tabBtns.push(tabBtn);
    }
    container.appendChild(tabBar);

    this._listArea = document.createElement('div');
    this._listArea.className = 'ms-panel-body';
    this._listArea.id = 'media-studio-template-list';
    container.appendChild(this._listArea);

    await this._loadAndRender();
  }

  async _loadAndRender() {
    try {
      const result = await this._ts().find({ sort: '-createdAt' });
      this._templates = result.records || [];
    } catch (e) {
      this._templates = [];
    }
    this._renderList();
  }

  _updateTabStyles() {
    for (const btn of this._tabBtns) {
      const tab = TABS.find(t => t.label === btn.textContent);
      const isActive = tab && tab.key === this._activeTab;
      btn.style.borderBottomColor = isActive ? 'var(--ms-primary,#4a90d9)' : 'transparent';
      btn.style.color = isActive ? 'var(--ms-primary,#4a90d9)' : '';
      btn.style.fontWeight = isActive ? '600' : '';
    }
  }

  _renderList() {
    if (!this._listArea) return;
    empty(this._listArea);

    const filtered = this._templates.filter(t => t.type === this._activeTab);

    if (filtered.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'ms-empty';
      emptyState.innerHTML = `
        <svg class="ms-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
          <polyline points="13 2 13 9 20 9"/>
        </svg>
        <div>暂无模板，点击新建</div>
      `;
      this._listArea.appendChild(emptyState);
      return;
    }

    for (const tmpl of filtered) {
      this._listArea.appendChild(this._renderCard(tmpl));
    }
  }

  _renderCard(tmpl) {
    const card = document.createElement('div');
    card.className = 'ms-item-card';

    const cardHeader = document.createElement('div');
    cardHeader.className = 'ms-template-card-header';
    cardHeader.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px';

    const nameEl = document.createElement('div');
    nameEl.className = 'ms-template-name';
    nameEl.style.cssText = 'font-weight:600;font-size:14px;flex:1;min-width:0';
    nameEl.textContent = tmpl.name || '(未命名)';
    cardHeader.appendChild(nameEl);

    const actions = document.createElement('div');
    actions.className = 'ms-item-card-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'ms-btn ms-btn-sm';
    editBtn.innerHTML = '&#9998;';
    editBtn.title = '编辑';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._showForm(tmpl);
    });
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'ms-btn ms-btn-sm';
    deleteBtn.innerHTML = '&#10005;';
    deleteBtn.title = '删除';
    deleteBtn.style.color = 'var(--ms-danger)';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._handleDelete(tmpl);
    });
    actions.appendChild(deleteBtn);

    cardHeader.appendChild(actions);
    card.appendChild(cardHeader);

    if (tmpl.description) {
      const descEl = document.createElement('div');
      descEl.className = 'ms-template-description';
      descEl.style.cssText = 'font-size:12px;color:var(--ms-text-secondary);margin-bottom:8px;line-height:1.5';
      descEl.textContent = tmpl.description;
      card.appendChild(descEl);
    }

    if (tmpl.tags && tmpl.tags.length > 0) {
      const tagsRow = document.createElement('div');
      tagsRow.className = 'ms-template-tags';
      tagsRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px';
      for (const tag of tmpl.tags) {
        const tagEl = document.createElement('span');
        tagEl.className = 'ms-template-tag';
        tagEl.style.cssText = 'font-size:10px;padding:2px 6px;border-radius:3px;background:rgba(74,144,217,0.15);color:var(--ms-primary,#4a90d9)';
        tagEl.textContent = tag;
        tagsRow.appendChild(tagEl);
      }
      card.appendChild(tagsRow);
    }

    const meta = document.createElement('div');
    meta.className = 'ms-template-meta';
    meta.style.cssText = 'font-size:11px;color:var(--ms-text-secondary);display:flex;align-items:center;gap:8px';

    const typeBadge = document.createElement('span');
    typeBadge.className = 'ms-template-type-badge';
    typeBadge.style.cssText = 'font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(255,255,255,0.05)';
    typeBadge.textContent = TYPE_LABELS[tmpl.type] || tmpl.type;
    meta.appendChild(typeBadge);

    const timeEl = document.createElement('span');
    timeEl.textContent = formatDateTime(tmpl.createdAt);
    meta.appendChild(timeEl);

    card.appendChild(meta);

    card.addEventListener('click', () => this._showForm(tmpl));

    return card;
  }

  _showForm(tmpl) {
    const isEdit = !!tmpl;

    const modal = new Modal({ title: isEdit ? '编辑模板' : '新建模板', size: 'md' });

    const body = document.createElement('div');
    body.style.cssText = 'padding:16px 18px';

    const nameInput = input({ id: 'media-studio-template-form-name', placeholder: '输入模板名称', value: tmpl?.name || '' });
    body.appendChild(formGroup('模板名称 *', nameInput));

    const typeSelect = document.createElement('select');
    typeSelect.className = 'ms-select';
    typeSelect.id = 'media-studio-template-form-type';
    typeSelect.style.cssText = 'width:100%';
    for (const [v, label] of Object.entries(TYPE_LABELS)) {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = label;
      if (tmpl?.type === v) opt.selected = true;
      typeSelect.appendChild(opt);
    }
    body.appendChild(formGroup('模板类型', typeSelect));

    const descInput = input({ id: 'media-studio-template-form-desc', placeholder: '简要说明模板用途', value: tmpl?.description || '' });
    body.appendChild(formGroup('模板说明', descInput));

    const tagsInput = input({ id: 'media-studio-template-form-tags', placeholder: '如：专业, 科技, 产品', value: tmpl?.tags ? tmpl.tags.join(', ') : '' });
    body.appendChild(formGroup('标签（逗号分隔）', tagsInput));

    const contentArea = textarea({ id: 'media-studio-template-form-content', placeholder: '输入模板内容...', minHeight: '120px', value: tmpl?.content || '' });
    body.appendChild(formGroup('模板内容', contentArea));

    modal.setBody(body);
    modal.setFooter(`
      <button class="ms-btn ms-btn-sm" id="tmpl-cancel">取消</button>
      <button class="ms-btn ms-btn-primary ms-btn-sm" id="tmpl-save">${isEdit ? '保存' : '创建'}</button>
    `);
    modal.open();

    const cancelBtn = modal.el.querySelector('#tmpl-cancel');
    const saveBtn = modal.el.querySelector('#tmpl-save');
    cancelBtn.addEventListener('click', () => modal.close());
    saveBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.focus();
        nameInput.style.borderColor = 'var(--ms-danger)';
        return;
      }
      saveBtn.disabled = true;
      saveBtn.textContent = isEdit ? '保存中...' : '创建中...';
      try {
        const data = {
          name,
          type: typeSelect.value,
          description: descInput.value.trim(),
          tags: tagsInput.value.split(',').map(s => s.trim()).filter(Boolean),
          content: contentArea.value
        };
        if (isEdit) {
          await this._ts().update(tmpl.id, data);
        } else {
          await this._ts().create(data);
        }
        modal.close();
        await this._loadAndRender();
      } catch (e) {
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? '保存' : '创建';
        alert('操作失败: ' + e.message);
      }
    });
    setTimeout(() => nameInput.focus(), 100);
  }

  async _handleDelete(tmpl) {
    const body = document.createElement('div');
    body.style.padding = '20px 18px';
    body.style.textAlign = 'center';
    body.innerHTML = `<div style="font-size:16px;margin-bottom:12px;">确认删除模板「${tmpl.name}」？</div><div style="font-size:12px;color:var(--ms-text-secondary);">此操作不可撤销。</div>`;

    const m = new Modal({ size: 'sm', container: document.body });
    m.setBody(body);
    m.setFooter(`
      <button class="ms-btn ms-btn-sm" id="tmpl-del-cancel">取消</button>
      <button class="ms-btn ms-btn-sm ms-btn-danger" id="tmpl-del-confirm">确认删除</button>
    `);
    m.open();

    m.el.querySelector('#tmpl-del-cancel').addEventListener('click', () => m.close());
    m.el.querySelector('#tmpl-del-confirm').addEventListener('click', async () => {
      try {
        await this._ts().delete(tmpl.id);
        await this._loadAndRender();
      } catch (e) {
        console.error('删除模板失败', e);
      }
      m.close();
    });
  }
}

export default TemplatesView;
