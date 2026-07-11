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
    rail.appendChild(separator);

    const btn = document.createElement('button');
    btn.className = 'rail-btn ms-rail-btn';
    btn.dataset.panel = 'media-studio';
    btn.title = 'Media Studio \u2014 \u81ea\u5a92\u4f53\u5185\u5bb9\u751f\u4ea7\u6d41\u6c34\u7ebf';
    btn.innerHTML = '\uD83C\uDFAC <span>Media Studio</span>';
    btn.addEventListener('click', this._onRailBtnClick);
    rail.appendChild(btn);
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

    document.querySelectorAll('.ms-rail-btn').forEach(el => {
      el.classList.add(SELECTORS.activeClass);
    });

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

    document.querySelectorAll('.ms-rail-btn').forEach(el => {
      el.classList.remove(SELECTORS.activeClass);
    });

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
