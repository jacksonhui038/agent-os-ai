/* 集成測試：SET 多 backend LLM（mock / ollama / openai fallback） */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
const configSrc = fs.readFileSync(path.join(ROOT, 'js/data/config.js'), 'utf8');
const setSrc = fs.readFileSync(path.join(ROOT, 'js/modules/set.js'), 'utf8');

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
const { window } = dom;

// 注入 config + set
function inject(src) {
  const s = window.document.createElement('script');
  s.textContent = src;
  window.document.body.appendChild(s);
}
inject(configSrc);
inject(setSrc);

const results = [];
function assert(name, cond) { results.push((cond ? 'PASS' : 'FAIL') + ' — ' + name); }

// ---- 1. mock 模式（預設，無 localStorage）----
window.localStorage.clear();
window.SetModule.init();
window.SetModule.init && window.SetModule;
window.SetModule.openSettings && window.SetModule.closeSettings && window.SetModule.saveSettings && window.SetModule.onProviderChange;
assert('SET 模組 export 咗設定函數', typeof window.SetModule.openSettings === 'function');

// 開 chat + 發送 mock 訊息
window.SetModule.showDiscover();
// 直接 call openChat via clicking agent card 唔方便，改用內部：搵第一張 card
const firstCard = window.document.querySelector('#setAgentList .agent-card');
assert('專家列表有 render 出卡片', !!firstCard);
firstCard.dispatchEvent(new window.Event('click'));
window.document.getElementById('setMsgInput').value = 'VHIS 稅務扣減';
window.SetModule.sendMessage();

// mock 模式有 300ms delay
setTimeout(() => {
  const msgs = window.document.getElementById('setChatMessages');
  const last = msgs.querySelector('.message.bot:last-child .msg-bubble');
  const text = last ? last.textContent : '';
  assert('mock 模式返回內建 VHIS 回覆', text.includes('HK$8,000'));
  assert('mock 模式 status dot 顯示離線示範', window.document.getElementById('setStatusDot').textContent.includes('離線示範'));

  // ---- 2. ollama 模式：stub fetch ----
  let fetchCalled = false;
  window.fetch = async (url, opts) => {
    fetchCalled = true;
    assert('ollama 呼叫 /api/chat', url.includes('/api/chat'));
    return { ok: true, json: async () => ({ message: { content: '【Ollama 回應】呢個係本地 LLM 嘅測試回覆' } }) };
  };
  window.localStorage.setItem('set_llm_config', JSON.stringify({ provider: 'ollama', baseUrl: 'http://localhost:11434', apiKey: '', model: 'llama3.2' }));
  // 重新 openChat 更新 status dot
  window.document.querySelector('#setAgentList .agent-card').dispatchEvent(new window.Event('click'));
  assert('ollama 模式 status dot 顯示 Ollama', window.document.getElementById('setStatusDot').textContent.includes('Ollama'));
  window.document.getElementById('setMsgInput').value = '幫我寫段 ECI 開價話術';
  window.SetModule.sendMessage();

  setTimeout(() => {
    assert('ollama fetch 被呼叫', fetchCalled);
    const msgs2 = window.document.getElementById('setChatMessages');
    const last2 = msgs2.querySelector('.message.bot:last-child .msg-bubble');
    const text2 = last2 ? last2.textContent : '';
    assert('ollama 模式返回 LLM 回覆（非 mock）', text2.includes('【Ollama 回應】') && !text2.includes('HK$8,000'));

    // ---- 3. openai 模式 fetch 失敗 → fallback mock ----
    window.fetch = async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'Invalid API key' } }) });
    window.localStorage.setItem('set_llm_config', JSON.stringify({ provider: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: 'bad', model: 'gpt-4o-mini' }));
    window.document.querySelector('#setAgentList .agent-card').dispatchEvent(new window.Event('click'));
    window.document.getElementById('setMsgInput').value = 'VHIS 稅務扣減';
    window.SetModule.sendMessage();

    setTimeout(() => {
      const msgs3 = window.document.getElementById('setChatMessages');
      const last3 = msgs3.querySelector('.message.bot:last-child .msg-bubble');
      const text3 = last3 ? last3.textContent : '';
      assert('openai 失敗退回 mock + 提示', text3.includes('HK$8,000') && text3.includes('退回離線示範'));

      console.log('\n=== SET LLM 測試結果 ===');
      results.forEach(r => console.log(r));
      const failed = results.filter(r => r.startsWith('FAIL'));
      console.log('\n' + (failed.length ? failed.length + ' 項失敗' : '全部 ' + results.length + ' 項通過 ✅'));
      process.exit(failed.length ? 1 : 0);
    }, 200);
  }, 200);
}, 400);
