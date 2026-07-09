// ===== App.js — 主程式：路由、狀態管理、初始化 =====

// ===== Router =====
const pages = ['dashboard','social','client','meeting','followup','proposal','clients-list','history','set'];
let currentPage = 'dashboard';

function navigateTo(page) {
  if (!pages.includes(page)) return;

  // Hide all
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show target
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  // Update nav
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');

  // Update title
  const titles = {
    dashboard: '工作台', social: '社交內容引擎', client: '客戶分析',
    meeting: '見客準備', followup: 'Follow-Up 生成器',
    proposal: 'Proposal 引擎', 'clients-list': '客戶列表', history: '歷史記錄',
    set: 'SET 智能體'
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  currentPage = page;
  window.scrollTo(0, 0);

  // Page-specific refreshes
  if (page === 'meeting') MeetingModule?.refreshClientSelects?.();
  if (page === 'proposal') window.refreshPropClientSelects?.();
  if (page === 'clients-list') renderClientsList();
  if (page === 'history') renderHistory();

  // Close mobile sidebar
  document.getElementById('sidebar')?.classList.remove('open');
}

// ===== Nav Click Handler =====
document.addEventListener('click', e => {
  const navItem = e.target.closest('.nav-item');
  if (navItem) navigateTo(navItem.dataset.page);
});

// ===== Sidebar Toggle (Mobile) =====
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

// ===== Utility Functions =====
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function copyText(btn) {
  // Find output content in parent box
  let text = '';
  const box = btn.closest('.output-box');
  if (box) {
    const pres = box.querySelectorAll('pre.output-content');
    text = Array.from(pres).map(p => p.textContent).join('\n\n---\n\n');
    if (!text) text = box.innerText;
  }

  if (!text) { alert('沒有可複製的內容'); return; }
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '已複製 ✓';
    setTimeout(() => btn.textContent = btn.dataset.orig || '複製全部', 2000);
  }).catch(() => {
    fallbackCopy(text);
    btn.textContent = '已複製 ✓';
    setTimeout(() => btn.textContent = btn.dataset.orig || '複製全部', 2000);
  });
}

function copySingleText(elementId, btn) {
  const el = document.getElementById(elementId);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => {
    btn.textContent = '已複製 ✓';
    setTimeout(() => btn.textContent = '複製', 2000);
  });
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  document.execCommand('copy'); document.body.removeChild(ta);
}

// ===== Dashboard Stats =====
function updateDashboardStats() {
  const s = Storage.getStats();
  const el = id => document.getElementById(id);
  if (el('statClients')) el('statClients').textContent = s.clients;
  if (el('statPosts')) el('statPosts').textContent = s.posts;
  if (el('statFollowups')) el('statFollowups').textContent = s.followups;
  if (el('statProposals')) el('statProposals').textContent = s.proposals;
}

// ===== Clients List Page =====
function renderClientsList() {
  const clients = Storage.getClients();
  const container = document.getElementById('clientsListOutput');

  if (clients.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">📭</div>
      <div class="empty-state-text">仲未有儲存嘅客戶<br>去「客戶分析」頁面新增</div>
    </div>`;
    return;
  }

  let html = '<div style="display:flex;flex-direction:column;gap:12px">';
  clients.forEach(c => {
    html += `<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <strong style="font-size:15px">${escapeHtml(c.name)}</strong>
        <span style="color:var(--text-tertiary);font-size:13px;margin-left:8px">${c.age}歲 · ${escapeHtml(c.job||'-')}</span>
        <div style="margin-top:4px;font-size:12px;color:var(--text-secondary)">
          ${c.existingRaw ? c.existingRaw.map(v => `<span class="tag tag-green" style="font-size:10px;margin-right:4px">${v}</span>`).join('') : ''}
          ${c.updatedAt ? `· 更新於 ${new Date(c.updatedAt).toLocaleDateString('zh-HK')}` : ''}
        </div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-sm btn-secondary" onclick="loadClientForEdit('${c.id}')">編輯</button>
        <button class="btn btn-sm btn-ghost" onclick="deleteClientById('${c.id}')">刪除</button>
      </div>
    </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

function loadClientForEdit(id) {
  ClientModule?.loadForEdit?.(id);
  navigateTo('client');
}

function deleteClientById(id) {
  if (!confirm('確定刪除此客戶？')) return;
  Storage.deleteClient(id);
  renderClientsList();
  updateDashboardStats();
  refreshAllClientSelects();
}

function clearAllClients() {
  if (!confirm('確定清空所有客戶資料？此操作不可復原！')) return;
  Storage.clearClients();
  renderClientsList();
  updateDashboardStats();
  refreshAllClientSelects();
}

// ===== History Page =====
function renderHistory() {
  const h = Storage.getHistory();
  const container = document.getElementById('historyOutput');

  if (h.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">🕐</div>
      <div class="empty-state-text">仲未有歷史記錄<br>使用各功能後記錄會自動保存</div>
    </div>`;
    return;
  }

  let html = '<div style="display:flex;flex-direction:column;gap:8px">';
  h.slice(0, 50).forEach(entry => {
    const typeIcons = { social:'✍️', followup:'💬', proposal:'📋' };
    const typeLabels = { social:'社交內容', followup:'Follow-Up', proposal:'Proposal' };
    const time = new Date(entry.time).toLocaleString('zh-HK');

    let detail = '';
    if (entry.type === 'social') detail = entry.topic || '';
    else if (entry.type === 'followup') detail = `客戶：${entry.client || '-'} · 階段：${entry.stage || '-'}`;
    else if (entry.type === 'proposal') detail = `客戶：${entry.client || '-'} · 產品：${(entry.products||[]).join(', ')}`;

    html += `<div style="padding:12px 14px;background:var(--bg);border-radius:var(--radius-sm);display:flex;align-items:center;gap:10px;font-size:13px">
      <span style="font-size:18px">${typeIcons[entry.type] || '📌'}</span>
      <span style="flex:1"><strong>${typeLabels[entry.type] || entry.type}</strong><br><span style="color:var(--text-tertiary)">${detail}</span></span>
      <span style="color:var(--text-tertiary);font-size:11px;white-space:nowrap">${time}</span>
    </div>`;
  });

  html += '</div>';
  container.innerHTML = html;
}

function clearHistory() {
  if (!confirm('確定清除所有歷史記錄？')) return;
  Storage.clearHistory();
  renderHistory();
}

// ===== Export / Import Data =====
function exportData() {
  const data = {
    clients: Storage.getClients(),
    history: Storage.getHistory(),
    exportDate: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `agent-os-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(url);
}

// 從 JSON 備份還原（搭配 exportData 使用）
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== 'object') throw new Error('格式錯誤');
        const clients = Array.isArray(data.clients) ? data.clients : [];
        const history = Array.isArray(data.history) ? data.history : [];
        // 合併而非直接覆蓋：保留現有 + 匯入，按 id 去重
        const mergedClients = mergeById(Storage.getClients(), clients);
        const mergedHistory = mergeById(Storage.getHistory(), history);
        Storage.set('clients', mergedClients);
        Storage.set('history', mergedHistory);
        updateDashboardStats();
        refreshAllClientSelects();
        alert(`✅ 匯入完成：客戶 ${mergedClients.length} 個（新增 ${Math.max(0, mergedClients.length - (Storage.getClients().length - clients.length))}）、歷史 ${mergedHistory.length} 條`);
      } catch (err) {
        alert('❌ 匯入失敗：' + (err.message || '檔案不是有效嘅 Agent OS 備份'));
      }
    };
    reader.onerror = () => alert('❌ 讀取檔案失敗');
    reader.readAsText(file);
  };
  input.click();
}

// 按 id 合併，匯入項覆蓋同名 id
function mergeById(current, incoming) {
  const map = new Map();
  (current || []).forEach(x => { if (x && x.id) map.set(x.id, x); });
  (incoming || []).forEach(x => { if (x && x.id) map.set(x.id, x); });
  return Array.from(map.values());
}

// ===== Refresh all client selects =====
function refreshAllClientSelects() {
  MeetingModule?.refreshClientSelects?.();
  window.refreshPropClientSelects?.();
}

// ===== Init All Modules =====
function initApp() {
  if (_appStarted) return;
  _appStarted = true;
  // 檢查 LocalStorage 是否可用（file:// 或隱私模式會失败）
  if (typeof Storage !== 'undefined' && !Storage.available()) {
    const w = document.getElementById('storageWarn');
    if (w) w.style.display = 'block';
  }

  SocialModule?.init?.();
  ClientModule?.init?.();
  MeetingModule?.init?.();
  FollowUpModule?.init?.();
  ProposalModule?.init?.();
  SetModule?.init?.();

  // Set button original texts for copy feedback
  document.querySelectorAll('[data-orig]').forEach(b => b.dataset.orig = b.textContent);

  // Update stats
  updateDashboardStats();

  console.log('Agent OS AI v1.0 initialized ✅');
}

// ===== 啟動流程（含登入閘門）=====
let _appStarted = false;

function showAuth() {
  const a = document.getElementById('authScreen');
  const app = document.querySelector('.app');
  if (a) a.style.display = 'flex';
  if (app) app.style.display = 'none';
}
function showApp() {
  const a = document.getElementById('authScreen');
  const app = document.querySelector('.app');
  if (a) a.style.display = 'none';
  if (app) app.style.display = '';
  if (APP_CONFIG.cloudEnabled) {
    const lb = document.getElementById('logoutBtn');
    if (lb) lb.style.display = '';
  }
}
function showAuthError(msg) {
  const e = document.getElementById('authError');
  if (!e) return;
  e.textContent = msg;
  e.style.display = 'block';
}
// 將 Supabase 英文錯誤翻譯成中文，避免登入紅 BAR 顯示奇怪英文
function friendlyAuthMsg(raw) {
  const m = (raw || '').toString();
  const map = [
    [/invalid login credentials/i, 'Email 或密碼錯誤，請再試一次'],
    [/email not confirmed/i, '個 email 仲未確認 —— 去收確認信撳入面嘅 link 啟用帳號，再返嚟登入'],
    [/user already registered/i, '呢個 email 已經註冊過喇，直接撳「登入」就得'],
    [/password should be at least/i, '密碼至少要 6 位'],
    [/signup requires a valid password/i, '密碼格式唔啱，至少要 6 位'],
    [/for security purposes, you can only request this after/i, '太多次嘗試，等幾秒再試'],
    [/networkerror|failed to fetch|load failed|typeerror/i, '網絡連唔到，檢查下網絡再試'],
    [/invalid api key|apikey|unauthorized/i, '登入服務暫時有問題，請聯絡管理員']
  ];
  for (const [re, zh] of map) if (re.test(m)) return zh;
  // 已經係中文就直接出；否則畀通用訊息，唔暴露原始英文
  if (/[一-鿿]/.test(m)) return m;
  return '登入失敗，請稍後再試（持續失敗請聯絡管理員）';
}
function setAuthLoading(on) {
  const b1 = document.getElementById('btnSignIn');
  const b2 = document.getElementById('btnSignUp');
  if (b1) { b1.disabled = on; b1.textContent = on ? '處理中…' : '登入'; }
  if (b2) { b2.disabled = on; b2.textContent = on ? '處理中…' : '註冊新帳號'; }
}
async function authSignIn() {
  showAuthError('');
  const email = (document.getElementById('authEmail').value || '').trim();
  const pw = document.getElementById('authPw').value || '';
  if (!email || pw.length < 6) { showAuthError('請填正確 email 同至少 6 位密碼'); return; }
  setAuthLoading(true);
  try {
    await Auth.signIn(email, pw);
    await CloudSync.pullAll();
    showApp();
    if (!_appStarted) initApp();
  } catch (e) { showAuthError(friendlyAuthMsg(e.message)); }
  finally { setAuthLoading(false); }
}
async function authSignUp() {
  showAuthError('');
  const email = (document.getElementById('authEmail').value || '').trim();
  const pw = document.getElementById('authPw').value || '';
  if (!email || pw.length < 6) { showAuthError('請填 email 同至少 6 位密碼'); return; }
  setAuthLoading(true);
  try {
    await Auth.signUp(email, pw);
    if (Auth.isLoggedIn) {
      await CloudSync.pullAll();
      showApp();
      if (!_appStarted) initApp();
    } else {
      showAuthError('✅ 註冊成功！我哋已經 send 咗確認信去 ' + email + '，請撳入面嘅 link 啟用帳號，然後返嚟登入。（如果收唔到，可以叫我幫你關咗 email 確認）');
    }
  } catch (e) { showAuthError(friendlyAuthMsg(e.message)); }
  finally { setAuthLoading(false); }
}
async function authSignOut() {
  await Auth.signOut();
  location.reload();
}
function boot() {
  Auth.init();
  if (APP_CONFIG.cloudEnabled && !Auth.isLoggedIn) {
    showAuth();
  } else {
    showApp();
    if (APP_CONFIG.cloudEnabled && Auth.isLoggedIn) {
      CloudSync.pullAll().finally(() => { if (!_appStarted) initApp(); });
    } else {
      if (!_appStarted) initApp();
    }
  }
}

// Start app when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
