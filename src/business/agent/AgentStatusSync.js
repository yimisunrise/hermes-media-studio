import { repo } from '../data/index.js';

export class AgentStatusSync {
  constructor({ poller, schemaRegistry, onStatusChange }) {
    this._poller = poller;
    this._tasksRepo = repo(poller.api, schemaRegistry, 'tasks');
    this._onStatusChange = onStatusChange;
    this._timer = null;
    this._busy = false;
  }

  start(intervalMs = 5000) {
    this.stop();
    this._timer = setInterval(() => this._sync(), intervalMs);
    this._sync();
  }

  stop() {
    if (this._timer !== null) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  async _sync() {
    if (this._busy) return;
    this._busy = true;
    try {
      const changed = await this._poll();
      if (changed > 0 && this._onStatusChange) {
        this._onStatusChange(changed);
      }
    } catch (e) {
      console.error('[AgentStatusSync] 轮询异常:', e);
    } finally {
      this._busy = false;
    }
  }

  async _poll() {
    const index = await this._poller.readIndex();
    const result = await this._tasksRepo.find({ filter: { mode: 'agent' } });
    const tasks = result.records || [];
    let changed = 0;

    for (const task of tasks) {
      const uuid = task.id;
      const entry = index.tasks[uuid];
      if (!entry) continue;

      if (task.status === 'pending' && entry.status === 'generating') {
        await this._tasksRepo.update(uuid, { status: 'generating' });
        changed++;
      }

      if (task.status === 'generating' && entry.status === 'done') {
        const resultText = await this._poller.readResult(uuid);
        await this._tasksRepo.update(uuid, {
          status: 'review',
          resultSummary: resultText ? resultText.slice(0, 500) : ''
        });
        changed++;
      }
    }

    return changed;
  }
}
