export const initDef = {
  name: 'schema-registry',
  version: '1.0.0',
  label: '初始化核心数据库',
  required: true,
  dependsOn: ['workspace'],
  handler: async (ctx) => {
    const { api, schemaRegistry, onProgress } = ctx;

    onProgress('初始化系统数据库...');
    await schemaRegistry.bootstrapSystemDb();

    onProgress('创建主数据库...');
    await api.mkdir('.database/main');
    const now = new Date().toISOString();
    await api.writeJSON('.database/main/db.json', {
      id: 'main', label: '主库', tables: [], created_at: now
    });

    let dbReg;
    try {
      dbReg = await api.readJSON('.database/databases.json');
    } catch {
      dbReg = { databases: [] };
    }
    dbReg.databases.push({ id: 'main', label: '主库', createdAt: now });
    await api.writeJSON('.database/databases.json', dbReg);
  }
};
