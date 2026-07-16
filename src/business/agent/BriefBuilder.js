/**
 * BriefBuilder — 将 task record 转为 Agent 任务简报
 *
 * 职责：
 * 1. 从 DataRepository 返回的 task record 中提取字段
 * 2. 生成 job.json 载荷（机器索引）
 * 3. 生成 brief.md 文本（LLM/人类可读，YAML frontmatter + Markdown 正文）
 *
 * 调用链：AgentHandler.submitTask() → BriefBuilder.build() → AgentTaskPoller.createTask()
 */
export class BriefBuilder {
  /**
   * 将 task record 编译为 job 元数据和 brief 文本
   * @param {Object} taskRecord - DataRepository.create() 返回的完整记录
   * @param {string} taskRecord.id
   * @param {string} taskRecord.topicId
   * @param {string} taskRecord.taskType - 'media' | 'copywriting'
   * @param {string} [taskRecord.title]
   * @param {string} [taskRecord.prompt]
   * @param {string} [taskRecord.createdAt]
   * @returns {{ job: Object, brief: string }}
   */
  static build(taskRecord) {
    const job = {
      type: taskRecord.taskType,
      taskId: taskRecord.id,
      status: 'pending',
      createdAt: taskRecord.createdAt || new Date().toISOString()
    };

    // YAML frontmatter: 转义冒号和换行防止 frontmatter 解析异常
    const safe = (s) => (s || '').replace(/[\n:]/g, ' ');
    const brief = `---
title: ${safe(taskRecord.title)}
topicId: ${safe(taskRecord.topicId)}
taskType: ${safe(taskRecord.taskType)}
---

${taskRecord.prompt || '(无简报内容)'}`;

    return { job, brief };
  }
}
