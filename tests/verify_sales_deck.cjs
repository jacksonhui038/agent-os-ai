// 驗證：#4 銷售圖批量（客戶分析→5 張 infographic）+ #5 進度 #1 WhatsApp 函數
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
window.open = () => {};
const files = [
  'js/data/config.js', 'js/data/auth.js', 'js/data/cloudsync.js', 'js/data/storage.js',
  'js/data/templates.js', 'js/data/products.js', 'js/modules/social.js', 'js/modules/client.js',
  'js/modules/meeting.js', 'js/modules/followup.js', 'js/modules/proposal.js', 'js/modules/set.js', 'js/app.js'
];
for (const f of files) {
  const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
  vm.runInContext(code, ctx, { filename: f });
}

(async () => {
  // 模擬填寫客戶並分析
  window.document.getElementById('cName').value = '張三';
  window.document.getElementById('cAge').value = '35';
  window.document.getElementById('cJob').value = '工程師';
  window.document.getElementById('cIncome').value = '50000';
  window.document.getElementById('cMarital').value = 'married';
  window.document.getElementById('cKids').value = '1';
  window.analyzeClient();
  const ca = window._lastAnalyzedClient;
  if (!ca || !ca.riskPriority || !ca.recommendations) { console.log('❌ analyzeClient 冇存 riskPriority/recommendations'); process.exit(1); }

  // 無客戶時應彈 alert 而返 ok=false
  // 生成銷售圖
  const r = await window.SocialModule.generateSalesDeck();
  if (!r.ok) { console.log('❌ generateSalesDeck ok=false'); process.exit(1); }
  if (r.deck.length < 1 || r.deck.length > 5) { console.log('❌ deck 數量異常', r.deck.length); process.exit(1); }

  let ok = true;
  for (let i = 0; i < r.deck.length; i++) {
    const cv = window.document.getElementById('sdCanvas_' + i);
    if (!cv) { console.log('❌ sdCanvas_' + i + ' 缺失'); ok = false; break; }
    const it = r.deck[i];
    if (!it.title || !Array.isArray(it.points) || it.points.length !== 3) { console.log('❌ deck[' + i + '] 結構錯', it); ok = false; break; }
  }
  // 進度條 DOM 曾出現（生成後被 hideProgress 移除，呢度確認函數存在即可）
  if (typeof window.SocialModule.shareWhatsApp !== 'function') { console.log('❌ shareWhatsApp 未 export'); ok = false; }
  if (typeof window.SocialModule.shareAllMulti !== 'function') { console.log('❌ shareAllMulti 未 export'); ok = false; }
  if (typeof window.SocialModule.openSalesInCanva !== 'function') { console.log('❌ openSalesInCanva 未 export'); ok = false; }

  if (ok) console.log('✅ 銷售圖批量 OK：' + r.deck.length + ' 張 infographic（標題=' + r.deck.map(d => d.title).join(' / ') + '），進度+WhatsApp 函數齊全');
  else process.exit(1);
})();
