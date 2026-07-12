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
  // SET 智能體 LLM 後端（用家亦可在 SET ⚙️ 設定直接填，會蓋過呢度）
  // 為咗資料安全，預設用離線示範模式（mock），唔會將任何資料送出國。
  // 想用真 AI → 喺 SET ⚙️ 設定撳「NVIDIA（免費無限）」或「OpenRouter（免費）」preset 掣，再去官網拎 key 貼落去。
  //   NVIDIA NIM：https://build.nvidia.com → Settings → API Keys（免費無限額，40 RPM，推薦！）
  //   OpenRouter：https://openrouter.ai/keys（有免費模型，20 RPM）
  // 全部外國服務，資料唔會經過中國伺服器。
  // provider: 'mock'（離線示範）| 'ollama'（本地，唔使 key，已棄用）| 'openai'（需 key，OpenAI-compatible）
  llm: {
    provider: 'mock',
    baseUrl: '',
    apiKey: '',
    model: ''
  }
};
