import { createElement, empty } from '../utils/dom.js';

export class ThemeStrategy {
  constructor({ api, state }) {
    this.api = api;
    this.state = state;
    this.themes = [];
  }

  async render(container) {
    empty(container);
    await this._loadThemes();

    const header = document.createElement('div');
    header.className = 'ms-toolbar';
    const title = document.createElement('span');
    title.style.fontWeight = '600';
    title.textContent = '🎨 主题策略';
    header.appendChild(title);

    const createBtn = document.createElement('button');
    createBtn.className = 'ms-btn ms-btn-primary ms-btn-sm';
    createBtn.textContent = '新建主题';
    createBtn.addEventListener('click', () => this._openThemeEditor());
    header.appendChild(createBtn);

    container.appendChild(header);

    const list = document.createElement('div');
    list.className = 'ms-theme-list';
    container.appendChild(list);

    if (this.themes.length === 0) {
      list.innerHTML = '<div class="ms-empty"><div class="ms-empty-icon">🎨</div><div>暂无主题，创建一个开始吧</div></div>';
      return;
    }

    for (const theme of this.themes) {
      const card = this._renderThemeCard(theme);
      list.appendChild(card);
    }
  }

  async _loadThemes() {
    try {
      const data = await this.api.tree('configs/themes');
      const entries = Array.isArray(data) ? data : (data.children || data.files || []);
      this.themes = [];
      for (const entry of entries) {
        if (entry.type === 'dir' || entry.type === 'directory' || entry.isDirectory) {
          const configPath = `configs/themes/${entry.name}/theme.json`;
          let config = {};
          try {
            config = await this.api.readJSON(configPath);
          } catch { /* no config */ }

          if (Object.keys(config).length === 0) {
            config = { name: entry.name };
          }

          let stats = {};
          try {
            const allStats = await this.api.loadDashboardStats();
            stats = allStats.themeStats[entry.name] || {};
          } catch { /* no stats */ }

          this.themes.push({ name: entry.name, config, stats });
        }
      }
    } catch {
      this.themes = [];
    }
  }

  _renderThemeCard(theme) {
    const card = document.createElement('div');
    card.className = 'ms-theme-card';

    const name = document.createElement('h4');
    name.textContent = theme.name;
    card.appendChild(name);

    const stats = document.createElement('div');
    stats.className = 'ms-theme-card-stats';
    stats.innerHTML = `
      发布: ${theme.stats.published || 0} | 浏览量: ${theme.stats.views || 0} | 点赞: ${theme.stats.likes || 0}<br>
      库存: ${theme.stats.approved || 0} 已审核
      ${((theme.stats.approved || 0) < 5) ? '<span style="color:var(--ms-warning);margin-left:8px">⚠ 库存不足</span>' : ''}
    `;
    card.appendChild(stats);

    const actions = document.createElement('div');
    actions.className = 'ms-theme-card-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'ms-btn ms-btn-sm';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', () => this._openThemeEditor(theme));
    actions.appendChild(editBtn);

    const templateBtn = document.createElement('button');
    templateBtn.className = 'ms-btn ms-btn-sm';
    templateBtn.textContent = '提示词模板';
    templateBtn.addEventListener('click', () => this._openPromptTemplate(theme));
    actions.appendChild(templateBtn);

    card.appendChild(actions);
    return card;
  }

  _openThemeEditor(theme) {
    const isNew = !theme;
    const overlay = document.createElement('div');
    overlay.className = 'ms-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'ms-modal';
    modal.style.padding = '24px';
    modal.style.maxWidth = '500px';

    modal.innerHTML = `
      <h3 style="margin:0 0 20px">${isNew ? '新建主题' : '编辑主题: ' + theme.name}</h3>
    `;

    const form = document.createElement('div');
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = '12px';

    const config = isNew ? {} : (theme.config || {});
    const fields = [
      { key: 'name', label: '名称', type: 'text', value: config.name || theme?.name || '' },
      { key: 'style', label: '风格', type: 'text', value: config.style || '' },
      { key: 'model', label: '默认模型', type: 'text', value: config.model || '' },
      { key: 'width', label: '默认宽度', type: 'number', value: config.width || 1024 },
      { key: 'height', label: '默认高度', type: 'number', value: config.height || 1024 },
      { key: 'steps', label: '默认步数', type: 'number', value: config.steps || 30 }
    ];

    for (const field of fields) {
      const row = document.createElement('div');
      row.className = 'ms-form-row';
      row.innerHTML = `<label class="ms-form-label">${field.label}</label>`;
      const input = document.createElement('input');
      input.type = field.type;
      input.className = 'ms-form-input';
      input.value = field.value;
      input.dataset.key = field.key;
      row.appendChild(input);
      form.appendChild(row);
    }

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
      const inputs = form.querySelectorAll('input');
      const data = {};
      inputs.forEach(inp => data[inp.dataset.key] = inp.value);
      const themeName = data.name || 'untitled';
      try {
        await this.api.mkdir(`configs/themes/${themeName}`);
        delete data.name;
        await this.api.writeJSON(`configs/themes/${themeName}/theme.json`, data);
      } catch (e) {
        alert('保存失败: ' + e.message);
        return;
      }
      overlay.remove();
      this.render(document.getElementById('media-studio-view-container'));
    });
    actions.appendChild(saveBtn);

    modal.appendChild(actions);
    overlay.appendChild(modal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  _openPromptTemplate(theme) {
    const overlay = document.createElement('div');
    overlay.className = 'ms-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'ms-modal ms-p24';
    modal.style.maxWidth = '600px';

    modal.innerHTML = `
      <h3 style="margin:0 0 20px">提示词模板: ${theme.name}</h3>
      <textarea id="ms-prompt-template" class="ms-form-textarea" style="min-height:300px" placeholder="在此编写提示词模板...&#10;&#10;支持变量:&#10;{{theme}} - 主题名称&#10;{{style}} - 风格&#10;{{subject}} - 主题内容"></textarea>
      <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
        <button class="ms-btn" id="ms-template-close">关闭</button>
        <button class="ms-btn ms-btn-primary" id="ms-template-save">保存模板</button>
      </div>
    `;

    overlay.appendChild(modal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);

    document.getElementById('ms-template-close')?.addEventListener('click', () => overlay.remove());
    document.getElementById('ms-template-save')?.addEventListener('click', async () => {
      const content = document.getElementById('ms-prompt-template')?.value || '';
      try {
        await this.api.write(`configs/themes/${theme.name}/prompt-template.md`, content);
        alert('模板已保存');
        overlay.remove();
      } catch (e) {
        alert('保存失败: ' + e.message);
      }
    });
  }
}
