-- ============================================================
-- SET 共享 LLM Key 設定（管理員做一次）
-- 位置：Agent OS AI 倉庫根目錄
-- 用法：Supabase Dashboard → SQL Editor 貼入 run 一次
-- ============================================================
-- 重要：將下面 << ... >> 換成你嘅真實值
--       即係你之前喺 SET ⚙️ 設定入過嘅 LLM API Key / Base URL / Model。
--       冇填嘅話，SET 會自動退回離線示範模式（唔會出錯）。
--
-- 之後想換 Key / 換 Model，直接再 run 一次呢段 SQL 就得（用 ON CONFLICT 更新）。
-- ============================================================

-- 前置：app_secrets 表必須存在。如果未 run 過 supabase_schema.sql，請先 run嗰個。

-- 填入共享 Key（replace 寫法，方便之後改 Key 直接再 run 一次）
insert into public.app_secrets (key, value) values
  ('llm_api_key', '<<你的 LLM API Key，例如 sk-... 或 SiliconFlow / DeepSeek key>>'),
  ('llm_base_url', '<<你的 API Base URL，例如 https://api.openai.com/v1 或 https://api.siliconflow.com/v1>>'),
  ('llm_model', '<<你的模型名，例如 gpt-4o-mini 或 deepseek-ai/DeepSeek-V3>>')
on conflict (key) do update set value = excluded.value;

-- 驗證吓有冇寫入啱（應該見到 3 行）
select key, left(value, 6) || '…' as value_preview from public.app_secrets order by key;
