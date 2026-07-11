import { empty } from './utils/dom.js';
import { formatDateTime } from './utils/format.js';
import { createStateMachine } from './utils/stateMachine.js';

const TYPE_COLORS = {
  media: '#4a90d9',
  copywriting: '#27ae60'
};

const TYPE_LABELS = {
  media: '素材',
  copywriting: '文案'
};

const MODE_LABELS = {
  manual: '手工',
  agent: 'Agent'
};

const STATUS_LABELS = {
  initialized: '已创建',
  generating: '生成中',
  pending_review: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  scheduled: '已排期',
  published: '已发布',
  archived: '已归档'
};

export class TasksView {
  constructor({ api, state }) {
    this.api = api;
    this.state = state;
    this._sm = null;
    this._tasks = [];
    this._filterType = 'all';
    this._filterStatus = 'all';
  }

  async render(container) {
    empty(container);

    if (!this._sm) {
      this._sm = await createStateMachine(this.api);
    }

    this._injectStyles();

    const wrapper = document.createElement('div');
    wrapper.className = 'ms-tasks-view';

    const header = this._renderHeader();
    wrapper.appendChild(header);

    const filterBar = this._renderFilterBar();
    wrapper.appendChild(filterBar);

    const listArea = document.createElement('div');
    listArea.className = 'ms-tasks-list';
    listArea.id = 'media-studio-tasks-list';
    wrapper.appendChild(listArea);
    this._listEl = listArea;

    container.appendChild(wrapper);

    await this._loadAndRender();
  }

  _injectStyles() {
    const styleId = 'media-studio-tasks-view-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .ms-tasks-view {
        max-width: 960px;
        margin: 0 auto;
      }

      .ms-tasks-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .ms-tasks-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--ms-text-primary, #e0e0e0);
      }

      .ms-tasks-filter-bar {
        display: flex;
        gap: 12px;
        align-items: center;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .ms-tasks-filter-bar .ms-select {
        min-width: 120px;
      }

      .ms-tasks-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ms-task-card {
        background: var(--ms-bg-card, #0f3460);
        border: 1px solid var(--ms-border, #2a2a4a);
        border-radius: var(--ms-radius, 8px);
        padding: 16px;
        transition: border-color 0.2s ease;
      }

      .ms-task-card:hover {
        border-color: var(--ms-accent, #e94560);
      }

      .ms-task-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        flex-wrap: wrap;
      }

      .ms-task-type-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 600;
        color: #fff;
      }

      .ms-task-mode-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 11px;
        background: var(--ms-bg-primary, #1a1a2e);
        color: var(--ms-text-secondary, #a0a0a0);
        border: 1px solid var(--ms-border, #2a2a4a);
      }

      .ms-task-status-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 500;
        background: var(--ms-bg-primary, #1a1a2e);
        color: var(--ms-text-primary, #e0e0e0);
        border: 1px solid var(--ms-border, #2a2a4a);
        margin-left: auto;
      }

      .ms-task-brief {
        font-size: 13px;
        color: var(--ms-text-secondary, #a0a0a0);
        line-height: 1.5;
        margin-bottom: 10px;
        word-break: break-word;
      }

      .ms-task-time {
        font-size: 11px;
        color: var(--ms-text-secondary, #a0a0a0);
        margin-bottom: 10px;
      }

      .ms-task-actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .ms-task-action-btn {
        padding: 3px 10px;
        font-size: 11px;
        border: 1px solid var(--ms-border, #2a2a4a);
        border-radius: var(--ms-radius-sm, 4px);
        background: var(--ms-bg-primary, #1a1a2e);
        color: var(--ms-text-primary, #e0e0e0);
        cursor: pointer;
        transition: border-color 0.15s ease, color 0.15s ease;
        font-family: inherit;
      }

      .ms-task-action-btn:hover {
        border-color: var(--ms-accent, #e94560);
        color: var(--ms-accent, #e94560);
      }

      .ms-task-action-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* Modal / Overlay for task creation */
      .ms-task-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.6);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ms-task-modal {
        background: var(--ms-bg-secondary, #16213e);
        border: 1px solid var(--ms-border, #2a2a4a);
        border-radius: var(--ms-radius, 8px);
        width: 480px;
        max-width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
        padding: 24px;
      }

      .ms-task-modal h3 {
        margin: 0 0 20px;
        font-size: 18px;
        color: var(--ms-text-primary, #e0e0e0);
      }

      .ms-task-modal .ms-form-row {
        margin-bottom: 16px;
      }

      .ms-task-modal .ms-form-label {
        display: block;
        margin-bottom: 6px;
      }

      .ms-task-modal .ms-form-textarea {
        min-height: 120px;
      }

      .ms-task-modal-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 20px;
      }

      .ms-tasks-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px;
        color: var(--ms-text-secondary, #a0a0a0);
        gap: 8px;
      }

      .ms-tasks-empty-icon {
        font-size: 40px;
        opacity: 0.3;
      }
    `;
    document.head.appendChild(style);
  }

  _renderHeader() {
    const header = document.createElement('div');
    header.className = 'ms-tasks-header';

    const title = document.createElement('h2');
    title.textContent = '任务管理';
    header.appendChild(title);

    const createBtn = document.createElement('button');
    createBtn.className = 'ms-btn ms-btn-primary';
    createBtn.textContent = '新建任务';
    createBtn.addEventListener('click', () => this._showCreateForm());
    header.appendChild(createBtn);

    return header;
  }

  _renderFilterBar() {
    const bar = document.createElement('div');
    bar.className = 'ms-tasks-filter-bar';

    const typeSelect = document.createElement('select');
    typeSelect.className = 'ms-select';
    const typeOptions = [
      { value: 'all', label: '全部类型' },
      { value: 'media', label: '素材任务' },
      { value: 'copywriting', label: '文案任务' }
    ];
    typeOptions.forEach(opt => {
      const el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.label;
      typeSelect.appendChild(el);
    });
    typeSelect.value = this._filterType;
    typeSelect.addEventListener('change', () => {
      this._filterType = typeSelect.value;
      this._renderTaskList();
    });
    bar.appendChild(typeSelect);

    const statusSelect = document.createElement('select');
    statusSelect.className = 'ms-select';
    const statusOptions = [
      { value: 'all', label: '全部状态' },
      ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))
    ];
    statusOptions.forEach(opt => {
      const el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.label;
      statusSelect.appendChild(el);
    });
    statusSelect.value = this._filterStatus;
    statusSelect.addEventListener('change', () => {
      this._filterStatus = statusSelect.value;
      this._renderTaskList();
    });
    bar.appendChild(statusSelect);

    return bar;
  }

  async _loadAndRender() {
    try {
      this._tasks = await this.api.listTasks();
    } catch (e) {
      this._tasks = [];
    }
    this._renderTaskList();
  }

  _renderTaskList() {
    empty(this._listEl);

    let filtered = [...this._tasks];

    if (this._filterType !== 'all') {
      filtered = filtered.filter(t => t.type === this._filterType);
    }

    if (this._filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === this._filterStatus);
    }

    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (filtered.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'ms-tasks-empty';
      emptyEl.innerHTML = '<div class="ms-tasks-empty-icon">-</div><div>暂无任务</div>';
      this._listEl.appendChild(emptyEl);
      return;
    }

    for (const task of filtered) {
      const card = this._renderTaskCard(task);
      this._listEl.appendChild(card);
    }
  }

  _renderTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'ms-task-card';
    card.dataset.uuid = task.uuid;

    const header = document.createElement('div');
    header.className = 'ms-task-card-header';

    const typeColor = TYPE_COLORS[task.type] || '#888';
    const typeBadge = document.createElement('span');
    typeBadge.className = 'ms-task-type-badge';
    typeBadge.style.background = typeColor;
    typeBadge.textContent = TYPE_LABELS[task.type] || task.type;
    header.appendChild(typeBadge);

    const modeBadge = document.createElement('span');
    modeBadge.className = 'ms-task-mode-badge';
    modeBadge.textContent = MODE_LABELS[task.mode] || task.mode;
    header.appendChild(modeBadge);

    const statusBadge = document.createElement('span');
    statusBadge.className = 'ms-task-status-badge';
    statusBadge.textContent = STATUS_LABELS[task.status] || task.status;
    header.appendChild(statusBadge);

    card.appendChild(header);

    const briefEl = document.createElement('div');
    briefEl.className = 'ms-task-brief';
    briefEl.textContent = task.brief_summary || '(无简报)';
    card.appendChild(briefEl);

    const timeEl = document.createElement('div');
    timeEl.className = 'ms-task-time';
    timeEl.textContent = '创建时间: ' + formatDateTime(task.created_at);
    card.appendChild(timeEl);

    if (task.mode === 'manual') {
      const actions = document.createElement('div');
      actions.className = 'ms-task-actions';

      const nextStates = this._sm.getNextStates(task.type, task.status);
      for (const nextState of nextStates) {
        const btn = document.createElement('button');
        btn.className = 'ms-task-action-btn';
        btn.textContent = STATUS_LABELS[nextState] || nextState;
        btn.addEventListener('click', () => this._transitionTask(task.uuid, nextState));
        actions.appendChild(btn);
      }

      card.appendChild(actions);
    }

    return card;
  }

  _showCreateForm() {
    const overlay = document.createElement('div');
    overlay.className = 'ms-task-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'ms-task-modal';

    const title = document.createElement('h3');
    title.textContent = '新建任务';
    modal.appendChild(title);

    const typeRow = document.createElement('div');
    typeRow.className = 'ms-form-row';
    const typeLabel = document.createElement('label');
    typeLabel.className = 'ms-form-label';
    typeLabel.textContent = '任务类型';
    typeRow.appendChild(typeLabel);
    const typeSelect = document.createElement('select');
    typeSelect.className = 'ms-select';
    typeSelect.style.flex = '1';
    const typeOptions = [
      { value: 'media', label: '素材任务' },
      { value: 'copywriting', label: '文案任务' }
    ];
    typeOptions.forEach(opt => {
      const el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.label;
      typeSelect.appendChild(el);
    });
    typeRow.appendChild(typeSelect);
    modal.appendChild(typeRow);

    const modeRow = document.createElement('div');
    modeRow.className = 'ms-form-row';
    const modeLabel = document.createElement('label');
    modeLabel.className = 'ms-form-label';
    modeLabel.textContent = '任务模式';
    modeRow.appendChild(modeLabel);
    const modeSelect = document.createElement('select');
    modeSelect.className = 'ms-select';
    modeSelect.style.flex = '1';
    const modeOptions = [
      { value: 'manual', label: '手工' },
      { value: 'agent', label: 'Agent' }
    ];
    modeOptions.forEach(opt => {
      const el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.label;
      modeSelect.appendChild(el);
    });
    modeRow.appendChild(modeSelect);
    modal.appendChild(modeRow);

    const briefRow = document.createElement('div');
    briefRow.className = 'ms-form-row';
    briefRow.style.flexDirection = 'column';
    briefRow.style.alignItems = 'stretch';
    const briefLabel = document.createElement('label');
    briefLabel.className = 'ms-form-label';
    briefLabel.textContent = '创作简报';
    briefRow.appendChild(briefLabel);
    const briefTextarea = document.createElement('textarea');
    briefTextarea.className = 'ms-form-textarea';
    briefTextarea.placeholder = '输入任务简报内容...';
    briefRow.appendChild(briefTextarea);
    modal.appendChild(briefRow);

    const actions = document.createElement('div');
    actions.className = 'ms-task-modal-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'ms-btn';
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', () => overlay.remove());
    actions.appendChild(cancelBtn);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'ms-btn ms-btn-primary';
    submitBtn.textContent = '创建';
    submitBtn.addEventListener('click', async () => {
      submitBtn.disabled = true;
      submitBtn.textContent = '创建中...';
      try {
        await this.api.createTask(
          typeSelect.value,
          modeSelect.value,
          briefTextarea.value
        );
        overlay.remove();
        await this._loadAndRender();
      } catch (e) {
        submitBtn.disabled = false;
        submitBtn.textContent = '创建';
        alert('创建失败: ' + e.message);
      }
    });
    actions.appendChild(submitBtn);

    modal.appendChild(actions);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    briefTextarea.focus();
  }

  async _transitionTask(uuid, newStatus) {
    const note = prompt('请输入备注（可选）:', '');
    if (note === null) return;

    try {
      await this.api.updateTaskStatus(uuid, newStatus, note || '');
      await this._loadAndRender();
    } catch (e) {
      alert('状态变更失败: ' + e.message);
    }
  }
}

export default TasksView;
