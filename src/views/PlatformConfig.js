import { createElement, empty } from '../utils/dom.js';

export class PlatformConfig {
  constructor({ api, state }) {
    this.api = api;
    this.state = state;
    this.platforms = [];
  }

  async render(container) {
    empty(container);
    await this._loadPlatforms();

    const header = document.createElement('div');
    header.className = 'ms-toolbar';
    const title = document.createElement('span');
    title.style.fontWeight = '600';
    title.textContent = '平台配置';
    header.appendChild(title);

    const addBtn = document.createElement('button');
    addBtn.className = 'ms-btn ms-btn-primary ms-btn-sm';
    addBtn.textContent = '添加平台';
    addBtn.addEventListener('click', () => this._openPlatformEditor());
    header.appendChild(addBtn);

    container.appendChild(header);

    const list = document.createElement('div');
    list.className = 'ms-platform-list ms-flex-col-gap12';
    list.style.marginTop = '16px';
    container.appendChild(list);

    if (this.platforms.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'ms-empty';
      emptyEl.innerHTML = '<div>暂无平台配置，点击上方按钮添加</div>';
      list.appendChild(emptyEl);
      return;
    }

    for (const platform of this.platforms) {
      const card = this._renderPlatformCard(platform);
      list.appendChild(card);
    }
  }

  async _loadPlatforms() {
    try {
      this.platforms = await this.api.listPlatforms();
    } catch {
      this.platforms = [];
    }
  }

  _renderPlatformCard(platform) {
    const card = document.createElement('div');
    card.className = 'ms-platform-card';
    card.style.cssText = `
      display:flex;align-items:center;justify-content:space-between;
      background:var(--ms-bg-card,#1e1e36);padding:16px;border-radius:var(--ms-radius,8px);
      border:1px solid var(--ms-border,#2a2a4a);
      ${platform.enabled === false ? 'opacity:0.6;' : ''}
    `;

    const info = document.createElement('div');
    info.className = 'ms-flex-col-gap8';

    const nameRow = document.createElement('div');
    nameRow.className = 'ms-flex-row-center';

    const name = document.createElement('span');
    name.style.fontWeight = '600';
    name.style.fontSize = '15px';
    name.textContent = platform.name || platform.id;
    nameRow.appendChild(name);

    if (platform.enabled === false) {
      const disabledBadge = document.createElement('span');
      disabledBadge.className = 'ms-badge ms-badge-disabled';
      disabledBadge.style.cssText = `
        font-size:11px;padding:2px 8px;border-radius:4px;
        background:var(--ms-bg-secondary,#2a2a4a);color:var(--ms-text-secondary,#888);
      `;
      disabledBadge.textContent = '已禁用';
      nameRow.appendChild(disabledBadge);
    }

    info.appendChild(nameRow);

    if (platform.publishTypes && platform.publishTypes.length > 0) {
      const typesRow = document.createElement('div');
      typesRow.className = 'ms-flex-row-wrap';

      for (const pt of platform.publishTypes) {
        const tag = document.createElement('span');
        tag.className = 'ms-badge ms-badge-type';
        tag.style.cssText = `
          font-size:11px;padding:2px 8px;border-radius:4px;
          background:var(--ms-accent-bg,rgba(74,144,217,0.15));
          color:var(--ms-accent,#4a90d9);
        `;
        tag.textContent = pt;
        typesRow.appendChild(tag);
      }

      info.appendChild(typesRow);
    }

    card.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'ms-flex-row-gap8';

    const editBtn = document.createElement('button');
    editBtn.className = 'ms-btn ms-btn-sm';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', () => this._openPlatformEditor(platform));
    actions.appendChild(editBtn);

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'ms-btn ms-btn-sm';
    toggleBtn.textContent = platform.enabled === false ? '启用' : '禁用';
    toggleBtn.addEventListener('click', async () => {
      try {
        await this.api.updatePlatform(platform.id, { enabled: !(platform.enabled !== false) });
        await this._loadPlatforms();
        const container = document.getElementById('media-studio-view-container');
        if (container) this.render(container);
      } catch (e) {
        alert('操作失败: ' + e.message);
      }
    });
    actions.appendChild(toggleBtn);

    card.appendChild(actions);
    return card;
  }

  _openPlatformEditor(platform) {
    const isNew = !platform;
    const overlay = document.createElement('div');
    overlay.className = 'ms-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'ms-modal ms-p24-max500';

    const title = document.createElement('h3');
    title.style.cssText = 'margin:0 0 20px';
    title.textContent = isNew ? '添加平台' : '编辑平台: ' + (platform.name || platform.id);
    modal.appendChild(title);

    const form = document.createElement('div');
    form.className = 'ms-flex-col-gap12';

    const nameRow = document.createElement('div');
    nameRow.className = 'ms-form-row';
    const nameLabel = document.createElement('label');
    nameLabel.className = 'ms-form-label';
    nameLabel.textContent = '平台名称';
    nameRow.appendChild(nameLabel);
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'ms-form-input';
    nameInput.value = platform ? (platform.name || '') : '';
    nameInput.placeholder = '例如: 小红书';
    nameRow.appendChild(nameInput);
    form.appendChild(nameRow);

    const typesRow = document.createElement('div');
    typesRow.className = 'ms-form-row';
    const typesLabel = document.createElement('label');
    typesLabel.className = 'ms-form-label';
    typesLabel.textContent = '发布类型';
    typesRow.appendChild(typesLabel);

    const typesContainer = document.createElement('div');
    typesContainer.className = 'ms-flex-col-gap8';

    const publishTypes = platform ? (platform.publishTypes || []) : [];

    function addTypeInput(value) {
      const row = document.createElement('div');
      row.className = 'ms-flex-row-center';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'ms-form-input';
      input.style.flex = '1';
      input.value = value || '';
      input.placeholder = '例如: 图文笔记';
      row.appendChild(input);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'ms-btn ms-btn-sm';
      removeBtn.textContent = '移除';
      removeBtn.addEventListener('click', () => {
        row.remove();
      });
      row.appendChild(removeBtn);

      typesContainer.appendChild(row);
    }

    for (const pt of publishTypes) {
      addTypeInput(pt);
    }
    if (publishTypes.length === 0) {
      addTypeInput('');
    }

    const addTypeBtn = document.createElement('button');
    addTypeBtn.className = 'ms-btn ms-btn-sm';
    addTypeBtn.textContent = '添加类型';
    addTypeBtn.style.cssText = 'align-self:flex-start;margin-top:4px';
    addTypeBtn.addEventListener('click', () => addTypeInput(''));
    typesContainer.appendChild(addTypeBtn);

    typesRow.appendChild(typesContainer);
    form.appendChild(typesRow);

    modal.appendChild(form);

    const actions = document.createElement('div');
    actions.className = 'ms-flex-end';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'ms-btn';
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', () => overlay.remove());
    actions.appendChild(cancelBtn);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'ms-btn ms-btn-primary';
    saveBtn.textContent = '保存';
    saveBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      if (!name) {
        alert('请输入平台名称');
        return;
      }

      const typeInputs = typesContainer.querySelectorAll('input');
      const types = [];
      typeInputs.forEach(inp => {
        const val = inp.value.trim();
        if (val) types.push(val);
      });

      if (types.length === 0) {
        alert('请至少添加一个发布类型');
        return;
      }

      try {
        if (isNew) {
          await this.api.createPlatform(name, types);
        } else {
          await this.api.updatePlatform(platform.id, { name, publishTypes: types });
        }
        overlay.remove();
        await this._loadPlatforms();
        const container = document.getElementById('media-studio-view-container');
        if (container) this.render(container);
      } catch (e) {
        alert('保存失败: ' + e.message);
      }
    });
    actions.appendChild(saveBtn);

    modal.appendChild(actions);
    overlay.appendChild(modal);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
  }
}
