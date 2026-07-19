import { empty, debounce } from '../../framework/utils/dom.js';
import { contentRepo, repo } from '../data/index.js';

export class ContentEditor {
  constructor({ api, state, schemaRegistry }) {
    this.api = api;
    this.state = state;
    this._sr = schemaRegistry;
    this._injectStyles();
  }

  _cr() { return contentRepo(this.api, this._sr); }

  _injectStyles() {
    if (document.getElementById('media-studio-content-editor-styles')) return;
    const style = document.createElement('style');
    style.id = 'media-studio-content-editor-styles';
    style.textContent = `
      .ms-content-editor { display: flex; flex-direction: column; height: 100%; }
      .ms-content-editor-toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--ms-border, #2a2a4a); flex-wrap: wrap; }
      .ms-content-editor-toolbar .ms-editor-title-input { flex: 1; min-width: 200px; padding: 6px 10px; font-size: 14px; border: 1px solid var(--ms-border, #2a2a4a); border-radius: var(--ms-radius-sm, 4px); background: var(--ms-bg-primary, #1a1a2e); color: var(--ms-text-primary, #e0e0e0); font-family: inherit; }
      .ms-content-editor-toolbar .ms-editor-title-input:focus { outline: none; border-color: var(--ms-accent, #e94560); }
      .ms-content-editor-toolbar .ms-editor-status { font-size: 12px; color: var(--ms-text-secondary, #a0a0a0); padding: 3px 8px; background: var(--ms-bg-card, #0f3460); border-radius: var(--ms-radius-sm, 4px); }
      .ms-content-editor-body { display: flex; flex: 1; overflow: hidden; }
      .ms-content-editor-textarea { flex: 1; padding: 16px; border: none; border-right: 1px solid var(--ms-border, #2a2a4a); background: var(--ms-bg-primary, #1a1a2e); color: var(--ms-text-primary, #e0e0e0); font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.6; resize: none; outline: none; overflow-y: auto; }
      .ms-content-editor-preview { flex: 1; padding: 16px; overflow-y: auto; background: var(--ms-bg-secondary, #16213e); color: var(--ms-text-primary, #e0e0e0); font-size: 14px; line-height: 1.7; }
      .ms-content-editor-preview h1 { font-size: 22px; margin: 16px 0 8px; border-bottom: 1px solid var(--ms-border, #2a2a4a); padding-bottom: 4px; }
      .ms-content-editor-preview h2 { font-size: 18px; margin: 14px 0 6px; }
      .ms-content-editor-preview h3 { font-size: 15px; margin: 12px 0 4px; }
      .ms-content-editor-preview p { margin: 8px 0; }
      .ms-content-editor-preview code { background: var(--ms-bg-card, #0f3460); padding: 1px 5px; border-radius: 3px; font-size: 13px; font-family: 'Courier New', monospace; }
      .ms-content-editor-preview pre { background: var(--ms-bg-card, #0f3460); padding: 12px; border-radius: var(--ms-radius-sm, 4px); overflow-x: auto; }
      .ms-content-editor-preview pre code { background: none; padding: 0; }
      .ms-content-editor-preview a { color: var(--ms-accent, #e94560); text-decoration: underline; }
      .ms-content-editor-preview ul, .ms-content-editor-preview ol { padding-left: 20px; margin: 8px 0; }
      .ms-content-editor-preview blockquote { border-left: 3px solid var(--ms-accent, #e94560); margin: 8px 0; padding: 4px 12px; color: var(--ms-text-secondary, #a0a0a0); }
      .ms-content-editor-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; color: var(--ms-text-secondary, #a0a0a0); gap: 8px; }
    `;
    document.head.appendChild(style);
  }

  destroy() {}

  /**
   * 渲染编辑器
   * @param {HTMLElement} container
   * @param {object} options
   * @param {string} options.taskId - 关联任务ID
   * @param {object} [options.existingContent] - 已有文稿（编辑模式）
   * @param {function} [options.onClose] - 关闭回调
   */
  async render(container, options = {}) {
    empty(container);
    this._options = options;

    const wrapper = document.createElement('div');
    wrapper.className = 'ms-content-editor';
    wrapper.id = 'media-studio-content-editor';
    container.appendChild(wrapper);

    await this._loadVersions(options.taskId);
    this._currentContent = options.existingContent || null;
    this._isReadOnly = options.existingContent && options.existingContent.status === 'finalized';

    wrapper.appendChild(this._renderToolbar());
    wrapper.appendChild(this._renderBody());

    if (this._currentContent) {
      this._loadContent(this._currentContent);
    }
  }

  async _loadVersions(taskId) {
    try {
      const result = await this._cr().find({ filter: { taskId: taskId }, sort: '-version' });
      this._versions = result.records || [];
    } catch (e) {
      this._versions = [];
    }
  }

  _renderToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'ms-content-editor-toolbar';

    const titleInput = document.createElement('input');
    titleInput.className = 'ms-editor-title-input';
    titleInput.placeholder = '文稿标题...';
    titleInput.value = this._currentContent ? this._currentContent.title || '' : '';
    this._titleInput = titleInput;
    toolbar.appendChild(titleInput);

    const statusEl = document.createElement('span');
    statusEl.className = 'ms-editor-status';
    if (this._currentContent) {
      const stLabels = { draft: '草稿', finalized: '已定稿', archived: '已归档' };
      statusEl.textContent = stLabels[this._currentContent.status] || this._currentContent.status;
    } else {
      statusEl.textContent = '新文稿';
    }
    toolbar.appendChild(statusEl);

    if (this._versions && this._versions.length > 1) {
      const versionSel = document.createElement('select');
      versionSel.className = 'ms-select';
      versionSel.style.cssText = 'width:auto;font-size:12px;padding:3px 8px;';
      for (const v of this._versions) {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = 'v' + v.version + (v.status === 'finalized' ? ' (已定稿)' : '');
        if (this._currentContent && v.id === this._currentContent.id) opt.selected = true;
        versionSel.appendChild(opt);
      }
      versionSel.addEventListener('change', async () => {
        try {
          const content = await this._cr().get(versionSel.value);
          if (content) {
            this._currentContent = content;
            this._isReadOnly = content.status === 'finalized';
            this._loadContent(content);
          }
        } catch (e) {
          console.error('加载版本失败:', e);
        }
      });
      toolbar.appendChild(versionSel);
    }

    toolbar.appendChild(document.createElement('div'));
    const spacer = toolbar.lastElementChild;
    spacer.style.cssText = 'flex:1;';

    if (this._isReadOnly) {
      const newVerBtn = document.createElement('button');
      newVerBtn.className = 'ms-btn';
      newVerBtn.textContent = '创建新版本';
      newVerBtn.addEventListener('click', () => this._createNewVersion());
      toolbar.appendChild(newVerBtn);

      this._renderPublishEntry(toolbar);
    }

    if (!this._isReadOnly) {
      const saveBtn = document.createElement('button');
      saveBtn.className = 'ms-btn';
      saveBtn.textContent = '保存草稿';
      saveBtn.addEventListener('click', () => this._saveDraft());
      toolbar.appendChild(saveBtn);

      const finalizeBtn = document.createElement('button');
      finalizeBtn.className = 'ms-btn ms-btn-primary';
      finalizeBtn.textContent = '定稿';
      finalizeBtn.addEventListener('click', () => this._finalize());
      toolbar.appendChild(finalizeBtn);
    }

    return toolbar;
  }

  _renderBody() {
    const body = document.createElement('div');
    body.className = 'ms-content-editor-body';

    if (this._isReadOnly && this._currentContent) {
      const preview = document.createElement('div');
      preview.className = 'ms-content-editor-preview';
      preview.id = 'media-studio-editor-preview';
      preview.innerHTML = this._renderMarkdown(this._currentContent.content || '');
      body.appendChild(preview);
      this._previewEl = preview;
      return body;
    }

    if (!this._currentContent && (!this._versions || this._versions.length === 0)) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'ms-content-editor-empty';
      emptyEl.innerHTML = '<div style="font-size:32px;opacity:0.3;">+</div><div>点击「新建文稿」开始创作</div>';
      body.appendChild(emptyEl);
      return body;
    }

    const textarea = document.createElement('textarea');
    textarea.className = 'ms-content-editor-textarea';
    textarea.id = 'media-studio-editor-textarea';
    textarea.placeholder = '在此输入 Markdown 内容...';
    if (this._currentContent) {
      textarea.value = this._currentContent.content || '';
    }
    this._textarea = textarea;
    body.appendChild(textarea);

    const preview = document.createElement('div');
    preview.className = 'ms-content-editor-preview';
    preview.id = 'media-studio-editor-preview';
    body.appendChild(preview);
    this._previewEl = preview;

    textarea.addEventListener('input', debounce(() => {
      preview.innerHTML = this._renderMarkdown(textarea.value);
    }, 200));

    preview.innerHTML = this._renderMarkdown(textarea.value);

    return body;
  }

  _loadContent(content) {
    this._currentContent = content;
    this._isReadOnly = content.status === 'finalized';

    const container = document.getElementById('media-studio-content-editor');
    if (container) {
      const options = this._options;
      empty(container);
      container.appendChild(this._renderToolbar());
      container.appendChild(this._renderBody());
    }
  }

  async _saveDraft() {
    if (!this._currentContent) return;
    const title = this._titleInput ? this._titleInput.value.trim() : '';
    const content = this._textarea ? this._textarea.value : '';
    try {
      await this._cr().update(this._currentContent.id, {
        title: title || this._currentContent.title || '未命名文稿',
        content: content
      });
      await this._loadVersions(this._options.taskId);
    } catch (e) {
      console.error('保存草稿失败:', e);
    }
  }

  async _finalize() {
    if (!this._currentContent) return;
    if (!window.confirm('定稿后将进入只读模式，确定要定稿吗？')) return;
    const title = this._titleInput ? this._titleInput.value.trim() : '';
    const content = this._textarea ? this._textarea.value : '';
    try {
      await this._cr().update(this._currentContent.id, {
        title: title || this._currentContent.title || '未命名文稿',
        content: content,
        status: 'finalized'
      });
      await this._loadVersions(this._options.taskId);
      this._currentContent.status = 'finalized';
      this._isReadOnly = true;
      const container = document.getElementById('media-studio-content-editor');
      if (container) {
        empty(container);
        container.appendChild(this._renderToolbar());
        container.appendChild(this._renderBody());
      }
    } catch (e) {
      console.error('定稿失败:', e);
    }
  }

  async _createNewVersion() {
    if (!this._currentContent) return;
    try {
      const newContent = await this._cr().create({
        taskId: this._currentContent.taskId,
        topicId: this._currentContent.topicId || '',
        version: (this._currentContent.version || 1) + 1,
        title: this._currentContent.title || '未命名文稿',
        content: this._currentContent.content || '',
        status: 'draft'
      });
      this._currentContent = newContent;
      this._isReadOnly = false;
      await this._loadVersions(this._options.taskId);
      const container = document.getElementById('media-studio-content-editor');
      if (container) {
        empty(container);
        container.appendChild(this._renderToolbar());
        container.appendChild(this._renderBody());
      }
    } catch (e) {
      console.error('创建新版本失败:', e);
    }
  }

  async _renderPublishEntry(toolbar) {
    if (!this._currentContent || this._currentContent.status !== 'finalized') return;
    try {
      const pkgRepo = repo(this.api, this._sr, 'packages');
      const result = await pkgRepo.find({ filter: { contentId: this._currentContent.id } });
      const count = (result && result.records) ? result.records.length : 0;
      const btn = document.createElement('button');
      btn.className = 'ms-btn ms-btn-sm';
      btn.style.marginLeft = '8px';
      if (count > 0) {
        btn.textContent = '查看发布包 (' + count + ')';
        btn.style.borderColor = 'var(--ms-success,#27ae60)';
        btn.style.color = 'var(--ms-success,#27ae60)';
      } else {
        btn.textContent = '创建发布包';
      }
      btn.addEventListener('click', () => { window.location.hash = '#publish'; });
      toolbar.appendChild(btn);
    } catch (e) {
      // ignore
    }
  }

  /**
   * 简易 Markdown 渲染（无外部依赖）
   */
  _renderMarkdown(text) {
    if (!text) return '<div style="color:var(--ms-text-secondary,#a0a0a0);">内容为空</div>';

    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return '<pre><code>' + code.trim().replace(/\n/g, '<br>') + '</code></pre>';
      })
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:4px;">')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    html = '<p>' + html + '</p>';

    html = html.replace(/<li>([\s\S]*?)<\/li>/g, (match) => {
      return '<ul>' + match + '</ul>';
    });
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    return html;
  }

  static async open(container, api, state, schemaRegistry, options) {
    const editor = new ContentEditor({ api, state, schemaRegistry });
    await editor.render(container, options);
    return editor;
  }
}
