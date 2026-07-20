// 驗證：render.html 嘅接參數畫圖邏輯（sales + post + tpl lookup）
// 用真實 social.js 嘅 renderCover，模擬 render.html 嘅 resolveTpl + 參數解析
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('C:/Users/kelvi/.workbuddy/binaries/node/workspace/node_modules/jsdom');

const ROOT = process.cwd();
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/', pretendToBeVisual: true });
const { window } = dom;
const vm = require('vm');
const ctx = dom.getInternalVMContext();
window.alert = () => {};
window.navigator.clipboard = { writeText: () => Promise.resolve() };
window.open = () => {};
const files = [
  'js/data/config.js', 'js/data/auth.js', 'js/data/cloudsync.js', 'js/data/storage.js',
  'js/data/templates.js', 'js/data/products.js', 'js/modules/social.js', 'js/modules/client.js',
  'js/modules/meeting.js', 'js/modules/followup.js', 'js/modules/proposal.js', 'js/modules/set.js', 'js/app.js'
];
for (const f of files) {
  const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
  vm.runInContext(code, ctx, { filename: f });
}

// ---- 複製 render.html 嘅 resolveTpl ----
function defaultSalesTpl() {
  return { bg:{from:'#eff6ff',to:'#dbeafe',dir:'v'}, layout:'infographic',
    badge:{text:'專屬建議',bg:'#2563eb',color:'#ffffff'},
    titleColor:'#1e40af', titleWeight:900, subColor:'#3b82f6', bulletColor:'#1d4ed8',
    footer:{text:'Jackson Hui',color:'#2563eb'}, decor:'none', accent:'#2563eb' };
}
function resolveTpl(id, mode) {
  if (id && typeof window.COVER_TEMPLATES !== 'undefined') {
    const found = window.COVER_TEMPLATES.find(t => t.id === id);
    if (found) return found;
  }
  if (mode === 'post') {
    if (typeof window.COVER_TEMPLATES !== 'undefined') {
      const fb = window.COVER_TEMPLATES.find(t => t.layout === 'default');
      if (fb) return fb;
    }
    return { bg:{from:'#1e3a8a',to:'#0f172a',dir:'d'}, layout:'default',
      titleColor:'#ffffff', titleWeight:900, subColor:'#bae6fd', bulletColor:'#e0f2fe',
      footer:{text:'Jackson Hui',color:'#bae6fd'}, decor:'sparkle', accent:'#38bdf8' };
  }
  return defaultSalesTpl();
}

function render(mode, params) {
  const cv = window.document.createElement('canvas');
  const w = params.w || 1080, h = params.h || (mode === 'post' ? 1080 : 1350);
  cv.width = w; cv.height = h;
  const tpl = resolveTpl(params.tpl, mode);
  const data = {
    title: params.title || '預設標題',
    tagline: params.tagline || '',
    points: (params.points || '').split('||').map(s => s.trim()).filter(Boolean).slice(0, 3),
  };
  window.SocialModule.renderCover(cv, tpl, data, null);
  // 確認有實際畫咗嘢（唔係全透明）
  const c = cv.getContext('2d');
  const img = c.getImageData(0, 0, cv.width, cv.height).data;
  let nonzero = 0;
  for (let i = 3; i < img.length; i += 4 * 997) if (img[i] > 0) nonzero++;
  if (nonzero === 0) throw new Error('canvas 空白（冇畫到）');
  return true;
}

let ok = true;
const cases = [
  ['sales', { title:'你嘅保障缺口', tagline:'3分鐘免費分析', points:'醫療開支通脹快要早啲鎖定||家庭支柱最怕收入中斷||退休儲備愈早開始愈輕鬆' }],
  ['post', { title:'3個理財貼士', tagline:'香港人都要知', points:'自願醫保扣稅慳稅又保障||危疾保障填補收入中斷||儲蓄保底鎖定長線回報', tpl:'default' }],
  ['sales', { tpl:'info-blue', title:'專屬建議', points:'a||b||c' }],
  ['sales', { tpl:'info-green', title:'綠色攻略', points:'x||y||z' }],
];
for (const [mode, p] of cases) {
  try { render(mode, p); }
  catch (e) { console.log('❌ render(' + mode + ') 失敗：', e.message); ok = false; }
}

if (ok) console.log('✅ render.html 邏輯 OK：sales(預設+info-blue+info-green) + post(default) 全部可畫圖，canvas 非空');
else process.exit(1);
