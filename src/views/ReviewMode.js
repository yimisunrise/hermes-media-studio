import { createStateMachine } from '../utils/stateMachine.js';
import { createElement, empty, qs, qsa } from '../utils/dom.js';
import { formatDateTime } from '../utils/format.js';

export class ReviewMode {
  constructor({ api, state }) {
    this.api = api;
    this.state = state;
    this.pendingTasks = [];
    this.selectedIndex = -1;
    this._keyHandler = null;
    this._sm = null;
    this._initSM();
    this._ensureStyles();
  }

  async _initSM() {
    try {
      this._sm = await createStateMachine(this.api);
    } catch {
      this._sm = null;
    }
  }

  _ensureStyles() {
    if (document.getElementById('ms-review-task-styles')) return;
    const style = document.createElement('style');
    style.id = 'ms-review-task-styles';
    style.textContent = `
      .ms-review-task-card {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 14px 16px;
        margin-bottom: 8px;
        border: 1px solid var(--ms-border, rgba(255,255,255,0.08));
        border-radius: 8px;
        background: var(--ms-surface, rgba(255,255,255,0.03));
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
      }
      .ms-review-task-card:hover {
        background: var(--ms-surface-hover, rgba(255,255,255,0.06));
      }
      .ms-review-task-card.selected {
        border-color: var(--ms-accent, #4a90d9);
        background: var(--ms-surface-active, rgba(74,144,217,0.08));
      }
      .ms-review-task-card .ms-task-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .ms-review-task-card .ms-task-type-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        color: #fff;
      }
      .ms-review-task-card .ms-task-type-badge.type-media {
        background: #4a90d9;
      }
      .ms-review-task-card .ms-task-type-badge.type-copywriting {
        background: #27ae60;
      }
      .ms-review-task-card .ms-task-mode-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        background: var(--ms-surface-alt, rgba(255,255,255,0.06));
        color: var(--ms-text-secondary);
      }
      .ms-review-task-card .ms-task-brief {
        font-size: 13px;
        color: var(--ms-text-primary);
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .ms-review-task-card .ms-task-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 12px;
        color: var(--ms-text-secondary);
      }
      .ms-review-task-card .ms-task-actions {
        display: flex;
        gap: 8px;
        margin-top: 4px;
      }
      .ms-review-task-card .ms-task-actions .ms-btn {
        padding: 4px 14px;
        font-size: 12px;
        border-radius: 4px;
        border: 1px solid var(--ms-border, rgba(255,255,255,0.12));
        background: var(--ms-surface-alt, rgba(255,255,255,0.04));
        color: var(--ms-text-primary);
        cursor: pointer;
        transition: background 0.15s;
      }
      .ms-review-task-card .ms-task-actions .ms-btn:hover {
        background: var(--ms-surface-hover, rgba(255,255,255,0.08));
      }
      .ms-review-task-card .ms-task-actions .ms-btn.btn-approve {
        border-color: #27ae60;
        color: #27ae60;
      }
      .ms-review-task-card .ms-task-actions .ms-btn.btn-approve:hover {
        background: rgba(39,174,96,0.12);
      }
      .ms-review-task-card .ms-task-actions .ms-btn.btn-reject {
        border-color: #e74c3c;
        color: #e74c3c;
      }
      .ms-review-task-card .ms-task-actions .ms-btn.btn-reject:hover {
        background: rgba(231,76,60,0.12);
      }
      .ms-review-detail-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .ms-review-detail-panel {
        width: 640px;
        max-width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
        background: var(--ms-bg, #1a1a2e);
        border: 1px solid var(--ms-border, rgba(255,255,255,0.12));
        border-radius: 12px;
        padding: 24px;
      }
      .ms-review-detail-panel h3 {
        margin: 0 0 16px;
        font-size: 16px;
        color: var(--ms-text-primary);
      }
      .ms-review-detail-panel .ms-detail-section {
        margin-bottom: 16px;
      }
      .ms-review-detail-panel .ms-detail-section .ms-detail-label {
        font-size: 12px;
        color: var(--ms-text-secondary);
        margin-bottom: 4px;
      }
      .ms-review-detail-panel .ms-detail-section .ms-detail-value {
        font-size: 13px;
        color: var(--ms-text-primary);
        white-space: pre-wrap;
        word-break: break-word;
      }
      .ms-review-detail-panel .ms-detail-close {
        margin-top: 16px;
        padding: 8px 20px;
        border-radius: 6px;
        border: 1px solid var(--ms-border, rgba(255,255,255,0.12));
        background: var(--ms-surface-alt, rgba(255,255,255,0.04));
        color: var(--ms-text-primary);
        cursor: pointer;
      }
      .ms-review-detail-panel .ms-detail-close:hover {
        background: var(--ms-surface-hover, rgba(255,255,255,0.08));
      }
    `;
    document.head.appendChild(style);
  }

  async render(container) {
    empty(container);

    const header = document.createElement('div');
    header.className = 'ms-review-header';
    const title = document.createElement('span');
    title.className = 'ms-review-header-title';
    title.textContent = '审核管理';
    header.appendChild(title);

    const countDisplay = document.createElement('span');
    countDisplay.id = 'ms-review-count';
    countDisplay.style.fontSize = '13px';
    countDisplay.style.color = 'var(--ms-text-secondary)';
    header.appendChild(countDisplay);
    container.appendChild(header);

    const actions = document.createElement('div');
    actions.className = 'ms-review-actions';

    const shortcuts = document.createElement('div');
    shortcuts.className = 'ms-review-shortcuts';
    const keys = [
      { k: '1', label: '通过' },
      { k: '2', label: '驳回' },
      { k: '\u2191\u2193', label: '选择' },
      { k: 'Enter', label: '详情' },
      { k: 'Esc', label: '取消选择' }
    ];
    for (const sk of keys) {
      const span = document.createElement('span');
      span.innerHTML = `<kbd>${sk.k}</kbd> ${sk.label}`;
      shortcuts.appendChild(span);
    }
    actions.appendChild(shortcuts);
    container.appendChild(actions);

    const list = document.createElement('div');
    list.className = 'ms-review-list';
    list.id = 'ms-review-list';
    container.appendChild(list);

    await this._loadAndRender(list, countDisplay);
    this._attachKeyboard(list);
  }

  async _loadAndRender(list, countDisplay) {
    try {
      const tasks = await this.api.listTasks();
      this.pendingTasks = tasks.filter(t => t.status === 'pending_review');

      if (countDisplay) {
        countDisplay.textContent = `${this.pendingTasks.length} 个待审核任务`;
      }

      if (this.pendingTasks.length === 0) {
        list.innerHTML = '<div class="ms-empty"><div class="ms-empty-icon">\u2713</div><div>所有任务已审核完毕</div></div>';
        return;
      }

      for (let i = 0; i < this.pendingTasks.length; i++) {
        const task = this.pendingTasks[i];
        const card = this._renderTaskCard(task, i);
        list.appendChild(card);
      }

      this._selectIndex(0);
    } catch (e) {
      list.innerHTML = `<div class="ms-empty"><div class="ms-empty-icon">\u26A0</div><div>加载失败: ${e.message}</div></div>`;
    }
  }

  _renderTaskCard(task, index) {
    const card = document.createElement('div');
    card.className = 'ms-review-task-card';
    card.dataset.index = index;

    const typeLabel = task.type === 'copywriting' ? '文案' : '素材';
    const typeClass = task.type === 'copywriting' ? 'type-copywriting' : 'type-media';

    const header = document.createElement('div');
    header.className = 'ms-task-card-header';

    const typeBadge = document.createElement('span');
    typeBadge.className = `ms-task-type-badge ${typeClass}`;
    typeBadge.textContent = typeLabel;
    header.appendChild(typeBadge);

    if (task.mode) {
      const modeBadge = document.createElement('span');
      modeBadge.className = 'ms-task-mode-badge';
      modeBadge.textContent = task.mode;
      header.appendChild(modeBadge);
    }

    card.appendChild(header);

    const brief = document.createElement('div');
    brief.className = 'ms-task-brief';
    brief.textContent = task.brief_summary || '(无摘要)';
    card.appendChild(brief);

    const meta = document.createElement('div');
    meta.className = 'ms-task-meta';
    if (task.created_at) {
      const timeSpan = document.createElement('span');
      timeSpan.textContent = `创建: ${formatDateTime(task.created_at)}`;
      meta.appendChild(timeSpan);
    }
    card.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'ms-task-actions';

    const approveBtn = document.createElement('button');
    approveBtn.className = 'ms-btn btn-approve';
    approveBtn.textContent = '通过';
    approveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._quickAction('approved', '审核通过');
    });
    actions.appendChild(approveBtn);

    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'ms-btn btn-reject';
    rejectBtn.textContent = '驳回';
    rejectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const note = prompt('驳回原因(可选):');
      this._quickAction('rejected', note || '审核驳回');
    });
    actions.appendChild(rejectBtn);

    card.appendChild(actions);

    card.addEventListener('click', () => this._selectIndex(index));
    card.addEventListener('dblclick', () => this._openDetail(task));

    return card;
  }

  _attachKeyboard(list) {
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
    }
    this._keyHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this._selectIndex(Math.min(this.selectedIndex + 1, this.pendingTasks.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          this._selectIndex(Math.max(this.selectedIndex - 1, 0));
          break;
        case '1':
          e.preventDefault();
          this._quickAction('approved', '审核通过');
          break;
        case '2':
          e.preventDefault();
          {
            const note = prompt('驳回原因(可选):');
            this._quickAction('rejected', note || '审核驳回');
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (this.pendingTasks[this.selectedIndex]) {
            this._openDetail(this.pendingTasks[this.selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          this._clearSelection();
          break;
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  }

  _selectIndex(index) {
    const list = document.getElementById('ms-review-list');
    if (!list) return;
    const cards = qsa('.ms-review-task-card', list);
    cards.forEach(c => c.classList.remove('selected'));
    this.selectedIndex = index;
    if (cards[index]) {
      cards[index].classList.add('selected');
      cards[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  _clearSelection() {
    this.selectedIndex = -1;
    const list = document.getElementById('ms-review-list');
    if (list) {
      qsa('.ms-review-task-card', list).forEach(c => c.classList.remove('selected'));
    }
  }

  async _quickAction(newStatus, note) {
    const task = this.pendingTasks[this.selectedIndex];
    if (!task) return;

    try {
      await this.api.updateTaskStatus(task.uuid, newStatus, note);
      this.pendingTasks.splice(this.selectedIndex, 1);
      this.selectedIndex = Math.min(this.selectedIndex, this.pendingTasks.length - 1);

      const list = document.getElementById('ms-review-list');
      const countEl = document.getElementById('ms-review-count');
      if (list) {
        empty(list);
        this._loadAndRender(list, countEl);
      }
    } catch (e) {
      console.error('Review action failed:', e);
    }
  }

  async _openDetail(task) {
    const overlay = document.createElement('div');
    overlay.className = 'ms-review-detail-overlay';

    const panel = document.createElement('div');
    panel.className = 'ms-review-detail-panel';

    const typeLabel = task.type === 'copywriting' ? '文案任务' : '素材任务';

    let briefContent = '';
    try {
      briefContent = await this.api.readTaskBrief(task.uuid);
    } catch {
      briefContent = '(无法读取简报)';
    }

    panel.innerHTML = `
      <h3>${typeLabel} - ${task.brief_summary || '无标题'}</h3>
      <div class="ms-detail-section">
        <div class="ms-detail-label">任务类型</div>
        <div class="ms-detail-value">${task.type === 'copywriting' ? '文案' : '素材'}</div>
      </div>
      <div class="ms-detail-section">
        <div class="ms-detail-label">模式</div>
        <div class="ms-detail-value">${task.mode || '默认'}</div>
      </div>
      <div class="ms-detail-section">
        <div class="ms-detail-label">创建时间</div>
        <div class="ms-detail-value">${formatDateTime(task.created_at)}</div>
      </div>
      <div class="ms-detail-section">
        <div class="ms-detail-label">简报内容</div>
        <div class="ms-detail-value">${this._escapeHtml(briefContent)}</div>
      </div>
      ${task.type === 'copywriting' ? `
      <div class="ms-detail-section">
        <div class="ms-detail-label">文案预览</div>
        <div class="ms-detail-value">在文案库中查看完整内容</div>
      </div>` : `
      <div class="ms-detail-section">
        <div class="ms-detail-label">预期产出</div>
        <div class="ms-detail-value">素材图片/视频</div>
      </div>`}
    `;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'ms-detail-close';
    closeBtn.textContent = '关闭';
    closeBtn.addEventListener('click', () => overlay.remove());
    panel.appendChild(closeBtn);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
