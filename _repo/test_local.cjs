const fs = require('fs');
const path = require('path');
const { JSDOM } = require('/Users/kelvin/.workbuddy/binaries/node/workspace/node_modules/jsdom');
const base = '/Users/kelvin/WorkBuddy/2026-07-08-15-01-48/agent-os';
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost:8000/' });
const { window } = dom;
const vm = require('vm');
const ctx = dom.getInternalVMContext();
window.alert = () => {};
window.fetch = () => Promise.reject(new Error('should not call fetch in local mode'));

const files = [
  'js/data/config.js','js/data/auth.js','js/data/cloudsync.js','js/data/storage.js',
  'js/data/templates.js','js/data/products.js','js/lib/pptxgen.bundle.js',
  'js/modules/social.js','js/modules/client.js','js/modules/meeting.js',
  'js/modules/followup.js','js/modules/proposal.js','js/app.js'
];
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), ctx, { filename: f }); }
  catch (e) { console.error('LOAD FAIL', f, e.message); process.exit(1); }
}

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅', m); } else { fail++; console.log('  ❌', m); } };

// 單機模式：cloudEnabled 應為 false（config 留空）
ok(vm.runInContext('APP_CONFIG.cloudEnabled', ctx) === false, '單機模式 cloudEnabled=false');

// boot 已經跑（DOMContentLoaded 唔會自動觸發 outside-only，手動觸發）
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

// authScreen 應隱藏，app 顯示
ok(window.document.getElementById('authScreen').style.display === 'none', '登入頁隱藏（單機模式）');
ok(window.document.querySelector('.app').style.display !== 'none' || window.document.querySelector('.app').style.display === '', 'app 顯示');

// 客戶儲存正常
window.document.getElementById('cName').value = '測試客';
window.document.getElementById('cAge').value = '38';
window.analyzeClient();
window.saveClient();
const clients = JSON.parse(window.localStorage.getItem('agent_os_clients') || '[]');
ok(clients.length === 1 && clients[0].name === '測試客', '客戶儲存到 LocalStorage ('+clients.length+')');

// history 寫入
ok((JSON.parse(window.localStorage.getItem('agent_os_history')||'[]')).length >= 1, '歷史記錄寫入');

// Storage.available 在 localhost 應 true
ok(vm.runInContext('Storage.available()', ctx) === true, 'Storage.available()=true (localhost)');

console.log(`\n結果: ${pass} 過 / ${fail} 失`);
process.exit(fail ? 1 : 0);
