// SET 功能回歸測試：SET router 開得到 + 一鍵切 LLM + 登入錯誤中文化 + Enter 綁定
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
const getCfg = () => JSON.parse(window.localStorage.getItem('set_llm_config') || '{}');

// ── 1. SET router：navigateTo('set') 要開到 page-set ──
window.navigateTo('set');
const pageSet = doc.getElementById('page-set');
ok(pageSet && pageSet.classList.contains('active'), 'SET：navigateTo("set") 令 page-set 顯示（修復 router 漏 set）');
const cards = doc.querySelectorAll('#setAgentList .agent-card').length;
ok(cards > 0, 'SET：agent list 渲染咗 ' + cards + ' 張卡片');
ok(doc.getElementById('pageTitle').textContent === 'SET 智能體', 'SET：標題顯示「SET 智能體」');
// 離開 SET 唔應該 crash
window.navigateTo('dashboard');
ok(doc.getElementById('page-dashboard').classList.contains('active'), 'SET：可以返去 dashboard 唔 crash');

// ── 2. 一鍵切 LLM ──
window.SetModule.quickSwitch('nvidia');
let cfg = getCfg();
ok(cfg.provider === 'openai' && /nvidia/.test(cfg.baseUrl || ''), '一鍵切：NVIDIA → openai + nvidia.com baseUrl');
window.SetModule.quickSwitch('openrouter');
cfg = getCfg();
ok(cfg.provider === 'openai' && /openrouter/.test(cfg.baseUrl || ''), '一鍵切：OpenRouter → openai + openrouter.ai baseUrl');
window.SetModule.quickSwitch('mock');
cfg = getCfg();
ok(cfg.provider === 'mock', '一鍵切：離線示範 → provider mock（清空 key）');

// ── 3. 登入錯誤中文化（紅 BAR 唔好再顯英文）──
ok(/Email 或密碼錯誤/.test(window.friendlyAuthMsg('Invalid login credentials')), '登入：invalid credentials → 中文「Email 或密碼錯誤」');
ok(/仲未確認/.test(window.friendlyAuthMsg('Email not confirmed')), '登入：email not confirmed → 中文「仲未確認」');
ok(/已經註冊/.test(window.friendlyAuthMsg('User already registered')), '登入：already registered → 中文');
ok(/網絡連唔到/.test(window.friendlyAuthMsg('Failed to fetch')), '登入：網絡錯誤 → 中文');

// ── 4. 登入 Enter 綁定 ──
const pw = doc.getElementById('authPw');
const em = doc.getElementById('authEmail');
ok(/authSignIn/.test(pw.getAttribute('onkeydown') || ''), '登入：密碼欄 Enter → 觸發 authSignIn');
ok(/authSignIn/.test(em.getAttribute('onkeydown') || ''), '登入：Email 欄 Enter → 觸發 authSignIn');

console.log('\n=== SET 功能回歸測試: ' + pass + ' passed, ' + fail + ' failed ===');
process.exit(fail > 0 ? 1 : 0);
