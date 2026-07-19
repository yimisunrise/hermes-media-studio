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
    this._logoSvg = null;
    this._onNavTabClick = this._onNavTabClick.bind(this);
    this._onRailBtnClick = this._onRailBtnClick.bind(this);
  }

  async init() {
    if (this._injected) return;
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      await this._inject();
    } else {
      document.addEventListener('DOMContentLoaded', () => this._inject());
    }
  }

  async _loadLogoSvg() {
    if (this._logoSvg) return;
    try {
      const res = await fetch('/extensions/assets/logo.svg');
      if (!res.ok) throw new Error('Failed to load logo.svg');
      const text = await res.text();
      const match = text.match(/<svg[^>]*>[\s\S]*?<\/svg>/i);
      this._logoSvg = match ? match[0] : '';
    } catch {
      this._logoSvg = '';
    }
  }

  async _inject() {
    if (this._injected) return;
    await this._loadLogoSvg();
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
    btn.title = 'Media Studio \u2014 \u81ea\u5a92\u4f53\u8fd0\u8425\u52a9\u624b';
    btn.innerHTML = this._logoSvg.replace('<svg', '<svg width="20" height="20"');
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
    link.innerHTML = this._logoSvg.replace('<svg', '<svg width="18" height="18" style="vertical-align:middle;margin-right:4px"') + ' Media Studio';
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
      this._deactivate();                       // 先清理 UI
      e.stopPropagation();                      // 阻止宿主 inline onclick 双重触发
      const panel = tab.dataset.panel;
      if (panel && typeof window.switchPanel === 'function') {
        window.switchPanel(panel);              // 自行切换，无 fromRailClick
      }
    }
  }

  _onRailBtnClick() {
    if (this._active) {
      this._deactivate();
      // 调用方负责恢复宿主面板
      if (this._prevHostPanel && typeof window.switchPanel === 'function') {
        window.switchPanel(this._prevHostPanel);
      }
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
