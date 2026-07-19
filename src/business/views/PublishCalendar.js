import { empty } from '../../framework/utils/dom.js';
import { scheduleRepo, packageRepo, platformRepo } from '../data/index.js';

const PLATFORM_LABELS = {
  xiaohongshu: '小红书',
  douyin: '抖音',
  bilibili: 'B站',
  weixin: '微信公众号',
  weibo: '微博'
};

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

export class PublishCalendar {
  constructor({ api, state, schemaRegistry }) {
    this.api = api;
    this.state = state;
    this._sr = schemaRegistry;

    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
  }

  _scheduleRepo() { return scheduleRepo(this.api, this._sr); }
  _packageRepo() { return packageRepo(this.api, this._sr); }
  _platformRepo() { return platformRepo(this.api, this._sr); }

  async render(container) {
    this._container = container;
    await this._buildUI();
  }

  async _buildUI() {
    empty(this._container);

    this._root = document.createElement('div');
    this._root.className = 'ms-calendar';

    const header = document.createElement('div');
    header.className = 'ms-calendar-header';

    const nav = document.createElement('div');
    nav.className = 'ms-calendar-nav';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'ms-btn ms-btn-sm';
    prevBtn.textContent = '\u2039';
    prevBtn.title = '上个月';
    prevBtn.onclick = () => this._navigateMonth(-1);
    nav.appendChild(prevBtn);

    this._monthLabel = document.createElement('span');
    this._monthLabel.style.cssText = 'font-size:15px;font-weight:600;min-width:140px;text-align:center;';
    this._monthLabel.textContent = `${this.currentYear}年${this.currentMonth + 1}月`;
    nav.appendChild(this._monthLabel);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'ms-btn ms-btn-sm';
    nextBtn.textContent = '\u203a';
    nextBtn.title = '下个月';
    nextBtn.onclick = () => this._navigateMonth(1);
    nav.appendChild(nextBtn);

    header.appendChild(nav);
    this._root.appendChild(header);

    this._grid = document.createElement('div');
    this._grid.className = 'ms-calendar-grid';

    for (const label of WEEKDAY_LABELS) {
      const wd = document.createElement('div');
      wd.className = 'ms-calendar-weekday';
      wd.textContent = label;
      this._grid.appendChild(wd);
    }

    await this._renderDays();

    this._root.appendChild(this._grid);
    this._container.appendChild(this._root);
  }

  async _navigateMonth(delta) {
    this.currentMonth += delta;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    await this._buildUI();
  }

  async _renderDays() {
    const today = new Date();
    const todayStr = _fmtDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

    const schedulesByDay = await this._loadMonthData();

    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'ms-calendar-day';

      let dayNumber, dateStr;
      let isOtherMonth = false;

      if (i < startOffset) {
        dayNumber = daysInPrevMonth - startOffset + i + 1;
        const prevMonth = this.currentMonth === 0 ? 11 : this.currentMonth - 1;
        const prevYear = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
        dateStr = _fmtDate(prevYear, prevMonth + 1, dayNumber);
        isOtherMonth = true;
      } else if (i >= startOffset + daysInMonth) {
        dayNumber = i - startOffset - daysInMonth + 1;
        const nextMonth = this.currentMonth === 11 ? 0 : this.currentMonth + 1;
        const nextYear = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
        dateStr = _fmtDate(nextYear, nextMonth + 1, dayNumber);
        isOtherMonth = true;
      } else {
        dayNumber = i - startOffset + 1;
        dateStr = _fmtDate(this.currentYear, this.currentMonth + 1, dayNumber);
      }

      if (dateStr === todayStr) {
        cell.classList.add('today');
      }
      if (isOtherMonth) {
        cell.classList.add('other-month');
      }

      const numEl = document.createElement('div');
      numEl.className = 'ms-calendar-day-number';
      numEl.textContent = dayNumber;
      cell.appendChild(numEl);

      const events = schedulesByDay[dayNumber] || [];
      for (const evt of events) {
        const evtEl = document.createElement('div');
        evtEl.className = 'ms-calendar-event';

        if (evt.status === 'completed') {
          evtEl.classList.add('published');
        } else if (evt.status === 'failed') {
          evtEl.style.cssText = 'background: var(--ms-warning, #f0ad4e); color: #fff;';
        } else if (evt.status === 'cancelled') {
          evtEl.style.cssText = 'background: var(--ms-border, #444); color: var(--ms-text-secondary, #999); text-decoration: line-through;';
        } else {
          evtEl.classList.add('scheduled');
        }

        evtEl.title = evt.label;
        evtEl.textContent = evt.label;
        evtEl.addEventListener('click', (e) => {
          e.stopPropagation();
          window.location.hash = '#publish';
        });
        cell.appendChild(evtEl);
      }

      this._grid.appendChild(cell);
    }
  }

  async _loadMonthData() {
    const schedulesByDay = {};

    try {
      const startDate = _fmtDate(this.currentYear, this.currentMonth + 1, 1);
      const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
      const endDate = _fmtDate(this.currentYear, this.currentMonth + 1, lastDay);

      const result = await this._scheduleRepo().find({
        sort: 'scheduledAt',
        filter: function (r) { return r.scheduledAt >= startDate && r.scheduledAt <= endDate; }
      });

      const schedules = result.records || [];

      if (schedules.length === 0) {
        return schedulesByDay;
      }

      const packageIds = [...new Set(schedules.map(function (s) { return s.packageId; }).filter(Boolean))];
      const platformIds = [...new Set(schedules.map(function (s) { return s.platformId; }).filter(Boolean))];

      const pkgRepo = this._packageRepo();
      const platRepo = this._platformRepo();

      const packages = {};
      for (const pid of packageIds) {
        packages[pid] = await pkgRepo.get(pid);
      }

      const platforms = {};
      for (const pid of platformIds) {
        platforms[pid] = await platRepo.get(pid);
      }

      for (const s of schedules) {
        const day = new Date(s.scheduledAt).getDate();

        if (!schedulesByDay[day]) {
          schedulesByDay[day] = [];
        }

        const pkg = packages[s.packageId];
        const plat = platforms[s.platformId];

        const pkgTitle = pkg ? (pkg.title || pkg.name || '未命名') : '未知';
        const platName = plat ? (PLATFORM_LABELS[plat.type] || plat.name || '未知平台') : '未知平台';

        schedulesByDay[day].push({
          status: s.status,
          label: pkgTitle + ' - ' + platName
        });
      }
    } catch (_e) {}

    return schedulesByDay;
  }

  destroy() {
    this._container = null;
    this._root = null;
    this._grid = null;
    this._monthLabel = null;
  }
}

function _fmtDate(year, month, day) {
  return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}
