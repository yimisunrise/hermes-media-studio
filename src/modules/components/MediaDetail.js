import { createElement, empty } from '../utils/dom.js';
import { formatDateTime, formatFileSize } from '../utils/format.js';

export class MediaDetail {
  constructor(api, state) {
    this.api = api;
    this.state = state;
    this.overlay = null;
    this.currentAsset = null;
  }

  show(asset) {
    this.currentAsset = asset;
    this.overlay = document.createElement('div');
    this.overlay.className = 'ms-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'ms-modal';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'ms-modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => this.close());
    modal.appendChild(closeBtn);

    const detail = this._renderDetail(asset);
    modal.appendChild(detail);

    this.overlay.appendChild(modal);
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    document.addEventListener('keydown', this._keyHandler = (e) => {
      if (e.key === 'Escape') this.close();
    });

    document.body.appendChild(this.overlay);
  }

  close() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
  }

  _renderDetail(asset) {
    const meta = asset.meta || {};
    const gen = meta.generation || {};
    const review = meta.review || {};
    const history = meta.status_history || [];

    const layout = createElement('div', { className: 'ms-detail-layout' });

    const imageSection = createElement('div', { className: 'ms-detail-image' });
    const img = createElement('div', {
      className: 'ms-media-card-thumb',
      style: { aspectRatio: 'auto', minHeight: '300px', fontSize: '64px' }
    });
    img.textContent = '🖼';
    imageSection.appendChild(img);
    layout.appendChild(imageSection);

    const infoSection = createElement('div', { className: 'ms-detail-info' });
    const title = createElement('h2', {}, [asset.name || '未命名']);
    infoSection.appendChild(title);

    if (meta.theme) {
      const badge = createElement('span', { className: 'ms-media-card-theme', style: { fontSize: '13px' } }, [meta.theme]);
      infoSection.appendChild(badge);
    }

    const genSection = createElement('div', { className: 'ms-detail-section' });
    genSection.appendChild(createElement('h3', {}, ['生成参数']));
    const genGrid = createElement('div', { className: 'ms-detail-params' });
    const genFields = [
      ['模型', gen.model],
      ['Prompt', gen.prompt],
      ['负面 Prompt', gen.negative_prompt],
      ['种子', gen.seed],
      ['分辨率', gen.width && gen.height ? `${gen.width}×${gen.height}` : null],
      ['采样器', gen.sampler],
      ['步数', gen.steps],
      ['CFG Scale', gen.cfg],
      ['生成时间', formatDateTime(gen.generated_at)]
    ];
    for (const [label, val] of genFields) {
      if (!val) continue;
      genGrid.appendChild(createElement('div', { className: 'ms-detail-param-label' }, [label]));
      genGrid.appendChild(createElement('div', { className: 'ms-detail-param-value' }, [String(val)]));
    }
    genSection.appendChild(genGrid);
    infoSection.appendChild(genSection);

    const statusSection = createElement('div', { className: 'ms-detail-section' });
    statusSection.appendChild(createElement('h3', {}, ['状态历史']));
    const statusList = createElement('div', { style: { fontSize: '12px', lineHeight: '1.8' } });
    for (const entry of history) {
      const row = document.createTextNode(
        `[${formatDateTime(entry.changed_at)}] ${entry.status}${entry.note ? ' - ' + entry.note : ''}\n`
      );
      statusList.appendChild(row);
      statusList.appendChild(document.createElement('br'));
    }
    statusSection.appendChild(statusList);
    infoSection.appendChild(statusSection);

    if (meta.publish_history && meta.publish_history.length > 0) {
      const pubSection = createElement('div', { className: 'ms-detail-section' });
      pubSection.appendChild(createElement('h3', {}, ['发布记录']));
      for (const pub of meta.publish_history) {
        const pubEntry = createElement('div', { style: { fontSize: '12px', marginBottom: '8px' } });
        pubEntry.innerHTML = `
          <div>${pub.platform || ''} - ${formatDateTime(pub.published_at)}</div>
          ${pub.url ? `<a href="${pub.url}" target="_blank" style="color:var(--ms-info)">${pub.url}</a>` : ''}
          ${pub.stats ? `<div>👁 ${pub.stats.views||0} 👍 ${pub.stats.likes||0} 💬 ${pub.stats.comments||0} 🔄 ${pub.stats.shares||0}</div>` : ''}
        `;
        pubSection.appendChild(pubEntry);
      }
      infoSection.appendChild(pubSection);
    }

    if (meta.linked_copy && meta.linked_copy.length > 0) {
      const copySection = createElement('div', { className: 'ms-detail-section' });
      copySection.appendChild(createElement('h3', {}, ['使用记录']));
      for (const link of meta.linked_copy) {
        copySection.appendChild(createElement('div', { style: { fontSize: '12px' } }, [link]));
      }
      infoSection.appendChild(copySection);
    }

    layout.appendChild(infoSection);
    return layout;
  }
}
