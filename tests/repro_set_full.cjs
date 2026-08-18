/* 最貼近真瀏覽器嘅 SET 渲染重現測試
 * - 用真 index.html DOM
 * - 將全部 <script src> 內聯（strip ?v=），按 browser 順序以 classic script 執行（共享 global 詞法環境）
 * - 自然觸發 DOMContentLoaded -> boot()
 * - 檢查 #setAgentList 有冇卡、有冇 error、auth/app 可見性
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = 'D:/work buddy/2026-07-09-20-49-28/agent-os-ai-deploy';

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// 將 <script src="X?v=N"></script> 換成內聯 <script>...</script>
const scriptFiles = [];
html = html.replace(/<script\s+src="([^"]+?)(?:\?v=[^"]*)?"><\/script>/g, (m, src) => {
  const rel = src;
  const abs = path.join(root, rel);
  let code = '';
  try { code = fs.readFileSync(abs, 'utf8'); }
  catch (e) { code = '/* LOAD FAIL: ' + rel + ' -> ' + e.message + ' */'; }
  scriptFiles.push(rel);
  return '<script>\n' + code + '\n</script>';
});

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.detail ? (e.detail.stack || e.detail) : e.message)));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'https://jacksonhui038.github.io/agent-os-ai/',
  virtualConsole: vc,
  beforeParse(win) {
    // 模擬「已登入」：seed 一個假 session 落 localStorage，等 boot() 走入 showApp+initApp 分支
    try {
      win.localStorage.setItem('agent_os_session', JSON.stringify({
        access_token: 'fake-token-for-test',
        refresh_token: 'fake-refresh',
        user: { email: 'test@agent-os.ai', id: 'test-id' }
      }));
    } catch (e) { errors.push('beforeParse seed: ' + e.message); }
  }
});
const { window } = dom;

// polyfills
window.fetch = () => Promise.reject(new Error('no-network-in-test'));
if (typeof window.AbortController === 'undefined') {
  window.AbortController = global.AbortController;
}

// 等 DOMContentLoaded 自然觸發 + boot 跑完
setTimeout(() => {
  const doc = window.document;
  const list = doc.getElementById('setAgentList');
  const authScreen = doc.getElementById('authScreen');
  const app = doc.querySelector('.app');
  const pageSet = doc.getElementById('page-set');

  console.log('=== 已 inline 嘅 script 數量:', scriptFiles.length, '===');
  console.log('APP_CONFIG.cloudEnabled =', window.APP_CONFIG ? window.APP_CONFIG.cloudEnabled : '(undefined)');
  console.log('Auth.isLoggedIn =', (window.Auth && typeof window.Auth.isLoggedIn === 'boolean') ? window.Auth.isLoggedIn : (window.Auth && window.Auth.isLoggedIn));
  console.log('window.SetModule 存在:', typeof window.SetModule);
  console.log('#authScreen display =', authScreen ? authScreen.style.display || '(空=預設可見)' : 'NULL');
  console.log('.app display =', app ? (app.style.display || '(空=預設可見)') : 'NULL');
  console.log('#page-set 存在:', !!pageSet);
  console.log('#setAgentList children =', list ? list.children.length : 'NULL');
  if (list && list.children.length) {
    console.log('第一張卡 name =', list.children[0].querySelector('.agent-name')?.textContent);
  }
  console.log('=== errors 數量:', errors.length, '===');
  errors.slice(0, 20).forEach(e => console.log('---', e));
  process.exit(0);
}, 800);
