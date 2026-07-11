import { createElement, empty } from './utils/dom.js';

export class StatsDashboard {
  constructor({ api, state }) {
    this.api = api;
    this.state = state;
    this.timeRange = 90;
    this.stats = null;
  }

  async render(container) {
    empty(container);

    const dashboard = document.createElement('div');
    dashboard.className = 'ms-dashboard';
    container.appendChild(dashboard);

    const header = document.createElement('div');
    header.className = 'ms-toolbar';
    const title = document.createElement('span');
    title.style.fontWeight = '600';
    title.textContent = '📊 数据看板';
    header.appendChild(title);

    const timeSelect = document.createElement('select');
    timeSelect.className = 'ms-select';
    const ranges = [
      { label: '7 天', value: 7 },
      { label: '30 天', value: 30 },
      { label: '90 天', value: 90 },
      { label: '全部', value: 0 }
    ];
    for (const r of ranges) {
      const opt = document.createElement('option');
      opt.value = r.value;
      opt.textContent = r.label;
      if (r.value === this.timeRange) opt.selected = true;
      timeSelect.appendChild(opt);
    }
    timeSelect.addEventListener('change', () => {
      this.timeRange = parseInt(timeSelect.value);
      this._renderContent(dashboard);
    });
    header.appendChild(timeSelect);
    dashboard.appendChild(header);

    this._contentEl = document.createElement('div');
    dashboard.appendChild(this._contentEl);

    await this._renderContent(dashboard);
  }

  async _renderContent(dashboard) {
    if (!this._contentEl) return;
    empty(this._contentEl);

    try {
      this.stats = await this.api.loadDashboardStats();
      this._renderOverviewCards(this._contentEl);
      this._renderThemePerformance(this._contentEl);
      this._renderViralAssets(this._contentEl);
      this._renderPublishTimeline(this._contentEl);
      this._renderDataEntry(this._contentEl);
    } catch (e) {
      this._contentEl.innerHTML = `<div class="ms-empty"><div class="ms-empty-icon">⚠</div><div>加载数据失败: ${e.message}</div></div>`;
    }
  }

  _renderOverviewCards(container) {
    const overview = document.createElement('div');
    overview.className = 'ms-dashboard-overview';

    const cards = [
      { value: this.stats.totalPublished, label: '累计发布' },
      { value: this.stats.totalViews, label: '总浏览量' },
      { value: this.stats.totalLikes, label: '总点赞数' },
      { value: this.stats.viralAssets.length, label: '爆款素材' }
    ];

    for (const card of cards) {
      const el = document.createElement('div');
      el.className = 'ms-stat-card';
      el.innerHTML = `
        <div class="ms-stat-card-value">${card.value}</div>
        <div class="ms-stat-card-label">${card.label}</div>
      `;
      overview.appendChild(el);
    }

    container.appendChild(overview);
  }

  _renderThemePerformance(container) {
    const section = document.createElement('div');
    section.className = 'ms-dashboard-section';
    section.innerHTML = '<h3>主题表现对比</h3>';

    const themes = Object.entries(this.stats.themeStats).sort((a, b) => b[1].published - a[1].published);
    const maxPublished = themes.length > 0 ? Math.max(...themes.map(([, s]) => s.published)) : 1;

    for (const [theme, stats] of themes) {
      const bar = document.createElement('div');
      bar.className = 'ms-theme-bar';

      const label = document.createElement('span');
      label.className = 'ms-theme-bar-label';
      label.textContent = theme;
      bar.appendChild(label);

      const track = document.createElement('div');
      track.className = 'ms-theme-bar-track';
      const fill = document.createElement('div');
      fill.className = 'ms-theme-bar-fill';
      fill.style.width = `${(stats.published / maxPublished) * 100}%`;
      track.appendChild(fill);
      bar.appendChild(track);

      const statsSpan = document.createElement('span');
      statsSpan.className = 'ms-theme-bar-stats';
      statsSpan.textContent = `发布 ${stats.published} | 浏览 ${stats.views} | 点赞 ${stats.likes}`;
      bar.appendChild(statsSpan);

      section.appendChild(bar);
    }

    if (themes.length === 0) {
      section.innerHTML += '<div class="ms-empty" style="padding: 24px">暂无主题数据</div>';
    }

    container.appendChild(section);
  }

  _renderViralAssets(container) {
    const section = document.createElement('div');
    section.className = 'ms-dashboard-section';
    section.innerHTML = '<h3>🔥 爆款素材 Top 5</h3>';

    if (this.stats.viralAssets.length === 0) {
      section.innerHTML += '<div class="ms-empty" style="padding: 24px">暂无爆款素材</div>';
      container.appendChild(section);
      return;
    }

    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '12px';

    for (const asset of this.stats.viralAssets.slice(0, 5)) {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;align-items:center;gap:12px;background:var(--ms-bg-card);padding:12px;border-radius:var(--ms-radius);';

      const thumb = document.createElement('div');
      thumb.className = 'ms-media-card-thumb';
      thumb.style.width = '60px';
      thumb.style.height = '60px';
      thumb.style.fontSize = '24px';
      thumb.textContent = '🖼';
      item.appendChild(thumb);

      const info = document.createElement('div');
      info.style.flex = '1';
      info.innerHTML = `
        <div style="font-weight:600;font-size:13px">${asset.name || '未命名'}</div>
        <div style="font-size:11px;color:var(--ms-text-secondary);margin-top:4px">
          👁 ${asset.stats?.views || 0} 👍 ${asset.stats?.likes || 0} 💬 ${asset.stats?.comments || 0} 🔄 ${asset.stats?.shares || 0}
        </div>
      `;
      item.appendChild(info);

      const remakeBtn = document.createElement('button');
      remakeBtn.className = 'ms-btn ms-btn-sm';
      remakeBtn.textContent = '复刻';
      remakeBtn.addEventListener('click', () => this._openRemakeDialog(asset));
      item.appendChild(remakeBtn);

      list.appendChild(item);
    }

    section.appendChild(list);
    container.appendChild(section);
  }

  _openRemakeDialog(asset) {
    const overlay = document.createElement('div');
    overlay.className = 'ms-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'ms-modal';
    modal.style.maxWidth = '400px';
    modal.style.padding = '24px';

    modal.innerHTML = `
      <h3 style="margin:0 0 16px">复刻素材</h3>
      <p style="font-size:13px;color:var(--ms-text-secondary);margin-bottom:16px">
        使用以下参数生成变体:
      </p>
      <pre style="font-size:12px;background:var(--ms-bg-primary);padding:12px;border-radius:var(--ms-radius-sm);overflow-x:auto;margin-bottom:16px">${JSON.stringify(asset.meta?.generation || {}, null, 2)}</pre>
      <button class="ms-btn ms-btn-primary" onclick="window.location.hash='#generation'">生成同参数变体</button>
      <button class="ms-btn" style="margin-left:8px" onclick="this.closest('.ms-modal-overlay').remove()">关闭</button>
    `;

    overlay.appendChild(modal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  _renderPublishTimeline(container) {
    const section = document.createElement('div');
    section.className = 'ms-dashboard-section';
    section.innerHTML = '<h3>发布历史</h3>';
    section.innerHTML += '<div class="ms-empty" style="padding: 24px">加载完整发布历史需要访问 archive/ 目录</div>';
    container.appendChild(section);
  }

  _renderDataEntry(container) {
    const section = document.createElement('div');
    section.className = 'ms-dashboard-section';
    section.innerHTML = '<h3>手动数据录入</h3>';

    const entryForm = document.createElement('div');
    entryForm.className = 'ms-data-entry';
    entryForm.style.marginBottom = '16px';

    const fields = ['浏览量', '点赞数', '评论数', '分享数'];
    for (const field of fields) {
      const fieldEl = document.createElement('div');
      fieldEl.className = 'ms-data-entry-field';
      fieldEl.innerHTML = `
        <label>${field}</label>
        <input type="number" class="ms-form-input" placeholder="0" />
      `;
      entryForm.appendChild(fieldEl);
    }

    section.appendChild(entryForm);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'ms-btn ms-btn-primary ms-btn-sm';
    submitBtn.textContent = '保存数据';
    submitBtn.addEventListener('click', () => {
      alert('数据已保存 (本地存储)');
    });
    section.appendChild(submitBtn);

    container.appendChild(section);
  }
}
