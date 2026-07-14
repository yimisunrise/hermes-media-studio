/**
 * Configs — Default configuration init-def
 *
 * Writes default configuration files like task-lifecycle.json.
 * Extracted from app.js seed-configs step.
 */

export const initDef = {
  name: 'configs',
  version: '1.0.0',
  label: '初始化默认配置',
  required: false,
  dependsOn: ['workspace'],
  handler: async (ctx) => {
    const { api, onProgress } = ctx;

    onProgress('检查配置文件...');
    const exists = await api.exists('configs/workflows/task-lifecycle.json');
    if (!exists) {
      onProgress('创建默认任务生命周期配置...');
      await api.writeJSON('configs/workflows/task-lifecycle.json', {
        media: {
          label: '素材任务',
          states: ['initialized', 'generating', 'pending_review', 'approved', 'rejected'],
          kanban_states: ['generating', 'pending_review', 'approved'],
          transitions: {
            initialized: ['generating'],
            generating: ['pending_review'],
            pending_review: ['approved', 'rejected']
          },
          final_states: ['approved', 'rejected'],
          color: '#4a90d9'
        }
      });
    }
  }
};
