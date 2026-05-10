const App = {
  init() {
    Editor.init();
    this.renderNoteList();
    this.initTheme();
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('btn-new-note').addEventListener('click', () => this.createNote());
    document.getElementById('btn-settings').addEventListener('click', () => this.showApiKeyModal());
    document.getElementById('btn-theme').addEventListener('click', () => this.toggleTheme());
    document.getElementById('btn-export').addEventListener('click', () => Editor.exportNote());
    document.getElementById('btn-delete').addEventListener('click', () => Editor.deleteNote());
    document.getElementById('btn-ai-summary').addEventListener('click', () => Editor.aiSummary());
    document.getElementById('btn-ai-tags').addEventListener('click', () => Editor.aiExtractTags());
    document.getElementById('btn-ai-close').addEventListener('click', () => Editor.hideAiResult());

    // Modal
    document.getElementById('api-key-save').addEventListener('click', () => this.saveApiKey());
    document.getElementById('api-key-cancel').addEventListener('click', () => this.hideApiKeyModal());
    document.querySelector('.modal-backdrop').addEventListener('click', () => this.hideApiKeyModal());
    document.getElementById('api-key-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.saveApiKey();
    });

    // Toggle key visibility
    document.getElementById('toggle-key-vis').addEventListener('click', () => {
      const input = document.getElementById('api-key-input');
      const btn = document.getElementById('toggle-key-vis');
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁';
      }
    });

    // Search
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    searchInput.addEventListener('input', Utils.debounce(() => {
      const keyword = searchInput.value.trim();
      searchClear.classList.toggle('hidden', !keyword);
      this.renderNoteList(keyword);
    }, 200));

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.classList.add('hidden');
      this.renderNoteList();
    });

    // Tag filter
    document.getElementById('clear-tag-filter').addEventListener('click', () => {
      document.getElementById('tag-filter').classList.add('hidden');
      this.renderNoteList();
    });
  },

  createNote() {
    const note = Storage.createNote();
    this.renderNoteList();
    Editor.load(note.id);
  },

  renderNoteList(keyword) {
    const notes = keyword ? Storage.searchNotes(keyword) : Storage.getNotes();
    const listEl = document.getElementById('note-list');

    if (notes.length === 0) {
      listEl.innerHTML = `<div style="padding:40px 20px;text-align:center;color:var(--text-muted);font-size:13px;">
        ${keyword ? '没有找到匹配的笔记' : '还没有笔记，点击上方按钮创建'}
      </div>`;
      return;
    }

    listEl.innerHTML = notes.map(note => {
      const title = note.title || '无标题笔记';
      const preview = Utils.truncate(note.content, 60);
      const date = Utils.formatDate(note.updatedAt);
      const tagsHtml = (note.tags || []).slice(0, 3).map(t =>
        `<span class="note-item-tag">${Utils.escapeHtml(t)}</span>`
      ).join('');

      return `<div class="note-item ${note.id === Editor.currentNoteId ? 'active' : ''}" data-id="${note.id}">
        <div class="note-item-title">${Utils.escapeHtml(title)}</div>
        <div class="note-item-preview">${Utils.escapeHtml(preview)}</div>
        <div class="note-item-meta">
          <span class="note-item-date">${date}</span>
          ${tagsHtml}
        </div>
      </div>`;
    }).join('');

    listEl.querySelectorAll('.note-item').forEach(el => {
      el.addEventListener('click', () => Editor.load(el.dataset.id));
    });
  },

  filterByTag(tag) {
    document.getElementById('tag-filter').classList.remove('hidden');
    document.getElementById('active-tag').textContent = tag;
    this.renderNoteList();
  },

  initTheme() {
    const theme = Storage.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
  },

  toggleTheme() {
    const current = Storage.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    Storage.setTheme(next);
    this.updateThemeIcon(next);
  },

  updateThemeIcon(theme) {
    const btn = document.getElementById('btn-theme');
    if (theme === 'dark') {
      btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/></svg>';
    } else {
      btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
  },

  showApiKeyModal() {
    const modal = document.getElementById('api-key-modal');
    const input = document.getElementById('api-key-input');
    const currentKey = Storage.getApiKey();
    input.value = currentKey;
    input.type = 'password';
    document.getElementById('toggle-key-vis').textContent = '👁';
    modal.classList.remove('hidden');
    input.focus();

    const hintEl = document.getElementById('api-key-hint');
    if (currentKey) {
      hintEl.textContent = '已配置 API Key，修改后点击保存更新';
      hintEl.style.color = 'var(--success)';
    } else {
      hintEl.textContent = 'API Key 仅存储在本地浏览器中，不会上传到任何服务器';
      hintEl.style.color = '';
    }
  },

  hideApiKeyModal() {
    document.getElementById('api-key-modal').classList.add('hidden');
  },

  saveApiKey() {
    const key = document.getElementById('api-key-input').value.trim();
    if (!key) {
      alert('请输入 API Key');
      return;
    }
    Storage.setApiKey(key);
    this.hideApiKeyModal();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
