export const initDef = {
  name: 'business-db',
  version: '1.0.0',
  label: '创建业务数据库',
  required: true,
  dependsOn: ['schema-registry'],
  handler: async (ctx) => {
    const { api, schemaRegistry, onProgress } = ctx;

    onProgress('创建业务数据库...');
    const db = await schemaRegistry.createDatabase({ id: 'business', label: '业务库' });

    onProgress('注册主题表...');
    await schemaRegistry.createTable('business', {
      id: 'themes',
      label: '主题',
      fields: [
        { id: 'id', type: 'uuid', isId: true },
        { id: 'name', type: 'string', label: '主题名称', required: true },
        { id: 'description', type: 'text', label: '风格描述' },
        { id: 'tags', type: 'array', label: '标签', items: { type: 'string' } },
        { id: 'aspectRatio', type: 'string', label: '画面比例', defaultValue: '9:16' },
        { id: 'color', type: 'string', label: '主题色' },
        { id: 'status', type: 'enum', label: '状态', enum: ['active', 'archived'], defaultValue: 'active' },
        { id: 'createdAt', type: 'datetime', autoSet: 'created' },
        { id: 'updatedAt', type: 'datetime', autoSet: 'updated' }
      ],
      shardType: 'none'
    });

    onProgress('注册灵感表...');
    await schemaRegistry.createTable('business', {
      id: 'ideas',
      label: '灵感',
      fields: [
        { id: 'id', type: 'uuid', isId: true },
        { id: 'title', type: 'string', label: '灵感标题' },
        { id: 'summary', type: 'text', label: '灵感描述' },
        { id: 'themeId', type: 'reference', label: '关联主题', ref: { database: 'business', table: 'themes' } },
        { id: 'tags', type: 'array', label: '标签', items: { type: 'string' } },
        { id: 'refLinks', type: 'array', label: '参考链接', items: { type: 'string' } },
        { id: 'status', type: 'enum', label: '状态', enum: ['active', 'used', 'archived'], defaultValue: 'active' },
        { id: 'createdAt', type: 'datetime', autoSet: 'created' },
        { id: 'updatedAt', type: 'datetime', autoSet: 'updated' }
      ],
      shardType: 'none'
    });

    onProgress('注册选题表...');
    await schemaRegistry.createTable('business', {
      id: 'topics',
      label: '选题',
      fields: [
        { id: 'id', type: 'uuid', isId: true },
        { id: 'ideaId', type: 'reference', label: '来源灵感', ref: { database: 'business', table: 'ideas' } },
        { id: 'themeId', type: 'reference', label: '关联主题', ref: { database: 'business', table: 'themes' } },
        { id: 'title', type: 'string', label: '选题标题', required: true },
        { id: 'contentType', type: 'enum', label: '内容形态', enum: ['graphic', 'video', 'text'] },
        { id: 'dueDate', type: 'datetime', label: '截止日期' },
        { id: 'status', type: 'enum', label: '状态', enum: ['draft', 'in_progress', 'completed', 'cancelled'], defaultValue: 'draft' },
        { id: 'createdAt', type: 'datetime', autoSet: 'created' },
        { id: 'updatedAt', type: 'datetime', autoSet: 'updated' }
      ],
      shardType: 'none'
    });

    onProgress('业务数据库就绪');
  }
};
