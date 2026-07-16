// ===== Social.js — 社交內容引擎（一鍵出文案＋真正出圖）=====
(function() {
  let state = { type: 'post', templateId: 'pro-navy', last: null, lastHistoryId: null };
  // 系列模式（做 IG / 小紅書連載 set）：鎖定基底範本 + EP 編號 + 系列名
  let seriesState = { active: false, name: '', ep: 1, templateId: 'pro-navy' };
  // 真人／公仔頭像（用家 upload 或 AI 生成，留喺部機，唔上傳）
  let avatarImage = null;

  // 畫廊迷你預覽用嘅示範數據（按分類各有特色，唔再一式一樣「醫療保障規劃」）
  function sampleFor(tpl) {
    const samples = {
      '專業': { title: '專業分析：危疾險', tagline: '點買先聰明？', points: ['比較公司', '核保注意'] },
      '溫馨': { title: '媽媽必睇保障', tagline: '一家大細要點保？', points: ['小朋友醫療', '父母危疾'] },
      '數據': { title: '2026保費比較', tagline: '數據話你知', points: ['保費差異', '保障範圍'] },
      '極簡': { title: '一句講晒', tagline: '保障唔好遲', points: ['先保人', '再保財'] },
      '大字報': { title: '千祈唔好咁買！', tagline: '保險避坑指南', points: ['先 compare', '睇清條款'] },
      '漸變': { title: '靚靚理財法', tagline: '有型又穩陣', points: ['目標為本', '定期檢視'] },
      '醫療': { title: '醫療保障規劃', tagline: '你嘅保障夠未？', points: ['公院私院', '全家配置'] },
      '儲蓄': { title: '儲蓄計劃懶人包', tagline: '複利息滾存', points: ['每月供款', '提早退休'] },
      '招聘': { title: '招募理財夥伴', tagline: '一齊改變人生', points: ['專業培訓', '被動收入'] },
      '故事': { title: '幫客戶慳到30%', tagline: '真實個案分享', points: ['30歲家庭', '量身訂做'] },
      '柔和': { title: '新手媽咪保障', tagline: '溫柔規劃第一步', points: ['新手入門', '每月幾百'] },
      '高端': { title: '高淨值資產配置', tagline: '進階財富策略', points: ['稅務規劃', '家族傳承'] },
      '對比': { title: '儲蓄 vs 投資', tagline: '邊樣啱你？', points: ['風險比較', '目標為本'] },
      '分割': { title: '30歲 vs 40歲', tagline: '唔同年齡點規劃', points: ['保費差異', '保障缺口'] },
      '卡通': { title: '慳錢小秘笈', tagline: '卡通學理財', points: ['養成習慣', '先保護'] }
    };
    const cat = tpl.cat || '專業';
    const s = samples[cat] || samples['專業'];
    // 卡通範本用佢自己嘅 emoji 對白
    return {
      title: s.title,
      tagline: s.tagline,
      points: s.points
    };
  }

  // RedFox API 設定（前端用戶自填，唔 hardcode 入 repo）
  // 儲存優先落雲端（user_settings 表），換裝置 login 都會載返；localStorage 只作 fallback
  const REDFOX_BASE = 'https://redfox.hk/story/api';
  function getRedFoxKey() {
    // 1) 雲端同步落 local 嘅設定（主）
    let k = '';
    try { k = Storage.getSetting('redfoxKey') || ''; } catch {}
    if (k) return k;
    // 2) 舊 localStorage 兼容（升級前用過嘅）
    try { k = localStorage.getItem('agent_os_redfox_key') || ''; } catch {}
    return k;
  }
  function setRedFoxKey(key) {
    // 寫本地快取
    try { Storage.setSetting('redfoxKey', key || ''); } catch {}
    try { localStorage.setItem('agent_os_redfox_key', key || ''); } catch {}
    // 同步雲端（換裝置都有）
    if (typeof CloudSync !== 'undefined') CloudSync.pushSetting('redfoxKey', key || '');
  }

  function init() {
    document.querySelectorAll('[data-group="socialType"]').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('[data-group="socialType"]').forEach(s => s.classList.remove('active'));
        el.classList.add('active');
        state.type = el.dataset.val;
      });
    });
    document.querySelectorAll('.social-topic-chip').forEach(el => {
      el.addEventListener('click', () => {
        document.getElementById('socialTopic').value = el.dataset.val;
        document.querySelectorAll('.social-topic-chip').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
      });
    });
    buildGallery();
    renderRedFoxSetting();
    renderImageGenSetting();
    renderAvatarSetting();
    renderSeriesPanel();
    loadSeries();
    loadAvatarFromSession();
    migrateLegacyKey();
  }

  // 升級兼容：將舊 localStorage 個 key 喺雲端就緒時自動遷移去 user_settings（換裝置都有）
  function migrateLegacyKey() {
    try {
      const legacy = localStorage.getItem('agent_os_redfox_key') || '';
      const cloudOk = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.cloudEnabled) && (typeof Auth !== 'undefined' && Auth.isLoggedIn);
      if (legacy && !Storage.getSetting('redfoxKey') && cloudOk) {
        setRedFoxKey(legacy);
      }
    } catch {}
  }

  function renderRedFoxSetting() {
    const box = document.getElementById('redfoxSetting');
    if (!box) return;
    box.innerHTML = `
      <label class="form-label">RedFox API Key（即時搜範本用）</label>
      <div style="display:flex;gap:8px">
        <input type="password" class="form-input" id="redfoxKeyInput" placeholder="ak_xxxxxxxx" value="${escapeHtml(getRedFoxKey())}" style="flex:1">
        <button class="btn btn-sm btn-secondary" onclick="SocialModule.saveRedFoxKey()">儲存</button>
      </div>
      <p class="cover-tip">如未填寫，「即時搜範本」會用免費 Web 趨勢結果代替。Key 會同步去雲端（你嘅 user 設定），換 phone／換 browser 登入後都會自動載返，唔會冇咗。</p>
    `;
  }

  function saveRedFoxKey() {
    const el = document.getElementById('redfoxKeyInput');
    if (!el) return;
    setRedFoxKey(el.value.trim());
    alert('RedFox API Key 已儲存，並同步去雲端（換裝置登入都會有）。');
  }

  // ===== AI 圖片生成設定（用戶自填 API Key，可選） =====
  const IMAGEGEN_PROVIDERS = [
    { id:'siliconflow', name:'SiliconFlow', endpoint:'https://api.siliconflow.cn/v1/images/generations', model:'Kwai-Kolors/Kolors' },
    { id:'openrouter', name:'OpenRouter', endpoint:'https://openrouter.ai/api/v1/images/generations', model:'openai/dall-e-3' }
  ];
  function getImageGenKey() {
    let k = '';
    try { k = Storage.getSetting('imageGenKey') || ''; } catch {}
    return k;
  }
  function setImageGenKey(key) {
    try { Storage.setSetting('imageGenKey', key || ''); } catch {}
    if (typeof CloudSync !== 'undefined') CloudSync.pushSetting('imageGenKey', key || '');
  }
  function getImageGenProvider() {
    let p = 'siliconflow';
    try { p = Storage.getSetting('imageGenProvider') || 'siliconflow'; } catch {}
    return p;
  }
  function setImageGenProvider(p) {
    try { Storage.setSetting('imageGenProvider', p || 'siliconflow'); } catch {}
    if (typeof CloudSync !== 'undefined') CloudSync.pushSetting('imageGenProvider', p || 'siliconflow');
  }
  function getUseAiBackground() {
    try { return Storage.getSetting('useAiBackground') === 'true'; } catch { return false; }
  }
  function setUseAiBackground(v) {
    try { Storage.setSetting('useAiBackground', v ? 'true' : 'false'); } catch {}
    if (typeof CloudSync !== 'undefined') CloudSync.pushSetting('useAiBackground', v ? 'true' : 'false');
  }

  function renderImageGenSetting() {
    const box = document.getElementById('imageGenSetting');
    if (!box) return;
    const prov = getImageGenProvider();
    box.innerHTML = `
      <label class="form-label">🎨 AI 封面背景（可選）</label>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
        <select class="form-input" id="imageGenProvider" style="width:auto;min-width:120px">
          ${IMAGEGEN_PROVIDERS.map(p => `<option value="${p.id}" ${p.id === prov ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
        </select>
        <input type="password" class="form-input" id="imageGenKeyInput" placeholder="sk-xxxxxxxx" value="${escapeHtml(getImageGenKey())}" style="flex:1">
        <button class="btn btn-sm btn-secondary" onclick="SocialModule.saveImageGenKey()">儲存</button>
      </div>
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);cursor:pointer;margin-bottom:6px">
        <input type="checkbox" id="useAiBackground" ${getUseAiBackground() ? 'checked' : ''} onchange="SocialModule.toggleAiBackground(this)">
        生成時用 AI 畫背景（需要 API Key，會消耗 token）
      </label>
      <p class="cover-tip">有 Key 時會按主題生成背景圖，再疊上標題同資料；冇 Key 或唔剔就沿用現有 Canvas 背景。Key 同樣會同步去雲端。</p>
    `;
  }

  function saveImageGenKey() {
    const keyEl = document.getElementById('imageGenKeyInput');
    const provEl = document.getElementById('imageGenProvider');
    if (keyEl) setImageGenKey(keyEl.value.trim());
    if (provEl) setImageGenProvider(provEl.value);
    alert('AI 圖片設定已儲存。');
  }

  function toggleAiBackground(cb) {
    setUseAiBackground(cb && cb.checked);
  }

  // ===== 真人／公仔頭像（upload 即時用，唔使 key）=====
  function renderAvatarSetting() {
    const box = document.getElementById('avatarSetting');
    if (!box) return;
    box.innerHTML = `
      <label class="form-label">🧑‍💼 真人／公仔頭像（用於「真人風」範本，即刻用唔使 key）</label>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input type="file" id="avatarUpload" accept="image/*" class="form-input" style="flex:1;min-width:160px">
        <button class="btn btn-sm btn-secondary" onclick="SocialModule.useAiAvatar()">🤖 AI 頭像</button>
        <button class="btn btn-sm btn-ghost" onclick="SocialModule.clearAvatar()">清除</button>
      </div>
      <p class="cover-tip">上傳你嘅相（或半身照），揀「真人風」範本（Alfred 風 / 型格真人 / 親和真人）就會自動疊上大字，似 Alfred 嗰種「真人 + 大字」。相只會留喺你部機（sessionStorage），唔會上傳去任何人。</p>
    `;
    const up = document.getElementById('avatarUpload');
    if (up) up.addEventListener('change', handleAvatarUpload);
  }

  function handleAvatarUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => { avatarImage = img; try { sessionStorage.setItem('agent_os_avatar', reader.result); } catch {} rerenderIfLast(); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function loadAvatarFromSession() {
    try {
      const d = sessionStorage.getItem('agent_os_avatar');
      if (!d) return;
      const img = new Image();
      img.onload = () => { avatarImage = img; };
      img.src = d;
    } catch {}
  }

  function clearAvatar() {
    avatarImage = null;
    try { sessionStorage.removeItem('agent_os_avatar'); } catch {}
    const up = document.getElementById('avatarUpload'); if (up) up.value = '';
    rerenderIfLast();
  }

  async function useAiAvatar() {
    const key = getImageGenKey();
    if (!key) { alert('請先喺上方填寫 AI 圖片 API Key，先用「🤖 AI 頭像」生成 3D 風頭像。'); return; }
    try {
      const url = await generateAiImage('a professional 3D rendered avatar of a friendly Hong Kong male insurance advisor, studio lighting, plain dark background, no text, cinematic, high detail');
      avatarImage = await loadImage(url);
      try { sessionStorage.setItem('agent_os_avatar', url); } catch {}
      rerenderIfLast();
      alert('AI 頭像已生成！揀「真人風」範本即可疊上大字。');
    } catch (e) { alert('AI 頭像生成失敗：' + e.message); }
  }

  function rerenderIfLast() {
    if (state.last && document.getElementById('socialCanvas')) rerenderWithSelected();
  }

  // ===== 系列模式（IG / 小紅書連載 set）=====
  function renderSeriesPanel() {
    const box = document.getElementById('seriesPanel');
    if (!box) return;
    const opts = (typeof COVER_TEMPLATES !== 'undefined' ? COVER_TEMPLATES : [])
      .map(t => `<option value="${t.id}" ${t.id === seriesState.templateId ? 'selected' : ''}>${escapeHtml(t.cat)} · ${escapeHtml(t.name)}</option>`).join('');
    box.innerHTML = `
      <label class="form-label">🎬 系列模式（做 IG / 小紅書連載 set，成組圖視覺一致）</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <input type="text" id="seriesName" placeholder="系列名稱，例：每周危疾教室" class="form-input" style="flex:1;min-width:150px" value="${escapeHtml(seriesState.name)}">
        <select id="seriesBase" class="form-input" style="width:auto;min-width:150px">${opts}</select>
        <input type="number" id="seriesEp" value="${seriesState.ep}" min="1" class="form-input" style="width:72px" title="起始 EP 編號">
      </div>
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;margin-bottom:6px">
        <input type="checkbox" id="seriesActive" ${seriesState.active ? 'checked' : ''} onchange="SocialModule.toggleSeries(this)"> 啟動系列（生成時自動用基底範本 + 加 EP 徽章）
      </label>
      <p class="cover-tip">系列會自動幫你鎖定一款風格基底，出每一張圖都加「EP.x」徽章同系列名，成組圖視覺一致。EP 編號每次生成自動 +1。</p>
    `;
  }

  function toggleSeries(cb) {
    seriesState.active = !!cb.checked;
    const baseEl = document.getElementById('seriesBase');
    const nameEl = document.getElementById('seriesName');
    const epEl = document.getElementById('seriesEp');
    if (baseEl) seriesState.templateId = baseEl.value;
    if (nameEl) seriesState.name = nameEl.value.trim();
    if (epEl) seriesState.ep = parseInt(epEl.value, 10) || 1;
    if (seriesState.active) {
      state.templateId = seriesState.templateId;
      buildGallery();
    }
    saveSeries();
  }

  function saveSeries() {
    try { Storage.setSetting('series', JSON.stringify(seriesState)); } catch {}
    if (typeof CloudSync !== 'undefined') CloudSync.pushSetting('series', JSON.stringify(seriesState));
  }

  function loadSeries() {
    try {
      const raw = Storage.getSetting('series');
      if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object') seriesState = Object.assign(seriesState, o); }
    } catch {}
    const cb = document.getElementById('seriesActive'); if (cb) cb.checked = seriesState.active;
    const nm = document.getElementById('seriesName'); if (nm) nm.value = seriesState.name || '';
    const bs = document.getElementById('seriesBase'); if (bs) bs.value = seriesState.templateId;
    const ep = document.getElementById('seriesEp'); if (ep) ep.value = seriesState.ep;
    if (seriesState.active) { state.templateId = seriesState.templateId; buildGallery(); }
  }

  async function generateAiImage(prompt) {
    const key = getImageGenKey();
    if (!key) throw new Error('未填寫 AI 圖片 API Key');
    const provider = IMAGEGEN_PROVIDERS.find(p => p.id === getImageGenProvider()) || IMAGEGEN_PROVIDERS[0];
    const body = JSON.stringify({
      model: provider.model,
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url'
    });
    const res = await fetch(provider.endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`AI 生圖失敗 (${res.status}): ${txt}`);
    }
    const json = await res.json();
    const url = json && json.data && json.data[0] && (json.data[0].url || json.data[0].b64_json);
    if (!url) throw new Error('AI 生圖回應冇圖片 URL');
    return url;
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('圖片載入失敗，可能是 CORS 限制'));
      img.src = url;
    });
  }

  // ===== 範本畫廊 =====
  function buildGallery() {
    const wrap = document.getElementById('socialTemplateGallery');
    if (!wrap) return;
    wrap.innerHTML = '';
    (typeof COVER_TEMPLATES !== 'undefined' ? COVER_TEMPLATES : []).forEach(tpl => {
      const card = document.createElement('div');
      card.className = 'tpl-card' + (tpl.id === state.templateId ? ' selected' : '');
      card.dataset.tpl = tpl.id;
      const cv = document.createElement('canvas');
      cv.width = 220; cv.height = 275; cv.className = 'tpl-canvas';
      card.appendChild(cv);
      const label = document.createElement('div');
      label.className = 'tpl-label';
      const icon = tpl.mascot ? `${tpl.mascot} ` : '';
      label.innerHTML = `<span class="tpl-cat" style="background:${tpl.accent};color:${tpl.badge && tpl.badge.color ? tpl.badge.color : '#fff'}">${escapeHtml(tpl.cat)}</span>${icon}${escapeHtml(tpl.name)}`;
      card.appendChild(label);
      card.onclick = () => {
        state.templateId = tpl.id;
        document.querySelectorAll('.tpl-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        if (document.getElementById('socialCanvas')) rerenderWithSelected();
      };
      wrap.appendChild(card);
      renderCover(cv, tpl, sampleFor(tpl));
    });
  }

  // ===== 比例 → 像素 =====
  function ratioToDims(ratio) {
    switch (ratio) {
      case '1:1': return { w: 1080, h: 1080 };
      case '4:5': return { w: 1080, h: 1350 };
      case '16:9': return { w: 1920, h: 1080 };
      case '9:16': return { w: 1080, h: 1920 };
      default: return { w: 1080, h: 1350 };
    }
  }

  // ===== Canvas 出圖（核心）=====
  function renderCover(canvas, tpl, data, bgImage) {
    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return; // 無 2d context（如測試環境）就跳過
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // 若有 AI 生成背景圖，先畫（保持漸變底以防載唔到）
    if (bgImage && bgImage.width) {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, tpl.bg.from);
      g.addColorStop(1, tpl.bg.to);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // cover 模式：保持比例填滿 canvas
      const scale = Math.max(W / bgImage.width, H / bgImage.height);
      const dw = bgImage.width * scale, dh = bgImage.height * scale;
      const dx = (W - dw) / 2, dy = (H - dh) / 2;
      ctx.globalAlpha = 0.92;
      ctx.drawImage(bgImage, dx, dy, dw, dh);
      ctx.globalAlpha = 1;
      // 加暗色遮罩令文字清晰（寫實風格用更淡遮罩，畀 AI 圖透出嚟）
      ctx.fillStyle = 'rgba(0,0,0,' + (tpl.layout === 'photo' ? 0.22 : 0.35) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      // 背景漸變
      const g = tpl.bg.dir === 'd'
        ? ctx.createLinearGradient(0, 0, W, H)
        : ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, tpl.bg.from);
      g.addColorStop(1, tpl.bg.to);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    // 淺色範本加邊框
    if (tpl.border) {
      ctx.strokeStyle = tpl.accent;
      ctx.lineWidth = Math.max(6, W * 0.012);
      ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
    }

    if (tpl.decor && tpl.decor !== 'none' && tpl.layout !== 'photo') drawDecor(ctx, tpl, W, H);

    // 預先計算常用尺寸
    const pad = W * 0.07;
    const base = Math.min(W, H);
    const portrait = H >= W;
    const titleSize = Math.round(base * (portrait ? 0.14 : 0.17));
    const font = (wt, size) => `${wt} ${Math.round(size)}px "PingFang SC","Microsoft YaHei","Heiti SC","Noto Sans CJK SC",sans-serif`;

    // 按範本風格分派繪製
    if (tpl.layout === 'luxury' || tpl.layout === 'person') renderLuxuryLayout(ctx, tpl, data, W, H, pad, base, titleSize, font);
    else if (tpl.layout === 'infographic') renderInfographicLayout(ctx, tpl, data, W, H, pad, base, titleSize, font);
    else if (tpl.layout === 'compare') renderCompareLayout(ctx, tpl, data, W, H, pad, base, titleSize, font);
    else if (tpl.layout === 'comic') renderComicLayout(ctx, tpl, data, W, H, pad, base, titleSize, font);
    else if (tpl.layout === 'cute') renderCuteLayout(ctx, tpl, data, W, H, pad, base, titleSize, font);
    else if (tpl.layout === 'photo') renderPhotoLayout(ctx, tpl, data, W, H, pad, base, titleSize, font);
    else renderDefaultLayout(ctx, tpl, data, W, H, pad, base, titleSize, font);

    // 系列 EP 徽章（所有風格通用，右上角）
    drawSeriesBadge(ctx, tpl, W, H, pad, titleSize, font);
  }

  // 寫實大片佈局（photo）：極簡大字，畀 AI 背景透出嚟，似片中美工
  function renderPhotoLayout(ctx, tpl, data, W, H, pad, base, titleSize, font) {
    const cx = W / 2;
    const wide = W > H * 1.4; // FB 橫幅比例
    const tSize = Math.round(base * (wide ? 0.13 : 0.115));
    const tagSize = Math.round(base * (wide ? 0.05 : 0.058));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let y = H * (wide ? 0.36 : 0.30);

    ctx.fillStyle = tpl.titleColor || '#ffffff';
    ctx.font = font(tpl.titleWeight || 900, tSize);
    const titleLines = wrapText(ctx, data.title || '', tSize, W - pad * 2, 2);
    titleLines.forEach((ln, i) => ctx.fillText(ln, cx, y + i * tSize * 1.06));
    y += titleLines.length * tSize * 1.06;

    if (data.tagline) {
      ctx.fillStyle = tpl.subColor || '#e6eefb';
      ctx.font = font(500, tagSize);
      const subLines = wrapText(ctx, data.tagline, tagSize, W - pad * 2.2, 2);
      subLines.forEach((ln, i) => ctx.fillText(ln, cx, y + tagSize * 0.7 + i * tagSize * 1.08));
      y += subLines.length * tagSize * 1.08 + tagSize * 0.3;
    }

    // 直式 / 方形：底部排 2-3 個金點重點；橫幅就唔出（留白）
    if (!wide && data.points && data.points.length) {
      const pts = data.points.slice(0, 3);
      const pl = Math.round(base * 0.046);
      pts.forEach((p, i) => {
        const ly = H - pad * 1.0 - (pts.length - 1 - i) * base * 0.062;
        ctx.fillStyle = tpl.accent || '#f5c518';
        ctx.beginPath(); ctx.arc(cx - base * 0.21, ly, base * 0.011, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = tpl.bulletColor || '#f0f4fb';
        ctx.font = font(600, pl);
        ctx.textAlign = 'left';
        const txt = (wrapText(ctx, p, pl, W * 0.40, 1)[0] || p);
        ctx.fillText(txt, cx - base * 0.19, ly);
        ctx.textAlign = 'center';
      });
    }

    if (tpl.footer && tpl.footer.text) {
      ctx.textAlign = 'left';
      ctx.font = font(500, Math.round(W * 0.026));
      ctx.fillStyle = tpl.footer.color || 'rgba(255,255,255,0.85)';
      ctx.fillText(tpl.footer.text, pad, H - pad * 0.7);
    }
    ctx.textAlign = 'left';
  }

  // 預設佈局（原有邏輯）
  function renderDefaultLayout(ctx, tpl, data, W, H, pad, base, titleSize, font) {
    let y = pad;

    // 右下角公仔 + 氣泡佔用右欄，文字區要預留足夠空間
    const hasBubble = !!tpl.bubble;
    const hasMascot = !!tpl.mascot;
    const rightColW = hasBubble ? W * 0.30 : (hasMascot ? base * 0.22 : 0);
    const textMaxW = W - pad * 2 - (rightColW ? rightColW + W * 0.03 : 0);
    const effectiveTextW = Math.max(textMaxW, W * 0.50); // 最少都要有 50% 闊度

    // 頂部 badge
    if (tpl.badge) {
      ctx.font = font(700, Math.round(W * 0.032));
      const tw = ctx.measureText(tpl.badge.text).width;
      const bh = W * 0.058, bw = tw + W * 0.05, bx = pad, by = pad;
      ctx.fillStyle = tpl.badge.bg;
      roundRect(ctx, bx, by, bw, bh, bh * 0.3); ctx.fill();
      ctx.fillStyle = tpl.badge.color;
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText(tpl.badge.text, bx + W * 0.025, by + bh / 2);
      y = by + bh + W * 0.05;
    }

    // 標題（大字）—— 預留右邊公仔位
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillStyle = tpl.titleColor;
    const titleFont = font(tpl.titleWeight, titleSize);
    const lines = wrapText(ctx, data.title, titleFont, effectiveTextW, 3);
    lines.forEach((ln, i) => ctx.fillText(ln, pad, y + i * titleSize * 1.18));
    y += lines.length * titleSize * 1.18 + W * 0.03;

    // 副標題（tagline）
    if (data.tagline) {
      ctx.fillStyle = tpl.subColor;
      const subFont = font(600, Math.round(titleSize * 0.40));
      const sl = wrapText(ctx, data.tagline, subFont, effectiveTextW, 2);
      sl.forEach((ln, i) => ctx.fillText(ln, pad, y + i * titleSize * 0.5));
      y += sl.length * titleSize * 0.5 + W * 0.03;
    }

    // 要點（bullet）—— 預留底部 footer 同氣泡/公仔空間
    if (data.points && data.points.length) {
      const bFont = font(600, Math.round(titleSize * 0.34));
      let by2 = y;
      const footerReserve = titleSize * 0.9;
      const bubbleReserve = tpl.bubble ? base * 0.30 : 0;
      const mascotReserve = tpl.mascot ? base * 0.22 : 0;
      const maxBottom = H - pad - footerReserve - Math.max(bubbleReserve, mascotReserve);
      data.points.slice(0, 3).forEach(pt => {
        if (by2 >= maxBottom) return;
        const bl = wrapText(ctx, pt, bFont, effectiveTextW - W * 0.04, 2);
        if (by2 + bl.length * titleSize * 0.4 > maxBottom) {
          ctx.font = font(500, Math.round(titleSize * 0.29));
          return;
        }
        ctx.fillStyle = tpl.accent;
        ctx.beginPath();
        ctx.arc(pad + W * 0.012, by2 + titleSize * 0.34 * 0.5, W * 0.009, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = tpl.bulletColor;
        bl.forEach((ln, i) => ctx.fillText(ln, pad + W * 0.035, by2 + i * titleSize * 0.4));
        by2 += bl.length * titleSize * 0.4 + W * 0.015;
      });
      y = by2;
    }

    // 對話氣泡（放喺右下角公仔上面，一定低過內容）
    if (tpl.bubble) drawBubble(ctx, tpl, W, H, pad, base, y);

    // 卡通主角 emoji（右下角貼紙，唔遮住標題）
    if (tpl.mascot) drawMascotSticker(ctx, tpl, W, H, pad, base);

    drawFooter(ctx, tpl, W, H, pad, titleSize, font);
  }

  // 右下角公仔貼紙（統一樣式：白色圓底 + 陰影）
  function drawMascotSticker(ctx, tpl, W, H, pad, base) {
    if (!tpl.mascot) return;
    const size = Math.round(base * 0.13);
    const cx = W - pad - size * 0.5;
    const cy = H - pad - size * 0.5 - W * 0.025; // 留少少位畀 footer
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = W * 0.02;
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.beginPath(); ctx.arc(cx, cy, size * 0.78, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.font = `${size}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(tpl.mascot, cx, cy + size * 0.02);
  }

  // 深色高端大字風（Alfred 風：黑底 + 金/白字 + 城市天際線 + 真人頭像）
  function renderLuxuryLayout(ctx, tpl, data, W, H, pad, base, titleSize, font) {
    const hasAvatar = !!(tpl.avatar && avatarImage && avatarImage.width);

    if (hasAvatar) {
      // 右半部畫頭像（cover fit）
      const ax = W * 0.50, aw = W * 0.50, ah = H;
      const scale = Math.max(aw / avatarImage.width, ah / avatarImage.height);
      const dw = avatarImage.width * scale, dh = avatarImage.height * scale;
      const dx = ax + (aw - dw) / 2, dy = (ah - dh) / 2;
      ctx.save();
      ctx.beginPath(); ctx.rect(ax, 0, aw, ah); ctx.clip();
      ctx.drawImage(avatarImage, dx, dy, dw, dh);
      ctx.restore();
      // 左暗右淡遮罩，令文字位清晰
      const mg = ctx.createLinearGradient(0, 0, ax + aw * 0.6, 0);
      mg.addColorStop(0, 'rgba(0,0,0,0.85)'); mg.addColorStop(0.55, 'rgba(0,0,0,0.45)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);
      const mgR = ctx.createLinearGradient(W, 0, W * 0.55, 0);
      mgR.addColorStop(0, 'rgba(0,0,0,0.30)'); mgR.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = mgR; ctx.fillRect(0, 0, W, H);
      drawSkyline(ctx, W, H, tpl.accent, ax);
    } else {
      drawSkyline(ctx, W, H, tpl.accent);
      drawVignette(ctx, W, H);
      const spot = ctx.createRadialGradient(W * 0.5, H * 0.4, W * 0.04, W * 0.5, H * 0.4, W * 0.7);
      spot.addColorStop(0, 'rgba(255,255,255,0.10)'); spot.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = spot; ctx.fillRect(0, 0, W, H);
      if (tpl.avatar) drawAvatarPlaceholder(ctx, W, H, pad, base, font);
    }

    // 文字區：如果有頭像位，預留右邊空間
    const leftZone = tpl.avatar ? Math.min(W * 0.58, W - pad * 2 - base * 0.18) : W - pad * 2;
    const tx = pad;
    let y = pad + (tpl.badge ? W * 0.12 : 0);

    // 標題（金漸變字）
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const luxTitleSize = Math.round(titleSize * (hasAvatar ? 1.05 : 1.15));
    const titleFont = font(tpl.titleWeight, luxTitleSize);
    const lines = wrapText(ctx, data.title, titleFont, leftZone, 3);
    const goldGrad = ctx.createLinearGradient(tx, y, tx, y + lines.length * luxTitleSize * 1.15);
    goldGrad.addColorStop(0, '#fff7d6'); goldGrad.addColorStop(0.5, tpl.subColor || '#d4af37'); goldGrad.addColorStop(1, '#b8860b');
    lines.forEach((ln, i) => {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = W * 0.015;
      ctx.fillStyle = goldGrad;
      ctx.fillText(ln, tx, y + i * luxTitleSize * 1.15);
      ctx.restore();
    });
    y += lines.length * luxTitleSize * 1.15 + W * 0.02;

    // 副標題
    if (data.tagline) {
      ctx.fillStyle = '#f5f5f5';
      ctx.font = font(600, Math.round(luxTitleSize * 0.34));
      const sl = wrapText(ctx, data.tagline, ctx.font, leftZone, 2);
      sl.forEach((ln, i) => ctx.fillText(ln, tx, y + i * luxTitleSize * 0.4));
      y += sl.length * luxTitleSize * 0.4 + W * 0.02;
    }

    // bullet
    if (data.points && data.points.length) {
      const bFont = font(500, Math.round(titleSize * 0.30));
      data.points.slice(0, 2).forEach(pt => {
        ctx.fillStyle = tpl.accent;
        ctx.beginPath(); ctx.arc(tx + W * 0.01, y + titleSize * 0.3 * 0.5, W * 0.008, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e5e5e5';
        ctx.font = bFont;
        const bl = wrapText(ctx, pt, bFont, leftZone - W * 0.04, 2);
        bl.forEach((ln, i) => ctx.fillText(ln, tx + W * 0.03, y + i * titleSize * 0.36));
        y += bl.length * titleSize * 0.36 + W * 0.015;
      });
    }

    drawFooter(ctx, tpl, W, H, pad, titleSize, font);
  }

  // 真人風無頭像時嘅提示貼紙（右下角，唔遮住文字）
  function drawAvatarPlaceholder(ctx, W, H, pad, base, font) {
    const r = base * 0.13;
    const cx = W - pad - r;
    const cy = H - pad - r - W * 0.025; // 留位畀 footer
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.setLineDash([W * 0.018, W * 0.018]);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = W * 0.005;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = `${Math.round(r * 0.95)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🙂', cx, cy - r * 0.08);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = font(600, W * 0.022);
    ctx.fillText('上傳你嘅相', cx, cy + r * 0.55);
    ctx.restore();
  }

  // 城市天際線剪影
  function drawSkyline(ctx, W, H, color, fromX) {
    const fx = fromX || 0;
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = color;
    const baseY = H * 0.94;
    let seed = 99173;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    let x = fx;
    while (x < W) {
      const bw = W * (0.035 + rnd() * 0.06);
      const bh = H * (0.10 + rnd() * 0.24);
      ctx.fillRect(x, baseY - bh, bw, bh + H);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#fff3c4';
      for (let wy = baseY - bh + H * 0.02; wy < baseY; wy += H * 0.03) {
        for (let wx = x + bw * 0.2; wx < x + bw * 0.85; wx += bw * 0.28) {
          if (rnd() > 0.5) ctx.fillRect(wx, wy, W * 0.006, H * 0.012);
        }
      }
      ctx.globalAlpha = 0.28; ctx.fillStyle = color;
      x += bw + W * 0.012;
    }
    ctx.restore();
  }

  // 暗角
  function drawVignette(ctx, W, H) {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.28, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // 系列 EP 徽章（右上角）
  function drawSeriesBadge(ctx, tpl, W, H, pad, titleSize, font) {
    if (!seriesState.active) return;
    const label = `EP.${seriesState.ep}`;
    ctx.save();
    ctx.font = font(800, Math.round(W * 0.032));
    const tw = ctx.measureText(label).width;
    const bh = W * 0.062, bw = tw + W * 0.05;
    const bx = W - pad - bw, by = pad;
    ctx.fillStyle = tpl.accent;
    roundRect(ctx, bx, by, bw, bh, bh * 0.32); ctx.fill();
    ctx.fillStyle = getContrastColor(tpl.accent);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + W * 0.025, by + bh / 2);
    if (seriesState.name) {
      ctx.font = font(600, Math.round(W * 0.022));
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(seriesState.name, W - pad, by - W * 0.012);
    }
    ctx.restore();
  }

  // hex → rgba
  function hexToRgba(hex, a) {
    const c = (hex || '#000000').replace('#', '');
    const r = parseInt(c.substr(0, 2), 16) || 0;
    const g = parseInt(c.substr(2, 2), 16) || 0;
    const b = parseInt(c.substr(4, 2), 16) || 0;
    return `rgba(${r},${g},${b},${a})`;
  }

  // 資訊圖表步驟風（連接路徑 + 編號圖標卡，參考 hkwealthylife）
  function renderInfographicLayout(ctx, tpl, data, W, H, pad, base, titleSize, font) {
    let y = pad;

    // badge
    if (tpl.badge) {
      ctx.font = font(700, Math.round(W * 0.032));
      const tw = ctx.measureText(tpl.badge.text).width;
      const bh = W * 0.058, bw = tw + W * 0.05, bx = pad, by = pad;
      ctx.fillStyle = tpl.badge.bg;
      roundRect(ctx, bx, by, bw, bh, bh * 0.3); ctx.fill();
      ctx.fillStyle = tpl.badge.color;
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText(tpl.badge.text, bx + W * 0.025, by + bh / 2);
      y = by + bh + W * 0.04;
    }

    // 標題
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillStyle = tpl.titleColor;
    const titleFont = font(tpl.titleWeight, Math.round(titleSize * 0.92));
    const lines = wrapText(ctx, data.title, titleFont, W - pad * 2, 2);
    lines.forEach((ln, i) => ctx.fillText(ln, pad, y + i * titleSize * 1.05));
    y += lines.length * titleSize * 1.05 + W * 0.03;

    // 副標題
    if (data.tagline) {
      ctx.fillStyle = tpl.subColor;
      ctx.font = font(600, Math.round(titleSize * 0.38));
      ctx.fillText(data.tagline, pad, y);
      y += titleSize * 0.55;
    }

    // 步驟：連接線 + 編號圓 + emoji 圖標 + 卡片
    const steps = (data.points || []).slice(0, 3);
    const icons = ['💡', '📌', '🚀', '✅', '💰', '📈', '🛡️', '📊', '🎯'];
    const areaY = y + W * 0.02;
    const areaH = H - areaY - pad * 2.4;
    const stepH = areaH / Math.max(steps.length, 1);
    const lineX = pad + W * 0.10;

    // 垂直連接線
    if (steps.length > 1) {
      ctx.strokeStyle = tpl.accent; ctx.lineWidth = W * 0.01; ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(lineX, areaY + stepH / 2);
      ctx.lineTo(lineX, areaY + areaH - stepH / 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    steps.forEach((pt, idx) => {
      const cy = areaY + stepH * idx + stepH / 2;
      const cardY = cy - stepH * 0.40, cardH = stepH * 0.80;
      // 卡片底（accent 淡色）
      ctx.fillStyle = hexToRgba(tpl.accent, 0.12);
      roundRect(ctx, pad, cardY, W - pad * 2, cardH, W * 0.02); ctx.fill();

      // 編號圓
      const r = Math.min(W * 0.075, stepH * 0.34);
      ctx.fillStyle = tpl.accent;
      ctx.beginPath(); ctx.arc(lineX, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = font(800, Math.round(r * 0.9));
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(idx + 1), lineX, cy + r * 0.05);

      // emoji 圖標
      const ir = r * 0.85;
      ctx.font = `${Math.round(ir * 1.4)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
      ctx.fillText(icons[idx % icons.length], lineX + r * 1.9, cy);

      // 文字
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = tpl.bulletColor;
      ctx.font = font(700, Math.round(titleSize * 0.36));
      const textX = lineX + r * 3.1;
      const textW = W - pad - textX - W * 0.03;
      const tl = wrapText(ctx, pt, ctx.font, textW, 2);
      const lh = titleSize * 0.42;
      tl.forEach((ln, i) => ctx.fillText(ln, textX, cy + (i - (tl.length - 1) / 2) * lh));
    });

    drawFooter(ctx, tpl, W, H, pad, titleSize, font);
  }

  // 對比表格風（Expectation vs Reality / Before vs After）
  function renderCompareLayout(ctx, tpl, data, W, H, pad, base, titleSize, font) {
    let y = pad;

    // badge
    if (tpl.badge) {
      ctx.font = font(700, Math.round(W * 0.032));
      const tw = ctx.measureText(tpl.badge.text).width;
      const bh = W * 0.058, bw = tw + W * 0.05, bx = pad, by = pad;
      ctx.fillStyle = tpl.badge.bg;
      roundRect(ctx, bx, by, bw, bh, bh * 0.3); ctx.fill();
      ctx.fillStyle = tpl.badge.color;
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText(tpl.badge.text, bx + W * 0.025, by + bh / 2);
      y = by + bh + W * 0.04;
    }

    // 標題
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillStyle = tpl.titleColor;
    const titleFont = font(tpl.titleWeight, Math.round(titleSize * 0.95));
    const lines = wrapText(ctx, data.title, titleFont, W - pad * 2, 2);
    lines.forEach((ln, i) => ctx.fillText(ln, pad, y + i * titleSize * 1.05));
    y += lines.length * titleSize * 1.05 + W * 0.035;

    // 副標題
    if (data.tagline) {
      ctx.fillStyle = tpl.subColor;
      ctx.font = font(600, Math.round(titleSize * 0.38));
      ctx.fillText(data.tagline, pad, y);
      y += titleSize * 0.55;
    }

    const labels = tpl.compareLabels || ['Expectation', 'Reality'];
    const colW = (W - pad * 2 - W * 0.03) / 2;
    const startX = pad;
    const tableY = y + W * 0.02;
    const rowH = titleSize * 0.52;
    const headerH = titleSize * 0.6;
    const rows = Math.min((data.points || []).length, 3);
    const tableH = headerH + rows * rowH + W * 0.02;

    // 表頭背景
    ctx.fillStyle = tpl.accent;
    roundRect(ctx, startX, tableY, colW, headerH, W * 0.02); ctx.fill();
    ctx.fillStyle = tpl.border ? tpl.accent : '#ffffff';
    roundRect(ctx, startX + colW + W * 0.03, tableY, colW, headerH, W * 0.02); ctx.fill();

    // 表頭字
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = getContrastColor(tpl.accent);
    ctx.font = font(700, Math.round(titleSize * 0.32));
    ctx.fillText(labels[0], startX + colW / 2, tableY + headerH / 2);
    ctx.fillStyle = tpl.border ? getContrastColor(tpl.accent) : '#ffffff';
    ctx.fillText(labels[1] || 'Reality', startX + colW + W * 0.03 + colW / 2, tableY + headerH / 2);

    // 分隔線
    ctx.strokeStyle = 'rgba(128,128,128,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= rows; i++) {
      const ly = tableY + headerH + i * rowH;
      ctx.beginPath(); ctx.moveTo(startX, ly); ctx.lineTo(startX + colW * 2 + W * 0.03, ly); ctx.stroke();
    }

    // 內容
    ctx.font = font(600, Math.round(titleSize * 0.29));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    (data.points || []).slice(0, rows).forEach((pt, idx) => {
      const parts = String(pt).split('|');
      const left = parts[0] || pt;
      const right = parts[1] || '現實往往唔同…';
      const cy = tableY + headerH + idx * rowH + rowH / 2;
      ctx.fillStyle = tpl.titleColor;
      const lw = wrapText(ctx, left, ctx.font, colW - W * 0.03, 2);
      lw.forEach((ln, i) => ctx.fillText(ln, startX + colW / 2, cy + (i - (lw.length - 1) / 2) * titleSize * 0.26));
      ctx.fillStyle = tpl.accent;
      const rw = wrapText(ctx, right, ctx.font, colW - W * 0.03, 2);
      rw.forEach((ln, i) => ctx.fillText(ln, startX + colW + W * 0.03 + colW / 2, cy + (i - (rw.length - 1) / 2) * titleSize * 0.26));
    });

    drawFooter(ctx, tpl, W, H, pad, titleSize, font);
  }

  // 漫畫爆炸框風（半調網點 + 立體陰影爆炸框，參考 ACT Perspective）
  function renderComicLayout(ctx, tpl, data, W, H, pad, base, titleSize, font) {
    let y = pad;

    // 半調網點背景
    drawHalftone(ctx, W, H, tpl.accent);

    // badge
    if (tpl.badge) {
      ctx.font = font(700, Math.round(W * 0.032));
      const tw = ctx.measureText(tpl.badge.text).width;
      const bh = W * 0.058, bw = tw + W * 0.05, bx = pad, by = pad;
      ctx.fillStyle = tpl.badge.bg;
      roundRect(ctx, bx, by, bw, bh, bh * 0.3); ctx.fill();
      ctx.fillStyle = tpl.badge.color;
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText(tpl.badge.text, bx + W * 0.025, by + bh / 2);
      y = by + bh + W * 0.04;
    }

    // 爆炸框（白色底 + 彩色粗框 + 立體陰影）
    const burstW = W - pad * 2;
    const burstH = H * 0.40;
    const bx = pad;
    const by = y;
    const cx0 = bx + burstW / 2, cy0 = by + burstH / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.40)'; ctx.shadowBlur = W * 0.035; ctx.shadowOffsetY = W * 0.014;
    drawBurstShape(ctx, cx0, cy0, burstW / 2, burstH / 2, 14, '#ffffff');
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = W * 0.014; ctx.strokeStyle = tpl.accent; ctx.lineJoin = 'round';
    drawBurstShape(ctx, cx0, cy0, burstW / 2, burstH / 2, 14, tpl.accent);
    ctx.stroke();

    // 標題放喺爆炸框內（置中，黑字）
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a1a1a';
    const burstTitleSize = Math.round(titleSize * 0.80);
    const titleFont = font(900, burstTitleSize);
    const lines = wrapText(ctx, data.title, titleFont, burstW - W * 0.10, 3);
    const totalH = lines.length * burstTitleSize * 1.1;
    let ty = cy0 - totalH / 2 + burstTitleSize * 0.45;
    lines.forEach((ln) => {
      ctx.font = titleFont;
      ctx.fillText(ln, cx0, ty);
      ty += burstTitleSize * 1.1;
    });

    y = by + burstH + W * 0.05;

    // 副標題
    if (data.tagline) {
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = tpl.subColor;
      ctx.font = font(800, Math.round(titleSize * 0.44));
      ctx.fillText(data.tagline, pad, y);
      y += titleSize * 0.6;
    }

    // bullet
    if (data.points && data.points.length) {
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const bFont = font(700, Math.round(titleSize * 0.34));
      data.points.slice(0, 3).forEach(pt => {
        ctx.fillStyle = tpl.accent;
        ctx.beginPath();
        ctx.arc(pad + W * 0.012, y + titleSize * 0.34 * 0.5, W * 0.009, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = tpl.bulletColor;
        ctx.font = bFont;
        const bl = wrapText(ctx, pt, bFont, W - pad * 2 - W * 0.04, 2);
        bl.forEach((ln, i) => ctx.fillText(ln, pad + W * 0.035, y + i * titleSize * 0.4));
        y += bl.length * titleSize * 0.4 + W * 0.02;
      });
    }

    drawFooter(ctx, tpl, W, H, pad, titleSize, font);
  }

  // 半調網點（漫畫風背景）
  function drawHalftone(ctx, W, H, color) {
    ctx.save();
    ctx.globalAlpha = 0.10; ctx.fillStyle = color;
    const rr = W * 0.012, gap = W * 0.05;
    for (let yy = gap; yy < H; yy += gap) {
      for (let xx = gap; xx < W; xx += gap) {
        ctx.beginPath(); ctx.arc(xx, yy, rr, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  // 可愛卡通風（mesh 漸變 + 貼紙公仔，參考 hk_wealth_mgt）
  function renderCuteLayout(ctx, tpl, data, W, H, pad, base, titleSize, font) {
    let y = pad;

    // mesh 高光（柔和色塊）
    const blobColors = [tpl.bg.from, tpl.bg.to, tpl.accent];
    [[0.25, 0.28], [0.80, 0.22], [0.50, 0.85], [0.15, 0.82]].forEach((p, i) => {
      const g = ctx.createRadialGradient(W * p[0], H * p[1], 0, W * p[0], H * p[1], Math.max(W, H) * 0.5);
      g.addColorStop(0, hexToRgba(blobColors[i % blobColors.length], 0.32));
      g.addColorStop(1, hexToRgba(blobColors[i % blobColors.length], 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });

    // 文字區：如果右下有公仔，預留闊度
    const mascotW = tpl.mascot ? base * 0.22 : 0;
    const textMaxW = W - pad * 2 - (mascotW ? mascotW + W * 0.03 : 0);
    const effectiveTextW = Math.max(textMaxW, W * 0.50);

    // badge
    if (tpl.badge) {
      ctx.font = font(700, Math.round(W * 0.032));
      const tw = ctx.measureText(tpl.badge.text).width;
      const bh = W * 0.058, bw = tw + W * 0.05, bx = pad, by = pad;
      ctx.fillStyle = tpl.badge.bg;
      roundRect(ctx, bx, by, bw, bh, bh * 0.3); ctx.fill();
      ctx.fillStyle = tpl.badge.color;
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText(tpl.badge.text, bx + W * 0.025, by + bh / 2);
      y = by + bh + W * 0.04;
    }

    // 標題
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillStyle = tpl.titleColor;
    const titleFont = font(tpl.titleWeight, Math.round(titleSize * 0.95));
    const lines = wrapText(ctx, data.title, titleFont, effectiveTextW, 2);
    lines.forEach((ln, i) => ctx.fillText(ln, pad, y + i * titleSize * 1.05));
    y += lines.length * titleSize * 1.05 + W * 0.025;

    // 副標題
    if (data.tagline) {
      ctx.fillStyle = tpl.subColor;
      ctx.font = font(600, Math.round(titleSize * 0.38));
      const sl = wrapText(ctx, data.tagline, ctx.font, effectiveTextW, 2);
      sl.forEach((ln, i) => ctx.fillText(ln, pad, y + i * titleSize * 0.5));
      y += sl.length * titleSize * 0.5 + W * 0.02;
    }

    // bullet 喺左邊，預留右下公仔位
    if (data.points && data.points.length) {
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const bFont = font(600, Math.round(titleSize * 0.34));
      const maxW = effectiveTextW - W * 0.04;
      let by2 = y;
      const maxBottom = H - pad - base * 0.22; // 預留公仔
      data.points.slice(0, 3).forEach(pt => {
        if (by2 >= maxBottom) return;
        const bl = wrapText(ctx, pt, bFont, maxW, 2);
        if (by2 + bl.length * titleSize * 0.4 > maxBottom) return;
        ctx.fillStyle = tpl.accent;
        ctx.beginPath();
        ctx.arc(pad + W * 0.012, by2 + titleSize * 0.34 * 0.5, W * 0.009, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = tpl.bulletColor;
        bl.forEach((ln, i) => ctx.fillText(ln, pad + W * 0.035, by2 + i * titleSize * 0.4));
        by2 += bl.length * titleSize * 0.4 + W * 0.015;
      });
    }

    // 公仔貼紙放右下角（統一樣式）
    if (tpl.mascot) drawMascotSticker(ctx, tpl, W, H, pad, base);

    drawFooter(ctx, tpl, W, H, pad, titleSize, font);
  }

  // 統一底部品牌：有公仔/氣泡時擺左下角，避免同右下角公仔重疊
  function drawFooter(ctx, tpl, W, H, pad, titleSize, font) {
    const footerH = Math.max(W * 0.045, titleSize * 0.35);
    const fText = tpl.footer.text;
    ctx.font = font(500, Math.round(W * 0.024));
    const fW = ctx.measureText(fText).width + W * 0.03;
    const alignRight = !(tpl.mascot || tpl.bubble);
    const fx = alignRight ? W - pad : pad;
    const fy = H - pad - footerH / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    roundRect(ctx, alignRight ? fx - fW : fx, fy - footerH / 2, fW, footerH, footerH * 0.3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.textBaseline = 'middle'; ctx.textAlign = alignRight ? 'right' : 'left';
    ctx.fillText(fText, alignRight ? fx - W * 0.015 : fx + W * 0.015, fy);
  }

  // 計算對比色（簡單亮度）
  function getContrastColor(hex) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substr(0, 2), 16) || 0;
    const g = parseInt(c.substr(2, 2), 16) || 0;
    const b = parseInt(c.substr(4, 2), 16) || 0;
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? '#111827' : '#ffffff';
  }

  // 爆炸星形（漫畫風）
  function drawBurstShape(ctx, cx, cy, rx, ry, spikes, color) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * rx;
      y = cy + Math.sin(rot) * ry;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * (rx * 0.55);
      y = cy + Math.sin(rot) * (ry * 0.55);
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - ry);
    ctx.closePath();
    ctx.fillStyle = color;
  }

  function drawDecor(ctx, tpl, W, H) {
    const c = tpl.accent;
    ctx.save();
    if (tpl.decor === 'circle') {
      ctx.globalAlpha = 0.18; ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(W * 0.85, H * 0.12, W * 0.28, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.10;
      ctx.beginPath(); ctx.arc(W * 0.05, H * 0.95, W * 0.30, 0, Math.PI * 2); ctx.fill();
    } else if (tpl.decor === 'dots') {
      ctx.globalAlpha = 0.14; ctx.fillStyle = c;
      [[W * 0.88, H * 0.10, W * 0.05], [W * 0.80, H * 0.18, W * 0.03], [W * 0.92, H * 0.22, W * 0.025]]
        .forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); });
    } else if (tpl.decor === 'wave') {
      ctx.globalAlpha = 0.12; ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.80);
      ctx.quadraticCurveTo(W * 0.3, H * 0.72, W * 0.6, H * 0.82);
      ctx.quadraticCurveTo(W * 0.85, H * 0.90, W, H * 0.82);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    } else if (tpl.decor === 'cross') {
      ctx.globalAlpha = 0.16; ctx.fillStyle = c;
      const cx = W * 0.85, cy = H * 0.13, s = W * 0.10, t = W * 0.035;
      ctx.fillRect(cx - s / 2, cy - t / 2, s, t);
      ctx.fillRect(cx - t / 2, cy - s / 2, t, s);
    } else if (tpl.decor === 'grid') {
      ctx.globalAlpha = 0.08; ctx.strokeStyle = c; ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        ctx.beginPath(); ctx.moveTo(W * i / 5, 0); ctx.lineTo(W * i / 5, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, H * i / 5); ctx.lineTo(W, H * i / 5); ctx.stroke();
      }
    } else if (tpl.decor === 'sparkle') {
      // 高端光斑：隨機大小圓點 + 十字星光
      ctx.globalAlpha = 0.22; ctx.fillStyle = c;
      [[W*0.15,H*0.20,W*0.025],[W*0.78,H*0.15,W*0.04],[W*0.88,H*0.55,W*0.018],[W*0.22,H*0.75,W*0.03],[W*0.65,H*0.82,W*0.022]]
        .forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 0.35;
      [[W*0.25,H*0.35,W*0.035],[W*0.72,H*0.70,W*0.045]]
        .forEach(([x, y, s]) => {
          ctx.fillRect(x - s/2, y - s/6, s, s/3);
          ctx.fillRect(x - s/6, y - s/2, s/3, s);
        });
    } else if (tpl.decor === 'circles') {
      // 可愛半透明圓圈
      ctx.globalAlpha = 0.18; ctx.fillStyle = c;
      [[W*0.82,H*0.18,W*0.18],[W*0.12,H*0.75,W*0.22],[W*0.78,H*0.78,W*0.12]]
        .forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); });
    }
    ctx.restore();
  }

  // 對話氣泡（卡通角色「說話」）—— 右下角公仔上方，一定唔會遮住標題/副標題/bullet
  function drawBubble(ctx, tpl, W, H, pad, base, minY) {
    const text = tpl.bubble || '';
    if (!text) return;

    // 公仔位置（同 drawMascotSticker 一致）
    const mascotSize = Math.round(base * 0.13);
    const mascotCx = W - pad - mascotSize * 0.5;
    const mascotCy = H - pad - mascotSize * 0.5 - W * 0.025;
    const mascotTop = mascotCy - mascotSize * 0.78;
    const bubbleBottom = mascotTop - W * 0.02; // 氣泡底部喺公仔頂部之上

    // 氣泡字：動態縮細以遷就空間，但限制喺右欄之內
    let fs = Math.round(base * 0.040);
    let f = `600 ${fs}px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif`;
    ctx.font = f;
    const maxW = W * 0.30; // 氣泡唔可以闊過右欄
    let lines = wrapText(ctx, text, f, maxW, 3);
    const lh = fs * 1.28;
    let bh = lines.length * lh + W * 0.05;
    let by = bubbleBottom - bh;

    const contentBottom = (minY || pad) + W * 0.02;
    if (by < contentBottom) {
      if (lines.length > 2) {
        fs = Math.round(base * 0.040);
        f = `600 ${fs}px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif`;
        lines = wrapText(ctx, text, f, maxW, 2);
        bh = lines.length * fs * 1.25 + W * 0.045;
        by = bubbleBottom - bh;
      }
      if (by < contentBottom) {
        fs = Math.round(base * 0.035);
        f = `600 ${fs}px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif`;
        lines = wrapText(ctx, text, f, maxW, 2);
        bh = lines.length * fs * 1.25 + W * 0.04;
        by = bubbleBottom - bh;
      }
      if (by < contentBottom) by = contentBottom;
    }

    if (by < pad * 1.5) by = pad * 1.5;

    const tw = Math.max.apply(null, lines.map(l => ctx.measureText(l).width));
    const bw = Math.min(maxW, tw) + W * 0.05;
    const bx = W - pad - bw; // 靠右對齊畫布右邊，完全喺右欄之內

    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    roundRect(ctx, bx, by, bw, bh, W * 0.035); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.72, by + bh);
    ctx.lineTo(bx + bw * 0.95, by + bh + W * 0.045);
    ctx.lineTo(bx + bw * 0.85, by + bh);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.fill();
    ctx.fillStyle = '#15171c';
    ctx.font = f;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, bx + W * 0.03, by + W * 0.025 + i * lh));
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, fontStr, maxWidth, maxLines) {
    ctx.font = fontStr;
    const chars = Array.from(text || '');
    const lines = [];
    let cur = '';
    for (const ch of chars) {
      const test = cur + ch;
      if (ctx.measureText(test).width > maxWidth && cur) {
        lines.push(cur);
        cur = ch;
        if (lines.length >= maxLines) { cur = ''; break; }
      } else {
        cur = test;
      }
    }
    if (cur && lines.length < maxLines) lines.push(cur);
    if (lines.length >= maxLines) {
      const shown = lines.join('').length;
      if (shown < chars.length) {
        let l = lines[maxLines - 1];
        lines[maxLines - 1] = (l.length > 1 ? l.slice(0, -1) : l) + '…';
      }
    }
    return lines;
  }

  // ===== 生成（一鍵出文案＋圖）=====
  async function generate() {
    const topic = document.getElementById('socialTopic').value.trim();
    if (!topic) { alert('請填寫主題'); return; }

    // 系列模式：鎖定基底範本
    if (seriesState.active) {
      const baseEl = document.getElementById('seriesBase');
      if (baseEl) seriesState.templateId = baseEl.value;
      const nameEl = document.getElementById('seriesName');
      if (nameEl) seriesState.name = nameEl.value.trim();
      const epEl = document.getElementById('seriesEp');
      if (epEl) seriesState.ep = parseInt(epEl.value, 10) || 1;
      state.templateId = seriesState.templateId;
    }

    const platform = document.getElementById('socialPlatform').value;
    const ratio = document.getElementById('socialRatio').value;
    const style = document.getElementById('socialStyle').value;
    const persona = document.getElementById('socialPersona').value;
    const extra = document.getElementById('socialExtra').value.trim();
    const tpl = (typeof COVER_TEMPLATES !== 'undefined' ? COVER_TEMPLATES : []).find(t => t.id === state.templateId) || null;

    const dupMsg = findDuplicate(topic, tpl ? tpl.id : '');
    const built = buildContent(topic, platform, ratio, style, persona, extra, state.type, dupMsg, tpl);

    const out = document.getElementById('socialOutput');
    out.className = 'output-box filled';
    out.innerHTML = built.html;

    // 出圖
    const canvas = document.getElementById('socialCanvas');
    if (canvas && tpl) {
      const dims = ratioToDims(ratio);
      canvas.width = dims.w; canvas.height = dims.h;

      let bgImage = null;
      if (getUseAiBackground() && getImageGenKey()) {
        try {
          const prompt = `A professional social media cover image about ${topic}, Hong Kong finance and insurance theme, modern, clean, no text, no watermark, suitable as background for bold Chinese title overlay, ${tpl.cat} style, ${tpl.layout === 'luxury' ? 'dark background with golden light spots' : 'bright and friendly colors'}`;
          const url = await generateAiImage(prompt);
          bgImage = await loadImage(url);
        } catch (e) {
          console.warn('AI background failed, fallback to gradient', e);
          // 失敗就繼續用漸變底
        }
      }

      renderCover(canvas, tpl, { title: topic, tagline: built.hook, points: built.keyPoints }, bgImage);
      state.last = { title: topic, tagline: built.hook, points: built.keyPoints, ratio };
    }

    const entry = {
      type: 'social', topic,
      platform, ratio,
      templateId: tpl ? tpl.id : '', templateName: tpl ? tpl.name : '',
      title: topic, caption: built.caption
    };
    Storage.addHistory(entry);
    state.lastHistoryId = entry.id;
    updateDashboardStats();

    // 系列模式：EP 自動 +1 並保存
    if (seriesState.active) {
      seriesState.ep += 1;
      const epEl = document.getElementById('seriesEp');
      if (epEl) epEl.value = seriesState.ep;
      saveSeries();
    }
  }

  // ===== 一鍵出 3 平台（IG / 小紅書 / FB）=====
  const MULTI_PLATFORMS = [
    { key: 'ig',  name: 'Instagram', dims: { w: 1080, h: 1080 }, ratioTxt: '1:1 方形' },
    { key: 'xhs', name: '小紅書',    dims: { w: 1080, h: 1440 }, ratioTxt: '3:4 直式' },
    { key: 'fb',  name: 'Facebook',  dims: { w: 1200, h: 630 },  ratioTxt: '1.91:1 橫幅' }
  ];

  // 寫實 AI 背景 prompt（似片中美工：家庭 / 香港天際線 / 專業金融）
  function realisticPrompt(topic, realistic) {
    if (realistic) {
      return `Ultra-realistic commercial photograph, Hong Kong finance and insurance theme: a happy multicultural family or a confident Asian financial advisor in a bright modern office with Victoria Harbour skyline through the window, warm cinematic natural lighting, premium advertising style, clean composition with generous negative space at top and bottom for text overlay, no text, no watermark, high detail, 8k`;
    }
    return `A clean professional social media background about ${topic}, Hong Kong finance and insurance, modern, bright, no text, no watermark, suitable for bold Chinese title overlay`;
  }

  // 平台專屬 caption（長短 / 語氣按平台調整）
  function buildPlatformCaption(topic, key, style, persona, extra, audience) {
    const T = (typeof TEMPLATES !== 'undefined' ? TEMPLATES : { socialTopics: {} });
    const match = Object.keys(T.socialTopics).find(k => topic.includes(k) || k.includes(topic));
    const base = match ? T.socialTopics[match] : null;
    const personaName = { expert: '資深顧問', friendly: '鄰家朋友', mentor: '導師' }[persona] || '顧問';
    let hook, points, cta, tags;
    if (base) { hook = base.hooks[0]; points = base.keyPoints; cta = base.cta; tags = base.hashtags; }
    else {
      hook = { professional: `【${topic}】專業分析：點樣做出明智決定`, casual: `講真，${topic}呢家嘢好多人都諗錯咗`, educational: `關於${topic}，你需要知道嘅 3 件事`, storytelling: `幫客做${topic}嘅真實個案分享` }[style] || `關於${topic}`;
      points = ['點解重要？', '常見錯誤', '點樣正確做'];
      cta = '有疑問隨時 PM 我 💬';
      tags = '#香港保險 #理財 #保障規劃';
    }
    if (extra) cta = cta + `（${extra}）`;

    if (key === 'ig') {
      return `${hook}\n\n${points.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n${cta}\n\n${tags}`;
    }
    if (key === 'xhs') {
      const kw = match || '資料';
      const body = `${hook}\n\n好多朋友問點解要關注${topic}，我整理咗重點：\n\n${points.map((p, i) => `${i + 1}️⃣ ${p}`).join('\n')}\n\n💡 ${cta}\n\n👇 想知多啲，留言「${kw}」或者關注我，持續分享香港保險乾貨～`;
      return `${body}\n\n${tags} #小紅書保險 #香港生活 #理財筆記`;
    }
    // fb：專業段落
    return `📌 ${hook}\n\n${points.map((p, i) => `• ${p}`).join('\n')}\n\n${cta}\n\n${tags}`;
  }

  async function generateMultiPlatform(opts) {
    opts = opts || {};
    const topicEl = document.getElementById('socialTopic');
    const topic = (opts.topic || (topicEl ? topicEl.value : '') || '').trim();
    if (!topic) { alert('請先填寫「主題」，或喺 AI 私人助理輸入時提供主題。'); return { ok: false }; }

    const style = opts.style || (document.getElementById('socialStyle') ? document.getElementById('socialStyle').value : 'professional');
    const persona = opts.persona || (document.getElementById('socialPersona') ? document.getElementById('socialPersona').value : 'expert');
    const extra = opts.extra || (document.getElementById('socialExtra') ? document.getElementById('socialExtra').value : '');
    const audience = opts.audience || 'all';
    const realistic = !!opts.realistic;
    const tplId = realistic ? 'photo-clean' : (opts.templateId || state.templateId || 'pro-navy');
    const tpl = (typeof COVER_TEMPLATES !== 'undefined' ? COVER_TEMPLATES : []).find(x => x.id === tplId) || COVER_TEMPLATES[0];

    // AI 背景：一次生成，3 平台重用（慳 token）
    let bgImage = null;
    if (getUseAiBackground() && getImageGenKey()) {
      try {
        const url = await generateAiImage(realisticPrompt(topic, realistic));
        bgImage = await loadImage(url);
      } catch (e) { console.warn('AI 背景生成失敗，用漸變底：', e); }
    }

    // 共用大字（標題 / 副標題 / 重點）畫圖；caption 按平台分開
    const built = buildContent(topic, 'fb', '1:1', style, persona, extra, state.type, null, tpl);
    const data = { title: topic, tagline: built.hook, points: built.keyPoints };
    const captions = {};
    MULTI_PLATFORMS.forEach(p => { captions[p.key] = buildPlatformCaption(topic, p.key, style, persona, extra, audience); });

    const out = document.getElementById('socialOutput');
    if (!out) return { ok: false };
    out.className = 'output-box filled';

    let html = `<div class="dup-warn" style="background:#eef2ff;border-color:#6366f1;color:#3730a3">🚀 已一次過生成 <b>Instagram / 小紅書 / Facebook</b> 三個平台版本，各自獨立尺寸同文案長短。每張圖下有「⬇️ 圖」同「🎨 Canva」。</div><div class="mp-grid">`;
    MULTI_PLATFORMS.forEach(p => {
      html += `
        <div class="mp-card">
          <div class="mp-card-title">📸 ${p.name} · ${p.ratioTxt}</div>
          <div class="cover-wrap"><canvas id="mpCanvas_${p.key}" class="social-canvas"></canvas></div>
          <div class="proposal-section" style="border-color:#6366f1">
            <h4>✍️ ${p.name} 文案</h4>
            <pre class="output-content" id="mpCap_${p.key}">${escapeHtml(captions[p.key])}</pre>
            <button class="btn btn-sm btn-ghost copy-btn" onclick="copySingleText('mpCap_${p.key}', this)">複製</button>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-sm btn-primary" onclick="SocialModule.downloadMultiCover('mpCanvas_${p.key}','${topic.replace(/[\\/:?%*|<>"']/g, '_')}_${p.key}')">⬇️ 圖</button>
            <button class="btn btn-sm btn-secondary" onclick="SocialModule.openMultiInCanva('${p.key}')">🎨 Canva</button>
          </div>
        </div>`;
    });
    html += `</div><div style="margin-top:14px;display:flex;gap:8px"><button class="btn btn-sm btn-secondary" onclick="SocialModule.copyAllMulti()">複製全部文案</button></div>`;
    out.innerHTML = html;

    // 畫 3 張 canvas
    MULTI_PLATFORMS.forEach(p => {
      const cv = document.getElementById('mpCanvas_' + p.key);
      if (!cv) return;
      cv.width = p.dims.w; cv.height = p.dims.h;
      try { renderCover(cv, tpl, data, bgImage); } catch (e) { console.warn(e); }
    });

    try {
      Storage.addHistory({ type: 'social', topic, platform: 'multi', ratio: 'mixed', templateId: tpl.id, templateName: tpl.name, title: topic, caption: captions.ig });
      if (typeof updateDashboardStats === 'function') updateDashboardStats();
    } catch (e) {}

    return { ok: true, captions, topic, realistic };
  }

  // 寫實 AI 封面（似片中美工）：自動開 AI 背景 + photo-clean 範本，出 3 平台
  async function generateRealistic() {
    const topicEl = document.getElementById('socialTopic');
    if (topicEl && !topicEl.value.trim()) topicEl.value = '家庭財務規劃';
    if (getImageGenKey()) setUseAiBackground(true);
    return generateMultiPlatform({ realistic: true });
  }

  window.downloadMultiCover = function (canvasId, name) {
    const cv = document.getElementById(canvasId);
    if (!cv) return;
    const a = document.createElement('a');
    a.download = `SET_${(name || 'cover').replace(/[\\/:?%*|<>"']/g, '_')}.png`;
    a.href = cv.toDataURL('image/png');
    a.click();
  };

  function openMultiInCanva(key) {
    const dims = { ig: { w: 1080, h: 1080 }, xhs: { w: 1080, h: 1440 }, fb: { w: 1200, h: 630 } }[key] || { w: 1080, h: 1080 };
    const cv = document.getElementById('mpCanvas_' + key);
    if (cv) { const a = document.createElement('a'); a.download = 'SET_cover.png'; a.href = cv.toDataURL('image/png'); a.click(); }
    window.open(`https://www.canva.com/design?create&width=${dims.w}&height=${dims.h}`, '_blank');
    showCanvaTip();
  }

  function copyAllMulti() {
    const parts = [];
    MULTI_PLATFORMS.forEach(p => {
      const el = document.getElementById('mpCap_' + p.key);
      if (el) parts.push('【' + p.name + '】\n' + el.textContent);
    });
    const text = parts.join('\n\n————————\n\n');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => alert('已複製全部 3 平台文案')).catch(() => fallbackCopy(text));
    else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); alert('已複製全部 3 平台文案'); } catch (e) { alert('複製失敗，請手動選取'); }
    document.body.removeChild(ta);
  }

  function buildContent(topic, platform, ratio, style, persona, extra, type, dupMsg, tpl) {
    const key = Object.keys(TEMPLATES.socialTopics).find(k => topic.includes(k) || k.includes(topic));
    const tplMatch = key ? TEMPLATES.socialTopics[key] : null;

    const platformNames = { 'fb': 'Facebook / Instagram', 'threads': 'Threads', 'xhs-hk': '小紅書 · HK 版', 'xhs-cn': '小紅書 · 內地版', 'linkedin': 'LinkedIn' };
    const styleNames = { professional: '專業型', casual: '親切貼地', educational: '教育型', storytelling: '故事型' };
    const personaNames = { expert: '資深顧問', friendly: '鄰家朋友', mentor: '導師型' };

    let caption, hook, keyPoints;
    if (tplMatch) {
      hook = tplMatch.hooks[0];
      keyPoints = tplMatch.keyPoints;
      caption = `${tplMatch.hooks[0]}\n\n${tplMatch.keyPoints.map((k, i) => `${i + 1}. ${k}`).join('\n')}\n\n${tplMatch.cta}`;
    } else {
      const hookByStyle = {
        professional: `【${topic}】專業分析：點樣做出明智決定`,
        casual: `講真，${topic}呢件事，好多人都諗錯咗`,
        educational: `關於${topic}，你需要知道嘅 3 件事`,
        storytelling: `上個月幫一位客戶處理${topic}，佢嘅情況好值得分享`
      };
      hook = hookByStyle[style] || `關於${topic}`;
      keyPoints = ['點解重要？', '常見錯誤', '點樣正確做'];
      caption = `${hook}\n\n1. 點解重要？\n2. 常見錯誤\n3. 點樣正確做\n\n有疑問隨時 PM 我 💬`;
    }
    if (extra) caption += `\n\n（備註：${extra}）`;

    // 根據範本 layout 調整要點格式（對比表要 Expectation|Reality）
    keyPoints = adaptPointsForLayout(keyPoints, tpl, topic);

    let xhsBlock = '';
    if (platform === 'xhs-hk' || platform === 'xhs-cn') {
      const xhs = TEMPLATES.xiaohongshuTemplates.medical;
      const isCN = platform === 'xhs-cn';
      xhsBlock = `
      <div class="proposal-section" style="border-color:#ec4899">
        <h4>📕 小紅書專屬格式（${isCN ? '內地版' : 'HK版'}）</h4>
        <p>
          <strong>封面標題：</strong>${escapeHtml(xhs.title)}<br>
          <strong>副標題：</strong>${escapeHtml(xhs.subtitle)}<br><br>
          <strong>正文：</strong><br>${escapeHtml(xhs.body).replace(/\n/g, '<br>')}<br><br>
          <strong>留言關鍵字 CTA：</strong>${escapeHtml(xhs.commentCta)}<br>
          <strong>Hashtags：</strong>${escapeHtml(xhs.hashtags)}
        </p>
      </div>`;
    }

    const dupHtml = dupMsg ? `<div class="dup-warn">${escapeHtml(dupMsg)}</div>` : '';

    const html = `
      ${dupHtml}
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;font-size:12px">
        <span class="tag tag-blue">平台：${platformNames[platform]}</span>
        <span class="tag tag-orange">比例：${ratio}</span>
        <span class="tag tag-green">風格：${styleNames[style]}</span>
        <span class="tag tag-gray">人設：${personaNames[persona]}</span>
      </div>

      <div class="proposal-section">
        <h4>✍️ 貼文文案（${platformNames[platform]}）</h4>
        <pre class="output-content" id="socialCaption">${escapeHtml(caption)}</pre>
        <button class="btn btn-sm btn-ghost copy-btn" onclick="copySingleText('socialCaption', this)">複製</button>
      </div>

      ${xhsBlock}

      <div class="proposal-section" style="border-color:#0ea5e9">
        <h4>🖼️ 社交封面圖（已為你生成）</h4>
        <div class="cover-wrap">
          <canvas id="socialCanvas" class="social-canvas"></canvas>
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm btn-primary" onclick="downloadSocialCover(this)">⬇️ 下載圖片 (PNG)</button>
          <button class="btn btn-sm btn-ghost" onclick="SocialModule.rerenderWithSelected()">🔄 換範本重出</button>
          <button class="btn btn-sm btn-secondary" onclick="SocialModule.openInCanva()">🎨 落載 + 開 Canva 設計（Pro）</button>
          <button class="btn btn-sm btn-secondary" id="btnPublish" onclick="SocialModule.markPublished()">✅ 我已發佈到社交平台</button>
        </div>
        <p class="cover-tip">小貼士：封面大字按小紅書爆款規律設計（高對比、易讀）。落去前可改主題字再重出；用過嘅範本同文案會自動記錄，避免重覆。按「我已發佈」後會同步到全組共享記錄。</p>
      </div>

      <div style="margin-top:14px;display:flex;gap:8px">
        <button class="btn btn-sm btn-secondary" onclick="copyText(this)">複製全部</button>
      </div>
    `;

    return { html, caption, hook, keyPoints };
  }

  // 根據範本 layout 調整要點格式
  function adaptPointsForLayout(points, tpl, topic) {
    if (!tpl || !tpl.layout) return points;
    const t = (topic || '').toLowerCase();
    const mapCompare = () => {
      if (t.includes('退休') || t.includes('儲蓄') || t.includes('mpf')) {
        return ['以為 MPF 夠退休|現實係可能只夠基本生活', '以為要一次過儲大筆|其實每月小額都做到', '以為好複雜|有顧問跟住其實好簡單'];
      }
      if (t.includes('危疾') || t.includes('重疾')) {
        return ['以為公司醫保夠|離職就無保障', '以為年輕唔使急|病咗先買可能買唔到', '以為賠一次就夠|其實要覆蓋生活開支'];
      }
      if (t.includes('醫療') || t.includes('vhis') || t.includes('自願醫保')) {
        return ['以為公立醫院快|排期隨時幾個月', '以為買最平就得|保障範圍先係重點', '以為自己好健康|意外隨時發生'];
      }
      if (t.includes('儲蓄') || t.includes('慳錢') || t.includes('儲錢')) {
        return ['以為儲錢靠意志力|其實要自動化', '以為要賺大錢先儲|其實先儲後花', '以為銀行定存夠|跑輸通脹都係蝕'];
      }
      return ['以為好簡單|原來有好多細節要注意', '以為唔使急|越遲做成本越高', '以為自己搞得掂|專業意見原來好重要'];
    };
    if (tpl.layout === 'compare') return mapCompare();
    if (tpl.layout === 'infographic') {
      // 步驟風：將要點包裝成動作式短句
      return (points || []).slice(0, 3).map((p, i) => `第${i + 1}步：${p}`);
    }
    if (tpl.layout === 'comic') {
      // 爆炸框風：標語式短句
      return (points || []).slice(0, 3).map(p => `💥 ${p}`);
    }
    return points;
  }

  // ===== 查重：避免重覆使用（個人 + 全組）=====
  function findDuplicate(topic, templateId) {
    const t = (topic || '').trim();
    const fmt = d => { try { return new Date(d).toLocaleDateString('zh-HK'); } catch { return ''; } };

    // 1) 全組共享記錄
    const team = Storage.getTeamPosts() || [];
    const teamSameTopic = team.find(e => e.topic && t && (e.topic === t || e.topic.includes(t) || t.includes(e.topic)));
    if (teamSameTopic) {
      const who = teamSameTopic.user_email || '同事';
      return `⚠️ 全組記錄：${who} 已經喺 ${fmt(teamSameTopic.time || teamSameTopic.publishedAt)} 發佈過類似主題「${teamSameTopic.topic}」，建議換個角度或新聞點。`;
    }
    const teamSameTpl = team.find(e => e.templateId && e.templateId === templateId);
    if (teamSameTpl) {
      return `💡 全組記錄：${teamSameTpl.user_email || '同事'} 用過同一款範本「${teamSameTpl.templateName}」，可以換款範本增加新鮮感。`;
    }

    // 2) 個人歷史
    const h = (Storage.getHistory() || []).filter(e => e.type === 'social');
    const sameTopic = h.find(e => e.topic && t && (e.topic === t || e.topic.includes(t) || t.includes(e.topic)));
    if (sameTopic) {
      return `⚠️ 你之前（${fmt(sameTopic.time)}）已經出過類似主題「${sameTopic.topic}」，建議換個角度 / 新聞點，避免粉絲覺得重覆。`;
    }
    const sameTpl = h.find(e => e.templateId && e.templateId === templateId);
    if (sameTpl) {
      return `💡 你之前（${fmt(sameTpl.time)}）用過同一款範本「${sameTpl.templateName}」，可以換款範本增加新鮮感。`;
    }
    return null;
  }

  function markPublished() {
    const id = state.lastHistoryId;
    if (!id) { alert('請先「一鍵生成」後再按發佈。'); return; }
    const entry = Storage.confirmPublished(id);
    if (!entry) { alert('找不到記錄'); return; }
    const btn = document.getElementById('btnPublish');
    if (btn) {
      btn.className = 'btn btn-sm btn-success';
      btn.innerText = '✅ 已發佈（已同步全組）';
      btn.disabled = true;
    }
    // 若用戶喺歷史頁面，刷新佢
    if (document.getElementById('historyOutput') && document.getElementById('historyOutput').innerHTML) renderHistory();
    alert('已記錄！呢個主題 / 範本會寫入全組共享記錄，其他同事下次生成會見到「同事已發佈」提示。');
  }

  function openInCanva() {
    if (!state.last) { alert('請先「一鍵生成」一張圖。'); return; }
    const cv = document.getElementById('socialCanvas');
    if (!cv) { alert('請先「一鍵生成」一張圖。'); return; }
    // 1) 自動落載 PNG，等佢喺 Canva 拖入（用到你 Pro 會員做後續編輯）
    const name = (state.last.title ? state.last.title : 'social').replace(/[\\/:?%*|<>"']/g, '_');
    const a = document.createElement('a');
    a.download = `SET_cover_${name}.png`;
    a.href = cv.toDataURL('image/png');
    a.click();
    // 2) 開 Canva 去正確尺寸（空白畫布，你再拖入張 PNG）
    const dims = ratioToDims(state.last.ratio);
    const url = `https://www.canva.com/design?create&width=${dims.w}&height=${dims.h}`;
    window.open(url, '_blank');
    // 3) 彈出 Pro 用法小貼士
    showCanvaTip();
  }

  // Canva Pro 用法小貼士（自動消失）
  function showCanvaTip() {
    let tip = document.getElementById('canvaTip');
    if (tip) tip.remove();
    tip = document.createElement('div');
    tip.id = 'canvaTip';
    tip.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);max-width:440px;background:#2b2d42;color:#fff;padding:14px 18px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.35);z-index:9999;font-size:14px;line-height:1.65;';
    tip.innerHTML = '✅ PNG 已經幫你落載！去 Canva 拖入張圖，即可用你嘅 <b>Pro</b> 會員功能：<br>🔁 <b>Magic Resize</b> — 一鍵變 IG / 小紅書 / Story 尺寸<br>🎨 <b>Brand Kit</b> — 套返你嘅字體／品牌色／logo<br>🗓️ <b>Content Planner</b> — 排程發去 IG / 小紅書';
    document.body.appendChild(tip);
    setTimeout(() => { if (tip && tip.parentNode) tip.parentNode.removeChild(tip); }, 9000);
  }

  function rerenderWithSelected() {
    if (!state.last) return;
    const cv = document.getElementById('socialCanvas');
    if (!cv) return;
    const tpl = (typeof COVER_TEMPLATES !== 'undefined' ? COVER_TEMPLATES : []).find(t => t.id === state.templateId);
    if (!tpl) return;
    const dims = ratioToDims(state.last.ratio);
    cv.width = dims.w; cv.height = dims.h;
    renderCover(cv, tpl, state.last);
  }

  // 下載封面圖
  window.downloadSocialCover = function () {
    const cv = document.getElementById('socialCanvas');
    if (!cv) return;
    const name = (state.last && state.last.title ? state.last.title : 'social').replace(/[\\/:?%*|<>"']/g, '_');
    const a = document.createElement('a');
    a.download = `SET_cover_${name}.png`;
    a.href = cv.toDataURL('image/png');
    a.click();
  };

  // ===== RedFox / Web 搜尋即時範本 =====
  async function searchTrendTemplates() {
    const keyword = document.getElementById('trendKeyword').value.trim();
    const out = document.getElementById('trendResults');
    if (!keyword) { alert('請輸入關鍵詞'); return; }
    if (!out) return;
    out.innerHTML = '<div class="trend-loading">🔍 搜尋緊…</div>';

    const sources = [];
    const apiKey = getRedFoxKey();
    const headers = apiKey ? { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' } : {};

    // 小紅書：RedFox API（如有 key）
    if (apiKey) {
      try {
        const res = await fetch(`${REDFOX_BASE}/xhsUser/searchArticle`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ keyword, limit: 6 })
        });
        if (res.ok) {
          const json = await res.json();
          const list = (json && json.data && json.data.list) || (json && json.data) || [];
          if (Array.isArray(list) && list.length) sources.push({ name: '小紅書', list: list.slice(0, 6) });
        }
      } catch (e) { console.warn('RedFox xhs failed', e); }

      // 抖音
      try {
        const res = await fetch(`${REDFOX_BASE}/dyData/query`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ keyword, limit: 6 })
        });
        if (res.ok) {
          const json = await res.json();
          const list = (json && json.data && json.data.list) || (json && json.data) || [];
          if (Array.isArray(list) && list.length) sources.push({ name: '抖音', list: list.slice(0, 6) });
        }
      } catch (e) { console.warn('RedFox dy failed', e); }
    }

    // 後備：Web 搜尋（小紅書 + IG）——透過 WorkBuddy 後端 proxy 唔可行，所以用 static 熱詞啟發
    if (sources.length === 0) {
      sources.push({ name: '趨勢關鍵詞（無 RedFox Key 時備用）', list: generateTrendHints(keyword) });
    }

    renderTrendResults(sources, keyword);
  }

  function generateTrendHints(keyword) {
    // 靜態啟發，當 RedFox 無效或無 key 時用
    return [
      { title: `${keyword} 懶人包`, desc: '合集 / 乾貨整理', likes: '熱門' },
      { title: `${keyword} 點買最抵`, desc: '對比 / 避坑', likes: '熱門' },
      { title: `${keyword} 真實案例`, desc: '故事型 / 見證', likes: '熱門' },
      { title: `香港 ${keyword} 攻略`, desc: '本地化 / 流程', likes: '上升' },
      { title: `${keyword} 常見誤解`, desc: '反轉 / 教育型', likes: '上升' },
      { title: `${keyword} 2026 更新`, desc: '時事 / 新聞點', likes: '新鮮' }
    ];
  }

  function renderTrendResults(sources, keyword) {
    const out = document.getElementById('trendResults');
    if (!out) return;
    let html = '';
    sources.forEach(src => {
      html += `<div class="trend-source">📌 ${escapeHtml(src.name)}</div>`;
      html += '<div class="trend-grid">';
      src.list.forEach(item => {
        const title = item.title || item.noteTitle || item.desc || item.content || `${keyword}`;
        const desc = item.desc || item.noteDesc || (item.author ? `作者：${item.author}` : '') || '';
        const likes = item.likes || item.totalLike || item.interactCount || item.totalScore || '–';
        html += `
          <div class="trend-card" onclick="SocialModule.applyTrend('${escapeHtml(title).replace(/'/g, "\\'")}')">
            <div class="trend-title">${escapeHtml(title)}</div>
            <div class="trend-meta">${escapeHtml(desc)} ${likes !== '–' ? '· ❤️ ' + likes : ''}</div>
          </div>`;
      });
      html += '</div>';
    });
    html += `<p class="cover-tip">撳上面任何一條標題，即可將佢帶入「主題」欄，再揀範本出圖。</p>`;
    out.innerHTML = html;
  }

  function applyTrend(title) {
    const input = document.getElementById('socialTopic');
    if (input) input.value = title;
    input && input.scrollIntoView({ behavior: 'smooth' });
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  window.generateSocialContent = generate;
  window.SocialModule = { init, rerenderWithSelected, markPublished, saveRedFoxKey, saveImageGenKey, toggleAiBackground, searchTrendTemplates, applyTrend, useAiAvatar, clearAvatar, toggleSeries, openInCanva, generateMultiPlatform, generateRealistic, downloadMultiCover, openMultiInCanva, copyAllMulti };
  // 測試用內部 hook（唔影響一般用戶）
  window.SocialModule.__test = {
    renderCover,
    setSeries: (s) => { seriesState = Object.assign(seriesState, s); },
    setAvatar: (img) => { avatarImage = img; }
  };
})();