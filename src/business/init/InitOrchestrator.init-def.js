export const initDef = {
  name: 'orchestrator-core',
  version: '1.0.0',
  label: '初始化框架核心',
  required: true,
  dependsOn: [],
  handler: async (ctx) => {
    ctx.onProgress('创建标记目录...');
    await ctx.api.mkdir('.system/init');
  }
};
