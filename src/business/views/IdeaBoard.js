import { empty } from '../../framework/utils/dom.js';
import { repo } from '../data/index.js';
import { Modal } from '../../framework/ui/Modal.js';

export class IdeaBoard {
  constructor({ api, state, schemaRegistry }) {
    this.api = api;
    this.state = state;
    this._sr = schemaRegistry;
    this.ideas = [];
    this.themes = [];
    this._filterStatus = '';
    this._filterTheme = '';
    this._searchText = '';
    this._expandId = null;
  }

  _ideaRepo() { return repo(this.api, this._sr, 'ideas'); }
  _themeRepo() { return repo(this.api, this._sr, 'themes'); }

  async render(container) {
    empty(container);
    await Promise.all([this._loadIdeas(), this._loadThemes()]);

    this._container = container;

    const bar = ce('div', '');
    bar.className = 'ms-panel-header';
    bn(ce('span', '', '灵感', { fontWeight: 600, fontSize: '15px' }), bar);
    const addBtn = btn('记录灵感', 'primary', () => this._quickAdd());
    bn(addBtn, bar);
    bn(bar, container);

    this._quickRow = ce('div', 'display:flex;gap:8px;padding:10px 16px;border-bottom:1px solid var(--ms-border);');
    const qi = document.createElement('input');
    qi.className = 'ms-form-input';
    qi.placeholder = '记一个想法… 输入标题后按 Enter 保存';
    qi.style.flex = '1';
    qi.onkeydown = async (e) => {
      if (e.key === 'Enter' && qi.value.trim()) {
        await this._create(qi.value.trim());
        qi.value = '';
      }
    };
    bn(qi, this._quickRow);
    const qBtn = btn('', null, null);
    qBtn.innerHTML = '⊕';
    qBtn.title = '打开详细录入';
    qBtn.onclick = () => this._openDetail(null);
    bn(qBtn, this._quickRow);
    bn(this._quickRow, container);

    this._renderFilters(container);

    this._listWrap = ce('div', '');
    this._listWrap.className = 'ms-panel-body';
    bn(this._listWrap, container);
    this._renderList();
  }

  _renderFilters(container) {
    const f = ce('div', '');
    f.className = 'ms-panel-filterbar';

    const statuses = [['', '全部状态'], ['active', '活跃'], ['used', '已用'], ['archived', '归档']];
    for (const [v, label] of statuses) {
      const b = document.createElement('button');
      b.className = `ms-btn ms-btn-sm${this._filterStatus === v ? ' ms-btn-primary' : ''}`;
      b.textContent = label;
      b.onclick = () => { this._filterStatus = v; this._renderList(); };
      bn(b, f);
    }

    if (this.themes.length > 0) {
      const sep = ce('span', 'width:1px;height:16px;background:var(--ms-border);margin:0 4px;');
      bn(sep, f);

      const sel = document.createElement('select');
      sel.className = 'ms-form-input';
      sel.style.cssText = 'width:auto;padding:3px 8px;font-size:12px;';
      const optAll = document.createElement('option');
      optAll.value = ''; optAll.textContent = '全部主题';
      bn(optAll, sel);
      for (const t of this.themes) {
        const o = document.createElement('option');
        o.value = t.id; o.textContent = t.name;
        if (t.id === this._filterTheme) o.selected = true;
        bn(o, sel);
      }
      sel.onchange = () => { this._filterTheme = sel.value; this._renderList(); };
      bn(sel, f);
    }

    const search = document.createElement('input');
    search.className = 'ms-form-input';
    search.placeholder = '搜索…';
    search.style.cssText = 'width:160px;padding:3px 8px;font-size:12px;margin-left:auto;';
    search.oninput = () => { this._searchText = search.value.toLowerCase(); this._renderList(); };
    bn(search, f);

    bn(f, container);
  }

  _renderList() {
    empty(this._listWrap);

    let items = this.ideas;
    if (this._filterStatus) items = items.filter(i => i.status === this._filterStatus);
    if (this._filterTheme) items = items.filter(i => i.themeId === this._filterTheme);
    if (this._searchText) items = items.filter(i => (i.title||'').toLowerCase().includes(this._searchText) || (i.summary||'').toLowerCase().includes(this._searchText));

    if (!items.length) {
      this._listWrap.innerHTML = '<div class="ms-empty" style="margin-top:40px;"><div class="ms-empty-icon">💡</div><div>暂无灵感，在顶部的输入框中记录第一个灵感吧</div></div>';
      return;
    }

    for (const idea of items) {
      bn(this._renderItem(idea), this._listWrap);
    }
  }

  _renderItem(idea) {
    const isExpanded = this._expandId === idea.id;

    const el = ce('div', '');
    el.className = 'ms-item-card';

    const top = ce('div', 'display:flex;align-items:flex-start;gap:8px;');

    const statusDot = ce('div', `width:8px;height:8px;border-radius:50%;margin-top:5px;flex-shrink:0;background:${idea.status === 'archived' ? 'var(--ms-text-secondary)' : idea.status === 'used' ? 'var(--ms-success)' : 'var(--ms-accent)'};`);
    bn(statusDot, top);

    const body = ce('div', 'flex:1;min-width:0;');
    const titleEl = ce('div', `font-weight:600;font-size:14px;${idea.status === 'archived' ? 'color:var(--ms-text-secondary);' : ''}`, idea.title);
    bn(titleEl, body);

    if (isExpanded && idea.summary) {
      bn(ce('div', 'font-size:12px;color:var(--ms-text-secondary);margin-top:6px;line-height:1.5;', idea.summary), body);
    }

    const meta = ce('div', 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px;');

    const theme = this.themes.find(t => t.id === idea.themeId);
    if (theme) {
      bn(sp('span', 'font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(233,69,96,0.15);color:var(--ms-accent);', theme.name), meta);
    }

    const stMap = { active: '活跃', used: '已用', archived: '归档' };
    bn(sp('span', `font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(85,85,85,0.2);color:var(--ms-text-secondary);`, stMap[idea.status] || idea.status), meta);

    if (isExpanded && idea.tags?.length) {
      idea.tags.forEach(tag => bn(sp('span', 'font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(255,255,255,0.05);', tag), meta));
    }

    bn(sp('span', 'font-size:11px;color:var(--ms-text-secondary);margin-left:auto;', this._d(idea.createdAt)), meta);
    bn(meta, body);

    bn(body, top);
    bn(top, el);

    if (isExpanded) {
      if (idea.refLinks?.length) {
        const links = ce('div', 'font-size:11px;color:var(--ms-text-secondary);margin-top:8px;padding-top:8px;border-top:1px solid var(--ms-border);');
        links.textContent = '参考链接:';
        for (const link of idea.refLinks) {
          bn(ce('div', 'padding:2px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;', `🔗 ${link}`), links);
        }
        bn(links, el);
      }

      const acts = ce('div', 'display:flex;gap:6px;margin-top:10px;padding-top:8px;border-top:1px solid var(--ms-border);');
      bn(btn('编辑', null, (e) => { e.stopPropagation(); this._openDetail(idea); }), acts);
      bn(btn('转为选题', 'primary', (e) => { e.stopPropagation(); this._toTopic(idea); }), acts);
      if (idea.status !== 'archived') {
        bn(btn('归档', null, (e) => { e.stopPropagation(); this._archive(idea); }), acts);
      }
      const db = btn('删除', null, (e) => { e.stopPropagation(); this._delete(idea); });
      db.style.color = 'var(--ms-danger)';
      bn(db, acts);
      bn(acts, el);
    }

    el.onclick = () => {
      this._expandId = this._expandId === idea.id ? null : idea.id;
      this._renderList();
    };

    return el;
  }

  async _loadIdeas() {
    try {
      const result = await this._ideaRepo().find({ sort: '-createdAt' });
      this.ideas = result.records || [];
    } catch { this.ideas = []; }
  }

  async _loadThemes() {
    try {
      const result = await this._themeRepo().find({ sort: '-createdAt' });
      this.themes = result.records || [];
    } catch { this.themes = []; }
  }

  async _create(title) {
    try {
      await this._ideaRepo().create({ title, status: 'active' });
      await this._loadIdeas();
      this._renderList();
    } catch (e) { console.error('创建灵感失败', e); }
  }

  _quickAdd() {
    const qi = this._quickRow?.querySelector('input');
    if (qi) qi.focus();
  }

  _openDetail(idea) {
    const isEdit = !!idea;
    const m = new Modal({ title: `${isEdit ? '编辑' : '详细'}灵感`, size: 'md' });
    const b = ce('div', 'padding:16px 18px;');
    b.append(_fld('标题 *', 'idea-title', '一句话描述这个灵感', idea?.title||''));
    b.append(_fldArea('详细描述', 'idea-summary', '补充更多细节…', idea?.summary||''));
    b.append(_themeSel('关联主题', 'idea-theme', this.themes, idea?.themeId||''));
    b.append(_fld('标签（英文逗号分隔）', 'idea-tags', '如：科技, 设计', idea?.tags?.join(', ')||''));
    b.append(_fld('参考链接（每行一个）', 'idea-links', 'https://...', idea?.refLinks?.join('\n')||'', true));
    m.setBody(b);
    m.setFooter(`<button class="ms-btn ms-btn-sm" id="idea-cancel">取消</button>
      <button class="ms-btn ms-btn-primary ms-btn-sm" id="idea-save">${isEdit ? '保存' : '创建'}</button>`);
    m.open();
    m.el.querySelector('#idea-cancel').onclick = () => m.close();
    m.el.querySelector('#idea-save').onclick = async () => {
      const d = {
        title: _q('#idea-title')?.value?.trim() || '',
        summary: _q('#idea-summary')?.value?.trim() || '',
        themeId: _q('#idea-theme')?.value || '',
        tags: (_q('#idea-tags')?.value||'').split(',').map(s=>s.trim()).filter(Boolean),
        refLinks: (_q('#idea-links')?.value||'').split('\n').map(s=>s.trim()).filter(Boolean),
        status: idea?.status || 'active',
      };
      if (!d.title) { const inp = _q('#idea-title'); inp.focus(); inp.style.borderColor='var(--ms-danger)'; return; }
      try {
        if (isEdit) await this._ideaRepo().update(idea.id, d);
        else await this._ideaRepo().create(d);
        m.close();
        await this._loadIdeas();
        this._renderList();
      } catch(e) { console.error('保存灵感失败', e); }
    };
    setTimeout(() => _q('#idea-title')?.focus(), 100);
  }

  async _toTopic(idea) {
    const name = idea.title;
    const m = new Modal({ title: '从灵感创建选题', width: '460px' });
    const b = ce('div', 'padding:16px 18px;');
    const src = ce('div', 'font-size:12px;color:var(--ms-text-secondary);margin-bottom:12px;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:var(--ms-radius-sm);');
    src.innerHTML = `来源灵感：<strong>${idea.title}</strong>`;
    b.append(src);
    b.append(_fld('选题标题 *', 'tp-title', '', name));
    b.append(_fld('截止日期', 'tp-due', 'YYYY-MM-DD', ''));
    const ctRow = ce('div', 'margin-bottom:14px;');
    const ctL = ce('div', 'margin-bottom:4px;font-size:12px;font-weight:500;color:var(--ms-text-secondary);', '内容形态');
    ctRow.append(ctL);
    const sel = document.createElement('select');
    sel.className = 'ms-form-input'; sel.id = 'tp-type';
    sel.style.cssText = 'width:auto;padding:4px 8px;font-size:13px;';
    for (const [v,label] of [['graphic','图文'], ['video','短视频'], ['text','纯文字']]) {
      const o = document.createElement('option'); o.value=v; o.textContent=label; bn(o, sel);
    }
    ctRow.append(sel);
    b.append(ctRow);
    b.append(_themeSel('关联主题', 'tp-theme', this.themes, idea.themeId||''));
    m.setBody(b);
    m.setFooter(`<button class="ms-btn ms-btn-sm" id="tp-cancel">取消</button>
      <button class="ms-btn ms-btn-primary ms-btn-sm" id="tp-create">创建选题</button>`);
    m.open();
    m.el.querySelector('#tp-cancel').onclick = () => m.close();
    m.el.querySelector('#tp-create').onclick = async () => {
      const title = _q('#tp-title')?.value?.trim() || name;
      if (!title) { _q('#tp-title')?.focus(); return; }
      try {
        await repo(this.api, this._sr, 'topics').create({
          title, ideaId: idea.id,
          themeId: _q('#tp-theme')?.value || idea.themeId || '',
          contentType: _q('#tp-type')?.value || 'graphic',
          dueDate: _q('#tp-due')?.value?.trim() || null,
          status: 'draft',
        });
        idea.status = 'used';
        await this._ideaRepo().update(idea.id, { status: 'used' });
        m.close();
        await this._loadIdeas();
        this._renderList();
      } catch(e) { console.error('创建选题失败', e); }
    };
    setTimeout(() => _q('#tp-title')?.focus(), 100);
  }

  async _archive(idea) {
    try {
      await this._ideaRepo().update(idea.id, { status: 'archived' });
      await this._loadIdeas();
      this._renderList();
    } catch(e) { console.error('归档失败', e); }
  }

  async _delete(idea) {
    const m = new Modal({ size: 'sm' });
    m.setBody(`<div style="padding:20px 18px;text-align:center;">
      <div style="font-size:16px;margin-bottom:12px;">确认删除这条灵感？</div>
      <div style="font-size:12px;color:var(--ms-text-secondary);">「${idea.title}」</div>
    </div>`);
    m.setFooter(`<div style="display:flex;justify-content:center;gap:8px;">
      <button class="ms-btn ms-btn-sm" id="idea-del-cancel">取消</button>
      <button class="ms-btn ms-btn-sm" id="idea-del-confirm" style="padding:6px 16px;border:none;border-radius:var(--ms-radius-sm);cursor:pointer;font-size:12px;font-weight:500;background:var(--ms-danger);color:#fff;">确认删除</button>
    </div>`);
    m.open();
    m.el.querySelector('#idea-del-cancel').onclick = () => m.close();
    m.el.querySelector('#idea-del-confirm').onclick = async () => {
      try { await this._ideaRepo().delete(idea.id); m.close(); await this._loadIdeas(); this._renderList(); }
      catch(e) { console.error('删除失败', e); }
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
function _fld(label, id, ph, val, multi) {
  const r = ce('div', 'margin-bottom:14px;');
  const l = ce('div', 'margin-bottom:4px;font-size:12px;font-weight:500;color:var(--ms-text-secondary);', label);
  r.append(l);
  if (multi) {
    const ta = document.createElement('textarea');
    ta.className = 'ms-form-textarea'; ta.id = id; ta.placeholder = ph; ta.style.minHeight = '60px';
    ta.value = val||'';
    r.append(ta);
  } else {
    const inp = document.createElement('input');
    inp.className = 'ms-form-input'; inp.id = id; inp.placeholder = ph; inp.value = val||'';
    r.append(inp);
  }
  return r;
}
function _fldArea(label, id, ph, val) {
  const r = ce('div', 'margin-bottom:14px;');
  const l = ce('div', 'margin-bottom:4px;font-size:12px;font-weight:500;color:var(--ms-text-secondary);', label);
  r.append(l);
  const ta = document.createElement('textarea');
  ta.className = 'ms-form-textarea'; ta.id = id; ta.placeholder = ph; ta.style.minHeight = '80px';
  ta.value = val||'';
  r.append(ta);
  return r;
}
function _themeSel(label, id, themes, val) {
  const r = ce('div', 'margin-bottom:14px;');
  const l = ce('div', 'margin-bottom:4px;font-size:12px;font-weight:500;color:var(--ms-text-secondary);', label);
  r.append(l);
  const sel = document.createElement('select');
  sel.className = 'ms-form-input'; sel.id = id;
  sel.style.cssText = 'width:auto;padding:4px 8px;font-size:13px;';
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
