# Render Service（Phase 2 — WhatsApp Bot 直接 send 圖）

`render.html` 用瀏覽器 Canvas 畫 infographic / post 圖。Supabase Edge Function（Deno）冇 DOM、唔支援 server-side Canvas，
所以 Phase 2 加咗呢個細服務：headless Chrome 載入 `render.html` → 拎 `canvas.toDataURL` → 返 PNG bytes。
WhatsApp Bot 將 PNG 經 Graph API media 上傳，直接 send 張圖畀客戶（唔使再 send link）。

## 1. 本地試

```bash
cd render-service
npm install
npm start
# 另開 terminal：
curl "http://localhost:3000/render?url=https://jacksonhui038.github.io/agent-os-ai/render.html?mode=sales&title=你嘅保障缺口&tagline=3分鐘免費分析&points=醫療開支通脹快||家庭支柱最怕收入中斷||退休儲備愈早開始愈輕鬆" -o test.png
# 開 test.png 應見到藍色 infographic
```

## 2. 部署去 Railway / Render / Fly.io（月費參考）

| 平台 | 免費額度 | 付費起步 | 備註 |
|------|----------|----------|------|
| Railway | $5 信用額/月（夠試） | ~$5/月 | 連 GitHub repo 自動 deploy，最簡單 |
| Render | 500h/月（Web Service 免費停休眠） | ~$7/月（唔休眠） | 免費會 15min 冇人用就休眠，首個 request 慢少少 |
| Fly.io | 3 個免費 VM（shared） | ~$0–2/月 | 要 `fly launch` + `fly deploy` |
| 自己 VPS | — | ~$4–6/月（如 HKG VPS） | 最可控，延遲最低 |

> Puppeteer 第一次 install 會 download Chromium（~150MB），deploy 時會自動做。

## 3. 環境變數

- `PORT`（預設 3000）
- `ALLOWED_HOST`（預設 `jacksonhui038.github.io`，逗號分隔可加多個白名單 host，防 SSRF）

## 4. 接駁返 WhatsApp Bot

部署完拎到服務 URL（例如 `https://agent-os-render.up.railway.app/render`），去 Supabase 加個 secret：

```bash
supabase secrets set RENDER_SERVICE_URL=https://agent-os-render.up.railway.app/render
```

之後 `supabase functions deploy whatsapp-bot` 重新部署。Bot 見到 `RENDER_SERVICE_URL` 就會：
1. 組好 `render.html?...` link
2. call 呢個服務拎 PNG
3. 經 Graph API 直接 send 張圖（caption = AI 回覆文字）
4. 萬一服務失敗，自動 fallback 返 send link（同 Phase 1 一樣）

## 5. 替代方案：唔自架，用託管 HTML→image API

如果你唔想維護部 server，可以用託管服務（bot 同樣 call 佢返 PNG）：

| 服務 | 月費 | 備註 |
|------|------|------|
| htmlcsstoimage.com | 由 $9/月（100張） | 支援 JS、等 selector，最似我哋嘅需求 |
| urlbox.io | 由 $19/月 | 穩定、快 |
| screenshotapi.net | 按量，由 $10/月 | 簡單 |

用法：將 `RENDER_SERVICE_URL` 設成佢哋嘅 endpoint（通常係 `?url=` 收 URL），確保返 PNG 就得。
