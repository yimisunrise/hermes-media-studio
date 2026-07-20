import { empty } from '../../framework/utils/dom.js';
import { assetRepo } from '../data/index.js';
import { AssetCard } from './components/AssetCard.js';
import { Modal } from '../../framework/ui/Modal.js';
import { AssetUploader } from '../services/AssetUploader.js';

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
      .ms-asset-empty { grid-column: 1 / -1; }
      .ms-asset-upload-input { display: none; }
      .ms-media-card:hover .ms-item-card-actions { display: flex; }
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
      this._gridEl.innerHTML = '<div class="ms-empty" style="grid-column:1/-1"><svg class="ms-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg><div>暂无素材，点击上方上传</div></div>';
      return;
    }

    for (const asset of filtered) {
      const card = new AssetCard(asset, {
        api: this.api,
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
    try {
      await AssetUploader.uploadFile(file, this.api, this._ar());
    } catch (e) {
      console.error('上传素材失败:', e);
    }
  }

  _confirmDelete() {
    return new Promise((resolve) => {
      const id = 'ag-confirm-del-' + Date.now();
      const modal = new Modal({ title: '确认删除', size: 'sm' });
      modal.setBody('<p style="margin:0;font-size:14px;color:var(--ms-text-primary);">确认删除此素材？此操作不可恢复。</p>');
      modal.setFooter(`
        <button class="ms-btn" id="${id}-cancel">取消</button>
        <button class="ms-btn ms-btn-primary" style="background:var(--ms-danger,#e74c3c);border-color:var(--ms-danger,#e74c3c);" id="${id}-confirm">确认删除</button>
      `);
      modal.open();
      modal.el.querySelector(`#${id}-cancel`).onclick = () => { modal.close(); resolve(false); };
      modal.el.querySelector(`#${id}-confirm`).onclick = () => { modal.close(); resolve(true); };
      modal.el.querySelector(`#${id}-confirm`).focus();
    });
  }

  async _deleteAsset(asset) {
    const confirmed = await this._confirmDelete();
    if (!confirmed) return;
    try {
      if (asset.filePath) {
        try {
          await this.api.delete(asset.filePath);
        } catch (e) {
          console.warn('删除磁盘文件失败（可能已不存在）:', e);
        }
      }
      await this._ar().delete(asset.id);
      await this._loadAndRender();
    } catch (e) {
      console.error('删除素材失败:', e);
    }
  }

  async _showAssetDetail(asset) {
    const modal = new Modal({ title: '素材详情', size: 'md' });

    let bodyHtml = '';
    if (asset.type === 'image' && asset.filePath) {
      bodyHtml += `<div style="text-align:center;margin-bottom:16px;">
        <img id="ag-preview-img" src="" style="max-width:100%;max-height:300px;border-radius:var(--ms-radius-sm,4px);display:none;" />
        <div id="ag-preview-loading" style="padding:40px;color:var(--ms-text-secondary,#a0a0a0);font-size:13px;">加载中...</div>
      </div>`;
    }
    if (asset.type === 'video' && asset.filePath) {
      bodyHtml += `<div style="text-align:center;margin-bottom:16px;">
        <video id="ag-preview-video" controls playsinline style="max-width:100%;max-height:300px;border-radius:var(--ms-radius-sm,4px);display:none;background:#000;"></video>
        <div id="ag-preview-loading" style="padding:40px;color:var(--ms-text-secondary,#a0a0a0);font-size:13px;">加载中...</div>
      </div>`;
    }

    const fieldDefs = [
      { label: '文件名', value: asset.fileName || '-' },
      { label: '类型', value: { image: '图片', video: '视频', audio: '音频' }[asset.type] || asset.type },
      { label: '大小', value: asset.fileSize ? (asset.fileSize / 1024).toFixed(0) + ' KB' : '-' },
      { label: 'MIME 类型', value: asset.mimeType || '-' },
      { label: '创建时间', value: asset.createdAt || '-' }
    ];
    for (const f of fieldDefs) {
      bodyHtml += `<div class="ms-form-group">
        <label>${f.label}</label>
        <div style="font-size:13px;color:var(--ms-text-primary,#e0e0e0);word-break:break-all;">${String(f.value)}</div>
      </div>`;
    }

    let footerHtml = '';
    if (asset.filePath) {
      footerHtml += `<button class="ms-btn" id="ag-preview">预览</button>`;
      footerHtml += `<button class="ms-btn" id="ag-download" style="margin-left:6px;">下载原始文件</button>`;
    }
    footerHtml += `<button class="ms-btn" style="color:var(--ms-danger,#e74c3c);border-color:var(--ms-danger,#e74c3c);" id="ag-delete">删除</button>
      <button class="ms-btn ms-btn-primary" id="ag-close">关闭</button>`;

    modal.setBody(bodyHtml);
    modal.setFooter(footerHtml);
    modal.open();

    // Async load preview image/video via API
    if (asset.type === 'image' && asset.filePath) {
      this.api.readAsDataURL(asset.filePath, asset.mimeType).then(url => {
        const img = modal.el.querySelector('#ag-preview-img');
        const loading = modal.el.querySelector('#ag-preview-loading');
        if (img && loading) {
          img.src = url;
          img.style.display = '';
          loading.style.display = 'none';
        }
      }).catch(() => {
        const loading = modal.el.querySelector('#ag-preview-loading');
        if (loading) loading.textContent = '加载失败';
      });
    }
    if (asset.type === 'video' && asset.filePath) {
      this.api.getDownloadUrl(asset.filePath, asset.mimeType).then(url => {
        const video = modal.el.querySelector('#ag-preview-video');
        const loading = modal.el.querySelector('#ag-preview-loading');
        if (video && loading) {
          video.src = url;
          video.style.display = '';
          loading.style.display = 'none';
        }
      }).catch(() => {
        const loading = modal.el.querySelector('#ag-preview-loading');
        if (loading) loading.textContent = '加载失败';
      });
    }

    modal.el.querySelector('#ag-close').onclick = () => modal.close();
    if (asset.filePath) {
      modal.el.querySelector('#ag-download').onclick = async () => {
        const btn = modal.el.querySelector('#ag-download');
        btn.textContent = '下载中...';
        btn.disabled = true;
        try {
          await this.api.downloadAsFile(asset.filePath, asset.fileName, asset.mimeType);
        } catch (e) {
          console.error('下载失败:', e);
        } finally {
          btn.textContent = '下载原始文件';
          btn.disabled = false;
        }
      };
      modal.el.querySelector('#ag-preview').onclick = async () => {
        if (asset.type === 'video') {
          const video = modal.el.querySelector('#ag-preview-video');
          if (video) {
            video.scrollIntoView({ behavior: 'smooth', block: 'center' });
            video.play().catch(() => {});
          }
        } else {
          try {
            const url = await this.api.getDownloadUrl(asset.filePath, asset.mimeType);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 60000);
          } catch (e) {
            console.error('预览失败:', e);
          }
        }
      };
    }
    modal.el.querySelector('#ag-delete').onclick = async () => {
      const confirmed = await this._confirmDelete();
      if (!confirmed) return;
      await this._deleteAsset(asset);
      modal.close();
    };
  }
}
