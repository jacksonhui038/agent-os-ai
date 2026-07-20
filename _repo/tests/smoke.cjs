/* Agent OS AI — 本機 smoke test（Windows / 相對路徑版）
 * 用 JSDOM 喺 Node 模擬瀏覽器，跑晒 6 個模組 + coverage-edit 回歸測試。
 * 用法：node tests/smoke.cjs
 */
const fs = require('fs');
const path = require('path');

// 自動搵 jsdom：先試 NODE_PATH，再試 managed node workspace 預設位置
function loadJSDOM() {
  const candidates = [
    () => require('jsdom'),
    () => require('C:/Users/kelvi/.workbuddy/binaries/node/workspace/node_modules/jsdom'),
    () => require('/Users/kelvi/.workbuddy/binaries/node/workspace/node_modules/jsdom'),
    () => require(process.env.AGENT_OS_NODE_MODULES + '/jsdom')
  ];
  for (const c of candidates) {
    try { return c().JSDOM; } catch (_) {}
  }
  console.error('找不到 jsdom。請用以下其一：\n  NODE_PATH=<node_modules 路徑> node tests/smoke.cjs\n  npm i -D jsdom');
  process.exit(1);
}
const JSDOM = loadJSDOM();

const ROOT = path.resolve(__dirname, '..'); // 指向 20260709/
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost:8000/' });
const { window } = dom;
const vm = require('vm');
const ctx = dom.getInternalVMContext();

// 模擬瀏覽器 API
window.alert = () => {};
window.navigator.clipboard = { writeText: () => Promise.resolve() };
window.fetch = () => Promise.reject(new Error('no network in test')); // 單機模式唔應該 call fetch

// 載入順序要同 index.html 一致（pptx bundle 好大，今次唔測 PPT）
const files = [
  'js/data/config.js',
  'js/data/auth.js',
  'js/data/cloudsync.js',
  'js/data/storage.js',
  'js/data/templates.js',
  'js/data/products.js',
  'js/modules/social.js',
  'js/modules/client.js',
  'js/modules/meeting.js',
  'js/modules/followup.js',
  'js/modules/proposal.js',
  'js/modules/set.js',
  'js/app.js'
];

// 先載入 config.js，再關閉雲端模式（用本地 LocalStorage 跑，唔使真 Supabase）
vm.runInContext(fs.readFileSync(path.join(ROOT, files[0]), 'utf8'), ctx, { filename: files[0] });
vm.runInContext("APP_CONFIG.supabase.url=''; APP_CONFIG.supabase.anonKey='';", ctx);

for (let i = 1; i < files.length; i++) {
  const f = files[i];
  try {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  } catch (e) {
    console.error('LOAD ERROR in', f, ':', e.message);
    process.exit(1);
  }
}

// JSDOM outside-only 模式下 readyState 可能仲係 loading，boot() 會等 DOMContentLoaded。
// 手動 dispatch 一次，強制跑 initApp（attach 晒所有 chip 監聽器）。已經跑過嘅話無副作用。
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

let pass = 0, fail = 0;
const ok = (cond, desc) => {
  if (cond) { pass++; console.log('  ✅', desc); }
  else { fail++; console.log('  ❌', desc); }
};
const setVal = (id, val) => { const el = window.document.getElementById(id); if (el) el.value = val; };
const clickChip = (sel) => { const el = window.document.querySelector(sel); if (el) el.click(); };
const check = (id) => {
  const el = window.document.getElementById(id);
  return el && el.innerHTML.trim().length > 0 && el.className.includes('filled');
};

(async () => {
  try {
    // 單機模式：登入頁隱藏，app 顯示
    ok(window.document.getElementById('authScreen').style.display === 'none', '單機模式：登入頁隱藏');
    ok(vm.runInContext('APP_CONFIG.cloudEnabled', ctx) === false, '單機模式：cloudEnabled=false');

    // ===== SOCIAL =====
    setVal('socialTopic', '自願醫保扣稅懶人包');
    setVal('socialPlatform', 'xhs-hk');
    window.generateSocialContent();
    ok(check('socialOutput'), 'Social：生成貼文 + 配圖 prompt');

    // ===== CLIENT（含 coverage）=====
    setVal('cName', '測試客戶A');
    setVal('cAge', '35');
    setVal('cJob', 'IT 經理');
    setVal('cIncome', '50000');
    setVal('cMarital', 'married');
    setVal('cKids', '1');
    clickChip('.cov-chip[data-val="company-med"]');
    window.analyzeClient();
    ok(check('clientOutput'), 'Client：分析保障缺口');
    window.saveClient();
    const clients = vm.runInContext('Storage.getClients()', ctx);
    ok(clients.length === 1 && clients[0].name === '測試客戶A', 'Client：儲存到 LocalStorage');
    ok(clients[0].existingRaw && clients[0].existingRaw.includes('公司醫療'), 'Client：coverage 正確儲存');

    // ===== 回歸測試：編輯客戶唔會清空 coverage / 唔會變副本（修復前會 fail）=====
    const cid = clients[0].id;
    window.loadClientForEdit(cid);
    const chipActive = window.document.querySelector('.cov-chip[data-val="company-med"]').classList.contains('active');
    ok(chipActive, 'Edit：載入後 coverage chip 顯示為 active');
    setVal('cName', '測試客戶A（改）');
    window.saveClient();
    const after = vm.runInContext(`Storage.getClient(${JSON.stringify(cid)})`, ctx);
    ok(after && after.name === '測試客戶A（改）', 'Edit：改名後 update 原客戶（唔開副本）');
    ok(after && after.existingRaw && after.existingRaw.includes('公司醫療'),
      'Edit：coverage 冇被清空（回歸重點）');
    ok(vm.runInContext('Storage.getClients()', ctx).length === 1, 'Edit：客戶數量維持 1（無副本）');

    // ===== MEETING =====
    window.MeetingModule.refreshClientSelects();
    setVal('meetClientSelect', after.id);
    window.generateMeetingPrep();
    ok(check('meetingOutput'), 'Meeting：生成 Flow + 反對處理');

    // ===== FOLLOWUP =====
    setVal('fuClient', '測試客戶A（改）');
    setVal('fuProduct', 'VHIS');
    window.generateFollowUp();
    ok(check('followupOutput'), 'FollowUp：生成 WhatsApp 訊息');

    // ===== PROPOSAL =====
    window.refreshPropClientSelects();
    setVal('propClientSelect', after.id);
    // 產品 chip 嘅 data-val 係產品 ID（唔係分類），故用 manulife-vhis / manulife-ci-pro
    clickChip('.prop-chip[data-val="manulife-vhis"]');
    clickChip('.prop-chip[data-val="manulife-ci-pro"]');
    window.generateProposal();
    ok(check('proposalOutput'), 'Proposal：生成建議書框架');

    // ===== HISTORY + STATS =====
    window.navigateTo('history');
    const hist = vm.runInContext('Storage.getHistory()', ctx);
    ok(hist.length >= 4, `History：記錄 ${hist.length} 條`);
    window.navigateTo('dashboard');
    ok(window.document.getElementById('statClients').textContent === '1', 'Dashboard：統計更新');

    // ===== IMPORT（還原備份）=====
    await runImportTest();
  } catch (e) {
    console.error('RUNTIME ERROR:', e.message, '\n', e.stack);
    fail++;
  }
  finish();
})();

// 模擬 importData：mock document.createElement('input') 揀檔案
function runImportTest() {
  return new Promise(resolve => {
    const backup = { clients: [{ id: 'imported-1', name: '匯入客', age: 50, existingRaw: ['人壽'] }], history: [] };
    const fakeFile = new window.File([JSON.stringify(backup)], 'b.json', { type: 'application/json' });
    const beforeCount = vm.runInContext('Storage.getClients()', ctx).length;

    const realCreate = window.document.createElement.bind(window.document);
    window.document.createElement = (tag) => {
      const el = realCreate(tag);
      if (tag === 'input') {
        Object.defineProperty(el, 'click', {
          value: function () {
            Object.defineProperty(el, 'files', { value: [fakeFile], configurable: true });
            if (el.onchange) el.onchange({ target: el });
          },
          configurable: true
        });
      }
      return el;
    };

    window.importData();

    // importData 係 async（FileReader），等一陣再 check
    setTimeout(() => {
      const afterImport = vm.runInContext('Storage.getClients()', ctx);
      ok(afterImport.some(c => c.id === 'imported-1'),
        `Import：合併咗匯入嘅客戶（${beforeCount} → ${afterImport.length}）`);
      // 復原 createElement
      window.document.createElement = realCreate;
      resolve();
    }, 250);
  });
}

function finish() {
  console.log(`\n=== 測試結果: ${pass} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
}
