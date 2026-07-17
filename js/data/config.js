// ===== config.js — 多使用者雲端設定 =====
// 要啟用「每位同事登入」，喺下面填你嘅 Supabase project 資料：
//   1. 去 https://supabase.com 開個免費 project
//   2. Project Settings → API → 抄 Project URL 同 anon public key
//   3. 喺 Supabase SQL Editor run `supabase_schema.sql`（同一個 folder）
//   4. 填落下面，儲存，refresh 個網頁 → 就會彈登入頁
// 留空 = 單機模式（LocalStorage，冇登入）
const APP_CONFIG = {
  supabase: {
    url: 'https://hesvzbicvomtaoivjcxj.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlc3Z6Ymljdm9tdGFvaXZqY3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NzEyNjQsImV4cCI6MjA5OTE0NzI2NH0.u6t_xYCo15g7qFgctWjuzlTYn-2X2tt3uBlqG6FjDwA'
  },
  // 自動判斷：兩個欄都有值先當雲端模式
  get cloudEnabled() {
    const u = (this.supabase.url || '').trim();
    const k = (this.supabase.anonKey || '').trim();
    return u.startsWith('http') && k.length > 10;
  },
  // SET 智能體 LLM 後端
  // provider: 'mock'（離線示範）| 'ollama'（本地，唔使 key，已棄用）| 'openai'（需 key，OpenAI-compatible）| 'shared'（管理員共享 Key，經 Supabase 資料表）
  //
  // ★ 用 'shared' 模式：所有同事登入後自動用管理員共享 Key，唔洗各自填 API Key。
  //   Key 存放喺 Supabase `app_secrets` 資料表（由管理員喺 SQL Editor 填入一次，見 SET_SHARED_KEY_SETUP.sql），
  //   前端只會喺用家已登入時，經 authenticated REST read（user JWT）拎到 key，再直接 call LLM provider。
  //   好處：唔使 deploy 任何 Edge Function，改完 code push 就得。
  //   注意：shared 模式需要已登入 Supabase（APP_CONFIG.supabase 有值）。
  //   想 revert 返每人自己填 key → 改返 'mock' 或 'openai'。
  llm: {
    provider: 'shared',
    baseUrl: '',
    apiKey: '',
    model: ''
  }
};
