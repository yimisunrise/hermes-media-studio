import { empty } from '../../framework/utils/dom.js';
import { assetRepo } from '../data/index.js';
import { AssetCard } from './components/AssetCard.js';

const TYPE_FILTERS = [
  { value: 'all', label: '全部类型' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
  { value: 'audio', label: '音频' }
];

export class AssetGallery {
  constructor({ api, state, schemaRegistry }) {
    this.api = api;
    this.state = state;
    this._sr = schemaRegistry;
    this._assets = [];
    this._filterType = 'all';
    this._container = null;
    this._injectStyles();
  }

  _ar() { return assetRepo(this.api, this._sr); }

  _injectStyles() {
    if (document.getElementById('media-studio-asset-gallery-styles')) return;
    const style = document.createElement('style');
    style.id = 'media-studio-asset-gallery-styles';
    style.textContent = `
      .ms-asset-gallery { max-width: 1200px; margin: 0 auto; }
      .ms-asset-gallery-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
      .ms-asset-gallery-header h2 { margin: 0; font-size: 20px; font-weight: 600; color: var(--ms-text-primary, #e0e0e0); }
      .ms-asset-gallery-filter-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
      .ms-asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
      .ms-asset-card { background: var(--ms-bg-card, #0f3460); border: 1px solid var(--ms-border, #2a2a4a); border-radius: var(--ms-radius, 8px); overflow: hidden; transition: border-color 0.2s ease; cursor: pointer; }
      .ms-asset-card:hover { border-color: var(--ms-accent, #e94560); }
      .ms-asset-thumb { width: 100%; height: 140px; background: var(--ms-bg-primary, #1a1a2e); display: flex; align-items: center; justify-content: center; overflow: hidden; }
      .ms-asset-thumb img { width: 100%; height: 100%; object-fit: cover; }
      .ms-asset-thumb-icon { font-size: 32px; color: var(--ms-text-secondary, #a0a0a0); }
      .ms-asset-info { padding: 10px 12px; }
      .ms-asset-name { font-size: 13px; color: var(--ms-text-primary, #e0e0e0); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
      .ms-asset-meta { font-size: 11px; color: var(--ms-text-secondary, #a0a0a0); display: flex; gap: 8px; }
      .ms-asset-type-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; background: var(--ms-bg-primary, #1a1a2e); color: var(--ms-accent, #e94560); border: 1px solid var(--ms-border, #2a2a4a); }
      .ms-asset-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; color: var(--ms-text-secondary, #a0a0a0); gap: 8px; }
      .ms-asset-upload-input { display: none; }
    `;
    document.head.appendChild(style);
  }

  destroy() {}

  async render(container) {
    empty(container);
    this._container = container;

    const wrapper = document.createElement('div');
    wrapper.className = 'ms-asset-gallery';

    wrapper.appendChild(this._renderHeader());
    wrapper.appendChild(this._renderFilterBar());

    const grid = document.createElement('div');
    grid.className = 'ms-asset-grid';
    grid.id = 'media-studio-asset-grid';
    wrapper.appendChild(grid);
    this._gridEl = grid;

    container.appendChild(wrapper);
    await this._loadAndRender();
  }

  _renderHeader() {
    const header = document.createElement('div');
    header.className = 'ms-asset-gallery-header';
    const title = document.createElement('h2');
    title.textContent = '素材管理';
    header.appendChild(title);
    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'ms-btn ms-btn-primary';
    uploadBtn.textContent = '上传素材';
    uploadBtn.addEventListener('click', () => this._showUploadDialog());
    header.appendChild(uploadBtn);
    return header;
  }

  _renderFilterBar() {
    const bar = document.createElement('div');
    bar.className = 'ms-asset-gallery-filter-bar';

    const typeSelect = document.createElement('select');
    typeSelect.className = 'ms-select';
    for (const { value, label } of TYPE_FILTERS) {
      const el = document.createElement('option');
      el.value = value; el.textContent = label; typeSelect.appendChild(el);
    }
    typeSelect.value = this._filterType;
    typeSelect.addEventListener('change', () => {
      this._filterType = typeSelect.value;
      this._renderGrid();
    });
    bar.appendChild(typeSelect);

    return bar;
  }

  async _loadAndRender() {
    try {
      const result = await this._ar().find({ sort: '-createdAt' });
      this._assets = result.records || [];
    } catch (e) {
      this._assets = [];
    }
    this._renderGrid();
  }

  _renderGrid() {
    empty(this._gridEl);
    let filtered = [...this._assets];
    if (this._filterType !== 'all') {
      filtered = filtered.filter(a => a.type === this._filterType);
    }

    if (filtered.length === 0) {
      this._gridEl.innerHTML = '<div class="ms-asset-empty"><div style="font-size:32px;opacity:0.3;">-</div><div>暂无素材</div><div style="font-size:12px;">点击右上角「上传素材」添加</div></div>';
      return;
    }

    for (const asset of filtered) {
      const card = new AssetCard(asset, {
        onClick: (a) => this._showAssetDetail(a),
        onDelete: (a) => this._deleteAsset(a)
      });
      this._gridEl.appendChild(card.render());
    }
  }

  _showUploadDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.accept = 'image/*,video/*,audio/*';
    input.multiple = true;
    input.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      for (const file of files) {
        await this._uploadFile(file);
      }
      await this._loadAndRender();
    });
    document.body.appendChild(input);
    input.click();
    setTimeout(() => input.remove(), 1000);
  }

  async _uploadFile(file) {
    let type = 'other';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    const uuid = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    const now = new Date();
    const monthDir = String(now.getFullYear()) + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const relPath = 'workspace/assets/' + monthDir + '/' + uuid + '-' + file.name;

    try {
      await this.api.mkdir('workspace/assets/' + monthDir);

      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      await this.api.writeFile(relPath, dataUrl);

      await this._ar().create({
        taskId: '',
        type: type,
        fileName: file.name,
        filePath: relPath,
        mimeType: file.type,
        fileSize: file.size,
        thumbnailPath: '',
        metadata: {},
        status: 'completed'
      });
    } catch (e) {
      console.error('上传素材失败:', e);
    }
  }

  async _deleteAsset(asset) {
    try {
      await this._ar().delete(asset.id);
      await this._loadAndRender();
    } catch (e) {
      console.error('删除素材失败:', e);
    }
  }

  _showAssetDetail(asset) {
    const overlay = document.createElement('div');
    overlay.className = 'ms-task-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const modal = document.createElement('div');
    modal.className = 'ms-task-modal';

    const title = document.createElement('h3');
    title.textContent = '素材详情';
    modal.appendChild(title);

    if (asset.type === 'image' && asset.filePath) {
      const previewContainer = document.createElement('div');
      previewContainer.style.cssText = 'text-align:center;margin-bottom:16px;';
      const img = document.createElement('img');
      img.src = '/' + asset.filePath;
      img.style.cssText = 'max-width:100%;max-height:300px;border-radius:var(--ms-radius-sm, 4px);';
      previewContainer.appendChild(img);
      modal.appendChild(previewContainer);
    }

    const fieldDefs = [
      { label: '文件名', value: asset.fileName || '-' },
      { label: '类型', value: { image: '图片', video: '视频', audio: '音频' }[asset.type] || asset.type },
      { label: '大小', value: asset.fileSize ? (asset.fileSize / 1024).toFixed(0) + ' KB' : '-' },
      { label: 'MIME 类型', value: asset.mimeType || '-' },
      { label: '创建时间', value: asset.createdAt || '-' }
    ];

    for (const f of fieldDefs) {
      const row = document.createElement('div');
      row.className = 'ms-form-row';
      row.style.cssText = 'margin-bottom:12px;flex-direction:column;align-items:stretch;';
      const label = document.createElement('div');
      label.className = 'ms-form-label';
      label.style.cssText = 'font-size:12px;margin-bottom:4px;';
      label.textContent = f.label;
      const val = document.createElement('div');
      val.style.cssText = 'font-size:13px;color:var(--ms-text-primary, #e0e0e0);word-break:break-all;';
      val.textContent = f.value;
      row.appendChild(label);
      row.appendChild(val);
      modal.appendChild(row);
    }

    const actionArea = document.createElement('div');
    actionArea.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;margin-top:16px;';

    if (asset.filePath) {
      const previewBtn = document.createElement('button');
      previewBtn.className = 'ms-btn';
      previewBtn.textContent = '预览';
      previewBtn.onclick = () => window.open('/' + asset.filePath, '_blank');
      actionArea.appendChild(previewBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'ms-btn';
    delBtn.textContent = '删除';
    delBtn.style.cssText = 'color:var(--ms-danger, #e74c3c);border-color:var(--ms-danger, #e74c3c);';
    delBtn.onclick = async () => {
      if (!window.confirm('确认删除此素材？')) return;
      await this._deleteAsset(asset);
      overlay.remove();
    };
    actionArea.appendChild(delBtn);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'ms-btn ms-btn-primary';
    closeBtn.textContent = '关闭';
    closeBtn.onclick = () => overlay.remove();
    actionArea.appendChild(closeBtn);

    modal.appendChild(actionArea);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
}
