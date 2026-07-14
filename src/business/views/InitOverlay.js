/**
 * InitOverlay — Fullscreen init progress overlay
 *
 * Lightweight DOM overlay displayed during automatic initialization.
 * Provides show(), update(), hide(), and hideAll() static methods.
 *
 * Usage:
 *   InitOverlay.show();
 *   InitOverlay.update('创建目录...');
 *   InitOverlay.hide();     // 300ms fade-out then DOM removal
 */

let _overlayEl = null;

function _ensureElement() {
  if (_overlayEl && _overlayEl.parentNode) return;
  const overlay = document.createElement('div');
  overlay.className = 'ms-init-overlay';
  overlay.innerHTML = `
    <div class="ms-init-overlay-content">
      <h2 class="ms-init-overlay-title">正在初始化工作空间</h2>
      <p class="ms-init-overlay-step" id="ms-init-overlay-step">&nbsp;</p>
      <div class="ms-init-overlay-spinner"><div></div><div></div><div></div></div>
    </div>
  `;
  document.body.appendChild(overlay);
  _overlayEl = overlay;
  // Trigger enter animation on next frame
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
  });
}

export class InitOverlay {
  /** Show the overlay. Creates DOM if not already present. */
  static show() {
    InitOverlay.hideAll();
    _ensureElement();
  }

  /** Update the step label text. */
  static update(label) {
    const el = document.getElementById('ms-init-overlay-step');
    if (el) el.textContent = label || '';
  }

  /** Fade out and remove overlay from DOM (300ms transition). */
  static hide() {
    if (!_overlayEl) return;
    _overlayEl.classList.remove('visible');
    _overlayEl.classList.add('fade-out');
    setTimeout(() => {
      if (_overlayEl && _overlayEl.parentNode) {
        _overlayEl.parentNode.removeChild(_overlayEl);
      }
      _overlayEl = null;
    }, 300);
  }

  /** Remove any existing overlay immediately (no animation). */
  static hideAll() {
    document.querySelectorAll('.ms-init-overlay').forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    _overlayEl = null;
  }
}
