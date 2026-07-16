// 驗證小紅書強化 A–F：人設 / 爆款拆解洗稿 / 合規 / 標籤 / 批量 / 多平台
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('C:/Users/kelvi/.workbuddy/binaries/node/workspace/node_modules/jsdom');

const ROOT = process.cwd();
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/', pretendToBeVisual: true });
const { window } = dom;
const vm = require('vm');
const ctx = dom.getInternalVMContext();
window.alert = () => {};
window.navigator.clipboard = { writeText: () => Promise.resolve() };
const files = [
  'js/data/config.js', 'js/data/auth.js', 'js/data/cloudsync.js', 'js/data/storage.js',
  'js/data/templates.js', 'js/data/products.js', 'js/modules/social.js', 'js/modules/client.js',
  'js/modules/meeting.js', 'js/modules/followup.js', 'js/modules/proposal.js', 'js/modules/set.js', 'js/app.js'
];
for (const f of files) {
  const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
  vm.runInContext(code, ctx, { filename: f });
}

let pass = 0, fail = 0;
function ok(cond, name, extra) { if (cond) { pass++; console.log('✅', name); } else { fail++; console.log('❌', name, extra !== undefined ? JSON.stringify(extra) : ''); } }

(async () => {
  const S = window.SocialModule;
  const T = S.__test;
  // 初始化模組（渲染面板）
  S.init();

  // ---- A 人設定位 ----
  ok(!!window.document.getElementById('personaPanel').innerHTML.trim(), 'A: 人設面板已渲染');
  T.setPersona({ enabled: true, nick: 'Jackson｜危疾規劃師', niche: '專攻家庭醫療＋危疾', tone: 'friendly', tagline: '保障唔使貴，啱先最緊要', cta: '留言「保障」免費檢查' });
  const sig = T.personaSignature();
  ok(sig.includes('Jackson') && sig.includes('保障唔使貴'), 'A: personaSignature 含稱呼＋slogan', sig);

  // ---- D 標籤優化 ----
  const tagsXhs = T.suggestTags('危疾保障常見誤解', 'xhs');
  const tagsIg = T.suggestTags('危疾保障常見誤解', 'ig');
  ok(tagsXhs.split(' ').length >= 6, 'D: 小紅書標籤 >=6 個', tagsXhs);
  ok(tagsXhs.includes('#危疾保險'), 'D: 標籤命中危疾主題', tagsXhs);
  ok(tagsIg.split(' ').length <= 5, 'D: IG 標籤 <=5 個', tagsIg);

  // ---- C 合規審查 ----
  const hitsBad = T.checkCompliance('本產品保證回報，零風險，係全港最好嘅危疾險，必賠！');
  ok(hitsBad.length >= 3, 'C: 命中多類違規字眼', hitsBad.map(h => h.msg));
  const hasHigh = hitsBad.some(h => h.level === 'high');
  ok(hasHigh, 'C: 標記到高風險字眼');
  const hitsClean = T.checkCompliance('危疾保障有唔同計劃，可以按預算同需要揀，歡迎了解。');
  ok(hitsClean.length === 0, 'C: 乾淨文案 0 命中', hitsClean);

  // ---- B 爆款拆解 + 洗稿 ----
  const viralRaw = '千祈唔好咁買危疾險！\n\n1️⃣ 誤解一：有醫保就夠\n2️⃣ 誤解二：後生唔使急\n3️⃣ 誤解三：一份用到老\n\n💡 正確做法：分階段配置\n\n👇 留言「危疾」我幫你檢查\n\n#危疾保險 #香港保險 #理財';
  const parsed = T.parseViral(viralRaw);
  ok(parsed.hook.includes('千祈唔好'), 'B: 拆解到 hook', parsed.hook);
  ok(parsed.points.length >= 3, 'B: 拆解到 >=3 個要點', parsed.points.length);
  ok(parsed.tags.length >= 3, 'B: 拆解到標籤', parsed.tags.length);
  ok(parsed.ctas.length >= 1, 'B: 拆解到 CTA');
  const rewrite = T.rewriteViralText(viralRaw);
  ok(typeof rewrite === 'string' && rewrite.length > 50, 'B: 洗稿產出文案', rewrite ? rewrite.length : 0);
  ok(rewrite.includes('Jackson') || rewrite.includes('保障唔使貴'), 'B: 洗稿含人設簽名');

  // ---- E 批量生成一週內容 ----
  window.document.getElementById('socialTopic').value = '危疾保障';
  const batch = await S.generateWeekBatch();
  ok(batch && batch.ok && batch.count === 5, 'E: 批量出 5 篇', batch);
  const batchCards = window.document.querySelectorAll('#batchOut .mp-card');
  ok(batchCards.length === 5, 'E: 批量渲染 5 張卡', batchCards.length);
  const batchCap0 = window.document.getElementById('batchCap_0');
  ok(batchCap0 && batchCap0.textContent.includes('Jackson') , 'E: 批量文案含人設簽名');
  const batchTopics = [];
  for (let i = 0; i < 5; i++) {
    const titleEl = batchCards[i].querySelector('.mp-card-title');
    if (titleEl) batchTopics.push(titleEl.textContent.trim());
  }
  ok(new Set(batchTopics).size === 5, 'E: 5 篇主題全部不同', batchTopics);
  const batchCaps = [];
  for (let i = 0; i < 5; i++) {
    const cap = window.document.getElementById('batchCap_' + i);
    if (cap) batchCaps.push(cap.textContent.trim());
  }
  ok(new Set(batchCaps).size === 5, 'E: 5 篇文案內容全部不同', batchCaps.map(c => c.slice(0, 40)));
  ok(batchCaps.every(c => c.length > 200), 'E: 每篇文案都夠詳細 (>200 字)', batchCaps.map(c => c.length));
  const detailWords = ['一筆過', '年薪', '醫療保', '確診', '保額', 'HK$'];
  ok(batchCaps.some(c => detailWords.some(w => c.includes(w))), 'E: 文案含實質保險知識點', batchCaps.map(c => c.slice(0, 24)));
  // 知識庫直接驗證
  const det = T.generateDetailedContent('危疾保障常見誤解', '常見誤解', 'professional', 'expert');
  ok(det.canvasPoints.length >= 3 && det.capPoints.length >= 3, 'E: 知識庫產生多角度實質內容', det.canvasPoints);
  ok(det.capPoints[0].includes('：'), 'E: 知識庫內容含「標題：解釋」');
  ok(T.detectDomain('自願醫保扣稅') === 'vhis' && T.detectDomain('危疾保障') === 'ci', 'E: 主題領域偵測正確', [T.detectDomain('自願醫保扣稅'), T.detectDomain('危疾保障')]);
  // 衍生主題邏輯：由單一主題自動出 5 個角度
  const oneTopic5 = T.expandTopicsFromSeed('自願醫保扣稅懶人包', 5);
  ok(oneTopic5.length === 5, 'E: 單一主題衍生 5 個角度');
  ok(new Set(oneTopic5).size === 5, 'E: 衍生角度全部不同', oneTopic5);
  ok(oneTopic5[0] === '自願醫保扣稅懶人包', 'E: 第一角度保留懶人包', oneTopic5[0]);
  ok(T.normalizeTopicSeed('自願醫保扣稅懶人包') === '自願醫保扣稅', 'E: 會去掉重複角度後綴');

  // ---- F 擴展多平台 ----
  const wechat = T.buildExtraCaption('危疾保障', 'wechat', 'professional', 'expert');
  const wa = T.buildExtraCaption('危疾保障', 'wa', 'professional', 'expert');
  ok(wechat.length > wa.length, 'F: 微信朋友圈比 WhatsApp Status 長', [wechat.length, wa.length]);
  window.document.getElementById('socialTopic').value = '危疾保障';
  const okExtra = S.appendExtraPlatforms('危疾保障');
  const exCards = window.document.querySelectorAll('#mpExtraOut .mp-card, #socialOutput .mp-card');
  ok(okExtra === true, 'F: appendExtraPlatforms 執行成功');
  ok(T.EXTRA_PLATFORMS.length === 5, 'F: 5 個額外平台', T.EXTRA_PLATFORMS.length);

  // ---- 整合：generateMultiPlatform 帶人設簽名 ----
  window.document.getElementById('socialTopic').value = '自願醫保扣稅懶人包';
  const mp = await S.generateMultiPlatform({ topic: '自願醫保扣稅懶人包' });
  ok(mp.ok, '整合: multi 平台生成成功');
  const igCap = window.document.getElementById('mpCap_ig');
  ok(igCap && igCap.textContent.includes('Jackson'), '整合: multi caption 帶人設簽名');

  console.log(`\n=== ${pass} passed / ${fail} failed ===`);
  if (fail) process.exit(1);
})();
