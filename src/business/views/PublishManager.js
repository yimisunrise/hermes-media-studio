import { empty } from '../../framework/utils/dom.js';
import { Modal } from '../../framework/ui/Modal.js';
import { packageRepo, platformRepo, contentRepo, scheduleRepo, publishLogRepo } from '../data/index.js';

const PACKAGE_STATUS_LABELS = {
  draft: '草稿',
  scheduled: '已排期',
  publishing: '发布中',
  published: '已发布',
  partially_published: '部分成功',
  failed: '失败'
};

const PACKAGE_STATUS_COLORS = {
  draft: { bg: 'rgba(160,160,160,0.15)', color: 'var(--ms-text-secondary)' },
  scheduled: { bg: 'rgba(52,152,219,0.15)', color: '#3498db' },
  publishing: { bg: 'rgba(243,156,18,0.15)', color: '#f39c12' },
  published: { bg: 'rgba(39,174,96,0.15)', color: 'var(--ms-success,#27ae60)' },
  partially_published: { bg: 'rgba(230,126,34,0.15)', color: '#e67e22' },
  failed: { bg: 'rgba(231,76,60,0.15)', color: 'var(--ms-danger,#e74c3c)' }
};

const LOG_STATUS_LABELS = {
  scheduled: '待发布',
  publishing: '发布中',
  success: '已发布',
  failed: '失败'
};

const LOG_STATUS_COLORS = {
  scheduled: { bg: 'rgba(160,160,160,0.15)', color: 'var(--ms-text-secondary)' },
  publishing: { bg: 'rgba(243,156,18,0.15)', color: '#f39c12' },
  success: { bg: 'rgba(39,174,96,0.15)', color: 'var(--ms-success,#27ae60)' },
  failed: { bg: 'rgba(231,76,60,0.15)', color: 'var(--ms-danger,#e74c3c)' }
};

const SCHEDULE_STATUS_LABELS = {
  pending: '待执行',
  publishing: '执行中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消'
};

export class PublishManager {
  constructor({ api, state, schemaRegistry }) {
    this.api = api;
    this.state = state;
    this._sr = schemaRegistry;
    this._packages = [];
    this._platforms = [];
    this._contents = [];
    this._content = null;
  }

  _packageRepo() { return packageRepo(this.api, this._sr); }
  _platformRepo() { return platformRepo(this.api, this._sr); }
  _contentRepo() { return contentRepo(this.api, this._sr); }
  _scheduleRepo() { return scheduleRepo(this.api, this._sr); }
  _publishLogRepo() { return publishLogRepo(this.api, this._sr); }

  async render(container) {
    empty(container);
    await this._load();

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--ms-border);';
    const title = document.createElement('span');
    title.style.cssText = 'font-weight:600;font-size:15px;color:var(--ms-text-primary);';
    title.textContent = '发布管理';
    toolbar.appendChild(title);

    const createBtn = document.createElement('button');
    createBtn.className = 'ms-btn ms-btn-primary ms-btn-sm';
    createBtn.textContent = '创建发布包';
    createBtn.addEventListener('click', () => this._openCreateModal());
    toolbar.appendChild(createBtn);
    container.appendChild(toolbar);

    const content = document.createElement('div');
    content.style.padding = '16px';
    container.appendChild(content);
    this._content = content;

    if (this._packages.length === 0) {
      content.innerHTML = '<div class="ms-empty" style="padding:48px;text-align:center;color:var(--ms-text-secondary);"><svg class="ms-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/><path d="M9 14h6M9 18h6"/></svg><div>暂无发布包，点击上方「创建发布包」开始管理</div></div>';
      return;
    }

    this._renderList();
  }

  async _load() {
    try {
      const [pkgResult, pltResult, ctResult] = await Promise.all([
        this._packageRepo().find({ sort: 'createdAt' }),
        this._platformRepo().find({ sort: 'name' }),
        this._contentRepo().find({ sort: 'title' })
      ]);
      this._packages = pkgResult.records || [];
      this._platforms = pltResult.records || [];
      this._contents = ctResult.records || [];
    } catch (e) {
      console.error('加载发布数据失败', e);
      this._packages = [];
      this._platforms = [];
      this._contents = [];
    }
  }

  _getPlatformName(id) {
    const p = this._platforms.find(pl => pl.id === id);
    return p ? p.name : (id || '-');
  }

  _getContentTitle(id) {
    const c = this._contents.find(ct => ct.id === id);
    return c ? c.title : (id || '-');
  }

  _renderList() {
    empty(this._content);

    for (const pkg of this._packages) {
      const card = document.createElement('div');
      card.className = 'ms-item-card';

      const platformCount = Array.isArray(pkg.platformIds) ? pkg.platformIds.length : 0;
      const badge = this._statusBadge(pkg.status, PACKAGE_STATUS_LABELS, PACKAGE_STATUS_COLORS);
      const createdAt = this._formatDateTime(pkg.createdAt || pkg._ctime);

      // Info row (title + actions)
      const info = document.createElement('div');
      info.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';

      const titleEl = document.createElement('div');
      titleEl.style.cssText = 'font-weight:600;font-size:14px;color:var(--ms-text-primary);';
      titleEl.textContent = pkg.title || '-';
      info.appendChild(titleEl);

      // Actions (hover shown)
      const actions = document.createElement('div');
      actions.className = 'ms-item-card-actions';

      if (pkg.status === 'scheduled' || pkg.status === 'draft') {
        const publishBtn = document.createElement('button');
        publishBtn.className = 'ms-btn ms-btn-primary ms-btn-sm';
        publishBtn.textContent = '发布';
        publishBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._handlePublishNow(pkg);
        });
        actions.appendChild(publishBtn);
      }

      const detailBtn = document.createElement('button');
      detailBtn.className = 'ms-btn ms-btn-sm';
      detailBtn.textContent = '详情';
      detailBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._openDetailModal(pkg);
      });
      actions.appendChild(detailBtn);

      info.appendChild(actions);
      card.appendChild(info);

      // Meta row
      const meta = document.createElement('div');
      meta.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:8px;font-size:12px;color:var(--ms-text-secondary);';
      meta.innerHTML = `${badge}<span>平台数: ${platformCount}</span><span>${createdAt}</span>`;
      card.appendChild(meta);

      // Card click -> detail modal
      card.addEventListener('click', () => this._openDetailModal(pkg));

      this._content.appendChild(card);
    }
  }

  _statusBadge(status, labels, colors) {
    const label = labels[status] || status || '-';
    const c = colors[status] || { bg: 'rgba(160,160,160,0.15)', color: 'var(--ms-text-secondary)' };
    return `<span style="display:inline-block;padding:1px 8px;border-radius:3px;font-size:11px;font-weight:500;background:${c.bg};color:${c.color};">${label}</span>`;
  }

  _openCreateModal() {
    const body = document.createElement('div');

    const finalizedContents = this._contents.filter(c => c.status === 'finalized');
    const contentRow = this._formField('关联文稿 *', 'select');
    const contentSelect = contentRow.querySelector('select');
    contentSelect.innerHTML = '<option value="">-- 选择已定稿的文稿 --</option>' +
      finalizedContents.map(c =>
        `<option value="${c.id}">${this._escapeHtml(c.title || c.id)}</option>`
      ).join('');
    body.appendChild(contentRow);

    const titleRow = this._formField('发布包标题', 'input', '', '默认为文稿标题');
    const titleInput = titleRow.querySelector('input');
    body.appendChild(titleRow);

    contentSelect.addEventListener('change', () => {
      if (!titleInput.value) {
        const selected = finalizedContents.find(c => c.id === contentSelect.value);
        if (selected) titleInput.value = selected.title || '';
      }
    });

    const platformRow = this._formField('选择平台 *', 'custom');
    const platformList = document.createElement('div');
    platformList.style.cssText = 'max-height:160px;overflow-y:auto;border:1px solid var(--ms-border);border-radius:var(--ms-radius-sm,4px);padding:6px 8px;';
    const enabledPlatforms = this._platforms.filter(p => p.enabled !== false);
    if (enabledPlatforms.length === 0) {
      platformList.innerHTML = '<div style="color:var(--ms-text-secondary);font-size:12px;padding:8px;">暂无启用的平台</div>';
    } else {
      for (const p of enabledPlatforms) {
        const label = document.createElement('label');
        label.style.cssText = 'display:flex;align-items:center;padding:4px 0;cursor:pointer;font-size:13px;color:var(--ms-text-primary);';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = p.id;
        cb.style.marginRight = '6px';
        label.appendChild(cb);
        label.appendChild(document.createTextNode(p.name));
        platformList.appendChild(label);
      }
    }
    platformRow.appendChild(platformList);
    body.appendChild(platformRow);

    const timingRow = document.createElement('div');
    timingRow.style.marginBottom = '14px';
    const timingLabel = document.createElement('div');
    timingLabel.className = 'ms-form-label';
    timingLabel.textContent = '发布方式';
    timingRow.appendChild(timingLabel);

    const immediateLabel = document.createElement('label');
    immediateLabel.style.cssText = 'display:flex;align-items:center;margin-bottom:6px;cursor:pointer;font-size:13px;color:var(--ms-text-primary);';
    const immediateRadio = document.createElement('input');
    immediateRadio.type = 'radio';
    immediateRadio.name = 'ms-publish-timing';
    immediateRadio.value = 'immediate';
    immediateRadio.checked = true;
    immediateLabel.appendChild(immediateRadio);
    immediateLabel.appendChild(document.createTextNode(' 立即发布'));
    timingRow.appendChild(immediateLabel);

    const scheduleLabel = document.createElement('label');
    scheduleLabel.style.cssText = 'display:flex;align-items:center;cursor:pointer;font-size:13px;color:var(--ms-text-primary);';
    const scheduleRadio = document.createElement('input');
    scheduleRadio.type = 'radio';
    scheduleRadio.name = 'ms-publish-timing';
    scheduleRadio.value = 'scheduled';
    scheduleLabel.appendChild(scheduleRadio);
    scheduleLabel.appendChild(document.createTextNode(' 排期发布'));
    timingRow.appendChild(scheduleLabel);

    const dateWrapper = document.createElement('div');
    dateWrapper.style.cssText = 'margin-top:8px;margin-left:22px;display:none;';
    const dateInput = document.createElement('input');
    dateInput.type = 'datetime-local';
    dateInput.className = 'ms-form-input';

    dateWrapper.appendChild(dateInput);
    timingRow.appendChild(dateWrapper);

    immediateRadio.addEventListener('change', () => { dateWrapper.style.display = 'none'; });
    scheduleRadio.addEventListener('change', () => { dateWrapper.style.display = ''; });

    body.appendChild(timingRow);

    const m = new Modal({ title: '创建发布包', size: 'md' });
    m.setBody(body);
    m.setFooter(`
      <button class="ms-btn ms-btn-sm" id="pm-create-cancel">取消</button>
      <button class="ms-btn ms-btn-primary ms-btn-sm" id="pm-create-submit">创建</button>
    `);
    m.open();

    m.el.querySelector('#pm-create-cancel').addEventListener('click', () => m.close());
    m.el.querySelector('#pm-create-submit').addEventListener('click', async () => {
      const contentId = contentSelect.value;
      if (!contentId) {
        contentSelect.style.borderColor = 'var(--ms-danger)';
        return;
      }
      contentSelect.style.borderColor = '';

      const selectedPlatforms = Array.from(platformList.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
      if (selectedPlatforms.length === 0) {
        platformList.style.borderColor = 'var(--ms-danger)';
        return;
      }
      platformList.style.borderColor = '';

      const title = titleInput.value.trim() || this._getContentTitle(contentId);
      const isScheduled = scheduleRadio.checked;
      let scheduledAt = null;
      if (isScheduled && dateInput.value) {
        scheduledAt = new Date(dateInput.value).toISOString();
      }

      try {
        const pkgData = {
          contentId,
          title,
          platformIds: selectedPlatforms,
          status: 'scheduled',
          scheduledAt
        };
        const createdPkg = await this._packageRepo().create(pkgData);

        for (const platformId of selectedPlatforms) {
          await this._scheduleRepo().create({
            packageId: createdPkg.id,
            platformId,
            scheduledAt: scheduledAt || new Date().toISOString(),
            status: 'pending'
          });
          await this._publishLogRepo().create({
            packageId: createdPkg.id,
            platformId,
            scheduledAt: scheduledAt || new Date().toISOString(),
            status: 'scheduled',
            retryCount: 0
          });
        }

        m.close();
        await this._load();
        this._renderList();
      } catch (e) {
        console.error('创建发布包失败', e);
      }
    });
  }

  async _openDetailModal(pkg) {
    const body = document.createElement('div');

    // Header info
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:16px;';
    const pkgTitle = document.createElement('span');
    pkgTitle.style.cssText = 'font-weight:600;font-size:14px;color:var(--ms-text-primary);';
    pkgTitle.textContent = '发布包: ' + (pkg.title || '-');
    header.appendChild(pkgTitle);
    const badgeSpan = document.createElement('span');
    badgeSpan.innerHTML = this._statusBadge(pkg.status, PACKAGE_STATUS_LABELS, PACKAGE_STATUS_COLORS);
    header.appendChild(badgeSpan);
    body.appendChild(header);

    let schedules = [];
    let pLogs = [];
    try {
      const [schResult, logResult] = await Promise.all([
        this._scheduleRepo().find({ filter: { packageId: pkg.id } }),
        this._publishLogRepo().find({ filter: { packageId: pkg.id } })
      ]);
      schedules = schResult.records || [];
      pLogs = logResult.records || [];
    } catch (e) {
      console.error('加载发布详情失败', e);
    }

    const schMap = {};
    for (const s of schedules) { schMap[s.platformId] = s; }
    const logMap = {};
    for (const l of pLogs) { logMap[l.platformId] = l; }

    const platformIds = Array.isArray(pkg.platformIds) ? pkg.platformIds : [];

    if (platformIds.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.cssText = 'padding:32px;text-align:center;color:var(--ms-text-secondary);';
      emptyDiv.textContent = '此发布包未关联任何平台';
      body.appendChild(emptyDiv);
    } else {
      const detailTable = document.createElement('table');
      detailTable.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';
      detailTable.innerHTML = `
        <thead>
          <tr style="border-bottom:1px solid var(--ms-border);background:var(--ms-bg-card);">
            <th style="text-align:left;padding:8px 12px;color:var(--ms-text-secondary);font-weight:500;">平台</th>
            <th style="text-align:left;padding:8px 12px;color:var(--ms-text-secondary);font-weight:500;">排期时间</th>
            <th style="text-align:left;padding:8px 12px;color:var(--ms-text-secondary);font-weight:500;">发布状态</th>
            <th style="text-align:left;padding:8px 12px;color:var(--ms-text-secondary);font-weight:500;">发布地址</th>
            <th style="text-align:right;padding:8px 12px;color:var(--ms-text-secondary);font-weight:500;">操作</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
      const detailTbody = detailTable.querySelector('tbody');

      for (const platformId of platformIds) {
        const platformName = this._getPlatformName(platformId);
        const schedule = schMap[platformId];
        const pLog = logMap[platformId];

        const dRow = document.createElement('tr');
        dRow.style.cssText = 'border-bottom:1px solid var(--ms-border);';

        const scheduleTime = schedule ? this._formatDateTime(schedule.scheduledAt) : '-';
        const logBadge = pLog ? this._statusBadge(pLog.status, LOG_STATUS_LABELS, LOG_STATUS_COLORS) : '<span style="color:var(--ms-text-secondary);">-</span>';
        const url = (pLog && pLog.url) ? `<a href="${this._escapeHtml(pLog.url)}" target="_blank" style="color:var(--ms-accent);">${this._escapeHtml(pLog.url)}</a>` : '-';

        dRow.innerHTML = `
          <td style="padding:10px 12px;color:var(--ms-text-primary);">${this._escapeHtml(platformName)}</td>
          <td style="padding:10px 12px;color:var(--ms-text-secondary);font-size:12px;">${scheduleTime}</td>
          <td style="padding:10px 12px;">${logBadge}</td>
          <td style="padding:10px 12px;font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${url}</td>
          <td style="padding:10px 12px;text-align:right;"></td>
        `;

        const actionCell = dRow.querySelector('td:last-child');

        if (pLog && pLog.status === 'publishing') {
          const markBtn = document.createElement('button');
          markBtn.className = 'ms-btn ms-btn-sm';
          markBtn.textContent = '标记发布结果';
          markBtn.addEventListener('click', () => {
            m.close();
            this._openMarkResultModal(pkg, platformId, pLog, schedule);
          });
          actionCell.appendChild(markBtn);
        }

        if (pLog && pLog.status === 'failed' && (pLog.retryCount || 0) < 3) {
          const retryBtn = document.createElement('button');
          retryBtn.className = 'ms-btn ms-btn-sm';
          retryBtn.style.marginLeft = '4px';
          retryBtn.textContent = '重试';
          retryBtn.addEventListener('click', async () => {
            try {
              await this._publishLogRepo().update(pLog.id, {
                status: 'publishing',
                error: null,
                retryCount: (pLog.retryCount || 0) + 1
              });
              if (schedule) {
                await this._scheduleRepo().update(schedule.id, { status: 'publishing' });
              }
              m.close();
              const refreshed = this._packages.find(p => p.id === pkg.id) || pkg;
              this._openDetailModal(refreshed);
            } catch (e) {
              console.error('重试发布失败', e);
            }
          });
          actionCell.appendChild(retryBtn);
        }

        detailTbody.appendChild(dRow);
      }

      body.appendChild(detailTable);

      if (pkg.status === 'partially_published' || pkg.status === 'failed') {
        const summary = document.createElement('div');
        summary.style.cssText = 'padding:12px 16px;font-size:13px;color:var(--ms-text-secondary);border-top:1px solid var(--ms-border);margin-top:8px;';
        const successCount = pLogs.filter(l => l.status === 'success').length;
        const failCount = pLogs.filter(l => l.status === 'failed').length;
        summary.textContent = `发布汇总: ${successCount} 成功, ${failCount} 失败`;
        body.appendChild(summary);
      }
    }

    const canPublish = pkg.status === 'scheduled' || pkg.status === 'draft';

    const m = new Modal({ title: '发布包详情', size: 'lg' });
    m.setBody(body);
    m.setFooter(`
      ${canPublish ? '<button class="ms-btn ms-btn-primary ms-btn-sm" id="pm-detail-publish">发布</button>' : ''}
      <button class="ms-btn ms-btn-sm" id="pm-detail-close">关闭</button>
    `);
    m.open();

    if (canPublish) {
      m.el.querySelector('#pm-detail-publish').addEventListener('click', async () => {
        m.close();
        await this._handlePublishNow(pkg);
      });
    }
    m.el.querySelector('#pm-detail-close').addEventListener('click', () => m.close());
  }

  async _handlePublishNow(pkg) {
    try {
      await this._packageRepo().update(pkg.id, { status: 'publishing' });

      const [schResult, logResult] = await Promise.all([
        this._scheduleRepo().find({ filter: { packageId: pkg.id } }),
        this._publishLogRepo().find({ filter: { packageId: pkg.id } })
      ]);
      const schedules = schResult.records || [];
      const pLogs = logResult.records || [];

      const updates = [];
      for (const s of schedules) {
        updates.push(this._scheduleRepo().update(s.id, { status: 'publishing' }));
      }
      for (const l of pLogs) {
        updates.push(this._publishLogRepo().update(l.id, { status: 'publishing' }));
      }
      await Promise.all(updates);

      await this._load();
      this._renderList();
    } catch (e) {
      console.error('执行发布失败', e);
    }
  }

  _openMarkResultModal(pkg, platformId, pLog, schedule) {
    const platformName = this._getPlatformName(platformId);

    const body = document.createElement('div');

    const info = document.createElement('div');
    info.style.cssText = 'margin-bottom:14px;font-size:13px;color:var(--ms-text-secondary);';
    info.textContent = '平台: ' + platformName;
    body.appendChild(info);

    const urlRow = this._formField('发布地址 (URL)', 'input', pLog.url || '', 'https://...');
    const urlInput = urlRow.querySelector('input');
    body.appendChild(urlRow);

    const resultRow = document.createElement('div');
    resultRow.style.marginBottom = '14px';
    const resultLabel = document.createElement('div');
    resultLabel.className = 'ms-form-label';
    resultLabel.textContent = '发布结果';
    resultRow.appendChild(resultLabel);

    const successLabel = document.createElement('label');
    successLabel.style.cssText = 'display:flex;align-items:center;margin-bottom:6px;cursor:pointer;font-size:13px;color:var(--ms-text-primary);';
    const successRadio = document.createElement('input');
    successRadio.type = 'radio';
    successRadio.name = 'ms-mark-result';
    successRadio.value = 'success';
    successRadio.checked = true;
    successLabel.appendChild(successRadio);
    successLabel.appendChild(document.createTextNode(' 成功'));
    resultRow.appendChild(successLabel);

    const failLabel = document.createElement('label');
    failLabel.style.cssText = 'display:flex;align-items:center;cursor:pointer;font-size:13px;color:var(--ms-text-primary);';
    const failRadio = document.createElement('input');
    failRadio.type = 'radio';
    failRadio.name = 'ms-mark-result';
    failRadio.value = 'failed';
    failLabel.appendChild(failRadio);
    failLabel.appendChild(document.createTextNode(' 失败'));
    resultRow.appendChild(failLabel);
    body.appendChild(resultRow);

    const errorWrapper = document.createElement('div');
    errorWrapper.style.marginBottom = '14px';
    errorWrapper.style.display = 'none';
    const errorLabel = document.createElement('div');
    errorLabel.className = 'ms-form-label';
    errorLabel.textContent = '错误信息';
    errorWrapper.appendChild(errorLabel);
    const errorTextarea = document.createElement('textarea');
    errorTextarea.className = 'ms-form-textarea';
    errorTextarea.placeholder = '发布失败的原因...';
    errorTextarea.value = pLog.error || '';
    errorTextarea.style.minHeight = '60px';
    errorTextarea.style.fontSize = '13px';
    errorWrapper.appendChild(errorTextarea);
    body.appendChild(errorWrapper);

    successRadio.addEventListener('change', () => { errorWrapper.style.display = 'none'; });
    failRadio.addEventListener('change', () => { errorWrapper.style.display = ''; });

    const m = new Modal({ title: '标记发布结果', size: 'sm' });
    m.setBody(body);
    m.setFooter(`
      <button class="ms-btn ms-btn-sm" id="pm-mark-cancel">取消</button>
      <button class="ms-btn ms-btn-primary ms-btn-sm" id="pm-mark-save">保存</button>
    `);
    m.open();

    m.el.querySelector('#pm-mark-cancel').addEventListener('click', () => m.close());
    m.el.querySelector('#pm-mark-save').addEventListener('click', async () => {
      const isSuccess = successRadio.checked;
      const url = urlInput.value.trim() || null;

      try {
        const logUpdate = {
          status: isSuccess ? 'success' : 'failed',
          publishedAt: new Date().toISOString(),
          url
        };
        if (!isSuccess) {
          logUpdate.error = errorTextarea.value.trim() || null;
        } else {
          logUpdate.error = null;
        }
        await this._publishLogRepo().update(pLog.id, logUpdate);

        if (schedule) {
          await this._scheduleRepo().update(schedule.id, {
            status: isSuccess ? 'completed' : 'failed'
          });
        }

        await this._summarizePackageStatus(pkg);

        m.close();
        await this._load();
        const refreshed = this._packages.find(p => p.id === pkg.id) || pkg;
        this._openDetailModal(refreshed);
      } catch (e) {
        console.error('保存发布结果失败', e);
      }
    });
  }

  async _summarizePackageStatus(pkg) {
    try {
      const logResult = await this._publishLogRepo().find({ filter: { packageId: pkg.id } });
      const pLogs = logResult.records || [];
      if (pLogs.length === 0) return;

      const allDone = pLogs.every(l => l.status === 'success' || l.status === 'failed');
      if (!allDone) return;

      const successCount = pLogs.filter(l => l.status === 'success').length;
      const total = pLogs.length;

      let newStatus;
      if (successCount === total) {
        newStatus = 'published';
      } else if (successCount === 0) {
        newStatus = 'failed';
      } else {
        newStatus = 'partially_published';
      }

      await this._packageRepo().update(pkg.id, { status: newStatus });
    } catch (e) {
      console.error('汇总发布包状态失败', e);
    }
  }

  _formField(label, type, value, placeholder) {
    const row = document.createElement('div');
    row.style.marginBottom = '14px';

    const labelEl = document.createElement('div');
    labelEl.className = 'ms-form-label';
    labelEl.textContent = label;
    row.appendChild(labelEl);

    if (type === 'select') {
      const select = document.createElement('select');
      select.className = 'ms-select';
      select.style.width = '100%';
      if (value) select.value = value;
      row.appendChild(select);
    } else if (type === 'textarea') {
      const textarea = document.createElement('textarea');
      textarea.className = 'ms-form-textarea';
      textarea.placeholder = placeholder || '';
      textarea.value = value || '';
      textarea.style.minHeight = '80px';
      textarea.style.fontFamily = 'monospace';
      textarea.style.fontSize = '12px';
      row.appendChild(textarea);
    } else if (type === 'custom') {
    } else {
      const input = document.createElement('input');
      input.className = 'ms-form-input';
      input.placeholder = placeholder || '';
      input.value = value || '';
      row.appendChild(input);
    }
    return row;
  }

  _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  _formatDateTime(dt) {
    if (!dt) return '-';
    const d = new Date(dt);
    if (isNaN(d.getTime())) return String(dt);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  destroy() {
    this._packages = [];
    this._platforms = [];
    this._contents = [];
    this._content = null;
  }
}
