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
      .ms-asset-card { background: var(--ms-bg-card, #0f3460); border: 1px solid var(--ms-border, #2a2a4a); border-radius: var(--ms-radius, 8px); overflow: hidden; transition: border-color 0.2s ease; cursor: pointer; }
      .ms-asset-card:hover { border-color: var(--ms-accent, #e94560); }
      .ms-asset-thumb { width: 100%; height: 140px; background: var(--ms-bg-primary, #1a1a2e); display: flex; align-items: center; justify-content: center; overflow: hidden; }
      .ms-asset-thumb img { width: 100%; height: 100%; object-fit: cover; }
      .ms-asset-thumb video { width: 100%; height: 100%; object-fit: cover; display: block; }
      .ms-asset-thumb-icon { font-size: 32px; color: var(--ms-text-secondary, #a0a0a0); }
      .ms-asset-info { padding: 10px 12px; }
      .ms-asset-name { font-size: 13px; color: var(--ms-text-primary, #e0e0e0); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
      .ms-asset-meta { font-size: 11px; color: var(--ms-text-secondary, #a0a0a0); display: flex; gap: 8px; }
      .ms-asset-type-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; background: var(--ms-bg-primary, #1a1a2e); color: var(--ms-accent, #e94560); border: 1px solid var(--ms-border, #2a2a4a); }
      .ms-asset-empty { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; color: var(--ms-text-secondary, #a0a0a0); gap: 8px; text-align: center; }
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

  async _deleteAsset(asset) {
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
      bodyHtml += `<div class="ms-form-row" style="margin-bottom:12px;flex-direction:column;align-items:stretch;">
        <div class="ms-form-label" style="font-size:12px;margin-bottom:4px;">${f.label}</div>
        <div style="font-size:13px;color:var(--ms-text-primary,#e0e0e0);word-break:break-all;">${String(f.value)}</div>
      </div>`;
    }

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

    let footerHtml = '';
    if (asset.filePath) {
      footerHtml += `<button class="ms-btn" id="ag-preview">预览</button>`;
      footerHtml += `<button class="ms-btn" id="ag-download" style="margin-left:6px;">下载原始文件</button>`;
    }
    footerHtml += `<button class="ms-btn" style="color:var(--ms-danger,#e74c3c);border-color:var(--ms-danger,#e74c3c);" id="ag-delete">删除</button>
      <button class="ms-btn ms-btn-primary" id="ag-close">关闭</button>`;
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
      if (!window.confirm('确认删除此素材？')) return;
      await this._deleteAsset(asset);
      modal.close();
    };
  }
}
