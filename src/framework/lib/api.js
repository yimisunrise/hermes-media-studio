/**
 * Workspace API Client for Media Studio Extension
 * Uses Hermes WebUI's file API with session-based authentication.
 */

import { DataRepository } from '../core/DataRepository.js';

const ENDPOINT_MAP = {
  list: '/api/list',
  file: '/api/file',
  save: '/api/file/save',
  create: '/api/file/create',
  createDir: '/api/file/create-dir',
  delete: '/api/file/delete',
  rename: '/api/file/rename',
  move: '/api/file/move'
};

class WorkspaceAPI {
  constructor() {
    this.ready = false;
    this._sessionId = null;
    this._workspacePath = null;
    this._usingStandaloneSession = false;
    this._schemaRegistry = null;
    this._themeRepo = null;
    this._ideaRepo = null;
    this._topicRepo = null;
  }

  /** Set SchemaRegistry reference after initialization (called by bootstrap). */
  setSchemaRegistry(sr) {
    this._schemaRegistry = sr;
  }

  /** Current session ID from WebUI global state.
    *  Always reads from S.session — same workspace may have different chat sessions
    *  with distinct session_ids. Falls back to last known value when unavailable.
    *
    *  When _usingStandaloneSession is true, returns the standalone session id
    *  (created by tryRefreshSession) instead of S.session.session_id, because
    *  S.session may still hold a stale value during session refresh. */
  get sessionId() {
    if (this._usingStandaloneSession) return this._sessionId;
    if (S?.session?.session_id) {
      this._sessionId = S.session.session_id;
      return this._sessionId;
    }
    return this._sessionId;
  }

  /** Current workspace absolute path.
   *  Always reads from S.session to reflect workspace switches. Falls back to
   *  last known value when unavailable. */
  get workspacePath() {
    if (S?.session?.workspace) {
      this._workspacePath = S.session.workspace;
      return this._workspacePath;
    }
    return this._workspacePath;
  }

  /** Read session_id and workspace from global S object */
  detectWorkspace() {
    if (S?.session) {
      this._sessionId = S.session.session_id || null;
      this._workspacePath = S.session.workspace || null;
      this._usingStandaloneSession = false;
      return true;
    }
    return false;
  }

  /** Wait for S.session to become available (async WebUI boot).
   *  WebUI nulls S.session for 0-message sessions (empty state).
   *  In that case, create a standalone session for API calls. */
  async _waitForSession(timeout = 8000) {
    if (S?.session?.session_id) {
      this.detectWorkspace();
      return true;
    }
    const start = Date.now();
    while (Date.now() - start < timeout) {
      await new Promise(r => setTimeout(r, 150));
      if (S?.session?.session_id) {
        this.detectWorkspace();
        return true;
      }
      // WebUI boot finished but S.session is null (empty state / 0-msg session).
      // Create our own session so extension operations have a valid session_id.
      if (typeof S !== 'undefined' && S && S._bootReady) {
        try {
          const ok = await this._createStandaloneSession();
          if (ok) return true;
        } catch (e) {
          console.warn('[MediaStudio] session creation attempt failed:', e);
        }
      }
    }
    return false;
  }

  /** Create a standalone session via API when WebUI has no active session. */
  async _createStandaloneSession() {
    const resp = await fetch('/api/session/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await resp.json();
    if (data?.session?.session_id) {
      this._sessionId = data.session.session_id;
      this._workspacePath = data.session.workspace || null;
      this._usingStandaloneSession = true;
      return true;
    }
    return false;
  }

  /** Build workspace-relative path under media-studio/ */
  _buildPath(relPath) {
    return relPath ? `media-studio/${relPath}` : 'media-studio';
  }

  /**
   * Build asset path under assets/{YYYY}/{MM}/{DD}/{theme}__{HHmmss}__{seq}.{ext}
   * @param {string} theme - theme name
   * @param {string} timestamp - ISO timestamp or Date string
   * @param {number|string} seq - sequence number
   * @param {string} ext - file extension (without dot)
   * @returns {string} relative path under media-studio/
   */
  _buildAssetPath(theme, timestamp, seq, ext) {
    const d = new Date(timestamp);
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    const hhmmss = `${hh}${min}${ss}`;
    const seqStr = String(seq).padStart(3, '0');
    return `assets/${yyyy}/${mm}/${dd}/${theme}__${hhmmss}__${seqStr}.${ext}`;
  }

  /** Build GET URL with session_id and path */
  _getUrl(endpoint, relPath) {
    const fullPath = this._buildPath(relPath);
    return `${ENDPOINT_MAP[endpoint]}?session_id=${encodeURIComponent(this.sessionId)}&path=${encodeURIComponent(fullPath)}`;
  }

  /** Verify API connectivity with a simple list call.
   *  After connectivity check, also probes .index/ to verify new structure. */
  async probe() {
    if (!this.sessionId) {
      this.ready = false;
      return {};
    }
    try {
      const url = `${ENDPOINT_MAP.list}?session_id=${encodeURIComponent(this.sessionId)}&path=.`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      this.ready = res.ok;
      // Verify new directory structure is accessible
      try {
        await this.tree('.index');
      } catch {
        // .index/ may not exist yet (uninitialized workspace)
      }
      return {};
    } catch {
      this.ready = false;
      return {};
    }
  }

  /** List directory contents */
  async tree(path = '') {
    const url = this._getUrl('list', path);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`tree failed: ${res.status}`);
    const data = await res.json();
    return this._normalizeTree(data);
  }

  /** Read file content as text */
  async read(path) {
    const url = this._getUrl('file', path);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`read failed: ${res.status} for ${this._buildPath(path)}`);
    const data = await res.json();
    return data.content;
  }

  /** Read and parse a JSON file */
  async readJSON(path) {
    const text = await this.read(path);
    return JSON.parse(text);
  }

  /** Write content to a file (create or overwrite) */
  async write(path, content) {
    const fullPath = this._buildPath(path);
    const body = { session_id: this.sessionId, path: fullPath, content };

    // Try save first (overwrite existing)
    let res = await fetch(ENDPOINT_MAP.save, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // 404 means file doesn't exist → create it
    if (res.status === 404) {
      res = await fetch(ENDPOINT_MAP.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    }
    if (!res.ok) throw new Error(`write failed: ${res.status} for ${fullPath}`);
    return res.json();
  }

  /** Write JSON data to a file */
  async writeJSON(path, data) {
    return this.write(path, JSON.stringify(data, null, 2));
  }

  /** Create a directory */
  async mkdir(path) {
    const fullPath = this._buildPath(path);
    const res = await fetch(ENDPOINT_MAP.createDir, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: this.sessionId, path: fullPath })
    });
    if (!res.ok && res.status !== 400) {
      throw new Error(`mkdir failed: ${res.status} for ${fullPath}`);
    }
    return res.json().catch(() => ({}));
  }

  /** Delete a file or directory */
  async delete(path) {
    const fullPath = this._buildPath(path);
    const res = await fetch(ENDPOINT_MAP.delete, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: this.sessionId, path: fullPath, recursive: true })
    });
    if (!res.ok) throw new Error(`delete failed: ${res.status}`);
    return res.json().catch(() => ({}));
  }

  /** Rename or move a file/directory */
  async rename(oldPath, newPath) {
    const fullOld = this._buildPath(oldPath);
    const fullNew = this._buildPath(newPath);
    const oldParent = oldPath.split('/').slice(0, -1).join('/');
    const newParent = newPath.split('/').slice(0, -1).join('/');

    if (oldParent === newParent) {
      // Same directory → use rename
      const newName = newPath.split('/').pop();
      const res = await fetch(ENDPOINT_MAP.rename, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: this.sessionId, path: fullOld, new_name: newName })
      });
      if (!res.ok) throw new Error(`rename failed: ${res.status}`);
      return res.json().catch(() => ({}));
    } else {
      // Cross-directory → use move
      const destDir = this._buildPath(newParent);
      const res = await fetch(ENDPOINT_MAP.move, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: this.sessionId, path: fullOld, dest_dir: destDir })
      });
      if (!res.ok) throw new Error(`move failed: ${res.status}`);
      return res.json().catch(() => ({}));
    }
  }

  /** Check if a path exists */
  async exists(path) {
    try {
      const parts = path.split('/');
      const name = parts.pop();
      const parentDir = parts.join('/');
      const entries = await this.tree(parentDir);
      return entries.some(item => item.name === name);
    } catch {
      return false;
    }
  }

  /** Attempt to refresh the API session when it becomes stale.
   *  Creates a new standalone session via POST /api/session/new and
   *  updates internal _sessionId / _workspacePath on success.
   *  @returns {Promise<boolean>} true if a new session was created */
  async tryRefreshSession() {
    try {
      return await this._createStandaloneSession();
    } catch (e) {
      console.warn('[MediaStudio] session refresh failed:', e);
      return false;
    }
  }

  /** Check if workspace structure is initialized.
    *  Probes for .system/boot.json as the canonical initialization marker.
    *  On any HTTP error (not just 404) attempts a one-shot session refresh and
    *  retries exactly once — session may be stale. Network errors (TypeError)
    *  skip retry as they won't benefit from a new session. */
  async checkInitialized() {
    try {
      await this.read('.system/boot.json');
      return true;
    } catch (err) {
      // Any HTTP error (4xx, 5xx) could indicate stale session — try refresh
      if (err.message?.match(/\b[4-5]\d{2}\b/)) {
        const refreshed = await this.tryRefreshSession();
        if (refreshed) {
          try {
            await this.read('.system/boot.json');
            return true;
          } catch {
            return false;
          }
        }
      }
      // Network errors (TypeError) — refresh won't help, return false immediately
      return false;
    }
  }

  /**
   * Load kanban data from .index/pipeline.json.
   * @param {Object} filter - { theme?, dateFrom?, dateTo?, search? }
   * @returns {Object} { generating, pending, approved, scheduled }
   */
  async loadKanbanData(filter = {}) {
    const kanban = { generating: [], pending: [], approved: [], scheduled: [] };

    try {
      const pipelineIndex = await this.readJSON('.index/pipeline.json');
      const items = pipelineIndex.pipeline || [];

      for (const item of items) {
        const stageKey = this._pipelineStageKey(item.status);
        if (!stageKey || !kanban[stageKey]) continue;

        if (filter.theme && item.theme !== filter.theme) continue;
        if (filter.dateFrom && new Date(item.created_at) < new Date(filter.dateFrom)) continue;
        if (filter.dateTo && new Date(item.created_at) > new Date(filter.dateTo)) continue;
        if (filter.search) {
          const q = filter.search.toLowerCase();
          const matchesTheme = item.theme && item.theme.toLowerCase().includes(q);
          const matchesFilename = item.id?.toLowerCase().includes(q);
          if (!matchesTheme && !matchesFilename) continue;
        }

        let meta = null;
        try {
          meta = await this.readJSON(`${item.path}.meta.json`);
        } catch {
          // meta may not exist yet
        }

        kanban[stageKey].push({
          path: item.path,
          name: item.path.split('/').pop(),
          meta
        });
      }
    } catch { /* pipeline index may not exist yet */ }

    return kanban;
  }

  /** Map pipeline status string to kanban key */
  _pipelineStageKey(status) {
    const map = {
      'generating': 'generating',
      'pending-review': 'pending',
      'approved': 'approved',
      'scheduled': 'scheduled',
      'published': 'published'
    };
    return map[status] || null;
  }

  /** Aggregate stats from all published assets */
  async loadDashboardStats() {
    let totalPublished = 0, totalViews = 0, totalLikes = 0, totalComments = 0, totalShares = 0;
    const themeStats = {};
    const viralAssets = [];

    try {
      const archiveData = await this._walkArchive();
      for (const asset of archiveData) {
        if (!asset.meta?.publish_history?.length) continue;

        const theme = asset.meta.theme || '未分类';
        if (!themeStats[theme]) {
          themeStats[theme] = { published: 0, views: 0, likes: 0, comments: 0, shares: 0, viralCount: 0 };
        }

        for (const pub of asset.meta.publish_history) {
          themeStats[theme].published++;
          totalPublished++;
          if (pub.stats) {
            const v = pub.stats.views || 0;
            const l = pub.stats.likes || 0;
            const c = pub.stats.comments || 0;
            const s = pub.stats.shares || 0;
            themeStats[theme].views += v;
            themeStats[theme].likes += l;
            themeStats[theme].comments += c;
            themeStats[theme].shares += s;
            totalViews += v;
            totalLikes += l;
            totalComments += c;
            totalShares += s;

            const engagement = v + l + c + s;
            if (engagement > 10000) {
              themeStats[theme].viralCount++;
              viralAssets.push({ ...asset, totalEngagement: engagement, stats: pub.stats });
            }
          }
        }
      }
    } catch { /* empty */ }

    viralAssets.sort((a, b) => b.totalEngagement - a.totalEngagement);

    return {
      totalPublished, totalViews, totalLikes, totalComments, totalShares,
      themeStats,
      viralAssets: viralAssets.slice(0, 5)
    };
  }

  /** Walk archive/{theme}/{YYYY}/{MM}/ and collect all assets with metadata.
   *  Discovers themes from configs/themes/ first, then walks each theme's archive. */
  async _walkArchive() {
    const results = [];
    let themes = [];

    // Discover themes from configs/themes/
    try {
      const themeDirs = await this.tree('configs/themes');
      const themeEntries = this._normalizeTree(themeDirs);
      themes = themeEntries
        .filter(e => e.name && !e.name.startsWith('.'))
        .map(e => e.name);
    } catch { /* configs/themes may not exist */ }

    // Fallback: if no themes found, try walking archive/ directly for any theme dirs
    if (themes.length === 0) {
      try {
        const topDirs = await this.tree('archive');
        const topEntries = this._normalizeTree(topDirs);
        themes = topEntries
          .filter(e => e.name && !e.name.startsWith('.'))
          .map(e => e.name);
      } catch { /* archive may be empty */ }
    }

    for (const theme of themes) {
      try {
        const years = await this.tree(`archive/${theme}`);
        const yearEntries = this._normalizeTree(years);

        for (const year of yearEntries) {
          if (!year.name || !/^\d{4}$/.test(year.name)) continue;
          try {
            const months = await this.tree(`archive/${theme}/${year.name}`);
            const monthEntries = this._normalizeTree(months);

            for (const month of monthEntries) {
              if (!month.name || !/^\d{2}$/.test(month.name)) continue;
              try {
                const files = await this.tree(`archive/${theme}/${year.name}/${month.name}`);
                const fileEntries = this._normalizeTree(files);

                for (const file of fileEntries) {
                  if (file.name.endsWith('.meta.json')) continue;
                  if (!file.name.match(/\.(png|jpg|jpeg|gif|webp|mp4)$/i)) continue;

                  let meta = null;
                  try {
                    meta = await this.readJSON(`archive/${theme}/${year.name}/${month.name}/${file.name}.meta.json`);
                  } catch { /* no meta */ }

                  results.push({
                    path: `archive/${theme}/${year.name}/${month.name}/${file.name}`,
                    name: file.name,
                    meta
                  });
                }
              } catch { /* skip month */ }
            }
          } catch { /* skip year */ }
        }
      } catch { /* skip theme */ }
    }

    return results;
  }

  /** Write a .ref file into a pipeline stage directory.
   *  @param {string} stage - pipeline stage name (e.g. '01-generating', '02-pending-review')
   *  @param {string} assetPath - relative path to the asset (e.g. 'assets/2026/07/11/...')
   *  @returns {Promise<Object>} API response */
  async writePipelineRef(stage, assetPath) {
    const filename = assetPath.split('/').pop();
    const refPath = `pipeline/${stage}/${filename}.ref`;
    const content = JSON.stringify({ asset: assetPath }, null, 2);
    return this.write(refPath, content);
  }

  /** Remove a .ref file from a pipeline stage directory.
   *  @param {string} stage - pipeline stage name
   *  @param {string} assetPath - relative path to the asset
   *  @returns {Promise<boolean>} true if removed, false if not found */
  async removePipelineRef(stage, assetPath) {
    const filename = assetPath.split('/').pop();
    const refPath = `pipeline/${stage}/${filename}.ref`;
    try {
      await this.delete(refPath);
      return true;
    } catch {
      return false;
    }
  }

  /** Read all .ref files from a pipeline stage and resolve to asset paths.
   *  @param {string} stage - pipeline stage name
   *  @returns {Promise<string[]>} array of resolved asset paths */
  async readPipelineRefs(stage) {
    const results = [];
    try {
      const entries = await this.tree(`pipeline/${stage}`);
      const files = this._normalizeTree(entries);

      for (const file of files) {
        if (!file.name.endsWith('.ref')) continue;
        try {
          const content = await this.read(`pipeline/${stage}/${file.name}`);
          const parsed = JSON.parse(content);
          if (parsed.asset) {
            results.push(parsed.asset);
          }
        } catch { /* skip unparseable ref */ }
      }
    } catch { /* stage may not exist */ }

    return results;
  }

  /** Read the pipeline index from .index/pipeline.json.
   *  @returns {Promise<Object>} { pipeline: [...] } or empty object */
  async readPipelineIndex() {
    try {
      return await this.readJSON('.index/pipeline.json');
    } catch {
      return { pipeline: [] };
    }
  }

  /** Write the pipeline index to .index/pipeline.json.
   *  @param {Object} data - index data with pipeline array */
  async writePipelineIndex(data) {
    await this.writeJSON('.index/pipeline.json', data);
  }

  /** Read a shard file from .index/{YYYY}/{MM}/assets.json.
   *  @param {number|string} year
   *  @param {number|string} month
   *  @returns {Promise<Object>} shard data or empty object */
  async readShard(year, month) {
    const yyyy = String(year);
    const mm = String(month).padStart(2, '0');
    try {
      return await this.readJSON(`.index/${yyyy}/${mm}/assets.json`);
    } catch {
      return { assets: [] };
    }
  }

  /** Write a shard file to .index/{YYYY}/{MM}/assets.json.
   *  @param {number|string} year
   *  @param {number|string} month
   *  @param {Object} data - shard data */
  async writeShard(year, month, data) {
    const yyyy = String(year);
    const mm = String(month).padStart(2, '0');
    await this.mkdir(`.index/${yyyy}/${mm}`);
    await this.writeJSON(`.index/${yyyy}/${mm}/assets.json`, data);
  }

  /** Read the index manifest from .index/manifest.json.
   *  @returns {Promise<Object>} manifest data or empty object */
  async readIndexManifest() {
    try {
      return await this.readJSON('.index/manifest.json');
    } catch {
      return {};
    }
  }

  /** Write the index manifest to .index/manifest.json.
   *  @param {Object} data - manifest data */
  async writeIndexManifest(data) {
    await this.writeJSON('.index/manifest.json', data);
  }

  // ── Task Management ──────────────────────────────────────────────

  /** Build task directory path from UUID */
  _buildTaskPath(uuid) {
    return `tasks/${uuid}`;
  }

  /** Read task index from .index/tasks.json */
  async readTaskIndex() {
    try {
      return await this.readJSON('.index/tasks.json');
    } catch {
      return { tasks: [] };
    }
  }

  /** Write task index to .index/tasks.json */
  async writeTaskIndex(data) {
    await this.writeJSON('.index/tasks.json', data);
  }

  /** List all tasks from the task index */
  async listTasks() {
    const index = await this.readTaskIndex();
    return index.tasks || [];
  }

  /** Create a new task with generated UUID */
  async createTask(type, mode, brief) {
    const uuid = crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
    const taskPath = this._buildTaskPath(uuid);
    const now = new Date().toISOString();

    // Create task directory
    await this.mkdir(taskPath);

    // Write .meta.json
    const meta = {
      id: uuid,
      type,
      mode,
      status: 'initialized',
      created_at: now,
      status_history: [
        { status: 'initialized', changed_at: now, note: '任务创建' }
      ]
    };
    await this.writeJSON(`${taskPath}/.meta.json`, meta);

    // Write brief.md
    await this.write(`${taskPath}/brief.md`, brief || '');

    // Update task index
    const index = await this.readTaskIndex();
    index.tasks.push({
      uuid,
      type,
      mode,
      status: 'initialized',
      created_at: now,
      brief_summary: brief ? brief.slice(0, 100) : ''
    });
    await this.writeTaskIndex(index);

    return { uuid, ...meta };
  }

  /** Get a task's metadata by UUID */
  async getTask(uuid) {
    try {
      return await this.readJSON(`${this._buildTaskPath(uuid)}/.meta.json`);
    } catch {
      return null;
    }
  }

  /** Update a task's status with history tracking */
  async updateTaskStatus(uuid, newStatus, note = '') {
    const meta = await this.getTask(uuid);
    if (!meta) throw new Error(`Task not found: ${uuid}`);

    meta.status = newStatus;
    meta.status_history.push({
      status: newStatus,
      changed_at: new Date().toISOString(),
      note
    });

    await this.writeJSON(`${this._buildTaskPath(uuid)}/.meta.json`, meta);

    // Update task index
    const index = await this.readTaskIndex();
    const entry = index.tasks.find(t => t.uuid === uuid);
    if (entry) {
      entry.status = newStatus;
    }
    await this.writeTaskIndex(index);

    return meta;
  }

  /** Read a task's brief.md content */
  async readTaskBrief(uuid) {
    try {
      return await this.read(`${this._buildTaskPath(uuid)}/brief.md`);
    } catch {
      return '';
    }
  }

  // ── Platform Config ──────────────────────────────────────────────

  /** List all platform configurations */
  async listPlatforms() {
    const results = [];
    try {
      const entries = await this.tree('configs/platforms');
      const files = this._normalizeTree(entries);

      for (const file of files) {
        if (!file.name.endsWith('.json')) continue;
        try {
          const content = await this.readJSON(`configs/platforms/${file.name}`);
          const id = file.name.replace(/\.json$/, '');
          results.push({ id, ...content });
        } catch { /* skip unparseable platform */ }
      }
    } catch { /* configs/platforms may not exist */ }

    return results;
  }

  /** Create a new platform configuration */
  async createPlatform(name, publishTypes, enabled = true) {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const data = {
      id,
      name,
      publishTypes,
      enabled,
      created_at: new Date().toISOString()
    };
    await this.writeJSON(`configs/platforms/${id}.json`, data);
    return data;
  }

  /** Update an existing platform configuration */
  async updatePlatform(id, data) {
    const filePath = `configs/platforms/${id}.json`;
    let existing = {};
    try {
      existing = await this.readJSON(filePath);
    } catch { /* platform may not exist yet */ }

    const merged = { ...existing, ...data, id };
    await this.writeJSON(filePath, merged);
    return merged;
  }

  // ── Copywriting Library ──────────────────────────────────────────

  /** List all copywriting entries from index shards */
  async listCopywritings() {
    const results = [];
    try {
      const manifest = await this.readJSON('.index/copywriting/manifest.json');
      const shards = manifest.shards || [];

      for (const shard of shards) {
        try {
          const shardData = await this.readJSON(`.index/copywriting/${shard.year}/${shard.month}/index.json`);
          const entries = shardData.entries || [];
          results.push(...entries);
        } catch { /* skip unreadable shard */ }
      }
    } catch { /* manifest may not exist */ }

    return results;
  }

  /** Get a copywriting entry by UUID (searches via listCopywritings) */
  async getCopywriting(uuid) {
    const all = await this.listCopywritings();
    const entry = all.find(e => e.uuid === uuid);
    if (!entry) return null;

    // Read full meta and content
    try {
      const meta = await this.readJSON(`${entry.path}/.meta.json`);
      const content = await this.read(`${entry.path}/content.md`);
      return { ...meta, content };
    } catch {
      return entry;
    }
  }

  /** Normalize tree response to array of { name, path, type, size? } */
  _normalizeTree(data) {
    if (Array.isArray(data)) return data;
    if (data.entries) return data.entries;
    if (data.children) return data.children;
    if (data.files) return data.files;
    return [];
  }

  // ── Business: Planning ───────────────────────────────────────────

  _getThemeRepo() {
    if (!this._themeRepo) {
      if (!this._schemaRegistry) throw new Error('SchemaRegistry not set. Call setSchemaRegistry() first.');
      this._themeRepo = DataRepository.for(this, this._schemaRegistry, 'business', 'themes');
    }
    return this._themeRepo;
  }

  _getIdeaRepo() {
    if (!this._ideaRepo) {
      if (!this._schemaRegistry) throw new Error('SchemaRegistry not set.');
      this._ideaRepo = DataRepository.for(this, this._schemaRegistry, 'business', 'ideas');
    }
    return this._ideaRepo;
  }

  _getTopicRepo() {
    if (!this._topicRepo) {
      if (!this._schemaRegistry) throw new Error('SchemaRegistry not set.');
      this._topicRepo = DataRepository.for(this, this._schemaRegistry, 'business', 'topics');
    }
    return this._topicRepo;
  }

  async listThemes() {
    const result = await this._getThemeRepo().find({ sort: '-createdAt' });
    return result.records;
  }

  async createTheme(data) {
    return this._getThemeRepo().create(data);
  }

  async updateTheme(id, data) {
    return this._getThemeRepo().update(id, data);
  }

  async deleteTheme(id) {
    return this._getThemeRepo().delete(id);
  }

  async listIdeas(filter) {
    const result = await this._getIdeaRepo().find({ filter, sort: '-createdAt' });
    return result.records;
  }

  async createIdea(data) {
    return this._getIdeaRepo().create(data);
  }

  async updateIdea(id, data) {
    return this._getIdeaRepo().update(id, data);
  }

  async deleteIdea(id) {
    return this._getIdeaRepo().delete(id);
  }

  async listTopics(filter) {
    const result = await this._getTopicRepo().find({ filter, sort: '-createdAt' });
    return result.records;
  }

  async createTopic(data) {
    return this._getTopicRepo().create(data);
  }

  async updateTopic(id, data) {
    return this._getTopicRepo().update(id, data);
  }

  async deleteTopic(id) {
    return this._getTopicRepo().delete(id);
  }
}

export default WorkspaceAPI;
