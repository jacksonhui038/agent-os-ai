const fs = require('fs'), path = require('path');
const { JSDOM } = require('/Users/kelvin/.workbuddy/binaries/node/workspace/node_modules/jsdom');
const base = '/Users/kelvin/WorkBuddy/2026-07-08-15-01-48/agent-os';
const dom = new JSDOM(fs.readFileSync(path.join(base, 'index.html'), 'utf8'), { runScripts: 'outside-only', url: 'http://localhost:8000/' });
const { window } = dom; const vm = require('vm'); const ctx = dom.getInternalVMContext();
window.alert = () => {};
window.fetch = () => Promise.reject(new Error('no net'));

const files = [
  'js/data/config.js', 'js/data/auth.js', 'js/data/cloudsync.js', 'js/data/storage.js',
  'js/data/templates.js', 'js/data/products.js', 'js/lib/pptxgen.bundle.js',
  'js/modules/social.js', 'js/modules/client.js', 'js/modules/meeting.js',
  'js/modules/followup.js', 'js/modules/proposal.js', 'js/modules/set.js', 'js/app.js'
];
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.join(base, f), 'utf8'), ctx, { filename: f }); }
  catch (e) { console.error('LOAD ERROR', f, e.message); process.exit(1); }
}
// 單機模式 boot（清空 key，模擬未啟用雲端，直接 initApp 渲染 SET）
vm.runInContext("APP_CONFIG.supabase.url=''; APP_CONFIG.supabase.anonKey=''; _appStarted=false; boot();", ctx);

(async () => {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; console.log('  ✅', m); } else { fail++; console.log('  ❌', m); } };

  // 1. 專家陣容 render 6 張卡
  const list = window.document.getElementById('setAgentList');
  ok(list && list.children.length === 6, `專家陣容渲染 6 張卡 (實際: ${list ? list.children.length : 'null'})`);

  // 2. 第一張係 hero（全能顧問）
  const first = list.children[0];
  ok(first && first.className.includes('badge-hero'), '首張卡為 SET全能顧問 (hero)');

  // 3. 撳第一張卡 → 入 chat
  first.click();
  const chat = window.document.getElementById('setChat');
  ok(chat && chat.classList.contains('active'), '撳卡後 chat view 顯示');
  const discover = window.document.getElementById('setDiscover');
  ok(discover && discover.style.display === 'none', 'discover view 隱藏');

  // 4. welcome message 出咗
  const msgs = window.document.getElementById('setChatMessages');
  ok(msgs && msgs.querySelectorAll('.message.bot').length >= 1, '歡迎語 (bot message) 已生成');

  // 5. 撳 chip → sendUserText
  const chip = window.document.querySelector('#setChipsBar .chip');
  ok(!!chip, 'chips bar 有快捷 chip');
  if (chip) chip.click();

  // 等 mock 回覆 (300ms delay + typing)
  await new Promise(r => setTimeout(r, 700));
  const botCount = msgs.querySelectorAll('.message.bot').length;
  ok(botCount >= 2, `chip 撳後有 bot 回覆 (bot msgs: ${botCount})`);
  const lastBot = msgs.querySelectorAll('.message.bot')[botCount - 1];
  ok(lastBot && lastBot.textContent.length > 10, 'bot 回覆有內容');

  // 6. 手動打字 send
  const input = window.document.getElementById('setMsgInput');
  input.value = 'VHIS 稅務扣減';
  window.SetModule.sendMessage();
  await new Promise(r => setTimeout(r, 700));
  const allMsgs = msgs.querySelectorAll('.message');
  ok(allMsgs.length >= 4, `手動發送後訊息數增加 (total: ${allMsgs.length})`);
  const replyText = msgs.querySelector('.message.bot:last-child') ? msgs.querySelectorAll('.message.bot')[msgs.querySelectorAll('.message.bot').length-1].textContent : '';
  ok(replyText.includes('8,000') || replyText.includes('HK$'), 'VHIS 回覆含稅務扣減金額');

  // 7. back to discover
  window.SetModule.showDiscover();
  ok(window.document.getElementById('setChat').classList.contains('active') === false, '返回專家列表 (showDiscover)');

  console.log(`\nSET 整合測試：${pass} 通過 / ${fail} 失敗`);
  process.exit(fail ? 1 : 0);
})();
