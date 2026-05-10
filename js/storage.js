const Storage = {
  NOTES_KEY: 'mimemo_notes',
  API_KEY: 'mimemo_api_key',
  THEME_KEY: 'mimemo_theme',

  getNotes() {
    try {
      const data = localStorage.getItem(this.NOTES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveNotes(notes) {
    localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes));
  },

  getNoteById(id) {
    return this.getNotes().find(n => n.id === id) || null;
  },

  createNote() {
    const notes = this.getNotes();
    const note = {
      id: Utils.generateId(),
      title: '',
      content: '',
      tags: [],
      summary: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    notes.unshift(note);
    this.saveNotes(notes);
    return note;
  },

  updateNote(id, updates) {
    const notes = this.getNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) return null;
    notes[index] = { ...notes[index], ...updates, updatedAt: Date.now() };
    this.saveNotes(notes);
    return notes[index];
  },

  deleteNote(id) {
    const notes = this.getNotes().filter(n => n.id !== id);
    this.saveNotes(notes);
  },

  searchNotes(keyword) {
    if (!keyword) return this.getNotes();
    const lower = keyword.toLowerCase();
    return this.getNotes().filter(n =>
      (n.title && n.title.toLowerCase().includes(lower)) ||
      (n.content && n.content.toLowerCase().includes(lower)) ||
      (n.tags && n.tags.some(t => t.toLowerCase().includes(lower)))
    );
  },

  filterByTag(tag) {
    if (!tag) return this.getNotes();
    return this.getNotes().filter(n => n.tags && n.tags.includes(tag));
  },

  getAllTags() {
    const tags = new Set();
    this.getNotes().forEach(n => {
      if (n.tags) n.tags.forEach(t => tags.add(t));
    });
    return Array.from(tags);
  },

  getApiKey() {
    return localStorage.getItem(this.API_KEY) || '';
  },

  setApiKey(key) {
    localStorage.setItem(this.API_KEY, key);
  },

  getTheme() {
    return localStorage.getItem(this.THEME_KEY) || 'light';
  },

  setTheme(theme) {
    localStorage.setItem(this.THEME_KEY, theme);
  }
};
