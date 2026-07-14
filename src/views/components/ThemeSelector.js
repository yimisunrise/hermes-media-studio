export class ThemeSelector {
  constructor(api, state, options = {}) {
    this.api = api;
    this.state = state;
    this.onChange = options.onChange || (() => {});
    this.themes = [];
    this.selected = [];
  }

  async load() {
    try {
      const data = await this.api.tree('configs/themes');
      const entries = Array.isArray(data) ? data : (data.children || data.files || []);
      this.themes = entries
        .filter(e => e.type === 'directory' || e.isDirectory)
        .map(e => e.name);
    } catch {
      this.themes = [];
    }
    return this.themes;
  }

  render(container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ms-filter-group';

    const label = document.createElement('span');
    label.className = 'ms-filter-label';
    label.textContent = '主题:';
    wrapper.appendChild(label);

    const select = document.createElement('select');
    select.className = 'ms-select';
    select.multiple = false;

    const allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = '全部主题';
    select.appendChild(allOpt);

    for (const theme of this.themes) {
      const opt = document.createElement('option');
      opt.value = theme;
      opt.textContent = theme;
      if (this.selected.includes(theme)) opt.selected = true;
      select.appendChild(opt);
    }

    select.addEventListener('change', () => {
      const val = select.value;
      this.selected = val ? [val] : [];
      this.state.setFilter({ themes: this.selected });
      this.onChange(this.selected);
    });

    wrapper.appendChild(select);
    container.appendChild(wrapper);
  }

  async loadCheckboxThemeList(select) {
    await this.load();
    const allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = '选择主题';
    select.appendChild(allOpt);
    for (const theme of this.themes) {
      const opt = document.createElement('option');
      opt.value = theme;
      opt.textContent = theme;
      select.appendChild(opt);
    }
    select.addEventListener('change', () => {
      const val = select.value;
      this.selected = val ? [val] : [];
      this.state.setFilter({ themes: this.selected });
      this.onChange(this.selected);
    });
  }

  async renderCheckboxes(container) {
    await this.load();
    container.innerHTML = '';
    container.className = 'ms-filter-group';

    for (const theme of this.themes) {
      const label = document.createElement('label');
      label.style.cssText = 'font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = theme;
      cb.checked = this.selected.includes(theme);
      cb.addEventListener('change', () => {
        if (cb.checked) {
          if (!this.selected.includes(theme)) this.selected.push(theme);
        } else {
          this.selected = this.selected.filter(t => t !== theme);
        }
        this.state.setFilter({ themes: [...this.selected] });
        this.onChange(this.selected);
      });

      label.appendChild(cb);
      label.appendChild(document.createTextNode(theme));
      container.appendChild(label);
    }
  }
}
