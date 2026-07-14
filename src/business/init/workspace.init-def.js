/**
 * Workspace — Directory structure init-def
 *
 * Creates the essential workspace directory structure.
 * Extracted from app.js DIRS_TO_CREATE.
 */

const DIRS_TO_CREATE = [
  'configs/themes',
  'configs/platforms',
  'configs/workflows',
  'assets',
  'tasks',
  'copywriting',
  '.system',
  '.trash',
  '.index'
];

export const initDef = {
  name: 'workspace',
  version: '1.0.0',
  label: '创建工作空间目录',
  required: true,
  dependsOn: ['orchestrator-core'],
  handler: async (ctx) => {
    for (const dir of DIRS_TO_CREATE) {
      ctx.onProgress(`创建 ${dir}/`);
      await ctx.api.mkdir(dir);
    }
  }
};
