import { shortId } from '../utils/meta.js';

const AGENT_TASKS_DIR = '.agent-tasks';

function _defaultIndex() {
  return { version: 1, processing: null, tasks: {} };
}

export class AgentTaskPoller {
  constructor({ api }) {
    this.api = api;
  }

  // ── 索引管理 ──

  async readIndex() {
    try {
      return await this.api.readJSON(`${AGENT_TASKS_DIR}/index.json`);
    } catch {
      return _defaultIndex();
    }
  }

  async writeIndex(data) {
    const tmp = `${AGENT_TASKS_DIR}/index.tmp`;
    const target = `${AGENT_TASKS_DIR}/index.json`;
    await this.api.writeJSON(tmp, data);
    try { await this.api.delete(target); } catch {}
    await this.api.rename(tmp, target);
  }

  async updateTaskStatus(uuid, status) {
    const index = await this.readIndex();
    const now = new Date().toISOString();

    if (!index.tasks[uuid]) {
      index.tasks[uuid] = { status: 'pending', createdAt: now, pickedAt: null, completedAt: null };
    }

    index.tasks[uuid].status = status;

    if (status === 'generating') {
      index.tasks[uuid].pickedAt = now;
      index.processing = uuid;
    } else if (status === 'done' || status === 'failed') {
      index.tasks[uuid].completedAt = now;
      index.processing = null;
    }

    await this.writeIndex(index);
  }

  // ── 任务创建 ──

  async createTask(type, briefContent, files = [], taskId) {
    const uuid = taskId || shortId();
    const taskDir = `${AGENT_TASKS_DIR}/${uuid}`;
    const filesDir = `${taskDir}/files`;

    try {
      await this.api.mkdir(taskDir);

      await this.api.writeJSON(`${taskDir}/job.json`, {
        type,
        taskId: uuid,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      await this.api.write(`${taskDir}/brief.md`, briefContent);

      if (files.length > 0) {
        await this.api.mkdir(filesDir);
        for (const filePath of files) {
          try {
            const name = filePath.split('/').pop() || filePath.split('\\').pop();
            await this.api.copy(filePath, `${filesDir}/${name}`);
          } catch {}
        }
      }

      const index = await this.readIndex();
      index.tasks[uuid] = {
        status: 'pending',
        type,
        createdAt: new Date().toISOString(),
        pickedAt: null,
        completedAt: null
      };
      await this.writeIndex(index);

      return uuid;
    } catch (err) {
      try { await this.api.delete(taskDir); } catch {}
      throw err;
    }
  }

  // ── 读取任务文件 ──

  async readBrief(uuid) {
    try {
      return await this.api.read(`${AGENT_TASKS_DIR}/${uuid}/brief.md`);
    } catch {
      return null;
    }
  }

  async readResult(uuid) {
    try {
      return await this.api.read(`${AGENT_TASKS_DIR}/${uuid}/result.md`);
    } catch {
      return null;
    }
  }

  // ── 写入结果 ──

  async writeResult(uuid, resultContent) {
    const taskDir = `${AGENT_TASKS_DIR}/${uuid}`;
    await this.api.write(`${taskDir}/result.md`, resultContent);
    await this.updateTaskStatus(uuid, 'done');
  }
}
