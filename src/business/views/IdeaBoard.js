import { empty } from '../../framework/utils/dom.js';

export class IdeaBoard {
  constructor({ api, state }) {
    this.api = api;
    this.state = state;
    this.ideas = [];
    this.themes = [];
    this._filterStatus = '';
    this._filterTheme = '';
    this._searchText = '';
    this._expandId = null;
  }

  async render(container) {
    empty(container);
    await Promise.all([this._loadIdeas(), this._loadThemes()]);

    this._container = container;

    const bar = ce('div', 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--ms-border);');
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

    this._listWrap = ce('div', 'padding:12px 16px;overflow-y:auto;flex:1;');
    bn(this._listWrap, container);
    this._renderList();
  }

  _renderFilters(container) {
    const f = ce('div', 'display:flex;gap:8px;padding:6px 16px;border-bottom:1px solid var(--ms-border);flex-wrap:wrap;align-items:center;');

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

    const el = ce('div', `background:var(--ms-bg-card);border-radius:var(--ms-radius);padding:12px 14px;border:1px solid var(--ms-border);cursor:pointer;transition:var(--ms-transition);margin-bottom:8px;`);
    el.onmouseenter = () => { if (!isExpanded) el.style.borderColor = 'var(--ms-accent)'; };
    el.onmouseleave = () => { if (!isExpanded) el.style.borderColor = 'var(--ms-border)'; };

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
    try { this.ideas = await this.api.listIdeas(); } catch { this.ideas = []; }
  }

  async _loadThemes() {
    try { this.themes = await this.api.listThemes(); } catch { this.themes = []; }
  }

  async _create(title) {
    try {
      await this.api.createIdea({ title, status: 'active' });
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
    const ov = _ovl();
    const md = _modal('width:480px;');
    const h = _hdr(`${isEdit ? '编辑' : '详细'}灵感`, () => ov.remove());
    md.append(h);
    const b = ce('div', 'padding:16px 18px;');

    b.append(_fld('标题 *', 'idea-title', '一句话描述这个灵感', idea?.title||''));
    b.append(_fldArea('详细描述', 'idea-summary', '补充更多细节…', idea?.summary||''));
    b.append(_themeSel('关联主题', 'idea-theme', this.themes, idea?.themeId||''));
    b.append(_fld('标签（英文逗号分隔）', 'idea-tags', '如：科技, 设计', idea?.tags?.join(', ')||''));
    b.append(_fld('参考链接（每行一个）', 'idea-links', 'https://...', idea?.refLinks?.join('\n')||'', true));

    md.append(b);

    const f = ce('div', 'display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid var(--ms-border);');
    bn(btn('取消', null, () => ov.remove()), f);
    bn(btn(isEdit ? '保存' : '创建', 'primary', async () => {
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
        if (isEdit) await this.api.updateIdea(idea.id, d);
        else await this.api.createIdea(d);
        ov.remove();
        await this._loadIdeas();
        this._renderList();
      } catch(e) { console.error('保存灵感失败', e); }
    }), f);
    md.append(f);
    ov.append(md);
    document.body.append(ov);
    setTimeout(() => _q('#idea-title')?.focus(), 100);
  }

  async _toTopic(idea) {
    const name = idea.title;
    const ov = _ovl();
    const md = _modal('width:460px;');
    const h = _hdr('从灵感创建选题', () => ov.remove());
    md.append(h);
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
    const types = [['graphic','图文'], ['video','短视频'], ['text','纯文字']];
    for (const [v,label] of types) {
      const o = document.createElement('option'); o.value=v; o.textContent=label; bn(o, sel);
    }
    ctRow.append(sel);
    b.append(ctRow);

    b.append(_themeSel('关联主题', 'tp-theme', this.themes, idea.themeId||''));

    md.append(b);
    const f = ce('div', 'display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid var(--ms-border);');
    bn(btn('取消', null, () => ov.remove()), f);
    bn(btn('创建选题', 'primary', async () => {
      const title = _q('#tp-title')?.value?.trim() || name;
      if (!title) { _q('#tp-title')?.focus(); return; }
      try {
        await this.api.createTopic({
          title,
          ideaId: idea.id,
          themeId: _q('#tp-theme')?.value || idea.themeId || '',
          contentType: _q('#tp-type')?.value || 'graphic',
          dueDate: _q('#tp-due')?.value?.trim() || null,
          status: 'pending',
        });
        idea.status = 'used';
        await this.api.updateIdea(idea.id, idea);
        ov.remove();
        await this._loadIdeas();
        this._renderList();
      } catch(e) { console.error('创建选题失败', e); }
    }), f);
    md.append(f);
    ov.append(md);
    document.body.append(ov);
    setTimeout(() => _q('#tp-title')?.focus(), 100);
  }

  async _archive(idea) {
    try {
      idea.status = 'archived';
      await this.api.updateIdea(idea.id, { status: 'archived' });
      await this._loadIdeas();
      this._renderList();
    } catch(e) { console.error('归档失败', e); }
  }

  async _delete(idea) {
    const ov = _ovl();
    const md = _modal('width:360px;');
    const b = ce('div', 'padding:20px 18px;text-align:center;');
    b.innerHTML = `<div style="font-size:16px;margin-bottom:12px;">确认删除这条灵感？</div><div style="font-size:12px;color:var(--ms-text-secondary);">「${idea.title}」</div>`;
    md.append(b);
    const f = ce('div', 'display:flex;justify-content:center;gap:8px;padding:12px 18px;border-top:1px solid var(--ms-border);');
    bn(btn('取消', null, () => ov.remove()), f);
    const db = ce('button', 'padding:6px 16px;border:none;border-radius:var(--ms-radius-sm);cursor:pointer;font-size:12px;font-weight:500;background:var(--ms-danger);color:#fff;', '确认删除');
    db.onclick = async () => {
      try { await this.api.deleteIdea(idea.id); ov.remove(); await this._loadIdeas(); this._renderList(); }
      catch(e) { console.error('删除失败', e); }
    };
    bn(db, f);
    md.append(f);
    ov.append(md);
    document.body.append(ov);
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
function _ovl() {
  const el = ce('div', 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99998;');
  el.onclick = (e) => { if (e.target===el) el.remove(); };
  return el;
}
function _modal(w) {
  return ce('div', `background:var(--ms-bg-card);border:1px solid var(--ms-border);border-radius:var(--ms-radius);box-shadow:var(--ms-shadow-lg);min-width:400px;max-width:600px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;`+w);
}
function _hdr(txt, onClose) {
  const h = ce('div', 'display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--ms-border);font-weight:600;font-size:14px;');
  h.innerHTML = `<span>${txt}</span>`;
  const c = btn('✕', null, onClose);
  bn(c, h);
  return h;
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
