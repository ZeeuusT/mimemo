const Editor = {
  currentNoteId: null,

  init() {
    this.titleInput = document.getElementById('note-title');
    this.contentInput = document.getElementById('note-content');
    this.tagsContainer = document.getElementById('note-tags');
    this.emptyState = document.getElementById('empty-state');
    this.editorContainer = document.getElementById('editor-container');

    this.autoSave = Utils.debounce(() => this.save(), 500);
    this.titleInput.addEventListener('input', () => this.autoSave());
    this.contentInput.addEventListener('input', () => this.autoSave());
  },

  load(noteId) {
    const note = Storage.getNoteById(noteId);
    if (!note) return;

    this.currentNoteId = noteId;
    this.emptyState.classList.add('hidden');
    this.editorContainer.classList.remove('hidden');

    this.titleInput.value = note.title || '';
    this.contentInput.value = note.content || '';
    this.renderTags(note.tags || []);
    this.hideAiResult();

    document.querySelectorAll('.note-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === noteId);
    });
  },

  save() {
    if (!this.currentNoteId) return;
    Storage.updateNote(this.currentNoteId, {
      title: this.titleInput.value,
      content: this.contentInput.value
    });
    App.renderNoteList();
  },

  close() {
    this.currentNoteId = null;
    this.emptyState.classList.remove('hidden');
    this.editorContainer.classList.add('hidden');
    document.querySelectorAll('.note-item').forEach(el => el.classList.remove('active'));
  },

  renderTags(tags) {
    this.tagsContainer.innerHTML = tags.map(t =>
      `<span class="tag" data-tag="${Utils.escapeHtml(t)}">${Utils.escapeHtml(t)}</span>`
    ).join('');

    this.tagsContainer.querySelectorAll('.tag').forEach(el => {
      el.addEventListener('click', () => {
        App.filterByTag(el.dataset.tag);
      });
    });
  },

  showAiResult(type, content) {
    const resultEl = document.getElementById('ai-result');
    const typeEl = document.getElementById('ai-result-type');
    const contentEl = document.getElementById('ai-result-content');

    typeEl.textContent = type;
    contentEl.innerHTML = Utils.simpleMarkdown(Utils.escapeHtml(content));
    resultEl.classList.remove('hidden');
    document.getElementById('ai-loading').classList.add('hidden');
  },

  hideAiResult() {
    document.getElementById('ai-result').classList.add('hidden');
    document.getElementById('ai-loading').classList.add('hidden');
  },

  showAiLoading() {
    document.getElementById('ai-loading').classList.remove('hidden');
    document.getElementById('ai-result').classList.add('hidden');
  },

  async aiSummary() {
    const content = this.contentInput.value.trim();
    if (!content) {
      alert('请先输入笔记内容');
      return;
    }
    this.showAiLoading();
    try {
      const summary = await MiMoAPI.summarize(content);
      this.showAiResult('AI 摘要', summary);
      if (this.currentNoteId) {
        Storage.updateNote(this.currentNoteId, { summary });
      }
    } catch (err) {
      this.hideAiResult();
      alert('AI 摘要失败: ' + err.message);
    }
  },

  async aiExtractTags() {
    const content = this.contentInput.value.trim();
    if (!content) {
      alert('请先输入笔记内容');
      return;
    }
    this.showAiLoading();
    try {
      const tags = await MiMoAPI.extractTags(content);
      if (tags.length > 0) {
        this.renderTags(tags);
        if (this.currentNoteId) {
          Storage.updateNote(this.currentNoteId, { tags });
          App.renderNoteList();
        }
        this.showAiResult('AI 提取标签', tags.join(', '));
      } else {
        this.hideAiResult();
        alert('未能提取到标签');
      }
    } catch (err) {
      this.hideAiResult();
      alert('AI 提取标签失败: ' + err.message + '\n\n请点击右上角 ⚙️ 配置正确的 API Key');
    }
  },

  exportNote() {
    if (!this.currentNoteId) return;
    const note = Storage.getNoteById(this.currentNoteId);
    if (!note) return;

    const title = note.title || '无标题笔记';
    const content = `# ${title}\n\n${note.content || ''}\n\n---\n标签: ${(note.tags || []).join(', ')}\n导出时间: ${new Date().toLocaleString()}`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  },

  deleteNote() {
    if (!this.currentNoteId) return;
    if (!confirm('确定要删除这条笔记吗？')) return;
    Storage.deleteNote(this.currentNoteId);
    this.close();
    App.renderNoteList();
  }
};
