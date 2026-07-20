/**
 * Shared Modal component.
 *
 * Usage:
 *   const m = new Modal({ title: '编辑', size: 'md' });
 *   m.setBody('<div>...</div>');
 *   m.setFooter('...');
 *   m.open();
 */

const SIZE_MAP = { sm: '360px', md: '480px', lg: '640px' };

export class Modal {
  /**
   * @param {Object} options
   * @param {string} [options.title] - auto-creates header with close button
   * @param {'sm'|'md'|'lg'} [options.size] - sm=360, md=480, lg=640
   * @param {string} [options.width] - custom CSS width (overrides size)
   * @param {string} [options.maxWidth] - custom CSS max-width
   * @param {boolean} [options.closeOnOverlay=true] - click overlay to close
   * @param {HTMLElement} [options.container=document.body]
   * @param {Function} [options.onClose] - close callback
   */
  constructor(options = {}) {
    const {
      title = '',
      size = null,
      width = null,
      maxWidth = null,
      closeOnOverlay = true,
      container = document.body,
      onClose = null,
    } = options;

    this._onClose = onClose;
    this._container = container;

    this._overlay = document.createElement('div');
    this._overlay.className = 'ms-overlay';
    this._el = document.createElement('div');
    this._el.className = 'ms-modal';

    if (size && SIZE_MAP[size]) this._el.style.width = SIZE_MAP[size];
    if (width) this._el.style.width = width;
    if (maxWidth) this._el.style.maxWidth = maxWidth;

    this._headerEl = document.createElement('div');
    this._headerEl.className = 'ms-modal-header';
    if (title) {
      const span = document.createElement('span');
      span.textContent = title;
      this._headerEl.appendChild(span);
      const btn = document.createElement('button');
      btn.className = 'ms-modal-header-close';
      btn.textContent = '✕';
      btn.addEventListener('click', () => this.close());
      this._headerEl.appendChild(btn);
    }
    this._el.appendChild(this._headerEl);

    this._bodyEl = document.createElement('div');
    this._bodyEl.className = 'ms-modal-body';
    this._el.appendChild(this._bodyEl);

    this._footerEl = document.createElement('div');
    this._footerEl.className = 'ms-modal-footer';
    this._el.appendChild(this._footerEl);

    if (closeOnOverlay) {
      this._overlay.addEventListener('click', (e) => {
        if (e.target === this._overlay) this.close();
      });
    }

    this._overlay.appendChild(this._el);
  }

  /** @returns {HTMLElement} */
  get el() { return this._el; }
  /** @returns {HTMLElement} */
  get headerEl() { return this._headerEl; }
  /** @returns {HTMLElement} */
  get bodyEl() { return this._bodyEl; }
  /** @returns {HTMLElement} */
  get footerEl() { return this._footerEl; }

  setHeader(content) {
    this._headerEl.innerHTML = '';
    if (typeof content === 'string') this._headerEl.innerHTML = content;
    else if (content instanceof Node) this._headerEl.appendChild(content);
    return this;
  }

  setBody(content) {
    this._bodyEl.innerHTML = '';
    if (typeof content === 'string') this._bodyEl.innerHTML = content;
    else if (content instanceof Node) this._bodyEl.appendChild(content);
    return this;
  }

  setFooter(content) {
    this._footerEl.innerHTML = '';
    if (typeof content === 'string') this._footerEl.innerHTML = content;
    else if (content instanceof Node) this._footerEl.appendChild(content);
    return this;
  }

  open() {
    this._container.appendChild(this._overlay);
    return this;
  }

  close() {
    if (this._onClose) this._onClose();
    this._overlay.remove();
  }
}
