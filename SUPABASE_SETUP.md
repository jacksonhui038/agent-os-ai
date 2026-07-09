# Supabase 開免費 Project 詳細步驟（Agent OS AI 工作台用）

> 目標：開 1 個免費 Supabase project → 跑建表 SQL → 攞 URL + anon key → 填落 `js/data/config.js`
> 同事唔使開 project，全部用同一個 project 註冊登入就得。

---

## A. 開 Account（如果你未開過）

1. 開瀏覽器去 **https://supabase.com**
2. 撳右上角 **「Start your project」** 或 **「Sign Up」**
3. 最簡單：撳 **「Continue with Google」** 用你 Google account 登入（唔使再記多個 password）
4. 跟指示填 username / 確認 email（Google 登入通常跳過呢步）

---

## B. 開 Project（只開 1 個就夠）

1. 入咗 dashboard，撳 **「New project」**（綠色掣，右上或中間）
2. **Organization**：用 default（你個人嗰個），唔使郁
3. **Name**：填 `agent-os`（或者 `保經管家`，隨你；純標籤嚟嘅）
4. **Database Password**：
   - 撳 **「Generate a password」** 自動生成一個
   - ⚠️ **抄落你嘅密碼管理器 / Notes**（之後如果想直接用 SQL 入 DB 才用得到；平時 app 用 anon key 唔使佢，但丟咗就麻煩）
5. **Region**：⚠️ 重要，揀離香港近嘅：
   - 揀 **Singapore (ap-southeast-1)** 或 **Northeast Asia (Tokyo)** ← 推薦呢兩個，速度最快
   - 唔好揀 USA / Europe，會慢
6. **Pricing Plan**：確認顯示 **「Free」**（$0 / month）
7. 撳 **「Create new project」**
8. 等 **1–2 分鐘**（顯示 provisioning），唔好關頁

---

## C. 跑建表 SQL（❗ 唔跑就用唔到雲端同步）

呢步係最多人漏嘅。建好 project 要做：

1. 左側 Menu 撳 **「SQL Editor」**（個 icon 係 `< >` 或者搜「SQL」）
2. 撳 **「New query」**（空白編輯器）
3. 將 `supabase_schema.sql` 嘅**全部內容**貼上去
   - （個 file 喺 `/agent-os/supabase_schema.sql`，你可以直接 copy 晒佢）
4. 撳右上 **「Run」**（或 Cmd/Ctrl + Enter）
5. 下面顯示 **「Success. No rows returned」** 或者無 error 就 ✅
   - 如果見到紅色 error，截圖畀我

呢個 SQL 會建立：
- `clients` 表（客戶資料）
- `history` 表（操作記錄）
- 每個 user 嘅資料**自動隔離**（RLS 政策，同事之間睇唔到對方嘅客戶）

---

## D. 攞 Project URL + anon key（之後 send 畀我）

1. 左側 Menu 最底撳齒輪 **「Project Settings」**
2. 撳左邊 **「API」**
3. 複製呢兩個值：

   | 欄位 | 位置 | 樣子 |
   |------|------|------|
   | **Project URL** | 頁面頂 `Project URL` | `https://xxxxxxxxx.supabase.co` |
   | **anon public key** | `Project API keys` → `anon` `public` | 好長嘅 `eyJhbGci...` 字串 |

   ⚠️ **只要 anon public key**，唔好抄 `service_role` key（佢有無限權限，放前端會出事）

4. 將呢兩個值 send 畀我（貓王），我幫你填落 `config.js`

---

## E. 填落 config.js（呢步我幫你做）

你把 URL + key 畀我之後，我會改呢度：

```js
// js/data/config.js
APP_CONFIG.supabase.url = 'https://xxxx.supabase.co';
APP_CONFIG.supabase.anonKey = 'eyJhbGci...';
```

改完你 refresh 個網 → 彈登入頁 → 同事用公司 email 註冊就得。

---

## ⚠️ 3 個重要提醒

1. **免費 project 會休眠**：如果 **7 日無活動**，Supabase 會自動 pause 個 project（唔會删 data）。再開要用 dashboard 撳 **「Resume」**。你同事如果唔係日日開，可能會遇到「開唔到」要 resume——呢個正常，唔係壞咗。

2. **anon key 係 public 嘅**：安全唔靠隱藏 key，而係靠 RLS（我個 SQL 已經設好：每個 login user 只睇到自己嘅資料）。所以唔使驚 key 外洩。

3. **只開 1 個 project**：500MB 係 per project。你開 1 個就夠 50,000 個同事用，唔使開第 2 個浪費配額。

---

## 之後流程（開好之後）

1. 你把 URL + anon key 畀我 → 我填 config.js
2. 你 refresh 網 → 用你 email 註冊第 1 個 account
3. 試吓儲個客戶 → 去 Supabase 嘅 Table Editor 睇 `clients` 表有冇資料（驗證 sync 成功）
4. 同事各自用自己 email 註冊，資料自動隔離

有咩卡住就截圖畀我 🐱
