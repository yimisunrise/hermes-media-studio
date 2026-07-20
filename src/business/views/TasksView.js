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

    const briefEl = document.createElement('div');
    briefEl.className = 'ms-task-brief';
    briefEl.style.cssText = 'flex:1;min-width:0;margin:0;font-weight:600;font-size:14px;';
    briefEl.textContent = task.title || task.prompt || '(无简报)';
    header.appendChild(briefEl);

    card.appendChild(header);

    card.addEventListener('click', (e) => {
      if (e.target.closest('.ms-item-card-actions')) return;
      TaskDetail.open(this.api, this.state, this._sr, task);
    });

    const bottomRow = document.createElement('div');
    bottomRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:8px;';

    const typeBadge = document.createElement('span');
    typeBadge.className = 'ms-task-type-badge';
    typeBadge.style.background = task.taskType === 'copywriting' ? '#27ae60' : '#4a90d9';
    typeBadge.textContent = TYPE_LABELS[task.taskType] || task.taskType;
    bottomRow.appendChild(typeBadge);

    const modeBadge = document.createElement('span');
    modeBadge.className = 'ms-task-mode-badge';
    modeBadge.textContent = MODE_LABELS[task.mode] || task.mode;
    bottomRow.appendChild(modeBadge);

    const statusBadge = document.createElement('span');
    statusBadge.className = 'ms-task-status-badge';
    statusBadge.textContent = STATUS_LABELS[task.status] || task.status;
    bottomRow.appendChild(statusBadge);

    const timeEl = document.createElement('span');
    timeEl.style.cssText = 'font-size:11px;color:var(--ms-text-secondary);';
    timeEl.textContent = '创建时间: ' + formatDateTime(task.createdAt);
    bottomRow.appendChild(timeEl);

    card.appendChild(bottomRow);

    const actionsEl = document.createElement('div');
    actionsEl.className = 'ms-item-card-actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'ms-btn ms-btn-sm';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', (e) => { e.stopPropagation(); this._editTask(task); });
    actionsEl.appendChild(editBtn);
    const delBtn = document.createElement('button');
    delBtn.className = 'ms-btn ms-btn-sm ms-btn-danger';
    delBtn.textContent = '删除';
    delBtn.addEventListener('click', (e) => { e.stopPropagation(); this._deleteTask(task); });
    actionsEl.appendChild(delBtn);
    card.appendChild(actionsEl);

    return card;
  }

  async _deleteTask(task) {
    const warning = task.taskType === 'media'
      ? '该任务可能已关联素材，删除后关联素材将变为孤立记录。'
      : '该任务可能已关联文稿，删除后关联文稿将变为孤立记录。';
    const m = new Modal({ size: 'sm' });
    m.setBody(`<div style="padding:20px 18px;text-align:center;">
      <div style="font-size:16px;margin-bottom:12px;">确认删除任务？</div>
      <div style="font-size:12px;color:var(--ms-text-secondary,#a0a0a0);margin-bottom:8px;">「${task.title || task.prompt || '(无简报)'}」</div>
      <div style="font-size:11px;color:var(--ms-text-secondary,#a0a0a0);padding:8px 12px;background:var(--ms-bg-primary,#1a1a2e);border-radius:4px;">${warning}</div>
    </div>`);
    m.setFooter(`<div style="display:flex;justify-content:center;gap:8px;">
      <button class="ms-btn ms-btn-sm" id="task-del-cancel">取消</button>
      <button class="ms-btn ms-btn-sm ms-btn-danger" id="task-del-confirm">确认删除</button>
    </div>`);
    m.open();
    m.el.querySelector('#task-del-cancel').onclick = () => m.close();
    m.el.querySelector('#task-del-confirm').onclick = async () => {
      try {
        await this._ts().delete(task.id);
        m.close();
        await this._loadAndRender();
      } catch (e) {
        console.error('删除任务失败', e);
      }
    };
  }

  _taskFormHTML(readonlyTypeAndMode) {
    const typeField = readonlyTypeAndMode
      ? '<span style="display:inline-block;padding:6px 12px;font-size:13px;color:var(--ms-text-secondary,#a0a0a0);background:var(--ms-bg-primary,#1a1a2e);border-radius:4px;" id="tv-form-type-val"></span>'
      : '<select class="ms-select" id="tv-form-type"><option value="media">素材任务</option><option value="copywriting">文案任务</option></select>';
    const modeField = readonlyTypeAndMode
      ? '<span style="display:inline-block;padding:6px 12px;font-size:13px;color:var(--ms-text-secondary,#a0a0a0);background:var(--ms-bg-primary,#1a1a2e);border-radius:4px;" id="tv-form-mode-val"></span>'
      : '<select class="ms-select" id="tv-form-mode"><option value="manual">手工</option><option value="agent">Agent</option></select>';

    const statusRow = readonlyTypeAndMode ? `
      <div class="ms-form-row" style="flex-direction:column;align-items:stretch">
        <label class="ms-form-label">状态</label>
        <select class="ms-select" id="tv-form-status">
          ${Object.entries(STATUS_LABELS).map(([v, label]) =>
            `<option value="${v}">${label}</option>`
          ).join('')}
        </select>
      </div>` : '';

    const promptHeader = `<div style="display:flex;justify-content:space-between;align-items:center">
          <label class="ms-form-label">创作简报</label>
          <div style="position:relative">
            <button class="ms-btn ms-btn-sm" id="tv-form-template-btn" type="button">选择模板</button>
            <div class="ms-template-selector-panel" id="tv-form-template-panel" style="display:none;position:absolute;top:100%;right:0;z-index:1000;min-width:280px;max-height:300px;overflow-y:auto;background:var(--bg,#1a1a2e);border:1px solid var(--border,#333);border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,0.4)">
              <div class="ms-template-selector-list" id="tv-form-template-list" style="padding:8px"></div>
              <div class="ms-template-selector-clear" id="tv-form-template-clear" style="padding:8px 12px;border-top:1px solid var(--border,#333);color:var(--text-secondary,#a0a0a0);cursor:pointer;font-size:12px">不使用模板</div>
            </div>
          </div>
         </div>`;

    return `
      <div class="ms-form-row" style="flex-direction:column;align-items:stretch">
        <label class="ms-form-label">标题</label>
        <input class="ms-form-input" id="tv-form-title" placeholder="输入任务标题..." />
      </div>
      <div class="ms-form-row" style="flex-direction:column;align-items:stretch">
        <label class="ms-form-label">关联选题 *</label>
        <select class="ms-select" id="tv-form-topic"><option value="">加载中...</option></select>
      </div>
      <div class="ms-form-row" style="flex-direction:column;align-items:stretch">
        <label class="ms-form-label">任务类型</label>
        ${typeField}
      </div>
      <div class="ms-form-row" style="flex-direction:column;align-items:stretch">
        <label class="ms-form-label">任务模式</label>
        ${modeField}
      </div>
      <div class="ms-form-row" style="flex-direction:column;align-items:stretch">
        ${promptHeader}
        <textarea class="ms-form-textarea" id="tv-form-prompt" placeholder="输入任务简报内容..."></textarea>
      </div>
      ${statusRow}
    `;
  }

  _loadFormTopics(selectEl, selectedId) {
    (async () => {
      try {
        const topics = await repo(this.api, this._sr, 'topics').find({ sort: '-createdAt' });
        const list = topics.records || [];
        selectEl.innerHTML = '<option value="">-- 请选择选题 --</option>';
        for (const t of list) {
          const opt = document.createElement('option');
          opt.value = t.id;
          opt.textContent = t.title;
          if (t.id === selectedId) opt.selected = true;
          selectEl.appendChild(opt);
        }
      } catch (e) {
        selectEl.innerHTML = '<option value="">加载失败</option>';
      }
    })();
  }

  _initTemplateSelector(modal) {
    const templateBtn = modal.el.querySelector('#tv-form-template-btn');
    const templatePanel = modal.el.querySelector('#tv-form-template-panel');
    const templateList = modal.el.querySelector('#tv-form-template-list');
    const templateClear = modal.el.querySelector('#tv-form-template-clear');
    const promptTextarea = modal.el.querySelector('#tv-form-prompt');
    const initBtnText = templateBtn.textContent;

    const closePanel = () => { templatePanel.style.display = 'none'; };

    const loadTemplates = async () => {
      if (templateList.dataset.loaded === '1') return;
      templateList.innerHTML = '<div style="padding:8px;color:var(--text-secondary,#a0a0a0);font-size:12px">加载模板中...</div>';
      try {
        const tplRepo = await templateRepo(this.api, this._sr);
        const result = await tplRepo.find({ filter: { type: 'brief' }, sort: '-createdAt' });
        const templates = result.records || [];
        templateList.innerHTML = '';
        if (templates.length === 0) {
          templateList.innerHTML = '<div style="padding:8px;color:var(--text-secondary,#a0a0a0);font-size:12px">暂无模板</div>';
        } else {
          for (const tpl of templates) {
            const item = document.createElement('div');
            item.style.cssText = 'padding:8px 12px;cursor:pointer;border-radius:2px';
            item.addEventListener('mouseenter', () => { item.style.background = 'var(--hover,#ffffff0a)'; });
            item.addEventListener('mouseleave', () => { item.style.background = ''; });
            item.addEventListener('click', () => {
              promptTextarea.value = tpl.content || '';
              templateBtn.textContent = '选择模板 ' + tpl.name;
              closePanel();
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
        templateList.innerHTML = '<div style="padding:8px;color:var(--danger,#e74c3c);font-size:12px">加载失败</div>';
      }
    };

    templateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (templatePanel.style.display === 'block') {
        closePanel();
        return;
      }
      loadTemplates();
      templatePanel.style.display = 'block';
    });

    templateClear.addEventListener('click', () => {
      promptTextarea.value = '';
      templateBtn.textContent = initBtnText;
      closePanel();
    });

    const onDocClick = (e) => {
      if (!templatePanel.contains(e.target) && e.target !== templateBtn) {
        closePanel();
      }
    };
    document.addEventListener('click', onDocClick);
  }

  _showCreateForm() {
    const modal = new Modal({ title: '新建任务', size: 'md' });
    modal.setBody(this._taskFormHTML(false));
    modal.setFooter(`
      <button class="ms-btn" id="tv-form-cancel">取消</button>
      <button class="ms-btn ms-btn-primary" id="tv-form-submit">创建</button>
    `);
    modal.open();

    modal.el.querySelector('#tv-form-cancel').onclick = () => modal.close();
    modal.el.querySelector('#tv-form-prompt').focus();

    this._initTemplateSelector(modal);
    this._loadFormTopics(modal.el.querySelector('#tv-form-topic'));

    modal.el.querySelector('#tv-form-submit').addEventListener('click', async () => {
      const submitBtn = modal.el.querySelector('#tv-form-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = '创建中...';
      try {
        const topicId = modal.el.querySelector('#tv-form-topic').value || '';
        if (!topicId) {
          alert('请选择关联选题');
          submitBtn.disabled = false;
          submitBtn.textContent = '创建';
          return;
        }
        const record = await this._ts().create({
          topicId,
          taskType: modal.el.querySelector('#tv-form-type').value,
          mode: modal.el.querySelector('#tv-form-mode').value,
          prompt: modal.el.querySelector('#tv-form-prompt').value.trim(),
          title: modal.el.querySelector('#tv-form-title').value.trim() || '新建任务',
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

  _editTask(task) {
    const modal = new Modal({ title: '编辑任务', size: 'md' });
    modal.setBody(this._taskFormHTML(true));
    modal.setFooter(`
      <button class="ms-btn" id="tv-form-cancel">取消</button>
      <button class="ms-btn ms-btn-primary" id="tv-form-submit">保存</button>
    `);
    modal.open();

    modal.el.querySelector('#tv-form-title').value = task.title || '';
    modal.el.querySelector('#tv-form-prompt').value = task.prompt || '';
    modal.el.querySelector('#tv-form-type-val').textContent = TYPE_LABELS[task.taskType] || task.taskType;
    modal.el.querySelector('#tv-form-mode-val').textContent = MODE_LABELS[task.mode] || task.mode;
    modal.el.querySelector('#tv-form-status').value = task.status;

    modal.el.querySelector('#tv-form-cancel').onclick = () => modal.close();
    this._initTemplateSelector(modal);
    this._loadFormTopics(modal.el.querySelector('#tv-form-topic'), task.topicId);

    modal.el.querySelector('#tv-form-submit').addEventListener('click', async () => {
      const submitBtn = modal.el.querySelector('#tv-form-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = '保存中...';
      try {
        const changes = {
          title: modal.el.querySelector('#tv-form-title').value.trim() || task.title,
          prompt: modal.el.querySelector('#tv-form-prompt').value.trim(),
          topicId: modal.el.querySelector('#tv-form-topic').value || '',
          status: modal.el.querySelector('#tv-form-status').value,
        };
        await this._ts().update(task.id, changes);
        modal.close();
        await this._loadAndRender();
      } catch (e) {
        submitBtn.disabled = false;
        submitBtn.textContent = '保存';
        alert('保存失败: ' + e.message);
      }
    });
  }

}

export default TasksView;
