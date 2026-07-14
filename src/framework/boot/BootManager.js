/**
 * BootManager — 引导状态管理
 *
 * 管理 .system/boot.json 的读写和首次引导检测。
 * 从 SchemaRegistry 剥离，独立负责引导生命周期。
 */
import { uuid } from '../utils/meta.js';

const BOOT_FILE = '.system/boot.json';

const BOOT_DEFAULTS = {
  boot_id: '',
  init_state: 'pending',
  created_at: '',
  updated_at: '',
  version: '2.0.0'
};

export class BootManager {
  constructor({ api }) {
    this.api = api;
  }

  async readBoot() {
    try {
      return await this.api.readJSON(BOOT_FILE);
    } catch {
      return { ...BOOT_DEFAULTS };
    }
  }

  async writeBoot(data) {
    const current = await this.readBoot();
    const payload = { ...current, ...data, updated_at: new Date().toISOString() };
    if (data.steps) {
      payload.steps = { ...(current.steps || {}), ...data.steps };
    }
    await this.api.writeJSON(BOOT_FILE, payload);
    return payload;
  }

  /** 记录单个步骤状态到 boot.json（旧版兼容） */
  async writeStepStatus(stepName, status) {
    return this.writeBoot({
      steps: { [stepName]: { status, completedAt: new Date().toISOString() } }
    });
  }

  async isFirstBoot() {
    const boot = await this.readBoot();
    return boot.init_state === 'pending';
  }

  async markBootComplete() {
    const now = new Date().toISOString();
    await this.writeBoot({
      boot_id: uuid(),
      init_state: 'done',
      created_at: now
    });
  }
}
