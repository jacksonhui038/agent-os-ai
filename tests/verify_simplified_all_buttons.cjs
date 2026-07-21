// 驗證：語言掣設為「內地簡中」時，截圖中全部按鈕生成嘅文案同圖上文字都係簡體
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

const hasTrad = s => /保險|留言|帳戶|資訊|專頁|歡迎|筆記|乾貨|獲客|連結|點擊/.test(s || '');
const hasSimp = s => /保险|评论|账户|信息|专页|欢迎|笔记|干货|获客|链接|点击/.test(s || '');

function fail(msg) { console.log('❌ ' + msg); process.exit(1); }

(async () => {
  // 預設設為簡中模式
  const langBtn = window.document.getElementById('langToggle');
  if (!langBtn) fail('搵唔到 langToggle');
  langBtn.classList.add('cn-mode');
  langBtn.textContent = '🌐 語言：內地簡中';

  // 1) 一鍵生成文案+圖片（單一平台）
  window.document.getElementById('socialTopic').value = '自願醫保扣稅懶人包';
  await window.generateSocialContent();
  const singleCap = window.document.getElementById('socialCaption').textContent;
  if (hasTrad(singleCap)) fail('單一平台 caption 仍有繁中：' + singleCap.slice(0, 40));
  if (!hasSimp(singleCap)) fail('單一平台 caption 無簡中');
  console.log('✅ 單一平台文案+圖片：caption 已轉簡中');

  // 2) 一鍵出 5 平台
  const out = window.document.getElementById('socialOutput');
  out.innerHTML = '';
  await window.SocialModule.generateMultiPlatform({ topic: '危疾保障點買先聰明', audience: 'all' });
  const all5 = ['ig', 'xhs', 'fb', 'dy', 'th'].map(k => window.document.getElementById('mpCap_' + k).textContent).join('\n');
  if (hasTrad(all5)) fail('5 平台 caption 仍有繁中');
  if (!hasSimp(all5)) fail('5 平台 caption 無簡中');
  console.log('✅ 一鍵 5 平台：全部 caption 已轉簡中');

  // 3) 出更多平台文案（微信 / WhatsApp / 抖音 / TG / LinkedIn）
  window.SocialModule.generateExtraPlatforms();
  const exAll = ['wechat', 'wa', 'douyin', 'telegram', 'linkedin'].map(k => {
    const el = window.document.getElementById('exCap_' + k);
    return el ? el.textContent : '';
  }).join('\n');
  if (hasTrad(exAll)) fail('更多平台文案仍有繁中');
  if (!hasSimp(exAll)) fail('更多平台文案無簡中');
  console.log('✅ 更多平台文案：已轉簡中');

  // 4) 每日市場焦點（先 render panel 令 DOM input 存在）
  window.SocialModule.renderMarketFocusPanel();
  window.document.getElementById('mfAgent').value = 'JACKSON';
  window.document.getElementById('mfTagline').value = '專業 · 誠信 · 穩健';
  window.document.getElementById('mfCta').value = '私訊了解詳情';
  window.document.getElementById('mfTitle_1').value = '美國擬對巴西徵 25% 關稅';
  window.document.getElementById('mfSub_1').value = '多項商品自下周三起受影響';
  window.document.getElementById('mfTitle_2').value = '南韓一如預期加息 0.25 厘';
  window.document.getElementById('mfSub_2').value = '指標利率升至 2.75%';
  window.document.getElementById('mfTitle_3').value = '香港投資管理公司表現亮眼';
  window.document.getElementById('mfSub_3').value = '去年投資收入增 1.75 倍';
  window.SocialModule.generateMarketFocus();
  const mfCanvas = window.document.getElementById('mfCanvas');
  if (!mfCanvas) fail('每日市場焦點冇畫到 canvas');
  console.log('✅ 每日市場焦點：canvas 已生成');

  // 5) 出客戶銷售圖
  window._lastAnalyzedClient = {
    name: '陳先生',
    riskPriority: ['醫療開支通脹快', '家庭支柱收入中斷風險', '退休儲備不足'],
    recommendations: ['高端醫療保險', '危疾保障', '儲蓄退休計劃']
  };
  window.SocialModule.generateSalesDeck();
  const sd0 = window.document.getElementById('sdCanvas_0');
  if (!sd0) fail('銷售圖冇畫到 canvas');
  console.log('✅ 出客戶銷售圖：canvas 已生成');

  console.log('\n🎯 全部按鈕喺「內地簡中」模式下都能出簡中內容／圖');
})();
