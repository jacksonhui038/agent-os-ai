// ===== update-prompt.js — 自動檢測新版本並提示同事刷新 =====
//
// 原理：每 60 秒 fetch 一次 version.json（cache-bust），同 localStorage 內
// 記住嘅版本對比，唔同就喺頂部彈 banner，提示「刷新頁面」先拎到新 code。
//
// 用法：喺 app.js boot() 內 call `UpdatePrompt.init()` 即可。
//
// 部署配套：每次改完 code 要 run `node bump_version.cjs`（會自動更新
// index.html 所有 `?v=` tag + 寫新 version.json），同事下次輪詢就會見到 banner。

(function () {
  'use strict';

  const POLL_MS = 60_000;          // 輪詢頻率（60s）
  const STORAGE_KEY = 'agent_os_seen_version';
  const VERSION_URL = 'version.json';
  const BANNER_ID = 'updatePromptBanner';

  let _timer = null;
  let _dismissedThisSession = false;

  function getCurrentVersion() {
    try {
      // 由 page 內任意 script tag 嘅 `?v=YYYYMMDD` 攞當前 build tag
      const scripts = document.querySelectorAll('script[src*="?v="]');
      if (scripts.length) {
        const m = scripts[0].src.match(/[?&]v=(\d{8})/);
        if (m) return `v${m[1]}`;
      }
      // fallback: 讀 meta tag（如果加咗嘅話）
      const meta = document.querySelector('meta[name="build-version"]');
      if (meta) return meta.getAttribute('content');
    } catch (_) {}
    return null;
  }

  function getSeenVersion() {
    try { return localStorage.getItem(STORAGE_KEY) || null; } catch (_) { return null; }
  }

  function setSeenVersion(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (_) {}
  }

  async function fetchRemoteVersion() {
    try {
      const url = VERSION_URL + '?t=' + Date.now();
      const res = await fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
      if (!res.ok) return null;
      const j = await res.json();
      return j && j.v ? j.v : null;
    } catch (_) {
      return null; // 離線 / 網絡問題 → 靜默 fail
    }
  }

  function showBanner(remoteV) {
    if (document.getElementById(BANNER_ID)) return;       // 已存在
    if (_dismissedThisSession) return;                    // 同事自己 close 咗

    const banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.className = 'update-prompt-banner';
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = `
      <span class="upb-icon" aria-hidden="true">🔔</span>
      <span class="upb-text">
        檢測到新的更新版本（<code>${escapeHtml(remoteV)}</code>）。您可以
        <a href="#" class="upb-refresh">刷新頁面</a>
        進行更新，以取得最新功能。
      </span>
      <button type="button" class="upb-close" aria-label="關閉提示">×</button>
    `;

    // 點 refresh → 完整 reload（避開 cache）+ 記低新版本避免再彈
    banner.querySelector('.upb-refresh').addEventListener('click', (e) => {
      e.preventDefault();
      setSeenVersion(remoteV);
      // 用 location.reload(true) 強制 reload，繞過 browser cache
      try { location.reload(true); } catch (_) { location.reload(); }
    });

    // 點 close → 今個 session 唔再彈（localStorage 唔更新，所以下次 deploy 仍會提示）
    banner.querySelector('.upb-close').addEventListener('click', () => {
      _dismissedThisSession = true;
      banner.classList.add('upb-hiding');
      setTimeout(() => banner.remove(), 220);
    });

    document.body.appendChild(banner);
    // 下一 frame trigger CSS transition
    requestAnimationFrame(() => banner.classList.add('upb-shown'));
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  async function checkOnce() {
    if (_dismissedThisSession) return;
    const remoteV = await fetchRemoteVersion();
    if (!remoteV) return;

    const seen = getSeenVersion();
    // 首次載入：記低當前嘅 remoteV（避免同事第一次 load 就見到 banner）
    if (!seen) {
      setSeenVersion(remoteV);
      return;
    }
    // 已見過同當前 remote 一致 → 唔彈
    if (seen === remoteV) return;

    // 同事 local 已經有舊 build，server 有新 build → 提示
    showBanner(remoteV);
  }

  function startPolling() {
    if (_timer) clearInterval(_timer);
    // 第一次延遲 5s（等 boot 完成），之後每 60s
    setTimeout(checkOnce, 5_000);
    _timer = setInterval(checkOnce, POLL_MS);
  }

  // 頁面喺背景 tab 時節流：visibilitychange 重新活躍時即刻 check 一次
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkOnce();
  });

  window.UpdatePrompt = {
    init: function () {
      const cur = getCurrentVersion();
      // 第一次 load：seed localStorage 為當前 build（避免初次彈）
      const seen = getSeenVersion();
      if (!seen && cur) setSeenVersion(cur);
      startPolling();
      // 對外暴露（debug / manual trigger）
      console.log('[UpdatePrompt] current build:', cur || '(unknown)', '| seen:', seen || '(unset)');
    },
    checkNow: checkOnce,
    getCurrentVersion
  };
})();
