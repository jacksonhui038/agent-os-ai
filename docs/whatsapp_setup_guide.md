# WhatsApp Business API 申請指南（Agent OS AI Bot）

目的：申請到 Meta WhatsApp Business 權限，俾 `whatsapp-bot` Edge Function 收客戶 message 同自動回覆。

> 預計時間：**商業驗證 1–7 日**（視 Meta 審批速度）。其餘步驟 30 分鐘內搞掂。

---

## 步驟 1：開 Meta Business Manager 帳戶
1. 去 https://business.facebook.com/
2. 用你嘅 Facebook 帳戶登入 → 建立 Business Portfolio（商業組合）
3. 填寫公司名稱、電郵、實體資料（必須真實，之後要驗證）

## 步驟 2：商業驗證（Business Verification）
1. Business Manager → 左側「業務設定」→「公司」→「驗證」
2. 上傳商業文件（商業登記 / 公司註冊證）
3. 等 Meta 審批（通常 1–7 日，會 email 通知）
4. ✅ 驗證過咗先可以申請 WhatsApp 永久 token

## 步驟 3：加 WhatsApp 產品
1. Business Manager → 「業務設定」→「帳戶」→「WhatsApp 帳戶」→「新增」
2. 跟指示開一個 WhatsApp Business 號碼（可以用你嘅真實手機號碼，會收 SMS / 電話驗證）
3. 記低呢兩個值（之後要填去 Supabase secrets）：
   - **Phone Number ID**（設定 → WhatsApp → 號碼 → 最底）
   - **WhatsApp Business Account ID (WABA ID)**

## 步驟 4：拎永久 Access Token
1. 去 https://developers.facebook.com/ → 建立一個 App（類型選「Business」）
2. 加產品「WhatsApp」→ 連去你嘅 WABA
3. 喺 WhatsApp → API Setup 頁，撳「Generate permanent access token」（永久 token 要用 System User + 授權，唔好用臨時 token，臨時會過期）
   - 詳細：Business Manager → System Users → 加一個 System User → 授權 `whatsapp_business_messaging` → 生成 token
4. 記低 **Access Token**（之後填 `WHATSAPP_TOKEN`）

## 步驟 5：設 Webhook（叫 Edge Function 收 message）
1. Developers → 你個 App → WhatsApp → Configuration → Webhook
2. Callback URL 填：`https://<your-project-ref>.supabase.co/functions/v1/whatsapp-bot`
   （project ref 喺 Supabase 後台 Project Settings → API 搵到）
3. Verify Token：填你自己定嘅一字串，例如 `agentos-verify-2026`（之後填 `WHATSAPP_VERIFY_TOKEN`）
4. 訂閱欄位：剔 `messages`
5. 儲存後 Meta 會 send 一個 GET 挑戰，Edge Function 會回 challenge 確認（見 `index.ts` 嘅 GET 處理）

## 步驟 6：填 Supabase Secrets + 部署（見 whatsapp_bot_deploy.md）
```
supabase secrets set WHATSAPP_VERIFY_TOKEN=agentos-verify-2026
supabase secrets set WHATSAPP_TOKEN=<步驟4 token>
supabase secrets set WHATSAPP_PHONE_ID=<步驟3 Phone Number ID>
supabase secrets set RENDER_BASE_URL=https://jacksonhui038.github.io/agent-os-ai/render.html
supabase secrets set LLM_API_KEY=<你嘅 SiliconFlow key>
supabase secrets set LLM_BASE_URL=https://api.siliconflow.cn/v1
supabase secrets set LLM_MODEL=deepseek-ai/DeepSeek-V3
supabase functions deploy whatsapp-bot
```

---

## ⚠️ 重要限制（做之前要知）
- **24 小時窗口**：客戶 send 過 message 之後 24 小時內，你可以 free-form 回任何文字；過咗窗口就要用 Meta 審批過嘅 **Template** 先可以主動 send。Bot 而家處理「客戶主動 send → 即時回」呢個場景，完全喺窗口內，OK。
- **Server-side 唔能夠畫圖**：Edge Function（Deno）冇 Canvas，所以「張 infographic 圖」係用 `render.html` 連結，客戶撳入去喺自己瀏覽器睇 / save。體驗同競品極似，但嚴格嚟講唔係 bot 直接 send 張圖。Phase 2 可以加外部 HTML→image 服務升級成直接 send 圖。
- **費用**：WhatsApp Cloud API 收費按對話（conversation）計，首 1000 個月免費。Edge Function 有免費額度。

## 測試（申請到之後）
用手機 WhatsApp send 一條 message 去你個 Business 號碼：
- 寫「我 35 歲有兩個仔，擔心醫療」→ 應該回分析文字 + 圖表 link
- 寫「幫我出個 post 關於自願醫保」→ 應該回 post 文案 + 圖表 link
