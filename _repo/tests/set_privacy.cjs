// SET 私隱守護回歸測試：PII 遮蔽 + 敏感模式強制離線（唔出雲端）
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
// 直接喺 JSDOM realm 落 fetch spy（window.fetch 唔會被 vm 內裸 fetch 引用到）
vm.runInContext('fetch = function(){ globalThis.__fc = (globalThis.__fc||0)+1; return Promise.reject(new Error("blocked")); };', ctx);
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };
const delay = (ms) => new Promise(r => setTimeout(r, ms));
const fetchCount = () => vm.runInContext('globalThis.__fc||0', ctx);
const setFetch = (n) => vm.runInContext('globalThis.__fc=' + n, ctx);
const doc = window.document;
const bubbles = () => doc.getElementById('setChatMessages').querySelectorAll('.msg-bubble').length;
const lastBotText = () => {
  const msgs = doc.getElementById('setChatMessages');
  const b = msgs.querySelectorAll('.msg-bubble');
  return b.length ? b[b.length - 1].textContent : '';
};

(async () => {
  // ── 1. 一鍵遮蔽 PII ──
  doc.getElementById('setMsgInput').value = '客戶陳先生 身份證 A1234567 電話 91234567 確診糖尿病 電郵 a@b.com';
  window.SetModule.maskInput();
  const masked = doc.getElementById('setMsgInput').value;
  ok(masked.includes('[客戶]'), '遮蔽：姓名（陳先生）→ [客戶]');
  ok(masked.includes('[身份證號碼]'), '遮蔽：身份證 A1234567 → [身份證號碼]');
  ok(masked.includes('[電話號碼]'), '遮蔽：電話 91234567 → [電話號碼]');
  ok(masked.includes('[健康資料]'), '遮蔽：糖尿病 → [健康資料]');
  ok(masked.includes('[電郵]'), '遮蔽：電郵 → [電郵]');
  ok(!masked.includes('陳先生') && !masked.includes('A1234567') && !masked.includes('91234567') && !masked.includes('糖尿病') && !masked.includes('a@b.com'), '遮蔽：原文敏感資料已全部移除');

  // ── 2. 敏感模式：開啟 → 強制離線，唔 call 雲端 LLM ──
  window.localStorage.setItem('set_privacy_mode', 'on');
  setFetch(0);
  doc.querySelector('#setAgentList .agent-card').click();   // 開 chat，設定 currentAgent
  console.log('[debug] after openChat bubbles =', bubbles());
  doc.getElementById('setMsgInput').value = '幫我寫段開 case 話術';
  window.SetModule.sendMessage();
  await delay(600);
  console.log('[debug] after 1st send bubbles =', bubbles(), '| fetch =', fetchCount());
  ok(fetchCount() === 0, '敏感模式：開啟後 sendMessage 冪呼叫雲端 LLM（fetch 次數=' + fetchCount() + '）');
  ok(/私隱守護/.test(doc.getElementById('setStatusDot').textContent), '敏感模式：狀態列顯示「私隱守護開啟」');
  ok(!/真 LLM 呼叫失敗/.test(lastBotText()), '敏感模式：回覆來自離線 mock（無雲端嘗試）');

  // ── 3. 對照：關閉敏感模式，provider=openai 但 key 空 → pre-check 截住出友好提示 ──
  // （shared-key 功能改咗 APP_CONFIG.llm.provider 預設為 'shared'，呢度強制 openai 嚟驗證 openai 空 key pre-check）
  window.localStorage.setItem('set_privacy_mode', 'off');
  vm.runInContext("APP_CONFIG.llm.provider='openai';", ctx);
  window.localStorage.setItem('set_llm_config', JSON.stringify({ provider:'openai', baseUrl:'https://api.openai.com/v1', apiKey:'', model:'gpt-4o-mini' }));
  setFetch(0);
  doc.getElementById('setMsgInput').value = '幫我寫段開 case 話術';
  window.SetModule.sendMessage();
  await delay(800);
  console.log('[debug] after 2nd send bubbles =', bubbles(), '| fetch =', fetchCount());
  ok(fetchCount() === 0, '對照：關閉敏感模式，provider=openai 但 key 空 → pre-check 截住冇 call API（fetch 次數=' + fetchCount() + '）');
  ok(/仲未填 API Key/.test(lastBotText()), '對照：出現「仲未填 API Key」友好提示 → pre-check 生效');

  console.log('\n=== SET 私隱測試: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail > 0 ? 1 : 0);
})();
