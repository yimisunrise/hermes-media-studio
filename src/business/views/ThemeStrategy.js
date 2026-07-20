import { createElement, empty } from '../../framework/utils/dom.js';
import { Modal } from '../../framework/ui/Modal.js';
import { repo } from '../data/index.js';

export class ThemeStrategy {
  constructor({ api, state, schemaRegistry }) {
    this.api = api;
    this.state = state;
    this._sr = schemaRegistry;
    this.themes = [];
    this._editingTheme = null;
  }

  _themeRepo() {
    return repo(this.api, this._sr, 'themes');
  }

  async render(container) {
    empty(container);
    this._container = container;
    await this._loadThemes();

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--ms-border);';
    const title = document.createElement('span');
    title.style.fontWeight = '600';
    title.style.fontSize = '15px';
    title.textContent = '主题策略';
    toolbar.appendChild(title);

    const addBtn = document.createElement('button');
    addBtn.className = 'ms-btn ms-btn-primary ms-btn-sm';
    addBtn.textContent = '新增主题';
    addBtn.addEventListener('click', () => this._openEditor(null));
    toolbar.appendChild(addBtn);
    container.appendChild(toolbar);

    const content = document.createElement('div');
    content.style.padding = '16px';
    container.appendChild(content);

    if (this.themes.length === 0) {
      content.innerHTML = `<div class="ms-empty">
        <svg class="ms-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
          <polyline points="13 2 13 9 20 9"/>
        </svg>
        <div>暂无主题，点击上方「新增主题」创建第一个主题</div>
      </div>`;
      return;
    }

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;';
    content.appendChild(grid);

    for (const theme of this.themes) {
      const card = this._renderCard(theme);
      grid.appendChild(card);
    }
  }

  async _loadThemes() {
    try {
      const result = await this._themeRepo().find({ sort: '-createdAt' });
      this.themes = result.records || [];
    } catch {
      this.themes = [];
    }
  }

  _renderCard(theme) {
    const card = document.createElement('div');
    card.className = 'ms-item-card';

    const swatch = document.createElement('div');
    swatch.style.cssText = `width:100%;height:4px;border-radius:2px;margin-bottom:10px;background:${theme.color || '#e94560'};`;
    card.appendChild(swatch);

    const name = document.createElement('div');
    name.style.fontWeight = '600';
    name.style.fontSize = '14px';
    name.style.marginBottom = '6px';
    name.textContent = theme.name;
    card.appendChild(name);

    if (theme.description) {
      const desc = document.createElement('div');
      desc.style.cssText = 'font-size:12px;color:var(--ms-text-secondary);line-height:1.5;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;';
      desc.textContent = theme.description;
      card.appendChild(desc);
    }

    const meta = document.createElement('div');
    meta.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;';

    if (theme.tags && theme.tags.length > 0) {
      for (const tag of theme.tags) {
        const badge = document.createElement('span');
        badge.style.cssText = 'font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(233,69,96,0.15);color:var(--ms-accent);';
        badge.textContent = tag;
        meta.appendChild(badge);
      }
    }

    const time = document.createElement('span');
    time.style.cssText = 'font-size:11px;color:var(--ms-text-secondary);margin-left:auto;';
    time.textContent = this._fmtDate(theme.createdAt);
    meta.appendChild(time);
    card.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'ms-item-card-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'ms-btn ms-btn-sm ms-btn-icon';
    editBtn.textContent = '✎';
    editBtn.title = '编辑';
    editBtn.addEventListener('click', (e) => { e.stopPropagation(); this._openEditor(theme); });
    actions.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'ms-btn ms-btn-sm ms-btn-icon';
    delBtn.textContent = '✕';
    delBtn.title = '删除';
    delBtn.style.color = 'var(--ms-danger)';
    delBtn.addEventListener('click', (e) => { e.stopPropagation(); this._deleteTheme(theme); });
    actions.appendChild(delBtn);

    card.appendChild(actions);

    card.addEventListener('click', () => this._openEditor(theme));
    return card;
  }

  _openEditor(theme) {
    this._editingTheme = theme || null;
    const isEdit = !!theme;

    const nameVal = isEdit ? (theme.name || '') : '';
    const descVal = isEdit ? (theme.description || '') : '';
    const colorVal = isEdit ? (theme.color || '') : '';
    const tagsVal = isEdit && theme.tags ? theme.tags.join(', ') : '';

    const body = document.createElement('div');

    const nameGroup = document.createElement('div');
    nameGroup.className = 'ms-form-group';
    const nameLbl = document.createElement('label');
    nameLbl.textContent = '主题名称 *';
    nameGroup.appendChild(nameLbl);
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'ms-form-input';
    nameInput.placeholder = '如：赛博朋克系列';
    nameInput.value = nameVal;
    nameGroup.appendChild(nameInput);
    body.appendChild(nameGroup);

    const descGroup = document.createElement('div');
    descGroup.className = 'ms-form-group';
    const descLbl = document.createElement('label');
    descLbl.textContent = '风格描述';
    descGroup.appendChild(descLbl);
    const descInput = document.createElement('textarea');
    descInput.className = 'ms-form-textarea';
    descInput.placeholder = '描述这个主题的视觉风格、调性…（HermesAgent 会参考此描述生成素材）';
    descInput.style.minHeight = '80px';
    descInput.value = descVal;
    descGroup.appendChild(descInput);
    body.appendChild(descGroup);

    const colorGroup = document.createElement('div');
    colorGroup.className = 'ms-form-group';
    const colorLbl = document.createElement('label');
    colorLbl.textContent = '主题色';
    colorGroup.appendChild(colorLbl);
    const colorFlex = document.createElement('div');
    colorFlex.style.cssText = 'display:flex;align-items:center;gap:8px';
    const colorInput = document.createElement('input');
    colorInput.type = 'text';
    colorInput.className = 'ms-form-input';
    colorInput.placeholder = '#e94560';
    colorInput.value = colorVal;
    colorInput.style.width = '100px';
    colorFlex.appendChild(colorInput);
    const colorPreview = document.createElement('div');
    colorPreview.style.cssText = 'width:24px;height:24px;border-radius:4px;border:1px solid var(--ms-border);flex-shrink:0;background:' + (colorVal || 'transparent');
    colorFlex.appendChild(colorPreview);
    colorGroup.appendChild(colorFlex);
    body.appendChild(colorGroup);

    const tagGroup = document.createElement('div');
    tagGroup.className = 'ms-form-group';
    const tagLbl = document.createElement('label');
    tagLbl.textContent = '标签（英文逗号分隔）';
    tagGroup.appendChild(tagLbl);
    const tagInput = document.createElement('input');
    tagInput.type = 'text';
    tagInput.className = 'ms-form-input';
    tagInput.placeholder = '如：科技, 赛博, 霓虹';
    tagInput.value = tagsVal;
    tagGroup.appendChild(tagInput);
    body.appendChild(tagGroup);

    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:11px;color:var(--ms-text-secondary);line-height:1.5;padding:8px 12px;background:rgba(233,69,96,0.05);border-radius:var(--ms-radius-sm);';
    hint.textContent = '主题的「风格描述」会在 Agent 模式下传递给 HermesAgent，作为素材生成时 Prompt 的参考依据。';
    body.appendChild(hint);

    const m = new Modal({
      title: isEdit ? '编辑主题' : '新增主题',
      size: 'md',
      container: this._container,
    });
    m.setBody(body);
    m.setFooter(`
      <button class="ms-btn" id="ms-theme-cancel">取消</button>
      <button class="ms-btn ms-btn-primary" id="ms-theme-save">${isEdit ? '保存' : '创建'}</button>
    `);
    m.open();

    colorInput.addEventListener('input', () => {
      colorPreview.style.background = colorInput.value || 'transparent';
    });
    m.el.querySelector('#ms-theme-cancel').addEventListener('click', () => m.close());
    m.el.querySelector('#ms-theme-save').addEventListener('click', async () => {
      const data = {
        name: nameInput.value.trim(),
        description: descInput.value.trim(),
        color: colorInput.value.trim() || '#e94560',
        tags: tagInput.value.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (!data.name) { nameInput.focus(); nameInput.style.borderColor = 'var(--ms-danger)'; return; }
      await this._saveTheme(data);
      m.close();
    });
    setTimeout(() => nameInput.focus(), 100);
  }

  async _saveTheme(data) {
    try {
      if (this._editingTheme) {
        await this._themeRepo().update(this._editingTheme.id, data);
      } else {
        await this._themeRepo().create(data);
      }
      await this.render(this._container);
    } catch (e) {
      console.error('保存主题失败', e);
    }
  }

  async _deleteTheme(theme) {
    const body = document.createElement('div');
    body.style.padding = '20px 18px';
    body.style.textAlign = 'center';
    body.innerHTML = `<div style="font-size:16px;margin-bottom:12px;">确认删除主题「${theme.name}」？</div><div style="font-size:12px;color:var(--ms-text-secondary);">此操作不可撤销。关联此主题的灵感和选题不受影响。</div>`;

    const m = new Modal({ size: 'sm', container: this._container });
    m.setBody(body);
    m.setFooter(`
      <button class="ms-btn ms-btn-sm" id="ms-theme-del-cancel">取消</button>
      <button class="ms-btn ms-btn-sm ms-btn-danger" id="ms-theme-del-confirm">确认删除</button>
    `);
    m.open();

    m.el.querySelector('#ms-theme-del-cancel').addEventListener('click', () => m.close());
    m.el.querySelector('#ms-theme-del-confirm').addEventListener('click', async () => {
      try {
        await this._themeRepo().delete(theme.id);
        await this.render(this._container);
      } catch (e) {
        console.error('删除主题失败', e);
      }
      m.close();
    });
  }

  _fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
}
