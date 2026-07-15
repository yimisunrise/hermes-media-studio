export const initDef = {
  name: 'schema-registry',
  version: '1.0.0',
  label: '初始化核心数据库',
  required: true,
  dependsOn: ['orchestrator-core'],
  handler: async (ctx) => {
    const { api, schemaRegistry, onProgress } = ctx;

    onProgress('初始化系统数据库...');
    await schemaRegistry.bootstrapSystemDb();

  }
};
