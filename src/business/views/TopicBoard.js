import { empty } from '../../framework/utils/dom.js';
import { repo } from '../data/index.js';
import { Modal } from '../../framework/ui/Modal.js';

export class TopicBoard {
  constructor({ api, state, schemaRegistry }) {
    this.api = api;
    this.state = state;
    this._sr = schemaRegistry;
    this.topics = [];
    this.ideas = [];
    this.themes = [];
    this._filterStatus = '';
    this._filterTheme = '';
  }

  _topicRepo() { return repo(this.api, this._sr, 'topics'); }
  _ideaRepo() { return repo(this.api, this._sr, 'ideas'); }
  _themeRepo() { return repo(this.api, this._sr, 'themes'); }

  async render(container) {
    empty(container);
    await Promise.all([this._loadTopics(), this._loadThemes(), this._loadIdeas()]);
    this._container = container;

    const bar = ce('div', '');
    bar.className = 'ms-panel-header';
    bn(ce('span', '', '选题面板', { fontWeight: 600, fontSize: '15px' }), bar);
    const addBtn = btn('从灵感创建', 'primary', () => this._createFromIdea());
    bn(addBtn, bar);
    bn(bar, container);

    this._renderFilters(container);

    const wrap = ce('div', '');
    wrap.className = 'ms-panel-body';
    bn(wrap, container);

    let items = this.topics;
    if (this._filterStatus) items = items.filter(t => t.status === this._filterStatus);
    if (this._filterTheme) items = items.filter(t => t.themeId === this._filterTheme);

    if (!items.length) {
      wrap.innerHTML = '<div class="ms-empty" style="margin-top:40px;"><div class="ms-empty-icon">🎯</div><div>暂无选题，先在「灵感」中创建灵感，再转为选题</div></div>';
      return;
    }

    items.forEach(t => bn(this._card(t), wrap));
  }

  _renderFilters(container) {
    const f = ce('div', '');
    f.className = 'ms-panel-filterbar';

    const statuses = [['', '全部状态'], ['pending', '待处理'], ['in_progress', '进行中'], ['completed', '已完成'], ['cancelled', '已取消']];
    for (const [v, label] of statuses) {
      const b = document.createElement('button');
      b.className = `ms-btn ms-btn-sm${this._filterStatus === v ? ' ms-btn-primary' : ''}`;
      b.textContent = label;
      b.onclick = () => { this._filterStatus = v; this.render(this._container); };
      bn(b, f);
    }

    if (this.themes.length > 0) {
      const sep = ce('span', 'width:1px;height:16px;background:var(--ms-border);margin:0 4px;');
      bn(sep, f);
      const sel = document.createElement('select');
      sel.className = 'ms-form-input';
      sel.classList.add('ms-input-sm'); sel.style.width = 'auto';
      const oa = document.createElement('option'); oa.value=''; oa.textContent='全部主题'; bn(oa, sel);
      for (const t of this.themes) {
        const o = document.createElement('option'); o.value=t.id; o.textContent=t.name;
        if (t.id===this._filterTheme) o.selected=true;
        bn(o, sel);
      }
      sel.onchange = () => { this._filterTheme = sel.value; this.render(this._container); };
      bn(sel, f);
    }

    bn(f, container);
  }

  _card(t) {
    const ctLabels = { graphic: '图文', video: '短视频', text: '纯文字' };
    const stLabels = { pending: '待处理', in_progress: '进行中', completed: '已完成', cancelled: '已取消' };
    const stColors = { pending: 'var(--ms-accent)', in_progress: 'var(--ms-info)', completed: 'var(--ms-success)', cancelled: 'var(--ms-text-secondary)' };

    const el = ce('div', '');
    el.className = 'ms-item-card';

    const top = ce('div', 'display:flex;align-items:flex-start;gap:8px;');

    const info = ce('div', 'flex:1;min-width:0;');
    const titleRow = ce('div', 'display:flex;align-items:center;gap:8px;');
    bn(ce('div', 'font-weight:600;font-size:14px;', t.title), titleRow);

    if (t.contentType) {
      bn(sp('span', 'font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(33,150,243,0.15);color:var(--ms-info);', ctLabels[t.contentType]||t.contentType), titleRow);
    }
    bn(titleRow, info);

    const meta = ce('div', 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px;');

    const theme = this.themes.find(th => th.id === t.themeId);
    if (theme) {
      bn(sp('span', 'font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(233,69,96,0.15);color:var(--ms-accent);', theme.name), meta);
    }

    bn(sp('span', `font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(85,85,85,0.2);color:${stColors[t.status]||'var(--ms-text-secondary)'};`, stLabels[t.status]||t.status), meta);

    const idea = this.ideas.find(i => i.id === t.ideaId);
    if (idea) {
      bn(sp('span', 'font-size:11px;color:var(--ms-text-secondary);', `← ${idea.title}`), meta);
    }

    bn(sp('span', 'font-size:11px;color:var(--ms-text-secondary);margin-left:auto;', this._d(t.createdAt)), meta);
    bn(meta, info);
    bn(info, top);
    bn(top, el);

    const acts = ce('div', '');
    acts.className = 'ms-item-card-actions';
    bn(btn('编辑', null, (e) => { e.stopPropagation(); this._editTopic(t); }), acts);
    const db = btn('✕', null, (e) => { e.stopPropagation(); this._deleteTopic(t); });
    db.style.color = 'var(--ms-danger)'; db.title = '删除';
    bn(db, acts);
    bn(acts, el);

    el.onclick = () => this._editTopic(t);
    return el;
  }

  async _loadTopics() {
    try {
      const result = await this._topicRepo().find({ sort: '-createdAt' });
      this.topics = result.records || [];
    } catch { this.topics = []; }
  }
  async _loadThemes() {
    try {
      const result = await this._themeRepo().find({ sort: '-createdAt' });
      this.themes = result.records || [];
    } catch { this.themes = []; }
  }
  async _loadIdeas() {
    try {
      const result = await this._ideaRepo().find({ sort: '-createdAt' });
      this.ideas = (result.records || []).filter(i => i.status !== 'archived');
    } catch { this.ideas = []; }
  }

  _createFromIdea() {
    const m = new Modal({ title: '选择灵感', width: '500px' });
    const available = this.ideas.filter(i => i.status === 'active' || i.status === 'used');
    const b = ce('div', 'padding:12px 16px;overflow-y:auto;max-height:400px;');
    if (!available.length) {
      b.innerHTML = '<div class="ms-empty" style="margin:20px 0;"><div>暂无可用灵感，先去「灵感」中创建灵感吧</div></div>';
    } else {
      for (const idea of available) {
        const row = ce('div', 'padding:10px 12px;border-radius:var(--ms-radius-sm);cursor:pointer;border:1px solid transparent;margin-bottom:6px;display:flex;align-items:center;gap:8px;');
        if (idea.status === 'used') row.style.opacity = '0.5';
        row.onmouseenter = () => { row.style.borderColor = 'var(--ms-accent)'; row.style.background = 'rgba(255,255,255,0.03)'; };
        row.onmouseleave = () => { row.style.borderColor = 'transparent'; row.style.background = 'transparent'; };
        row.innerHTML = `<div style="flex:1;font-weight:500;font-size:13px;">${idea.title}</div><div style="font-size:11px;color:var(--ms-text-secondary);">${idea.status === 'used' ? '已转为选题' : ''}</div>`;
        if (idea.status === 'active') {
          row.onclick = () => { m.close(); this._createTopic(idea); };
        }
        bn(row, b);
      }
    }
    m.setBody(b);
    m.setFooter(`<button class="ms-btn ms-btn-sm" id="idea-select-cancel">取消</button>`);
    m.open();
    m.el.querySelector('#idea-select-cancel').onclick = () => m.close();
  }

  _createTopic(idea) {
    const m = new Modal({ title: '创建选题', width: '460px' });
    const b = ce('div', 'padding:16px 18px;');
    const src = ce('div', 'font-size:12px;color:var(--ms-text-secondary);margin-bottom:12px;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:var(--ms-radius-sm);');
    src.innerHTML = `来源灵感：<strong>${idea.title}</strong>`;
    b.append(src);
    b.append(_fld('选题标题 *', 't-title', '', idea.title));
    b.append(_fld('截止日期', 't-due', 'YYYY-MM-DD', ''));
    const ctRow = ce('div', 'margin-bottom:14px;');
    const ctL = ce('div', 'margin-bottom:4px;font-size:12px;font-weight:500;color:var(--ms-text-secondary);', '内容形态');
    ctRow.append(ctL);
    const sel = document.createElement('select');
    sel.className = 'ms-form-input ms-input-sm'; sel.id = 't-type';
    sel.style.cssText = 'width:auto;';
    for (const [v,label] of [['graphic','图文'], ['video','短视频'], ['text','纯文字']]) {
      const o = document.createElement('option'); o.value=v; o.textContent=label; bn(o, sel);
    }
    ctRow.append(sel);
    b.append(ctRow);
    b.append(_themeSel('关联主题', 't-theme', this.themes, idea.themeId||''));
    m.setBody(b);
    m.setFooter(`<button class="ms-btn ms-btn-sm" id="tp-create-cancel">取消</button>
      <button class="ms-btn ms-btn-primary ms-btn-sm" id="tp-create-submit">创建</button>`);
    m.open();
    m.el.querySelector('#tp-create-cancel').onclick = () => m.close();
    m.el.querySelector('#tp-create-submit').onclick = async () => {
      const title = _q('#t-title')?.value?.trim() || idea.title;
      if (!title) { _q('#t-title')?.focus(); return; }
      try {
        await this._topicRepo().create({
          title, ideaId: idea.id,
          themeId: _q('#t-theme')?.value || idea.themeId || '',
          contentType: _q('#t-type')?.value || 'graphic',
          dueDate: _q('#t-due')?.value?.trim() || null,
          status: 'draft',
        });
        if (idea.status === 'active') {
          await this._ideaRepo().update(idea.id, { status: 'used' });
        }
        m.close();
        await this._loadTopics();
        this.render(this._container);
      } catch(e) { console.error('创建选题失败', e); }
    };
    setTimeout(() => _q('#t-title')?.focus(), 100);
  }

  _editTopic(t) {
    const m = new Modal({ title: '编辑选题', width: '460px' });
    const b = ce('div', 'padding:16px 18px;');
    b.append(_fld('选题标题', 'e-title', '', t.title));
    b.append(_fld('截止日期', 'e-due', 'YYYY-MM-DD', t.dueDate||''));
    const ctRow = ce('div', 'margin-bottom:14px;');
    const ctL = ce('div', 'margin-bottom:4px;font-size:12px;font-weight:500;color:var(--ms-text-secondary);', '内容形态');
    ctRow.append(ctL);
    const sel = document.createElement('select');
    sel.className = 'ms-form-input ms-input-sm'; sel.id = 'e-type';
    sel.style.cssText = 'width:auto;';
    for (const [v,label] of [['graphic','图文'], ['video','短视频'], ['text','纯文字']]) {
      const o = document.createElement('option'); o.value=v; o.textContent=label;
      if (v===t.contentType) o.selected=true;
      bn(o, sel);
    }
    ctRow.append(sel);
    b.append(ctRow);
    b.append(_themeSel('关联主题', 'e-theme', this.themes, t.themeId||''));
    const stRow = ce('div', 'margin-bottom:14px;');
    const stL = ce('div', 'margin-bottom:4px;font-size:12px;font-weight:500;color:var(--ms-text-secondary);', '状态');
    stRow.append(stL);
    const stSel = document.createElement('select');
    stSel.className = 'ms-form-input ms-input-sm'; stSel.id = 'e-status';
    stSel.style.cssText = 'width:auto;';
    for (const [v,label] of [['pending','待处理'],['in_progress','进行中'],['completed','已完成'],['cancelled','已取消']]) {
      const o = document.createElement('option'); o.value=v; o.textContent=label;
      if (v===t.status) o.selected=true;
      bn(o, stSel);
    }
    stRow.append(stSel);
    b.append(stRow);
    m.setBody(b);
    m.setFooter(`<button class="ms-btn ms-btn-sm" id="tp-edit-cancel">取消</button>
      <button class="ms-btn ms-btn-primary ms-btn-sm" id="tp-edit-save">保存</button>`);
    m.open();
    m.el.querySelector('#tp-edit-cancel').onclick = () => m.close();
    m.el.querySelector('#tp-edit-save').onclick = async () => {
      const d = {
        title: _q('#e-title')?.value?.trim() || t.title,
        dueDate: _q('#e-due')?.value?.trim() || null,
        contentType: _q('#e-type')?.value || t.contentType,
        themeId: _q('#e-theme')?.value || '',
        status: _q('#e-status')?.value || 'pending',
      };
      try {
        await this._topicRepo().update(t.id, d);
        m.close();
        await this._loadTopics();
        this.render(this._container);
      } catch(e) { console.error('更新选题失败', e); }
    };
  }

  async _deleteTopic(t) {
    const m = new Modal({ size: 'sm' });
    m.setBody(`<div style="padding:20px 18px;text-align:center;">
      <div style="font-size:16px;margin-bottom:12px;">确认删除选题？</div>
      <div style="font-size:12px;color:var(--ms-text-secondary);">「${t.title}」</div>
    </div>`);
    m.setFooter(`<div style="display:flex;justify-content:center;gap:8px;">
      <button class="ms-btn ms-btn-sm" id="topic-del-cancel">取消</button>
      <button class="ms-btn ms-btn-sm ms-btn-danger" id="topic-del-confirm">确认删除</button>
    </div>`);
    m.open();
    m.el.querySelector('#topic-del-cancel').onclick = () => m.close();
    m.el.querySelector('#topic-del-confirm').onclick = async () => {
      try { await this._topicRepo().delete(t.id); m.close(); await this._loadTopics(); this.render(this._container); }
      catch(e) { console.error('删除选题失败', e); }
    };
  }

  _d(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getMonth()+1}/${d.getDate()}`;
  }
}

function ce(tag, style, text, extra) {
  const el = document.createElement(tag);
  if (style) el.style.cssText = style;
  if (text) el.textContent = text;
  if (extra) Object.assign(el.style, extra);
  return el;
}
function bn(child, parent) { parent.appendChild(child); }
function sp(tag, style, text) {
  const el = document.createElement(tag);
  if (style) el.style.cssText = style;
  if (text) el.textContent = text;
  return el;
}
function btn(label, kind, onClick, title) {
  const el = document.createElement('button');
  el.textContent = label; el.title = title||'';
  el.className = `ms-btn${kind==='primary'?' ms-btn-primary':''} ms-btn-sm`;
  el.onclick = onClick;
  return el;
}
function _fld(label, id, ph, val) {
  const r = ce('div', 'margin-bottom:14px;');
  const l = ce('div', 'margin-bottom:4px;font-size:12px;font-weight:500;color:var(--ms-text-secondary);', label);
  r.append(l);
  const inp = document.createElement('input');
  inp.className = 'ms-form-input'; inp.id = id; inp.placeholder = ph; inp.value = val||'';
  r.append(inp);
  return r;
}
function _themeSel(label, id, themes, val) {
  const r = ce('div', 'margin-bottom:14px;');
  const l = ce('div', 'margin-bottom:4px;font-size:12px;font-weight:500;color:var(--ms-text-secondary);', label);
  r.append(l);
  const sel = document.createElement('select');
  sel.className = 'ms-form-input ms-input-sm'; sel.id = id;
  sel.style.cssText = 'width:auto;';
  const oa = document.createElement('option'); oa.value=''; oa.textContent='无'; bn(oa, sel);
  for (const t of themes) {
    const o = document.createElement('option'); o.value=t.id; o.textContent=t.name;
    if (t.id===val) o.selected=true;
    bn(o, sel);
  }
  r.append(sel);
  return r;
}
function _q(id) { return document.querySelector(id); }
