// Headless debug v2: concatenate all app scripts into ONE eval so top-level const/let
// bindings persist (mimics real <script src> classic-script global scope).
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const htmlNoScripts = html.replace(/<script src="[^"]*"><\/script>/g, '');

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.detail || e.message || e)));

const dom = new JSDOM(htmlNoScripts, {
  runScripts: 'outside-only',
  virtualConsole: vc,
  url: 'https://jacksonhui038.github.io/agent-os-ai/'
});
const { window } = dom;
const { document } = window;

const order = [
  'js/data/config.js',
  'js/data/auth.js',
  'js/data/cloudsync.js',
  'js/data/storage.js',
  'js/data/templates.js',
  'js/data/products.js',
  'js/lib/pptxgen.bundle.js',
  'js/modules/social.js',
  'js/modules/client.js',
  'js/modules/meeting.js',
  'js/modules/followup.js',
  'js/modules/proposal.js',
  'js/modules/set.js',
  'js/app.js'
];

let combined = '';
for (const f of order) combined += '\n;//=== ' + f + ' ===\n' + fs.readFileSync(path.join(ROOT, f), 'utf8');

// Probe: is custom Storage available after load? Does initApp throw?
combined += `
;window.__probe = (function(){
  const out = {};
  out.typeofStorage = (typeof Storage);
  out.storageHasAvailable = (typeof Storage !== 'undefined' && typeof Storage.available === 'function');
  out.setModuleType = (typeof SetModule);
  try { initApp(); out.initApp = 'ok'; }
  catch(e){ out.initApp = 'THREW: ' + e.message; }
  return out;
})();
`;

try {
  window.eval(combined);
} catch (e) {
  errors.push('eval-combined: ' + e.message);
}

const probe = window.__probe || {};
console.log('--- probe ---');
console.log('typeof Storage:', probe.typeofStorage);
console.log('Storage.available is function:', probe.storageHasAvailable);
console.log('typeof SetModule:', probe.setModuleType);
console.log('initApp:', probe.initApp);

// Inspect SET page after init
const appEl = document.querySelector('.app');
if (appEl) appEl.style.display = 'block';
const authEl = document.getElementById('authScreen');
if (authEl) authEl.style.display = 'none';

const list = document.getElementById('setAgentList');
console.log('--- SET page ---');
console.log('setAgentList present:', !!list);
console.log('setAgentList child count:', list ? list.children.length : 'N/A');
if (list) console.log('setAgentList HTML (first 300):', list.innerHTML.slice(0, 300));

// direct re-render safety
try {
  window.eval("SetModule && SetModule.renderAgents && SetModule.renderAgents('SET');");
  console.log('after direct renderAgents child count:', list ? list.children.length : 'N/A');
} catch (e) { console.log('renderAgents THREW:', e.message); }

console.log('--- ERRORS (' + errors.length + ') ---');
errors.forEach(e => console.log(e));
