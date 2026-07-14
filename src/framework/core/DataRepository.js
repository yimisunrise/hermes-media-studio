function newId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function now() {
  return new Date().toISOString();
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export class DataRepository {
  constructor({ api, schemaRegistry, database, tableName }) {
    this.api = api;
    this.schemaRegistry = schemaRegistry;
    this.database = database;
    this.tableName = tableName;
    this._schema = null;
  }

  static for(api, schemaRegistry, database, tableName) {
    return new DataRepository({ api, schemaRegistry, database, tableName });
  }

  async _ensureSchema() {
    if (!this._schema) {
      this._schema = await this.schemaRegistry.getTable(this.database, this.tableName);
      if (!this._schema) throw new Error(`Table "${this.database}.${this.tableName}" not found.`);
    }
    return this._schema;
  }

  _tablePath() {
    return `.database/${this.database}/${this.tableName}`;
  }

  _dataPath(month) {
    return month ? `${this._tablePath()}/data-${month}.json` : `${this._tablePath()}/data.json`;
  }

  async _readData(month) {
    const path = this._dataPath(month);
    try {
      return await this.api.readJSON(path);
    } catch {
      return { records: [] };
    }
  }

  async _writeData(data, month) {
    const path = this._dataPath(month);
    await this.api.writeJSON(path, data);
  }

  async _allShardPaths() {
    const schema = await this._ensureSchema();
    if (schema.shard.type !== 'monthly') return [null];

    const paths = [null];
    try {
      const entries = await this.api.tree(this._tablePath());
      const files = Array.isArray(entries) ? entries : [];
      for (const f of files) {
        const match = f.name && f.name.match(/^data-(\d{6})\.json$/);
        if (match) paths.push(match[1]);
      }
    } catch {
    }
    return [...new Set(paths)];
  }

  _applyDefaults(record, schema) {
    const result = { ...record };
    if (schema.fields) {
      for (const field of schema.fields) {
        if (result[field.id] === undefined && field.defaultValue !== undefined) {
          result[field.id] = field.defaultValue;
        }
      }
    }
    return result;
  }

  _filterRecord(record, filter) {
    if (!filter || Object.keys(filter).length === 0) return true;
    for (const [key, val] of Object.entries(filter)) {
      if (record[key] !== val) return false;
    }
    return true;
  }

  _sortRecords(records, sort) {
    if (!sort) return records;
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    return [...records].sort((a, b) => {
      const va = a[field], vb = b[field];
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'string') return desc ? vb.localeCompare(va) : va.localeCompare(vb);
      return desc ? vb - va : va - vb;
    });
  }

  async get(id) {
    const shards = await this._allShardPaths();
    for (const month of shards) {
      const data = await this._readData(month);
      const record = (data.records || []).find(r => r.id === id);
      if (record) return record;
    }
    return null;
  }

  async find({ filter, sort, page, limit } = {}) {
    const shards = await this._allShardPaths();
    let records = [];

    for (const month of shards) {
      const data = await this._readData(month);
      records = records.concat(data.records || []);
    }

    if (filter) records = records.filter(r => this._filterRecord(r, filter));
    if (sort) records = this._sortRecords(records, sort);

    const total = records.length;

    if (page && limit) {
      const start = (page - 1) * limit;
      records = records.slice(start, start + limit);
    }

    return { records, total, page: page || 1 };
  }

  async create(data) {
    const schema = await this._ensureSchema();
    const record = this._applyDefaults({ ...data }, schema);

    if (!record.id) {
      record.id = newId();
    }

    if (!record.createdAt) record.createdAt = now();
    record.updatedAt = now();

    const month = schema.shard.type === 'monthly' ? currentMonth() : null;
    const store = await this._readData(month);
    store.records = store.records || [];
    store.records.push(record);
    await this._writeData(store, month);

    return record;
  }

  async update(id, patch) {
    const shards = await this._allShardPaths();
    for (const month of shards) {
      const data = await this._readData(month);
      const idx = (data.records || []).findIndex(r => r.id === id);
      if (idx !== -1) {
        data.records[idx] = { ...data.records[idx], ...patch, id, updatedAt: now() };
        await this._writeData(data, month);
        return data.records[idx];
      }
    }
    return null;
  }

  async delete(id) {
    const shards = await this._allShardPaths();
    for (const month of shards) {
      const data = await this._readData(month);
      const idx = (data.records || []).findIndex(r => r.id === id);
      if (idx !== -1) {
        data.records.splice(idx, 1);
        await this._writeData(data, month);
        return true;
      }
    }
    return false;
  }

  async count(filter) {
    const result = await this.find({ filter });
    return result.total;
  }
}
