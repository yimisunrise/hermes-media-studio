export async function readMeta(api, assetPath) {
  const metaPath = `${assetPath}.meta.json`;
  try {
    return await api.readJSON(metaPath);
  } catch {
    return null;
  }
}

export async function writeMeta(api, assetPath, meta) {
  const metaPath = `${assetPath}.meta.json`;
  meta.updated_at = new Date().toISOString();
  await api.writeJSON(metaPath, meta);
}

export function createDefaultMeta(filename, theme, workflow, generation = {}) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    filename,
    theme: theme || '',
    workflow: workflow || '',
    generation: {
      prompt: generation.prompt || '',
      negative_prompt: generation.negative_prompt || '',
      seed: generation.seed || null,
      width: generation.width || 0,
      height: generation.height || 0,
      sampler: generation.sampler || '',
      steps: generation.steps || 0,
      cfg: generation.cfg || 0,
      model: generation.model || '',
      generated_at: now
    },
    status: 'generating',
    status_history: [
      { status: 'generating', changed_at: now, note: '素材创建' }
    ],
    review: {
      rating: 0,
      note: '',
      tags: [],
      reviewed_at: null
    },
    linked_copy: [],
    publish_history: [],
    is_starred: false,
    created_at: now,
    updated_at: now
  };
}

export async function changeStatus(api, assetPath, newStatus, note = '') {
  const meta = await readMeta(api, assetPath);
  if (!meta) throw new Error(`Meta not found for: ${assetPath}`);

  meta.status = newStatus;
  meta.status_history.push({
    status: newStatus,
    changed_at: new Date().toISOString(),
    note
  });
  meta.updated_at = new Date().toISOString();

  await writeMeta(api, assetPath, meta);
  await syncPipelineIndex(api, assetPath, newStatus);
  return meta;
}

async function syncPipelineIndex(api, assetPath, newStatus) {
  const stageMap = {
    'generating': '01-generating',
    'pending-review': '02-pending-review',
    'approved': '03-approved',
    'scheduled': '04-scheduled',
    'published': '05-published',
    'deleted': '.trash',
    'deferred': '02-pending-review'
  };

  const stageDir = stageMap[newStatus];
  if (!stageDir) return;

  const archivePath = assetPath.replace(/^pipeline\/\d+-\w+\//, '');
  const filename = assetPath.split('/').pop();

  try {
    await api.write(`pipeline/${stageDir}/${filename}.ref`, `ref: ${archivePath}`);
  } catch {
    // pipeline dir might not exist yet
  }
}

export async function appendLinkedCopy(api, assetPath, packagePath) {
  const meta = await readMeta(api, assetPath);
  if (!meta) return;

  if (!meta.linked_copy.includes(packagePath)) {
    meta.linked_copy.push(packagePath);
    meta.updated_at = new Date().toISOString();
    await writeMeta(api, assetPath, meta);
  }
}
