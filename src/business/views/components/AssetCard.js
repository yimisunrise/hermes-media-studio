const TYPE_LABELS = { image: '图片', video: '视频', audio: '音频' };

export class AssetCard {
  constructor(asset, options = {}) {
    this.asset = asset;
    this.options = options;
  }

  render() {
    const card = document.createElement('div');
    card.className = 'ms-asset-card-item';
    card.dataset.id = this.asset.id;

    if (this.options.compact) {
      return this._renderCompact(card);
    }

    const thumb = document.createElement('div');
    thumb.className = 'ms-asset-card-thumb';

    if (this.asset.type === 'image' && this.asset.filePath) {
      const img = document.createElement('img');
      img.alt = this.asset.fileName || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      img.onerror = function () { this.style.display = 'none'; };
      thumb.appendChild(img);
      if (this.options.api) {
        this.options.api.readAsDataURL(this.asset.filePath, this.asset.mimeType)
          .then(url => { img.src = url; })
          .catch(() => { img.style.display = 'none'; });
      }
    } else if (this.asset.type === 'video' && this.asset.filePath) {
      thumb.style.position = 'relative';
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      video.onerror = function () { this.style.display = 'none'; };
      thumb.appendChild(video);

      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.25);pointer-events:none;';
      overlay.innerHTML = '<svg viewBox="0 0 24 24" width="36" height="36" fill="rgba(255,255,255,0.85)"><path d="M8 5v14l11-7z"/></svg>';
      thumb.appendChild(overlay);

      if (this.options.api) {
        this.options.api.getDownloadUrl(this.asset.filePath, this.asset.mimeType)
          .then(url => { video.src = url; })
          .catch(() => { video.style.display = 'none'; overlay.style.display = 'none'; });
      }
    } else {
      const icons = { image: '\u{1F5BC}', video: '\u{1F3AC}', audio: '\u{1F3B5}' };
      const iconEl = document.createElement('div');
      iconEl.style.cssText = 'font-size:28px;opacity:0.4;';
      iconEl.textContent = icons[this.asset.type] || '\u{1F4C4}';
      thumb.appendChild(iconEl);
    }
    card.appendChild(thumb);

    const info = document.createElement('div');
    info.className = 'ms-asset-card-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'ms-asset-card-name';
    nameEl.textContent = this.asset.fileName || this.asset.id || '未命名';
    info.appendChild(nameEl);

    const meta = document.createElement('div');
    meta.className = 'ms-asset-card-meta';

    const badge = document.createElement('span');
    badge.className = 'ms-asset-card-badge';
    badge.textContent = TYPE_LABELS[this.asset.type] || this.asset.type;
    meta.appendChild(badge);

    if (this.asset.fileSize) {
      const sizeEl = document.createElement('span');
      sizeEl.textContent = this.asset.fileSize > 1024 * 1024
        ? (this.asset.fileSize / 1024 / 1024).toFixed(1) + ' MB'
        : (this.asset.fileSize / 1024).toFixed(0) + ' KB';
      meta.appendChild(sizeEl);
    }

    info.appendChild(meta);
    card.appendChild(info);

    if (this.options.onDelete) {
      const delBtn = document.createElement('button');
      delBtn.className = 'ms-asset-card-del';
      delBtn.innerHTML = '&#10006;';
      delBtn.title = '删除';
      delBtn.style.cssText = 'position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;border:none;background:rgba(0,0,0,0.5);color:#fff;font-size:11px;cursor:pointer;display:none;align-items:center;justify-content:center;';
      card.style.position = 'relative';
      card.addEventListener('mouseenter', () => { delBtn.style.display = 'flex'; });
      card.addEventListener('mouseleave', () => { delBtn.style.display = 'none'; });
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.confirm('确认删除此素材？')) this.options.onDelete(this.asset);
      });
      card.appendChild(delBtn);
    }

    if (this.options.onClick) {
      card.addEventListener('click', () => this.options.onClick(this.asset));
    }

    return card;
  }

  _renderCompact(card) {
    card.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px;background:var(--ms-bg-primary, #1a1a2e);border-radius:var(--ms-radius-sm, 4px);margin-bottom:4px;';

    const thumb = document.createElement('div');
    thumb.style.cssText = 'width:40px;height:40px;border-radius:4px;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--ms-bg-card, #0f3460);';

    if (this.asset.type === 'image' && this.asset.filePath) {
      const img = document.createElement('img');
      img.alt = '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      img.onerror = function () { this.style.display = 'none'; };
      thumb.appendChild(img);
      if (this.options.api) {
        this.options.api.readAsDataURL(this.asset.filePath, this.asset.mimeType)
          .then(url => { img.src = url; })
          .catch(() => { img.style.display = 'none'; });
      }
    } else if (this.asset.type === 'video' && this.asset.filePath) {
      thumb.style.position = 'relative';
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      video.onerror = function () { this.style.display = 'none'; };
      thumb.appendChild(video);

      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.25);pointer-events:none;';
      overlay.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="rgba(255,255,255,0.85)"><path d="M8 5v14l11-7z"/></svg>';
      thumb.appendChild(overlay);

      if (this.options.api) {
        this.options.api.getDownloadUrl(this.asset.filePath, this.asset.mimeType)
          .then(url => { video.src = url; })
          .catch(() => { video.style.display = 'none'; overlay.style.display = 'none'; });
      }
    } else {
      const icons = { image: '\u{1F5BC}', video: '\u{1F3AC}', audio: '\u{1F3B5}' };
      const iconEl = document.createElement('span');
      iconEl.style.cssText = 'font-size:16px;opacity:0.5;';
      iconEl.textContent = icons[this.asset.type] || '\u{1F4C4}';
      thumb.appendChild(iconEl);
    }
    card.appendChild(thumb);

    const info = document.createElement('div');
    info.style.cssText = 'flex:1;min-width:0;';

    const nameEl = document.createElement('div');
    nameEl.style.cssText = 'font-size:12px;color:var(--ms-text-primary, #e0e0e0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    nameEl.textContent = this.asset.fileName || '未命名';
    info.appendChild(nameEl);

    const meta = document.createElement('div');
    meta.style.cssText = 'font-size:10px;color:var(--ms-text-secondary, #a0a0a0);margin-top:2px;';
    meta.textContent = (TYPE_LABELS[this.asset.type] || this.asset.type) + (this.asset.fileSize ? ' \u00B7 ' + (this.asset.fileSize / 1024).toFixed(0) + ' KB' : '');
    info.appendChild(meta);

    card.appendChild(info);

    if (this.options.onDelete) {
      const delBtn = document.createElement('button');
      delBtn.innerHTML = '&#10006;';
      delBtn.style.cssText = 'width:20px;height:20px;border:none;background:transparent;color:var(--ms-danger, #e74c3c);cursor:pointer;font-size:12px;';
      delBtn.title = '删除';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.confirm('确认删除此素材？')) this.options.onDelete(this.asset);
      });
      card.appendChild(delBtn);
    }

    if (this.options.onClick) {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.ms-asset-card-del')) return;
        this.options.onClick(this.asset);
      });
    }

    return card;
  }
}
