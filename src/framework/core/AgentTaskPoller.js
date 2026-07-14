const AGENT_DIR = '.agent';

export class AgentTaskPoller {
  constructor({ api }) {
    this.api = api;
  }

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

  async deliver(uuid, result, files = []) {
    const resultDir = `${AGENT_DIR}/results/${uuid}`;

    // Create result directory
    await this.api.mkdir(resultDir);

    // Write result.json
    await this.api.writeJSON(`${resultDir}/result.json`, {
      uuid,
      result,
      files,
      delivered_at: new Date().toISOString()
    });

    // Cleanup processing directory
    try {
      await this.api.delete(`${AGENT_DIR}/processing/${uuid}`);
    } catch {
      // may already be cleaned up
    }

    return true;
  }

  async collect() {
    const results = [];
    try {
      const entries = await this.api.tree(`${AGENT_DIR}/results`);
      const list = Array.isArray(entries) ? entries : [];
      for (const entry of list) {
        if (entry.type === 'dir' || !entry.name.includes('.')) {
          const uuid = entry.name;
          try {
            const resultData = await this.api.readJSON(`${AGENT_DIR}/results/${uuid}/result.json`);
            results.push({
              uuid,
              result: resultData.result,
              files: resultData.files || [],
              delivered_at: resultData.delivered_at
            });

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

  isPendingTask(task) {
    return task && task.job && task.job.status === 'pending';
  }
}
