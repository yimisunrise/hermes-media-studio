import { createElement, empty } from '../utils/dom.js';
import { createDefaultMeta } from '../utils/meta.js';

export class GenerationConsole {
  constructor({ api, state }) {
    this.api = api;
    this.state = state;
    this.workflows = [];
  }

  async render(container) {
    empty(container);
    await this._loadWorkflows();

    const header = document.createElement('div');
    header.className = 'ms-toolbar';
    const title = document.createElement('span');
    title.style.fontWeight = '600';
    title.textContent = '⚡ 批量生成';
    header.appendChild(title);

    const batchBtn = document.createElement('button');
    batchBtn.className = 'ms-btn ms-btn-primary ms-btn-sm';
    batchBtn.textContent = '新建批量生成';
    batchBtn.addEventListener('click', () => this._openBatchDialog());
    header.appendChild(batchBtn);

    container.appendChild(header);

    const list = document.createElement('div');
    list.className = 'ms-workflow-list';
    container.appendChild(list);

    if (this.workflows.length === 0) {
      list.innerHTML = '<div class="ms-empty"><div class="ms-empty-icon">📋</div><div>暂无可用工作流</div></div>';
      return;
    }

    for (const wf of this.workflows) {
      const card = document.createElement('div');
      card.className = 'ms-workflow-card';
      card.innerHTML = `
        <h4>${wf.name}</h4>
        <div class="ms-workflow-params">
          ${wf.params ? `模型: ${wf.params.model || '-'} | 分辨率: ${wf.params.width||'-'}×${wf.params.height||'-'} | 步数: ${wf.params.steps||'-'}` : '无参数信息'}
        </div>
      `;
      card.addEventListener('click', () => this._openBatchDialog(wf));
      list.appendChild(card);
    }
  }

  async _loadWorkflows() {
    try {
      const data = await this.api.tree('configs/workflows');
      const entries = Array.isArray(data) ? data : (data.children || data.files || []);
      this.workflows = [];
      for (const entry of entries) {
        if (entry.type === 'file' || !entry.isDirectory) {
          if (entry.name.endsWith('.json')) {
            try {
              const config = await this.api.readJSON(`configs/workflows/${entry.name}`);
              this.workflows.push({
                name: entry.name.replace('.json', ''),
                params: config,
                path: `configs/workflows/${entry.name}`
              });
            } catch { /* skip unreadable */ }
          }
        }
      }
    } catch {
      this.workflows = [];
    }
  }

  _openBatchDialog(workflow) {
    const overlay = document.createElement('div');
    overlay.className = 'ms-modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'ms-modal ms-gen-dialog';
    dialog.style.padding = '24px';
    dialog.style.maxWidth = '500px';

    dialog.innerHTML = `
      <h3 style="margin:0 0 20px">批量生成</h3>
    `;

    const form = document.createElement('div');
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = '12px';

    const wfRow = document.createElement('div');
    wfRow.className = 'ms-form-row';
    wfRow.innerHTML = '<label class="ms-form-label">工作流</label>';
    const wfSelect = document.createElement('select');
    wfSelect.className = 'ms-form-input';
    for (const w of this.workflows) {
      const opt = document.createElement('option');
      opt.value = w.name;
      opt.textContent = w.name;
      if (workflow && w.name === workflow.name) opt.selected = true;
      wfSelect.appendChild(opt);
    }
    wfRow.appendChild(wfSelect);
    form.appendChild(wfRow);

    const themeRow = document.createElement('div');
    themeRow.className = 'ms-form-row';
    themeRow.innerHTML = '<label class="ms-form-label">主题</label>';
    const themeInput = document.createElement('input');
    themeInput.className = 'ms-form-input';
    themeInput.placeholder = '输入主题名称';
    themeRow.appendChild(themeInput);
    form.appendChild(themeRow);

    const qtyRow = document.createElement('div');
    qtyRow.className = 'ms-form-row';
    qtyRow.innerHTML = '<label class="ms-form-label">数量</label>';
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.className = 'ms-form-input';
    qtyInput.value = '4';
    qtyInput.min = '1';
    qtyInput.max = '100';
    qtyRow.appendChild(qtyInput);
    form.appendChild(qtyRow);

    const strategyRow = document.createElement('div');
    strategyRow.className = 'ms-form-row';
    strategyRow.innerHTML = '<label class="ms-form-label">策略</label>';
    const strategySelect = document.createElement('select');
    strategySelect.className = 'ms-form-input';
    ['固定种子+变化', '全随机', '统一变体'].forEach((s, i) => {
      const opt = document.createElement('option');
      opt.value = ['variant', 'random', 'uniform'][i];
      opt.textContent = s;
      strategySelect.appendChild(opt);
    });
    strategyRow.appendChild(strategySelect);
    form.appendChild(strategyRow);

    dialog.appendChild(form);
    dialog.innerHTML += `<div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">
      <button class="ms-btn" id="ms-gen-cancel">取消</button>
      <button class="ms-btn ms-btn-primary" id="ms-gen-start">开始生成</button>
    </div>`;

    overlay.appendChild(dialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);

    document.getElementById('ms-gen-cancel')?.addEventListener('click', () => overlay.remove());
    document.getElementById('ms-gen-start')?.addEventListener('click', async () => {
      const workflowName = wfSelect.value;
      const theme = themeInput.value;
      const quantity = parseInt(qtyInput.value) || 4;
      const strategy = strategySelect.value;

      for (let i = 0; i < quantity; i++) {
        const filename = `gen-${workflowName}-${theme}-${Date.now()}-${i}.png`;
        const meta = createDefaultMeta(filename, theme, workflowName);
        try {
          await this.api.writeJSON(`pipeline/01-generating/${filename}.meta.json`, meta);
        } catch (e) {
          console.error('Failed to create job:', e);
        }
      }

      overlay.remove();
      alert(`已创建 ${quantity} 个生成任务`);
    });
  }
}
