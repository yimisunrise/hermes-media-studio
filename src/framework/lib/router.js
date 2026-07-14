class Router {
  constructor(state, { defaultView = 'kanban' } = {}) {
    this.state = state;
    this.routes = {};
    this.currentView = null;
    this.defaultView = defaultView;
    this._onHashChange = this._onHashChange.bind(this);
  }

  register(view, renderFn) {
    this.routes[view] = renderFn;
  }

  init() {
    window.addEventListener('hashchange', this._onHashChange);
    if (window.location.hash && window.location.hash !== '#') {
      this._onHashChange();
    }
  }

  _onHashChange() {
    const hash = window.location.hash.slice(1) || this.defaultView;
    const parts = hash.split('/');
    const view = parts[0];

    if (!this.routes[view]) {
      window.location.hash = '#' + this.defaultView;
      return;
    }

    this.currentView = view;
    this.state.setView(view);

    const renderFn = this.routes[view];
    if (renderFn) {
      renderFn(parts.slice(1));
    }
  }

  navigate(view) {
    window.location.hash = view;
  }

  destroy() {
    window.removeEventListener('hashchange', this._onHashChange);
  }
}

export default Router;
