import { createElement, empty } from './utils/dom.js';
import { formatDate } from './utils/format.js';
import { changeStatus, readMeta, writeMeta } from './utils/meta.js';

export class CalendarView {
  constructor({ api, state }) {
    this.api = api;
    this.state = state;
    this.currentDate = new Date();
    this.viewMode = 'month';
    this.events = [];
  }

  async render(container) {
    empty(container);

    const calendar = document.createElement('div');
    calendar.className = 'ms-calendar';
    container.appendChild(calendar);

    await this._loadEvents();

    const header = document.createElement('div');
    header.className = 'ms-calendar-header';
    header.appendChild(this._renderNav());
    header.appendChild(this._renderViewToggle());
    calendar.appendChild(header);

    this._gridEl = document.createElement('div');
    calendar.appendChild(this._gridEl);

    this._renderGrid();
  }

  async _loadEvents() {
    try {
      const scheduledData = await this.api.loadKanbanData();
      this.events = [];

      for (const asset of scheduledData.scheduled) {
        this.events.push({
          title: asset.name,
          date: asset.meta?.created_at?.split('T')[0] || '',
          type: 'scheduled',
          path: asset.path
        });
      }

      // Also read published packages
      try {
        const published = await this.api.tree('pipeline/05-published');
        const pubEntries = Array.isArray(published) ? published : (published.children || published.files || []);
        for (const entry of pubEntries) {
          if (!entry.name.endsWith('.md')) continue;
          try {
            const content = await this.api.read(`pipeline/05-published/${entry.name}`);
            const dateMatch = content.match(/scheduled_at:\s*(.+)/);
            if (dateMatch) {
              this.events.push({
                title: entry.name.replace('.md', ''),
                date: dateMatch[1].trim().split('T')[0],
                type: 'published',
                path: `pipeline/05-published/${entry.name}`
              });
            }
          } catch { /* skip */ }
        }
      } catch { /* no published dir */ }
    } catch (e) {
      console.error('Load calendar events failed:', e);
    }
  }

  _renderNav() {
    const nav = document.createElement('div');
    nav.className = 'ms-calendar-nav';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'ms-btn ms-btn-sm';
    prevBtn.textContent = '‹';
    prevBtn.addEventListener('click', () => {
      if (this.viewMode === 'month') {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      } else {
        this.currentDate.setDate(this.currentDate.getDate() - 7);
      }
      this._renderGrid();
    });
    nav.appendChild(prevBtn);

    const title = document.createElement('span');
    title.style.fontWeight = '600';
    title.style.fontSize = '16px';
    title.id = 'ms-calendar-title';
    this._updateTitle(title);
    nav.appendChild(title);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'ms-btn ms-btn-sm';
    nextBtn.textContent = '›';
    nextBtn.addEventListener('click', () => {
      if (this.viewMode === 'month') {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      } else {
        this.currentDate.setDate(this.currentDate.getDate() + 7);
      }
      this._renderGrid();
    });
    nav.appendChild(nextBtn);

    const todayBtn = document.createElement('button');
    todayBtn.className = 'ms-btn ms-btn-sm';
    todayBtn.textContent = '今天';
    todayBtn.style.marginLeft = '8px';
    todayBtn.addEventListener('click', () => {
      this.currentDate = new Date();
      this._renderGrid();
    });
    nav.appendChild(todayBtn);

    return nav;
  }

  _renderViewToggle() {
    const toggle = document.createElement('div');
    toggle.className = 'ms-filter-group';

    const monthBtn = document.createElement('button');
    monthBtn.className = 'ms-btn ms-btn-sm';
    monthBtn.textContent = '月视图';
    monthBtn.addEventListener('click', () => {
      this.viewMode = 'month';
      this._renderGrid();
    });
    toggle.appendChild(monthBtn);

    const weekBtn = document.createElement('button');
    weekBtn.className = 'ms-btn ms-btn-sm';
    weekBtn.textContent = '周视图';
    weekBtn.addEventListener('click', () => {
      this.viewMode = 'week';
      this._renderGrid();
    });
    toggle.appendChild(weekBtn);

    return toggle;
  }

  _updateTitle(el) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1;
    if (this.viewMode === 'month') {
      el.textContent = `${year} 年 ${month} 月`;
    } else {
      const weekStart = new Date(this.currentDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      el.textContent = `${formatDate(weekStart)} ~ ${formatDate(weekEnd)}`;
    }
  }

  _renderGrid() {
    if (!this._gridEl) return;
    empty(this._gridEl);

    const title = document.getElementById('ms-calendar-title');
    if (title) this._updateTitle(title);

    if (this.viewMode === 'month') {
      this._renderMonthGrid();
    } else {
      this._renderWeekGrid();
    }
  }

  _renderMonthGrid() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const todayStr = formatDate(new Date());

    const grid = document.createElement('div');
    grid.className = 'ms-calendar-grid';
    grid.style.gridTemplateColumns = 'repeat(7, 1fr)';

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    for (const wd of weekdays) {
      const el = document.createElement('div');
      el.className = 'ms-calendar-weekday';
      el.textContent = wd;
      grid.appendChild(el);
    }

    for (let i = 0; i < startDay; i++) {
      grid.appendChild(document.createElement('div'));
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = formatDate(dateObj);
      const dayEl = document.createElement('div');
      dayEl.className = 'ms-calendar-day';
      dayEl.dataset.date = dateStr;
      if (dateStr === todayStr) dayEl.classList.add('today');

      dayEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      dayEl.addEventListener('drop', (e) => this._handleDrop(e, dateStr));

      const num = document.createElement('div');
      num.className = 'ms-calendar-day-number';
      num.textContent = String(day);
      dayEl.appendChild(num);

      const dayEvents = this.events.filter(e => e.date === dateStr);
      for (const evt of dayEvents) {
        const eventEl = document.createElement('div');
        eventEl.className = `ms-calendar-event ${evt.type}`;
        eventEl.textContent = evt.title;
        eventEl.draggable = true;
        eventEl.dataset.path = evt.path;
        eventEl.dataset.date = evt.date;
        eventEl.dataset.eventType = evt.type;
        eventEl.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', JSON.stringify({ path: evt.path, date: evt.date }));
          e.dataTransfer.effectAllowed = 'move';
        });
        if (evt.type === 'scheduled') {
          eventEl.addEventListener('dblclick', () => this._handlePublish(evt));
          eventEl.title = '双击标记已发布';
        }
        dayEl.appendChild(eventEl);
      }

      grid.appendChild(dayEl);
    }

    this._gridEl.appendChild(grid);
  }

  _renderWeekGrid() {
    const weekStart = new Date(this.currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const todayStr = formatDate(new Date());

    const grid = document.createElement('div');
    grid.className = 'ms-calendar-grid';
    grid.style.gridTemplateColumns = 'repeat(7, 1fr)';

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    for (const wd of weekdays) {
      const el = document.createElement('div');
      el.className = 'ms-calendar-weekday';
      el.textContent = wd;
      grid.appendChild(el);
    }

    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(weekStart);
      dateObj.setDate(dateObj.getDate() + i);
      const dateStr = formatDate(dateObj);
      const dayEl = document.createElement('div');
      dayEl.className = 'ms-calendar-day';
      dayEl.dataset.date = dateStr;
      if (dateStr === todayStr) dayEl.classList.add('today');

      dayEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      dayEl.addEventListener('drop', (e) => this._handleDrop(e, dateStr));

      const num = document.createElement('div');
      num.className = 'ms-calendar-day-number';
      num.textContent = String(dateObj.getDate());
      dayEl.appendChild(num);

      const dayEvents = this.events.filter(e => e.date === dateStr);
      for (const evt of dayEvents) {
        const eventEl = document.createElement('div');
        eventEl.className = `ms-calendar-event ${evt.type}`;
        eventEl.textContent = evt.title;
        eventEl.draggable = true;
        eventEl.dataset.path = evt.path;
        eventEl.dataset.date = evt.date;
        eventEl.dataset.eventType = evt.type;
        eventEl.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', JSON.stringify({ path: evt.path, date: evt.date }));
          e.dataTransfer.effectAllowed = 'move';
        });
        if (evt.type === 'scheduled') {
          eventEl.addEventListener('dblclick', () => this._handlePublish(evt));
          eventEl.title = '双击标记已发布';
        }
        dayEl.appendChild(eventEl);
      }

      grid.appendChild(dayEl);
    }

    this._gridEl.appendChild(grid);
  }

  async _handleDrop(e, targetDate) {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (!data.path || !data.date || data.date === targetDate) return;

      const content = await this.api.read(data.path);
      const updated = content.replace(/(scheduled_at:\s*).+/, `$1${targetDate}`);
      await this.api.write(data.path, updated);

      const parts = data.path.split('/');
      if (parts.length >= 3) {
        const fileName = parts.pop();
        const oldDir = parts.join('/');
        const newDir = parts.slice(0, -1).join('/') + '/' + targetDate;
        if (oldDir !== newDir) {
          try {
            await this.api.rename(data.path, `${newDir}/${fileName}`);
          } catch { /* directory may not exist, skip move */ }
        }
      }

      await this._loadEvents();
      this._renderGrid();
    } catch (err) {
      console.error('Drop handling failed:', err);
    }
  }

  async _handlePublish(evt) {
    if (evt.type !== 'scheduled') return;
    const url = prompt('请输入发布链接:');
    if (!url) return;

    try {
      const content = await this.api.read(evt.path);
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) return;

      const now = new Date().toISOString().split('T')[0];
      let frontmatter = frontmatterMatch[1];

      if (frontmatter.includes('published_url:')) {
        frontmatter = frontmatter.replace(/published_url:\s*.*/, `published_url: ${url}`);
      } else {
        frontmatter += `\npublished_url: ${url}`;
      }
      if (frontmatter.includes('published_at:')) {
        frontmatter = frontmatter.replace(/published_at:\s*.*/, `published_at: ${now}`);
      } else {
        frontmatter += `\npublished_at: ${now}`;
      }
      if (frontmatter.includes('status:')) {
        frontmatter = frontmatter.replace(/status:\s*.*/, 'status: published');
      } else {
        frontmatter += '\nstatus: published';
      }

      const updated = content.replace(/^---\n[\s\S]*?\n---/, `---\n${frontmatter}\n---`);
      const fileName = evt.path.split('/').pop();
      const newPath = `pipeline/05-published/${fileName}`;

      await this.api.write(newPath, updated);

      const assetPattern = /assets?:\s*\n((?:\s*-\s*.+\n?)+)/gi;
      let assetMatch;
      while ((assetMatch = assetPattern.exec(content)) !== null) {
        const lines = assetMatch[1].split('\n').filter(l => l.trim());
        for (const line of lines) {
          const assetPath = line.replace(/^\s*-\s*/, '').trim();
          if (!assetPath) continue;
          try {
            const meta = await readMeta(this.api, assetPath);
            if (!meta.publish_history) meta.publish_history = [];
            meta.publish_history.push({ date: now, url, package: fileName });
            await writeMeta(this.api, assetPath, meta);
          } catch { /* skip */ }
        }
      }

      try { await this.api.delete(evt.path); } catch { /* optional */ }
      await this._loadEvents();
      this._renderGrid();
    } catch (err) {
      console.error('Publish failed:', err);
    }
  }
}
