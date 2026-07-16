/**
 * agent — Agent 任务通信业务层
 *
 * 导出：
 * - BriefBuilder: 将 task record 编译为 job + brief
 * - AgentHandler: 提交 Agent 模式任务的门面，管理状态同步生命周期
 * - AgentStatusSync: Agent 状态同步轮询器
 */
export { BriefBuilder } from './BriefBuilder.js';
export { AgentHandler } from './AgentHandler.js';
export { AgentStatusSync } from './AgentStatusSync.js';
