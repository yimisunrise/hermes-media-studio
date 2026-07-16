import { createElement, empty } from '../../framework/utils/dom.js';
import { taskRepo } from '../data/index.js';
import { TaskDetail } from './TaskDetail.js';

const STATUS_LABELS = {
  pending: '待处理',
  generating: '生成中',
  review: '待审核',
  approved: '已完成'
};

const COLUMN_ORDER = ['pending', 'generating', 'review', 'approved'];

const TERMINAL_STATUSES = new Set(['closed', 'archived']);

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
      const tasks = (result.records || []).filter(t => !TERMINAL_STATUSES.has(t.status));

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

    body.addEventListener('dragover', (e) => {
      e.preventDefault();
      body.classList.add('ms-kanban-column-over');
    });
    body.addEventListener('dragleave', () => {
      body.classList.remove('ms-kanban-column-over');
    });
    body.addEventListener('drop', (e) => {
      e.preventDefault();
      body.classList.remove('ms-kanban-column-over');
      const taskId = e.dataTransfer.getData('text/plain');
      const targetStatus = body.dataset.column;
      if (!taskId || !targetStatus) return;
      this._moveTask(taskId, targetStatus);
    });

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

  async _moveTask(taskId, targetStatus) {
    try {
      await this._ts().update(taskId, { status: targetStatus });
      await this.refresh();
    } catch (e) {
      console.error('[Kanban] 状态更新失败:', e);
    }
  }

  _renderTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'ms-kanban-card';
    card.dataset.id = task.id;
    card.draggable = true;

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', task.id);
      card.classList.add('ms-kanban-card-dragging');
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('ms-kanban-card-dragging');
    });

    // 标题（加粗，第一行）
    const summary = document.createElement('div');
    summary.className = 'ms-task-summary';
    summary.textContent = task.title || task.prompt || '(无摘要)';
    card.appendChild(summary);

    // 时间（灰色小字，第二行）
    if (task.createdAt) {
      const time = document.createElement('div');
      time.className = 'ms-task-time';
      const d = new Date(task.createdAt);
      time.textContent = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      card.appendChild(time);
    }

    // 底部栏：左侧标签 + 右侧操作按钮
    const footer = document.createElement('div');
    footer.className = 'ms-kanban-card-footer';

    const typeColor = task.taskType === 'copywriting' ? '#27ae60' : '#4a90d9';
    const typeLabel = task.taskType === 'copywriting' ? '文案' : '素材';
    const badge = document.createElement('span');
    badge.className = 'ms-task-type-badge';
    badge.style.backgroundColor = typeColor;
    badge.textContent = typeLabel;
    footer.appendChild(badge);

    if (task.mode) {
      const modeBadge = document.createElement('span');
      modeBadge.className = 'ms-task-mode-badge';
      modeBadge.textContent = task.mode;
      footer.appendChild(modeBadge);
    }

    // 空白填充，将按钮推到右侧
    const spacer = document.createElement('span');
    spacer.className = 'ms-card-footer-spacer';
    footer.appendChild(spacer);

    if (task.status === 'review') {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'ms-kanban-action-btn ms-kanban-close-btn';
      closeBtn.textContent = '关闭';
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._moveTask(task.id, 'closed');
      });
      footer.appendChild(closeBtn);
    }

    if (task.status === 'approved') {
      const archiveBtn = document.createElement('button');
      archiveBtn.className = 'ms-kanban-action-btn ms-kanban-archive-btn';
      archiveBtn.textContent = '归档';
      archiveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._moveTask(task.id, 'archived');
      });
      footer.appendChild(archiveBtn);
    }

    card.appendChild(footer);

    card.addEventListener('click', () => {
      TaskDetail.open(this.api, this.state, this._sr, task);
    });

    return card;
  }
}
