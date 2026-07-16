// SET 全能顧問人性化回覆測試：驗證 fallbackReply 有同理心、唔再罐頭
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
vm.runInContext(fs.readFileSync(path.join(ROOT, files[0]), 'utf8'), ctx, { filename: files[0] });
vm.runInContext("APP_CONFIG.supabase.url=''; APP_CONFIG.supabase.anonKey='';", ctx);
for (let i = 1; i < files.length; i++) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, files[i]), 'utf8'), ctx, { filename: files[i] });
}
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } };

const T = window.SetModule.__test;

// 1. 情緒偵測
ok(T.detectEmotion('我唔識見客') === 'anxious', '情緒：「我唔識見客」= anxious');
ok(T.detectEmotion('你啲回覆好罐頭，唔似人') === 'frustrated', '情緒：「好罐頭」= frustrated');
ok(T.detectEmotion('我想學下點見客') === 'curious', '情緒：「我想學」= curious');
ok(T.detectEmotion('VHIS 點講') === 'neutral', '情緒：普通問題 = neutral');

// 2. 焦慮回覆：唔再叫人打指令，而係先安撫 + 框架
const anxiousReply = T.fallbackReply('我唔識見客');
ok(!/你可以直接打/.test(anxiousReply), '焦慮回覆：唔再講「你可以直接打」');
ok(/放心|緊張|開場|中場|收尾/.test(anxiousReply), '焦慮回覆：包含安撫同框架');

// 3. 挫敗回覆：認同反饋
const frustratedReply = T.fallbackReply('你啲回覆好罐頭，唔似人');
ok(/反饋好重要|一齊調整|唔似真人/.test(frustratedReply), '挫敗回覆：認同用戶感受');
ok(!/你可以直接打/.test(frustratedReply), '挫敗回覆：唔再講「你可以直接打」');

// 4. 話術請求：唔再直接畀「X 生」範本，而係問清楚
const scriptReply = T.fallbackReply('生成話術');
ok(!/X 生你好|X 老闆/.test(scriptReply), '話術請求：唔再直接畀「X 生」範本');
ok(/客戶類型|產品\/場景|目的|問清楚/.test(scriptReply), '話術請求：引導用戶提供背景');

// 5. 上下文推導：先講「生成話術」，再講「我唔識見客」→ 應理解為初次見客焦慮
T.pushConversation('user', '生成話術');
const contextualReply = T.fallbackReply('我唔識見客');
ok(/放心|緊張|開場|三個位/.test(contextualReply), '上下文：接「生成話術」後講唔識見客，回覆貼近初次見客');
ok(!/你可以直接打/.test(contextualReply), '上下文：唔再講「你可以直接打」');

// 6. 最後 fallback 都唔再叫人打指令
const fallback = T.fallbackReply('隨便');
ok(!/你可以直接打/.test(fallback), '最後 fallback：唔再講「你可以直接打」');
ok(/幫我寫初次見客開場|幫我寫約見話術/.test(fallback), '最後 fallback：提供具體情境選擇');

// 7. 搵客問題：直接畀實質答案，唔再叫「揀情境」
const prospecting = T.fallbackReply('點搵客先？');
ok(/搵客|客戶|渠道|人脈|轉介紹|同學|LinkedIn/.test(prospecting), '搵客：直接畀實質渠道');
ok(!/幫我寫初次見客開場|幫我寫約見話術/.test(prospecting), '搵客：唔再重複情境選擇');

// 8. 「冇客見」都理解為搵客
const noClient = T.fallbackReply('冇客見');
ok(/搵客|人脈|轉介紹|渠道/.test(noClient), '冇客見：提供搵客方向');

// 9. 畢業大學生 + 有人脈 → 針對性學生攻略
const studentNetwork = T.fallbackReply('唔識見客，有人脈應該點做，若若畢業大學生');
ok(/同學|師兄|社團|LinkedIn|校友|家庭轉介紹/.test(studentNetwork), '畢業大學生：針對人脈搵客攻略');

// 10. 列舉客類唔會硬係 assume ECI
T.pushConversation('user', '寫一段初次見客開場白，內地客／家庭客／僱主都可能有');
const notEci = T.fallbackReply('寫一段初次見客開場白，內地客／家庭客／僱主都可能有');
ok(!/ECI|勞工|法例必買|僱主/.test(notEci) || /通用初次見客開場白/.test(notEci), '列舉客類：唔會硬推 ECI');

// 11. 重複 fallback 會變成追問，唔會機械重複（用一個唔觸發搵客/話術嘅輸入）
T.pushConversation('assistant', '我聽到喇。我哋可以由一個具體場景開始...');
const repeatedFallback = T.fallbackReply('唔明');
ok(/睇返你之前講|卡喺「搵唔到客」|初次見客|搵客/.test(repeatedFallback), '重複 fallback：接續上文追問');

console.log('\n=== SET 人性化回覆測試: ' + pass + ' passed, ' + fail + ' failed ===');
process.exit(fail > 0 ? 1 : 0);
