// ===== auth.js — Supabase Auth（用 fetch 直接 call，唔使外部 SDK）=====
const Auth = {
  SESSION_KEY: 'agent_os_session',
  _session: null,

  init() {
    try {
      const raw = localStorage.getItem(this.SESSION_KEY);
      this._session = raw ? JSON.parse(raw) : null;
    } catch { this._session = null; }
    return this._session;
  },

  get currentUser() { return this._session?.user || null; },
  get token() { return this._session?.access_token || null; },
  get isLoggedIn() { return !!this.token; },
  get session() { return this._session; },

  _headers(extra = {}) {
    return Object.assign({
      'apikey': APP_CONFIG.supabase.anonKey,
      'Content-Type': 'application/json'
    }, extra);
  },

  async _post(path, body, authToken = null) {
    const url = APP_CONFIG.supabase.url.replace(/\/$/, '') + path;
    const headers = this._headers();
    if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error_description || data?.msg || data?.message || ('HTTP ' + res.status);
      throw new Error(msg);
    }
    return data;
  },

  async signUp(email, password) {
    const data = await this._post('/auth/v1/signup', { email, password });
    if (data?.user) {
      // Supabase 預設要 confirm email；若 auto-confirm 關咗就直接有 session
      if (data.access_token) this._save(data);
      return data;
    }
    throw new Error('註冊失敗');
  },

  async signIn(email, password) {
    const data = await this._post('/auth/v1/token?grant_type=password', { email, password });
    if (data?.access_token) { this._save(data); return data; }
    throw new Error('登入失敗');
  },

  // 用 refresh_token 換新 access_token（解決登入 1 小時後 JWT 過期、雲端同步靜默失敗）
  async refresh() {
    if (!this._session || !this._session.refresh_token) return false;
    try {
      const data = await this._post('/auth/v1/token?grant_type=refresh_token', {
        refresh_token: this._session.refresh_token
      });
      if (data?.access_token) { this._save(data); return true; }
    } catch (e) {
      console.error('Auth.refresh failed:', e.message);
    }
    return false;
  },

  async signOut() {
    if (this.token) {
      try {
        await fetch(APP_CONFIG.supabase.url.replace(/\/$/, '') + '/auth/v1/logout', {
          method: 'POST',
          headers: this._headers({ 'Authorization': 'Bearer ' + this.token })
        });
      } catch { /* ignore */ }
    }
    this._session = null;
    try { localStorage.removeItem(this.SESSION_KEY); } catch {}
  },

  _save(data) {
    // 計算過期時間，俾 CloudSync 喺過期前自動續期
    const expiresAt = data.expires_in
      ? Date.now() + Number(data.expires_in) * 1000
      : null;
    this._session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
      expires_at: expiresAt
    };
    try { localStorage.setItem(this.SESSION_KEY, JSON.stringify(this._session)); } catch {}
  }
};
