// SET 全能顧問 整合測試：SET AI 私人助理功能併入 SET全能顧問
// 驗證：(1) 只顯示一張 hero 卡「SET全能顧問」(assistant 卡已移除)
//       (2) 歡迎語同時包顧問知識 + 私人助理動作
//       (3) 動作指令→路由去對應模組（私人助理能力生效）
//       (4) 純知識指令→留喺顧問知識（唔會錯誤跳去 client/social）
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = process.cwd();
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/' });
const { window } = dom;
const vm = require('vm');
const ctx = dom.getInternalVMContext();
window.alert = () => {};
window.navigator.clipboard = { writeText: () => Promise.resolve() };
process.on('unhandledRejection', e => console.log('[unhandledRejection]', e && e.message));

const files = [
  'js/data/config.js', 'js/data/auth.js', 'js/data/cloudsync.js', 'js/data/storage.js',
  'js/data/templates.js', 'js/data/products.js', 'js/modules/social.js', 'js/modules/client.js',
  'js/modules/meeting.js', 'js/modules/followup.js', 'js/modules/proposal.js', 'js/modules/set.js', 'js/app.js'
];
vm.runInContext(fs.readFileSync(path.join(ROOT, files[0]), 'utf8'), ctx, { filename: files[0] });
vm.runInContext("APP_CONFIG.supabase.url=''; APP_CONFIG.supabase.anonKey='';", ctx);
for (let i = 1; i < files.length; i++) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, files[i]), 'utf8'), ctx, { filename: files[i] });
}
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };
const doc = window.document;

(async () => {
  // 離線模式
  window.localStorage.setItem('set_llm_config', JSON.stringify({ provider: 'mock', baseUrl: '', apiKey: '', model: '' }));

  // ── 1. SET 只顯示一張 hero 卡，名為 SET全能顧問 ──
  window.navigateTo('set');
  const cards = doc.querySelectorAll('#setAgentList .agent-card');
  ok(cards.length === 1, 'SET：淨顯示 1 張 hero 卡（assistant 卡已併入），實際 ' + cards.length + ' 張');
  const name = cards[0] ? cards[0].querySelector('.agent-name').textContent : '';
  ok(name === 'SET全能顧問', 'SET：該卡名為「SET全能顧問」（實際「' + name + '」）');

  // ── 2. 歡迎語同時包顧問知識 + 私人助理動作 ──
  cards[0].click(); // openChat('negotiation')
  const msgs = doc.getElementById('setChatMessages');
  const welcome = msgs ? msgs.textContent : '';
  ok(/六大範疇/.test(welcome), '歡迎語：包埋顧問知識（六大範疇）');
  ok(/AI 私人助理/.test(welcome), '歡迎語：包埋 AI 私人助理動作能力');

  // 追蹤 navigateTo / generateMultiPlatform 呼叫
  const navCalls = [];
  const origNav = window.navigateTo;
  window.navigateTo = (p) => { navCalls.push(p); };
  let genCalled = false;
  if (window.SocialModule) window.SocialModule.generateMultiPlatform = () => { genCalled = true; return Promise.resolve(); };

  const input = doc.getElementById('setMsgInput');
  const send = (txt) => {
    input.value = txt;
    input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  };

  // ── 3. 動作指令：出社交貼文 → 路由去社交引擎（私人助理能力）──
  navCalls.length = 0; genCalled = false;
  send('幫我出 3 平台社交貼文，主題自願醫保扣稅');
  await new Promise(r => setTimeout(r, 150));
  ok(genCalled || navCalls.includes('social'), '全能顧問：動作指令「出貼文」→ 路由去社交引擎（私人助理生效）');

  // ── 4. 知識指令：分析客戶底牌 → 留喺顧問知識，唔跳去 client/social ──
  navCalls.length = 0; genCalled = false;
  send('分析客戶底牌');
  await new Promise(r => setTimeout(r, 450)); // mock 回覆有 300ms 思考 delay
  ok(!genCalled && !navCalls.includes('client') && !navCalls.includes('social'),
     '全能顧問：知識指令「分析客戶底牌」→ 留喺顧問知識（唔錯誤跳去 client/social）');
  const after = doc.getElementById('setChatMessages').textContent;
  ok(/底牌|決策權限|預算/.test(after), '全能顧問：知識指令有返到顧問底牌分析內容');

  // 復原 navigateTo
  window.navigateTo = origNav;

  console.log('\n=== SET 全能顧問 整合測試: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail > 0 ? 1 : 0);
})();
