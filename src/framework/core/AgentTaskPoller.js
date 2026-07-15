const AGENT_DIR = '.agent';

export class AgentTaskPoller {
  constructor({ api }) {
    this.api = api;
  }

  // ── 传输层：任务队列扫描 ──

  async scan() {
    const tasks = [];
    try {
      const entries = await this.api.tree(`${AGENT_DIR}/tasks`);
      const list = Array.isArray(entries) ? entries : [];
      for (const entry of list) {
        if (entry.type === 'dir' || !entry.name.includes('.')) {
          const uuid = entry.name;
          try {
            const job = await this.api.readJSON(`${AGENT_DIR}/tasks/${uuid}/job.json`);
            tasks.push({ uuid, job, dir: `${AGENT_DIR}/tasks/${uuid}` });
          } catch {
            continue;
          }
        }
      }
    } catch {
      // tasks dir may not exist
    }
    return tasks;
  }

  isPendingTask(task) {
    return task && task.job && task.job.status === 'pending';
  }

  // ── 传输层：任务拾取（防重复） ──

  async pickup(uuid) {
    const src = `${AGENT_DIR}/tasks/${uuid}`;
    const dst = `${AGENT_DIR}/processing/${uuid}`;

    try {
      // Check if source exists
      await this.api.tree(src);

      // Move (cross-directory via rename API)
      const srcParent = `${AGENT_DIR}/tasks`;
      const dstParent = `${AGENT_DIR}/processing`;
      await this.api.mkdir(dstParent);
      await this.api.rename(`${srcParent}/${uuid}`, `${dstParent}/${uuid}`);
      return true;
    } catch {
      return false;
    }
  }

  // ── 传输层：任务创建 ──

  async createTask(type, briefContent, files = []) {
    // 1. 生成 UUID
    const uuid = crypto.randomUUID();

    // 2. 创建任务目录
    const taskDir = `${AGENT_DIR}/tasks/${uuid}`;
    const filesDir = `${taskDir}/files`;

    try {
      await this.api.mkdir(taskDir);

      // 3. 写入 job.json（薄元数据）
      await this.api.writeJSON(`${taskDir}/job.json`, {
        type,
        taskId: uuid,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // 4. 写入 brief.md
      await this.api.write(`${taskDir}/brief.md`, briefContent);

      // 5. 复制附件（可选）
      if (files.length > 0) {
        await this.api.mkdir(filesDir);
        for (const filePath of files) {
          try {
            const name = filePath.split('/').pop() || filePath.split('\\').pop();
            await this.api.copy(filePath, `${filesDir}/${name}`);
          } catch {
            // skip individual file copy failure
          }
        }
      }

      return uuid;
    } catch (err) {
      // 任何步骤失败，清理整个任务目录
      try {
        await this.api.delete(taskDir);
      } catch {
        // cleanup failure is non-fatal
      }
      throw err;
    }
  }

  // ── 传输层：结果阶段标记（仅创建目录 + 清理 processing） ──

  async stageResult(uuid) {
    try {
      await this.api.mkdir(`${AGENT_DIR}/results/${uuid}`);
    } catch {
      return false;
    }

    // Cleanup processing directory
    try {
      await this.api.delete(`${AGENT_DIR}/processing/${uuid}`);
    } catch {
      // may already be cleaned up
    }

    return true;
  }

  // ── 传输层：结果采集（返回原始文本，不解析） ──

  async collect() {
    const results = [];
    try {
      const entries = await this.api.tree(`${AGENT_DIR}/results`);
      const list = Array.isArray(entries) ? entries : [];
      for (const entry of list) {
        if (entry.type === 'dir' || !entry.name.includes('.')) {
          const uuid = entry.name;
          try {
            const resultText = await this.api.read(`${AGENT_DIR}/results/${uuid}/result.md`);
            results.push({ uuid, resultText });

            // Collect-and-clean: remove the result directory after reading
            try {
              await this.api.delete(`${AGENT_DIR}/results/${uuid}`);
            } catch {
              // cleanup failure is non-fatal
            }
          } catch {
            continue;
          }
        }
      }
    } catch {
      // results dir may not exist
    }
    return results;
  }

  // ── 传输层：单个结果读取 ──

  async readResult(uuid) {
    try {
      return await this.api.read(`${AGENT_DIR}/results/${uuid}/result.md`);
    } catch {
      return null;
    }
  }
}
