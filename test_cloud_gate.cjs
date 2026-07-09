const fs = require('fs'), path = require('path');
const { JSDOM } = require('/Users/kelvin/.workbuddy/binaries/node/workspace/node_modules/jsdom');
const base = '/Users/kelvin/WorkBuddy/2026-07-08-15-01-48/agent-os';
const dom = new JSDOM(fs.readFileSync(path.join(base,'index.html'),'utf8'), { runScripts:'outside-only', url:'http://localhost:8000/' });
const { window } = dom; const vm = require('vm'); const ctx = dom.getInternalVMContext();
window.alert = ()=>{}; let fetched=false; window.fetch = ()=>{ fetched=true; return Promise.reject(new Error('no net')); };
const files=['js/data/config.js','js/data/auth.js','js/data/cloudsync.js','js/data/storage.js','js/data/templates.js','js/data/products.js','js/lib/pptxgen.bundle.js','js/modules/social.js','js/modules/client.js','js/modules/meeting.js','js/modules/followup.js','js/modules/proposal.js','js/app.js'];
for(const f of files){ vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'), ctx, {filename:f}); }
// 模擬填咗 Supabase key，但未登入
vm.runInContext("APP_CONFIG.supabase.url='https://demo.supabase.co'; APP_CONFIG.supabase.anonKey='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';", ctx);
console.log('cloudEnabled =', vm.runInContext('APP_CONFIG.cloudEnabled', ctx));
vm.runInContext('_appStarted=false; boot();', ctx);
const authShown = window.document.getElementById('authScreen').style.display === 'flex';
const appHidden = window.document.querySelector('.app').style.display === 'none';
console.log(authShown ? '  ✅ 未登入→顯示登入頁' : '  ❌ 登入頁冇顯示');
console.log(appHidden ? '  ✅ app 隱藏' : '  ❌ app 未隱藏');
console.log(!fetched ? '  ✅ 未登入冇 call fetch（安全）' : '  ❌ 未登入就 call 咗 fetch');
process.exit((authShown && appHidden && !fetched)?0:1);
