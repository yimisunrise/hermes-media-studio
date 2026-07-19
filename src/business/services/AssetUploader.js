import { shortId } from '../../framework/utils/meta.js';

function _sanitizeFileName(name) {
  let safe = name.replace(/[/\\]/g, '');
  safe = safe.replace(/[\x00-\x1f\x7f]/g, '');
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_');
  safe = safe.replace(/_{2,}/g, '_');
  safe = safe.replace(/^[._]+|[._]+$/g, '');
  if (safe.length > 200) safe = safe.substring(0, 200);
  if (!safe) safe = 'unnamed';
  return safe;
}

export class AssetUploader {

  static async uploadFile(file, api, dataRepo, extraFields = {}) {
    let type = 'other';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    const relPath = AssetUploader._generatePath(file.name);

    const monthDir = relPath.substring(0, relPath.lastIndexOf('/'));
    await api.mkdir(monthDir);

    await api.writeBinary(relPath, file);

    const record = await dataRepo.create({
      ...extraFields,
      type: type,
      fileName: file.name,
      filePath: relPath,
      mimeType: file.type,
      fileSize: file.size,
      thumbnailPath: '',
      metadata: {},
      status: 'completed'
    });

    return record;
  }

  static _generatePath(originalName) {
    const now = new Date();
    const monthDir = String(now.getFullYear()) + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const dotIdx = originalName.lastIndexOf('.');
    const ext = dotIdx !== -1 ? originalName.substring(dotIdx) : '';
    const baseName = dotIdx !== -1 ? originalName.substring(0, dotIdx) : originalName;
    const safeName = _sanitizeFileName(baseName);
    const id = shortId();
    return 'assets/' + monthDir + '/' + id + '-' + safeName + ext;
  }
}
