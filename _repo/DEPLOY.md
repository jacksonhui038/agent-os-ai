# SET · 管理員共享 Key 部署指引（Supabase 資料表，唔使 deploy）

改動目標：所有登入嘅同事自動用**管理員共享 API Key**，唔洗各自填。
Key 存放喺 Supabase `app_secrets` 資料表，前端只會喺用家**已登入**時經 authenticated REST read 拎到 key，再直接 call LLM provider。

> 優點：**唔使 deploy 任何 Edge Function**，改完前端 push 就得。管理員只係喺 Supabase SQL Editor 貼一次 SQL 入 key。

---

## 1. 建資料表 + 入共享 Key（只做一次）

### 1a. 建表（如果未 run 過 `supabase_schema.sql`）
Supabase Dashboard → **SQL Editor** → 貼入 `supabase_schema.sql` 整段 run 一次（已經 run 過就跳過）。

### 1b. 入共享 Key
Supabase Dashboard → **SQL Editor** → 開 `SET_SHARED_KEY_SETUP.sql`，將入面 `<< ... >>` 換成你嘅真實值：
- `llm_api_key` = 你嘅 LLM API Key（即你之前喺 SET ⚙️ 入過嗰個）
- `llm_base_url` = API Base URL（例如 `https://api.openai.com/v1` 或 `https://api.siliconflow.com/v1`）
- `llm_model` = 模型名（例如 `gpt-4o-mini` 或 `deepseek-ai/DeepSeek-V3`）

run 一次就得。之後想換 Key / 換 Model，直接再 run 一次（用 `ON CONFLICT` 更新）。

> 如果 `app_secrets` 表未建立，先 run `supabase_schema.sql`（第 7 節會建立 `app_secrets` + RLS）。

---

## 2. 推前端去 GitHub Pages
```bash
git add -A
git commit -m "SET: 管理員共享 Key（Supabase 資料表，其他人唔洗填 API Key）"
git push origin main   # 視乎你個 repo 分支
```
Push 完 GitHub Pages 會自動 rebuild（通常幾分鐘）。

---

## 3. 測試
1. 開 https://jacksonhui038.github.io/agent-os-ai/ ，用同事帳號**登入**
2. 入 SET 全能顧問，狀態列應該顯示「真 LLM 模式 · 管理員共享 Key（Supabase 資料表）」
3. 撳 chips 或打字，應該出真 AI 回覆（唔使填任何 key）
4. 如果管理員仲未入 key，SET 會自動退回離線示範模式（唔會出錯），狀態列顯示「離線示範模式」

---

## 4. Provider 設定參考
任何 **OpenAI-compatible** endpoint 都得（前端直接 call `/chat/completions`）：

| Provider | LLM_BASE_URL | LLM_MODEL 例子 | 備註 |
|---|---|---|---|
| **SiliconFlow 硅基流动** | `https://api.siliconflow.com/v1` | `deepseek-ai/DeepSeek-V3`、`Qwen/Qwen3-32B` | 有免費額度，推薦 |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | 付費 |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` | 平 |
| OpenRouter | `https://openrouter.ai/api/v1` | `meta-llama/llama-3.3-70b-instruct:free` | 免費 model |
| NVIDIA NIM | `https://integrate.api.nvidia.com/v1` | `meta/llama-4-maverick` | 免費無限 |

> 注意：前端直接 call LLM provider，所以個 provider 必須容許 browser CORS（SiliconFlow / DeepSeek / OpenRouter / NVIDIA 都 OK；OpenAI 官方 API 唔容許 browser CORS，建議用上面其他 provider）。

### 關於 RedFox
搵唔到一個公開、OpenAI-compatible 嘅 RedFox LLM SaaS（搵到嘅 `plainbagel/RedFox-6B` 係 HuggingFace 模型，要自己用 vLLM serve）。如果 RedFox 係你公司**內部／自託管 vLLM**，將 `llm_base_url` 設做佢嘅公開 `/v1` endpoint，`llm_model` 填模型名。唔肯定嘅話先用 **SiliconFlow** 試通。

---

## 5. 安全性說明
- Key 只開放比**已登入用戶**讀取（RLS `auth.role() = 'authenticated'`），唔開放比 anonymous。
- 代價：已登入嘅同事理論上可以喺自己 browser DevTools 睇到 key。對於內部團隊、大家都信得過嘅情況完全夠用。
- 如果之後想做到「key 完全唔落前端」（最安全），可以升級用 Supabase Edge Function 轉發——到時再搵我加返。

---

## 6. 回退
想 revert 返「每人自己填 key」→ 將 `js/data/config.js` 嘅 `llm.provider` 改返 `'mock'`（離線）或 `'openai'`（每人填自己 key）即可。
