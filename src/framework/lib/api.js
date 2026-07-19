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
  move: '/api/file/move',
  workspaceUpload: '/api/workspace/upload'
};

class WorkspaceAPI {
  constructor() {
    this.ready = false;
    this._sessionId = null;
    this._workspacePath = null;
    this._usingStandaloneSession = false;

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

  // ── Binary File Support ─────────────────────────────────────────

  /** Convert ArrayBuffer to base64 string (chunked for large buffers) */
  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  /**
   * Upload a file as raw binary to the workspace.
   *
   * Uses POST /api/workspace/upload with multipart/form-data (FormData).
   * The server writes the file as raw bytes on disk — readable by the OS
   * file manager. The directory is created automatically.
   *
   * The relPath must be workspace-relative: e.g. "assets/2025-07/id-name.ext".
   * The directory portion ("assets/2025-07/") is sent as the upload path,
   * and the file is sent with the given filename.
   *
   * @param {string} relPath - Relative path in workspace (e.g. "assets/.../file.ext")
   * @param {File|Blob} file - File or Blob object to upload
   * @returns {Promise<object>} Upload result with { name, path, size, mime }
   */
  async writeBinary(relPath, file) {
    const dirPath = relPath.indexOf('/') !== -1
      ? relPath.substring(0, relPath.lastIndexOf('/'))
      : '';
    const fileName = relPath.substring(relPath.lastIndexOf('/') + 1);
    const uploadPath = this._buildPath(dirPath);

    const form = new FormData();
    form.append('session_id', this.sessionId);
    form.append('file', file, fileName);
    form.append('path', uploadPath);

    const res = await fetch(ENDPOINT_MAP.workspaceUpload, {
      method: 'POST',
      headers: {},
      body: form
    });

    if (!res.ok) {
      throw new Error(`writeBinary failed: ${res.status} for ${relPath}`);
    }

    return res.json().catch(() => ({}));
  }

  /**
   * Download a file as raw binary through the browser's native download.
   *
   * Reads the file via readAsArrayBuffer (which correctly decodes base64),
   * creates a Blob with the correct MIME type, and triggers a browser
   * download with the original filename. This ensures the downloaded file
   * is valid binary — even when the server stores it as base64 text.
   *
   * @param {string} relPath - Relative file path in workspace
   * @param {string} fileName - Original filename for the download dialog
   * @param {string} mimeType - MIME type (e.g. 'image/jpeg', 'video/mp4')
   */
  async downloadAsFile(relPath, fileName, mimeType) {
    const arrayBuffer = await this.readAsArrayBuffer(relPath);
    const blob = new Blob([arrayBuffer], { type: mimeType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  }

  /**
   * Read file content, handling both JSON responses (text/base64 content)
   * and raw binary responses.
   */
  async _readFileContent(path) {
    const fullPath = this._buildPath(path);
    const url = `/api/file/raw?session_id=${encodeURIComponent(this.sessionId)}&path=${encodeURIComponent(fullPath)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`read failed: ${res.status} for ${fullPath}`);
    const buffer = await res.arrayBuffer();
    return this._arrayBufferToBase64(buffer);
  }

  /**
   * Read file content and return as a data URL suitable for <img src>.
   * Handles legacy (data: prefix), current (raw base64 in JSON), and
   * raw binary responses from the server.
   */
  async readAsDataURL(filePath, mimeType) {
    const content = await this._readFileContent(filePath);
    if (!content) {
      return '';
    }
    if (content.startsWith('data:')) {
      return content; // Legacy: content is already a full data URL
    }
    // content is raw base64 → wrap in data URL
    return `data:${mimeType || 'image/png'};base64,${content}`;
  }

  /**
   * Read file content as ArrayBuffer.
   * Handles legacy (data: URL), current (raw base64), and
   * raw binary responses from the server.
   */
  async readAsArrayBuffer(filePath) {
    const content = await this._readFileContent(filePath);
    if (!content) return new ArrayBuffer(0);
    const base64 = content.startsWith('data:')
      ? content.split(',').slice(1).join(',')  // Legacy: strip data: prefix
      : content;                                 // Current: raw base64
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return buffer;
  }

  /**
   * Get a temporary object URL for file preview/download.
   * Creates a Blob URL that can be used in <img src> or window.open().
   * Caller should revoke the URL when done via URL.revokeObjectURL().
   */
  async getDownloadUrl(filePath, mimeType) {
    const arrayBuffer = await this.readAsArrayBuffer(filePath);
    const blob = new Blob([arrayBuffer], { type: mimeType || 'application/octet-stream' });
    return URL.createObjectURL(blob);
  }

  // ── Platform Config ──────────────────────────────────────────────

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
