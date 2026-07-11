import { createElement, empty } from './utils/dom.js';
import { formatDateTime } from './utils/format.js';

export class PublishView {
  constructor({ api, state }) {
    this.api = api;
    this.state = state;
    this.platforms = [];
    this.copywritings = [];
    this.records = [];
  }

  async render(container) {
    empty(container);
    await this._loadData();

    const wrapper = document.createElement('div');
    wrapper.className = 'ms-publish-view';
    wrapper.style.cssText = 'display:flex;flex-direction:column;gap:24px';
    container.appendChild(wrapper);

    this._renderFormSection(wrapper);
    this._renderRecordsSection(wrapper);
  }

  async _loadData() {
    try {
      this.platforms = await this.api.listPlatforms();
    } catch {
      this.platforms = [];
    }

    try {
      this.copywritings = await this.api.listCopywritings();
    } catch {
      this.copywritings = [];
    }

    try {
      this.records = await this.api.readJSON('.index/publish-records.json');
      if (!Array.isArray(this.records)) this.records = [];
    } catch {
      this.records = [];
    }
  }

  _renderFormSection(container) {
    const section = document.createElement('div');
    section.className = 'ms-publish-form-section';

    const header = document.createElement('div');
    header.className = 'ms-toolbar';
    const title = document.createElement('span');
    title.style.fontWeight = '600';
    title.textContent = '新建发布';
    header.appendChild(title);
    section.appendChild(header);

    const form = document.createElement('div');
    form.className = 'ms-publish-form';
    form.style.cssText = 'display:flex;flex-direction:column;gap:12px;margin-top:12px;max-width:500px';

    const platformRow = document.createElement('div');
    platformRow.className = 'ms-form-row';
    const platformLabel = document.createElement('label');
    platformLabel.className = 'ms-form-label';
    platformLabel.textContent = '发布平台';
    platformRow.appendChild(platformLabel);
    const platformSelect = document.createElement('select');
    platformSelect.className = 'ms-select ms-form-input';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '请选择平台';
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    platformSelect.appendChild(defaultOpt);
    const enabledPlatforms = this.platforms.filter(p => p.enabled !== false);
    for (const p of enabledPlatforms) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name || p.id;
      platformSelect.appendChild(opt);
    }
    platformRow.appendChild(platformSelect);
    form.appendChild(platformRow);

    const typeRow = document.createElement('div');
    typeRow.className = 'ms-form-row';
    const typeLabel = document.createElement('label');
    typeLabel.className = 'ms-form-label';
    typeLabel.textContent = '发布类型';
    typeRow.appendChild(typeLabel);
    const typeSelect = document.createElement('select');
    typeSelect.className = 'ms-select ms-form-input';
    const defaultTypeOpt = document.createElement('option');
    defaultTypeOpt.value = '';
    defaultTypeOpt.textContent = '请先选择平台';
    defaultTypeOpt.disabled = true;
    defaultTypeOpt.selected = true;
    typeSelect.appendChild(defaultTypeOpt);
    typeRow.appendChild(typeSelect);
    form.appendChild(typeRow);

    platformSelect.addEventListener('change', () => {
      const selectedPlatform = enabledPlatforms.find(p => p.id === platformSelect.value);
      empty(typeSelect);
      if (selectedPlatform && selectedPlatform.publishTypes) {
        for (const pt of selectedPlatform.publishTypes) {
          const opt = document.createElement('option');
          opt.value = pt;
          opt.textContent = pt;
          typeSelect.appendChild(opt);
        }
      } else {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '无可用类型';
        opt.disabled = true;
        opt.selected = true;
        typeSelect.appendChild(opt);
      }
    });

    const copyRow = document.createElement('div');
    copyRow.className = 'ms-form-row';
    const copyLabel = document.createElement('label');
    copyLabel.className = 'ms-form-label';
    copyLabel.textContent = '发布文案';
    copyRow.appendChild(copyLabel);
    const copySelect = document.createElement('select');
    copySelect.className = 'ms-select ms-form-input';
    const defaultCopyOpt = document.createElement('option');
    defaultCopyOpt.value = '';
    defaultCopyOpt.textContent = '请选择文案';
    defaultCopyOpt.disabled = true;
    defaultCopyOpt.selected = true;
    copySelect.appendChild(defaultCopyOpt);
    const approvedCopywritings = this.copywritings.filter(c => c.status === 'approved');
    for (const c of approvedCopywritings) {
      const opt = document.createElement('option');
      opt.value = c.uuid;
      opt.textContent = c.title || c.uuid;
      copySelect.appendChild(opt);
    }
    copyRow.appendChild(copySelect);
    form.appendChild(copyRow);

    const timeRow = document.createElement('div');
    timeRow.className = 'ms-form-row';
    const timeLabel = document.createElement('label');
    timeLabel.className = 'ms-form-label';
    timeLabel.textContent = '发布时间';
    timeRow.appendChild(timeLabel);
    const timeInput = document.createElement('input');
    timeInput.type = 'datetime-local';
    timeInput.className = 'ms-form-input';
    timeRow.appendChild(timeInput);
    form.appendChild(timeRow);

    const actionsRow = document.createElement('div');
    actionsRow.style.cssText = 'display:flex;gap:8px;margin-top:4px';

    const submitBtn = document.createElement('button');
    submitBtn.className = 'ms-btn ms-btn-primary';
    submitBtn.textContent = '提交发布';
    submitBtn.addEventListener('click', () => this._handleSubmit(platformSelect, typeSelect, copySelect, timeInput));
    actionsRow.appendChild(submitBtn);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'ms-btn';
    resetBtn.textContent = '重置';
    resetBtn.addEventListener('click', () => {
      platformSelect.selectedIndex = 0;
      empty(typeSelect);
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '请先选择平台';
      opt.disabled = true;
      opt.selected = true;
      typeSelect.appendChild(opt);
      copySelect.selectedIndex = 0;
      timeInput.value = '';
    });
    actionsRow.appendChild(resetBtn);

    form.appendChild(actionsRow);
    section.appendChild(form);
    container.appendChild(section);
  }

  async _handleSubmit(platformSelect, typeSelect, copySelect, timeInput) {
    const platformId = platformSelect.value;
    const publishType = typeSelect.value;
    const copywritingUuid = copySelect.value;
    const scheduledAt = timeInput.value;

    if (!platformId || !publishType || !copywritingUuid || !scheduledAt) {
      alert('请填写所有必填字段');
      return;
    }

    const selectedPlatform = this.platforms.find(p => p.id === platformId);
    const platformName = selectedPlatform ? (selectedPlatform.name || selectedPlatform.id) : platformId;
    const uuid = crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);

    const record = {
      id: uuid,
      platform: platformId,
      platformName,
      publishType,
      copywritingUuid,
      scheduledAt: new Date(scheduledAt).toISOString(),
      createdAt: new Date().toISOString(),
      status: 'scheduled'
    };

    try {
      this.records.push(record);
      await this.api.writeJSON('.index/publish-records.json', this.records);

      try {
        const copywriting = this.copywritings.find(c => c.uuid === copywritingUuid);
        if (copywriting && copywriting.path) {
          const meta = await this.api.readJSON(`${copywriting.path}/.meta.json`);
          meta.status = 'scheduled';
          await this.api.writeJSON(`${copywriting.path}/.meta.json`, meta);
        }
      } catch (e) {
        console.warn('Failed to update copywriting status:', e);
      }

      platformSelect.selectedIndex = 0;
      empty(typeSelect);
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '请先选择平台';
      opt.disabled = true;
      opt.selected = true;
      typeSelect.appendChild(opt);
      copySelect.selectedIndex = 0;
      timeInput.value = '';

      const container = document.getElementById('media-studio-view-container');
      if (container) this.render(container);
    } catch (e) {
      alert('发布失败: ' + e.message);
    }
  }

  _renderRecordsSection(container) {
    const section = document.createElement('div');
    section.className = 'ms-publish-records-section';

    const header = document.createElement('div');
    header.className = 'ms-toolbar';
    const title = document.createElement('span');
    title.style.fontWeight = '600';
    title.textContent = '发布记录';
    header.appendChild(title);

    const count = document.createElement('span');
    count.style.cssText = 'font-size:12px;color:var(--ms-text-secondary,#888);margin-left:8px';
    count.textContent = `(${this.records.length})`;
    header.appendChild(count);

    section.appendChild(header);

    if (this.records.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'ms-empty';
      emptyEl.style.cssText = 'padding:24px;text-align:center;color:var(--ms-text-secondary,#888)';
      emptyEl.textContent = '暂无发布记录';
      section.appendChild(emptyEl);
      container.appendChild(section);
      return;
    }

    const sorted = [...this.records].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const table = document.createElement('table');
    table.className = 'ms-publish-table';
    table.style.cssText = 'width:100%;border-collapse:collapse;margin-top:12px';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.cssText = 'border-bottom:1px solid var(--ms-border,#2a2a4a)';

    const headers = ['平台', '发布类型', '文案', '发布时间', '状态', '创建时间'];
    for (const h of headers) {
      const th = document.createElement('th');
      th.style.cssText = 'text-align:left;padding:8px 12px;font-size:12px;color:var(--ms-text-secondary,#888);font-weight:500';
      th.textContent = h;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const record of sorted) {
      const row = document.createElement('tr');
      row.style.cssText = 'border-bottom:1px solid var(--ms-border,#2a2a4a)';

      const platformCell = document.createElement('td');
      platformCell.style.cssText = 'padding:10px 12px;font-size:13px';
      platformCell.textContent = record.platformName || record.platform;
      row.appendChild(platformCell);

      const typeCell = document.createElement('td');
      typeCell.style.cssText = 'padding:10px 12px;font-size:13px';
      typeCell.textContent = record.publishType;
      row.appendChild(typeCell);

      const copyCell = document.createElement('td');
      copyCell.style.cssText = 'padding:10px 12px;font-size:13px';
      const copyEntry = this.copywritings.find(c => c.uuid === record.copywritingUuid);
      copyCell.textContent = copyEntry ? (copyEntry.title || copyEntry.uuid) : record.copywritingUuid;
      row.appendChild(copyCell);

      const timeCell = document.createElement('td');
      timeCell.style.cssText = 'padding:10px 12px;font-size:13px';
      timeCell.textContent = formatDateTime(record.scheduledAt);
      row.appendChild(timeCell);

      const statusCell = document.createElement('td');
      statusCell.style.cssText = 'padding:10px 12px;font-size:13px';
      const badge = document.createElement('span');
      badge.style.cssText = this._statusBadgeStyle(record.status);
      badge.textContent = this._statusLabel(record.status);
      statusCell.appendChild(badge);
      row.appendChild(statusCell);

      const createdCell = document.createElement('td');
      createdCell.style.cssText = 'padding:10px 12px;font-size:13px;color:var(--ms-text-secondary,#888)';
      createdCell.textContent = formatDateTime(record.createdAt);
      row.appendChild(createdCell);

      tbody.appendChild(row);
    }
    table.appendChild(tbody);

    section.appendChild(table);
    container.appendChild(section);
  }

  _statusBadgeStyle(status) {
    const colors = {
      scheduled: '#4a90d9',
      published: '#4caf50',
      failed: '#f44336'
    };
    const bg = colors[status] || '#888';
    return `display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;background:${bg}22;color:${bg}`;
  }

  _statusLabel(status) {
    const labels = {
      scheduled: '已排期',
      published: '已发布',
      failed: '失败'
    };
    return labels[status] || status;
  }
}
