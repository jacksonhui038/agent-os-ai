// ===== cloudsync.js — local-first + 雲端鏡像 =====
// 設計：LocalStorage 仍然係主存（UI 唔使改）。雲端只係鏡像。
// 登入後 pull 一次落 local；每次改動 fire-and-forget push 去 Supabase。
const CloudSync = {
  _base() { return APP_CONFIG.supabase.url.replace(/\/$/, ''); },
  _ready() { return APP_CONFIG.cloudEnabled && Auth.isLoggedIn; },

  _restHeaders() {
    return {
      'apikey': APP_CONFIG.supabase.anonKey,
      'Authorization': 'Bearer ' + Auth.token,
      'Content-Type': 'application/json'
    };
  },

  // 確保 access token 仲未過期（過期前 5 分鐘自動續期）
  async _ensureToken() {
    if (!this._ready()) return;
    const sess = Auth.session;
    if (sess && sess.expires_at && sess.expires_at - Date.now() < 5 * 60 * 1000) {
      await Auth.refresh();
    }
  },

  // ---- PULL：登入後將雲端資料載入 local ----
  async pullAll() {
    if (!this._ready()) return false;
    await this._ensureToken();
    const uid = Auth.currentUser.id;
    try {
      const [clients, history, teamPosts] = await Promise.all([
        this._get('clients', uid),
        this._get('history', uid),
        this._getTeamPosts()
      ]);
      // 重建 local 陣列（雲端為主，覆蓋 local）
      const cArr = (clients || []).map(r => r.data);
      const hArr = (history || []).map(r => r.data);
      const tArr = (teamPosts || []).map(r => r.data);
      try {
        localStorage.setItem('agent_os_clients', JSON.stringify(cArr));
        localStorage.setItem('agent_os_history', JSON.stringify(hArr));
        localStorage.setItem('agent_os_team_posts', JSON.stringify(tArr));
      } catch {}
      // 載入用戶設定（例如 RedFox Key），實現跨裝置同步
      await this.pullSettings();
      return true;
    } catch (e) {
      console.error('CloudSync.pullAll failed:', e);
      return false;
    }
  },

  // ---- 用戶設定（跨裝置同步）----
  getSettings() {
    try { return JSON.parse(localStorage.getItem('agent_os_settings') || '{}'); }
    catch { return {}; }
  },
  async pullSettings() {
    if (!this._ready()) return false;
    await this._ensureToken();
    try {
      const res = await fetch(`${this._base()}/rest/v1/user_settings?id=eq.${encodeURIComponent(Auth.currentUser.id)}&select=*`, {
        headers: this._restHeaders()
      });
      if (!res.ok) throw new Error('GET user_settings HTTP ' + res.status);
      const rows = await res.json();
      const data = (rows[0] && rows[0].data) ? rows[0].data : {};
      localStorage.setItem('agent_os_settings', JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('CloudSync.pullSettings failed:', e);
      return false;
    }
  },
  async pushSetting(key, value) {
    if (!this._ready()) return;
    try {
      await this._ensureToken();
      const cur = this.getSettings();
      cur[key] = value;
      const row = { id: Auth.currentUser.id, data: cur, updated_at: new Date().toISOString() };
      await this._upsert('user_settings', row);
      localStorage.setItem('agent_os_settings', JSON.stringify(cur));
    } catch (e) { console.error('CloudSync.pushSetting failed:', e); }
  },

  // 取得全組共享的 team_posts（所有 authenticated user 可讀）
  async _getTeamPosts() {
    await this._ensureToken();
    const res = await fetch(`${this._base()}/rest/v1/team_posts?select=*`, {
      headers: this._restHeaders()
    });
    if (!res.ok) throw new Error('GET team_posts HTTP ' + res.status);
    return res.json();
  },

  async _get(table, uid) {
    await this._ensureToken();
    const res = await fetch(`${this._base()}/rest/v1/${table}?owner=eq.${encodeURIComponent(uid)}&select=*`, {
      headers: this._restHeaders()
    });
    if (!res.ok) throw new Error('GET ' + table + ' HTTP ' + res.status);
    return res.json();
  },

  // ---- PUSH helpers（fire-and-forget）----
  async pushClient(c) {
    if (!this._ready()) return;
    const row = { id: c.id, owner: Auth.currentUser.id, data: c };
    this._upsert('clients', row).catch(e => console.error('pushClient failed:', e));
  },
  async deleteClient(id) {
    if (!this._ready()) return;
    this._delete('clients', id).catch(e => console.error('deleteClient cloud failed:', e));
  },
  async clearClients() {
    if (!this._ready()) return;
    this._deleteAll('clients').catch(e => console.error('clearClients cloud failed:', e));
  },
  async pushHistory(e) {
    if (!this._ready()) return;
    const row = { id: e.id, owner: Auth.currentUser.id, data: e };
    this._insert('history', row).catch(err => console.error('pushHistory failed:', err));
  },
  async pushTeamPost(e) {
    if (!this._ready()) return;
    const row = {
      id: e.id,
      owner: Auth.currentUser.id,
      user_email: Auth.currentUser.email || '',
      data: e
    };
    this._insert('team_posts', row).catch(err => console.error('pushTeamPost failed:', err));
  },
  async clearHistory() {
    if (!this._ready()) return;
    this._deleteAll('history').catch(e => console.error('clearHistory cloud failed:', e));
  },
  async clearTeamPosts() {
    if (!this._ready()) return;
    this._deleteAll('team_posts').catch(e => console.error('clearTeamPosts cloud failed:', e));
  },

  async _upsert(table, row) {
    await this._ensureToken();
    const res = await fetch(`${this._base()}/rest/v1/${table}`, {
      method: 'POST',
      headers: Object.assign(this._restHeaders(), { 'Prefer': 'resolution=merge-duplicates' }),
      body: JSON.stringify([row])
    });
    if (!res.ok) throw new Error('upsert HTTP ' + res.status);
  },
  async _insert(table, row) {
    await this._ensureToken();
    const res = await fetch(`${this._base()}/rest/v1/${table}`, {
      method: 'POST',
      headers: Object.assign(this._restHeaders(), { 'Prefer': 'return=minimal' }),
      body: JSON.stringify([row])
    });
    if (!res.ok) throw new Error('insert HTTP ' + res.status);
  },
  async _delete(table, id) {
    await this._ensureToken();
    const res = await fetch(`${this._base()}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this._restHeaders()
    });
    if (!res.ok) throw new Error('delete HTTP ' + res.status);
  },
  async _deleteAll(table) {
    await this._ensureToken();
    const uid = Auth.currentUser.id;
    const res = await fetch(`${this._base()}/rest/v1/${table}?owner=eq.${encodeURIComponent(uid)}`, {
      method: 'DELETE',
      headers: this._restHeaders()
    });
    if (!res.ok) throw new Error('deleteAll HTTP ' + res.status);
  }
};
