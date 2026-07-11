export class PlatformSelector {
  constructor(api) {
    this.api = api;
    this.platforms = [];
    this.selectedPlatform = null;
  }

  async load() {
    try {
      const data = await this.api.tree('configs/platforms');
      const entries = Array.isArray(data) ? data : (data.children || data.files || []);
      this.platforms = entries
        .filter(e => e.type === 'directory' || e.isDirectory || e.name.endsWith('.json'))
        .map(e => ({
          name: e.name.replace('.json', ''),
          path: `configs/platforms/${e.name}`
        }));
    } catch {
      this.platforms = [];
    }
    return this.platforms;
  }

  async getPlatformConfig(name) {
    try {
      return await this.api.readJSON(`configs/platforms/${name}.json`);
    } catch {
      try {
        return await this.api.readJSON(`configs/platforms/${name}/config.json`);
      } catch {
        return null;
      }
    }
  }

  render(container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ms-form-row';

    const label = document.createElement('label');
    label.className = 'ms-form-label';
    label.textContent = '发布平台';
    wrapper.appendChild(label);

    const select = document.createElement('select');
    select.className = 'ms-form-input';
    select.style.maxWidth = '200px';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '选择平台...';
    select.appendChild(placeholder);

    for (const platform of this.platforms) {
      const opt = document.createElement('option');
      opt.value = platform.name;
      opt.textContent = platform.name;
      if (this.selectedPlatform === platform.name) opt.selected = true;
      select.appendChild(opt);
    }

    select.addEventListener('change', () => {
      this.selectedPlatform = select.value;
      if (this.onChange) this.onChange(this.selectedPlatform);
    });

    wrapper.appendChild(select);
    container.appendChild(wrapper);
  }
}
