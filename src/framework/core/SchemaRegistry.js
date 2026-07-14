const SYSTEM_DB_ID = 'system';
const DB_FILE = '.database/databases.json';

export const TABLE_SCHEMA = {
  id: 'table',
  label: '表注册表',
  fields: [
    { id: 'id', type: 'string', label: '标识', required: true },
    { id: 'database', type: 'string', label: '所属库', required: true },
    { id: 'label', type: 'string', label: '名称' },
    { id: 'shardType', type: 'string', label: '分片类型', defaultValue: 'none' },
    { id: 'createdAt', type: 'datetime', label: '创建时间', autoSet: 'created' }
  ],
  displayField: 'label',
  shard: { type: 'none' }
};

const DATABASE_TABLE_SCHEMA = {
  id: 'database',
  label: '数据库注册表',
  fields: [
    { id: 'id', type: 'string', label: '标识', required: true },
    { id: 'label', type: 'string', label: '名称' },
    { id: 'createdAt', type: 'datetime', label: '创建时间', autoSet: 'created' }
  ],
  displayField: 'label',
  shard: { type: 'none' }
};

export class SchemaRegistry {
  constructor({ api, notificationBus }) {
    this.api = api;
    this.notificationBus = notificationBus;
    this._tableCache = {};
  }

  // ── System database bootstrap ───────────────────────

  async bootstrapSystemDb() {
    const sysDbExists = await this.api.exists('.database/system');
    if (sysDbExists) return;

    const now = new Date().toISOString();

    await this.api.mkdir('.database/system');
    await this.api.writeJSON('.database/system/db.json', {
      id: 'system',
      label: '系统库',
      tables: [
        { id: 'database', label: '数据库注册表' },
        { id: 'table', label: '表注册表' }
      ],
      created_at: now
    });

    // system.database table
    await this.api.mkdir('.database/system/database');
    await this.api.writeJSON('.database/system/database/schema.json', DATABASE_TABLE_SCHEMA);
    await this.api.writeJSON('.database/system/database/data.json', { records: [] });

    // system.table table
    await this.api.mkdir('.database/system/table');
    await this.api.writeJSON('.database/system/table/schema.json', TABLE_SCHEMA);
    await this.api.writeJSON('.database/system/table/data.json', { records: [] });

    // Register in db.json
    const dbReg = await this._readDbRegistry();
    dbReg.databases.push({ id: 'system', label: '系统库', createdAt: now });
    await this._writeDbRegistry(dbReg);

    // Register system tables in system.table records
    const sysTables = [
      { id: 'database', database: 'system', label: '数据库注册表', shardType: 'none' },
      { id: 'table', database: 'system', label: '表注册表', shardType: 'none' }
    ];
    await this.api.writeJSON('.database/system/table/data.json', {
      records: sysTables.map(t => ({ ...t, createdAt: now }))
    });

    // Register system database in system.database records
    await this.api.writeJSON('.database/system/database/data.json', {
      records: [{ id: 'system', label: '系统库', createdAt: now }]
    });

    this._tableCache = {};
  }

  // ── Database CRUD ───────────────────────────────────

  async listDatabases() {
    const dbReg = await this._readDbRegistry();
    return dbReg.databases || [];
  }

  async createDatabase({ id, label }) {
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new Error(`Invalid database id: "${id}". Use only letters, numbers, hyphens, underscores.`);
    }
    const dbReg = await this._readDbRegistry();
    if (dbReg.databases.find(d => d.id === id)) {
      throw new Error(`Database "${id}" already exists.`);
    }

    await this.api.mkdir(`.database/${id}`);
    const now = new Date().toISOString();
    await this.api.writeJSON(`.database/${id}/db.json`, { id, label, created_at: now });

    dbReg.databases.push({ id, label, createdAt: now });
    await this._writeDbRegistry(dbReg);

    await this._insertSystemRecord('database', { id, label, createdAt: now });

    return { id, label, createdAt: now };
  }

  async deleteDatabase(id) {
    if (id === SYSTEM_DB_ID) {
      throw new Error('System database cannot be deleted.');
    }
    const dbReg = await this._readDbRegistry();
    const idx = dbReg.databases.findIndex(d => d.id === id);
    if (idx === -1) throw new Error(`Database "${id}" not found.`);

    await this.api.delete(`.database/${id}`);

    const removed = dbReg.databases.splice(idx, 1)[0];
    await this._writeDbRegistry(dbReg);

    await this._deleteSystemRecord('database', id);

    return removed;
  }

  async updateDatabase(id, updates) {
    const dbReg = await this._readDbRegistry();
    const entry = dbReg.databases.find(d => d.id === id);
    if (!entry) throw new Error(`Database "${id}" not found.`);

    const updated = { ...entry, ...updates, id };
    dbReg.databases = dbReg.databases.map(d => d.id === id ? updated : d);
    await this._writeDbRegistry(dbReg);

    try {
      const dbMeta = await this.api.readJSON(`.database/${id}/db.json`);
      const updatedMeta = { ...dbMeta, ...updates, id };
      await this.api.writeJSON(`.database/${id}/db.json`, updatedMeta);
    } catch {
    }

    await this._deleteSystemRecord('database', id);
    const now = new Date().toISOString();
    await this._insertSystemRecord('database', { ...updated, createdAt: updated.createdAt || now });

    return updated;
  }

  // ── Table CRUD ──────────────────────────────────────

  async listTables(database) {
    const dbMeta = await this._readDbMeta(database);
    return dbMeta.tables || [];
  }

  async getTable(database, id) {
    const cacheKey = `${database}.${id}`;
    if (this._tableCache[cacheKey]) return this._tableCache[cacheKey];

    try {
      const schema = await this.api.readJSON(`.database/${database}/${id}/schema.json`);
      this._tableCache[cacheKey] = schema;
      return schema;
    } catch {
      return null;
    }
  }

  async createTable(database, { id, label, fields, shardType }) {
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new Error(`Invalid table id: "${id}".`);
    }

    const existing = await this.getTable(database, id);
    if (existing) throw new Error(`Table "${database}.${id}" already exists.`);

    await this.api.mkdir(`.database/${database}/${id}`);
    const schema = {
      id,
      label: label || id,
      fields: fields || [{ id: 'id', type: 'uuid', label: 'ID', required: true }],
      displayField: 'label',
      shard: { type: shardType || 'none' }
    };
    await this.api.writeJSON(`.database/${database}/${id}/schema.json`, schema);
    await this.api.writeJSON(`.database/${database}/${id}/data.json`, { records: [] });

    const dbMeta = await this._readDbMeta(database);
    dbMeta.tables = dbMeta.tables || [];
    dbMeta.tables.push({ id, label: schema.label, fieldCount: (schema.fields || []).length });
    await this._writeDbMeta(database, dbMeta);

    const now = new Date().toISOString();
    await this._insertSystemRecord('table', {
      id, database, label: schema.label,
      shardType: shardType || 'none', createdAt: now
    });

    this._tableCache[`${database}.${id}`] = schema;
    return schema;
  }

  async updateTable(database, id, updates) {
    const schema = await this.getTable(database, id);
    if (!schema) throw new Error(`Table "${database}.${id}" not found.`);

    const updated = { ...schema, ...updates, id };
    updated.fields = updates.fields !== undefined ? updates.fields : schema.fields;
    await this.api.writeJSON(`.database/${database}/${id}/schema.json`, updated);
    this._tableCache[`${database}.${id}`] = updated;

    try {
      const dbMeta = await this._readDbMeta(database);
      const tblEntry = (dbMeta.tables || []).find(t => t.id === id);
      if (tblEntry) {
        tblEntry.fieldCount = (updated.fields || []).length;
        await this._writeDbMeta(database, dbMeta);
      }
    } catch {
    }

    return updated;
  }

  async deleteTable(database, id) {
    if (database === SYSTEM_DB_ID) {
      throw new Error('System table cannot be deleted.');
    }

    await this.api.delete(`.database/${database}/${id}`);

    const dbMeta = await this._readDbMeta(database);
    dbMeta.tables = (dbMeta.tables || []).filter(t => t.id !== id);
    await this._writeDbMeta(database, dbMeta);

    await this._deleteSystemRecordByFilter('table', r => r.id === id && r.database === database);

    delete this._tableCache[`${database}.${id}`];
  }

  // ── Internal helpers ────────────────────────────────

  async _readDbRegistry() {
    try {
      return await this.api.readJSON(DB_FILE);
    } catch {
      return { databases: [] };
    }
  }

  async _writeDbRegistry(data) {
    await this.api.writeJSON(DB_FILE, data);
  }

  async _readDbMeta(database) {
    try {
      return await this.api.readJSON(`.database/${database}/db.json`);
    } catch {
      return { id: database, tables: [] };
    }
  }

  async _writeDbMeta(database, data) {
    await this.api.writeJSON(`.database/${database}/db.json`, data);
  }

  async _insertSystemRecord(table, record) {
    try {
      const data = await this.api.readJSON(`.database/system/${table}/data.json`);
      data.records = data.records || [];
      data.records.push(record);
      await this.api.writeJSON(`.database/system/${table}/data.json`, data);
    } catch {
      // system table might not exist yet during bootstrap
    }
  }

  async _deleteSystemRecord(table, id) {
    try {
      const data = await this.api.readJSON(`.database/system/${table}/data.json`);
      data.records = (data.records || []).filter(r => r.id !== id);
      await this.api.writeJSON(`.database/system/${table}/data.json`, data);
    } catch {
      // ignore
    }
  }

  async _deleteSystemRecordByFilter(table, predicate) {
    try {
      const data = await this.api.readJSON(`.database/system/${table}/data.json`);
      data.records = (data.records || []).filter(r => !predicate(r));
      await this.api.writeJSON(`.database/system/${table}/data.json`, data);
    } catch {
      // ignore
    }
  }
}
