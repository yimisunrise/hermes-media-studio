import { empty } from '../../framework/utils/dom.js';
import { formatDateTime } from '../../framework/utils/format.js';
import { taskRepo, repo } from '../data/index.js';
import { TaskDetail } from './TaskDetail.js';

const TYPE_LABELS = { media: '素材', copywriting: '文案' };
const MODE_LABELS = { manual: '手工', agent: 'Agent' };
const STATUS_LABELS = {
  pending: '待处理', generating: '生成中', review: '待审核',
  approved: '已通过', rejected: '已拒绝'
};

const NEXT_TRANSITIONS = {
  pending: ['generating'],
  generating: ['review'],
  review: ['approved', 'rejected'],
  approved: [],
  rejected: []
};

export class TasksView {
  constructor({ api, state, schemaRegistry }) {
    this.api = api;
    this.state = state;
    this._sr = schemaRegistry;
    this._tasks = [];
    this._filterType = 'all';
    this._filterStatus = 'all';
  }

  destroy() {}

  async render(container) {
    empty(container);
    this._injectStyles();

    const wrapper = document.createElement('div');
    wrapper.className = 'ms-tasks-view';

    wrapper.appendChild(this._renderHeader());
    wrapper.appendChild(this._renderFilterBar());

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
      .ms-tasks-view { max-width: 960px; margin: 0 auto; }
      .ms-tasks-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
      .ms-tasks-header h2 { margin: 0; font-size: 20px; font-weight: 600; color: var(--ms-text-primary, #e0e0e0); }
      .ms-tasks-filter-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
      .ms-tasks-filter-bar .ms-select { min-width: 120px; }
      .ms-tasks-list { display: flex; flex-direction: column; gap: 12px; }
      .ms-task-card { background: var(--ms-bg-card, #0f3460); border: 1px solid var(--ms-border, #2a2a4a); border-radius: var(--ms-radius, 8px); padding: 16px; transition: border-color 0.2s ease; }
      .ms-task-card:hover { border-color: var(--ms-accent, #e94560); }
      .ms-task-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
      .ms-task-type-badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; color: #fff; }
      .ms-task-mode-badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 11px; background: var(--ms-bg-primary, #1a1a2e); color: var(--ms-text-secondary, #a0a0a0); border: 1px solid var(--ms-border, #2a2a4a); }
      .ms-task-status-badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 500; background: var(--ms-bg-primary, #1a1a2e); color: var(--ms-text-primary, #e0e0e0); border: 1px solid var(--ms-border, #2a2a4a); margin-left: auto; }
      .ms-task-brief { font-size: 13px; color: var(--ms-text-secondary, #a0a0a0); line-height: 1.5; margin-bottom: 10px; word-break: break-word; }
      .ms-task-time { font-size: 11px; color: var(--ms-text-secondary, #a0a0a0); margin-bottom: 10px; }
      .ms-task-actions { display: flex; gap: 6px; flex-wrap: wrap; }
      .ms-task-action-btn { padding: 3px 10px; font-size: 11px; border: 1px solid var(--ms-border, #2a2a4a); border-radius: var(--ms-radius-sm, 4px); background: var(--ms-bg-primary, #1a1a2e); color: var(--ms-text-primary, #e0e0e0); cursor: pointer; transition: border-color 0.15s ease, color 0.15s ease; font-family: inherit; }
      .ms-task-action-btn:hover { border-color: var(--ms-accent, #e94560); color: var(--ms-accent, #e94560); }
      .ms-task-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .ms-task-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; align-items: center; justify-content: center; }
      .ms-task-modal { background: var(--ms-bg-secondary, #16213e); border: 1px solid var(--ms-border, #2a2a4a); border-radius: var(--ms-radius, 8px); width: 480px; max-width: 90vw; max-height: 80vh; overflow-y: auto; padding: 24px; }
      .ms-task-modal h3 { margin: 0 0 20px; font-size: 18px; color: var(--ms-text-primary, #e0e0e0); }
      .ms-task-modal .ms-form-row { margin-bottom: 16px; }
      .ms-task-modal .ms-form-label { display: block; margin-bottom: 6px; }
      .ms-task-modal .ms-form-textarea { min-height: 120px; }
      .ms-task-modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
      .ms-tasks-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; color: var(--ms-text-secondary, #a0a0a0); gap: 8px; }
      .ms-tasks-empty-icon { font-size: 40px; opacity: 0.3; }
    `;
    document.head.appendChild(style);
  }

  _ts() { return taskRepo(this.api, this._sr); }

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
    for (const [v, label] of [['all', '全部类型'], ['media', '素材任务'], ['copywriting', '文案任务']]) {
      const el = document.createElement('option');
      el.value = v; el.textContent = label; typeSelect.appendChild(el);
    }
    typeSelect.value = this._filterType;
    typeSelect.addEventListener('change', () => { this._filterType = typeSelect.value; this._renderTaskList(); });
    bar.appendChild(typeSelect);

    const statusSelect = document.createElement('select');
    statusSelect.className = 'ms-select';
    for (const [v, label] of [['all', '全部状态'], ...Object.entries(STATUS_LABELS)]) {
      const el = document.createElement('option');
      el.value = v; el.textContent = label; statusSelect.appendChild(el);
    }
    statusSelect.value = this._filterStatus;
    statusSelect.addEventListener('change', () => { this._filterStatus = statusSelect.value; this._renderTaskList(); });
    bar.appendChild(statusSelect);

    return bar;
  }

  async _loadAndRender() {
    try {
      const result = await this._ts().find({ sort: '-createdAt' });
      this._tasks = result.records || [];
    } catch (e) {
      this._tasks = [];
    }
    this._renderTaskList();
  }

  _renderTaskList() {
    empty(this._listEl);
    let filtered = [...this._tasks];
    if (this._filterType !== 'all') filtered = filtered.filter(t => t.taskType === this._filterType);
    if (this._filterStatus !== 'all') filtered = filtered.filter(t => t.status === this._filterStatus);

    if (filtered.length === 0) {
      this._listEl.innerHTML = '<div class="ms-tasks-empty"><div class="ms-tasks-empty-icon">-</div><div>暂无任务</div></div>';
      return;
    }

    for (const task of filtered) {
      this._listEl.appendChild(this._renderTaskCard(task));
    }
  }

  _renderTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'ms-task-card';
    card.dataset.id = task.id;

    const header = document.createElement('div');
    header.className = 'ms-task-card-header';

    const typeBadge = document.createElement('span');
    typeBadge.className = 'ms-task-type-badge';
    typeBadge.style.background = task.taskType === 'copywriting' ? '#27ae60' : '#4a90d9';
    typeBadge.textContent = TYPE_LABELS[task.taskType] || task.taskType;
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
    briefEl.textContent = task.title || task.prompt || '(无简报)';
    card.appendChild(briefEl);

    card.addEventListener('click', (e) => {
      if (e.target.closest('.ms-task-action-btn')) return;
      TaskDetail.open(this.api, this.state, this._sr, task);
    });

    const timeEl = document.createElement('div');
    timeEl.className = 'ms-task-time';
    timeEl.textContent = '创建时间: ' + formatDateTime(task.createdAt);
    card.appendChild(timeEl);

    const nextStates = NEXT_TRANSITIONS[task.status] || [];
    if (nextStates.length > 0) {
      const actions = document.createElement('div');
      actions.className = 'ms-task-actions';
      for (const nextState of nextStates) {
        const btn = document.createElement('button');
        btn.className = 'ms-task-action-btn';
        btn.textContent = STATUS_LABELS[nextState] || nextState;
        btn.addEventListener('click', () => this._transitionTask(task.id, nextState));
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

    const topicRow = document.createElement('div');
    topicRow.className = 'ms-form-row';
    topicRow.style.flexDirection = 'column';
    topicRow.style.alignItems = 'stretch';
    const topicLabel = document.createElement('label');
    topicLabel.className = 'ms-form-label';
    topicLabel.textContent = '关联选题 *';
    topicRow.appendChild(topicLabel);
    const topicSelect = document.createElement('select');
    topicSelect.className = 'ms-select';
    topicSelect.id = 'media-studio-task-create-topic';
    topicSelect.innerHTML = '<option value="">加载中...</option>';
    topicRow.appendChild(topicSelect);
    modal.appendChild(topicRow);
    (async () => {
      try {
        const topics = await repo(this.api, this._sr, 'topics').find({ sort: '-createdAt' });
        const list = topics.records || [];
        topicSelect.innerHTML = '<option value="">-- 请选择选题 --</option>';
        for (const t of list) {
          const opt = document.createElement('option');
          opt.value = t.id;
          opt.textContent = t.title;
          topicSelect.appendChild(opt);
        }
      } catch (e) {
        topicSelect.innerHTML = '<option value="">加载失败</option>';
      }
    })();

    const typeRow = document.createElement('div');
    typeRow.className = 'ms-form-row';
    const typeLabel = document.createElement('label');
    typeLabel.className = 'ms-form-label';
    typeLabel.textContent = '任务类型';
    typeRow.appendChild(typeLabel);
    const typeSelect = document.createElement('select');
    typeSelect.className = 'ms-select';
    typeSelect.style.flex = '1';
    for (const [v, label] of [['media', '素材任务'], ['copywriting', '文案任务']]) {
      const el = document.createElement('option');
      el.value = v; el.textContent = label; typeSelect.appendChild(el);
    }
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
    for (const [v, label] of [['manual', '手工'], ['agent', 'Agent']]) {
      const el = document.createElement('option');
      el.value = v; el.textContent = label; modeSelect.appendChild(el);
    }
    modeRow.appendChild(modeSelect);
    modal.appendChild(modeRow);

    const promptRow = document.createElement('div');
    promptRow.className = 'ms-form-row';
    promptRow.style.flexDirection = 'column';
    promptRow.style.alignItems = 'stretch';
    const promptLabel = document.createElement('label');
    promptLabel.className = 'ms-form-label';
    promptLabel.textContent = '创作简报';
    promptRow.appendChild(promptLabel);
    const promptTextarea = document.createElement('textarea');
    promptTextarea.className = 'ms-form-textarea';
    promptTextarea.placeholder = '输入任务简报内容...';
    promptRow.appendChild(promptTextarea);
    modal.appendChild(promptRow);

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
        const topicId = document.getElementById('media-studio-task-create-topic')?.value || '';
        if (!topicId) {
          alert('请选择关联选题');
          submitBtn.disabled = false;
          submitBtn.textContent = '创建';
          return;
        }
        await this._ts().create({
          topicId: topicId,
          taskType: typeSelect.value,
          mode: modeSelect.value,
          prompt: promptTextarea.value,
          title: promptTextarea.value.slice(0, 80) || '新建任务',
          status: 'pending'
        });
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
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    promptTextarea.focus();
  }

  async _transitionTask(taskId, newStatus) {
    const note = prompt('请输入备注（可选）:', '');
    if (note === null) return;
    try {
      await this._ts().update(taskId, { status: newStatus });
      await this._loadAndRender();
    } catch (e) {
      alert('状态变更失败: ' + e.message);
    }
  }
}

export default TasksView;
