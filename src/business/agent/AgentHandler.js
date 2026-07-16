import { AgentTaskPoller } from '../../framework/core/AgentTaskPoller.js';
import { BriefBuilder } from './BriefBuilder.js';
import { AgentStatusSync } from './AgentStatusSync.js';

export class AgentHandler {
  constructor({ api, schemaRegistry }) {
    this._poller = new AgentTaskPoller({ api });
    this._sync = new AgentStatusSync({ poller: this._poller, schemaRegistry });
  }

  startSync(onStatusChange, intervalMs = 5000) {
    this._sync._onStatusChange = onStatusChange;
    this._sync.start(intervalMs);
  }

  stopSync() {
    this._sync.stop();
  }

  async submitTask(taskRecord) {
    const { job, brief } = BriefBuilder.build(taskRecord);
    const uuid = await this._poller.createTask(job.type, brief, [], taskRecord.id);
    return uuid;
  }
}
