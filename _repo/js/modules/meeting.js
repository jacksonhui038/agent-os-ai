// ===== Meeting.js — 見客準備模組 =====
(function() {
  let state = { purpose: 'first', duration: '30' };

  function init() {
    document.querySelectorAll('.meet-purpose-chip').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.meet-purpose-chip').forEach(s => s.classList.remove('active'));
        el.classList.add('active');
        state.purpose = el.dataset.val;
      });
    });
    document.querySelectorAll('.meet-dur-chip').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.meet-dur-chip').forEach(s => s.classList.remove('active'));
        el.classList.add('active');
        state.duration = el.dataset.val;
      });
    });
  }

  function refreshClientSelects() {
    const sel = document.getElementById('meetClientSelect');
    if (!sel) return;
    const clients = Storage.getClients();
    sel.innerHTML = '<option value="">-- 選擇已儲存嘅客戶 --</option>' +
      clients.map(c => `<option value="${c.id}">${c.name} (${c.age||'?'}歲)</option>`).join('');

    // Also include last analyzed
    if (window._lastAnalyzedClient) {
      sel.innerHTML += `<option value="__last">${window._lastAnalyzedClient.name}（本次分析）</option>`;
    }
  }

  function generateMeetingPrep() {
    const clientId = document.getElementById('meetClientSelect').value;
    let client = null;
    if (clientId === '__last') client = window._lastAnalyzedClient;
    else if (clientId) client = Storage.getClient(clientId);
    else if (window._lastAnalyzedClient) client = window._lastAnalyzedClient;

    if (!client) { alert('請先選擇客戶（或去客戶分析模組輸入資料）'); return; }

    const flow = TEMPLATES.meetingFlows[state.purpose] || TEMPLATES.meetingFlows.first;
    const purposeNames = { first:'首次見面／需求分析', proposal:'講解建議書', followup:'跟進成交', review:'年度保單檢討' };

    // Scale phases by duration
    const durMin = parseInt(state.duration);
    const totalPhaseMin = flow.phases.reduce((s,p) => s + parseInt(p.name.match(/\d+/)?.[0] || 5), 0);
    const scale = durMin / totalPhaseMin;

    let html = `
      <div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap;font-size:12px">
        <span class="tag tag-blue">客戶：${escapeHtml(client.name||'-')}</span>
        <span class="tag tag-orange">目的：${purposeNames[state.purpose]}</span>
        <span class="tag tag-green">時長：${durMin} 分鐘</span>
      </div>
      <div class="proposal-section">
        <h4>🎯 Meeting Flow（${purposeNames[state.purpose]}）</h4>
    `;

    flow.phases.forEach(p => {
      const baseMin = parseInt(p.name.match(/\d+/)?.[0] || 5);
      const scaled = Math.round(baseMin * scale);
      html += `<div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;gap:12px;align-items:flex-start">
        <span style="background:var(--primary);color:white;border-radius:8px;padding:4px 10px;font-size:12px;font-weight:700;white-space:nowrap">${scaled} min</span>
        <div>
          <strong style="font-size:14px">${escapeHtml(p.name.split('(')[0].trim())}</strong>
          <p style="font-size:13px;color:var(--text-secondary);margin-top:2px">${escapeHtml(p.content)}</p>
        </div>
      </div>`;
    });

    html += `</div>`;

    // Objection handling
    const objections = Object.entries(TEMPLATES.objections).slice(0, 4);
    html += `<div class="proposal-section" style="border-color:#f59e0b">
      <h4 style="color:#d97706">💬 常見反對處理（準備好）</h4>`;
    objections.forEach(([k, v]) => {
      html += `<div style="margin-bottom:12px;padding:10px;background:var(--bg);border-radius:8px">
        <strong style="color:var(--text)">客：「${escapeHtml(k)}」</strong><br>
        <span style="font-size:13px;color:var(--text-secondary)">
          👉 ${escapeHtml(v.acknowledge)} ${escapeHtml(v.reframe)} ${escapeHtml(v.close)}
        </span>
      </div>`;
    });
    html += `</div>`;

    // Opening script
    const opening = buildOpeningScript(client, state.purpose);
    html += `<div class="proposal-section" style="border-color:#3b82f6">
      <h4 style="color:#2563eb">🗣️ 開場白建議</h4>
      <pre class="output-content" id="meetOpening">${escapeHtml(opening)}</pre>
      <button class="btn btn-sm btn-ghost copy-btn" onclick="copySingleText('meetOpening', this)">複製</button>
    </div>`;

    html += `<div style="margin-top:14px"><button class="btn btn-sm btn-secondary" onclick="copyText(this)">複製全部</button></div>`;

    document.getElementById('meetingOutput').className = 'output-box filled';
    document.getElementById('meetingOutput').innerHTML = html;

    Storage.addHistory({ type: 'meeting', client: client.name, purpose: state.purpose });
  }

  function buildOpeningScript(client, purpose) {
    const name = client.name || '客戶';
    const greetings = {
      first: `你好 ${name}！好開心今日有機會同你傾下。我今日嘅目標好簡單，就係了解你同屋企人嘅情況，睇下有咩可以幫到你。唔使有任何壓力，我哋就係傾下偈。`,
      proposal: `${name} 你好！上次傾完之後我準備咗一份專門為你度身訂造嘅建議書，今日想同你逐項過一遍，有咩唔明隨時問我。`,
      followup: `${name} 你好呀！上次傾完之後我諗多咗陣，覺得有幾點想同你再確認下。你方便的話我哋繼續傾？`,
      review: `${name}，時間過得好快！又到咗年度檢討嘅時候。我想同你睇下過去一年嘅保單情況，確保保障仲係啱你嘅需要。`
    };
    return greetings[purpose] || greetings.first;
  }

  window.generateMeetingPrep = generateMeetingPrep;
  window.MeetingModule = { init, refreshClientSelects };
})();
