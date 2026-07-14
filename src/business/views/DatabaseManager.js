import { empty } from '../../framework/utils/dom.js';
import { formatDateTime } from '../../framework/utils/format.js';
import { DataRepository } from '../../framework/core/DataRepository.js';

export class DatabaseManager {
  constructor({ api, state, schemaRegistry }) {
    this.api = api;
    this.state = state;
    this.schemaRegistry = schemaRegistry;

    this._currentDb = null;
    this._currentTable = null;
    this._page = 1;
    this._pageSize = 20;
    this._sortField = null;
    this._sortDir = 'asc';

    this._container = null;
    this._leftPanel = null;
    this._midPanel = null;
    this._rightPanel = null;
    this._paginator = null;
    this._clickHandler = null;
  }

  render(container, params) {
    empty(container);
    this._container = container;

    const db = params && params[0] ? decodeURIComponent(params[0]) : null;
    const table = params && params[1] ? decodeURIComponent(params[1]) : null;
    this._page = params && params[2] ? parseInt(params[2], 10) : 1;
    if (!this._page || this._page < 1) this._page = 1;

    this._currentDb = db;
    this._currentTable = table;

    container.innerHTML = `
      <div class="ms-db-manager">
        <div class="ms-db-panel ms-db-left" id="ms-db-databases">
          <div class="ms-db-panel-header">
            <span>数据库</span>
            <button class="ms-btn ms-btn-sm ms-btn-ghost ms-db-add-btn" data-action="create-db" title="新建数据库">+</button>
          </div>
          <div class="ms-db-panel-list" id="ms-db-db-list"></div>
        </div>
        <div class="ms-db-panel ms-db-mid" id="ms-db-tables"${db ? '' : ' style="display:none"'}>
          <div class="ms-db-panel-header">
            <span>表</span>
            <button class="ms-btn ms-btn-sm ms-btn-ghost ms-db-add-btn" data-action="create-table" title="新建表">+</button>
          </div>
          <div class="ms-db-panel-list" id="ms-db-table-list"></div>
        </div>
        <div class="ms-db-panel ms-db-right" id="ms-db-data"${table ? '' : ' style="display:none"'}>
          <div class="ms-db-panel-header">
            <span>数据</span>
            <button class="ms-btn ms-btn-sm ms-btn-ghost ms-db-add-btn" data-action="create-record" title="新建记录">+</button>
          </div>
          <div class="ms-db-data-grid" id="ms-db-data-grid"></div>
          <div class="ms-db-pagination" id="ms-db-pagination"></div>
        </div>
      </div>
    `;

    this._leftPanel = container.querySelector('#ms-db-db-list');
    this._midPanel = container.querySelector('#ms-db-table-list');
    this._rightPanel = container.querySelector('#ms-db-data-grid');
    this._paginator = container.querySelector('#ms-db-pagination');

    if (this._clickHandler) {
      container.removeEventListener('click', this._clickHandler);
    }
    this._clickHandler = (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      e.preventDefault();
      const action = btn.dataset.action;
      if (action === 'create-db') this._showDbForm(null);
      else if (action === 'edit-db') this._showDbForm({ id: btn.dataset.db, label: btn.dataset.label });
      else if (action === 'create-table') this._showTableForm(this._currentDb, null);
      else if (action === 'edit-table') this._showTableForm(btn.dataset.db, btn.dataset.table);
      else if (action === 'create-record') this._showCreateRecordForm();
      else if (action === 'delete-db') this._confirmDeleteDb(btn.dataset.db);
      else if (action === 'delete-table') this._confirmDeleteTable(btn.dataset.db, btn.dataset.table);
      else if (action === 'delete-record') this._confirmDeleteRecord(btn.dataset.path);
      else if (action === 'edit-record') this._editRecord(btn.dataset.path);
      else if (action === 'save-record') this._saveEdit(btn.dataset.path);
      else if (action === 'cancel-edit') this._cancelEdit();
    };
    container.addEventListener('click', this._clickHandler);

    this._loadDatabases();

    if (db) {
      this._loadTables(db);
    }
    if (db && table) {
      this._loadData(db, table, this._page);
    }
  }

  /* ── Database Level ─────────────────────────────────── */

  async _loadDatabases() {
    let databases = [];
    try {
      databases = await this.schemaRegistry.listDatabases();
    } catch {
    }
    this._renderDatabaseList(databases);
  }

  _renderDatabaseList(databases) {
    const el = this._leftPanel;
    if (!databases.length) {
      el.innerHTML = '<div class="ms-db-empty">还没有数据库</div>';
      return;
    }
    el.innerHTML = databases.map(db => `
      <div class="ms-db-item ${db.id === this._currentDb ? 'active' : ''}"
           data-db="${db.id}"
           data-action="select-db">
        <span class="ms-db-item-icon">${ICON_DB}</span>
        <span class="ms-db-item-label">${this._esc(db.label || db.id)}</span>
        <span class="ms-db-item-id">${this._esc(db.id)}</span>
        <button class="ms-btn-icon ms-db-edit-btn"
                data-action="edit-db" data-db="${db.id}" data-label="${this._esc(db.label || '')}"
                title="编辑数据库">✎</button>
        <button class="ms-btn-icon ms-db-delete-btn"
                data-action="delete-db" data-db="${db.id}"
                title="删除数据库">✕</button>
      </div>
    `).join('');

    el.querySelectorAll('[data-action="select-db"]').forEach(item => {
      item.addEventListener('click', () => {
        const db = item.dataset.db;
        this._navigateTo(db);
      });
    });
  }

  /* ── Table Level ────────────────────────────────────── */

  async _loadTables(db) {
    if (!db) return;
    const tablesPanel = document.getElementById('ms-db-tables');
    const tablesEl = this._midPanel;
    tablesPanel.style.display = '';
    tablesEl.innerHTML = '<div class="ms-db-loading">加载中...</div>';

    let tables = [];
    try {
      tables = await this.schemaRegistry.listTables(db);
    } catch {
    }
    this._renderTableList(db, tables);
  }

  _renderTableList(db, tables) {
    const el = this._midPanel;
    if (!tables.length) {
      el.innerHTML = '<div class="ms-db-empty">还没有表</div>';
      return;
    }
    el.innerHTML = tables.map(t => `
      <div class="ms-db-item ${t.id === this._currentTable ? 'active' : ''}"
           data-db="${db}" data-table="${t.id}"
           data-action="select-table">
        <span class="ms-db-item-icon">${ICON_TABLE}</span>
        <span class="ms-db-item-label">${this._esc(t.label || t.id)}</span>
        <span class="ms-db-item-count">${t.fieldCount ?? 0} 字段</span>
        <button class="ms-btn-icon ms-db-edit-btn"
                data-action="edit-table" data-db="${db}" data-table="${t.id}"
                title="编辑表">✎</button>
        <button class="ms-btn-icon ms-db-delete-btn"
                data-action="delete-table" data-db="${db}" data-table="${t.id}"
                title="删除表">✕</button>
      </div>
    `).join('');

    el.querySelectorAll('[data-action="select-table"]').forEach(item => {
      item.addEventListener('click', () => {
        const t = item.dataset.table;
        this._navigateTo(db, t);
      });
    });
  }

  /* ── Data Level ──────────────────────────────────────── */

  async _loadData(db, table, page) {
    const dataPanel = document.getElementById('ms-db-data');
    const gridEl = this._rightPanel;
    dataPanel.style.display = '';
    gridEl.innerHTML = '<div class="ms-db-loading">加载中...</div>';

    let fields = [];
    try {
      const tblSchema = await this.schemaRegistry.getTable(db, table);
      if (tblSchema) fields = tblSchema.fields || [];
    } catch {
    }

    let records = [], total = 0;
    try {
      const repo = DataRepository.for(this.api, this.schemaRegistry, db, table);

      let sortParam;
      if (this._sortField) {
        sortParam = this._sortDir === 'desc' ? `-${this._sortField}` : this._sortField;
      }

      const result = await repo.find({ page, limit: this._pageSize, sort: sortParam });
      records = result.records || [];
      total = result.total || 0;
    } catch {
    }

    const totalPages = Math.max(1, Math.ceil(total / this._pageSize));
    const pg = Math.min(page, totalPages);

    this._renderDataGrid(gridEl, db, table, fields, records);
    this._renderPagination(pg, totalPages, total);
  }

  _renderDataGrid(el, db, table, fields, records) {
    if (!records.length) {
      el.innerHTML = '<div class="ms-db-empty">还没有数据</div>';
      return;
    }

    let columns = fields && fields.length ? fields.map(f => f.id) : [];
    if (!columns.length && records.length) {
      columns = Object.keys(records[0]);
    }

    const editPath = this._editingRecord;

    el.innerHTML = `
      <table class="ms-db-grid-table">
        <thead>
          <tr>
            ${columns.map(col => `
              <th class="ms-db-th" data-sort="${col}">
                ${this._esc(col)}
                <span class="ms-db-sort-indicator">${this._sortField === col ? (this._sortDir === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
            `).join('')}
            <th class="ms-db-th-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          ${records.map((rec, idx) => {
            const path = `${db}/${table}/${rec.id}`;
            const editing = editPath === path;
            return '<tr class="ms-db-data-row' + (editing ? ' editing' : '') + '">'
              + columns.map(col => {
                  const val = rec[col];
                  const fdef = fields ? fields.find(f => f.id === col) : null;
                  const display = editing && !this._isReadOnlyField(fdef)
                    ? this._renderEditField(col, val, fdef)
                    : this._renderCellValue(val, fdef);
                  return `<td class="ms-db-data-cell">${display}</td>`;
                }).join('')
              + '<td class="ms-db-data-cell ms-db-data-actions">'
                + (!editing
                    ? `<button class="ms-btn-icon" data-action="edit-record" data-path="${path}" title="编辑">✏️</button>`
                    : `<button class="ms-btn-icon ms-btn-icon-save" data-action="save-record" data-path="${path}" title="保存">💾</button>`)
                + `<button class="ms-btn-icon" data-action="delete-record" data-path="${path}" title="删除">🗑️</button>`
                + (editing ? `<button class="ms-btn-icon" data-action="cancel-edit" title="取消">✕</button>` : '')
              + '</td></tr>';
          }).join('')
        }
        </tbody>
      </table>
    `;

    el.querySelectorAll('[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (this._sortField === field) {
          this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          this._sortField = field;
          this._sortDir = 'asc';
        }
        this._loadData(this._currentDb, this._currentTable, this._page);
      });
    });
  }

  _renderCellValue(val, fdef) {
    if (val == null) return '<span class="ms-db-null">NULL</span>';
    const type = fdef ? fdef.type : 'string';
    switch (type) {
      case 'boolean':
        return val ? '<span class="ms-db-bool-true">✓</span>' : '<span class="ms-db-bool-false">✗</span>';
      case 'datetime':
      case 'date':
        return `<span class="ms-db-datetime">${this._esc(formatDateTime(val))}</span>`;
      case 'json':
        try {
          return `<code class="ms-db-json">${this._esc(JSON.stringify(typeof val === 'string' ? JSON.parse(val) : val, null, 1))}</code>`;
        } catch {
          return `<code class="ms-db-json">${this._esc(val)}</code>`;
        }
      case 'text':
        return `<span class="ms-db-text" title="${this._esc(val)}">${this._esc(String(val).substring(0, 80))}${String(val).length > 80 ? '…' : ''}</span>`;
      case 'enum': {
        const color = (fdef.options && fdef.options.find(o => o.value === val)) || null;
        const bg = color ? `background:${color.color || '#555'}33` : '';
        return `<span class="ms-db-enum-badge" style="${bg}">${this._esc(val)}</span>`;
      }
      case 'reference':
        return `<span class="ms-db-ref">${this._esc(String(val))}</span>`;
      case 'array':
        return Array.isArray(val) ? val.map(v => `<span class="ms-db-tag">${this._esc(v)}</span>`).join('') : this._esc(String(val));
      case 'integer':
      case 'float':
        return `<span class="ms-db-number">${this._esc(String(val))}</span>`;
      default:
        return this._esc(String(val));
    }
  }

  _renderEditField(col, val, fdef) {
    const type = fdef ? fdef.type : 'string';
    const strVal = val != null ? String(val) : '';

    if (this._isReadOnlyField(fdef)) {
      return `<span class="ms-db-readonly">${this._esc(strVal)}</span>`;
    }

    const name = `edit-${col}`;
    switch (type) {
      case 'text':
        return `<textarea class="ms-db-edit-input ms-db-edit-textarea" name="${name}">${this._esc(strVal)}</textarea>`;
      case 'boolean':
        return `<input type="checkbox" class="ms-db-edit-checkbox" name="${name}"${val ? ' checked' : ''}>`;
      case 'integer':
        return `<input type="number" class="ms-db-edit-input" name="${name}" step="1" value="${this._esc(strVal)}">`;
      case 'float':
        return `<input type="number" class="ms-db-edit-input" name="${name}" step="any" value="${this._esc(strVal)}">`;
      case 'datetime':
        return `<input type="datetime-local" class="ms-db-edit-input" name="${name}" value="${this._esc(strVal.replace('Z', '').substring(0, 16))}">`;
      case 'date':
        return `<input type="date" class="ms-db-edit-input" name="${name}" value="${this._esc(strVal.substring(0, 10))}">`;
      case 'enum': {
        const options = fdef.options || [];
        return `<select class="ms-db-edit-input" name="${name}">
          ${options.map(o => `<option value="${this._esc(o.value)}"${o.value === val ? ' selected' : ''}>${this._esc(o.label || o.value)}</option>`).join('')}
        </select>`;
      }
      case 'array':
        return `<input type="text" class="ms-db-edit-input" name="${name}" value="${this._esc(Array.isArray(val) ? val.join(', ') : strVal)}" placeholder="逗号分隔">`;
      default:
        return `<input type="text" class="ms-db-edit-input" name="${name}" value="${this._esc(strVal)}">`;
    }
  }

  _renderPagination(page, totalPages, total) {
    const el = this._paginator;
    if (totalPages <= 1 && total <= this._pageSize) {
      el.innerHTML = total > 0 ? `<span class="ms-db-page-info">共 ${total} 条</span>` : '';
      return;
    }
    el.innerHTML = `
      <span class="ms-db-page-info">共 ${total} 条</span>
      <div class="ms-db-page-controls">
        <button class="ms-btn ms-btn-sm" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>⟨ 上一页</button>
        <span class="ms-db-page-current">${page} / ${totalPages}</span>
        <button class="ms-btn ms-btn-sm" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>下一页 ⟩</button>
      </div>
    `;
    el.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pg = parseInt(btn.dataset.page, 10);
        if (pg >= 1 && pg <= totalPages) {
          this._page = pg;
          this._loadData(this._currentDb, this._currentTable, pg);
        }
      });
    });
  }

  /* ── Database/Table Edit Forms ─────────────────────────── */

  _showDbForm(existing) {
    const isNew = !existing;
    const overlay = document.createElement('div');
    overlay.className = 'ms-db-form-overlay';

    const form = document.createElement('div');
    form.className = 'ms-db-form';

    form.innerHTML = `
      <div class="ms-db-form-header">
        <span>${isNew ? '新建数据库' : '编辑数据库'}</span>
        <button class="ms-btn-icon ms-db-form-close">✕</button>
      </div>
      <div class="ms-db-form-body">
        <div class="ms-db-form-field">
          <label class="ms-db-form-label">数据库 ID</label>
          <input class="ms-form-input" id="ms-db-form-db-id" type="text"
            value="${isNew ? '' : this._esc(existing.id)}"
            ${isNew ? '' : 'disabled'}
            placeholder="英文、数字、下划线" />
        </div>
        <div class="ms-db-form-field">
          <label class="ms-db-form-label">数据库名称</label>
          <input class="ms-form-input" id="ms-db-form-db-label" type="text"
            value="${isNew ? '' : this._esc(existing.label || '')}"
            placeholder="例如：主库" />
        </div>
      </div>
      <div class="ms-db-form-footer">
        <button class="ms-btn ms-db-form-cancel">取消</button>
        <button class="ms-btn ms-btn-primary ms-db-form-submit">保存</button>
      </div>
    `;

    overlay.appendChild(form);
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    form.querySelector('.ms-db-form-close').addEventListener('click', close);
    form.querySelector('.ms-db-form-cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    const firstInput = form.querySelector('input:not([disabled])');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);

    form.querySelector('.ms-db-form-submit').addEventListener('click', async () => {
      const idInput = form.querySelector('#ms-db-form-db-id');
      const labelInput = form.querySelector('#ms-db-form-db-label');
      const id = (idInput.value || '').trim();
      const label = (labelInput.value || '').trim();

      if (!id && isNew) {
        alert('请输入数据库 ID');
        idInput.focus();
        return;
      }
      if (!label) {
        alert('请输入数据库名称');
        labelInput.focus();
        return;
      }

      try {
        if (isNew) {
          await this.schemaRegistry.createDatabase({ id, label });
        } else {
          await this.schemaRegistry.updateDatabase(existing.id, { label });
        }
        overlay.remove();
        await this._loadDatabases();
        this._navigateTo(isNew ? id : existing.id);
      } catch (e) {
        alert('操作失败: ' + e.message);
      }
    });
  }

  async _showTableForm(db, tableId) {
    let existing = null;
    if (tableId) {
      try { existing = await this.schemaRegistry.getTable(db, tableId); } catch {}
    }
    const isNew = !existing;

    const overlay = document.createElement('div');
    overlay.className = 'ms-db-form-overlay';

    const form = document.createElement('div');
    form.className = 'ms-db-form';
    form.style.maxWidth = '700px';

    const existingFields = existing ? (existing.fields || []) : [];

    let fieldRowsHtml = '';
    const rowFor = (f, idx) => `
      <div class="ms-db-form-field-row">
        <input class="ms-form-input ms-db-field-id" type="text" value="${this._esc(f.id || '')}" placeholder="字段 ID" style="width:120px" />
        <input class="ms-form-input ms-db-field-label" type="text" value="${this._esc(f.label || '')}" placeholder="标签" style="width:120px" />
        <select class="ms-form-input ms-db-field-type" style="width:110px">
          ${FIELD_TYPES.map(t => `<option value="${t}"${f.type === t ? ' selected' : ''}>${t}</option>`).join('')}
        </select>
        <button class="ms-btn-icon ms-db-field-remove" title="删除">✕</button>
      </div>
    `;

    if (existingFields.length) {
      existingFields.forEach((f, i) => { fieldRowsHtml += rowFor(f, i); });
    } else if (isNew) {
      fieldRowsHtml += rowFor({ id: '', label: '', type: 'string' }, 0);
    }

    form.innerHTML = `
      <div class="ms-db-form-header">
        <span>${isNew ? '新建表' : '编辑表'} — ${this._esc(db)}</span>
        <button class="ms-btn-icon ms-db-form-close">✕</button>
      </div>
      <div class="ms-db-form-body">
        <div class="ms-db-form-field">
          <label class="ms-db-form-label">表 ID</label>
          <input class="ms-form-input" id="ms-db-form-table-id" type="text"
            value="${isNew ? '' : this._esc(existing.id)}"
            ${isNew ? '' : 'disabled'}
            placeholder="英文、数字、下划线" />
        </div>
        <div class="ms-db-form-field">
          <label class="ms-db-form-label">表名称</label>
          <input class="ms-form-input" id="ms-db-form-table-label" type="text"
            value="${isNew ? '' : this._esc(existing.label || '')}"
            placeholder="例如：文章" />
        </div>
        <div class="ms-db-form-field">
          <label class="ms-db-form-label">字段定义</label>
          <div class="ms-db-field-list" id="ms-db-field-list">
            ${fieldRowsHtml}
          </div>
          <button class="ms-btn ms-btn-sm" id="ms-db-field-add" style="margin-top:6px">+ 添加字段</button>
        </div>
      </div>
      <div class="ms-db-form-footer">
        <button class="ms-btn ms-db-form-cancel">取消</button>
        <button class="ms-btn ms-btn-primary ms-db-form-submit">保存</button>
      </div>
    `;

    overlay.appendChild(form);
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    form.querySelector('.ms-db-form-close').addEventListener('click', close);
    form.querySelector('.ms-db-form-cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    const firstInput = form.querySelector('input:not([disabled])');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);

    const fieldList = form.querySelector('#ms-db-field-list');
    form.querySelector('#ms-db-field-add').addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'ms-db-form-field-row';
      row.innerHTML = `
        <input class="ms-form-input ms-db-field-id" type="text" placeholder="字段 ID" style="width:120px" />
        <input class="ms-form-input ms-db-field-label" type="text" placeholder="标签" style="width:120px" />
        <select class="ms-form-input ms-db-field-type" style="width:110px">
          ${FIELD_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
        <button class="ms-btn-icon ms-db-field-remove">✕</button>
      `;
      row.querySelector('.ms-db-field-remove').addEventListener('click', () => row.remove());
      fieldList.appendChild(row);
    });

    form.querySelectorAll('.ms-db-field-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const row = e.target.closest('.ms-db-form-field-row');
        if (row) row.remove();
      });
    });

    form.querySelector('.ms-db-form-submit').addEventListener('click', async () => {
      const idInput = form.querySelector('#ms-db-form-table-id');
      const labelInput = form.querySelector('#ms-db-form-table-label');
      const tId = (idInput.value || '').trim();
      const tLabel = (labelInput.value || '').trim();

      if (!tId && isNew) {
        alert('请输入表 ID');
        idInput.focus();
        return;
      }
      if (!tLabel) {
        alert('请输入表名称');
        labelInput.focus();
        return;
      }

      const fields = [];
      form.querySelectorAll('.ms-db-form-field-row').forEach(row => {
        const fid = (row.querySelector('.ms-db-field-id').value || '').trim();
        const flabel = (row.querySelector('.ms-db-field-label').value || '').trim();
        const ftype = row.querySelector('.ms-db-field-type').value;
        if (fid) {
          fields.push({ id: fid, label: flabel || fid, type: ftype });
        }
      });

      try {
        overlay.remove();
        if (isNew) {
          await this.schemaRegistry.createTable(db, { id: tId, label: tLabel, fields: fields.length ? fields : undefined });
        } else {
          await this.schemaRegistry.updateTable(db, existing.id, { label: tLabel, fields });
        }
        await this._loadTables(db);
        this._navigateTo(db, isNew ? tId : existing.id);
      } catch (e) {
        alert('操作失败: ' + e.message);
      }
    });
  }

  async _showCreateRecordForm() {
    const db = this._currentDb;
    const table = this._currentTable;
    if (!db || !table) return;

    const fields = await this._getFieldsForTable(db, table);
    this._buildRecordForm(fields, table, null, async (data) => {
      try {
        const repo = DataRepository.for(this.api, this.schemaRegistry, db, table);
        await repo.create(data);
        this._loadData(db, table, this._page);
      } catch (e) {
        alert('创建失败: ' + e.message);
      }
    });
  }

  /* ── Edit / Delete ──────────────────────────────────── */

  _editRecord(path) {
    this._editingRecord = path;
    this._loadData(this._currentDb, this._currentTable, this._page);
  }

  async _saveEdit(path) {
    const parts = path.split('/');
    if (parts.length !== 3) return;
    const [db, table, id] = parts;

    const editRow = this._container.querySelector('.ms-db-data-row.editing');
    if (!editRow) return;

    const inputs = editRow.querySelectorAll('[name^="edit-"]');
    const updates = {};
    inputs.forEach(inp => {
      const field = inp.name.replace('edit-', '');
      if (inp.type === 'checkbox') {
        updates[field] = inp.checked;
      } else if (inp.type === 'number') {
        updates[field] = inp.value ? (inp.step === '1' ? parseInt(inp.value, 10) : parseFloat(inp.value)) : null;
      } else {
        updates[field] = inp.value;
      }
    });

    try {
      const repo = DataRepository.for(this.api, this.schemaRegistry, db, table);
      const updated = await repo.update(id, updates);
      if (!updated) { alert('记录不存在'); return; }
      this._editingRecord = null;
      this._loadData(db, table, this._page);
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  }

  _cancelEdit() {
    this._editingRecord = null;
    this._loadData(this._currentDb, this._currentTable, this._page);
  }

  _confirmDeleteDb(db) {
    if (!confirm(`确定删除数据库 "${db}"？所有数据和表都将被删除。`)) return;
    this._deleteDatabase(db);
  }

  async _deleteDatabase(db) {
    try {
      await this.schemaRegistry.deleteDatabase(db);
      if (this._currentDb === db) {
        this._currentDb = null;
        this._currentTable = null;
        this._navigateTo(null);
      }
      this._loadDatabases();
    } catch (e) {
      alert('删除失败: ' + e.message);
    }
  }

  _confirmDeleteTable(db, table) {
    if (!confirm(`确定删除表 "${table}"？所有数据都将丢失。`)) return;
    this._deleteTable(db, table);
  }

  async _deleteTable(db, table) {
    try {
      await this.schemaRegistry.deleteTable(db, table);
      if (this._currentTable === table) {
        this._currentTable = null;
        this._navigateTo(db);
      }
      this._loadTables(db);
    } catch (e) {
      alert('删除失败: ' + e.message);
    }
  }

  _confirmDeleteRecord(path) {
    if (!confirm('确定删除这条记录？')) return;
    this._deleteRecord(path);
  }

  async _deleteRecord(path) {
    const parts = path.split('/');
    if (parts.length !== 3) return;
    const [db, table, id] = parts;
    try {
      const repo = DataRepository.for(this.api, this.schemaRegistry, db, table);
      await repo.delete(id);
      this._loadData(db, table, this._page);
    } catch (e) {
      alert('删除失败: ' + e.message);
    }
  }

  /* ── Record Form Builder (Overlay Modal) ────────────── */

  _buildRecordForm(fields, table, existing, onSubmit) {
    const overlay = document.createElement('div');
    overlay.className = 'ms-db-form-overlay';

    const form = document.createElement('div');
    form.className = 'ms-db-form';

    let fieldsHtml = '';

    (fields.length ? fields : [{ id: 'id', label: 'ID', type: 'string' }]).forEach(f => {
      const val = existing ? existing[f.id] : '';
      fieldsHtml += `
        <div class="ms-db-form-field">
          <label class="ms-db-form-label">${this._esc(f.label || f.id)}</label>
          ${this._renderEditField(f.id, val, f)}
        </div>
      `;
    });

    form.innerHTML = `
      <div class="ms-db-form-header">
        <span>${existing ? '编辑' : '新建'}记录 — ${table}</span>
        <button class="ms-btn-icon ms-db-form-close">✕</button>
      </div>
      <div class="ms-db-form-body">
        ${fieldsHtml}
      </div>
      <div class="ms-db-form-footer">
        <button class="ms-btn ms-db-form-cancel">取消</button>
        <button class="ms-btn ms-btn-primary ms-db-form-submit">${existing ? '保存' : '创建'}</button>
      </div>
    `;

    overlay.appendChild(form);
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    form.querySelector('.ms-db-form-close').addEventListener('click', close);
    form.querySelector('.ms-db-form-cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    form.querySelector('.ms-db-form-submit').addEventListener('click', async () => {
      const data = {};
      const inputs = form.querySelectorAll('[name^="edit-"]');
      inputs.forEach(inp => {
        const field = inp.name.replace('edit-', '');
        if (inp.type === 'checkbox') {
          data[field] = inp.checked;
        } else if (inp.type === 'number') {
          data[field] = inp.value ? (inp.step === '1' ? parseInt(inp.value, 10) : parseFloat(inp.value)) : null;
        } else {
          data[field] = inp.value;
        }
      });
      overlay.remove();
      await onSubmit(data);
    });
  }

  async _getFieldsForTable(db, table) {
    try {
      const schema = await this.schemaRegistry.getTable(db, table);
      return schema ? (schema.fields || []) : [];
    } catch {
      return [];
    }
  }

  /* ── Navigation ──────────────────────────────────────── */

  _navigateTo(db, table) {
    const hash = 'database' + (db ? '/' + encodeURIComponent(db) : '') + (table ? '/' + encodeURIComponent(table) : '');
    this.state.setView('database');
    window.location.hash = hash;
    this._currentDb = db;
    this._currentTable = table || null;
    this._page = 1;
    this._refresh();
  }

  async _refresh() {
    this._loadDatabases();
    if (this._currentDb) {
      this._loadTables(this._currentDb);
    }
    if (this._currentDb && this._currentTable) {
      this._loadData(this._currentDb, this._currentTable, this._page);
    }
  }

  /* ── Helpers ───────────────────────────────────────── */

  _isReadOnlyField(fdef) {
    if (!fdef) return false;
    return fdef.id === 'id' || fdef.id === 'created_at' || fdef.id === 'updated_at';
  }

  _esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

/* ── Inline Icons ─────────────────────────────────────── */

const FIELD_TYPES = ['string','text','integer','float','boolean','datetime','date','enum','reference','array','json'];

const ICON_DB = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="8" cy="3.5" rx="6" ry="2"/><path d="M2 5.5v4c0 1.1 2.7 2 6 2s6-.9 6-2v-4"/><path d="M2 12.5v-7"/></svg>';

const ICON_TABLE = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12" rx="1"/><path d="M2 6h12M6 2v12"/></svg>';
