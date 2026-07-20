// 驗證：langToggle 簡中雙版即時重渲染 caption（繁→簡）
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

(async () => {
  window.document.getElementById('socialTopic').value = '自願醫保扣稅懶人包';
  await window.SocialModule.generateMultiPlatform({ topic: '自願醫保扣稅懶人包', audience: 'all' });

  const igBefore = window.document.getElementById('mpCap_ig').textContent;
  const xhsBefore = window.document.getElementById('mpCap_xhs').textContent;
  const hasTrad = /保險|留言|帳戶|資訊/.test(igBefore + xhsBefore);
  if (!hasTrad) { console.log('❌ 生成前應為繁中'); process.exit(1); }

  // 模擬撳「簡中」掣
  window.SocialModule.toggleLang();
  const igAfter = window.document.getElementById('mpCap_ig').textContent;
  const xhsAfter = window.document.getElementById('mpCap_xhs').textContent;
  const dyAfter = window.document.getElementById('mpCap_dy').textContent;
  const thAfter = window.document.getElementById('mpCap_th').textContent;
  const fbAfter = window.document.getElementById('mpCap_fb').textContent;

  const all = igAfter + xhsAfter + dyAfter + thAfter + fbAfter;
  const stillTrad = /保險|留言|帳戶|資訊|歡迎|筆記/.test(all);
  const gotSimp = /保险|评论|账户|信息|欢迎|笔记/.test(all);

  let ok = true;
  if (stillTrad) { console.log('❌ 切簡中後仍有繁中字：', all.slice(0, 80)); ok = false; }
  if (!gotSimp) { console.log('❌ 切簡中後無簡中字'); ok = false; }
  if (window.document.getElementById('langToggle').textContent.indexOf('內地簡中') < 0) { console.log('❌ 掣文字未切換'); ok = false; }
  if (ok) console.log('✅ langToggle 簡中雙版 OK：全部平台 caption 即時轉簡中，掣文字=' + window.document.getElementById('langToggle').textContent);
  else process.exit(1);
})();
