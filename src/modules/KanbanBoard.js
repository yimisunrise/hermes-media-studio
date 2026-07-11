import { MediaCard } from './components/MediaCard.js';
import { ThemeSelector } from './components/ThemeSelector.js';
import { MediaDetail } from './components/MediaDetail.js';
import { createElement, empty, debounce } from './utils/dom.js';
import { changeStatus } from './utils/meta.js';

export class KanbanBoard {
  constructor({ api, state }) {
    this.api = api;
    this.state = state;
    this.themeSelector = new ThemeSelector(api, state, {
      onChange: () => this.refresh()
    });
    this.mediaCard = new MediaCard(api, state);
    this._debouncedSearch = debounce((q) => {
      this.state.setFilter({ search: q });
      this.refresh();
    }, 400);
  }

  async render(container) {
    container.innerHTML = '';

    const toolbar = this._renderToolbar();
    container.appendChild(toolbar);

    const board = document.createElement('div');
    board.className = 'ms-kanban';
    board.id = 'media-studio-kanban';
    container.appendChild(board);

    this._boardEl = board;

    await this.refresh();
  }

  _renderToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'ms-toolbar';

    const filterBar = document.createElement('div');
    filterBar.className = 'ms-filter-bar';
    this.themeSelector.render(filterBar);

    const dateSelect = document.createElement('select');
    dateSelect.className = 'ms-select';
    ['全部', '今天', '本周', '本月', '自定义'].forEach((label, i) => {
      const opt = document.createElement('option');
      opt.value = ['all', 'today', 'week', 'month', 'custom'][i];
      opt.textContent = label;
      dateSelect.appendChild(opt);
    });
    dateSelect.addEventListener('change', () => {
      this.state.setFilter({ dateRange: dateSelect.value });
      this.refresh();
    });
    filterBar.appendChild(dateSelect);

    toolbar.appendChild(filterBar);

    const searchInput = document.createElement('input');
    searchInput.className = 'ms-input ms-input-search';
    searchInput.type = 'text';
    searchInput.placeholder = '搜索素材...';
    searchInput.addEventListener('input', (e) => this._debouncedSearch(e.target.value));
    toolbar.appendChild(searchInput);

    const actions = document.createElement('div');
    actions.className = 'ms-toolbar-actions';

    const genBtn = document.createElement('button');
    genBtn.className = 'ms-btn ms-btn-primary ms-btn-sm';
    genBtn.textContent = '⚡ 批量生成';
    genBtn.addEventListener('click', () => {
      window.location.hash = '#generation';
    });
    actions.appendChild(genBtn);

    const pkgBtn = document.createElement('button');
    pkgBtn.className = 'ms-btn ms-btn-sm';
    pkgBtn.textContent = '📦 新建发布包';
    pkgBtn.addEventListener('click', () => {
      window.location.hash = '#package-editor';
    });
    actions.appendChild(pkgBtn);

    toolbar.appendChild(actions);
    return toolbar;
  }

  async refresh() {
    const filter = this.state.getKey('filter');
    const boardEl = this._boardEl;
    if (!boardEl) return;

    empty(boardEl);

    try {
      const kanbanData = await this.api.loadKanbanData(filter);
      this.state.setAssets(kanbanData);

      const columns = [
        { key: 'generating', title: '🔄 生成中', data: kanbanData.generating },
        { key: 'pending', title: '🔍 待审核', data: kanbanData.pending },
        { key: 'approved', title: '✅ 已审核', data: kanbanData.approved },
        { key: 'scheduled', title: '📅 排期', data: kanbanData.scheduled }
      ];

      for (const col of columns) {
        const columnEl = this._renderColumn(col);
        boardEl.appendChild(columnEl);
      }
    } catch (e) {
      boardEl.innerHTML = `<div class="ms-empty"><div class="ms-empty-icon">⚠</div><div>加载失败: ${e.message}</div></div>`;
    }
  }

  _renderColumn({ key, title, data }) {
    const col = document.createElement('div');
    col.className = 'ms-kanban-column';
    col.dataset.column = key;

    const header = document.createElement('div');
    header.className = 'ms-kanban-column-header';

    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;
    header.appendChild(titleSpan);

    const count = document.createElement('span');
    count.className = 'ms-column-count';
    count.textContent = `${data.length}`;
    header.appendChild(count);

    col.appendChild(header);

    const body = document.createElement('div');
    body.className = 'ms-kanban-column-body';
    body.dataset.column = key;

    const statusMap = {
      generating: 'generating',
      pending: 'pending-review',
      approved: 'approved',
      scheduled: 'scheduled'
    };

    body.ondragover = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    body.ondrop = async (e) => {
      e.preventDefault();
      const assetPath = e.dataTransfer.getData('text/plain');
      const targetKey = body.dataset.column;
      if (!assetPath || !targetKey) return;
      const mappedStatus = statusMap[targetKey];
      if (!mappedStatus) return;
      try {
        await changeStatus(this.api, assetPath, mappedStatus, '拖拽移动');
        await this.refresh();
      } catch (err) {
        console.error('Drag-drop status change failed:', err);
      }
    };

    if (data.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'ms-empty';
      emptyMsg.style.padding = '24px 8px';
      emptyMsg.textContent = '暂无素材';
      body.appendChild(emptyMsg);
    } else {
      for (const asset of data) {
        const card = this.mediaCard.render(asset, { compact: true });
        card.dataset.path = asset.path;
        card.draggable = true;

        card.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', asset.path);
          e.dataTransfer.effectAllowed = 'move';
          card.classList.add('ms-dragging');
        });

        card.addEventListener('dragend', () => {
          card.classList.remove('ms-dragging');
        });

        card.addEventListener('click', () => {
          this._openDetail(asset);
        });

        if (key === 'generating' && asset.meta?.generation) {
          this._appendGenerationProgress(card, asset.meta);
        }

        body.appendChild(card);
      }
    }

    col.appendChild(body);
    return col;
  }

  _appendGenerationProgress(card, meta) {
    const history = meta.status_history;
    const lastEntry = history?.[history.length - 1];
    const statusText = lastEntry?.status || 'generating';
    const changedAt = lastEntry?.changed_at || '';

    const statusLabel = {
      generating: '生成中',
      'pending-review': '待审核',
      approved: '已审核',
      scheduled: '已排期'
    }[statusText] || statusText;

    const progressMap = {
      generating: 30,
      'pending-review': 100,
      approved: 100,
      scheduled: 100
    };
    const pct = progressMap[statusText] || 50;

    const bar = document.createElement('div');
    bar.className = 'ms-progress-bar';

    const fill = document.createElement('div');
    fill.className = 'ms-progress-fill';
    fill.style.width = `${pct}%`;
    bar.appendChild(fill);

    const text = document.createElement('div');
    text.className = 'ms-progress-text';
    text.textContent = statusLabel + (changedAt ? ` · ${new Date(changedAt).toLocaleTimeString()}` : '');

    const container = document.createElement('div');
    container.className = 'ms-generation-progress';
    container.appendChild(text);
    container.appendChild(bar);

    card.appendChild(container);
  }

  _openDetail(asset) {
    const detail = new MediaDetail(this.api, this.state);
    detail.show(asset);
  }
}
