const INDEX_PATH = '.media-studio/index.json';

export async function buildSearchIndex(api) {
  const index = { assets: [], built_at: new Date().toISOString() };

  try {
    const archiveData = await api._walkArchive();
    for (const asset of archiveData) {
      if (!asset.meta) continue;
      index.assets.push({
        path: asset.path,
        filename: asset.name,
        theme: asset.meta.theme,
        prompt: asset.meta.generation?.prompt || '',
        tags: asset.meta.review?.tags || [],
        status: asset.meta.status,
        is_starred: asset.meta.is_starred || false,
        created_at: asset.meta.created_at
      });
    }
  } catch {
    // Archive may be empty
  }

  try {
    await api.writeJSON(INDEX_PATH, index);
  } catch {
    // Index file write may fail if .media-studio doesn't exist
  }

  return index;
}

export async function loadSearchIndex(api) {
  try {
    return await api.readJSON(INDEX_PATH);
  } catch {
    return null;
  }
}

export async function search(api, query, filters = {}) {
  let index = await loadSearchIndex(api);

  if (!index || isIndexStale(index)) {
    index = await buildSearchIndex(api);
  }

  let results = index.assets;

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(a =>
      (a.theme && a.theme.toLowerCase().includes(q)) ||
      (a.filename && a.filename.toLowerCase().includes(q)) ||
      (a.prompt && a.prompt.toLowerCase().includes(q)) ||
      (a.tags && a.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  if (filters.theme) {
    results = results.filter(a => a.theme === filters.theme);
  }

  if (filters.status) {
    results = results.filter(a => a.status === filters.status);
  }

  if (filters.dateFrom) {
    results = results.filter(a => new Date(a.created_at) >= new Date(filters.dateFrom));
  }

  if (filters.dateTo) {
    results = results.filter(a => new Date(a.created_at) <= new Date(filters.dateTo));
  }

  if (filters.starred) {
    results = results.filter(a => a.is_starred);
  }

  return results;
}

function isIndexStale(index) {
  if (!index || !index.built_at) return true;
  const built = new Date(index.built_at);
  const age = Date.now() - built.getTime();
  return age > 24 * 60 * 60 * 1000;
}
