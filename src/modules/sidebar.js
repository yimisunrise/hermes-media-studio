/* ============================================================
   Hermes WebUI Sidebar Integration
   ============================================================ */

const SELECTORS = {
  rail: '.rail',
  sidebarNav: '.sidebar-nav',
  navTab: '.nav-tab',
  main: 'main',
  activeClass: 'active'
};

class SidebarManager {
  constructor() {
    this._injected = false;
    this._active = false;
    this._onNavTabClick = this._onNavTabClick.bind(this);
    this._onRailBtnClick = this._onRailBtnClick.bind(this);
  }

  init() {
    if (this._injected) return;
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      this._inject();
    } else {
      document.addEventListener('DOMContentLoaded', () => this._inject());
    }
  }

  _inject() {
    if (this._injected) return;
    this._injectRail();
    this._injectMobile();
    this._listenNativeTabs();
    this._injected = true;
  }

  _injectRail() {
    const rail = document.querySelector(SELECTORS.rail);
    if (!rail) return;
    if (rail.querySelector('.ms-rail-btn')) return;

    const separator = document.createElement('hr');
    separator.className = 'ms-rail-separator';

    const btn = document.createElement('button');
    btn.className = 'rail-btn ms-rail-btn';
    btn.dataset.panel = 'media-studio';
    btn.title = 'Media Studio \u2014 \u81ea\u5a92\u4f53\u5185\u5bb9\u751f\u4ea7\u6d41\u6c34\u7ebf';
    btn.innerHTML = '\uD83C\uDFAC';
    btn.addEventListener('click', this._onRailBtnClick);

    const controlBtn = rail.querySelector('[data-panel="control-center"], .rail-btn:last-child');
    if (controlBtn && controlBtn !== btn) {
      rail.insertBefore(separator, controlBtn);
      rail.insertBefore(btn, controlBtn);
    } else {
      rail.appendChild(separator);
      rail.appendChild(btn);
    }
  }

  _injectMobile() {
    const sidebarNav = document.querySelector(SELECTORS.sidebarNav);
    if (!sidebarNav) return;
    if (sidebarNav.querySelector('.ms-rail-btn')) return;

    const link = document.createElement('a');
    link.className = 'sidebar-link ms-rail-btn';
    link.href = '#';
    link.innerHTML = '\uD83C\uDFAC Media Studio';
    link.addEventListener('click', (e) => {
      e.preventDefault();
      this._onRailBtnClick();
      const closeBtn = document.querySelector(
        '.mobile-sidebar-toggle, .sidebar-close, .drawer-toggle'
      );
      if (closeBtn) closeBtn.click();
    });
    sidebarNav.appendChild(link);
  }

  _listenNativeTabs() {
    document.addEventListener('click', this._onNavTabClick, true);
  }

  _onNavTabClick(e) {
    const tab = e.target.closest(SELECTORS.navTab);
    if (!tab) return;
    if (tab.dataset.panel === 'media-studio') return;
    if (this._active) {
      this._deactivate();
    }
  }

  _onRailBtnClick() {
    if (this._active) {
      this._deactivate();
    } else {
      this._activate();
    }
  }

  _activate() {
    this._active = true;

    // ── Save host state for restore ──
    this._prevHostPanel = null;
    const activeHostTab = document.querySelector('.rail .nav-tab.active[data-panel]');
    if (activeHostTab && activeHostTab.dataset.panel !== 'media-studio') {
      this._prevHostPanel = activeHostTab.dataset.panel;
    }

    const titleEl = document.getElementById('appTitlebarTitle');
    const subEl = document.getElementById('appTitlebarSub');
    this._prevTitle = titleEl ? titleEl.textContent : '';
    this._prevSub = subEl ? subEl.textContent : '';
    if (titleEl) titleEl.textContent = 'Media Studio';
    if (subEl) subEl.textContent = '自媒体运营助手';

    // ── Activate our rail buttons ──
    document.querySelectorAll('.ms-rail-btn').forEach(el => {
      el.classList.add(SELECTORS.activeClass);
    });

    // ── Deactivate ALL host rail buttons ──
    // Host uses .nav-tab.active on rail buttons; clear them so none looks selected.
    document.querySelectorAll('.rail .nav-tab.active[data-panel]').forEach(el => {
      if (el.dataset.panel !== 'media-studio') {
        el.classList.remove(SELECTORS.activeClass);
      }
    });

    // ── Hide host sidebar ──
    const sidebar = document.querySelector('aside.sidebar');
    if (sidebar) {
      sidebar.style.display = 'none';
    }

    // ── Hide host main children, show our app ──
    const main = document.querySelector(SELECTORS.main);
    if (main) {
      main.querySelectorAll(':scope > *').forEach(child => {
        if (child.id !== 'media-studio-app') {
          child.style.display = 'none';
        }
      });
    }

    const app = document.getElementById('media-studio-app');
    if (app) {
      app.style.display = 'flex';
    }

    document.dispatchEvent(new CustomEvent('ms:activated'));
  }

  _deactivate() {
    this._active = false;

    // ── Deactivate our rail buttons ──
    document.querySelectorAll('.ms-rail-btn').forEach(el => {
      el.classList.remove(SELECTORS.activeClass);
    });

    // ── Restore host sidebar ──
    const sidebar = document.querySelector('aside.sidebar');
    if (sidebar) {
      sidebar.style.display = '';
    }

    // ── Restore host main children, hide our app ──
    const main = document.querySelector(SELECTORS.main);
    if (main) {
      main.querySelectorAll(':scope > *').forEach(child => {
        if (child.id !== 'media-studio-app') {
          child.style.display = '';
        }
      });
    }

    const app = document.getElementById('media-studio-app');
    if (app) {
      app.style.display = 'none';
    }

    // ── Restore host panel state ──
    if (this._prevHostPanel) {
      const tab = document.querySelector(`.rail .nav-tab[data-panel="${this._prevHostPanel}"]`);
      if (tab) tab.classList.add(SELECTORS.activeClass);
      if (typeof window.switchPanel === 'function') {
        window.switchPanel(this._prevHostPanel);
      }
      this._prevHostPanel = null;
    }

    // ── Restore titlebar ──
    const titleEl = document.getElementById('appTitlebarTitle');
    const subEl = document.getElementById('appTitlebarSub');
    if (titleEl && this._prevTitle !== undefined) titleEl.textContent = this._prevTitle;
    if (subEl && this._prevSub !== undefined) subEl.textContent = this._prevSub;
    this._prevTitle = undefined;
    this._prevSub = undefined;

    // Clear the hash so the URL doesn't show a stale Media Studio route
    history.replaceState(null, '', window.location.pathname + window.location.search);

    document.dispatchEvent(new CustomEvent('ms:deactivated'));
  }

  isActive() {
    return this._active;
  }

  destroy() {
    document.removeEventListener('click', this._onNavTabClick, true);
    this._injected = false;
    this._active = false;
  }
}

const instance = new SidebarManager();
export default instance;
