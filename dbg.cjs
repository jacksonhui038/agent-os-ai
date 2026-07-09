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
for (const f of ['js/data/storage.js','js/data/templates.js','js/modules/social.js','js/modules/client.js','js/modules/meeting.js','js/modules/followup.js','js/modules/proposal.js','js/app.js']) {
  vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), ctx, { filename: f });
}
const Storage = vm.runInContext('Storage', ctx);
// Save a client first
window.document.getElementById('cName').value = 'Dbg客';
window.document.getElementById('cAge').value = '40';
window.document.querySelector('.cov-chip[data-val="company-med"]').click();
window.analyzeClient();
window.saveClient();
const c = Storage.getClients()[0];
console.log('client id:', c.id, 'name:', c.name);
window.refreshPropClientSelects();
window.document.getElementById('propClientSelect').value = c.id;
console.log('select options:', window.document.getElementById('propClientSelect').innerHTML.slice(0,120));
window.document.querySelector('.prop-chip[data-val="vhis"]').click();
console.log('active chips:', Array.from(window.document.querySelectorAll('.prop-chip.active')).map(e=>e.dataset.val));
window.generateProposal();
const out = window.document.getElementById('proposalOutput');
console.log('output class:', out.className);
console.log('output length:', out.innerHTML.length);
console.log('output head:', out.innerHTML.slice(0, 200));
