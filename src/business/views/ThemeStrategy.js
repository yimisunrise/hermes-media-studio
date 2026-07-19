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
      content.innerHTML = '<div class="ms-empty"><div class="ms-empty-icon">📋</div><div>暂无主题，点击上方「新增主题」创建第一个主题</div></div>';
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
    card.style.cssText = 'background:var(--ms-bg-card);border-radius:var(--ms-radius);padding:14px;border:1px solid var(--ms-border);cursor:pointer;transition:var(--ms-transition);position:relative;';
    card.addEventListener('mouseenter', () => { card.style.borderColor = 'var(--ms-accent)'; });
    card.addEventListener('mouseleave', () => { card.style.borderColor = 'var(--ms-border)'; });

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
    actions.style.cssText = 'position:absolute;top:8px;right:8px;display:none;gap:4px;';
    card.addEventListener('mouseenter', () => { actions.style.display = 'flex'; });
    card.addEventListener('mouseleave', () => { actions.style.display = 'none'; });

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

    const body = document.createElement('div');

    const nameRow = document.createElement('div');
    nameRow.style.marginBottom = '14px';
    const nameLabel = document.createElement('div');
    nameLabel.className = 'ms-form-label';
    nameLabel.textContent = '主题名称 *';
    nameRow.appendChild(nameLabel);
    const nameInput = document.createElement('input');
    nameInput.className = 'ms-form-input';
    nameInput.placeholder = '如：赛博朋克系列';
    nameInput.value = isEdit ? (theme.name || '') : '';
    nameRow.appendChild(nameInput);
    body.appendChild(nameRow);

    const descRow = document.createElement('div');
    descRow.style.marginBottom = '14px';
    const descLabel = document.createElement('div');
    descLabel.className = 'ms-form-label';
    descLabel.textContent = '风格描述';
    descRow.appendChild(descLabel);
    const descInput = document.createElement('textarea');
    descInput.className = 'ms-form-textarea';
    descInput.placeholder = '描述这个主题的视觉风格、调性…（HermesAgent 会参考此描述生成素材）';
    descInput.style.minHeight = '80px';
    descInput.value = isEdit ? (theme.description || '') : '';
    descRow.appendChild(descInput);
    body.appendChild(descRow);

    const colorRow = document.createElement('div');
    colorRow.style.marginBottom = '14px';
    const colorLabel = document.createElement('div');
    colorLabel.className = 'ms-form-label';
    colorLabel.textContent = '主题色';
    colorRow.appendChild(colorLabel);
    const colorInput = document.createElement('input');
    colorInput.className = 'ms-form-input';
    colorInput.style.cssText = 'width:100px;padding:4px 8px;';
    colorInput.placeholder = '#e94560';
    colorInput.value = isEdit ? (theme.color || '') : '';
    colorRow.appendChild(colorInput);

    const colorPreview = document.createElement('div');
    colorPreview.style.cssText = 'width:24px;height:24px;border-radius:4px;border:1px solid var(--ms-border);margin-left:8px;flex-shrink:0;';
    colorInput.addEventListener('input', () => {
      colorPreview.style.background = colorInput.value || 'transparent';
    });
    const colorRowInner = document.createElement('div');
    colorRowInner.style.cssText = 'display:flex;align-items:center;';
    colorRowInner.appendChild(colorInput);
    colorRowInner.appendChild(colorPreview);
    colorRow.appendChild(colorRowInner);
    body.appendChild(colorRow);

    const tagRow = document.createElement('div');
    tagRow.style.marginBottom = '14px';
    const tagLabel = document.createElement('div');
    tagLabel.className = 'ms-form-label';
    tagLabel.textContent = '标签（英文逗号分隔）';
    tagRow.appendChild(tagLabel);
    const tagInput = document.createElement('input');
    tagInput.className = 'ms-form-input';
    tagInput.placeholder = '如：科技, 赛博, 霓虹';
    tagInput.value = isEdit && theme.tags ? theme.tags.join(', ') : '';
    tagRow.appendChild(tagInput);
    body.appendChild(tagRow);

    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:11px;color:var(--ms-text-secondary);line-height:1.5;padding:8px 12px;background:rgba(233,69,96,0.05);border-radius:var(--ms-radius-sm);';
    hint.innerHTML = '💡 主题的「风格描述」会在 Agent 模式下传递给 HermesAgent，作为素材生成时 Prompt 的参考依据。';
    body.appendChild(hint);

    const footer = document.createElement('div');
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'ms-btn ms-btn-sm';
    cancelBtn.textContent = '取消';
    footer.appendChild(cancelBtn);
    const saveBtn = document.createElement('button');
    saveBtn.className = 'ms-btn ms-btn-primary ms-btn-sm';
    saveBtn.textContent = isEdit ? '保存' : '创建';
    saveBtn.addEventListener('click', async () => {
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
    footer.appendChild(saveBtn);

    const m = new Modal({
      title: isEdit ? '编辑主题' : '新增主题',
      size: 'md',
      container: this._container,
    });
    m.setBody(body);
    m.setFooter(footer);
    m.open();
    cancelBtn.addEventListener('click', () => m.close());

    setTimeout(() => nameInput.focus(), 100);
    colorPreview.style.background = colorInput.value || 'transparent';
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
        await this._themeRepo().delete(theme.id);
        await this.render(this._container);
      } catch (e) {
        console.error('删除主题失败', e);
      }
      m.close();
    });
    footer.appendChild(delBtn);

    const m = new Modal({ size: 'sm', container: this._container });
    m.setBody(body);
    m.setFooter(footer);
    m.open();
    cancelBtn.addEventListener('click', () => m.close());
  }

  _fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
}
