// 每日市場焦點（金融快訊圖）回歸測試：範本存在 + 繪圖邏輯唔 throw + 生成路徑
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
for (const f of files) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
vm.runInContext("APP_CONFIG.supabase.url=''; APP_CONFIG.supabase.anonKey='';", ctx);
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };

// 假 2D context：所有方法 no-op，measureText 返固定闊度，gradient 支援 addColorStop
function fakeCtx() {
  const noop = () => {};
  const base = {
    measureText: () => ({ width: 20 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop })
  };
  return new Proxy(base, { get(t, p) { return (p in t) ? t[p] : noop; }, set() { return true; } });
}

const COVER_TEMPLATES = vm.runInContext('COVER_TEMPLATES', ctx);

// 1. 範本存在
ok(COVER_TEMPLATES.some(t => t.id === 'market-focus' && t.layout === 'market_focus' && !t.lux), 'COVER_TEMPLATES 有 market-focus（layout market_focus, 簡潔）');
ok(COVER_TEMPLATES.some(t => t.id === 'market-focus-lux' && t.layout === 'market_focus' && t.lux), 'COVER_TEMPLATES 有 market-focus-lux（layout market_focus, lux:true）');

// 2. 函數暴露
ok(typeof window.SocialModule.generateMarketFocus === 'function', 'SocialModule.generateMarketFocus 存在');
ok(typeof window.SocialModule.toggleMarketFocusPanel === 'function', 'SocialModule.toggleMarketFocusPanel 存在');
ok(typeof window.SocialModule.__test.renderMarketFocus === 'function', '__test.renderMarketFocus 存在');
ok(typeof window.SocialModule.__test.drawFlag === 'function', '__test.drawFlag 存在');
ok(typeof window.SocialModule.__test.drawIcon === 'function', '__test.drawIcon 存在');

// 3. renderMarketFocus 簡潔版 / 華麗版 / 冇 items 用 sample，全部唔 throw
const data = {
  title: '每日市場焦點', date: '2026年7月18日', agent: 'Tsang Oi Ting',
  tagline: '專業 · 誠信 · 穩健', cta: '私訊了解詳情',
  items: [
    { flag: 'US', flag2: 'BR', icon: 'clock', title: '美國擬對巴西徵 25% 關稅', subtitle: '自下周三起受影響' },
    { flag: 'KR', icon: 'rate', title: '南韓加息 0.25 厘', subtitle: '指標利率 2.75%' },
    { flag: 'HK', icon: 'chart', title: '香港投資公司表現亮眼', subtitle: '收入增 1.75 倍' }
  ]
};
const tplClean = COVER_TEMPLATES.find(t => t.id === 'market-focus');
const tplLux = COVER_TEMPLATES.find(t => t.id === 'market-focus-lux');
const W = 1080, H = 1350, pad = W * 0.07, base = Math.min(W, H), titleSize = Math.round(base * 0.14);
const font = (wt, size) => wt + ' ' + Math.round(size) + 'px "PingFang SC",sans-serif';

let err = null;
try { window.SocialModule.__test.renderMarketFocus(fakeCtx(), tplClean, data, W, H, pad, base, titleSize, font); } catch (e) { err = e; }
ok(!err, 'renderMarketFocus（簡潔版）假 ctx 跑通，冇 throw' + (err ? (' → ' + err.message) : ''));

err = null;
try { window.SocialModule.__test.renderMarketFocus(fakeCtx(), tplLux, data, W, H, pad, base, titleSize, font); } catch (e) { err = e; }
ok(!err, 'renderMarketFocus（華麗版）假 ctx 跑通，冇 throw' + (err ? (' → ' + err.message) : ''));

err = null;
try { window.SocialModule.__test.renderMarketFocus(fakeCtx(), tplClean, { title: '每日市場焦點' }, W, H, pad, base, titleSize, font); } catch (e) { err = e; }
ok(!err, 'renderMarketFocus（冇 items → 用 sample）唔 throw' + (err ? (' → ' + err.message) : ''));

// 4. drawFlag / drawIcon 各碼唔 throw
err = null;
try {
  ['US', 'BR', 'KR', 'HK', 'CN', 'UK', 'JP', 'XX'].forEach(c => window.SocialModule.__test.drawFlag(fakeCtx(), c, 0, 0, 50, 33));
  ['clock', 'rate', 'chart', 'building', 'bulb', 'globe', 'news', ''].forEach(ic => window.SocialModule.__test.drawIcon(fakeCtx(), ic, 0, 0, 40, '#3b82f6'));
} catch (e) { err = e; }
ok(!err, 'drawFlag / drawIcon 所有碼跑通，冇 throw' + (err ? (' → ' + err.message) : ''));

// 5. generateMarketFocus 全路徑（DOM 填入 → 出 canvas 尺寸）
window.SocialModule.renderMarketFocusPanel();
ok(!!window.document.getElementById('mfTitle_1'), 'renderMarketFocusPanel 建立咗 3 個新聞輸入');
window.SocialModule.generateMarketFocus();
const cv = window.document.getElementById('mfCanvas');
ok(cv && cv.width === 1080 && cv.height === 1350, 'generateMarketFocus 生成 mfCanvas（1080×1350）');

console.log('\n=== 每日市場焦點測試: ' + pass + ' passed, ' + fail + ' failed ===');
process.exit(fail > 0 ? 1 : 0);
