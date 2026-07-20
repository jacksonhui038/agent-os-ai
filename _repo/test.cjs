const fs = require('fs');
const path = require('path');
const { JSDOM } = require('/Users/kelvin/.workbuddy/binaries/node/workspace/node_modules/jsdom');

const base = '/Users/kelvin/WorkBuddy/2026-07-08-15-01-48/agent-os';
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost:8000/' });
const { window } = dom;
global.window = window;
global.document = window.document;
global.navigator = window.navigator;
global.alert = () => {};
global.localStorage = window.localStorage;

// Mock clipboard
window.navigator.clipboard = { writeText: () => Promise.resolve() };

// Load JS files in order
const files = [
  'js/data/storage.js',
  'js/data/templates.js',
  'js/modules/social.js',
  'js/modules/client.js',
  'js/modules/meeting.js',
  'js/modules/followup.js',
  'js/modules/proposal.js',
  'js/app.js'
];

const vm = require('vm');
const ctx = dom.getInternalVMContext();
// Provide alert via jsdom
window.alert = window.alert || (() => {});
for (const f of files) {
  const code = fs.readFileSync(path.join(base, f), 'utf8');
  try {
    vm.runInContext(code, ctx, { filename: f });
  } catch (e) {
    console.error('LOAD ERROR in', f, ':', e.message);
    process.exit(1);
  }
}
// Expose Storage to test scope (it was defined inside vm context as a const, not on window)
const Storage = vm.runInContext('Storage', ctx);
global.Storage = Storage;

// Ensure app init runs (DOMContentLoaded may not fire under manual vm execution)
if (window.document.readyState === 'loading') {
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
}

function setVal(id, val) { const el = window.document.getElementById(id); if (el) el.value = val; }
function clickChip(sel) { const el = window.document.querySelector(sel); if (el) el.click(); }
function check(id, desc) {
  const el = window.document.getElementById(id);
  const ok = el && el.innerHTML.trim().length > 0 && el.className.includes('filled');
  console.log(ok ? `✅ ${desc}` : `❌ ${desc} (empty)`);
  return ok;
}

let pass = 0, fail = 0;
function assert(cond, desc) { if (cond) { pass++; console.log('✅ ' + desc); } else { fail++; console.log('❌ ' + desc); } }

try {
  // ===== SOCIAL =====
  setVal('socialTopic', '自願醫保扣稅懶人包');
  setVal('socialPlatform', 'xhs-hk');
  window.generateSocialContent();
  assert(check('socialOutput', '社交內容生成'), 'Social: 生成貼文+配圖 prompt');

  // ===== CLIENT =====
  setVal('cName', '測試客戶A');
  setVal('cAge', '35');
  setVal('cJob', 'IT 經理');
  setVal('cIncome', '50000');
  setVal('cMarital', 'married');
  setVal('cKids', '1');
  clickChip('.cov-chip[data-val="company-med"]');
  window.analyzeClient();
  assert(check('clientOutput', '客戶分析'), 'Client: 分析保障缺口');
  window.saveClient();
  const clients = Storage.getClients();
  assert(clients.length === 1 && clients[0].name === '測試客戶A', 'Client: 儲存到 localStorage');

  // ===== MEETING =====
  window.MeetingModule.refreshClientSelects();
  setVal('meetClientSelect', clients[0].id);
  window.generateMeetingPrep();
  assert(check('meetingOutput', '見客準備'), 'Meeting: 生成 Flow+反對處理');

  // ===== FOLLOWUP =====
  setVal('fuClient', '測試客戶A');
  setVal('fuProduct', 'VHIS');
  window.generateFollowUp();
  assert(check('followupOutput', 'Follow-Up'), 'FollowUp: 生成 WhatsApp 訊息');

  // ===== PROPOSAL =====
  window.refreshPropClientSelects();
  setVal('propClientSelect', clients[0].id);
  clickChip('.prop-chip[data-val="vhis"]');
  clickChip('.prop-chip[data-val="ci"]');
  window.generateProposal();
  assert(check('proposalOutput', 'Proposal'), 'Proposal: 生成建議書框架');

  // ===== HISTORY =====
  navigateTo('history');
  const hist = window.Storage.getHistory();
  assert(hist.length >= 4, `History: 記錄 ${hist.length} 條`);

  // ===== STATS =====
  navigateTo('dashboard');
  assert(window.document.getElementById('statClients').textContent === '1', 'Dashboard: 統計更新');

} catch (e) {
  console.error('RUNTIME ERROR:', e.message, '\n', e.stack);
  fail++;
}

console.log(`\n=== 測試結果: ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
