import { createElement, empty } from '../../framework/utils/dom.js';
import { formatDate } from '../../framework/utils/format.js';

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
    this.events = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1;

    // Count assets per day from shard
    try {
      const shard = await this.api.readShard(year, month);
      if (shard && shard.assets) {
        for (const asset of shard.assets) {
          const dateStr = asset.created_at ? asset.created_at.split('T')[0] : '';
          if (dateStr) {
            const existing = this.events.find(e => e.date === dateStr);
            if (existing) {
              existing.assets = (existing.assets || 0) + 1;
            } else {
              this.events.push({ date: dateStr, assets: 1, copywritings: 0 });
            }
          }
        }
      }
    } catch { /* no shard */ }

    // Count copywriting per day from index
    try {
      const cwShard = await this.api.readJSON(`.index/copywriting/${year}/${String(month).padStart(2, '0')}/index.json`);
      if (cwShard && cwShard.items) {
        for (const item of cwShard.items) {
          const dateStr = item.created_at ? item.created_at.split('T')[0] : '';
          if (dateStr) {
            const existing = this.events.find(e => e.date === dateStr);
            if (existing) {
              existing.copywritings = (existing.copywritings || 0) + 1;
            } else {
              this.events.push({ date: dateStr, assets: 0, copywritings: 1 });
            }
          }
        }
      }
    } catch { /* no cw shard */ }
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

      const num = document.createElement('div');
      num.className = 'ms-calendar-day-number';
      num.textContent = String(day);
      dayEl.appendChild(num);

      const dayEvents = this.events.filter(e => e.date === dateStr);
      if (dayEvents.length > 0) {
        const counts = dayEvents[0];
        const tags = document.createElement('div');
        tags.className = 'ms-calendar-tags';

        if (counts.assets > 0) {
          const tag = document.createElement('span');
          tag.className = 'ms-calendar-tag ms-calendar-tag-asset';
          tag.textContent = `🖼 ${counts.assets}`;
          tags.appendChild(tag);
        }
        if (counts.copywritings > 0) {
          const tag = document.createElement('span');
          tag.className = 'ms-calendar-tag ms-calendar-tag-copy';
          tag.textContent = `📝 ${counts.copywritings}`;
          tags.appendChild(tag);
        }
        dayEl.appendChild(tags);
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

      const num = document.createElement('div');
      num.className = 'ms-calendar-day-number';
      num.textContent = String(dateObj.getDate());
      dayEl.appendChild(num);

      const dayEvents = this.events.filter(e => e.date === dateStr);
      if (dayEvents.length > 0) {
        const counts = dayEvents[0];
        const tags = document.createElement('div');
        tags.className = 'ms-calendar-tags';

        if (counts.assets > 0) {
          const tag = document.createElement('span');
          tag.className = 'ms-calendar-tag ms-calendar-tag-asset';
          tag.textContent = `🖼 ${counts.assets}`;
          tags.appendChild(tag);
        }
        if (counts.copywritings > 0) {
          const tag = document.createElement('span');
          tag.className = 'ms-calendar-tag ms-calendar-tag-copy';
          tag.textContent = `📝 ${counts.copywritings}`;
          tags.appendChild(tag);
        }
        dayEl.appendChild(tags);
      }

      grid.appendChild(dayEl);
    }

    this._gridEl.appendChild(grid);
  }

}
