/**
 * 创建业务表（幂等）
 * 版本升级到 1.1.0：每次重新执行时跳过已存在的表，并创建 .agent/ 目录结构
 */
async function _ensureTable(sr, db, tableDef) {
  const existing = await sr.getTable(db, tableDef.id);
  if (existing) return;
  await sr.createTable(db, tableDef);
}

async function _ensureAgentDirs(api) {
  try {
    await api.mkdir('.agent-tasks');
    await api.writeJSON('.agent-tasks/index.json', { version: 1, processing: null, tasks: {} });
  } catch {}
}

const TABLE_DEFS = [
  {
    id: 'themes', label: '主题',
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
  },
  {
    id: 'ideas', label: '灵感',
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
  },
  {
    id: 'topics', label: '选题',
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
  },
  {
    id: 'tasks', label: '任务',
    fields: [
      { id: 'id', type: 'uuid', isId: true },
      { id: 'topicId', type: 'reference', label: '关联选题', ref: { database: 'business', table: 'topics' } },
      { id: 'title', type: 'string', label: '任务标题', required: true },
      { id: 'taskType', type: 'enum', label: '任务类型', enum: ['media', 'copywriting'] },
        { id: 'status', type: 'enum', label: '状态', enum: ['pending', 'generating', 'review', 'approved', 'rejected', 'closed', 'archived'], defaultValue: 'pending' },
      { id: 'prompt', type: 'text', label: '创作提示词' },
      { id: 'mode', type: 'enum', label: '模式', enum: ['manual', 'agent'], defaultValue: 'manual' },
      { id: 'resultSummary', type: 'text', label: '结果摘要' },
      { id: 'createdAt', type: 'datetime', autoSet: 'created' },
      { id: 'updatedAt', type: 'datetime', autoSet: 'updated' }
    ],
    shardType: 'monthly'
  },
  {
    id: 'assets', label: '素材',
    fields: [
      { id: 'id', type: 'uuid', isId: true },
      { id: 'taskId', type: 'reference', label: '关联任务', ref: { database: 'business', table: 'tasks' } },
      { id: 'type', type: 'enum', label: '素材类型', enum: ['image', 'video', 'audio'] },
      { id: 'url', type: 'string', label: '访问 URL' },
      { id: 'filePath', type: 'string', label: '文件路径' },
      { id: 'thumbnail', type: 'string', label: '缩略图 URL' },
      { id: 'metadata', type: 'json', label: '扩展元数据' },
      { id: 'status', type: 'enum', label: '状态', enum: ['generating', 'completed', 'failed'], defaultValue: 'generating' },
      { id: 'createdAt', type: 'datetime', autoSet: 'created' },
      { id: 'updatedAt', type: 'datetime', autoSet: 'updated' }
    ],
    shardType: 'monthly'
  },
  {
    id: 'contents', label: '文稿',
    fields: [
      { id: 'id', type: 'uuid', isId: true },
      { id: 'taskId', type: 'reference', label: '关联任务', ref: { database: 'business', table: 'tasks' } },
      { id: 'topicId', type: 'reference', label: '关联选题', ref: { database: 'business', table: 'topics' } },
      { id: 'version', type: 'integer', label: '版本号', defaultValue: 1 },
      { id: 'title', type: 'string', label: '文稿标题' },
      { id: 'content', type: 'text', label: '文稿内容(Markdown)' },
      { id: 'status', type: 'enum', label: '状态', enum: ['draft', 'finalized', 'archived'], defaultValue: 'draft' },
      { id: 'createdAt', type: 'datetime', autoSet: 'created' },
      { id: 'updatedAt', type: 'datetime', autoSet: 'updated' }
    ],
    shardType: 'none'
  }
];

export const initDef = {
  name: 'business-db',
  version: '1.2.0',
  label: '创建业务数据库',
  required: true,
  dependsOn: ['schema-registry'],
  handler: async (ctx) => {
    const { api, schemaRegistry, onProgress } = ctx;

    onProgress('创建业务数据库...');
    const db = 'business';
    const dbs = await schemaRegistry.listDatabases();
    if (!dbs.find(d => d.id === db)) {
      await schemaRegistry.createDatabase({ id: db, label: '业务库' });
    }

    for (const def of TABLE_DEFS) {
      onProgress(`注册${def.label}表...`);
      await _ensureTable(schemaRegistry, db, def);
    }

    onProgress('准备 Agent 通信目录...');
    await _ensureAgentDirs(api);

    onProgress('业务数据库就绪');
  }
};
