// 快速驗證：SocialModule.generateMultiPlatform 出 3 平台
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
// canvas getContext 喺 JSDOM 返 null → renderCover 會 early return，唔影響邏輯驗證
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
  window.document.getElementById('socialTopic').value = '自願醫保扣稅懶人包';
  const r = await window.SocialModule.generateMultiPlatform({ topic: '自願醫保扣稅懶人包', audience: 'all' });
  const out = window.document.getElementById('socialOutput');
  const canvases = out.querySelectorAll('canvas');
  const caps = ['mpCap_ig', 'mpCap_xhs', 'mpCap_fb'].map(id => window.document.getElementById(id));
  let ok = true;
  if (!r.ok) { console.log('❌ generateMultiPlatform 返 ok=false'); ok = false; }
  if (canvases.length !== 3) { console.log('❌ canvas 數目 =', canvases.length, '(期望 3)'); ok = false; }
  caps.forEach((c, i) => { if (!c || !c.textContent.trim()) { console.log('❌ caption', i, '空'); ok = false; } });
  // 平台 caption 長短應有分別（xhs 最長）
  const len = caps.map(c => c.textContent.length);
  if (!(len[1] >= len[0] && len[1] >= len[2])) { console.log('❌ 平台 caption 長短關係唔對', len); ok = false; }
  if (ok) console.log('✅ generateMultiPlatform OK：3 canvas + 3 caption，xhs 最長', len);
  else process.exit(1);
})();
