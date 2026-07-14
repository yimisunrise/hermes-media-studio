import { createElement, empty } from '../../framework/utils/dom.js';

export class KanbanBoard {
  constructor({ api, state }) {
    this.api = api;
    this.state = state;
    this._sm = null;
    this._initSM();
  }

  async _initSM() {
    const { createStateMachine } = await import('../../framework/utils/stateMachine.js');
    this._sm = await createStateMachine(this.api);
  }

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
      // Ensure state machine is ready
      if (!this._sm) {
        await this._initSM();
      }

      // Load tasks from task index
      const taskIndex = await this.api.readTaskIndex();
      const tasks = (taskIndex.tasks || []).filter(t => t.status !== 'initialized');

      // Collect all kanban states across task types
      const taskTypes = this._sm.getTaskTypes();
      const columnMap = {}; // status -> { tasks: [], title: string }
      const statusLabels = {
        generating: '生成中',
        pending_review: '待审核',
        approved: '已审核',
        scheduled: '已排期',
        published: '已发布',
        rejected: '未通过'
      };

      for (const type of taskTypes) {
        const kanbanStates = this._sm.getKanbanStates(type);
        for (const state of kanbanStates) {
          if (!columnMap[state]) {
            columnMap[state] = {
              tasks: [],
              title: statusLabels[state] || state
            };
          }
        }
      }

      // Group tasks by status
      for (const task of tasks) {
        const status = task.status;
        if (columnMap[status]) {
          columnMap[status].tasks.push(task);
        }
      }

      // Render columns in order
      const columnOrder = ['generating', 'pending_review', 'approved', 'scheduled', 'published', 'rejected'];
      for (const key of columnOrder) {
        if (!columnMap[key]) continue;
        const colEl = this._renderColumn(key, columnMap[key]);
        boardEl.appendChild(colEl);
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
        const card = this._renderTaskCard(task);
        body.appendChild(card);
      }
    }

    col.appendChild(body);
    return col;
  }

  _renderTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'ms-kanban-card';
    card.dataset.uuid = task.uuid;

    // Type badge with config color
    const typeColor = this._sm ? this._sm.getColor(task.type) : '#888';
    const typeLabel = this._sm ? this._sm.getLabel(task.type) : (task.type || '未知');

    const badge = document.createElement('span');
    badge.className = 'ms-task-type-badge';
    badge.style.backgroundColor = typeColor;
    badge.textContent = typeLabel;
    card.appendChild(badge);

    // Mode badge if present
    if (task.mode) {
      const modeBadge = document.createElement('span');
      modeBadge.className = 'ms-task-mode-badge';
      modeBadge.textContent = task.mode;
      card.appendChild(modeBadge);
    }

    // Brief summary
    const summary = document.createElement('div');
    summary.className = 'ms-task-summary';
    summary.textContent = task.brief_summary || '(无摘要)';
    card.appendChild(summary);

    // Created time
    if (task.created_at) {
      const time = document.createElement('div');
      time.className = 'ms-task-time';
      const d = new Date(task.created_at);
      time.textContent = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      card.appendChild(time);
    }

    // Click to navigate to task detail
    card.addEventListener('click', () => {
      window.location.hash = `#tasks/${task.uuid}`;
    });

    return card;
  }
}
