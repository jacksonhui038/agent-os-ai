const fs = require('fs');
const path = require('path');
const { JSDOM } = require('/Users/kelvin/.workbuddy/binaries/node/workspace/node_modules/jsdom');
const base = '/Users/kelvin/WorkBuddy/2026-07-08-15-01-48/agent-os';
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost:8000/' });
const { window } = dom;
const vm = require('vm');
const ctx = dom.getInternalVMContext();

let alerts = [];
window.alert = (m) => alerts.push(m);

const files = ['js/data/storage.js','js/data/templates.js','js/data/products.js',
  'js/modules/social.js','js/modules/client.js','js/modules/meeting.js',
  'js/modules/followup.js','js/modules/proposal.js','js/app.js'];
for (const f of files) {
  vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), ctx, { filename: f });
}
// mock PptxGenJS (jsdom 無 file download)
window.PptxGenJS = function(){ this.defineLayout=function(){}; this.addSlide=function(){ return { addText(){}, addTable(){}, background:{} }; }; this.writeFile=function(){ return Promise.resolve(); }; };
if (typeof ctx.PptxGenJS === 'undefined') ctx.PptxGenJS = window.PptxGenJS;

try { vm.runInContext('initApp()', ctx); } catch(e){ console.log('initApp err:', e.message); }

const Storage = vm.runInContext('Storage', ctx);
const propWrap = window.document.getElementById('propProducts');
console.log('1) propProducts chips:', propWrap ? propWrap.querySelectorAll('.prop-chip').length : 'NULL');

vm.runInContext("Storage.set('clients', [{ id:'c1', name:'Test客', age:40, job:'IT', income:60000, marital:'married', maritalLabel:'已婚', kids:1, existingCoverage:'公司醫療', notes:'想扣稅' }])", ctx);
window.refreshPropClientSelects();
const sel = window.document.getElementById('propClientSelect');
sel.value = 'c1';

const chips = propWrap.querySelectorAll('.prop-chip');
chips[0].click(); chips[1].click();
console.log('2) chips active:', propWrap.querySelectorAll('.prop-chip.active').length);

window.generateProposal();
const out = window.document.getElementById('proposalOutput');
console.log('3) proposal output:', out.innerHTML.length > 200 ? 'OK ('+out.innerHTML.length+' chars)' : 'EMPTY/SHORT');

window.generateProposalPPT();
setTimeout(() => {
  const pptAlert = alerts.find(a => a.includes('PPT'));
  console.log('4) PPT:', pptAlert || 'NONE (check)');
  console.log('5) total alerts:', alerts.length);
  console.log('=== PROPOSAL TEST DONE ===');
}, 300);
