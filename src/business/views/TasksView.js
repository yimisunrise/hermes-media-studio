import { empty } from '../../framework/utils/dom.js';
import { formatDateTime } from '../../framework/utils/format.js';
import { taskRepo, repo, templateRepo } from '../data/index.js';
import { TaskDetail } from './TaskDetail.js';
import { AgentHandler } from '../agent/index.js';
import { Modal } from '../../framework/ui/Modal.js';

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
    const modal = new Modal({ title: '新建任务', size: 'md' });
    modal.setBody(`
      <div class="ms-form-row" style="flex-direction:column;align-items:stretch">
        <label class="ms-form-label">关联选题 *</label>
        <select class="ms-select" id="media-studio-task-create-topic"><option value="">加载中...</option></select>
      </div>
      <div class="ms-form-row">
        <label class="ms-form-label">任务类型</label>
        <select class="ms-select" style="flex:1" id="tv-type">
          <option value="media">素材任务</option>
          <option value="copywriting">文案任务</option>
        </select>
      </div>
      <div class="ms-form-row">
        <label class="ms-form-label">任务模式</label>
        <select class="ms-select" style="flex:1" id="tv-mode">
          <option value="manual">手工</option>
          <option value="agent">Agent</option>
        </select>
      </div>
      <div class="ms-form-row" style="position:relative">
        <button class="ms-btn ms-btn-sm" id="media-studio-template-selector-btn" type="button">📋 选择模板</button>
        <div class="ms-template-selector-panel" id="media-studio-template-selector-panel" style="display:none;position:absolute;top:100%;left:0;z-index:1000;min-width:280px;max-height:300px;overflow-y:auto;background:var(--bg,#1a1a2e);border:1px solid var(--border,#333);border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,0.4)">
          <div class="ms-template-selector-list" id="media-studio-template-selector-list" style="padding:8px"></div>
          <div class="ms-template-selector-clear" id="media-studio-template-selector-clear" style="padding:8px 12px;border-top:1px solid var(--border,#333);color:var(--text-secondary,#a0a0a0);cursor:pointer;font-size:12px">不使用模板</div>
        </div>
      </div>
      <div class="ms-form-row" style="flex-direction:column;align-items:stretch">
        <label class="ms-form-label">创作简报</label>
        <textarea class="ms-form-textarea" id="tv-prompt" placeholder="输入任务简报内容..."></textarea>
      </div>
    `);
    modal.setFooter(`
      <button class="ms-btn" id="tv-cancel">取消</button>
      <button class="ms-btn ms-btn-primary" id="tv-submit">创建</button>
    `);
    modal.open();

    modal.el.querySelector('#tv-cancel').onclick = () => modal.close();
    modal.el.querySelector('#tv-prompt').focus();

    const templateBtn = modal.el.querySelector('#media-studio-template-selector-btn');
    const templatePanel = modal.el.querySelector('#media-studio-template-selector-panel');
    const templateList = modal.el.querySelector('#media-studio-template-selector-list');
    const templateClear = modal.el.querySelector('#media-studio-template-selector-clear');
    const promptTextarea = modal.el.querySelector('#tv-prompt');
    const _tmplBtnInitText = templateBtn.textContent;

    const _closeTemplatePanel = () => { templatePanel.style.display = 'none'; };

    const _loadTemplates = async () => {
      if (templateList.dataset.loaded === '1') return;
      templateList.innerHTML = '<div class="ms-template-selector-loading" style="padding:8px;color:var(--text-secondary,#a0a0a0);font-size:12px">加载模板中...</div>';
      try {
        const tplRepo = await templateRepo(this.api, this._sr);
        const result = await tplRepo.find({ filter: { type: 'brief' }, sort: '-createdAt' });
        const templates = result.records || [];
        templateList.innerHTML = '';
        if (templates.length === 0) {
          templateList.innerHTML = '<div class="ms-template-selector-empty" style="padding:8px;color:var(--text-secondary,#a0a0a0);font-size:12px">暂无模板</div>';
        } else {
          for (const tpl of templates) {
            const item = document.createElement('div');
            item.className = 'ms-template-selector-item';
            item.style.cssText = 'padding:8px 12px;cursor:pointer;border-radius:2px';
            item.addEventListener('mouseenter', () => { item.style.background = 'var(--hover,#ffffff0a)'; });
            item.addEventListener('mouseleave', () => { item.style.background = ''; });
            item.addEventListener('click', () => {
              promptTextarea.value = tpl.content || '';
              templateBtn.textContent = '📋 ' + tpl.name;
              _closeTemplatePanel();
            });
            const nameEl = document.createElement('div');
            nameEl.style.cssText = 'font-size:13px;font-weight:500;color:var(--text,#e0e0e0)';
            nameEl.textContent = tpl.name;
            item.appendChild(nameEl);
            if (tpl.description) {
              const descEl = document.createElement('div');
              descEl.style.cssText = 'font-size:11px;color:var(--text-secondary,#a0a0a0);margin-top:2px';
              descEl.textContent = tpl.description;
              item.appendChild(descEl);
            }
            templateList.appendChild(item);
          }
        }
        templateList.dataset.loaded = '1';
      } catch (e) {
        templateList.innerHTML = '<div class="ms-template-selector-error" style="padding:8px;color:var(--danger,#e74c3c);font-size:12px">加载失败</div>';
      }
    };

    templateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (templatePanel.style.display === 'block') {
        _closeTemplatePanel();
        return;
      }
      _loadTemplates();
      templatePanel.style.display = 'block';
    });

    templateClear.addEventListener('click', () => {
      promptTextarea.value = '';
      templateBtn.textContent = _tmplBtnInitText;
      _closeTemplatePanel();
    });

    const _onDocClickClose = (e) => {
      if (!templatePanel.contains(e.target) && e.target !== templateBtn) {
        _closeTemplatePanel();
      }
    };
    document.addEventListener('click', _onDocClickClose);

    const topicSelect = modal.el.querySelector('#media-studio-task-create-topic');
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

    modal.el.querySelector('#tv-submit').addEventListener('click', async () => {
      const submitBtn = modal.el.querySelector('#tv-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = '创建中...';
      try {
        const topicId = topicSelect.value || '';
        if (!topicId) {
          alert('请选择关联选题');
          submitBtn.disabled = false;
          submitBtn.textContent = '创建';
          return;
        }
        const typeSelect = modal.el.querySelector('#tv-type');
        const modeSelect = modal.el.querySelector('#tv-mode');
        const promptTextarea = modal.el.querySelector('#tv-prompt');
        const record = await this._ts().create({
          topicId: topicId,
          taskType: typeSelect.value,
          mode: modeSelect.value,
          prompt: promptTextarea.value,
          title: promptTextarea.value.slice(0, 80) || '新建任务',
          status: 'pending'
        });
        modal.close();
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
  }

}

export default TasksView;
