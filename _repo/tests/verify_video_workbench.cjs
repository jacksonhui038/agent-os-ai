// 🎬 小紅書短視頻工作台回歸測試：Hook 庫 + 短視頻腳本 + 9:16 封面 + 一週日曆
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

function fakeCtx() {
  const noop = () => {};
  const base = {
    measureText: () => ({ width: 20 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop })
  };
  return new Proxy(base, { get(t, p) { return (p in t) ? t[p] : noop; }, set() { return true; } });
}

const T = window.SocialModule.__test;
const COVER_TEMPLATES = vm.runInContext('COVER_TEMPLATES', ctx);

// 1. 範本 + 函數暴露
ok(COVER_TEMPLATES.some(t => t.id === 'reels-cover' && t.layout === 'reels' && t.avatar), 'COVER_TEMPLATES 有 reels-cover（layout reels, avatar:true）');
ok(typeof window.SocialModule.generateVideoScript === 'function', 'SocialModule.generateVideoScript 存在');
ok(typeof window.SocialModule.generateReelsCover === 'function', 'SocialModule.generateReelsCover 存在');
ok(typeof window.SocialModule.refreshVideoHooks === 'function', 'SocialModule.refreshVideoHooks 存在');
ok(typeof window.SocialModule.generateContentCalendar === 'function', 'SocialModule.generateContentCalendar 存在');
ok(typeof T.buildVideoScript === 'function' && typeof T.pickHook === 'function' && typeof T.buildContentCalendar === 'function', '__test 暴露 buildVideoScript / pickHook / buildContentCalendar');
ok(typeof T.chooseReelsTitle === 'function' && typeof T.pickReelsBadge === 'function' && typeof T.breakReelsTitle === 'function', '__test 暴露 chooseReelsTitle / pickReelsBadge / breakReelsTitle');

// 1b. 封面標題精簡專業、自動斷行不截字
const rt = T.chooseReelsTitle('小紅書');
ok(rt.length <= 13 && !/手寫文案|日日出小/.test(rt), 'reels 標題精簡專業：' + rt);
const broken = T.breakReelsTitle('小紅書保險獲客', 9);
ok(broken.length <= 2 && broken.every(l => l.length <= 9), '長標題自動斷行唔超過 9 字：' + broken.join('/'));

// 2. Hook 庫（Task #78）：六類，{topic} 會被取代
const cats = Object.keys(T.VIDEO_HOOKS);
ok(cats.length === 6, 'VIDEO_HOOKS 有 6 類鉤子（' + cats.join('/') + '）');
ok(cats.every(c => Array.isArray(T.VIDEO_HOOKS[c]) && T.VIDEO_HOOKS[c].length >= 4), '每類鉤子至少 4 條');
const h = T.pickHook('危疾保障', '權威');
ok(h.cat === '權威' && h.text.indexOf('{topic}') < 0, 'pickHook 指定類別 + 取代 {topic}（' + h.text + '）');

// 3. 短視頻腳本（Task #76）：時間軸 + 大字幕 + 口播 + caption
const s30 = T.buildVideoScript('自願醫保扣稅懶人包', { duration: '30', hookStyle: '數字', style: 'casual', persona: 'friendly' });
ok(s30.segments.length >= 3, '30 秒腳本有多個分鏡段（' + s30.segments.length + ' 段）');
ok(s30.segments[0].role === '開場鉤子' && s30.segments[s30.segments.length - 1].role === '結尾 CTA', '首段開場鉤子、尾段結尾 CTA');
ok(s30.segments.every(seg => seg.time && seg.subtitle && seg.narration && seg.visual), '每段都有 時間/大字幕/口播/畫面');
ok(typeof s30.caption === 'string' && s30.caption.length > 0 && /#/.test(s30.hashtags), '有配套 caption + hashtags');
ok(Array.isArray(s30.tips) && s30.tips.length >= 5, '有拍攝貼士（' + s30.tips.length + ' 條）');
// 內容豐富度：完整口播稿存在，且每段口播都係完整句子（唔係得幾隻字）
ok(typeof s30.fullScript === 'string' && s30.fullScript.length >= 150, '有完整口播稿（' + s30.fullScript.length + ' 字，夠讀）');
ok(s30.segments.filter(seg => seg.role.indexOf('開場') < 0 && seg.role.indexOf('CTA') < 0)
  .every(seg => seg.narration.length >= 20), '每個重點口播都係完整句子（≥20 字）');
const s15 = T.buildVideoScript('危疾保障常見誤解', { duration: '15' });
const s60 = T.buildVideoScript('危疾保障常見誤解', { duration: '60' });
ok(s60.segments.length >= s30.segments.length && s30.segments.length >= s15.segments.length, '片長越長段數越多（15≤30≤60）');

// 4. renderReelsLayout（Task #77）：假 ctx 唔 throw（有／冇頭像）
const W = 1080, H = 1920, pad = W * 0.07, base = Math.min(W, H), titleSize = Math.round(base * 0.11);
const font = (wt, size) => wt + ' ' + Math.round(size) + 'px "PingFang SC",sans-serif';
const tplReels = COVER_TEMPLATES.find(t => t.id === 'reels-cover');
let err = null;
try { T.renderReelsLayout(fakeCtx(), tplReels, { title: '全港首個保險獲客 AI', tagline: '一撳出足一星期', badge: '全港首個', platform: ['小红书', '抖音'], cta: '👇 留言拎' }, W, H, pad, base, titleSize, font); } catch (e) { err = e; }
ok(!err, 'renderReelsLayout（冇頭像→佔位）唔 throw' + (err ? (' → ' + err.message) : ''));
T.setAvatar({ width: 400, height: 400 });
err = null;
try { T.renderReelsLayout(fakeCtx(), tplReels, { title: '危疾規劃 3 個位', platform: ['小红书', '抖音', '抖音'] }, W, H, pad, base, titleSize, font); } catch (e) { err = e; }
ok(!err, 'renderReelsLayout（有頭像）唔 throw' + (err ? (' → ' + err.message) : ''));
T.setAvatar(null);

// 5. 一週內容日曆（Task #79）：7 日、图文+短視頻混合、時間跟習慣
const plan = T.buildContentCalendar('家庭醫療保障');
ok(plan.length === 7, '一週日曆 7 日');
ok(plan.some(d => d.format === '短視頻') && plan.some(d => d.format === '图文') && plan.some(d => d.format === '互動'), '混合 图文 / 短視頻 / 互動');
ok(plan.every(d => d.topic && d.hook && d.tag && d.slot), '每日都有 主題/鉤子/標籤/時間');
const uniqTopics = new Set(plan.map(d => d.topic));
ok(uniqTopics.size === 7, '7 日主題唔重複（' + uniqTopics.size + ' 個唯一）');

// 6. 生成路徑（DOM）：填主題 → 出腳本 / 9:16 封面 / 日曆
window.document.getElementById('socialTopic').value = '危疾保障常見誤解';
const r1 = window.SocialModule.generateVideoScript();
ok(r1 && r1.ok, 'generateVideoScript 全路徑 ok');
ok(!!window.document.getElementById('videoOut').innerHTML, 'videoOut 有輸出');
window.SocialModule.generateReelsCover();
const rc = window.document.getElementById('reelsCanvas');
ok(rc && rc.width === 2160 && rc.height === 3840, 'generateReelsCover 生成 9:16 高清 canvas（2160×3840 = 1080×1920 ×2）');
window.document.getElementById('calendarSeed').value = '退休儲蓄規劃';
const r2 = window.SocialModule.generateContentCalendar();
ok(r2 && r2.ok && r2.count === 7, 'generateContentCalendar 全路徑 ok（7 篇）');
ok(!!window.document.getElementById('calendarRaw'), 'calendarOut 有可複製計劃表');

console.log('\n=== 短視頻工作台測試: ' + pass + ' passed, ' + fail + ' failed ===');
process.exit(fail > 0 ? 1 : 0);
