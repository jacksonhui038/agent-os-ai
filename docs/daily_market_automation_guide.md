# 每日市場焦點自動化圖文教學（Power Automate + Copilot + PowerPoint）

> 目標：每日 07:00 自動抓取財經新聞，由 Copilot 分析並輸出 5 大市場焦點，填入設計好嘅 PowerPoint 模板，匯出 PNG 後自動發送到 WhatsApp / Teams / Email。

---

## 一、點解人哋張圖咁靚？

Mandy / Doni 風格嘅「市場動向」圖有幾個共同設計元素：

| 設計元素 | 作用 | 我哋點做 |
|---------|------|---------|
| 真實城市相片背景 | 增加專業感同地標辨識度 | PowerPoint 放維港 / 上海外灘相片做底圖 |
| 5-6 個資訊區塊 | 訊息密度高、睇落豐富 | 模板預留 5 個 card：中國、香港、美國、AI、一句睇市 |
| 國旗 + 圖標 | 一眼辨識主題 | PowerPoint 內建圖標 / 國旗 emoji / 自製圖片 |
| 大字數字 | 視覺衝擊力強 | 用 72pt 以上字體突出關鍵數字 |
| 卡片式排版 | 整齊易讀 | 用圓角矩形 + 統一間距 |
| 底部免責聲明 | 合規要求 | 加入「投資涉及風險」橫條 |

總結：**靚嘅關鍵係「模板化 + 高對比 + 真實素材」**，而唔係 AI 自己憑空畫出嚟。我哋可以複製呢套方法。

---

## 二、所需工具同月費

| 工具 | 用途 | 月費（參考 2026） |
|-----|------|------------------|
| Microsoft 365（含 PowerPoint、OneDrive） | 做模板、存檔案 | 商業版約 HK$50-80 / 月 |
| Power Automate Premium | 定時觸發、RSS、發送、進階 connector | 約 US$15 / 用戶 / 月 |
| Microsoft Copilot / Azure OpenAI | 分析新聞、輸出 5 大焦點 | 多數已包在 M365 Copilot（US$30/月）或按 token 計 |
| PowerPoint 圖庫 / Unsplash / Getty | 城市背景圖、圖標 | 免費至數百蚊不等 |
| WhatsApp Business API（可選） | 發送 WhatsApp | 按對話收費，用戶主動回覆後 24h 內免費 |

**最低起步成本**：如果你有 M365 商業版 + Power Automate Premium，大約每月 HK$150-250 就可以跑起。

---

## 三、整體架構

```
每日 07:00
    │
    ▼
Power Automate 定時執行
    │
    ▼
抓取財經新聞 RSS
(Reuters、Yahoo Finance、CNBC、RTHK)
    │
    ▼
Copilot AI 分析新聞
    │
    ▼
輸出結構化內容：
- 中國市場焦點
- 香港市場焦點
- 美國市場焦點
- AI 焦點
- Jackson 一句睇市
    │
    ▼
填入 PowerPoint 模板
（文字框 + 圖標 + 數字）
    │
    ▼
匯出 PNG 圖片
    │
    ▼
自動發送 WhatsApp / Teams / Email
```

---

## 四、Step-by-step 設定

### 步驟 1：設計 PowerPoint 模板

1. 開新 PowerPoint，設 Slide size 為 **寬屏 16:9** 或自訂 **1080 x 1080**（IG）/ **1080 x 1350**（小紅書）。
2. 放一張城市相片做背景（建議：維港夜景 / 上海外灘 / 紐約曼哈頓），加一層半透明深色遮罩（約 30-40% 黑），令文字清楚。
3. 頂部放品牌名稱 + 日期，例如「Jackson 市場動向｜2026 年 7 月 22 日」。
4. 預留 5 個卡片位置：
   - 中國市場焦點（紅色主調 + 中國國旗圖標）
   - 香港市場焦點（綠色主調 + 香港區旗圖標）
   - 美國市場焦點（藍色主調 + 美國國旗圖標）
   - AI 焦點（紫色主調 + 機械人圖標）
   - Jackson 一句睇市（金色主調 + 燈泡圖標）
5. 每個卡片預留 3 個文字框：
   - `{{TitleX}}`：標題（例：中國第二季 GDP 增 4.3%）
   - `{{SubX}}`：副標題（例：低於市場預期 4.5%）
   - `{{BigX}}`：大字數字（例：4.3%）
6. 底部加免責聲明：「投資涉及風險，本資料只供參考，並不構成任何投資建議。」
7. 另存新檔為 `.pptx`，再上載到 OneDrive / SharePoint。

**設計貼士**：
- 字體用思源黑體 / 微軟正黑體，標題粗體。
- 數字字級要比標題大 1.5-2 倍。
- 每張卡片用唔同顏色邊框，但唔好超過 5 種主色。

---

### 步驟 2：建立 Power Automate Flow

1. 登入 [Power Automate](https://make.powerautomate.com)。
2. 按 **Create** → 揀 **Scheduled cloud flow**。
3. 設定：
   - Flow name：`每日市場焦點 - 07:00`
   - Start time：`2026-07-23T07:00:00+08:00`
   - Repeat：`Every 1 Day`
4. 按 **Create**。

---

### 步驟 3：抓取財經 RSS

加入 **RSS connector**（免費）：

- Action：`List all RSS feed items`
- Feed URL：建議用多個 feed，再用 `Apply to each` 或 `Append to string variable` 合併。

建議 RSS 來源：

| 市場 | RSS Feed |
|-----|---------|
| 香港 | `https://rthk.hk/rthk/news/rss/c_expressnews_cfinance.xml` |
| 中國 | `https://www.news.gov.hk/tc/categories/finance/html/articlelist.rss.xml` |
| 環球 | `https://feeds.finance.yahoo.com/rss/2.0/headline` |
| 美股 | `https://www.cnbc.com/id/19789731/device/rss/rss.xml` |
| 英國 | `https://www.reutersagency.com/feed/?taxonomy=markets&post_type=reuters-best` |

**做法**：
- 建立一個 String variable `newsContent`。
- 對每個 RSS 用 `List all RSS feed items`，limit 設 5-10 條。
- 用 `Apply to each` 將 `title` + `summary` append 到 `newsContent`。

---

### 步驟 4：用 Copilot 分析新聞

Power Automate 有兩種方法接 AI：

#### 方法 A：Microsoft Copilot Actions（最簡單，如果你有 Copilot 授權）

1. 加入 action：**Create text with AI using Copilot** 或 **AI Builder > Create text with GPT**。
2. 將 `newsContent` 放入 prompt。
3. 設定 output format 為 JSON。

#### 方法 B：HTTP + Azure OpenAI / SiliconFlow（較彈性）

1. 加入 **HTTP** action，method = POST。
2. URL：你嘅 LLM endpoint（例如 `https://api.siliconflow.cn/v1/chat/completions`）。
3. Header：`Authorization: Bearer YOUR_API_KEY`、`Content-Type: application/json`。
4. Body：

```json
{
  "model": "deepseek-ai/DeepSeek-V3",
  "messages": [
    {"role": "system", "content": "你係專業財經分析師，請用繁體中文分析以下新聞，輸出 JSON。"},
    {"role": "user", "content": "新聞內容：@{variables('newsContent')}。請輸出：中國市場焦點、香港市場焦點、美國市場焦點、AI焦點、Jackson一句睇市。每項包含 title（15字內）、subtitle（20字內）、bigNumber（突出數字，可留空）。"}
  ],
  "temperature": 0.5
}
```

5. 用 **Parse JSON** action 將回應拆成欄位。

**建議 Prompt 範本**：

```
你係資深財經分析師，請根據以下今日財經新聞，整理成 5 大市場焦點：

1. 中國市場焦點
2. 香港市場焦點
3. 美國市場焦點
4. AI 焦點
5. Jackson 一句睇市（用 30 字內總結當日最大主題）

每項請提供：
- title：標題，15 字以內，要吸睛
- subtitle：副標題，20 字以內，補充重點
- bigNumber：一個關鍵數字（例：+4.3%、25%、2.75%），如果冇合適數字可留空

請用繁體中文，輸出為 JSON 格式。

新聞內容：
@{variables('newsContent')}
```

---

### 步驟 5：填入 PowerPoint 模板

1. 加入 **PowerPoint Online (Business)** connector。
2. Action：`Populate a Microsoft PowerPoint presentation`。
3. 選擇你上載到 OneDrive 嘅 `.pptx` 模板。
4. 將 AI 輸出嘅 JSON 欄位對應到模板文字框：
   - `{{Title1}}` → 中國市場 title
   - `{{Sub1}}` → 中國市場 subtitle
   - `{{Big1}}` → 中國市場 bigNumber
   - 如此類推...
5. 輸出檔案另存到新嘅 `.pptx`（例如 `/每日市場焦點/2026-07-22.pptx`）。

**注意**：PowerPoint Online 嘅 `Populate` action 需要預先在模板入面 named shape（開發者工具 → 選取窗格 → 重新命名 shape）。

---

### 步驟 6：匯出 PNG

Power Automate 本身冇直接「PPT → PNG」action，要用以下方法：

#### 方法 A：Office Script（推薦）

1. 喺 Excel Online 開一個空 workbook，進入 **Automate > New Script**。
2. 貼入以下 script 範例（執行 PowerPoint → PNG）：

```javascript
function main(workbook: ExcelScript.Workbook, pptxUrl: string, outputFolder: string, fileName: string) {
  // 注意：Office Script 主要控制 Excel，PowerPoint 需要 Graph API 或 Power Automate 本身處理
  // 此處建議改用方法二
}
```

#### 方法 B：Microsoft Graph API（較穩定）

1. 用 **HTTP** action call Graph API：

```
POST https://graph.microsoft.com/v1.0/me/drive/items/{pptxItemId}/convert
Content-Type: image/png
```

或者先 copy file，再用 `https://graph.microsoft.com/v1.0/me/drive/items/{item-id}/content?format=png`。

2. 儲存 PNG 到 OneDrive。

#### 方法 C：用 CloudConvert / ConvertAPI 等第三方服務

- 加入 HTTP connector，call CloudConvert API（約 US$8/月 起）。
- 較簡單但要多付錢。

---

### 步驟 7：發送到 WhatsApp / Teams / Email

#### 發送 Email（最簡單）

1. 加入 **Outlook 365** connector。
2. Action：`Send an email (V2)`。
3. Subject：`Jackson 每日市場動向｜{utcNow()}`。
4. Body：簡短文字 + 插入 PNG 作附件或 inline image。
5. To：填你自己 / 客戶名單。

#### 發送 Teams

1. 加入 **Microsoft Teams** connector。
2. Action：`Post a message in a chat or channel`。
3. 揀 channel，attach PNG。

#### 發送 WhatsApp

1. 需要 **WhatsApp Business API**（Meta Business Manager 申請）。
2. Power Automate 冇原生 WhatsApp connector，要用 **HTTP** call Meta Graph API：

```
POST https://graph.facebook.com/v18.0/{phone-number-id}/messages
Authorization: Bearer {whatsapp-token}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "{customer_phone}",
  "type": "image",
  "image": {
    "link": "{png-public-url}",
    "caption": "Jackson 每日市場動向"
  }
}
```

3. PNG 需要有 public URL（OneDrive share link 要開放「任何人可檢視」，或上載到 public storage）。
4. 參考我哋項目入面嘅 `docs/whatsapp_setup_guide.md` 申請 WhatsApp Business API。

---

## 五、常見問題

### Q1：點解人哋張圖似設計師做，我哋自動化會唔會太醜？

**A**：關鍵係模板預先設計好。AI 只負責填文字同數字，視覺風格由你一次過整好。如果你覺得唔夠靚，可以請 designer 整一個專業模板，之後就係 permanent asset。

### Q2：Power Automate 可以直接 send WhatsApp 嗎？

**A**：原生唔得，要用 HTTP call Meta Graph API 或第三方 connector（如 Twilio、MessageBird），後者要額外費用。

### Q3：點樣確保每日內容準確？

**A**：
- 用多個 RSS source，避免單一 bias。
- Copilot prompt 要求提供數字來源。
- 初期先 send 畀自己，人工覆核一兩週，確認質素後先發客戶。

### Q4：可以用 Agent OS 代替 Power Automate 嗎？

**A**：Agent OS 係純前端網站，本身冇定時執行能力，都唔能夠直接發 WhatsApp。佢適合「你手動一撳就出圖 + 文案」，但唔適合全自動每日推送。全自動要用 Power Automate / n8n / Make + backend。

---

## 六、替代方案

| 方案 | 優點 | 缺點 | 適合 |
|-----|------|------|------|
| **Power Automate + PPT** | 同 M365 整合好、毋須寫 code | 月費、PPT→PNG 要繞路 | 已有 M365 商業版用戶 |
| **n8n / Make + Google Slides** | 更彈性、cheap | 要學習曲線、Google Slides API 權限 | 技術背景較強 |
| **Agent OS 手動生成** | 免費、一鍵出圖 | 無法定時自動發送 | 暫時頂住、每日自己 copy |
| **WhatsApp Bot + 自訂 backend** | 直 send 圖、靈活 | 要自己寫 server、申請 API | 長期規模化 |

---

## 七、推薦起步路線

如果你是第一次做，建議按以下順序：

1. **Week 1**：手動用 PowerPoint 整 1 個靚模板，每日自己填新聞，send 畀自己測試視覺。
2. **Week 2**：用 Power Automate 接 RSS + Copilot，自動填 PPT，你負責覆核同 export PNG。
3. **Week 3**：加入自動 export PNG（Graph API 或 CloudConvert）。
4. **Week 4**：加入 WhatsApp / Teams / Email 自動發送。

---

## 八、檢查清單

- [ ] PowerPoint 模板設計好並上載 OneDrive
- [ ] 模板內所有文字框已 named（{{Title1}}、{{Sub1}} 等）
- [ ] Power Automate Premium 授權開通
- [ ] RSS feed 測試可正常讀取
- [ ] Copilot / AI Builder 可輸出結構化 JSON
- [ ] PPT populate 測試成功
- [ ] PNG export 測試成功
- [ ] Email / Teams 發送測試成功
- [ ] WhatsApp Business API 申請完成（如要發 WhatsApp）
- [ ] 加入免責聲明並請合規同事過目

---

> 最後提醒：無論用邊種工具，「靚圖」都係靠預先設計好嘅模板，唔係 AI 即時畫出嚟。建議你先投資時間整一個專業模板，之後自動化就會每日幫你慳大量時間。
