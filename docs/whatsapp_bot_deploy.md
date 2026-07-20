# WhatsApp Bot — 部署同測試

Bot 架構：
```
客戶 WhatsApp ──▶ Meta Webhook ──▶ Supabase Edge Function (whatsapp-bot)
                                        │
                                        ├─ GET：webhook 驗證（返 challenge）
                                        ├─ POST：收 message
                                        │     ├─ callLLM() 分類（query/command）
                                        │     ├─ buildReply() 組文字 + render.html 連結
                                        │     └─ Graph API 回覆文字（含連結）
                                        ▼
客戶撳連結 ──▶ https://jacksonhui038.github.io/agent-os-ai/render.html?mode=...
                                        │
                                        └─ 瀏覽器用 Canvas 畫 infographic / post 圖，可 save
```

---

## A. 部署 Edge Function（需要 Supabase CLI + 已申請 API，見 whatsapp_setup_guide.md）

```bash
# 1. 安裝 CLI（如未裝）
npm install -g supabase

# 2. login + link 你個 project
supabase login
supabase link --project-ref <your-project-ref>

# 3. 設 secrets（值嚟自申請指南）
supabase secrets set WHATSAPP_VERIFY_TOKEN=agentos-verify-2026
supabase secrets set WHATSAPP_TOKEN=你的永久token
supabase secrets set WHATSAPP_PHONE_ID=你的PhoneNumberID
supabase secrets set RENDER_BASE_URL=https://jacksonhui038.github.io/agent-os-ai/render.html
supabase secrets set LLM_API_KEY=你的SiliconFlowKey
supabase secrets set LLM_BASE_URL=https://api.siliconflow.cn/v1
supabase secrets set LLM_MODEL=deepseek-ai/DeepSeek-V3

# 4. 部署
supabase functions deploy whatsapp-bot

# 5. 喺 Meta Developers 後台填 Webhook URL：
#    https://<your-project-ref>.supabase.co/functions/v1/whatsapp-bot
```

## B. 本地測試 Edge Function（唔使真 API）

```bash
# 起本地 Edge Function（需要 Deno，supabase CLI 會自動處理）
supabase functions serve whatsapp-bot --no-verify-jwt

# 另一個 terminal 模擬 Meta webhook 驗證：
curl "http://localhost:54321/functions/v1/whatsapp-bot?hub.mode=subscribe&hub.verify_token=agentos-verify-2026&hub.challenge=12345"
# 期望回：12345

# 模擬收到一條客戶 message（POST）：
curl -X POST http://localhost:54321/functions/v1/whatsapp-bot \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"85291234567","type":"text","text":{"body":"我35歲有兩個仔，擔心醫療同退休"}"}]}}]}]}'
# 期望回：ok；如設咗 WHATSAPP_TOKEN 會真係 send 去個號碼
```

> 未設 LLM_API_KEY 時會用 `fallback()` 後備邏輯（關鍵詞判斷 query/command），一樣可以測通流程。

## C. render.html 測試（純前端，已經喺 GitHub Pages）

直接開：
```
https://jacksonhui038.github.io/agent-os-ai/render.html?mode=sales&title=你嘅保障缺口&tagline=3分鐘免費分析&points=醫療開支通脹快要早啲鎖定||家庭支柱最怕收入中斷||退休儲備愈早開始愈輕鬆
```
應該見到一張藍色 infographic，撳「保存到相機」可落 PNG。

post 模式：
```
https://jacksonhui038.github.io/agent-os-ai/render.html?mode=post&title=3個理財貼士&tagline=香港人都要知&points=自願醫保扣稅慳稅又保障||危疾保障填補收入中斷||儲蓄保底鎖定長線回報
```

## D. 本環境測試（無 Deno）
`tests/verify_render_page.cjs` 會用 node + jsdom + node-canvas 載入真正嘅 `social.js`，模擬 render.html 嘅 `resolveTpl` + `renderCover` 邏輯，確保 sales / post 兩種模式都可以畫圖無 error：
```bash
node tests/verify_render_page.cjs
```
