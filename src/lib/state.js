/**
 * Global State Management for Media Studio Extension
 * In-memory state with event-based view update notifications.
 * Workspace filesystem is the SSOT - this is a rendering cache.
 */

class AppState {
  constructor() {
    this._data = {
      view: 'kanban',
      filter: {
        themes: [],
        dateRange: 'all',
        dateFrom: null,
        dateTo: null,
        search: ''
      },
      assets: {
        generating: [],
        pending: [],
        approved: [],
        scheduled: []
      },
      selectedAssets: [],
      publishing: null,
      generationJobs: [],
      stats: null,
      themes: [],
      platforms: [],
      loading: true,
      error: null
    };
    this._listeners = {};
    this._idCounter = 0;
  }

  /** Get a copy of current state */
  get() {
    return { ...this._data };
  }

  /** Get a specific state value */
  getKey(key) {
    return this._data[key];
  }

  /** Update state and notify listeners */
  set(key, value) {
    const prev = this._data[key];
    this._data[key] = value;
    this._emit(key, value, prev);
  }

  /** Batch update multiple keys */
  patch(updates) {
    for (const [key, value] of Object.entries(updates)) {
      const prev = this._data[key];
      this._data[key] = value;
      this._emit(key, value, prev);
    }
  }

  /** Subscribe to state changes */
  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    const id = ++this._idCounter;
    this._listeners[event].push({ id, callback });
    return () => {
      this._listeners[event] = this._listeners[event].filter(l => l.id !== id);
    };
  }

  /** Subscribe to ALL state changes */
  onChange(callback) {
    return this.on('*', callback);
  }

  /** Emit event to listeners */
  _emit(key, value, prev) {
    const listeners = this._listeners[key] || [];
    for (const l of listeners) {
      try { l.callback(value, prev); } catch (e) { console.warn('State listener error:', e); }
    }
    // Also emit wildcard
    const wildcard = this._listeners['*'] || [];
    for (const l of wildcard) {
      try { l.callback(key, value, prev); } catch (e) { console.warn('State listener error:', e); }
    }
  }

  // === Convenience methods ===

  setView(view) {
    this.set('view', view);
  }

  setLoading(loading) {
    this.set('loading', loading);
  }

  setError(error) {
    this.set('error', error);
  }

  setFilter(filter) {
    this.set('filter', { ...this._data.filter, ...filter });
  }

  setAssets(assets) {
    this.set('assets', assets);
  }

  toggleAssetSelection(assetPath) {
    const selected = [...this._data.selectedAssets];
    const idx = selected.indexOf(assetPath);
    if (idx >= 0) {
      selected.splice(idx, 1);
    } else {
      selected.push(assetPath);
    }
    this.set('selectedAssets', selected);
  }

  clearSelection() {
    this.set('selectedAssets', []);
  }

  selectAllAssets() {
    const allPaths = [];
    for (const stage of ['generating', 'pending', 'approved', 'scheduled']) {
      for (const asset of this._data.assets[stage] || []) {
        allPaths.push(asset.path);
      }
    }
    this.set('selectedAssets', allPaths);
  }
}

export default AppState;
