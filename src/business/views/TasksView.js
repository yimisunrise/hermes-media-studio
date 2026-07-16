import { empty } from '../../framework/utils/dom.js';
import { formatDateTime } from '../../framework/utils/format.js';
import { taskRepo, repo } from '../data/index.js';
import { TaskDetail } from './TaskDetail.js';
import { AgentHandler } from '../agent/index.js';

const TYPE_LABELS = { media: '素材', copywriting: '文案' };
const MODE_LABELS = { manual: '手工', agent: 'Agent' };
const STATUS_LABELS = {
  pending: '待处理', generating: '生成中', review: '待审核',
  approved: '已完成', closed: '已关闭', archived: '已归档'
};

export class TasksView {
  constructor({ api, state, schemaRegistry }) {
    this.api = api;
    this.state = state;
    this._sr = schemaRegistry;
    this._tasks = [];
    this._filterType = 'all';
    this._filterStatus = 'all';
    this._showArchived = false;

    this._agentHandler = new AgentHandler({ api, schemaRegistry });
    this._agentHandler.startSync(() => this._loadAndRender());
  }

  destroy() {
    this._agentHandler.stopSync();
  }

  async render(container) {
    empty(container);
    container.appendChild(this._renderHeader());
    container.appendChild(this._renderFilterBar());

    const listArea = document.createElement('div');
    listArea.className = 'ms-panel-body';
    listArea.id = 'media-studio-tasks-list';
    container.appendChild(listArea);
    this._listEl = listArea;

    await this._loadAndRender();
  }

  _ts() { return taskRepo(this.api, this._sr); }

  _renderHeader() {
    const header = document.createElement('div');
    header.className = 'ms-panel-header';
    const title = document.createElement('span');
    title.style.cssText = 'font-weight:600;font-size:15px';
    title.textContent = '任务管理';
    header.appendChild(title);
    const createBtn = document.createElement('button');
    createBtn.className = 'ms-btn ms-btn-primary ms-btn-sm';
    createBtn.textContent = '新建任务';
    createBtn.addEventListener('click', () => this._showCreateForm());
    header.appendChild(createBtn);
    return header;
  }

  _renderFilterBar() {
    const bar = document.createElement('div');
    bar.className = 'ms-panel-filterbar';

    const typeSelect = document.createElement('select');
    typeSelect.className = 'ms-select';
    for (const [v, label] of [['all', '全类型'], ['media', '素材'], ['copywriting', '文案']]) {
      const el = document.createElement('option');
      el.value = v; el.textContent = label; typeSelect.appendChild(el);
    }
    typeSelect.value = this._filterType;
    typeSelect.addEventListener('change', () => { this._filterType = typeSelect.value; this._renderTaskList(); });
    bar.appendChild(typeSelect);

    const statusSelect = document.createElement('select');
    statusSelect.className = 'ms-select';
    for (const [v, label] of [['all', '全状态'], ...Object.entries(STATUS_LABELS)]) {
      const el = document.createElement('option');
      el.value = v; el.textContent = label; statusSelect.appendChild(el);
    }
    statusSelect.value = this._filterStatus;
    statusSelect.addEventListener('change', () => { this._filterStatus = statusSelect.value; this._renderTaskList(); });
    bar.appendChild(statusSelect);

    const archiveLabel = document.createElement('label');
    archiveLabel.className = 'ms-tasks-archive-toggle';
    archiveLabel.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:12px;color:var(--ms-text-secondary,#a0a0a0);cursor:pointer;user-select:none;flex-shrink:0;white-space:nowrap';
    const archiveCheck = document.createElement('input');
    archiveCheck.type = 'checkbox';
    archiveCheck.checked = this._showArchived;
    archiveCheck.addEventListener('change', () => {
      this._showArchived = archiveCheck.checked;
      this._renderTaskList();
    });
    archiveLabel.appendChild(archiveCheck);
    archiveLabel.appendChild(document.createTextNode('显示已归档'));
    bar.appendChild(archiveLabel);

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
    if (!this._showArchived) filtered = filtered.filter(t => t.status !== 'archived');

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
    card.className = 'ms-item-card';
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
        const record = await this._ts().create({
          topicId: topicId,
          taskType: typeSelect.value,
          mode: modeSelect.value,
          prompt: promptTextarea.value,
          title: promptTextarea.value.slice(0, 80) || '新建任务',
          status: 'pending'
        });
        overlay.remove();
        if (record.mode === 'agent') {
          this._agentHandler.submitTask(record).catch(err => {
            console.error('[TasksView] Agent 任务提交失败:', err);
          });
        }
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

}

export default TasksView;
