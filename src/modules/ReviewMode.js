import { MediaCard } from './components/MediaCard.js';
import { MediaDetail } from './components/MediaDetail.js';
import { changeStatus } from './utils/meta.js';
import { createElement, empty, qs, qsa } from './utils/dom.js';
import { formatDateTime } from './utils/format.js';

export class ReviewMode {
  constructor({ api, state }) {
    this.api = api;
    this.state = state;
    this.mediaCard = new MediaCard(api, state);
    this.pendingAssets = [];
    this.selectedIndex = -1;
    this._keyHandler = null;
    this._ensureGroupStyles();
  }

  _ensureGroupStyles() {
    if (document.getElementById('ms-review-group-styles')) return;
    const style = document.createElement('style');
    style.id = 'ms-review-group-styles';
    style.textContent = `
      .ms-group-container {
        margin-bottom: 12px;
        border: 1px solid var(--ms-border, rgba(255,255,255,0.08));
        border-radius: 8px;
        background: var(--ms-surface-alt, rgba(255,255,255,0.02));
        overflow: hidden;
      }
      .ms-group-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        cursor: pointer;
        user-select: none;
        font-size: 13px;
        color: var(--ms-text-secondary);
        transition: background 0.15s;
      }
      .ms-group-header:hover {
        background: var(--ms-surface-hover, rgba(255,255,255,0.04));
      }
      .ms-group-header-title {
        font-weight: 500;
        color: var(--ms-text-primary);
      }
      .ms-group-header .ms-group-arrow {
        transition: transform 0.2s;
        font-size: 11px;
        opacity: 0.5;
      }
      .ms-group-container.ms-group-collapsed .ms-group-arrow {
        transform: rotate(-90deg);
      }
      .ms-group-container.ms-group-collapsed .ms-group-grid {
        display: none;
      }
      .ms-group-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 0 10px 10px;
      }
      .ms-group-grid .ms-media-card {
        flex: 0 0 auto;
      }
    `;
    document.head.appendChild(style);
  }

  async render(container) {
    empty(container);

    const header = document.createElement('div');
    header.className = 'ms-review-header';
    const title = document.createElement('span');
    title.className = 'ms-review-header-title';
    title.textContent = '素材审核';
    header.appendChild(title);

    const countDisplay = document.createElement('span');
    countDisplay.id = 'ms-review-count';
    countDisplay.style.fontSize = '13px';
    countDisplay.style.color = 'var(--ms-text-secondary)';
    header.appendChild(countDisplay);
    container.appendChild(header);

    const actions = document.createElement('div');
    actions.className = 'ms-review-actions';
    const bulkActions = [
      { label: '✅ 批量通过', action: 'approve' },
      { label: '🗑 批量删除', action: 'delete' },
      { label: '⭐ 批量标星', action: 'star' },
      { label: '📅 批量加入排期', action: 'schedule' }
    ];
    for (const ba of bulkActions) {
      const btn = document.createElement('button');
      btn.className = 'ms-btn ms-btn-sm';
      btn.textContent = ba.label;
      btn.disabled = true;
      btn.id = `ms-bulk-${ba.action}`;
      btn.addEventListener('click', () => this._doBulkAction(ba.action));
      actions.appendChild(btn);
    }

    const shortcuts = document.createElement('div');
    shortcuts.className = 'ms-review-shortcuts';
    const keys = [
      { k: '1', label: '通过' },
      { k: '2', label: '删除' },
      { k: '3', label: '暂缓' },
      { k: '4', label: '标星' },
      { k: '5', label: '备注' },
      { k: '←→', label: '选择' },
      { k: 'Enter', label: '详情' }
    ];
    for (const sk of keys) {
      const span = document.createElement('span');
      span.innerHTML = `<kbd>${sk.k}</kbd> ${sk.label}`;
      shortcuts.appendChild(span);
    }
    actions.appendChild(shortcuts);
    container.appendChild(actions);

    const grid = document.createElement('div');
    grid.className = 'ms-review-grid';
    grid.id = 'ms-review-grid';
    container.appendChild(grid);

    await this._loadAndRender(grid, countDisplay);
    this._attachKeyboard(grid);
  }

  async _loadAndRender(grid, countDisplay) {
    try {
      const kanbanData = await this.api.loadKanbanData();
      this.pendingAssets = kanbanData.pending;

      if (countDisplay) {
        countDisplay.textContent = `${this.pendingAssets.length} 张待审核`;
      }

      if (this.pendingAssets.length === 0) {
        grid.innerHTML = '<div class="ms-empty"><div class="ms-empty-icon">✓</div><div>所有素材已审核完毕</div></div>';
        return;
      }

      const { groups, singletons } = this._groupAssets(this.pendingAssets);

      for (const [key, groupAssets] of groups) {
        const [workflow, seedBase] = key.split('|');
        const groupEl = this._renderGroup(groupAssets, workflow, parseInt(seedBase, 10));
        grid.appendChild(groupEl);
      }

      for (const { asset, index } of singletons) {
        const card = this.mediaCard.render(asset, { showActions: false });
        card.dataset.index = index;
        card.addEventListener('click', () => this._selectIndex(index));
        card.addEventListener('dblclick', () => this._openDetail(asset));
        grid.appendChild(card);
      }

      this._selectIndex(0);
    } catch (e) {
      grid.innerHTML = `<div class="ms-empty"><div class="ms-empty-icon">⚠</div><div>加载失败: ${e.message}</div></div>`;
    }
  }

  _groupAssets(assets) {
    const groupMap = new Map();
    const singletons = [];

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const workflow = asset.meta?.generation?.workflow;
      const seed = asset.meta?.generation?.seed;
      if (workflow != null && seed != null) {
        const seedBase = Math.floor(seed / 1000) * 1000;
        const key = `${workflow}|${seedBase}`;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key).push({ asset, index: i });
      } else {
        singletons.push({ asset, index: i });
      }
    }

    const groups = new Map();
    for (const [key, entries] of groupMap) {
      if (entries.length >= 2) {
        groups.set(key, entries);
      } else {
        singletons.push(entries[0]);
      }
    }

    singletons.sort((a, b) => a.index - b.index);

    return { groups, singletons };
  }

  _renderGroup(groupAssets, workflow, seedBase) {
    const container = document.createElement('div');
    container.className = 'ms-group-container';

    const header = document.createElement('div');
    header.className = 'ms-group-header';
    header.innerHTML = `
      <span class="ms-group-arrow">▼</span>
      <span class="ms-group-header-title">工作流: ${workflow || '未知'}</span>
      <span>种子范围: ${seedBase}-${seedBase + 999}</span>
      <span class="ms-group-count">共 ${groupAssets.length} 张相似素材</span>
    `;
    header.addEventListener('click', () => {
      container.classList.toggle('ms-group-collapsed');
    });

    const subGrid = document.createElement('div');
    subGrid.className = 'ms-group-grid';

    for (const { asset, index } of groupAssets) {
      const card = this.mediaCard.render(asset, { showActions: false });
      card.dataset.index = index;
      card.addEventListener('click', () => this._selectIndex(index));
      card.addEventListener('dblclick', () => this._openDetail(asset));
      subGrid.appendChild(card);
    }

    container.appendChild(header);
    container.appendChild(subGrid);
    return container;
  }

  _attachKeyboard(grid) {
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
    }
    this._keyHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const cards = qsa('.ms-media-card', grid);

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          this._selectIndex(Math.min(this.selectedIndex + 1, this.pendingAssets.length - 1));
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          this._selectIndex(Math.max(this.selectedIndex - 1, 0));
          break;
        case '1':
          e.preventDefault();
          this._quickAction('approved', '审核通过');
          break;
        case '2':
          e.preventDefault();
          this._quickAction('deleted', '删除');
          break;
        case '3':
          e.preventDefault();
          this._quickAction('pending-review', '暂缓');
          break;
        case '4':
          e.preventDefault();
          this._toggleStar();
          break;
        case '5':
          e.preventDefault();
          this._addNote();
          break;
        case 'Enter':
          e.preventDefault();
          if (this.pendingAssets[this.selectedIndex]) {
            this._openDetail(this.pendingAssets[this.selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          this._clearSelection();
          break;
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  }

  _selectIndex(index) {
    const grid = document.getElementById('ms-review-grid');
    if (!grid) return;
    const cards = qsa('.ms-media-card', grid);
    cards.forEach(c => c.classList.remove('selected', 'ms-selected-card'));
    this.selectedIndex = index;
    if (cards[index]) {
      cards[index].classList.add('selected', 'ms-selected-card');
      cards[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    this.state.clearSelection();
    if (this.pendingAssets[index]) {
      this.state.toggleAssetSelection(this.pendingAssets[index].path);
    }
    this._updateBulkButtons();
  }

  _clearSelection() {
    this.selectedIndex = -1;
    const grid = document.getElementById('ms-review-grid');
    if (grid) {
      qsa('.ms-media-card', grid).forEach(c => c.classList.remove('selected', 'ms-selected-card'));
    }
    this.state.clearSelection();
    this._updateBulkButtons();
  }

  async _quickAction(newStatus, note) {
    const asset = this.pendingAssets[this.selectedIndex];
    if (!asset) return;

    try {
      await changeStatus(this.api, asset.path, newStatus, note);
      this.pendingAssets.splice(this.selectedIndex, 1);
      this.selectedIndex = Math.min(this.selectedIndex, this.pendingAssets.length - 1);

      const grid = document.getElementById('ms-review-grid');
      const countEl = document.getElementById('ms-review-count');
      if (grid) {
        empty(grid);
        this._loadAndRender(grid, countEl);
      }
    } catch (e) {
      console.error('Review action failed:', e);
    }
  }

  async _toggleStar() {
    const asset = this.pendingAssets[this.selectedIndex];
    if (!asset) return;
    try {
      const { readMeta, writeMeta } = await import('./utils/meta.js');
      const meta = await readMeta(this.api, asset.path);
      if (meta) {
        meta.is_starred = !meta.is_starred;
        await writeMeta(this.api, asset.path, meta);
        const grid = document.getElementById('ms-review-grid');
        if (grid) {
          empty(grid);
          const countEl = document.getElementById('ms-review-count');
          this._loadAndRender(grid, countEl);
        }
      }
    } catch (e) {
      console.error('Toggle star failed:', e);
    }
  }

  async _addNote() {
    const asset = this.pendingAssets[this.selectedIndex];
    if (!asset) return;
    const note = prompt('添加审核备注:');
    if (!note) return;
    try {
      const { readMeta, writeMeta } = await import('./utils/meta.js');
      const meta = await readMeta(this.api, asset.path);
      if (meta) {
        meta.review = meta.review || {};
        meta.review.note = (meta.review.note || '') + (meta.review.note ? '; ' : '') + note;
        meta.review.reviewed_at = new Date().toISOString();
        await writeMeta(this.api, asset.path, meta);
      }
    } catch (e) {
      console.error('Add note failed:', e);
    }
  }

  _openDetail(asset) {
    const detail = new MediaDetail(this.api, this.state);
    detail.show(asset);
  }

  async _doBulkAction(action) {
    const selected = this.state.getKey('selectedAssets');
    if (selected.length === 0) return;

    for (const path of selected) {
      try {
        switch (action) {
          case 'approve':
            await changeStatus(this.api, path, 'approved', '批量通过');
            break;
          case 'delete':
            await changeStatus(this.api, path, 'deleted', '批量删除');
            break;
        }
      } catch (e) {
        console.error(`Bulk ${action} failed for ${path}:`, e);
      }
    }

    const grid = document.getElementById('ms-review-grid');
    const countEl = document.getElementById('ms-review-count');
    if (grid) {
      empty(grid);
      this._loadAndRender(grid, countEl);
    }
  }

  _updateBulkButtons() {
    const selected = this.state.getKey('selectedAssets');
    ['approve', 'delete', 'star', 'schedule'].forEach(action => {
      const btn = document.getElementById(`ms-bulk-${action}`);
      if (btn) btn.disabled = selected.length === 0;
    });
  }
}
