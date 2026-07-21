// Agent OS AI — Render Service (Phase 2)
// 將 render.html（含 Canvas 圖表）經 headless Chrome 轉成 PNG，等 WhatsApp Bot 直接 send 圖。
// 部署：Railway / Render / Fly.io / 任何 Node 環境；設 RENDER_SERVICE_URL 去 Supabase secret。
import express from "express";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;
// 只准截圖白名單 host（防 SSRF），預設我哋嘅 GitHub Pages
const ALLOWED = (process.env.ALLOWED_HOST ||
  "jacksonhui038.github.io")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.get("/render", async (req, res) => {
  const url = req.query.url;
  if (!url || typeof url !== "string") {
    res.status(400).send("missing url");
    return;
  }
  let host = "";
  try {
    host = new URL(url).host;
  } catch {
    res.status(400).send("bad url");
    return;
  }
  if (!ALLOWED.includes(host)) {
    res.status(403).send("host not allowed: " + host);
    return;
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    // 視口唔重要，因為我哋直接拎 canvas.toDataURL（原生 1080×1350）
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    // 等 render.html 個 canvas 畫好（window.__coverReady = true）
    await page.waitForFunction("window.__coverReady === true", {
      timeout: 15000,
    });
    const dataUrl = await page.evaluate(() =>
      document.getElementById("cv").toDataURL("image/png")
    );
    const b64 = dataUrl.split(",")[1];
    if (!b64) {
      res.status(500).send("canvas empty");
      return;
    }
    const buf = Buffer.from(b64, "base64");
    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "no-store");
    res.send(buf);
  } catch (e) {
    console.error("render error:", e);
    res.status(500).send("render error: " + e.message);
  } finally {
    if (browser) await browser.close();
  }
});

app.get("/health", (_req, res) => res.send("ok"));

app.listen(PORT, () => console.log("render-service listening on " + PORT));
