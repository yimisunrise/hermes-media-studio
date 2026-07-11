import { MediaCard } from './components/MediaCard.js';
import { MediaDetail } from './components/MediaDetail.js';
import { search } from './utils/search.js';
import { createElement, empty, debounce } from './utils/dom.js';
import { changeStatus } from './utils/meta.js';

export class MediaArchive {
  constructor({ api, state }) {
    this.api = api;
    this.state = state;
    this.mediaCard = new MediaCard(api, state);
    this.currentPath = 'archive';
    this._isTrashMode = false;
  }

  async render(container) {
    empty(container);

    const header = document.createElement('div');
    header.className = 'ms-toolbar';
    const title = document.createElement('span');
    title.style.fontWeight = '600';
    title.textContent = '🗂 素材库';
    header.appendChild(title);

    this._trashBtn = document.createElement('button');
    this._trashBtn.className = 'ms-btn ms-btn-sm';
    this._trashBtn.textContent = '🗑 回收站';
    this._trashBtn.addEventListener('click', () => this._toggleTrashMode());
    header.appendChild(this._trashBtn);

    const searchRow = document.createElement('div');
    searchRow.className = 'ms-search-bar';

    const searchInput = document.createElement('input');
    searchInput.className = 'ms-input ms-input-search';
    searchInput.type = 'text';
    searchInput.placeholder = '搜索素材 (关键词/主题/标签)...';
    searchInput.style.flex = '1';

    const searchBtn = document.createElement('button');
    searchBtn.className = 'ms-btn ms-btn-sm';
    searchBtn.textContent = '搜索';
    searchBtn.addEventListener('click', () => this._doSearch(searchInput.value));
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._doSearch(searchInput.value);
    });

    searchRow.appendChild(searchInput);
    searchRow.appendChild(searchBtn);
    header.appendChild(searchRow);

    const filterBar = document.createElement('div');
    filterBar.className = 'ms-filter-bar';

    const themeFilter = document.createElement('input');
    themeFilter.className = 'ms-input';
    themeFilter.placeholder = '主题筛选';
    themeFilter.style.width = '120px';
    filterBar.appendChild(themeFilter);

    const dateFrom = document.createElement('input');
    dateFrom.type = 'date';
    dateFrom.className = 'ms-input';
    dateFrom.style.width = '140px';
    filterBar.appendChild(dateFrom);

    const dateTo = document.createElement('input');
    dateTo.type = 'date';
    dateTo.className = 'ms-input';
    dateTo.style.width = '140px';
    filterBar.appendChild(dateTo);

    header.appendChild(filterBar);
    container.appendChild(header);

    this._mainEl = document.createElement('div');
    container.appendChild(this._mainEl);

    await this._browseArchive();
  }

  async _browseArchive(path = '') {
    if (!this._mainEl) return;
    empty(this._mainEl);

    try {
      const data = await this.api.tree(this.currentPath + (path ? '/' + path : ''));
      const entries = Array.isArray(data) ? data : (data.children || data.files || []);
      const dirs = entries.filter(e => e.type === 'directory' || e.isDirectory);
      const files = entries.filter(e => e.type !== 'directory' && !e.isDirectory && !e.name.endsWith('.meta.json'));

      if (dirs.length === 0 && files.length === 0) {
        this._mainEl.innerHTML = '<div class="ms-empty"><div class="ms-empty-icon">📁</div><div>素材库为空</div></div>';
        return;
      }

      if (dirs.length > 0) {
        const grid = document.createElement('div');
        grid.className = 'ms-review-grid';
        for (const dir of dirs) {
          const card = document.createElement('div');
          card.className = 'ms-media-card';
          card.style.padding = '24px';
          card.style.textAlign = 'center';
          card.innerHTML = `
            <div style="font-size:32px;margin-bottom:8px">📁</div>
            <div style="font-size:14px;font-weight:600">${dir.name}</div>
          `;
          card.addEventListener('click', () => this._browseArchive(dir.name));
          grid.appendChild(card);
        }
        this._mainEl.appendChild(grid);
      }

      if (files.length > 0) {
        const grid = document.createElement('div');
        grid.className = 'ms-review-grid';
        for (const file of files) {
          const asset = { name: file.name, path: `${this.currentPath}/${path ? path + '/' : ''}${file.name}`, meta: null };
          try {
            asset.meta = await this.api.readJSON(asset.path + '.meta.json');
          } catch { /* no meta */ }
          const card = this.mediaCard.render(asset, { compact: true, showCheckbox: false });
          card.addEventListener('click', () => {
            const detail = new MediaDetail(this.api, this.state);
            detail.show(asset);
          });
          grid.appendChild(card);
        }
        this._mainEl.appendChild(grid);
      }
    } catch (e) {
      this._mainEl.innerHTML = `<div class="ms-empty"><div class="ms-empty-icon">⚠</div><div>加载失败: ${e.message}</div></div>`;
    }
  }

  async _doSearch(query) {
    if (!this._mainEl) return;
    empty(this._mainEl);

    if (!query.trim()) {
      await this._browseArchive();
      return;
    }

    try {
      const results = await search(this.api, query);
      if (results.length === 0) {
        this._mainEl.innerHTML = '<div class="ms-empty"><div class="ms-empty-icon">🔍</div><div>未找到匹配素材</div></div>';
        return;
      }

      const grid = document.createElement('div');
      grid.className = 'ms-search-results';
      for (const asset of results) {
        const card = document.createElement('div');
        card.className = 'ms-media-card';
        card.style.padding = '12px';
        card.innerHTML = `
          <div style="font-weight:600;font-size:13px">${asset.filename}</div>
          <div style="font-size:11px;color:var(--ms-text-secondary);margin-top:4px">
            主题: ${asset.theme || '-'} | 状态: ${asset.status || '-'}
          </div>
          ${asset.prompt ? `<div style="font-size:11px;color:var(--ms-text-secondary);margin-top:2px">${asset.prompt.slice(0, 80)}...</div>` : ''}
        `;
        grid.appendChild(card);
      }
      this._mainEl.appendChild(grid);
    } catch (e) {
      this._mainEl.innerHTML = `<div class="ms-empty"><div class="ms-empty-icon">⚠</div><div>搜索失败: ${e.message}</div></div>`;
    }
  }

  _toggleTrashMode() {
    this._isTrashMode = !this._isTrashMode;
    if (this._isTrashMode) {
      this._trashBtn.classList.add('active');
      this._trashBtn.style.background = 'var(--ms-accent)';
      this._trashBtn.style.color = '#fff';
      this._browseTrash();
    } else {
      this._trashBtn.classList.remove('active');
      this._trashBtn.style.background = '';
      this._trashBtn.style.color = '';
      this._browseArchive();
    }
  }

  async _browseTrash() {
    if (!this._mainEl) return;
    empty(this._mainEl);

    try {
      let entries = [];
      try {
        const data = await this.api.tree('.trash');
        entries = Array.isArray(data) ? data : (data.children || data.files || []);
      } catch {
        entries = [];
      }

      if (entries.length === 0) {
        this._mainEl.innerHTML = '<div class="ms-empty"><div class="ms-empty-icon">🗑</div><div>回收站为空</div></div>';
        return;
      }

      const notice = document.createElement('div');
      notice.style.cssText = 'padding:12px 16px;margin-bottom:16px;font-size:12px;color:var(--ms-text-secondary);background:var(--ms-surface);border-radius:8px;';
      notice.textContent = '文件将在删除 30 天后自动清理';
      this._mainEl.appendChild(notice);

      const grid = document.createElement('div');
      grid.className = 'ms-review-grid';
      for (const entry of entries) {
        const trashPath = '.trash/' + entry.name;
        let originalPath = '';
        let deletionDate = '';
        let fileSize = entry.size || '';

        try {
          const refData = await this.api.readJSON(trashPath + '.ref');
          originalPath = refData.originalPath || refData.path || '';
        } catch { /* no .ref file */ }

        try {
          const meta = await this.api.readJSON(trashPath + '.meta.json');
          deletionDate = meta.deletedAt || meta._deletedAt || meta.updatedAt || '';
          if (!fileSize && meta.size) fileSize = meta.size;
        } catch { /* no meta */ }

        if (!deletionDate) {
          const parts = entry.name.match(/(\d{4}-\d{2}-\d{2})/);
          if (parts) deletionDate = parts[1];
        }

        const card = document.createElement('div');
        card.className = 'ms-media-card';
        card.style.padding = '16px';
        card.innerHTML = `
          <div style="font-size:28px;margin-bottom:8px">📄</div>
          <div style="font-size:13px;font-weight:600;word-break:break-all">${entry.name}</div>
          ${originalPath ? `<div style="font-size:11px;color:var(--ms-text-secondary);margin-top:4px">原路径: ${originalPath}</div>` : ''}
          ${deletionDate ? `<div style="font-size:11px;color:var(--ms-text-secondary);margin-top:2px">删除时间: ${deletionDate}</div>` : ''}
          ${fileSize ? `<div style="font-size:11px;color:var(--ms-text-secondary);margin-top:2px">大小: ${this._formatSize(fileSize)}</div>` : ''}
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="ms-btn ms-btn-sm ms-btn-primary" data-action="restore" style="flex:1">恢复</button>
            <button class="ms-btn ms-btn-sm ms-btn-danger" data-action="delete" style="flex:1">永久删除</button>
          </div>
        `;

        card.querySelector('[data-action="restore"]').addEventListener('click', (e) => {
          e.stopPropagation();
          this._restoreFromTrash(originalPath, trashPath);
        });
        card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
          e.stopPropagation();
          this._permanentDelete(trashPath);
        });

        grid.appendChild(card);
      }
      this._mainEl.appendChild(grid);
    } catch (e) {
      this._mainEl.innerHTML = `<div class="ms-empty"><div class="ms-empty-icon">⚠</div><div>加载回收站失败: ${e.message}</div></div>`;
    }
  }

  async _restoreFromTrash(originalPath, trashPath) {
    try {
      const targetDir = originalPath ? originalPath.substring(0, originalPath.lastIndexOf('/')) : 'archive';
      const fileName = trashPath.split('/').pop();
      const restoredPath = targetDir + '/' + fileName;

      await this.api.rename(trashPath, restoredPath);

      try {
        await this.api.rename(trashPath + '.meta.json', restoredPath + '.meta.json');
      } catch { /* meta may not exist */ }

      try {
        await this.api.rename(trashPath + '.ref', restoredPath + '.ref');
      } catch { /* ref may not exist */ }

      await changeStatus(this.api, restoredPath, 'pending-review', '从回收站恢复');
      alert('文件已恢复');
      this._browseTrash();
    } catch (e) {
      alert('恢复失败: ' + e.message);
    }
  }

  async _permanentDelete(trashPath) {
    if (!confirm('确定要永久删除此文件？此操作不可撤销。')) return;

    try {
      await this.api.delete(trashPath);
      try { await this.api.delete(trashPath + '.meta.json'); } catch {}
      try { await this.api.delete(trashPath + '.ref'); } catch {}
      alert('文件已永久删除');
      this._browseTrash();
    } catch (e) {
      alert('删除失败: ' + e.message);
    }
  }

  _formatSize(bytes) {
    if (typeof bytes === 'string') return bytes;
    if (typeof bytes !== 'number' || isNaN(bytes)) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
}
