// Agent OS AI — WhatsApp Bot (Supabase Edge Function, Deno)
// 收 WhatsApp message → 分類意圖（客戶查詢 / 指令）→ AI 分析 → 回文字 + 個人化圖表連結
// 部署：supabase functions deploy whatsapp-bot
// Secrets：WHATSAPP_VERIFY_TOKEN / WHATSAPP_TOKEN / WHATSAPP_PHONE_ID / RENDER_BASE_URL / LLM_API_KEY / LLM_BASE_URL / LLM_MODEL
//          RENDER_SERVICE_URL（Phase 2 可選：HTML→image 服務，令 bot 直接 send PNG 唔使 send link）

// Phase 2：設咗 RENDER_SERVICE_URL 就直接 send 圖；冇設就 fallback 返 send link（同之前一樣）

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "agentos-verify";
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN") || "";
const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID") || "";
const BASE_URL =
  Deno.env.get("RENDER_BASE_URL") ||
  "https://jacksonhui038.github.io/agent-os-ai/render.html";
// Phase 2：HTML→image 服務（例如自架 Puppeteer / 託管 API）。設咗就直接 send 圖。
const RENDER_SERVICE_URL = Deno.env.get("RENDER_SERVICE_URL") || "";
const LLM_KEY = Deno.env.get("LLM_API_KEY") || "";
const LLM_BASE = Deno.env.get("LLM_BASE_URL") || "https://api.siliconflow.cn/v1";
const LLM_MODEL = Deno.env.get("LLM_MODEL") || "deepseek-ai/DeepSeek-V3";

// ---- 工具 ----
function encodeLink(p: Record<string, string>): string {
  const ps = new URLSearchParams();
  for (const k in p) if (p[k]) ps.set(k, p[k]);
  return `${BASE_URL}?${ps.toString()}`;
}

// ---- LLM 分類 + 生成 ----
interface BotReply {
  intent: "query" | "command";
  title: string;
  tagline: string;
  points: string[];
  caption: string;
  replyText: string;
}

const SYSTEM_PROMPT = `你係香港理財顧問 Jackson Hui 嘅 AI 助手。根據用戶訊息，判斷佢係：
1) 客戶查詢（query）：傾保險／理財需要、家庭狀況、憂慮。你要分析佢嘅潛在需要，建議 1 個產品方向，畀 3 個重點。
2) 指令（command）：叫你出社交 post 文案／建議書／內容。你要寫好嗰段文案。
只回覆以下 JSON（不要任何解釋、不要 markdown 程式碼塊）：
{
  "intent": "query" 或 "command",
  "title": "圖表主標題（query 用產品方向，command 用 post 主題，≤12字）",
  "tagline": "副標題一句（≤18字）",
  "points": ["重點1","重點2","重點3"]（每點≤22字）,
  "caption": "一段可貼出嘅文案（query 用分析+CTA，command 用 post 正文，含相關 hashtag）",
  "replyText": "回畀用戶嘅簡短 WhatsApp 文字（≤300字，繁中，親切專業，結尾加「更多資料我 send 個 link 你」之類）"
}`;

async function callLLM(userText: string): Promise<BotReply | null> {
  if (!LLM_KEY) return null;
  try {
    const r = await fetch(`${LLM_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LLM_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userText },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const content = j?.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(content);
    if (!parsed.intent) return null;
    return {
      intent: parsed.intent === "command" ? "command" : "query",
      title: String(parsed.title || "你嘅專屬建議"),
      tagline: String(parsed.tagline || ""),
      points: Array.isArray(parsed.points)
        ? parsed.points.map(String).slice(0, 3)
        : [],
      caption: String(parsed.caption || ""),
      replyText: String(parsed.replyText || parsed.caption || ""),
    };
  } catch (e) {
    console.error("LLM error:", e);
    return null;
  }
}

// 後備（無 LLM / 解析失敗）：簡單關鍵詞判斷
function fallback(userText: string): BotReply {
  const t = (userText || "").toLowerCase();
  const isCommand =
    /post|文案|出 post|generate|建議書|proposal|內容|帖子|貼文|宣傳/.test(t);
  if (isCommand) {
    const title = "3 個理財貼士";
    const tagline = "香港人都要知";
    const points = [
      "自願醫保扣稅慳稅又保障",
      "危疾保障填補收入中斷",
      "儲蓄保底鎖定長線回報",
    ];
    const caption =
      "💡 香港人理財 3 步曲：\n1️⃣ 自願醫保扣稅慳稅又保障\n2️⃣ 危疾保障填補收入中斷\n3️⃣ 儲蓄保底鎖定長線回報\n\n有咩疑問？PM 我免費分析 👇\n#香港保險 #理財 #自願醫保";
    return {
      intent: "command",
      title,
      tagline,
      points,
      caption,
      replyText:
        "📝 幫你寫好咗一段 post 文案，撳下面 link 睇圖表版：\n\n" + caption,
    };
  }
  // query：假設一般保障需要
  const title = "你嘅保障缺口";
  const tagline = "3 分鐘免費分析";
  const points = [
    "醫療開支通脹快，要早啲鎖定",
    "家庭支柱最怕收入中斷",
    "退休儲備愈早開始愈輕鬆",
  ];
  const caption =
    "📊 初步分析你嘅保障需要：\n• 醫療開支通脹快，要早啲鎖定\n• 家庭支柱最怕收入中斷\n• 退休儲備愈早開始愈輕鬆\n\n想我幫你度身規劃？回覆幾句你嘅年齡／家庭狀況就得 🙌";
  return {
    intent: "query",
    title,
    tagline,
    points,
    caption,
    replyText:
      "👋 收到！我幫你初步分析咗 3 個重點（睇下面 link 圖表）。想更準確，回覆我：你年齡、家庭狀況、最擔心咩？我免費幫你度身規劃 🙌",
  };
}

function buildLink(r: BotReply): string {
  return encodeLink({
    mode: r.intent === "command" ? "post" : "sales",
    tpl: r.intent === "command" ? "default" : "info-blue",
    title: r.title,
    tagline: r.tagline,
    points: r.points.join("||"),
    caption: r.caption,
  });
}

function buildReply(r: BotReply): string {
  const link = buildLink(r);
  return `${r.replyText}\n\n📊 專屬圖表（撳入去 save）：\n${link}`;
}

// ---- 發送 WhatsApp 文字 ----
async function sendWhatsApp(to: string, text: string): Promise<void> {
  if (!WHATSAPP_TOKEN || !PHONE_ID) {
    console.warn("WHATSAPP_TOKEN / PHONE_ID 未設定，skip 發送");
    return;
  }
  try {
    const r = await fetch(
      `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { preview_url: true, body: text },
        }),
      },
    );
    if (!r.ok) {
      const err = await r.text();
      console.error("WhatsApp send fail:", r.status, err);
    }
  } catch (e) {
    console.error("WhatsApp send error:", e);
  }
}

// ---- Phase 2：直接 send 圖（經 HTML→image 服務） ----
async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) {
      console.error("render service fail:", r.status);
      return null;
    }
    const buf = await r.arrayBuffer();
    return new Uint8Array(buf);
  } catch (e) {
    console.error("fetch image error:", e);
    return null;
  }
}

// 上傳 bytes 去 WhatsApp 拎 media id
async function uploadWhatsAppMedia(
  bytes: Uint8Array,
  mime: string,
): Promise<string | null> {
  try {
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("file", new Blob([bytes], { type: mime }), "cover.png");
    const r = await fetch(
      `https://graph.facebook.com/v19.0/${PHONE_ID}/media`,
      {
        method: "POST",
        headers: { "Authorization": `Bearer ${WHATSAPP_TOKEN}` },
        body: form,
      },
    );
    if (!r.ok) {
      console.error("media upload fail:", r.status, await r.text());
      return null;
    }
    const j = await r.json();
    return j.id || null;
  } catch (e) {
    console.error("media upload error:", e);
    return null;
  }
}

async function sendWhatsAppImage(
  to: string,
  mediaId: string,
  caption: string,
): Promise<void> {
  try {
    const r = await fetch(
      `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "image",
          image: { id: mediaId, caption: caption.slice(0, 1024) },
        }),
      },
    );
    if (!r.ok) {
      const err = await r.text();
      console.error("WhatsApp image send fail:", r.status, err);
    }
  } catch (e) {
    console.error("WhatsApp image send error:", e);
  }
}

// ---- 主處理 ----
serve(async (req: Request) => {
  const url = new URL(req.url);

  // 1) Webhook 驗證（Meta 首次連接）
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge || "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // 2) 接收訊息
  if (req.method === "POST") {
    const body = await req.json().catch(() => null);
    const changes = body?.entry?.[0]?.changes?.[0]?.value;
    const messages: any[] = changes?.messages || [];
    for (const m of messages) {
      if (m.type !== "text") continue; // 暫只處理文字
      const from = m.from;
      const text = m.text?.body || "";
      if (!from) continue;
      const ai = (await callLLM(text)) || fallback(text);
      const link = buildLink(ai);

      // Phase 2：設咗 RENDER_SERVICE_URL 就直接 send 圖；失敗自動 fallback 返 send link
      if (RENDER_SERVICE_URL) {
        const imgUrl = `${RENDER_SERVICE_URL}?url=${encodeURIComponent(link)}`;
        const bytes = await fetchImageBytes(imgUrl);
        if (bytes) {
          const mediaId = await uploadWhatsAppMedia(bytes, "image/png");
          if (mediaId) {
            await sendWhatsAppImage(from, mediaId, ai.replyText);
            continue;
          }
        }
        console.warn("Phase 2 出圖失敗，fallback 返 send link");
      }

      const reply = buildReply(ai);
      await sendWhatsApp(from, reply);
    }
    return new Response("ok", { status: 200 });
  }

  return new Response("Method not allowed", { status: 405 });
});
