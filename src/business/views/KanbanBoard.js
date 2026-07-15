import { createElement, empty } from '../../framework/utils/dom.js';
import { taskRepo } from '../data/index.js';

const STATUS_LABELS = {
  pending: '待处理',
  generating: '生成中',
  review: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
};

const COLUMN_ORDER = ['pending', 'generating', 'review', 'approved', 'rejected'];

export class KanbanBoard {
  constructor({ api, state, schemaRegistry }) {
    this.api = api;
    this.state = state;
    this._sr = schemaRegistry;
  }

  _ts() { return taskRepo(this.api, this._sr); }

  async render(container) {
    container.innerHTML = '';
    const board = document.createElement('div');
    board.className = 'ms-kanban';
    board.id = 'media-studio-kanban';
    container.appendChild(board);
    this._boardEl = board;
    await this.refresh();
  }

  async refresh() {
    const boardEl = this._boardEl;
    if (!boardEl) return;
    empty(boardEl);

    try {
      const result = await this._ts().find({ sort: '-createdAt' });
      const tasks = result.records || [];

      const columnMap = {};
      for (const key of COLUMN_ORDER) {
        columnMap[key] = { tasks: [], title: STATUS_LABELS[key] };
      }

      for (const task of tasks) {
        const status = task.status;
        if (columnMap[status]) {
          columnMap[status].tasks.push(task);
        }
      }

      for (const key of COLUMN_ORDER) {
        if (!columnMap[key]) continue;
        boardEl.appendChild(this._renderColumn(key, columnMap[key]));
      }
    } catch (e) {
      boardEl.innerHTML = `<div class="ms-empty"><div class="ms-empty-icon">!</div><div>加载失败: ${e.message}</div></div>`;
    }
  }

  _renderColumn(key, { tasks, title }) {
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
    count.textContent = `${tasks.length}`;
    header.appendChild(count);
    col.appendChild(header);

    const body = document.createElement('div');
    body.className = 'ms-kanban-column-body';
    body.dataset.column = key;

    if (tasks.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'ms-empty';
      emptyMsg.style.padding = '24px 8px';
      emptyMsg.textContent = '暂无任务';
      body.appendChild(emptyMsg);
    } else {
      for (const task of tasks) {
        body.appendChild(this._renderTaskCard(task));
      }
    }
    col.appendChild(body);
    return col;
  }

  _renderTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'ms-kanban-card';
    card.dataset.id = task.id;

    const typeColor = task.taskType === 'copywriting' ? '#27ae60' : '#4a90d9';
    const typeLabel = task.taskType === 'copywriting' ? '文案' : '素材';

    const badge = document.createElement('span');
    badge.className = 'ms-task-type-badge';
    badge.style.backgroundColor = typeColor;
    badge.textContent = typeLabel;
    card.appendChild(badge);

    if (task.mode) {
      const modeBadge = document.createElement('span');
      modeBadge.className = 'ms-task-mode-badge';
      modeBadge.textContent = task.mode;
      card.appendChild(modeBadge);
    }

    const summary = document.createElement('div');
    summary.className = 'ms-task-summary';
    summary.textContent = task.title || task.prompt || '(无摘要)';
    card.appendChild(summary);

    if (task.createdAt) {
      const time = document.createElement('div');
      time.className = 'ms-task-time';
      const d = new Date(task.createdAt);
      time.textContent = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      card.appendChild(time);
    }

    card.addEventListener('click', () => {
      window.location.hash = `#tasks/${task.id}`;
    });

    return card;
  }
}
