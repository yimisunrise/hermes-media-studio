/**
 * Workspace API Client for Media Studio Extension
 * Uses Hermes WebUI's file API with session-based authentication.
 */

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
  }

  /** Current session ID from WebUI global state */
  get sessionId() {
    if (this._sessionId) return this._sessionId;
    if (S?.session?.session_id) {
      this._sessionId = S.session.session_id;
    }
    return this._sessionId;
  }

  /** Current workspace absolute path */
  get workspacePath() {
    if (this._workspacePath) return this._workspacePath;
    if (S?.session?.workspace) {
      this._workspacePath = S.session.workspace;
    }
    return this._workspacePath;
  }

  /** Read session_id and workspace from global S object */
  detectWorkspace() {
    if (S?.session) {
      this._sessionId = S.session.session_id || null;
      this._workspacePath = S.session.workspace || null;
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
      return true;
    }
    return false;
  }

  /** Build workspace-relative path under media-studio/ */
  _buildPath(relPath) {
    return relPath ? `media-studio/${relPath}` : 'media-studio';
  }

  /** Build GET URL with session_id and path */
  _getUrl(endpoint, relPath) {
    const fullPath = this._buildPath(relPath);
    return `${ENDPOINT_MAP[endpoint]}?session_id=${encodeURIComponent(this.sessionId)}&path=${encodeURIComponent(fullPath)}`;
  }

  /** Verify API connectivity with a simple list call */
  async probe() {
    if (!this.sessionId) {
      this.ready = false;
      return {};
    }
    try {
      const url = `${ENDPOINT_MAP.list}?session_id=${encodeURIComponent(this.sessionId)}&path=.`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      this.ready = res.ok;
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

  /** Check if workspace structure is initialized */
  async checkInitialized() {
    try {
      await this.tree('pipeline/01-generating');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load kanban data aggregated from all pipeline stages.
   * @param {Object} filter - { theme?, dateFrom?, dateTo?, search? }
   * @returns {Object} { generating, pending, approved, scheduled }
   */
  async loadKanbanData(filter = {}) {
    const stages = [
      { dir: 'pipeline/01-generating', key: 'generating' },
      { dir: 'pipeline/02-pending-review', key: 'pending' },
      { dir: 'pipeline/03-approved', key: 'approved' },
      { dir: 'pipeline/04-scheduled', key: 'scheduled' }
    ];

    const kanban = { generating: [], pending: [], approved: [], scheduled: [] };

    for (const stage of stages) {
      try {
        const items = await this.tree(stage.dir);
        const entries = this._normalizeTree(items);

        for (const entry of entries) {
          if (entry.name.endsWith('.meta.json')) continue;
          if (entry.name.endsWith('.md')) continue;

          let meta = null;
          try {
            meta = await this.readJSON(`${stage.dir}/${entry.name}.meta.json`);
          } catch {
            continue;
          }

          if (filter.theme && meta.theme !== filter.theme) continue;
          if (filter.dateFrom && new Date(meta.created_at) < new Date(filter.dateFrom)) continue;
          if (filter.dateTo && new Date(meta.created_at) > new Date(filter.dateTo)) continue;
          if (filter.search) {
            const q = filter.search.toLowerCase();
            const matchesTheme = meta.theme && meta.theme.toLowerCase().includes(q);
            const matchesPrompt = meta.generation?.prompt?.toLowerCase().includes(q);
            const matchesTags = meta.review?.tags?.some(t => t.toLowerCase().includes(q));
            const matchesFilename = entry.name?.toLowerCase().includes(q);
            if (!matchesTheme && !matchesPrompt && !matchesTags && !matchesFilename) continue;
          }

          kanban[stage.key].push({
            path: `${stage.dir}/${entry.name}`,
            name: entry.name,
            meta
          });
        }
      } catch { /* stage may not exist */ }
    }

    return kanban;
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

  /** Walk archive/YYYY/MM/ and collect all assets with metadata */
  async _walkArchive() {
    const results = [];
    try {
      const years = await this.tree('archive');
      const yearEntries = this._normalizeTree(years);

      for (const year of yearEntries) {
        if (!year.name || !/^\d{4}$/.test(year.name)) continue;
        try {
          const months = await this.tree(`archive/${year.name}`);
          const monthEntries = this._normalizeTree(months);

          for (const month of monthEntries) {
            if (!month.name || !/^\d{2}$/.test(month.name)) continue;
            try {
              const files = await this.tree(`archive/${year.name}/${month.name}`);
              const fileEntries = this._normalizeTree(files);

              for (const file of fileEntries) {
                if (file.name.endsWith('.meta.json')) continue;
                if (!file.name.match(/\.(png|jpg|jpeg|gif|webp|mp4)$/i)) continue;

                let meta = null;
                try {
                  meta = await this.readJSON(`archive/${year.name}/${month.name}/${file.name}.meta.json`);
                } catch { /* no meta */ }

                results.push({
                  path: `archive/${year.name}/${month.name}/${file.name}`,
                  name: file.name,
                  meta
                });
              }
            } catch { /* skip month */ }
          }
        } catch { /* skip year */ }
      }
    } catch { /* archive may be empty */ }
    return results;
  }

  /** Normalize tree response to array of { name, path, type, size? } */
  _normalizeTree(data) {
    if (Array.isArray(data)) return data;
    if (data.entries) return data.entries;
    if (data.children) return data.children;
    if (data.files) return data.files;
    return [];
  }
}

export default WorkspaceAPI;
