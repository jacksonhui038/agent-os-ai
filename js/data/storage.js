// ===== Storage.js — LocalStorage 包裝 =====
const Storage = {
  prefix: 'agent_os_',

  _key(k) { return this.prefix + k; },

  get(key, def = null) {
    try { const v = localStorage.getItem(this._key(key)); return v ? JSON.parse(v) : def; }
    catch { return def; }
  },

  set(key, val) {
    try { localStorage.setItem(this._key(key), JSON.stringify(val)); return true; }
    catch (e) { console.error('Storage.set failed:', e); return false; }
  },

  // 檢查 localStorage 是否可用（file:// 或隐私模式可能不可用）
  available() {
    try {
      const t = '__agent_os_probe__';
      localStorage.setItem(t, '1');
      localStorage.removeItem(t);
      return true;
    } catch { return false; }
  },

  remove(key) { localStorage.removeItem(this._key(key)); },

  // 客戶 CRUD
  getClients() { return this.get('clients', []); },
  saveClient(c) {
    const list = this.getClients();
    c.id = c.id || Date.now().toString(36);
    c.updatedAt = new Date().toISOString();
    const idx = list.findIndex(x => x.id === c.id);
    if (idx >= 0) list[idx] = c; else list.unshift(c);
    this.set('clients', list);
    if (typeof CloudSync !== 'undefined') CloudSync.pushClient(c);
    return c;
  },
  getClient(id) { return this.getClients().find(x => x.id === id); },
  deleteClient(id) {
    this.set('clients', this.getClients().filter(x => x.id !== id));
    if (typeof CloudSync !== 'undefined') CloudSync.deleteClient(id);
  },
  clearClients() {
    this.set('clients', []);
    if (typeof CloudSync !== 'undefined') CloudSync.clearClients();
  },

  // 歷史記錄
  getHistory() { return this.get('history', []); },
  addHistory(entry) {
    const h = this.getHistory();
    entry.id = Date.now().toString(36);
    entry.time = new Date().toISOString();
    h.unshift(entry);
    if (h.length > 100) h.pop(); // keep last 100
    this.set('history', h);
    if (typeof CloudSync !== 'undefined') CloudSync.pushHistory(entry);
  },
  confirmPublished(historyId) {
    const h = this.getHistory().map(e => {
      if (e.id !== historyId) return e;
      e.published = true;
      e.publishedAt = new Date().toISOString();
      return e;
    });
    this.set('history', h);
    // 同步一筆到全組共享表
    const entry = h.find(e => e.id === historyId);
    if (entry && typeof CloudSync !== 'undefined') CloudSync.pushTeamPost(entry);
    return entry;
  },
  clearHistory() {
    this.set('history', []);
    if (typeof CloudSync !== 'undefined') CloudSync.clearHistory();
  },

  // 全組共享「已發佈」記錄
  getTeamPosts() { return this.get('team_posts', []); },
  setTeamPosts(arr) { this.set('team_posts', arr); },

  // 統計數字
  getStats() {
    return {
      clients: this.getClients().length,
      posts: this.getHistory().filter(x => x.type === 'social').length,
      followups: this.getHistory().filter(x => x.type === 'followup').length,
      proposals: this.getHistory().filter(x => x.type === 'proposal').length,
    };
  }
};
