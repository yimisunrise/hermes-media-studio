const MANIFEST_PATH = '.index/manifest.json';

export async function buildSearchIndex(api) {
  const shards = [];
  let totalAssets = 0;

  try {
    const archiveData = await api._walkArchive();
    const groups = {};
    for (const asset of archiveData) {
      if (!asset.meta) continue;
      const parts = asset.path.split('/');
      const key = `${parts[1]}/${parts[2]}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push({
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

    let existingManifest = {};
    try {
      existingManifest = await api.readIndexManifest();
    } catch {
      // first build
    }
    const existingShards = new Set(existingManifest.shards || []);

    for (const [key, assets] of Object.entries(groups)) {
      if (existingShards.has(key)) {
        shards.push(key);
        totalAssets += assets.length;
        continue;
      }
      const [yyyy, mm] = key.split('/');
      const shardData = { assets, built_at: new Date().toISOString() };
      try {
        await api.writeShard(yyyy, mm, shardData);
      } catch {
        // shard write may fail
      }
      shards.push(key);
      totalAssets += assets.length;
    }

    const manifest = { version: 1, shards };
    try {
      await api.writeIndexManifest(manifest);
    } catch {
      // manifest write may fail
    }
  } catch {
    // archive may be empty
  }

  return { shards: shards.length, assets: totalAssets };
}

export async function loadSearchIndex(api) {
  try {
    const manifest = await api.readIndexManifest();
    const shardList = manifest.shards || [];

    const shardPromises = shardList.map(async (key) => {
      const [yyyy, mm] = key.split('/');
      try {
        return await api.readShard(yyyy, mm);
      } catch {
        return { assets: [] };
      }
    });

    const shardResults = await Promise.all(shardPromises);

    const mergedAssets = [];
    for (const shard of shardResults) {
      if (shard.assets && Array.isArray(shard.assets)) {
        for (const asset of shard.assets) {
          mergedAssets.push(asset);
        }
      }
    }

    return { assets: mergedAssets, built_at: new Date().toISOString() };
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
