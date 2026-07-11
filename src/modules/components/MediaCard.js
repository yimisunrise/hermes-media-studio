import { createElement } from '../utils/dom.js';
import { formatDate, truncate } from '../utils/format.js';

export class MediaCard {
  constructor(api, state) {
    this.api = api;
    this.state = state;
  }

  render(asset, options = {}) {
    const { showActions = true, compact = false, showCheckbox = false } = options;
    const meta = asset.meta || {};
    const gen = meta.generation || {};
    const isStarred = meta.is_starred;
    const isSelected = asset.selected || false;

    const card = createElement('div', {
      className: `ms-media-card${isSelected ? ' selected' : ''}`,
      dataset: { path: asset.path }
    });

    if (showCheckbox) {
      const cb = createElement('input', {
        type: 'checkbox',
        className: 'ms-card-checkbox',
        style: { position: 'absolute', top: '6px', left: '6px', zIndex: '2', cursor: 'pointer' }
      });
      cb.checked = isSelected;
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        this.state.toggleAssetSelection(asset.path);
      });
      card.appendChild(cb);
    }

    if (isStarred) {
      const star = createElement('span', {
        className: 'ms-media-card-star',
        innerHTML: '&#9733;'
      });
      card.appendChild(star);
    }

    const thumb = createElement('div', { className: 'ms-media-card-thumb' });
    thumb.textContent = '🖼';
    card.appendChild(thumb);

    const info = createElement('div', { className: 'ms-media-card-info' });

    if (meta.theme) {
      const themeBadge = createElement('span', { className: 'ms-media-card-theme' }, [meta.theme]);
      info.appendChild(themeBadge);
    }

    if (!compact) {
      const params = createElement('div', { className: 'ms-media-card-params' });
      const lines = [];
      if (gen.model) lines.push(`模型: ${gen.model}`);
      if (gen.seed) lines.push(`种子: ${gen.seed}`);
      if (gen.width && gen.height) lines.push(`${gen.width}×${gen.height}`);
      if (gen.steps) lines.push(`步数: ${gen.steps}`);
      params.textContent = lines.join(' | ');
      info.appendChild(params);
    }

    if (meta.created_at) {
      const date = createElement('div', {
        className: 'ms-media-card-params',
        style: { marginTop: '4px' }
      }, [formatDate(meta.created_at)]);
      info.appendChild(date);
    }

    card.appendChild(info);

    if (showActions) {
      this._addActions(card, asset);
    }

    return card;
  }

  _addActions(card, asset) {
    const meta = asset.meta || {};
  }
}
