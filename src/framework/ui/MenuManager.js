const ICONS = {
  production:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="5" height="4" rx="1"/><rect x="10" y="3" width="5" height="4" rx="1"/><rect x="5.5" y="9" width="5" height="4" rx="1"/><path d="M6 5h4" opacity=".4"/></svg>',
  publishing:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2h10l1 4H2l1-4z"/><path d="M2 6h12v8H2z"/><path d="M6 10h4"/></svg>',
  resources:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5l6-3 6 3-6 3-6-3z"/><path d="M2 8l6 3 6-3"/><path d="M2 11l6 3 6-3"/></svg>',
  operations:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4"/></svg>',
  kanban:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="2" width="4" height="12" rx="1"/><rect x="6" y="3" width="4" height="11" rx="1"/><rect x="11" y="1" width="4" height="13" rx="1"/></svg>',
  review:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4L6 11l-3-3"/></svg>',
  tasks:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12" rx="1"/><path d="M5 8l2 2 4-4"/></svg>',
  publish:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1v10"/><path d="M4 5l4-4 4 4"/><path d="M2 12v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2"/></svg>',
  calendar:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="11" rx="1"/><path d="M2 7h12"/><path d="M5 1v3M11 1v3"/></svg>',
  archive:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h12l-1 10H3L2 3z"/><path d="M6 7h4"/></svg>',
  copywriting:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M5 5h6M5 8h6M5 11h4"/></svg>',
  platforms:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>',
  themes:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 2a6 6 0 0 1 0 12 4 4 0 0 0 0-8"/></svg>',
  ideas:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1v2M8 13v2M1 8h2M13 8h2"/><circle cx="8" cy="8" r="5"/><path d="M6 8l1 1 3-3"/></svg>',
  topics:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h10v3H3zM3 9h6v4H3z"/><path d="M3 9h6v4H3z" opacity=".5"/></svg>',
  planning:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4l6-3 6 3v8l-6 3-6-3z"/><path d="M8 1v11"/><path d="M2 7l6 3 6-3"/></svg>',
   database:
     '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="8" cy="3.5" rx="6" ry="2"/><path d="M2 5.5v4c0 1.1 2.7 2 6 2s6-.9 6-2v-4"/><path d="M2 12.5v-7"/></svg>',
   assets:
     '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/><circle cx="11.5" cy="11.5" r="1" fill="currentColor"/></svg>',
};

export class MenuManager {
  constructor({ manifest } = {}) {
    this._panel = null;
    this._menuGroupEls = {};
    this._navigateHandler = null;
    this.manifest = manifest;
  }

  render(container, navigate) {
    this._panel = container;
    this._navigateHandler = navigate || (hash => { window.location.hash = hash; });

    const head = document.createElement('div');
    head.className = 'ms-panel-head';
    head.textContent = this.manifest.label || 'Media Studio';
    container.appendChild(head);

    const menu = document.createElement('div');
    menu.className = 'ms-menu';

    this._menuGroupEls = {};

    for (const group of (this.manifest.menuGroups || [])) {
      const groupEl = document.createElement('div');
      groupEl.className = 'ms-menu-group';
      groupEl.dataset.group = group.id;

      const header = document.createElement('button');
      header.className = 'ms-menu-group-header';
      header.innerHTML = `
        <span class="ms-menu-group-icon">${ICONS[group.iconKey] || ''}</span>
        <span class="ms-menu-group-label">${group.label}</span>
        <span class="ms-menu-chevron">▶</span>
      `;

      const body = document.createElement('div');
      body.className = 'ms-menu-group-body';

      const itemEls = {};
      for (const itemHash of group.items || []) {
        const viewDef = (this.manifest.views || []).find(v => v.hash === itemHash);
        if (!viewDef) continue;
        const itemEl = document.createElement('button');
        itemEl.className = 'ms-menu-item';
        itemEl.dataset.view = itemHash;
        itemEl.innerHTML = `
          <span class="ms-menu-item-icon">${ICONS[viewDef.iconKey] || ''}</span>
          <span>${viewDef.label}</span>
        `;
        itemEl.addEventListener('click', () => this._navigateHandler(itemHash));
        body.appendChild(itemEl);
        itemEls[itemHash] = itemEl;
      }

      header.addEventListener('click', () => {
        groupEl.classList.toggle('expanded');
      });

      groupEl.appendChild(header);
      groupEl.appendChild(body);
      menu.appendChild(groupEl);
      this._menuGroupEls[group.id] = { groupEl, itemEls };
    }

    container.appendChild(menu);
  }

  setActiveView(viewName) {
    if (!this._panel) return;
    this._panel.querySelectorAll('.ms-menu-item').forEach(el => el.classList.remove('active'));
    const activeItem = this._panel.querySelector(`.ms-menu-item[data-view="${viewName}"]`);
    if (activeItem) activeItem.classList.add('active');
    this._panel.querySelectorAll('.ms-menu-group').forEach(g => {
      const hasActive = !!g.querySelector(`.ms-menu-item[data-view="${viewName}"]`);
      g.classList.toggle('expanded', hasActive);
    });
  }

  destroy() {
    if (this._panel) this._panel.innerHTML = '';
    this._menuGroupEls = {};
    this._panel = null;
    this._navigateHandler = null;
  }
}
