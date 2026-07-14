/**
 * DOM Helper Utilities for Media Studio Extension
 * Namespace: ms-* classes, media-studio-* IDs
 */

export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = val;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, val);
    } else if (key === 'style' && typeof val === 'object') {
      Object.assign(el.style, val);
    } else if (key.startsWith('on')) {
      el.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (key === 'innerHTML') {
      el.innerHTML = val;
    } else {
      el.setAttribute(key, val);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }
  return el;
}

export function render(container, template) {
  container.innerHTML = '';
  if (typeof template === 'string') {
    container.innerHTML = template;
  } else if (template instanceof Node) {
    container.appendChild(template);
  }
}

export function show(el) {
  if (el) el.style.display = '';
}

export function hide(el) {
  if (el) el.style.display = 'none';
}

export function toggle(el) {
  if (el) el.style.display = (el.style.display === 'none' ? '' : 'none');
}

export function qs(selector, context = document) {
  return context.querySelector(selector);
}

export function qsa(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function throttle(fn, ms = 200) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

export function on(el, event, selector, handler) {
  if (typeof selector === 'function') {
    el.addEventListener(event, selector);
    return;
  }
  el.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target) handler(e, target);
  });
}

export function empty(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function fragment(html) {
  const tmpl = document.createElement('template');
  tmpl.innerHTML = html.trim();
  return tmpl.content;
}
