import { empty } from '../../framework/utils/dom.js';
import { formatDateTime } from '../../framework/utils/format.js';
import { taskRepo, assetRepo, contentRepo, repo } from '../data/index.js';
import { AssetCard } from './components/AssetCard.js';
import { ContentEditor } from './ContentEditor.js';
import { Modal } from '../../framework/ui/Modal.js';
import { AssetUploader } from '../services/AssetUploader.js';

export class TaskDetail {
  static async open(api, state, schemaRegistry, task) {
    const modal = new Modal({ width: '680px' });
    const body = document.createElement('div');

    const title = document.createElement('h3');
    const typeLabels = { media: '素材任务', copywriting: '文案任务' };
    title.textContent = (typeLabels[task.taskType] || '') + '详情';
    body.appendChild(title);

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
    body.appendChild(infoSection);

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
    uploadBtn.textContent = '上传';
    uploadBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      input.accept = 'image/*,video/*,audio/*';
      input.addEventListener('change', async (e) => {
        const file = (e.target.files || [])[0];
        if (!file) return;
        const ar = assetRepo(api, schemaRegistry);
        await AssetUploader.uploadFile(file, api, ar, { taskId: task.id });
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
    body.appendChild(assetSection);

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
    newContentBtn.textContent = '新建';
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
        modal.close();
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
    body.appendChild(contentSection);

    modal.setBody(body);
    modal.setFooter('<button class="ms-btn" id="td-close">关闭</button>');
    modal.open();
    modal.el.querySelector('#td-close').onclick = () => modal.close();

    await Promise.all([
      TaskDetail._reloadAssetList(api, schemaRegistry, task.id, assetList),
      TaskDetail._reloadContentList(api, state, schemaRegistry, task, contentList, () => modal.close())
    ]);

    // 发布入口 — 当内容已定稿时显示
    const publishEntry = document.createElement('div');
    publishEntry.style.cssText = 'margin-top:12px;padding-top:12px;border-top:1px solid var(--ms-border,#2a2a4a);';
    try {
      const cr = contentRepo(api, schemaRegistry);
      const contentResult = await cr.find({ filter: { taskId: task.id }, sort: '-version' });
      const contents = contentResult.records || [];
      const finalizedContents = contents.filter(c => c.status === 'finalized');
      if (finalizedContents.length > 0) {
        let pkgCount = 0;
        const pkgRepo = repo(api, schemaRegistry, 'packages');
        for (const c of finalizedContents) {
          const pkgResult = await pkgRepo.find({ filter: { contentId: c.id } });
          if (pkgResult && pkgResult.records) {
            pkgCount += pkgResult.records.length;
          }
        }
        if (pkgCount > 0) {
          const link = document.createElement('a');
          link.style.cssText = 'font-size:13px;color:var(--ms-accent,#e94560);cursor:pointer;text-decoration:none;';
          link.textContent = '查看发布包 (' + pkgCount + ') →';
          link.addEventListener('click', () => { window.location.hash = '#publish'; });
          publishEntry.appendChild(link);
        } else {
          const btn = document.createElement('button');
          btn.className = 'ms-btn ms-btn-sm';
          btn.textContent = '创建发布包';
          btn.addEventListener('click', () => { window.location.hash = '#publish'; });
          publishEntry.appendChild(btn);
        }
        modal.bodyEl.appendChild(publishEntry);
      }
    } catch (e) {
      // 发布数据查询失败，静默忽略
    }
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
          api: api,
          onClick: async (a) => {
            if (a.type === 'video' && a.filePath) {
              const previewModal = new Modal({ title: '视频预览', width: '600px' });
              const bodyHtml = `<div style="text-align:center;">
                <video id="td-preview-video" controls playsinline style="max-width:100%;max-height:360px;border-radius:var(--ms-radius-sm,4px);background:#000;"></video>
                <div id="td-preview-loading" style="padding:40px;color:var(--ms-text-secondary,#a0a0a0);font-size:13px;">加载中...</div>
              </div>`;
              previewModal.setBody(bodyHtml);
              previewModal.open();
              try {
                const url = await api.getDownloadUrl(a.filePath, a.mimeType);
                const videoEl = previewModal.el.querySelector('#td-preview-video');
                const loadingEl = previewModal.el.querySelector('#td-preview-loading');
                if (videoEl && loadingEl) {
                  videoEl.src = url;
                  videoEl.style.display = '';
                  loadingEl.style.display = 'none';
                }
              } catch (e) {
                const loadingEl = previewModal.el.querySelector('#td-preview-loading');
                if (loadingEl) loadingEl.textContent = '加载失败';
              }
            } else {
              try {
                const url = await api.getDownloadUrl(a.filePath, a.mimeType);
                window.open(url, '_blank');
                setTimeout(() => URL.revokeObjectURL(url), 60000);
              } catch (e) {
                console.error('预览失败:', e);
              }
            }
          },
          onDelete: async (a) => {
            try {
              if (a.filePath) {
                try { await api.delete(a.filePath); } catch (e) {
                  console.warn('删除磁盘文件失败（可能已不存在）:', e);
                }
              }
              await ar.delete(a.id);
              await TaskDetail._reloadAssetList(api, sr, taskId, container);
            } catch (e) {
              console.error('删除素材失败:', e);
            }
          }
        });
        const cardEl = card.render();
        container.appendChild(cardEl);

        if (asset.filePath) {
          const dlBtn = document.createElement('button');
          dlBtn.innerHTML = '&#8595;';
          dlBtn.title = '下载原始文件';
          dlBtn.style.cssText = 'width:22px;height:22px;border:none;background:transparent;color:var(--ms-info,#4a90d9);cursor:pointer;font-size:14px;flex-shrink:0;';
          dlBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
              await api.downloadAsFile(asset.filePath, asset.fileName, asset.mimeType);
            } catch (e) {
              console.error('下载失败:', e);
            }
          });
          cardEl.appendChild(dlBtn);
        }
      }
    } catch (e) {
      container.innerHTML = '<div style="font-size:12px;color:var(--ms-danger,#e74c3c);padding:12px;">加载素材失败</div>';
    }
  }

  static async _reloadContentList(api, state, sr, task, container, onClose) {
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
          if (onClose) onClose();
          await TaskDetail._openContentEditor(api, state, sr, task, content);
        };
        container.appendChild(row);
      }
    } catch (e) {
      container.innerHTML = '<div style="font-size:12px;color:var(--ms-danger,#e74c3c);padding:12px;">加载文稿失败</div>';
    }
  }

  static async _openContentEditor(api, state, sr, task, content) {
    const modal = new Modal({ title: '文稿编辑', width: '820px' });
    modal.el.style.height = '70vh';
    modal.bodyEl.style.padding = '0';
    modal.bodyEl.style.cssText += ';flex:1;overflow:hidden;display:flex;flex-direction:column;';

    const editor = new ContentEditor({ api, state, schemaRegistry: sr });
    await editor.render(modal.bodyEl, {
      taskId: task.id,
      existingContent: content
    });

    modal.open();
  }

  static _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
