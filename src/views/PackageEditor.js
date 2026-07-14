import { PlatformSelector } from './components/PlatformSelector.js';
import { ThemeSelector } from './components/ThemeSelector.js';
import { appendLinkedCopy } from '../utils/meta.js';
import { createElement, empty } from '../utils/dom.js';
import { slugify } from '../utils/format.js';

export class PackageEditor {
  constructor({ api, state }) {
    this.api = api;
    this.state = state;
    this.platformSelector = new PlatformSelector(api);
    this.themeSelector = new ThemeSelector(api, state);
    this.selectedAssets = [];
    this.coverAsset = null;
    this.form = {};
  }

  async render(container) {
    empty(container);

    const editor = document.createElement('div');
    editor.className = 'ms-package-editor';
    container.appendChild(editor);

    const title = document.createElement('h2');
    title.textContent = '📦 新建发布包';
    title.style.marginBottom = '24px';
    editor.appendChild(title);

    const form = document.createElement('div');
    form.className = 'ms-package-form';
    this.form.container = form;

    await this._buildForm(form);
    editor.appendChild(form);
  }

  async _buildForm(form) {
    const platformRow = document.createElement('div');
    platformRow.className = 'ms-form-row';
    await this.platformSelector.load();
    this.platformSelector.render(platformRow);
    this.platformSelector.onChange = () => this._applyTemplate();
    form.appendChild(platformRow);

    const themeRow = document.createElement('div');
    themeRow.className = 'ms-form-row';
    const themeLabel = document.createElement('label');
    themeLabel.className = 'ms-form-label';
    themeLabel.textContent = '主题';
    themeRow.appendChild(themeLabel);
    const themeSelect = document.createElement('select');
    themeSelect.className = 'ms-form-input';
    themeSelect.style.maxWidth = '200px';
    this.themeSelector.onChange = (themes) => {
      if (themes.length > 0) {
        form.dataset.theme = themes[0];
      }
    };
    await this.themeSelector.loadCheckboxThemeList(themeSelect);
    themeRow.appendChild(themeSelect);
    form.appendChild(themeRow);

    const dateRow = document.createElement('div');
    dateRow.className = 'ms-form-row';
    const dateLabel = document.createElement('label');
    dateLabel.className = 'ms-form-label';
    dateLabel.textContent = '发布日期';
    dateRow.appendChild(dateLabel);
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.className = 'ms-form-input';
    dateInput.style.maxWidth = '200px';
    dateInput.value = new Date().toISOString().split('T')[0];
    dateRow.appendChild(dateInput);
    form.appendChild(dateRow);

    const timeRow = document.createElement('div');
    timeRow.className = 'ms-form-row';
    const timeLabel = document.createElement('label');
    timeLabel.className = 'ms-form-label';
    timeLabel.textContent = '发布时间';
    timeRow.appendChild(timeLabel);
    const timeInput = document.createElement('input');
    timeInput.type = 'time';
    timeInput.className = 'ms-form-input';
    timeInput.style.maxWidth = '200px';
    timeInput.value = '10:00';
    timeRow.appendChild(timeInput);
    form.appendChild(timeRow);

    const titleRow = document.createElement('div');
    titleRow.className = 'ms-form-row';
    const titleLabel = document.createElement('label');
    titleLabel.className = 'ms-form-label';
    titleLabel.textContent = '标题';
    titleRow.appendChild(titleLabel);
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'ms-form-input';
    titleInput.placeholder = '发布包标题';
    titleRow.appendChild(titleInput);
    form.appendChild(titleRow);

    const subtitleRow = document.createElement('div');
    subtitleRow.className = 'ms-form-row';
    const subtitleLabel = document.createElement('label');
    subtitleLabel.className = 'ms-form-label';
    subtitleLabel.textContent = '副标题';
    subtitleRow.appendChild(subtitleLabel);
    const subtitleInput = document.createElement('input');
    subtitleInput.type = 'text';
    subtitleInput.className = 'ms-form-input';
    subtitleInput.placeholder = '副标题 (可选)';
    subtitleRow.appendChild(subtitleInput);
    form.appendChild(subtitleRow);

    const assetSection = document.createElement('div');
    assetSection.className = 'ms-detail-section';
    const assetTitle = document.createElement('h3');
    assetTitle.textContent = '选择素材';
    assetSection.appendChild(assetTitle);

    const assetGrid = document.createElement('div');
    assetGrid.className = 'ms-asset-grid-select';
    assetSection.appendChild(assetGrid);
    form.appendChild(assetSection);

    const bodyLabel = document.createElement('label');
    bodyLabel.className = 'ms-form-label';
    bodyLabel.textContent = '正文 (Markdown)';
    form.appendChild(bodyLabel);

    const bodyEditor = document.createElement('textarea');
    bodyEditor.className = 'ms-form-textarea';
    bodyEditor.placeholder = '在此编写发布正文...\n支持 Markdown 格式';
    form.appendChild(bodyEditor);

    const tagsRow = document.createElement('div');
    tagsRow.className = 'ms-form-row';
    const tagsLabel = document.createElement('label');
    tagsLabel.className = 'ms-form-label';
    tagsLabel.textContent = '标签';
    tagsRow.appendChild(tagsLabel);
    const tagsInput = document.createElement('input');
    tagsInput.type = 'text';
    tagsInput.className = 'ms-form-input';
    tagsInput.placeholder = '标签1, 标签2, 标签3';
    tagsRow.appendChild(tagsInput);
    form.appendChild(tagsRow);

    const actionRow = document.createElement('div');
    actionRow.className = 'ms-form-row';
    actionRow.style.marginTop = '16px';

    const aiBtn = document.createElement('button');
    aiBtn.className = 'ms-btn ms-btn-sm';
    aiBtn.textContent = '🤖 AI 生成文案';
    aiBtn.disabled = true;
    aiBtn.title = '即将推出';
    actionRow.appendChild(aiBtn);

    const applyTmplBtn = document.createElement('button');
    applyTmplBtn.className = 'ms-btn ms-btn-sm';
    applyTmplBtn.textContent = '📋 应用模板';
    applyTmplBtn.addEventListener('click', () => this._applyTemplate());
    actionRow.appendChild(applyTmplBtn);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'ms-btn ms-btn-primary';
    saveBtn.textContent = '💾 保存发布包';
    saveBtn.addEventListener('click', () => this._save());
    actionRow.appendChild(saveBtn);

    form.appendChild(actionRow);
  }

  async _applyTemplate() {
    const platformName = this.platformSelector.selectedPlatform;
    if (!platformName) return;

    const config = await this.platformSelector.getPlatformConfig(platformName);
    if (!config) return;

    const bodyField = this.form.container.querySelector('textarea');
    if (config.template && bodyField && !bodyField.value) {
      bodyField.value = config.template;
    }

    const tagsField = this.form.container.querySelector('input[placeholder="标签1, 标签2, 标签3"]');
    if (config.default_tags && tagsField) {
      tagsField.value = config.default_tags.join(', ');
    }
  }

  async _save() {
    const platform = this.platformSelector.selectedPlatform;
    const theme = this.form.container.dataset.theme || '';
    const date = this.form.container.querySelector('input[type="date"]')?.value || '';
    const time = this.form.container.querySelector('input[type="time"]')?.value || '';
    const title = this.form.container.querySelector('input[placeholder="发布包标题"]')?.value || '未命名发布包';
    const subtitle = this.form.container.querySelector('input[placeholder="副标题 (可选)"]')?.value || '';
    const body = this.form.container.querySelector('textarea')?.value || '';
    const tagsStr = this.form.container.querySelector('input[placeholder="标签1, 标签2, 标签3"]')?.value || '';
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

    if (!platform || !date) {
      alert('请填写平台和日期');
      return;
    }

    const dateStr = date.replace(/-/g, '');
    const slug = slugify(title);
    const filename = `pipeline/04-scheduled/${dateStr}/${slug}.md`;
    const scheduledAt = `${date}T${time}:00`;

    const frontmatter = {
      title,
      subtitle,
      platform,
      theme,
      tags,
      scheduled_at: scheduledAt,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      assets: this.selectedAssets.map(a => ({ path: a.path, name: a.name }))
    };

    if (this.coverAsset) {
      frontmatter.cover = this.coverAsset.path;
    }

    let fmStr = '---\n';
    for (const [k, v] of Object.entries(frontmatter)) {
      if (Array.isArray(v)) {
        fmStr += `${k}:\n`;
        for (const item of v) {
          if (typeof item === 'object') {
            fmStr += `  - path: ${item.path}\n    name: ${item.name}\n`;
          } else {
            fmStr += `  - ${item}\n`;
          }
        }
      } else if (typeof v === 'object' && v !== null) {
        fmStr += `${k}:\n`;
        for (const [sk, sv] of Object.entries(v)) {
          fmStr += `  ${sk}: ${sv}\n`;
        }
      } else {
        fmStr += `${k}: ${v}\n`;
      }
    }
    fmStr += '---\n\n';
    const content = fmStr + body;

    try {
      await this.api.write(filename, content);
      for (const asset of this.selectedAssets) {
        await appendLinkedCopy(this.api, asset.path, filename);
      }
      alert('发布包已保存!');
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  }
}
