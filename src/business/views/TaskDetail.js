import { empty } from '../../framework/utils/dom.js';
import { formatDateTime } from '../../framework/utils/format.js';
import { taskRepo, assetRepo, contentRepo, repo } from '../data/index.js';
import { AssetCard } from './components/AssetCard.js';
import { ContentEditor } from './ContentEditor.js';

export class TaskDetail {
  static async open(api, state, schemaRegistry, task) {
    const overlay = document.createElement('div');
    overlay.className = 'ms-task-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const modal = document.createElement('div');
    modal.className = 'ms-task-modal';
    modal.style.cssText = 'width:680px;max-width:92vw;max-height:85vh;overflow-y:auto;';

    const title = document.createElement('h3');
    const typeLabels = { media: '素材任务', copywriting: '文案任务' };
    title.textContent = (typeLabels[task.taskType] || '') + '详情';
    modal.appendChild(title);

    const infoSection = document.createElement('div');
    infoSection.style.cssText = 'margin-bottom:20px;';

    const stLabels = { pending: '待处理', generating: '生成中', review: '待审核', approved: '已通过', rejected: '已拒绝' };
    const modeLabels = { manual: '手工', agent: 'Agent' };
    const typeColor = task.taskType === 'copywriting' ? '#27ae60' : '#4a90d9';

    infoSection.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="display:inline-block;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:500;color:#fff;background:${typeColor};">${typeLabels[task.taskType] || task.taskType}</span>
        <span style="font-size:13px;color:var(--ms-text-secondary,#a0a0a0);background:var(--ms-bg-card,#0f3460);padding:2px 8px;border-radius:4px;">${modeLabels[task.mode] || task.mode}</span>
        <span style="font-size:12px;color:var(--ms-text-primary,#e0e0e0);background:var(--ms-bg-primary,#1a1a2e);padding:2px 8px;border-radius:4px;border:1px solid var(--ms-border,#2a2a4a);">${stLabels[task.status] || task.status}</span>
      </div>
      <div style="font-size:15px;font-weight:600;color:var(--ms-text-primary,#e0e0e0);margin-bottom:12px;">${this._escapeHtml(task.title || '(无标题)')}</div>
    `;

    if (task.topicId) {
      try {
        const sr = schemaRegistry;
        const topicsRepo = taskRepo(api, sr);
        const topic = await repo(api, sr, 'topics').get(task.topicId);
        if (topic) {
          const topicEl = document.createElement('div');
          topicEl.style.cssText = 'font-size:12px;color:var(--ms-accent,#e94560);margin-bottom:8px;';
          topicEl.textContent = '关联选题: ' + topic.title;
          infoSection.appendChild(topicEl);
        }
      } catch (e) {
      }
    }

    if (task.prompt) {
      const promptEl = document.createElement('div');
      promptEl.style.cssText = 'font-size:13px;color:var(--ms-text-secondary,#a0a0a0);background:var(--ms-bg-primary,#1a1a2e);padding:10px 12px;border-radius:var(--ms-radius-sm,4px);white-space:pre-wrap;margin-bottom:8px;';
      promptEl.textContent = task.prompt;
      infoSection.appendChild(promptEl);
    }

    const timeEl = document.createElement('div');
    timeEl.style.cssText = 'font-size:11px;color:var(--ms-text-secondary,#a0a0a0);margin-top:4px;';
    timeEl.textContent = '创建时间: ' + formatDateTime(task.createdAt);
    infoSection.appendChild(timeEl);
    modal.appendChild(infoSection);

    const assetSection = document.createElement('div');
    assetSection.style.cssText = 'margin-bottom:20px;';
    const assetHeader = document.createElement('div');
    assetHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;';
    const assetTitle = document.createElement('div');
    assetTitle.style.cssText = 'font-size:14px;font-weight:600;color:var(--ms-text-primary,#e0e0e0);';
    assetTitle.textContent = '关联素材';
    assetHeader.appendChild(assetTitle);
    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'ms-btn ms-btn-sm';
    uploadBtn.textContent = '+ 上传';
    uploadBtn.addEventListener('click', () => {
      const overlay2 = overlay;
      const input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      input.accept = 'image/*,video/*,audio/*';
      input.addEventListener('change', async (e) => {
        const file = (e.target.files || [])[0];
        if (!file) return;
        await TaskDetail._uploadAsset(api, schemaRegistry, task.id, file);
        await TaskDetail._reloadAssetList(api, schemaRegistry, task.id, assetList);
      });
      document.body.appendChild(input);
      input.click();
      setTimeout(() => input.remove(), 1000);
    });
    assetHeader.appendChild(uploadBtn);
    assetSection.appendChild(assetHeader);

    const assetList = document.createElement('div');
    assetList.id = 'media-studio-task-detail-assets';
    assetList.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
    assetSection.appendChild(assetList);
    modal.appendChild(assetSection);

    const contentSection = document.createElement('div');
    contentSection.style.cssText = 'margin-bottom:16px;';
    const contentHeader = document.createElement('div');
    contentHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;';
    const contentTitle = document.createElement('div');
    contentTitle.style.cssText = 'font-size:14px;font-weight:600;color:var(--ms-text-primary,#e0e0e0);';
    contentTitle.textContent = '关联文稿';
    contentHeader.appendChild(contentTitle);
    const newContentBtn = document.createElement('button');
    newContentBtn.className = 'ms-btn ms-btn-sm';
    newContentBtn.textContent = '+ 新建文稿';
    newContentBtn.addEventListener('click', async () => {
      try {
        const cr = contentRepo(api, schemaRegistry);
        const newContent = await cr.create({
          taskId: task.id,
          topicId: task.topicId || '',
          version: 1,
          title: '新文稿',
          content: '',
          status: 'draft'
        });
        overlay.remove();
        await TaskDetail._openContentEditor(api, state, schemaRegistry, task, newContent);
      } catch (e) {
        console.error('创建文稿失败:', e);
      }
    });
    contentHeader.appendChild(newContentBtn);
    contentSection.appendChild(contentHeader);

    const contentList = document.createElement('div');
    contentList.id = 'media-studio-task-detail-contents';
    contentList.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
    contentSection.appendChild(contentList);
    modal.appendChild(contentSection);

    const closeArea = document.createElement('div');
    closeArea.style.cssText = 'display:flex;justify-content:flex-end;margin-top:8px;';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'ms-btn';
    closeBtn.textContent = '关闭';
    closeBtn.addEventListener('click', () => overlay.remove());
    closeArea.appendChild(closeBtn);
    modal.appendChild(closeArea);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    await Promise.all([
      TaskDetail._reloadAssetList(api, schemaRegistry, task.id, assetList),
      TaskDetail._reloadContentList(api, state, schemaRegistry, task, contentList)
    ]);
  }

  static async _reloadAssetList(api, sr, taskId, container) {
    try {
      const ar = assetRepo(api, sr);
      const result = await ar.find({ filter: { taskId: taskId }, sort: '-createdAt' });
      const assets = result.records || [];

      if (assets.length === 0) {
        container.innerHTML = '<div style="font-size:12px;color:var(--ms-text-secondary,#a0a0a0);padding:12px;text-align:center;">暂无关联素材</div>';
        return;
      }

      container.innerHTML = '';
      for (const asset of assets) {
        const card = new AssetCard(asset, {
          compact: true,
          onClick: (a) => {
            window.open('/' + a.filePath, '_blank');
          },
          onDelete: async (a) => {
            try {
              await ar.delete(a.id);
              await TaskDetail._reloadAssetList(api, sr, taskId, container);
            } catch (e) {
              console.error('删除素材失败:', e);
            }
          }
        });
        container.appendChild(card.render());
      }
    } catch (e) {
      container.innerHTML = '<div style="font-size:12px;color:var(--ms-danger,#e74c3c);padding:12px;">加载素材失败</div>';
    }
  }

  static async _reloadContentList(api, state, sr, task, container) {
    try {
      const cr = contentRepo(api, sr);
      const result = await cr.find({ filter: { taskId: task.id }, sort: '-version' });
      const contents = result.records || [];

      if (contents.length === 0) {
        container.innerHTML = '<div style="font-size:12px;color:var(--ms-text-secondary,#a0a0a0);padding:12px;text-align:center;">暂无关联文稿</div>';
        return;
      }

      container.innerHTML = '';
      for (const content of contents) {
        const stLabels = { draft: '草稿', finalized: '已定稿', archived: '已归档' };
        const stColor = { draft: 'var(--ms-info,#4a90d9)', finalized: 'var(--ms-success,#27ae60)', archived: 'var(--ms-text-secondary,#a0a0a0)' };
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--ms-bg-primary,#1a1a2e);border-radius:var(--ms-radius-sm,4px);cursor:pointer;margin-bottom:4px;transition:border-color 0.15s;border:1px solid transparent;';
        row.innerHTML = `
          <span style="font-size:11px;color:var(--ms-text-secondary,#a0a0a0);font-family:monospace;">v${content.version}</span>
          <span style="flex:1;font-size:13px;color:var(--ms-text-primary,#e0e0e0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this._escapeHtml(content.title || '未命名')}</span>
          <span style="font-size:11px;padding:1px 6px;border-radius:3px;color:${stColor[content.status] || 'var(--ms-text-secondary)'};">${stLabels[content.status] || content.status}</span>
        `;
        row.onmouseenter = () => { row.style.borderColor = 'var(--ms-accent,#e94560)'; };
        row.onmouseleave = () => { row.style.borderColor = 'transparent'; };
        row.onclick = async () => {
          const overlay2 = document.querySelector('.ms-task-modal-overlay:last-child');
          if (overlay2) overlay2.remove();
          await TaskDetail._openContentEditor(api, state, sr, task, content);
        };
        container.appendChild(row);
      }
    } catch (e) {
      container.innerHTML = '<div style="font-size:12px;color:var(--ms-danger,#e74c3c);padding:12px;">加载文稿失败</div>';
    }
  }

  static async _openContentEditor(api, state, sr, task, content) {
    const overlay = document.createElement('div');
    overlay.className = 'ms-task-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const modal = document.createElement('div');
    modal.className = 'ms-task-modal';
    modal.style.cssText = 'width:820px;max-width:95vw;height:70vh;max-height:85vh;display:flex;flex-direction:column;padding:0;overflow:hidden;';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid var(--ms-border,#2a2a4a);flex-shrink:0;';
    const headerTitle = document.createElement('div');
    headerTitle.style.cssText = 'font-size:14px;font-weight:600;color:var(--ms-text-primary,#e0e0e0);';
    headerTitle.textContent = '文稿编辑';
    header.appendChild(headerTitle);
    const closeBtn = document.createElement('button');
    closeBtn.className = 'ms-btn ms-btn-sm';
    closeBtn.textContent = '关闭';
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);
    modal.appendChild(header);

    const editorContainer = document.createElement('div');
    editorContainer.style.cssText = 'flex:1;overflow:hidden;display:flex;flex-direction:column;';

    const editor = new ContentEditor({ api, state, schemaRegistry: sr });
    await editor.render(editorContainer, {
      taskId: task.id,
      existingContent: content
    });

    modal.appendChild(editorContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  static async _uploadAsset(api, sr, taskId, file) {
    let type = 'other';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    const uuid = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    const now = new Date();
    const monthDir = String(now.getFullYear()) + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const relPath = 'workspace/assets/' + monthDir + '/' + uuid + '-' + file.name;

    try {
      await api.mkdir('workspace/assets/' + monthDir);
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      await api.writeFile(relPath, dataUrl);
      const ar = assetRepo(api, sr);
      await ar.create({
        taskId: taskId,
        type: type,
        fileName: file.name,
        filePath: relPath,
        mimeType: file.type,
        fileSize: file.size,
        thumbnailPath: '',
        metadata: {},
        status: 'completed'
      });
    } catch (e) {
      console.error('上传素材失败:', e);
    }
  }

  static _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
