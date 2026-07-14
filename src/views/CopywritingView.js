/**
 * CopywritingView — 图文库浏览视图
 * 只读浏览：列表 → 详情，支持状态筛选、分片索引加载、简单 Markdown 渲染
 */
import { empty, createElement } from '../utils/dom.js';
import { formatDate } from '../utils/format.js';

const STATUS_CONFIG = {
  draft:         { label: '草稿',     color: '#888' },
  pending_review: { label: '待审核',  color: '#f39c12' },
  approved:      { label: '已审核',   color: '#27ae60' },
  scheduled:     { label: '已排期',   color: '#3498db' },
  published:     { label: '已发布',   color: '#1a6b3c' },
  rejected:      { label: '已拒绝',   color: '#e74c3c' }
};

const TYPE_CONFIG = {
  '标题+图文': { label: '标题+图文' },
  '描述+多图': { label: '描述+多图' },
  '单视频':    { label: '单视频' }
};

export class CopywritingView {
  constructor({ api, state }) {
    this.api = api;
    this.state = state;
    this._items = [];
    this._filtered = [];
    this._currentFilter = 'all';
    this._detailEl = null;
    this._listEl = null;
    this._countEl = null;
  }

  async render(container) {
    empty(container);

    // ── Header ──
    const header = createElement('div', { className: 'ms-toolbar' });
    const titleRow = createElement('div', {
      style: { display: 'flex', alignItems: 'center', gap: '12px' }
    });
    const title = createElement('span', {
      style: { fontWeight: '600', fontSize: '16px' }
    }, ['图文库']);
    this._countEl = createElement('span', {
      className: 'ms-count-badge',
      style: { fontSize: '12px', color: 'var(--ms-text-secondary, #999)' }
    }, ['']);
    titleRow.appendChild(title);
    titleRow.appendChild(this._countEl);
    header.appendChild(titleRow);

    // ── Filter bar ──
    const filterBar = createElement('div', {
      className: 'ms-filter-bar',
      style: { display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }
    });

    const filters = [
      { value: 'all',           label: '全部' },
      { value: 'pending_review', label: '待审核' },
      { value: 'approved',      label: '已审核' },
      { value: 'scheduled',     label: '已排期' },
      { value: 'published',     label: '已发布' }
    ];

    this._filterBtns = {};
    for (const f of filters) {
      const btn = createElement('button', {
        className: 'ms-btn ms-btn-sm ms-filter-btn',
        dataset: { filter: f.value },
        style: {
          border: '1px solid var(--ms-border, #333)',
          borderRadius: '4px',
          padding: '4px 12px',
          cursor: 'pointer',
          background: f.value === 'all' ? 'var(--ms-accent, #4a90d9)' : 'transparent',
          color: f.value === 'all' ? '#fff' : 'var(--ms-text, #ccc)'
        },
        onClick: () => this._setFilter(f.value)
      }, [f.label]);
      this._filterBtns[f.value] = btn;
      filterBar.appendChild(btn);
    }
    header.appendChild(filterBar);
    container.appendChild(header);

    // ── List area ──
    this._listEl = createElement('div', {
      className: 'ms-copywriting-list',
      style: { marginTop: '16px' }
    });
    container.appendChild(this._listEl);

    // ── Detail panel (hidden initially) ──
    this._detailEl = createElement('div', {
      className: 'ms-copywriting-detail',
      style: { display: 'none', marginTop: '16px' }
    });
    container.appendChild(this._detailEl);

    // ── Load data ──
    await this._loadData();
  }

  // ── Data loading ──

  async _loadData() {
    this._showLoading(true);

    try {
      // Try shard index first
      this._items = await this._loadFromShards();

      // Fallback: walk copywriting/ directory
      if (this._items.length === 0) {
        this._items = await this._loadFromTree();
      }

      // Enrich items with full meta + content
      await this._enrichItems();
    } catch (e) {
      console.warn('[CopywritingView] load error:', e);
    }

    this._showLoading(false);
    this._applyFilter();
  }

  async _loadFromShards() {
    const items = [];
    try {
      const manifest = await this.api.readJSON('.index/copywriting/manifest.json');
      const shards = manifest.shards || [];
      for (const shard of shards) {
        try {
          const shardData = await this.api.readJSON(
            `.index/copywriting/${shard.year}/${shard.month}/index.json`
          );
          const entries = shardData.entries || [];
          items.push(...entries);
        } catch { /* skip unreadable shard */ }
      }
    } catch { /* no manifest */ }
    return items;
  }

  async _loadFromTree() {
    const items = [];
    try {
      const years = await this.api.tree('copywriting');
      const yearEntries = this._normalizeEntries(years);
      for (const year of yearEntries) {
        if (!year.name || !/^\d{4}$/.test(year.name)) continue;
        try {
          const months = await this.api.tree(`copywriting/${year.name}`);
          const monthEntries = this._normalizeEntries(months);
          for (const month of monthEntries) {
            if (!month.name || !/^\d{2}$/.test(month.name)) continue;
            try {
              const uuids = await this.api.tree(`copywriting/${year.name}/${month.name}`);
              const uuidEntries = this._normalizeEntries(uuids);
              for (const entry of uuidEntries) {
                if (!entry.name || entry.name.startsWith('.')) continue;
                const path = `copywriting/${year.name}/${month.name}/${entry.name}`;
                items.push({
                  uuid: entry.name,
                  path,
                  created_at: `${year.name}-${month.name}-01`
                });
              }
            } catch { /* skip uuid dir */ }
          }
        } catch { /* skip month */ }
      }
    } catch { /* copywriting dir may not exist */ }
    return items;
  }

  async _enrichItems() {
    for (const item of this._items) {
      try {
        const meta = await this.api.readJSON(`${item.path}/.meta.json`);
        item.title = meta.title || item.uuid;
        item.type = meta.type || '标题+图文';
        item.status = meta.status || 'draft';
        item.tags = meta.tags || [];
        item.images = meta.images || [];
        item.created_at = meta.created_at || item.created_at;
      } catch {
        item.title = item.uuid;
        item.type = '标题+图文';
        item.status = 'draft';
        item.tags = [];
        item.images = [];
      }

      // Read first 100 chars of content.md for preview
      try {
        const content = await this.api.read(`${item.path}/content.md`);
        item._preview = content.slice(0, 100).replace(/\n/g, ' ');
        item._content = content;
      } catch {
        item._preview = '';
        item._content = '';
      }
    }
  }

  // ── Filtering ──

  _setFilter(value) {
    this._currentFilter = value;
    for (const [key, btn] of Object.entries(this._filterBtns)) {
      const isActive = key === value;
      btn.style.background = isActive ? 'var(--ms-accent, #4a90d9)' : 'transparent';
      btn.style.color = isActive ? '#fff' : 'var(--ms-text, #ccc)';
    }
    this._applyFilter();
  }

  _applyFilter() {
    if (this._currentFilter === 'all') {
      this._filtered = [...this._items];
    } else {
      this._filtered = this._items.filter(
        item => item.status === this._currentFilter
      );
    }
    this._updateCount();
    this._renderList();
  }

  _updateCount() {
    if (this._countEl) {
      this._countEl.textContent = `共 ${this._filtered.length} 篇`;
    }
  }

  // ── List rendering ──

  _renderList() {
    if (!this._listEl) return;
    empty(this._listEl);

    if (this._filtered.length === 0) {
      this._listEl.appendChild(
        createElement('div', {
          className: 'ms-empty',
          style: { textAlign: 'center', padding: '48px 0', color: 'var(--ms-text-secondary, #888)' }
        }, ['暂无图文内容'])
      );
      return;
    }

    for (const item of this._filtered) {
      const card = this._createCard(item);
      this._listEl.appendChild(card);
    }
  }

  _createCard(item) {
    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
    const typeCfg = TYPE_CONFIG[item.type] || { label: item.type };

    const card = createElement('div', {
      className: 'ms-copywriting-card',
      style: {
        background: 'var(--ms-surface, #1e1e2e)',
        border: '1px solid var(--ms-border, #333)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'border-color 0.2s'
      },
      onClick: () => this._showDetail(item)
    });

    // Top row: title + badges
    const topRow = createElement('div', {
      style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }
    });

    const titleEl = createElement('div', {
      style: { fontWeight: '600', fontSize: '14px', flex: '1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
    }, [item.title || item.uuid]);
    topRow.appendChild(titleEl);

    // Status badge
    const statusBadge = createElement('span', {
      style: {
        display: 'inline-block',
        fontSize: '11px',
        padding: '2px 8px',
        borderRadius: '10px',
        color: '#fff',
        background: statusCfg.color,
        whiteSpace: 'nowrap'
      }
    }, [statusCfg.label]);
    topRow.appendChild(statusBadge);

    // Type badge
    const typeBadge = createElement('span', {
      style: {
        display: 'inline-block',
        fontSize: '11px',
        padding: '2px 8px',
        borderRadius: '10px',
        color: 'var(--ms-text, #ccc)',
        background: 'var(--ms-bg, #2a2a3e)',
        border: '1px solid var(--ms-border, #444)',
        whiteSpace: 'nowrap'
      }
    }, [typeCfg.label]);
    topRow.appendChild(typeBadge);

    card.appendChild(topRow);

    // Date
    const dateEl = createElement('div', {
      style: { fontSize: '12px', color: 'var(--ms-text-secondary, #888)', marginBottom: '8px' }
    }, [formatDate(item.created_at)]);
    card.appendChild(dateEl);

    // Preview
    if (item._preview) {
      const previewEl = createElement('div', {
        style: {
          fontSize: '12px',
          color: 'var(--ms-text-secondary, #999)',
          lineHeight: '1.5',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: '2',
          WebkitBoxOrient: 'vertical'
        }
      }, [item._preview]);
      card.appendChild(previewEl);
    }

    // Tags
    if (item.tags && item.tags.length > 0) {
      const tagRow = createElement('div', {
        style: { display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }
      });
      for (const tag of item.tags.slice(0, 5)) {
        const tagEl = createElement('span', {
          style: {
            fontSize: '10px',
            padding: '1px 6px',
            borderRadius: '4px',
            background: 'var(--ms-surface-hover, #2a2a3e)',
            color: 'var(--ms-text-secondary, #aaa)',
            border: '1px solid var(--ms-border, #444)'
          }
        }, [tag]);
        tagRow.appendChild(tagEl);
      }
      card.appendChild(tagRow);
    }

    return card;
  }

  // ── Detail view ──

  async _showDetail(item) {
    if (!this._detailEl || !this._listEl) return;

    // Hide list, show detail
    this._listEl.style.display = 'none';
    this._detailEl.style.display = 'block';
    empty(this._detailEl);

    // Try to load full content if not already loaded
    let content = item._content || '';
    let meta = null;
    try {
      meta = await this.api.readJSON(`${item.path}/.meta.json`);
    } catch { /* use item data */ }
    if (!content) {
      try {
        content = await this.api.read(`${item.path}/content.md`);
      } catch { /* no content */ }
    }

    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;

    // ── Back button ──
    const backBtn = createElement('button', {
      className: 'ms-btn ms-btn-sm',
      style: { marginBottom: '16px', cursor: 'pointer' },
      onClick: () => this._hideDetail()
    }, ['← 返回列表']);
    this._detailEl.appendChild(backBtn);

    // ── Meta panel ──
    const metaPanel = createElement('div', {
      style: {
        background: 'var(--ms-surface, #1e1e2e)',
        border: '1px solid var(--ms-border, #333)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
      }
    });

    const metaTitle = createElement('h2', {
      style: { margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600' }
    }, [item.title || item.uuid]);
    metaPanel.appendChild(metaTitle);

    const metaGrid = createElement('div', {
      style: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: '13px' }
    });

    const addMetaRow = (label, valueEl) => {
      const labelEl = createElement('span', {
        style: { color: 'var(--ms-text-secondary, #888)', whiteSpace: 'nowrap' }
      }, [label]);
      metaGrid.appendChild(labelEl);
      metaGrid.appendChild(valueEl);
    };

    // Status
    const statusVal = createElement('span', {
      style: {
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '12px',
        background: statusCfg.color
      }
    }, [statusCfg.label]);
    addMetaRow('状态：', statusVal);

    // Type
    const typeVal = createElement('span', {}, [item.type || '-']);
    addMetaRow('类型：', typeVal);

    // Created
    const dateVal = createElement('span', {}, [formatDate(item.created_at)]);
    addMetaRow('创建时间：', dateVal);

    // UUID
    const uuidVal = createElement('span', {
      style: { fontSize: '11px', color: 'var(--ms-text-secondary, #888)', fontFamily: 'monospace' }
    }, [item.uuid]);
    addMetaRow('ID：', uuidVal);

    // Tags
    if (item.tags && item.tags.length > 0) {
      const tagsVal = createElement('div', {
        style: { display: 'flex', gap: '4px', flexWrap: 'wrap' }
      });
      for (const tag of item.tags) {
        tagsVal.appendChild(createElement('span', {
          style: {
            fontSize: '11px',
            padding: '1px 6px',
            borderRadius: '4px',
            background: 'var(--ms-surface-hover, #2a2a3e)',
            color: 'var(--ms-text-secondary, #aaa)',
            border: '1px solid var(--ms-border, #444)'
          }
        }, [tag]));
      }
      addMetaRow('标签：', tagsVal);
    }

    // Images count
    if (item.images && item.images.length > 0) {
      const imgCountVal = createElement('span', {}, [`${item.images.length} 张`]);
      addMetaRow('图片：', imgCountVal);
    }

    metaPanel.appendChild(metaGrid);
    this._detailEl.appendChild(metaPanel);

    // ── Content rendering ──
    if (content) {
      const contentSection = createElement('div', {
        style: {
          background: 'var(--ms-surface, #1e1e2e)',
          border: '1px solid var(--ms-border, #333)',
          borderRadius: '8px',
          padding: '16px',
          overflow: 'auto'
        }
      });

      const contentTitle = createElement('h3', {
        style: { margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ms-text-secondary, #888)' }
      }, ['正文内容']);
      contentSection.appendChild(contentTitle);

      const contentBody = this._renderMarkdown(content);
      contentSection.appendChild(contentBody);
      this._detailEl.appendChild(contentSection);
    }
  }

  _renderMarkdown(md) {
    const container = createElement('div', {
      className: 'ms-markdown-content',
      style: {
        fontSize: '14px',
        lineHeight: '1.7',
        color: 'var(--ms-text, #ddd)'
      }
    });

    // Split into lines and process
    const lines = md.split('\n');
    let inParagraph = false;
    let paragraphLines = [];

    const flushParagraph = () => {
      if (paragraphLines.length === 0) return;
      const text = paragraphLines.join(' ');
      if (text.trim()) {
        const p = this._renderInlineMarkdown(text, 'p');
        container.appendChild(p);
      }
      paragraphLines = [];
    };

    for (const line of lines) {
      const trimmed = line.trim();

      // Heading ##
      if (/^#{2,3}\s/.test(trimmed)) {
        flushParagraph();
        const level = trimmed.match(/^(#{2,3})/)[1].length;
        const text = trimmed.replace(/^#+\s*/, '');
        const tag = level === 2 ? 'h2' : 'h3';
        const el = this._renderInlineMarkdown(text, tag);
        el.style.margin = '16px 0 8px 0';
        el.style.fontWeight = '600';
        el.style.color = 'var(--ms-text, #eee)';
        if (tag === 'h2') el.style.fontSize = '16px';
        else el.style.fontSize = '14px';
        container.appendChild(el);
        continue;
      }

      // Empty line = paragraph break
      if (trimmed === '') {
        flushParagraph();
        continue;
      }

      paragraphLines.push(line);
    }
    flushParagraph();

    return container;
  }

  _renderInlineMarkdown(text, wrapperTag) {
    const el = document.createElement(wrapperTag);
    el.style.margin = '0 0 8px 0';

    // Process images first: ![](path)
    const parts = text.split(/(!\[.*?\]\(.*?\))/);
    for (const part of parts) {
      const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        const alt = imgMatch[1];
        const src = imgMatch[2];
        const img = document.createElement('img');
        img.alt = alt || 'image';
        // Resolve relative path — try to make it workspace-relative
        img.src = src;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '4px';
        img.style.margin = '8px 0';
        img.loading = 'lazy';
        el.appendChild(img);
        continue;
      }

      // Process bold: **text**
      const boldParts = part.split(/(\*\*.*?\*\*)/);
      for (const bp of boldParts) {
        const boldMatch = bp.match(/^\*\*(.*)\*\*$/);
        if (boldMatch) {
          const strong = document.createElement('strong');
          strong.textContent = boldMatch[1];
          el.appendChild(strong);
        } else {
          el.appendChild(document.createTextNode(bp));
        }
      }
    }

    return el;
  }

  _hideDetail() {
    if (this._detailEl) this._detailEl.style.display = 'none';
    if (this._listEl) this._listEl.style.display = 'block';
  }

  // ── Helpers ──

  _showLoading(show) {
    if (!this._listEl) return;
    if (show) {
      this._listEl.innerHTML = '<div class="ms-loading" style="text-align:center;padding:48px 0;color:var(--ms-text-secondary,#888)">加载中...</div>';
    }
  }

  _normalizeEntries(data) {
    if (Array.isArray(data)) return data;
    if (data.entries) return data.entries;
    if (data.children) return data.children;
    if (data.files) return data.files;
    return [];
  }
}
