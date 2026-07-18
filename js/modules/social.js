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
    // A–F 小紅書強化：人設 / 爆款拆解洗稿 / 合規 / 標籤 / 批量 / 多平台
    loadPersonaProfile();
    renderPersonaPanel();
    renderViralPanel();
    renderCompliancePanel();
    renderBatchPanel();
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
  // 高清倍數：canvas 內部像素 ×CANVAS_HD，顯示尺寸由 CSS(max-width:100%)縮回，
  // 導出/下載更清晰。renderCover 所有尺寸基於 canvas.width/height，放大自然按比例，唔會走位。
  const CANVAS_HD = 2;
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
    else if (tpl.layout === 'market_focus') renderMarketFocus(ctx, tpl, data, W, H, pad, base, titleSize, font);
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

  // —— 真國旗 / 圖標 helpers（每日市場焦點用）——
  function drawStar(ctx, cx, cy, outer, inner, points) {
    points = points || 5;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = -Math.PI / 2 + i * Math.PI / points;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
  }

  // 簡化但可辨認嘅國旗（code: US/BR/KR/HK/CN/UK/JP；其他用 code 文字 fallback）
  function drawFlag(ctx, code, x, y, w, h) {
    code = (code || '').toUpperCase();
    if (!code) return;
    ctx.save();
    roundRect(ctx, x, y, w, h, Math.min(3, w * 0.08)); ctx.clip();
    if (code === 'US') {
      const stripes = 13, sh = h / stripes;
      for (let i = 0; i < stripes; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#b22234'; ctx.fillRect(x, y + i * sh, w, sh + 0.5); }
      const cw = w * 0.42, ch = h * 0.55;
      ctx.fillStyle = '#3c3b6e'; ctx.fillRect(x, y, cw, ch);
      ctx.fillStyle = '#fff';
      const sr = Math.max(1, cw * 0.05);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { ctx.beginPath(); ctx.arc(x + cw * 0.2 + c * cw * 0.2, y + ch * 0.22 + r * ch * 0.3, sr, 0, Math.PI * 2); ctx.fill(); }
    } else if (code === 'BR') {
      ctx.fillStyle = '#009c3b'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ffdf00';
      ctx.beginPath(); ctx.moveTo(x + w / 2, y + h * 0.16); ctx.lineTo(x + w * 0.86, y + h / 2); ctx.lineTo(x + w / 2, y + h * 0.84); ctx.lineTo(x + w * 0.14, y + h / 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#002776'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.17, 0, Math.PI * 2); ctx.fill();
    } else if (code === 'KR') {
      ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h);
      const cx = x + w / 2, cy = y + h / 2, r = h * 0.3;
      ctx.fillStyle = '#cd2e3a'; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2); ctx.fill();
      ctx.fillStyle = '#0047a0'; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI / 2, -Math.PI / 2); ctx.fill();
      ctx.fillStyle = '#000';
      const bw = w * 0.07, bh = h * 0.05;
      ctx.fillRect(cx - r * 0.7, y + h * 0.14, bw, bh); ctx.fillRect(cx - r * 0.4, y + h * 0.14, bw * 0.5, bh);
      ctx.fillRect(cx + r * 0.3, y + h * 0.14, bw, bh); ctx.fillRect(cx + r * 0.55, y + h * 0.14, bw * 0.5, bh);
      ctx.fillRect(cx - r * 0.7, y + h * 0.82 - bh, bw, bh); ctx.fillRect(cx - r * 0.4, y + h * 0.82 - bh, bw * 0.5, bh);
      ctx.fillRect(cx + r * 0.3, y + h * 0.82 - bh, bw, bh); ctx.fillRect(cx + r * 0.55, y + h * 0.82 - bh, bw * 0.5, bh);
      ctx.fillRect(x + w * 0.16, cy - bh / 2, bh, bw); ctx.fillRect(x + w * 0.16, cy - bh / 2 - bw * 0.5, bh, bw * 0.5);
      ctx.fillRect(x + w * 0.82 - bh, cy - bh / 2, bh, bw); ctx.fillRect(x + w * 0.82 - bh - bw * 0.5, cy - bh / 2, bh, bw * 0.5);
    } else if (code === 'HK') {
      ctx.fillStyle = '#de2910'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#fff';
      const cx = x + w / 2, cy = y + h / 2, pr = h * 0.11;
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * h * 0.17, cy + Math.sin(a) * h * 0.17, pr, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#de2910'; ctx.beginPath(); ctx.arc(cx, cy, pr * 0.5, 0, Math.PI * 2); ctx.fill();
    } else if (code === 'CN') {
      ctx.fillStyle = '#de2910'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ffde00';
      drawStar(ctx, x + w * 0.2, y + h * 0.3, h * 0.15, h * 0.06, 5);
      const sm = [[-0.16, 0.08], [-0.06, 0.16], [-0.02, 0.26], [-0.13, 0.3]];
      sm.forEach(p => drawStar(ctx, x + w * 0.34 + p[0] * w, y + h * 0.16 + p[1] * h, h * 0.06, h * 0.025, 5));
    } else if (code === 'UK') {
      ctx.fillStyle = '#012169'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = h * 0.2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.moveTo(x + w, y); ctx.lineTo(x, y + h); ctx.stroke();
      ctx.strokeStyle = '#c8102e'; ctx.lineWidth = h * 0.1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.moveTo(x + w, y); ctx.lineTo(x, y + h); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = h * 0.34;
      ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
    } else if (code === 'JP') {
      ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#bc002d'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.3, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#334155'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = Math.round(h * 0.42) + 'px sans-serif';
      ctx.fillText(code, x + w / 2, y + h / 2);
    }
    ctx.restore();
  }

  // 簡單線條圖標（每日市場焦點卡片用）
  function drawIcon(ctx, name, x, y, s, color) {
    if (!name) return;
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(2, s * 0.08); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const cx = x + s / 2, cy = y + s / 2;
    if (name === 'clock') {
      ctx.beginPath(); ctx.arc(cx, cy, s * 0.4, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - s * 0.25); ctx.moveTo(cx, cy); ctx.lineTo(cx + s * 0.18, cy); ctx.stroke();
    } else if (name === 'rate') {
      ctx.beginPath(); ctx.moveTo(x + s * 0.2, y + s * 0.78); ctx.lineTo(x + s * 0.8, y + s * 0.22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s * 0.55, y + s * 0.22); ctx.lineTo(x + s * 0.8, y + s * 0.22); ctx.lineTo(x + s * 0.8, y + s * 0.47); ctx.closePath(); ctx.stroke();
    } else if (name === 'chart') {
      const bw = s * 0.18;
      [0.4, 0.65, 0.9].forEach((hh, i) => { const bx = x + s * 0.18 + i * s * 0.28; ctx.fillRect(bx, y + s * (1 - hh), bw, s * hh); });
    } else if (name === 'building') {
      ctx.strokeRect(x + s * 0.25, y + s * 0.2, s * 0.5, s * 0.7);
      ctx.strokeRect(x + s * 0.2, y + s * 0.45, s * 0.6, s * 0.45);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { ctx.fillRect(x + s * 0.34 + i * s * 0.2, y + s * 0.3 + j * s * 0.18, s * 0.08, s * 0.08); }
    } else if (name === 'bulb') {
      ctx.beginPath(); ctx.arc(cx, y + s * 0.42, s * 0.28, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, y + s * 0.72); ctx.lineTo(cx, y + s * 0.82); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s * 0.38, y + s * 0.85); ctx.lineTo(x + s * 0.62, y + s * 0.85); ctx.stroke();
    } else if (name === 'globe') {
      ctx.beginPath(); ctx.arc(cx, cy, s * 0.4, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.18, s * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s * 0.1, cy); ctx.lineTo(x + s * 0.9, cy); ctx.stroke();
    } else if (name === 'news') {
      ctx.strokeRect(x + s * 0.2, y + s * 0.25, s * 0.6, s * 0.5);
      ctx.beginPath(); ctx.moveTo(x + s * 0.3, y + s * 0.4); ctx.lineTo(x + s * 0.7, y + s * 0.4); ctx.moveTo(x + s * 0.3, y + s * 0.55); ctx.lineTo(x + s * 0.6, y + s * 0.55); ctx.stroke();
    }
    ctx.restore();
  }

  // ===== 每日市場焦點（金融快訊圖：標題＋日期＋3 新聞卡＋代理人簽名）=====
  function renderMarketFocus(ctx, tpl, data, W, H, pad, base, titleSize, font) {
    const lux = !!tpl.lux;
    const gold = lux ? '#d4af37' : tpl.accent;
    const titleCol = lux ? '#f5d782' : '#0f172a';
    const subCol = lux ? 'rgba(203,213,225,0.9)' : '#475569';
    const cardBg = lux ? 'rgba(255,255,255,0.05)' : 'rgba(30,58,138,0.05)';
    const cardBorder = lux ? 'rgba(212,175,55,0.45)' : 'rgba(30,58,138,0.18)';
    const textCol = lux ? '#f8fafc' : '#1e293b';
    const subTextCol = lux ? 'rgba(148,163,184,0.95)' : '#64748b';

    data = data || {};
    const items = (data.items && data.items.length) ? data.items.slice(0, 3) : [
      { flag: 'US', flag2: 'BR', icon: 'clock', title: '美國擬對巴西徵 25% 關稅', subtitle: '自下周三起，多項商品受影響' },
      { flag: 'KR', icon: 'rate', title: '南韓一如預期加息 0.25 厘', subtitle: '指標利率升至 2.75%' },
      { flag: 'HK', icon: 'chart', title: '香港投資管理公司表現亮眼', subtitle: '去年投資收入增 1.75 倍' }
    ];

    let y = pad;
    // 標題
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = titleCol;
    const tSize = Math.round(base * 0.082);
    ctx.font = font(900, tSize);
    ctx.fillText(data.title || '每日市場焦點', W / 2, y);
    y += tSize * 1.3;
    // 日期
    if (data.date) {
      ctx.fillStyle = lux ? gold : subCol;
      ctx.font = font(600, Math.round(base * 0.034));
      ctx.fillText(data.date, W / 2, y);
      y += base * 0.055;
    }
    // 分隔線
    ctx.strokeStyle = lux ? 'rgba(212,175,55,0.55)' : 'rgba(30,58,138,0.3)';
    ctx.lineWidth = Math.max(2, W * 0.003);
    ctx.beginPath(); ctx.moveTo(W * 0.32, y); ctx.lineTo(W * 0.68, y); ctx.stroke();
    y += base * 0.05;

    // 3 張新聞卡
    const gap = base * 0.028;
    const areaH = H - y - pad * 2.5;
    const cardH = (areaH - gap * (items.length - 1)) / items.length;
    const innerPad = W * 0.05;           // 卡內留白
    const cardL = pad + innerPad;        // 卡內左邊界
    const cardR = W - pad - innerPad;    // 卡內右邊界
    const rightReserve = W * 0.13;       // 右邊留畀國旗 + icon
    items.forEach((it, idx) => {
      const cy = y + cardH * idx + gap * idx;
      // 卡底
      ctx.fillStyle = cardBg;
      roundRect(ctx, pad, cy, W - pad * 2, cardH, W * 0.016); ctx.fill();
      ctx.strokeStyle = cardBorder; ctx.lineWidth = Math.max(1.5, W * 0.0025); ctx.stroke();
      // 編號圓（靠卡內左邊界，唔凸出卡外）
      const r = Math.min(W * 0.046, cardH * 0.3);
      const bx = cardL + r, by = cy + cardH / 2;
      ctx.fillStyle = gold;
      ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = lux ? '#1a1f4d' : '#ffffff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = font(800, Math.round(r * 0.9));
      ctx.fillText(String(idx + 1), bx, by + r * 0.04);
      // 右側：國旗 + 圖標（唔貼邊）
      const fw = W * 0.045, fh = fw * 0.66;
      let fx = cardR - fw;
      const fy = cy + cardH * 0.2;
      if (it.flag2) { drawFlag(ctx, it.flag2, fx, fy, fw, fh); fx -= fw + W * 0.012; }
      if (it.flag) { drawFlag(ctx, it.flag, fx, fy, fw, fh); }
      const isz = W * 0.045;
      drawIcon(ctx, it.icon, cardR - isz, cy + cardH * 0.56, isz, lux ? gold : tpl.accent);
      // 文字（標題 + 副標題）垂直居中，行距足夠唔會重疊
      const textX = bx + r + W * 0.04;
      const textW = Math.max(cardR - textX - rightReserve, W * 0.4);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = textCol;
      const titleSize = Math.round(base * 0.033);
      const titleLh = base * 0.050; // 行距加大，避免兩行黏埋
      const subSize = Math.round(base * 0.026);
      const subLh = base * 0.040;
      const titleSubGap = base * 0.018; // 標題副標題間距
      ctx.font = font(700, titleSize);
      const tl = wrapText(ctx, it.title || '', ctx.font, textW, 2);
      const titleBlockH = tl.length * titleLh;
      const subBlockH = it.subtitle ? subLh + titleSubGap : 0;
      const totalTextH = titleBlockH + subBlockH;
      const firstY = by - totalTextH / 2 + titleLh / 2;
      tl.forEach((ln, i) => ctx.fillText(ln, textX, firstY + i * titleLh));
      if (it.subtitle) {
        ctx.fillStyle = subTextCol;
        ctx.font = font(500, subSize);
        const sl = wrapText(ctx, it.subtitle, ctx.font, textW, 1);
        if (sl[0]) ctx.fillText(sl[0], textX, firstY + titleBlockH + titleSubGap);
      }
    });

    // 底部代理人橫條
    const barY = H - pad * 1.5;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (data.agent) {
      ctx.fillStyle = lux ? gold : tpl.accent;
      ctx.font = font(700, Math.round(base * 0.034));
      ctx.fillText('您的代理人：' + data.agent, W / 2, barY - base * 0.028);
    }
    const foot = [data.cta, data.tagline].filter(Boolean).join('    ·    ');
    if (foot) {
      ctx.fillStyle = subCol;
      ctx.font = font(500, Math.round(base * 0.027));
      ctx.fillText(foot, W / 2, barY + base * 0.03);
    }
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
      canvas.width = dims.w * CANVAS_HD; canvas.height = dims.h * CANVAS_HD;

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
  function buildPlatformCaption(topic, key, style, persona, extra, audience, rich) {
    rich = rich || getRichContent(topic, style, persona, key);
    const T = (typeof TEMPLATES !== 'undefined' ? TEMPLATES : { socialTopics: {} });
    const tags = rich.match ? T.socialTopics[rich.match].hashtags : suggestTags(topic, key === 'xhs' ? 'xhs' : key);
    const points = rich.points;
    const intro = '好多朋友都有呢個疑問，我整理咗重點同你分享：';
    const tip = '💡 小貼士：以上係一般資訊，實際方案要睇你嘅家庭狀況同預算，歡迎 PM 我免費分析。';
    if (key === 'ig') {
      return `${rich.hook}\n\n${points.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n${rich.cta}\n\n${tags}`;
    }
    if (key === 'xhs') {
      const body = `${rich.hook}\n\n${intro}\n\n${points.map((p, i) => `${i + 1}️⃣ ${p}`).join('\n')}\n\n${tip}\n\n👇 ${rich.cta}\n\n${tags} #小紅書保險 #香港生活 #理財筆記`;
      return body;
    }
    // fb：專業段落
    return `📌 ${rich.hook}\n\n${points.map((p, i) => `• ${p}`).join('\n')}\n\n${rich.cta}\n\n${tags}`;
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
    // A：人設定位 —— 所有平台 caption 加上你嘅專業簽名
    const sig = personaSignature();
    if (sig) MULTI_PLATFORMS.forEach(p => { captions[p.key] += '\n\n' + sig; });

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
    html += `</div><div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-sm btn-secondary" onclick="SocialModule.copyAllMulti()">複製全部文案</button>
      <button class="btn btn-sm btn-secondary" onclick="SocialModule.appendExtraPlatforms('${escapeHtml(topic).replace(/'/g, "\\'")}')">🌐 出更多平台文案（微信／WhatsApp／抖音／TG／LinkedIn）</button>
      <button class="btn btn-sm btn-secondary" onclick="SocialModule.scanCurrentOutput()">🛡️ 合規審查</button>
    </div><div id="mpExtraOut"></div><div id="mpComplianceOut"></div>`;
    out.innerHTML = html;

    // 畫 3 張 canvas
    MULTI_PLATFORMS.forEach(p => {
      const cv = document.getElementById('mpCanvas_' + p.key);
      if (!cv) return;
      cv.width = p.dims.w * CANVAS_HD; cv.height = p.dims.h * CANVAS_HD;
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

  function buildContent(topic, platform, ratio, style, persona, extra, type, dupMsg, tpl, rich) {
    const platformNames = { 'fb': 'Facebook / Instagram', 'threads': 'Threads', 'xhs-hk': '小紅書 · HK 版', 'xhs-cn': '小紅書 · 內地版', 'linkedin': 'LinkedIn' };
    const styleNames = { professional: '專業型', casual: '親切貼地', educational: '教育型', storytelling: '故事型' };
    const personaNames = { expert: '資深顧問', friendly: '鄰家朋友', mentor: '導師型' };

    rich = rich || getRichContent(topic, style, persona, platform);
    let hook = rich.hook;
    let keyPoints = rich.canvasPoints;
    let caption = `${rich.hook}\n\n${rich.points.map((k, i) => `${i + 1}. ${k}`).join('\n')}\n\n${rich.cta}`;
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
    cv.width = dims.w * CANVAS_HD; cv.height = dims.h * CANVAS_HD;
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

  // ======================================================================
  // A — 人設定位（Persona Profile）：所有生成內容圍繞你嘅專業定位
  // ======================================================================
  let personaProfile = { enabled: false, nick: '', niche: '', tone: 'expert', audience: 'all', tagline: '', cta: '' };

  const AUDIENCE_OPTS = [
    { v: 'all', t: '全年齡泛理財' },
    { v: 'cn', t: '內地高淨值客' },
    { v: 'family', t: '年輕家庭' },
    { v: 'young', t: '職場新鮮人' },
    { v: 'senior', t: '退休／準退休' },
    { v: 'boss', t: '老闆／企業主' }
  ];

  function getPersonaProfile() { return personaProfile; }

  function savePersonaProfile() {
    try { Storage.setSetting('personaProfile', JSON.stringify(personaProfile)); } catch (e) {}
    if (typeof CloudSync !== 'undefined') CloudSync.pushSetting('personaProfile', JSON.stringify(personaProfile));
  }

  function loadPersonaProfile() {
    try {
      const raw = Storage.getSetting('personaProfile');
      if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object') personaProfile = Object.assign(personaProfile, o); }
    } catch (e) {}
  }

  function renderPersonaPanel() {
    const box = document.getElementById('personaPanel');
    if (!box) return;
    const p = personaProfile;
    const aud = AUDIENCE_OPTS.map(o => `<option value="${o.v}" ${o.v === p.audience ? 'selected' : ''}>${escapeHtml(o.t)}</option>`).join('');
    box.innerHTML = `
      <label class="form-label">🧑‍💼 我的人設定位（所有內容圍繞你嘅專業形象，風格一致）</label>
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;margin-bottom:8px">
        <input type="checkbox" id="personaEnabled" ${p.enabled ? 'checked' : ''} onchange="SocialModule.savePersona()"> 啟用人設（生成文案自動加你嘅簽名 / 定位語）
      </label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <input type="text" id="personaNick" class="form-input" style="flex:1;min-width:130px" placeholder="稱呼，例：Jackson｜危疾規劃師" value="${escapeHtml(p.nick)}">
        <input type="text" id="personaNiche" class="form-input" style="flex:1;min-width:130px" placeholder="專業定位，例：專攻家庭醫療＋危疾" value="${escapeHtml(p.niche)}">
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <select id="personaTone" class="form-input" style="width:auto;min-width:120px">
          <option value="expert" ${p.tone === 'expert' ? 'selected' : ''}>語氣：專業可靠</option>
          <option value="friendly" ${p.tone === 'friendly' ? 'selected' : ''}>語氣：親切貼地</option>
          <option value="mentor" ${p.tone === 'mentor' ? 'selected' : ''}>語氣：導師啟發</option>
        </select>
        <select id="personaAudience" class="form-input" style="width:auto;min-width:140px">${aud}</select>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <input type="text" id="personaTagline" class="form-input" style="flex:1;min-width:150px" placeholder="招牌 slogan，例：保障唔使貴，啱先最緊要" value="${escapeHtml(p.tagline)}">
        <input type="text" id="personaCta" class="form-input" style="flex:1;min-width:150px" placeholder="慣用 CTA，例：留言「保障」免費做檢查" value="${escapeHtml(p.cta)}">
      </div>
      <button class="btn btn-sm btn-secondary" onclick="SocialModule.savePersona()">儲存人設</button>
      <p class="cover-tip">填一次就得，之後每次生成文案都會自動用返你嘅定位、語氣、目標客群同簽名，令成個帳號風格一致。會同步去雲端，換裝置登入都有。</p>
    `;
  }

  function savePersona() {
    const g = id => { const el = document.getElementById(id); return el ? el.value : ''; };
    const cb = document.getElementById('personaEnabled');
    personaProfile.enabled = cb ? !!cb.checked : personaProfile.enabled;
    personaProfile.nick = (g('personaNick') || '').trim();
    personaProfile.niche = (g('personaNiche') || '').trim();
    personaProfile.tone = g('personaTone') || 'expert';
    personaProfile.audience = g('personaAudience') || 'all';
    personaProfile.tagline = (g('personaTagline') || '').trim();
    personaProfile.cta = (g('personaCta') || '').trim();
    savePersonaProfile();
    // 若人設語氣有設定，順帶同步去主表單嘅「人設」select，令單張生成都一致
    const ps = document.getElementById('socialPersona');
    if (ps && personaProfile.enabled) ps.value = personaProfile.tone;
  }

  // 生成內容尾部嘅人設簽名（enabled 先出）
  function personaSignature() {
    const p = personaProfile;
    if (!p.enabled) return '';
    const bits = [];
    if (p.nick) bits.push(p.nick);
    if (p.niche) bits.push(p.niche);
    let out = '';
    if (p.tagline) out += '✨ ' + p.tagline;
    if (bits.length) out += (out ? '\n' : '') + '—— ' + bits.join(' · ');
    return out.trim();
  }

  // ======================================================================
  // D — 小紅書標籤優化：按主題自動生成貼題有流量嘅 #hashtags
  // ======================================================================
  const TAG_LIBRARY = [
    { re: /(醫療|醫保|VHIS|自願醫保|住院|門診)/i, tags: ['#香港醫療險', '#自願醫保', '#VHIS', '#高端醫療', '#住院保障'] },
    { re: /(危疾|重疾|癌症|嚴重疾病)/i, tags: ['#危疾保險', '#重疾險', '#癌症保障', '#保障缺口'] },
    { re: /(儲蓄|退休|理財|MPF|TVC|複利|年金)/i, tags: ['#儲蓄保險', '#退休規劃', '#理財筆記', '#複利', '#被動收入'] },
    { re: /(家庭|小朋友|兒童|BB|親子|媽媽|爸爸)/i, tags: ['#家庭保障', '#兒童保險', '#新手爸媽', '#親子理財'] },
    { re: /(扣稅|稅務|報稅|免稅)/i, tags: ['#扣稅攻略', '#稅務優惠', '#報稅'] },
    { re: /(內地|大灣區|跨境|來港|來香港)/i, tags: ['#香港保險', '#跨境投保', '#大灣區', '#內地客戶'] },
    { re: /(人壽|壽險|身故|傳承)/i, tags: ['#人壽保險', '#財富傳承', '#家庭保障'] },
    { re: /(投資|基金|美元|保單)/i, tags: ['#投資理財', '#資產配置', '#分散風險'] }
  ];
  const TAG_COMMON = ['#香港保險', '#保險知識', '#理財', '#乾貨分享', '#保障規劃'];

  function suggestTags(topic, platform) {
    const set = [];
    TAG_LIBRARY.forEach(g => { if (g.re.test(topic || '')) g.tags.forEach(t => { if (set.indexOf(t) < 0) set.push(t); }); });
    TAG_COMMON.forEach(t => { if (set.indexOf(t) < 0) set.push(t); });
    // 小紅書多啲 tag（8），其他平台少啲（5）
    const limit = platform === 'xhs' ? 8 : 5;
    return set.slice(0, limit).join(' ');
  }

  function generateTags() {
    const topicEl = document.getElementById('socialTopic');
    const topic = (topicEl ? topicEl.value : '').trim();
    if (!topic) { alert('請先填「主題」，再生成標籤。'); return; }
    const xhs = suggestTags(topic, 'xhs');
    const ig = suggestTags(topic, 'ig');
    const out = document.getElementById('tagOut');
    if (out) {
      out.innerHTML = `
        <div class="proposal-section" style="border-color:#e11d48;margin-top:10px">
          <h4>🏷️ 小紅書標籤（8 個，貼題＋流量）</h4>
          <pre class="output-content" id="tagXhs">${escapeHtml(xhs)}</pre>
          <button class="btn btn-sm btn-ghost copy-btn" onclick="copySingleText('tagXhs', this)">複製</button>
          <h4 style="margin-top:10px">🏷️ IG／FB 標籤（5 個）</h4>
          <pre class="output-content" id="tagIg">${escapeHtml(ig)}</pre>
          <button class="btn btn-sm btn-ghost copy-btn" onclick="copySingleText('tagIg', this)">複製</button>
        </div>`;
    }
  }

  // ======================================================================
  // C — 內容合規審查：掃描保險 / 內地平台監管紅線敏感詞
  // ======================================================================
  const COMPLIANCE_RULES = [
    { re: /(保證回報|保證收益|穩賺|包賺|一定賺|零風險|無風險|絕對安全)/g, level: 'high', msg: '保證回報／零風險', fix: '改為「目標回報」「預期」「非保證」，並標明投資風險' },
    { re: /(高收益|高回報|收益穩定|穩定收益)/g, level: 'high', msg: '誇大收益', fix: '加註「非保證，實際收益視乎投資表現／分紅」' },
    { re: /(最好|第一|最佳|最強|最平|最抵|最平價|唯一|頂級|排名第一)/g, level: 'mid', msg: '絕對化用語', fix: '改為「較適合」「其中一個選擇」，避免絕對化' },
    { re: /(必賠|穩賠|包批|包過|包核保|一定賠|全部都賠)/g, level: 'high', msg: '誇大理賠承諾／誤導核保', fix: '改為「符合保單條款下賠付」，理賠視乎個別條款' },
    { re: /(內幕|秘密渠道|走後門|特殊渠道|灰色)/g, level: 'high', msg: '違規渠道暗示', fix: '刪除' },
    { re: /(治愈|根治|療效|藥到病除)/g, level: 'mid', msg: '醫療療效宣稱', fix: '保險內容避免醫療療效字眼' },
    { re: /(免費贈送|送錢|回贈現金|回佣|返佣)/g, level: 'mid', msg: '不當利益引誘／回佣', fix: '刪除或改為合規優惠描述' },
    { re: /(炒|包升|升值保證|一定升)/g, level: 'high', msg: '誇大升值', fix: '刪除保證升值字眼' }
  ];

  function checkCompliance(text) {
    const hits = [];
    if (!text) return hits;
    COMPLIANCE_RULES.forEach(rule => {
      rule.re.lastIndex = 0;
      const found = text.match(rule.re);
      if (found && found.length) {
        hits.push({ words: Array.from(new Set(found)), level: rule.level, msg: rule.msg, fix: rule.fix });
      }
    });
    return hits;
  }

  function renderComplianceResult(text, mountId) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    const hits = checkCompliance(text);
    if (!hits.length) {
      mount.innerHTML = `<div class="dup-warn" style="background:#ecfdf5;border-color:#10b981;color:#065f46;margin-top:10px">✅ 未發現常見違規／敏感字眼。發佈前仍建議自行再核對最新監管要求。</div>`;
      return;
    }
    const total = hits.reduce((n, h) => n + h.words.length, 0);
    let html = `<div class="dup-warn" style="background:#fef2f2;border-color:#ef4444;color:#991b1b;margin-top:10px">⚠️ 發現 <b>${hits.length}</b> 類、共 <b>${total}</b> 個需注意字眼，建議修改後再發：</div>`;
    html += '<div class="proposal-section" style="border-color:#ef4444">';
    hits.forEach(h => {
      const badge = h.level === 'high' ? '<span class="tag" style="background:#ef4444;color:#fff">高風險</span>' : '<span class="tag" style="background:#f59e0b;color:#fff">留意</span>';
      html += `<div style="margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border)">
        ${badge} <b>${escapeHtml(h.msg)}</b><br>
        <span style="color:#ef4444">命中：${h.words.map(w => escapeHtml(w)).join('、')}</span><br>
        <span style="color:var(--muted)">建議：${escapeHtml(h.fix)}</span>
      </div>`;
    });
    html += '</div>';
    mount.innerHTML = html;
  }

  function renderCompliancePanel() {
    const box = document.getElementById('compliancePanel');
    if (!box) return;
    box.innerHTML = `
      <label class="form-label">🛡️ 內容合規審查（保險 / 內地平台監管紅線）</label>
      <textarea id="complianceInput" class="form-input" rows="4" placeholder="貼上你想發佈嘅文案，或撳生成後嘅「合規審查」自動帶入…"></textarea>
      <div style="margin-top:8px"><button class="btn btn-sm btn-primary" onclick="SocialModule.scanCompliance()">掃描敏感詞</button></div>
      <div id="complianceOut"></div>
      <p class="cover-tip">會標出「保證回報 / 零風險 / 最好 / 必賠」等常見違規字眼並俾修改建議。純本地運算，唔會上傳你嘅文案。</p>
    `;
  }

  function scanCompliance() {
    const el = document.getElementById('complianceInput');
    renderComplianceResult(el ? el.value : '', 'complianceOut');
  }

  // 由生成結果一鍵帶入合規審查
  function scanCurrentOutput() {
    const parts = [];
    ['mpCap_ig', 'mpCap_xhs', 'mpCap_fb'].forEach(id => { const e = document.getElementById(id); if (e) parts.push(e.textContent); });
    const text = parts.join('\n\n');
    renderComplianceResult(text, 'mpComplianceOut');
  }

  // ======================================================================
  // B — 爆款拆解 + 洗稿：貼小紅書筆記／文案 → 拆結構 → 改寫成你風格
  // ======================================================================
  function renderViralPanel() {
    const box = document.getElementById('viralPanel');
    if (!box) return;
    box.innerHTML = `
      <label class="form-label">🔥 爆款拆解 + 洗稿（貼小紅書筆記文案，AI 拆結構再改寫成你風格）</label>
      <textarea id="viralInput" class="form-input" rows="5" placeholder="貼上一篇爆款小紅書 / 抖音筆記全文（標題＋正文＋標籤）…"></textarea>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm btn-primary" onclick="SocialModule.analyzeViral()">🔍 拆解結構</button>
        <button class="btn btn-sm btn-secondary" onclick="SocialModule.rewriteViral()">✍️ 洗稿成我風格</button>
      </div>
      <div id="viralOut"></div>
      <p class="cover-tip">拆解會分析：鉤子（hook）、內容結構、關鍵詞、情緒點、CTA、點解會爆。洗稿會保留爆款框架、換成你嘅人設語氣同合規用字。</p>
    `;
  }

  function parseViral(raw) {
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l);
    const hook = lines[0] || '';
    const pointRe = /^(\d+[\.、)]|[①-⑨]|[1-9]️⃣|[•\-\*]|第[一二三四五六七八九]|[✅💡📌👉🔥⭐️])/;
    const ctaRe = /(留言|評論|評論區|私訊|私信|DM|PM|關注|收藏|點贊|扣1|扣\s*1|領取|拎|回覆|回复)/;
    const points = lines.filter(l => pointRe.test(l)).slice(0, 8);
    const ctas = lines.filter(l => ctaRe.test(l));
    const tags = (raw.match(/#[^\s#]+/g) || []).slice(0, 15);
    const emojiCount = (raw.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length;
    const kw = [];
    ['醫療', '醫保', '危疾', '重疾', '儲蓄', '退休', '理財', '扣稅', '家庭', '兒童', '內地', '跨境', '人壽', '保費', '核保', '賠', '保障', '香港'].forEach(k => { if (raw.includes(k)) kw.push(k); });
    return { hook, points, ctas, tags, emojiCount, chars: raw.replace(/\s/g, '').length, keywords: kw };
  }

  function analyzeViral() {
    const el = document.getElementById('viralInput');
    const raw = el ? el.value.trim() : '';
    const out = document.getElementById('viralOut');
    if (!raw) { alert('請先貼上一篇爆款筆記文案。'); return; }
    if (!out) return;
    const a = parseViral(raw);
    const whyViral = [];
    if (/[?？]/.test(a.hook) || /你|竟然|原來|千祈|唔好|居然|驚/.test(a.hook)) whyViral.push('鉤子用咗提問／反差／製造好奇，第一句就抓住讀者');
    if (a.points.length >= 3) whyViral.push('用咗清單體（' + a.points.length + ' 點），資訊密度高、易讀易收藏');
    if (a.emojiCount >= 5) whyViral.push('emoji 豐富（' + a.emojiCount + ' 個），視覺節奏好、親和力強');
    if (a.ctas.length) whyViral.push('有明確互動 CTA（留言／關注），谷評論同曝光');
    if (a.tags.length >= 5) whyViral.push('標籤够多（' + a.tags.length + ' 個），吃到搜尋＋推薦流量');
    if (!whyViral.length) whyViral.push('結構直接、主題清晰，適合快速消化');
    out.innerHTML = `
      <div class="proposal-section" style="border-color:#f97316;margin-top:10px">
        <h4>🪝 鉤子（Hook）</h4>
        <pre class="output-content">${escapeHtml(a.hook)}</pre>
        <h4 style="margin-top:8px">🧱 內容結構（${a.points.length} 個要點）</h4>
        <pre class="output-content">${escapeHtml(a.points.join('\n') || '（未偵測到明顯清單，屬敘事／故事型）')}</pre>
        <h4 style="margin-top:8px">🔑 關鍵詞</h4>
        <pre class="output-content">${escapeHtml(a.keywords.join('、') || '—')}</pre>
        <h4 style="margin-top:8px">📣 CTA（互動引導）</h4>
        <pre class="output-content">${escapeHtml(a.ctas.join('\n') || '（原文冇明顯 CTA，建議洗稿時加返）')}</pre>
        <h4 style="margin-top:8px">🏷️ 原文標籤（${a.tags.length}）</h4>
        <pre class="output-content">${escapeHtml(a.tags.join(' ') || '—')}</pre>
        <h4 style="margin-top:8px">💥 點解會爆</h4>
        <pre class="output-content">${escapeHtml('• ' + whyViral.join('\n• '))}</pre>
      </div>
      <p class="cover-tip">想直接用呢個框架出你自己嘅版本？撳上面「✍️ 洗稿成我風格」。</p>
    `;
    return a;
  }

  function rewriteViral() {
    const el = document.getElementById('viralInput');
    const raw = el ? el.value.trim() : '';
    const out = document.getElementById('viralOut');
    if (!raw) { alert('請先貼上一篇爆款筆記文案。'); return; }
    if (!out) return;
    const a = parseViral(raw);
    const p = personaProfile;
    const tone = p.enabled ? p.tone : 'expert';
    // 換鉤子（保留爆款框架，換成你角度）
    const topicGuess = a.keywords[0] || '保障規劃';
    const hookMap = {
      expert: `【${topicGuess}】專業拆解：多數人都忽略咗嘅重點`,
      friendly: `講真，${topicGuess}呢家嘢我幫過好多朋友，分享返俾你`,
      mentor: `如果你都關心${topicGuess}，呢幾點值得你諗清楚`
    };
    const newHook = hookMap[tone] || hookMap.expert;
    // 保留原結構點數，改寫語氣
    let points = a.points.length ? a.points.map(pt => pt.replace(/^(\d+[\.、)]|[①-⑨]|[1-9]️⃣|[•\-\*]|[✅💡📌👉🔥⭐️])+\s*/, '').trim()).filter(Boolean) : ['點解重要', '常見誤解', '正確做法'];
    points = points.slice(0, 6);
    const cta = (p.enabled && p.cta) ? p.cta : '留言「保障」或私訊我，免費幫你檢視現有保障';
    const tags = suggestTags(topicGuess + raw, 'xhs');
    const sig = personaSignature();
    const body = `${newHook}\n\n${points.map((pt, i) => `${i + 1}️⃣ ${pt}`).join('\n')}\n\n💡 ${cta}\n\n👇 想睇更多香港保險乾貨，記得關注～\n\n${tags}${sig ? '\n\n' + sig : ''}`;
    // 洗稿後自動做一次合規掃描
    const complianceHits = checkCompliance(body);
    let cHtml = '';
    if (complianceHits.length) {
      cHtml = `<div class="dup-warn" style="background:#fef2f2;border-color:#ef4444;color:#991b1b;margin-top:8px">⚠️ 洗稿版本含 ${complianceHits.reduce((n, h) => n + h.words.length, 0)} 個需注意字眼（${complianceHits.map(h => h.words.join('、')).join('；')}），發佈前請調整。</div>`;
    } else {
      cHtml = `<div class="dup-warn" style="background:#ecfdf5;border-color:#10b981;color:#065f46;margin-top:8px">✅ 洗稿版本未發現常見違規字眼。</div>`;
    }
    out.innerHTML = `
      <div class="proposal-section" style="border-color:#22c55e;margin-top:10px">
        <h4>✍️ 洗稿成果（你嘅風格${p.enabled && p.nick ? '：' + escapeHtml(p.nick) : ''}）</h4>
        <pre class="output-content" id="viralRewrite">${escapeHtml(body)}</pre>
        <button class="btn btn-sm btn-ghost copy-btn" onclick="copySingleText('viralRewrite', this)">複製</button>
      </div>${cHtml}
      <p class="cover-tip">已保留原爆款框架（鉤子＋清單＋CTA），換成你嘅人設語氣、加咗優化標籤同合規檢查。</p>
    `;
    return body;
  }

  // ======================================================================
  // E — 批量生成一週內容：一次出 5–7 篇，自動排 series
  // ======================================================================
  const ANGLE_SUFFIX = ['懶人包', '常見誤解', '真實個案分享', '2026 最新更新', '點揀先啱自己', '避坑指南', 'Q&A 快問快答'];

  function normalizeTopicSeed(seed) {
    let s = (seed || '').trim();
    for (const suffix of ANGLE_SUFFIX) {
      if (s.endsWith(suffix)) return s.slice(0, -suffix.length).trim();
    }
    return s;
  }
  function expandTopicsFromSeed(seed, count) {
    const base = normalizeTopicSeed(seed);
    const topics = [];
    for (let i = 0; i < count; i++) topics.push(base + ANGLE_SUFFIX[i % ANGLE_SUFFIX.length]);
    return topics;
  }
  function getAngleOf(topic) {
    for (const a of ANGLE_SUFFIX) if ((topic || '').endsWith(a)) return a;
    return '';
  }
  function detectDomain(topic) {
    const map = [
      ['vhis', ['自願醫保', '醫保', '扣稅', '稅務', '自願醫保計劃', '保費扣稅']],
      ['ci', ['危疾', '重疾', '嚴重疾病', '癌症', 'cancer']],
      ['life', ['人壽', '壽險', '身故', '定期壽險']],
      ['savings', ['儲蓄', '儲蓄險', '理財', '資產', '財富', '投資', '年金']],
      ['medical', ['醫療', '住院', '手術', '病房', '高端醫療']],
      ['accident', ['意外', '傷殘']],
      ['mpf', ['強積金', 'mpf', '退休', '退休金']]
    ];
    const t = (topic || '');
    for (const [dom, kws] of map) if (kws.some(k => t.includes(k))) return dom;
    return 'generic';
  }

  // ======================================================================
  // 保險知識庫：按領域 + 角度產生有實質嘅內容（非 LLM，純前端）
  // 每個 entry: { t: 短標題(畀封面圖用), d: 詳細解釋(畀文案用) }
  // ======================================================================
  const TOPIC_KB = {
    vhis: {
      facts: [
        { t: '每人扣 HK$8,000', d: '每課稅年度，你同每位受養人（配偶、子女、父母）各自最多可扣 HK$8,000 認可計劃保費，全家幾多人就幾多個額度' },
        { t: '扣稅唔等於減稅', d: '係喺「應課稅入息」扣除，按你邊際稅率慳稅；最高稅階 17%，每人實際最多慳 HK$1,360' },
        { t: '認可計劃先合資格', d: '只有「自願醫保認可計劃」（標準或靈活）先可以扣稅，普通醫療保險、門診保唔計' },
        { t: '要自己報數', d: '喺個別人士報稅表「自願醫保計劃保費」一欄填數就得，唔使預先批核，但要留低保費收據至少 6 年' },
        { t: '靈活 vs 標準', d: '靈活計劃保障更廣（包更多手術、賠償上限更高、包部分未知義務病症），保費較貴；標準計劃係基本盤，最平' }
      ],
      myths: [
        { t: '普通醫療保都可扣', d: '錯！必須係「認可」自願醫保，普通住院/門診保險唔合資格' },
        { t: '扣稅即減 HK$8,000', d: '錯！係扣應課稅入息，按稅率計，最高每人慳 HK$1,360' },
        { t: '買自己就夠', d: '錯！父母、子女、配偶都各自有額度，忽略就白白浪費扣稅空間' },
        { t: '保費全額可扣', d: '錯！只扣「標準保費」上限內部分，靈活計劃超出標準保費嘅保費唔可扣' }
      ],
      case: {
        background: '客戶 A 一家四口（自己+配偶+2 子女），兩夫妻都做緊嘢，稅階約 12%',
        need: '佢想善用自願醫保扣稅，但唔清楚全家額度同點配靈活計劃',
        result: '最終全家人各買一份認可計劃，全年合資格保費 HK$32,000 全數扣稅，慳咗約 HK$3,840 稅',
        lesson: '一家幾口一齊規劃，額度可以疊加，慳稅效果更明顯'
      },
      updates: [
        { t: '認可產品持續擴充', d: '2026 政府「自願醫保計劃」官網持續更新認可產品名單，投保前記得核對是否「認可」' },
        { t: '保費按醫療通脹調整', d: '保險公司會因醫療通脹逐年調整靈活計劃保費，續保前留意加幅' },
        { t: '扣稅上限維持 HK$8,000', d: '2026/27 課稅年度每份合資格保單保費扣稅上限仍為 HK$8,000，每位受養人獨立計算' },
        { t: '電子報稅更方便', d: '稅務局網上報稅已預設相關欄位，填寫保費金額即可，唔使另交收據' }
      ],
      selection: [
        { t: '計清家庭額度', d: '數下有幾多受養人，鎖定總扣稅額度（人數 × HK$8,000）' },
        { t: '標準 vs 靈活', d: '預算緊、要平揀標準；想保障廣、賠得多、包未知病症揀靈活' },
        { t: '睇賠償上限', d: '比較緊急/非緊急手術賠償上限、保證續保至幾多歲、有無自願部分' },
        { t: '查認可名單', d: '投保前確認產品喺政府認可清單，避免買咗唔合資格' }
      ],
      faq: [
        { q: '已有公司醫保，仲買唔買？', a: '公司保障離職就無，自願醫保個人可帶走，兩者互補，仲有扣稅' },
        { q: '父母年紀大買到嗎？', a: '認可計劃保證續保至 100 歲，年紀大保費貴但可以扣稅，早買平啲' },
        { q: '扣稅需唔需要申請？', a: '唔使，報稅表填數就得，稅局會計' }
      ],
      pitfalls: [
        { t: '買非認可產品', d: '投保前查「認可」字樣，否則無法扣稅' },
        { t: '忽略保證續保', d: '老咗有病都係要續到保，揀有保證續保嘅計劃' },
        { t: '以為包門診', d: 'VHIS 主要係住院及手術，普通門診感冒唔包' },
        { t: '只買自己', d: '忽略父母/子女額度，浪費全家扣稅空間' }
      ],
      cta: '想知你一家可以慳幾多稅、點買最著數？PM 我免費幫你計條數 💬'
    },
    ci: {
      facts: [
        { t: '一筆過賠償', d: '確診受保危疾（癌症、心臟病、中風等）即賠一筆過現金，錢點用你決定——醫療費、停工收入、家庭開支都得' },
        { t: '醫療保補唔到嘅位', d: '醫療保實報實銷淨係 cover 醫院費；危疾保補你停工、供樓、子女教育呢筆收入缺口' },
        { t: '發病年輕化', d: '香港每 4 個人 1 個一生會患癌，新症每年約 3.5 萬宗，發病年齡愈嚟愈後生' },
        { t: '早期都賠', d: '早期危疾/嚴重程度分級賠（早期賠 20-50%，嚴重賠 100%）；多次賠償計劃抗復發' },
        { t: '年輕投保平', d: '保費按投保年齡計，後生買平一大截；吸煙、家族病史會加保費' }
      ],
      myths: [
        { t: '有醫療保就夠', d: '錯！醫療實報實銷，唔補收入；危疾先係填停工同家庭開支' },
        { t: '危疾係老人病', d: '錯！後生癌症個案上升，越早買越平、越易批' },
        { t: '賠一次就完', d: '錯！可揀多次賠償/分組計劃，抗復發同其他危疾' },
        { t: '所有癌症都包', d: '錯！受保範圍睇條款，早期/原位癌賠付比例同嚴重唔同' }
      ],
      case: {
        background: '客戶 B 35 歲已婚，兩年前開始供樓，同時供緊家庭開支',
        need: '佢以為有公司醫保就夠，後來發現停工治療期間收入會斷，供樓都有壓力',
        result: '確診乳癌後，危疾保賠咗 HK$100 萬，用嚟請外傭照顧、填補半年停工收入，醫療保另報手術費',
        lesson: '危疾保重點唔係醫藥費，而係填補收入缺口，有家庭責任更要配備'
      },
      updates: [
        { t: '多次賠償計劃普及', d: '2026 多家保司推「癌症三次賠」，抗復發同其他危疾都有保障' },
        { t: '兒童先天病保障擴闊', d: '部分計劃加強兒童先天性疾病保障，投保前比較不保事項清單' },
        { t: '等候期仍主流 90 日', d: '新計劃等候期多維持 90 日，愈早投保愈早過等候期' },
        { t: '保費豁免成標配', d: '愈來愈多計劃附設「危疾保費豁免」，確診後唔使再供保費' }
      ],
      selection: [
        { t: '計保額', d: '建議保額 = 年薪 5-10 倍 + 未還按揭 + 子女教育費' },
        { t: '賠幾多次', d: '預算緊揀單次（平）；想抗復發揀多次/分組賠償' },
        { t: '睇不保事項', d: '比較不保事項、等候期（通常 90 日）、早期危疾定義' },
        { t: '加保費豁免', d: '揀有「危疾保費豁免」，確診後唔使再供' }
      ],
      faq: [
        { q: '危疾同醫療點分？', a: '危疾一筆過現金、自己用；醫療實報實銷、直接畀醫院' },
        { q: '保額買幾多？', a: '睇家庭責任：年薪幾倍 + 按揭 + 教育' },
        { q: '抽過煙點計保費？', a: '戒煙滿一段時間（通常 1-2 年）可申請非吸煙率' }
      ],
      pitfalls: [
        { t: '保額買少', d: '只夠醫療唔夠補收入，建議年薪 5 倍以上' },
        { t: '忽略等候期', d: '投保後 90 日內確診可能唔賠，盡早買' },
        { t: '唔睇早期定義', d: '早期危疾賠付比例各計劃唔同，睇清楚' },
        { t: '只保自己', d: '忽略配偶/子女，家庭保障有缺口' }
      ],
      cta: '想知你適合幾多保額、邊個計劃最啱？PM 我免費分析 💬'
    },
    life: {
      facts: [
        { t: '身故賠償', d: '受保人離世（或附約危疾）賠一筆過，保障家人持續供樓、子女教育、父母供養' },
        { t: '定期平、終身有儲', d: '定期壽險純保障保費平；終身壽險有儲蓄/傳承功能但保費貴' },
        { t: '保額點計', d: '建議 = 未還按揭 + 子女教育費 + 家庭年開支×10 + 父母供養' },
        { t: '後生最平', d: '投保年輕健康最平最易批，過 50 歲保費急升仲要驗身' },
        { t: '公司團體險唔夠', d: '公司人壽離職就無，自己買先係長期保障' }
      ],
      myths: [
        { t: '後生無需買', d: '錯！後生最平最易批，等成家立室才買已經貴' },
        { t: '公司有團體險就夠', d: '錯！離職即無，自己買先有保證' },
        { t: '人壽等於儲錢', d: '錯！定期壽險純保障，要儲蓄選終身/儲蓄險' }
      ],
      case: {
        background: '客戶 C 40 歲，家庭主要收入來源，有兩個小朋友同未供完嘅樓按',
        need: '佢擔心萬一自己有事，家人會斷供同應付唔到教育開支',
        result: '買咗 HK$300 萬定期壽險，年保費千幾蚊，等於幫屋企人買咗個安全網',
        lesson: '壽險唔係幫自己，而係保障家人嘅生活質素同財務安全'
      },
      updates: [
        { t: '網上投保更普及', d: '2026 網上定期壽險（term life）核保加快，部分計劃免驗身' },
        { t: '末期疾病預支', d: '部分計劃加「末期疾病預支」權益，唔使等身故先拎賠償' },
        { t: '保費年輕最平', d: '後生健康時投保最抵，過 50 歲保費升幅顯著' },
        { t: '受益人要指定', d: '指定受益人可加快理賠，避免變成遺產處理' }
      ],
      selection: [
        { t: '計責任缺口', d: '未還按揭 + 子女教育 + 家庭開支×10 + 父母供養' },
        { t: '定期 vs 終身', d: '預算緊、純保障揀定期；想傳承/儲蓄揀終身' },
        { t: '睇不保事項', d: '注意自殺等候期、不保事項' },
        { t: '安排受益人', d: '清楚指定受益人，避免遺產爭拗' }
      ],
      faq: [
        { q: '幾時要買？', a: '有家庭責任（供樓/子女/父母）就應該買' },
        { q: '定期會唔會白供？', a: '買個安心，保費平，等如租個保障' },
        { q: '受益人點安排？', a: '指定受益人，理賠快過搞遺產' }
      ],
      pitfalls: [
        { t: '保額計少', d: '只計按揭忽略子女教育同開支' },
        { t: '淨買儲蓄險', d: '儲蓄險保障低，純保障要用定期' },
        { t: '忽略受益人', d: '無指定受益人，賠償變遺產要長時間' }
      ],
      cta: '想計下你嘅家庭責任缺口有幾大？PM 我免費幫你計 💬'
    },
    savings: {
      facts: [
        { t: '長線滾存', d: '儲蓄/分紅險長線滾存，適合教育金、退休、資產傳承；回報分保證同非保證' },
        { t: '回報非全保證', d: '預期長線回報約 4-6%，但大部分係非保證紅利，睇公司過往「紅利實現率」' },
        { t: '前幾年退保蝕', d: '早期退保價值低，要鎖定長期錢，唔好用短期會用嘅錢買' },
        { t: '有身故槓桿', d: '相比定存，保險有身故槓桿、強制儲蓄、可轉換投保人/受保人做傳承' },
        { t: '2026 多元貨幣', d: '新計劃多支援 USD/HKD/CNY 切換，抗匯率風險' }
      ],
      myths: [
        { t: '等如定存隨時拎', d: '錯！早期退保價值低，可能蝕本金' },
        { t: '回報全保證', d: '錯！大部分係非保證，睇實現率' },
        { t: '越短年期越叻', d: '錯！長線（10 年+）先見到複息效果' }
      ],
      case: {
        background: '客戶 D 想為仔女儲大學學費，但驚自己中途會拎嚟用',
        need: '佢需要一個強制儲蓄、長線滾存、有身故槓桿嘅工具',
        result: '每月供 HK$5,000 儲蓄險，目標 18 年後仔女大學費，預期戶口值翻倍',
        lesson: '儲蓄險最適合自制力唔夠、目標清晰嘅長期錢，唔好用短期資金買'
      },
      updates: [
        { t: '多元貨幣計劃', d: '2026 各大保司推 USD/HKD/CNY 自由切換計劃，抗匯率風險' },
        { t: '分紅實現率更透明', d: '監管要求披露更清晰，投保前要查公司過往紅利實現率' },
        { t: '保證比例要睇清', d: '新計劃強調保證現金價值比例，預算緊要揀保證多啲' },
        { t: '長線回報預期 4-6%', d: '預期長線回報維持 4-6%，但非保證部分視投資表現' }
      ],
      selection: [
        { t: '定目標年期', d: '先定教育/退休目標年期，再揀計劃' },
        { t: '保證 vs 非保證', d: '比較保證現金價值比例，預算緊要保證多啲' },
        { t: '睇實現率', d: '揀過往紅利實現率高、公司信貸評級好嘅' },
        { t: '計流動性', d: '確保呢筆錢短期唔會用到，避免中途甩供' }
      ],
      faq: [
        { q: '定存定保險？', a: '短期錢留定存，長線儲蓄/傳承用保險' },
        { q: '非保證點知靠唔靠？', a: '睇公司過往紅利實現率（fulfillment ratio）' },
        { q: '中途甩供點算？', a: '有寬限期，長期甩供保單會失效，買前計好供款能力' }
      ],
      pitfalls: [
        { t: '用短期錢買', d: '早期退保蝕，短錢唔好買長期險' },
        { t: '信推廣高回報', d: '忽略非保證部分同實現率' },
        { t: '唔睇退保價值', d: '投保前睇退保價值表，知幾時才回本' }
      ],
      cta: '想比較邊個儲蓄計劃最啱你目標？PM 我免費做方案 💬'
    },
    medical: {
      facts: [
        { t: '實報實銷', d: '住院醫療（自願醫保/住院險）實報實銷，cover 住院、手術、雜費，減輕大額醫療開支' },
        { t: '房級定保費', d: '大房/半私家/私家房級越高保費越貴，按預算揀' },
        { t: '墊底費慳保費', d: '自願承受高墊底費（deductible）可大幅慳保費' },
        { t: '保證續保', d: '老咗有病都續到保非常重要，揀有保證續保嘅' },
        { t: '高端醫療', d: '高端醫療(IMG)可去私家醫院、全球保障、高年限額，但保費貴' }
      ],
      myths: [
        { t: '有危疾就唔使醫療', d: '錯！危疾一筆過、醫療報住院費，兩者互補' },
        { t: '公司醫療夠', d: '錯！離職即無，自己買先有保證' },
        { t: '醫療包門診', d: '錯！一般住院險唔包普通門診，要另買門診附加' }
      ],
      case: {
        background: '客戶 E 突然腸胃出血入院，需要做手術並住幾日私家病房',
        need: '佢驚手術費同住院雜費會一筆過用咗儲蓄',
        result: '醫療保報咗 HK$18 萬，自己零支出，仲有得揀私家病房',
        lesson: '住院醫療保實報實銷，避免一次大病就侵蝕積蓄'
      },
      updates: [
        { t: '癌症治療加強', d: '2026 部分計劃加強標靶/免疫療法保障，睇清條款上限' },
        { t: '靈活計劃持續更新', d: '自願醫保靈活計劃保障表定期更新，投保前比較最新版本' },
        { t: '保證續保成重點', d: '老咗有病都續到保係揀醫療保嘅關鍵，唔好忽略' },
        { t: '高端醫療選擇多', d: '高端醫療（IMG）計劃更多，全球保障同私家醫院選擇更靈活' }
      ],
      selection: [
        { t: '揀房級', d: '按預算揀大房/半私家/私家' },
        { t: '計墊底費', d: '捱到嘅墊底費越高，保費越平' },
        { t: '睇續保條款', d: '確保有保證續保、保障地區合你需要' }
      ],
      faq: [
        { q: '醫療同危疾點分？', a: '醫療報醫院費，危疾一筆過補收入' },
        { q: '幾多保額啱？', a: '睇房級同保障地區，私家房要高年限額' },
        { q: '內地客買唔買到？', a: '可以，但要睇受保地區同核保要求' }
      ],
      pitfalls: [
        { t: '房級買大', d: '私家房保費貴，按需要揀' },
        { t: '無墊底費', d: '全包保費貴，加墊底費慳錢' },
        { t: '忽略續保', d: '無保證續保，老咗未必續到' }
      ],
      cta: '想搵個啱你預算又夠保障嘅醫療計劃？PM 我免費比較 💬'
    },
    accident: {
      facts: [
        { t: '保意外傷殘', d: '意外險保意外死亡/傷殘/醫療，槓桿高、保費平' },
        { t: '只保意外', d: '不保生病，所以同醫療/危疾互補，唔係取代' },
        { t: '傷殘按比例賠', d: '永久完全傷殘賠 100%，部分傷殘按傷殘表比例賠' },
        { t: '高風險加強', d: '經常出行/運動/高風險職業，加意外險更穩陣' }
      ],
      myths: [
        { t: '有醫療就夠', d: '錯！意外險嘅傷殘賠償醫療保冇，係一筆過現金' },
        { t: '意外險貴', d: '錯！意外險其實好平，槓桿高' }
      ],
      case: {
        background: '客戶 F 假日行山跌倒，斷手兼要做手術',
        need: '佢唔止要醫療費，仲驚短期內返唔到工冇收入',
        result: '意外險賠咗傷殘金 + 意外醫療費，停工期間都有收入補償',
        lesson: '意外險保嘅係傷殘同收入中斷，同醫療保互補'
      },
      updates: [
        { t: '住院現金附加', d: '部分計劃加每日住院現金，住院期間多一筆生活費' },
        { t: '核保更寬鬆', d: '意外險核保普遍簡單，好多職業都買到' },
        { t: '特定活動保障', d: '潛水、攀岩等可另加特別保障，出發前確認受保範圍' },
        { t: '傷殘定義要睇清', d: '永久傷殘同部分傷殘賠償比例各計劃不同，投保前要比較' }
      ],
      selection: [
        { t: '計保額', d: '保額揀年薪幾倍，傷殘先夠補' },
        { t: '睇傷殘表', d: '比較傷殘定義同賠償比例' },
        { t: '加意外醫療', d: '加意外醫療附加，門診碎骨都報' }
      ],
      faq: [
        { q: '同醫療分別？', a: '意外險保意外傷殘一筆過，醫療報醫院費' },
        { q: '職業影響？', a: '高風險職業保費貴啲，但照買到' }
      ],
      pitfalls: [
        { t: '保額買低', d: '傷殘賠償按比例，保額低補唔到' },
        { t: '唔包特定活動', d: '攀岩/潛水等可能除外，要加特別保障' }
      ],
      cta: '想加個平靚正嘅意外保障？PM 我幫你睇 💬'
    },
    mpf: {
      facts: [
        { t: '強制供款', d: '僱員僱主各供 5%（各上限 HK$1,500/月），強制為退休儲錢' },
        { t: 'TVC 可扣稅', d: '自願性供款（TVC）每年最多 HK$6 萬可扣稅，自己儲多啲又慳稅' },
        { t: '基金揀錯差很遠', d: '基金選擇影響回報，預設投資策略（DIS）較穩陣' },
        { t: '65 歲取回', d: '一般 65 歲取回，部分情況（如永久離港）可提早' }
      ],
      myths: [
        { t: '強積金夠退休', d: '錯！一般唔夠，要自補儲蓄/年金' },
        { t: '唔使理', d: '錯！基金揀錯回報差很遠，要定期檢視' }
      ],
      case: {
        background: '客戶 G 35 歲，開始諗退休規劃，想額外儲多筆退休錢同慳稅',
        need: '佢發現強積金強制供款未必夠退休，需要一個合法扣稅嘅自願儲蓄渠道',
        result: '用 TVC 每年供滿 HK$6 萬，一嚟扣稅二嚟儲多筆退休錢',
        lesson: '強積金係基本盤，想退休生活質素好啲要額外自願供款或配其他儲蓄'
      },
      updates: [
        { t: '積金易 eMPF 全面到位', d: '2026「積金易」平台全面運作，管理費下降，轉計劃更方便' },
        { t: 'TVC 上限 HK$6 萬', d: '自願性供款（TVC）每年扣稅上限維持 HK$6 萬' },
        { t: '預設投資策略較穩', d: '核心累積基金（DIS）適合唔想理嘅懶人，費用較低' },
        { t: '65 歲取回主流', d: '一般 65 歲可取回，永久離港等特定情況可提早' }
      ],
      selection: [
        { t: '檢視風險', d: '按年齡同風險承受揀股票/混合/保守基金' },
        { t: '用核心累積', d: '核心累積基金（DIS）平衡啲，適合大部分人' },
        { t: '考慮 TVC', d: '想扣稅又儲多筆，用 TVC 自願供款' }
      ],
      faq: [
        { q: 'TVC 點扣稅？', a: '每年上限 HK$6 萬，報稅填數扣應課稅入息' },
        { q: '提早拎到？', a: '永久離港等特定情況可以，一般 65 歲' }
      ],
      pitfalls: [
        { t: '唔理基金', d: '一直放保守基金跑輸，或放高風險承受唔住' },
        { t: '忽略收費', d: '基金收費蠶食回報，積金易後要比較' }
      ],
      cta: '想知你強積金點擺最著數、TVC 慳幾多稅？PM 我 💬'
    },
    generic: {
      facts: [
        { t: '先厘清目標', d: '想清楚你買呢樣嘢為咩——保障、儲蓄定傳承，目標定好先揀方案' },
        { t: '比較 2-3 個', d: '唔好第一個就買，比較市面 2-3 個方案嘅保障範圍同保費' },
        { t: '睇合約細則', d: '搵持牌顧問幫你睇合約細則同不保事項，避免中伏' },
        { t: '定期覆檢', d: '人生階段變（結婚、生仔、供樓）要覆檢保障夠唔夠' }
      ],
      myths: [
        { t: '最平就最啱', d: '錯！要睇保障夠唔夠，平可能保障少' },
        { t: '網上呃人', d: '錯！搵持牌保險中介就安全，可查牌照' },
        { t: '買一次就夠', d: '錯！要定期覆檢，人生變保障都要變' }
      ],
      case: {
        background: '好多客一開始都唔知自己缺咩，只係聽人講要買保險',
        need: '佢哋需要一個清晰嘅財務分析，先知道自己保障缺口同預算',
        result: '傾多幾句、做個財務分析，先發現原來保障有大缺口，最後對症下藥',
        lesson: '唔好盲目跟風，先釐清目標同缺口，先揀到啱自己嘅方案'
      },
      updates: [
        { t: '網上投保更普及', d: '2026 網上投保渠道更多，但要注意是否持牌中介' },
        { t: 'AI 分析工具興起', d: 'AI 工具可以幫做初步財務分析，但最終都要專業人手解讀' },
        { t: '資訊更透明', d: '保險公司披露要求更嚴格，投保前要主動查詢產品細則' },
        { t: '專業諮詢仍重要', d: '雖然資訊多，但個人情況千差萬別，搵專業幫手規劃更穩陣' }
      ],
      selection: [
        { t: '定目標', d: '先寫低你想解決咩問題' },
        { t: '計預算', d: '計下每月可以留幾多錢做規劃' },
        { t: '揀方案', d: '按目標同預算揀，唔好盲目跟風' }
      ],
      faq: [
        { q: '點開始？', a: '先做一次免費財務分析，知自己缺咩' },
        { q: '幾多錢起步？', a: '視乎目標，月供幾百都做到' }
      ],
      pitfalls: [
        { t: '盲目跟風', d: '人買你買，唔啱自己需要' },
        { t: '唔睇細則', d: '唔睇不保事項，出事先發現唔包' }
      ],
      cta: '想做一次免費財務分析、搵到啱你嘅方案？PM 我 💬'
    }
  };

  function defaultAngleHook(base, angle) {
    const m = {
      '懶人包': `【${base}】懶人包：3 分鐘搞掂你最關心嘅點`,
      '常見誤解': `關於${base}，呢幾個誤解令你好多人白白嘥咗錢`,
      '真實個案分享': `幫客處理${base}嘅真實個案，個情況好值得分享`,
      '2026 最新更新': `${base}｜2026 最新要注意嘅變動`,
      '點揀先啱自己': `${base}點揀先啱自己？3 步搞掂`,
      '避坑指南': `買${base}之前，呢幾個坑一定要避`,
      'Q&A 快問快答': `${base} Q&A：最多人問嘅幾條`
    };
    return m[angle] || `關於${base}`;
  }

  function entryKey(e) {
    if (e && e.q) return 'Q:' + e.q;
    return e && e.t ? e.t : JSON.stringify(e);
  }

  function pickAngleEntries(kb, angle, usedSet) {
    usedSet = usedSet || new Set();
    const out = [];
    const add = (e) => {
      const k = entryKey(e);
      if (!usedSet.has(k) && !out.some(o => entryKey(o) === k)) { out.push(e); }
    };

    switch (angle) {
      case '懶人包':
        (kb.facts || []).forEach(add);
        break;
      case '常見誤解':
        (kb.myths || []).forEach(add);
        break;
      case '真實個案分享':
        if (kb.case && typeof kb.case === 'object') {
          add({ t: '個案背景', d: kb.case.background });
          add({ t: '點解需要', d: kb.case.need });
          add({ t: '結果', d: kb.case.result });
          add({ t: '可以學到咩', d: kb.case.lesson });
        } else if (kb.case) {
          add({ t: '個案背景', d: kb.case });
        }
        break;
      case '2026 最新更新':
        (kb.updates || []).forEach(add);
        break;
      case '點揀先啱自己':
        (kb.selection || []).forEach(add);
        break;
      case '避坑指南':
        (kb.pitfalls || []).forEach(add);
        break;
      case 'Q&A 快問快答':
        (kb.faq || []).forEach(f => add({ t: f.q, d: f.a }));
        break;
      default:
        (kb.facts || []).forEach(add);
    }

    // 專屬角度內容不足 4 條，從未用過嘅 facts 補充，避免同系列重複
    if (out.length < 4) {
      const need = 4 - out.length;
      const extra = (kb.facts || []).filter(f => !usedSet.has(entryKey(f)) && !out.some(o => entryKey(o) === entryKey(f))).slice(0, need);
      out.push(...extra);
    }

    return out.slice(0, 4);
  }

  function generateDetailedContent(topic, angle, style, persona, usedSet) {
    const base = normalizeTopicSeed(topic);
    const dom = detectDomain(topic);
    const kb = TOPIC_KB[dom] || TOPIC_KB.generic;
    const hook = (kb.hooks && kb.hooks[angle]) ? kb.hooks[angle] : defaultAngleHook(base, angle);
    const entries = pickAngleEntries(kb, angle || '懶人包', usedSet);
    const canvasPoints = entries.map(e => e.t);
    const capPoints = entries.map(e => e.t + (e.d ? '：' + e.d : ''));
    const cta = kb.cta || '有疑問隨時 PM 我 💬，免費幫你做個人分析';
    return { hook, entries, canvasPoints, capPoints, cta };
  }

  // 統一內容入口：有角度後綴 → 用知識庫；否則 template → 否則 domain 通用
  function getRichContent(topic, style, persona, platform, usedSet) {
    const angle = getAngleOf(topic);
    if (angle) {
      const det = generateDetailedContent(topic, angle, style, persona, usedSet);
      return { hook: det.hook, points: det.capPoints, canvasPoints: det.canvasPoints, cta: det.cta, entries: det.entries };
    }
    const key = Object.keys(TEMPLATES.socialTopics).find(k => topic.includes(k) || k.includes(topic));
    if (key) {
      const b = TEMPLATES.socialTopics[key];
      const pts = b.keyPoints.map(p => ({ t: p, d: '' }));
      return { hook: b.hooks[0], points: b.keyPoints, canvasPoints: b.keyPoints, cta: b.cta, match: key, entries: pts };
    }
    const det = generateDetailedContent(topic, '', style, persona, usedSet);
    const hookByStyle = {
      professional: `【${topic}】專業分析：點樣做出明智決定`,
      casual: `講真，${topic}呢件事，好多人都諗錯咗`,
      educational: `關於${topic}，你需要知道嘅重點`,
      storytelling: `上個月幫一位客戶處理${topic}，佢嘅情況好值得分享`
    };
    return { hook: hookByStyle[style] || `關於${topic}`, points: det.capPoints, canvasPoints: det.canvasPoints, cta: det.cta, entries: det.entries };
  }

  function renderBatchPanel() {
    const box = document.getElementById('batchPanel');
    if (!box) return;
    box.innerHTML = `
      <label class="form-label">📅 批量生成一週內容（一次出多篇，自動排 EP 系列）</label>
      <textarea id="batchTopics" class="form-input" rows="3" placeholder="每行一個主題（留空就會用主題欄自動衍生 5 個角度）。例：\n危疾保障常見誤解\n自願醫保扣稅懶人包\n年輕家庭醫療規劃"></textarea>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <label style="font-size:13px;color:var(--muted)">篇數</label>
        <select id="batchCount" class="form-input" style="width:auto">
          <option value="5">5 篇</option>
          <option value="6">6 篇</option>
          <option value="7">7 篇</option>
        </select>
        <button class="btn btn-sm btn-primary" onclick="SocialModule.generateWeekBatch()">🚀 一鍵出一週內容</button>
      </div>
      <div id="batchOut"></div>
      <p class="cover-tip">每篇會自動配範本＋EP 編號＋小紅書 caption＋標籤，適合一次過排一週貼文。可逐篇下載圖／複製文案。</p>
    `;
  }

  async function generateWeekBatch() {
    const raw = (document.getElementById('batchTopics') ? document.getElementById('batchTopics').value : '').trim();
    const count = parseInt((document.getElementById('batchCount') ? document.getElementById('batchCount').value : '5'), 10) || 5;
    let topics = raw ? raw.split('\n').map(t => t.trim()).filter(Boolean) : [];
    if (!topics.length) {
      const seed = (document.getElementById('socialTopic') ? document.getElementById('socialTopic').value : '').trim();
      if (!seed) { alert('請喺上面「主題」欄填一個主題，或喺呢度逐行輸入多個主題。'); return { ok: false }; }
      topics = expandTopicsFromSeed(seed, count);
    } else if (topics.length < count) {
      // 主題數唔夠 → 由第一個主題自動衍生唔同角度，唔會重複
      topics = expandTopicsFromSeed(topics[0], count);
    }
    topics = topics.slice(0, count);

    const tpls = (typeof COVER_TEMPLATES !== 'undefined' ? COVER_TEMPLATES : []);
    const seriesName = (seriesState && seriesState.name) ? seriesState.name : '每週保險乾貨';
    const startEp = (seriesState && seriesState.ep) ? seriesState.ep : 1;
    const style = document.getElementById('socialStyle') ? document.getElementById('socialStyle').value : 'professional';
    const persona = personaProfile.enabled ? personaProfile.tone : (document.getElementById('socialPersona') ? document.getElementById('socialPersona').value : 'expert');
    const sig = personaSignature();

    const out = document.getElementById('batchOut');
    if (!out) return { ok: false };
    let html = `<div class="dup-warn" style="background:#eef2ff;border-color:#6366f1;color:#3730a3;margin-top:10px">📅 已生成 <b>${topics.length}</b> 篇（系列：${escapeHtml(seriesName)}，EP.${startEp}–EP.${startEp + topics.length - 1}）。逐篇有小紅書文案＋圖，可下載／複製。</div><div class="mp-grid">`;
    const items = [];
    const usedSet = new Set();
    topics.forEach((topic, idx) => {
      const ep = startEp + idx;
      const tpl = tpls.length ? tpls[idx % tpls.length] : { id: 'pro-navy', name: '專業' };
      const rich = getRichContent(topic, style, persona, 'xhs', usedSet);
      (rich.entries || []).forEach(e => usedSet.add(entryKey(e)));
      let cap = buildPlatformCaption(topic, 'xhs', style, persona, '', personaProfile.audience || 'all', rich);
      if (sig) cap += '\n\n' + sig;
      items.push({ topic, ep, tpl, cap, rich });
      html += `
        <div class="mp-card">
          <div class="mp-card-title">EP.${ep} · ${escapeHtml(topic)}</div>
          <div class="cover-wrap"><canvas id="batchCanvas_${idx}" class="social-canvas"></canvas></div>
          <div class="proposal-section" style="border-color:#6366f1">
            <h4>✍️ 小紅書文案</h4>
            <pre class="output-content" id="batchCap_${idx}">${escapeHtml(cap)}</pre>
            <button class="btn btn-sm btn-ghost copy-btn" onclick="copySingleText('batchCap_${idx}', this)">複製</button>
          </div>
          <button class="btn btn-sm btn-primary" onclick="SocialModule.downloadMultiCover('batchCanvas_${idx}','${topic.replace(/[\\/:?%*|<>"']/g, '_')}_EP${ep}')">⬇️ 圖</button>
        </div>`;
    });
    html += `</div><div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-sm btn-secondary" onclick="SocialModule.copyAllBatch(${topics.length})">複製全部文案</button>
    </div>`;
    out.innerHTML = html;

    // 畫每篇 canvas（小紅書 3:4）—— 暫時覆寫 seriesState 令每張顯示自己嘅 EP 徽章
    const savedSeries = Object.assign({}, seriesState);
    items.forEach((it, idx) => {
      const cv = document.getElementById('batchCanvas_' + idx);
      if (!cv) return;
      cv.width = 1080 * CANVAS_HD; cv.height = 1440 * CANVAS_HD;
      const built = buildContent(it.topic, 'xhs', '3:4', style, persona, '', 'post', null, it.tpl, it.rich);
      const data = { title: it.topic, tagline: built.hook, points: built.keyPoints };
      seriesState.active = true; seriesState.ep = it.ep; seriesState.name = seriesName;
      try { renderCover(cv, it.tpl, data, null); } catch (e) { console.warn(e); }
    });
    // 還原 seriesState，再推進 EP
    seriesState = Object.assign(seriesState, savedSeries);
    if (seriesState) { seriesState.ep = startEp + topics.length; saveSeries(); }
    try {
      Storage.addHistory({ type: 'social', topic: topics[0], platform: 'batch', ratio: '3:4', templateId: 'batch', templateName: seriesName, title: seriesName + ' 批量', caption: items[0] ? items[0].cap : '' });
      if (typeof updateDashboardStats === 'function') updateDashboardStats();
    } catch (e) {}
    return { ok: true, count: topics.length };
  }

  function copyAllBatch(n) {
    const parts = [];
    for (let i = 0; i < n; i++) { const e = document.getElementById('batchCap_' + i); if (e) parts.push('【EP】\n' + e.textContent); }
    const text = parts.join('\n\n————————\n\n');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => alert('已複製全部 ' + n + ' 篇文案')).catch(() => fallbackCopy(text));
    else fallbackCopy(text);
  }

  // ======================================================================
  // F — 擴展多平台文案：微信朋友圈 / WhatsApp Status / 抖音 / Telegram / LinkedIn
  // ======================================================================
  const EXTRA_PLATFORMS = [
    { key: 'wechat', name: '微信朋友圈' },
    { key: 'wa', name: 'WhatsApp Status' },
    { key: 'douyin', name: '抖音' },
    { key: 'telegram', name: 'Telegram' },
    { key: 'linkedin', name: 'LinkedIn' }
  ];

  function buildExtraCaption(topic, key, style, persona) {
    const T = (typeof TEMPLATES !== 'undefined' ? TEMPLATES : { socialTopics: {} });
    const match = Object.keys(T.socialTopics).find(k => topic.includes(k) || k.includes(topic));
    const base = match ? T.socialTopics[match] : null;
    let hook = base ? base.hooks[0] : `關於${topic}，分享幾個重點`;
    let points = base ? base.keyPoints : ['點解重要', '常見誤解', '正確做法'];
    let cta = base ? base.cta : '有興趣了解，隨時搵我';
    if (personaProfile.enabled && personaProfile.cta) cta = personaProfile.cta;
    const tags = suggestTags(topic, key === 'douyin' ? 'xhs' : key);
    const sig = personaSignature();
    let body;
    if (key === 'wechat') {
      body = `${hook}\n\n${points.map(p => `▪️ ${p}`).join('\n')}\n\n${cta}`;
    } else if (key === 'wa') {
      // Status 要短
      body = `${hook}\n👉 ${cta}`;
    } else if (key === 'douyin') {
      body = `${hook}\n\n${points.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n${cta}\n\n${tags} #抖音 #保險科普`;
    } else if (key === 'telegram') {
      body = `📢 ${hook}\n\n${points.map(p => `• ${p}`).join('\n')}\n\n${cta}`;
    } else { // linkedin
      body = `${hook}\n\n${points.map(p => `• ${p}`).join('\n')}\n\n身為香港保險從業員，我相信專業規劃能為家庭帶來長遠保障。${cta}\n\n${tags}`;
    }
    if (sig) body += '\n\n' + sig;
    return body;
  }

  function appendExtraPlatforms(topic) {
    topic = (topic || (document.getElementById('socialTopic') ? document.getElementById('socialTopic').value : '') || '').trim();
    if (!topic) { alert('請先填主題。'); return; }
    const style = document.getElementById('socialStyle') ? document.getElementById('socialStyle').value : 'professional';
    const persona = personaProfile.enabled ? personaProfile.tone : (document.getElementById('socialPersona') ? document.getElementById('socialPersona').value : 'expert');
    const mount = document.getElementById('mpExtraOut') || document.getElementById('socialOutput');
    if (!mount) return;
    let html = `<div class="dup-warn" style="background:#f0f9ff;border-color:#0ea5e9;color:#075985;margin-top:12px">🌐 更多平台文案（已按各平台特性調整長短／語氣）：</div><div class="mp-grid">`;
    EXTRA_PLATFORMS.forEach(p => {
      const cap = buildExtraCaption(topic, p.key, style, persona);
      html += `
        <div class="mp-card">
          <div class="mp-card-title">📱 ${p.name}</div>
          <div class="proposal-section" style="border-color:#0ea5e9">
            <pre class="output-content" id="exCap_${p.key}">${escapeHtml(cap)}</pre>
            <button class="btn btn-sm btn-ghost copy-btn" onclick="copySingleText('exCap_${p.key}', this)">複製</button>
          </div>
        </div>`;
    });
    html += `</div>`;
    mount.innerHTML = html;
    return true;
  }

  // 獨立按鈕：由主表單直接出更多平台文案
  function generateExtraPlatforms() {
    const topic = (document.getElementById('socialTopic') ? document.getElementById('socialTopic').value : '').trim();
    if (!topic) { alert('請先填「主題」。'); return; }
    const out = document.getElementById('socialOutput');
    if (out) { out.className = 'output-box filled'; out.innerHTML = '<div id="mpExtraOut"></div>'; }
    appendExtraPlatforms(topic);
  }

  // ===== 每日市場焦點：面板 + 生成 =====
  function todayCN() {
    const d = new Date();
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }
  const MF_FLAGS = ['US', 'BR', 'KR', 'HK', 'CN', 'UK', 'JP', ''];
  const MF_ICONS = ['clock', 'rate', 'chart', 'building', 'bulb', 'globe', 'news', ''];
  const MF_SAMPLES = [
    { flag: 'US', flag2: 'BR', icon: 'clock', title: '美國擬對巴西徵 25% 關稅', subtitle: '自下周三起，多項商品受影響' },
    { flag: 'KR', icon: 'rate', title: '南韓一如預期加息 0.25 厘', subtitle: '指標利率升至 2.75%' },
    { flag: 'HK', icon: 'chart', title: '香港投資管理公司表現亮眼', subtitle: '去年投資收入增 1.75 倍' }
  ];
  // 從新聞 description 抽副標題（去 HTML、取第一句或截斷）
  function extractNewsSubtitle(desc) {
    if (!desc) return '';
    const text = desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const first = text.split(/[。！？\n]/)[0].trim();
    if (first.length <= 55) return first;
    return text.slice(0, 52) + '...';
  }
  // 根據標題/內容關鍵詞估國旗
  function guessNewsFlags(text) {
    const t = (text || '').toLowerCase();
    const flags = [];
    if (t.includes('香港') || t.includes('港股') || t.includes('港')) flags.push('HK');
    if (t.includes('中國') || t.includes('內地') || t.includes('a股') || t.includes('人民幣')) flags.push('CN');
    if (t.includes('美國') || t.includes('美股') || t.includes('聯儲') || t.includes('特朗普') || t.includes('美元')) flags.push('US');
    if (t.includes('英國') || t.includes('英鎊') || t.includes('歐洲')) flags.push('UK');
    if (t.includes('日本') || t.includes('日圓') || t.includes('日股')) flags.push('JP');
    if (t.includes('韓國') || t.includes('南韓')) flags.push('KR');
    if (t.includes('巴西')) flags.push('BR');
    return flags.slice(0, 2); // 最多兩面旗
  }
  // 根據標題/內容估圖標
  function guessNewsIcon(text) {
    const t = (text || '').toLowerCase();
    if (t.includes('利率') || t.includes('加息') || t.includes('降息') || t.includes('通脹') || t.includes('通縮') || t.includes('匯率') || t.includes('貨幣')) return 'rate';
    if (t.includes('股') || t.includes('指數') || t.includes('大市') || t.includes('收市') || t.includes('港股') || t.includes('美股')) return 'chart';
    if (t.includes('公司') || t.includes('企業') || t.includes('盈利') || t.includes('業績') || t.includes('港交所')) return 'building';
    if (t.includes('關稅') || t.includes('貿易') || t.includes('協議') || t.includes('談判') || t.includes('全球')) return 'globe';
    if (t.includes('油') || t.includes('金') || t.includes('商品') || t.includes('價格')) return 'news';
    return 'clock';
  }
  async function fetchTodayNews() {
    const btn = document.getElementById('mfFetchNews');
    const orig = btn ? btn.innerHTML : '📡 一撳擷取今日財經新聞';
    const setBusy = (b) => { if (btn) { btn.disabled = b; btn.innerHTML = b ? '⏳ 擷取中...' : orig; } };
    setBusy(true);
    try {
      // 優先用香港 RTHK 財經，其次香港政府財經，最後 Yahoo Finance 英文財經
      const feeds = [
        'https://rthk.hk/rthk/news/rss/c_expressnews_cfinance.xml',
        'https://www.news.gov.hk/tc/categories/finance/html/articlelist.rss.xml',
        'https://feeds.finance.yahoo.com/rss/2.0/headline'
      ];
      let allItems = [];
      let usedFeed = '';
      for (const feedUrl of feeds) {
        try {
          const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feedUrl) + '&_=' + Date.now();
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(apiUrl, { signal: controller.signal });
          clearTimeout(timer);
          if (!res.ok) continue;
          const data = await res.json();
          if (data.status === 'ok' && Array.isArray(data.items) && data.items.length) {
            allItems = data.items;
            usedFeed = feedUrl;
            break;
          }
        } catch (e) {}
      }
      if (!allItems.length) throw new Error('暫時搵唔到財經新聞，請手動輸入');
      // 優先揀 24 小時內嘅新聞，若唔夠 3 條就 fallback 最新
      const now = new Date().getTime();
      const dayAgo = now - 24 * 60 * 60 * 1000;
      const recent = allItems.filter(it => {
        try { return new Date(it.pubDate).getTime() > dayAgo; } catch (e) { return false; }
      });
      const top = (recent.length >= 3 ? recent : allItems).slice(0, 3);
      for (let i = 1; i <= 3; i++) {
        const it = top[i - 1];
        if (!it) continue;
        const titleEl = document.getElementById('mfTitle_' + i);
        const subEl = document.getElementById('mfSub_' + i);
        const flag1El = document.getElementById('mfFlag1_' + i);
        const flag2El = document.getElementById('mfFlag2_' + i);
        const iconEl = document.getElementById('mfIcon_' + i);
        if (titleEl) titleEl.value = it.title || '';
        if (subEl) subEl.value = extractNewsSubtitle(it.description || '');
        const flags = guessNewsFlags(it.title + ' ' + (it.description || ''));
        if (flag1El) flag1El.value = flags[0] || '';
        if (flag2El) flag2El.value = flags[1] || '';
        if (iconEl) iconEl.value = guessNewsIcon(it.title + ' ' + (it.description || ''));
      }
      const dateEl = document.getElementById('mfDate');
      if (dateEl) dateEl.value = todayCN();
      alert('已填上最新 ' + top.length + ' 條財經新聞（來源：' + (usedFeed.includes('rthk') ? 'RTHK' : usedFeed.includes('gov.hk') ? '香港政府新聞' : 'Yahoo Finance') + '），你可以再編輯');
    } catch (e) {
      alert(e.message || '擷取新聞失敗');
    } finally {
      setBusy(false);
    }
  }
  function renderMarketFocusPanel() {
    const host = document.getElementById('mfItems');
    if (!host || host.dataset.built) return;
    let html = '';
    for (let i = 1; i <= 3; i++) {
      const s = MF_SAMPLES[i - 1];
      const flagOpts = MF_FLAGS.map(f => `<option value="${f}" ${f === s.flag ? 'selected' : ''}>${f || '無'}</option>`).join('');
      const flag2Opts = MF_FLAGS.map(f => `<option value="${f}" ${f === s.flag2 ? 'selected' : ''}>${f || '無'}</option>`).join('');
      const iconOpts = MF_ICONS.map(ic => `<option value="${ic}" ${ic === s.icon ? 'selected' : ''}>${ic || '無'}</option>`).join('');
      html += `<div style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px;margin-bottom:8px;background:#fff">
        <b style="font-size:13px">新聞 ${i}</b>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:6px 0">
          <select class="form-select" id="mfFlag1_${i}">${flagOpts}</select>
          <select class="form-select" id="mfFlag2_${i}">${flag2Opts}</select>
          <select class="form-select" id="mfIcon_${i}">${iconOpts}</select>
        </div>
        <input type="text" class="form-input" id="mfTitle_${i}" value="${s.title}" placeholder="標題" style="margin-bottom:6px">
        <input type="text" class="form-input" id="mfSub_${i}" value="${s.subtitle}" placeholder="副標題／重點">
      </div>`;
    }
    host.innerHTML = html;
    host.dataset.built = '1';
  }
  function toggleMarketFocusPanel() {
    const p = document.getElementById('marketFocusPanel');
    if (!p) return;
    const show = p.style.display === 'none' || !p.style.display;
    p.style.display = show ? 'block' : 'none';
    if (show) renderMarketFocusPanel();
  }
  function generateMarketFocus() {
    const agent = (document.getElementById('mfAgent').value || '').trim() || 'HUI YUEN SHU JACKSON';
    const date = (document.getElementById('mfDate').value || '').trim() || todayCN();
    const tagline = (document.getElementById('mfTagline').value || '').trim() || '專業 · 誠信 · 穩健';
    const cta = (document.getElementById('mfCta').value || '').trim() || '私訊了解詳情';
    const lux = document.getElementById('mfVersion').value === 'lux';
    const items = [];
    for (let i = 1; i <= 3; i++) {
      const title = (document.getElementById('mfTitle_' + i).value || '').trim();
      const subtitle = (document.getElementById('mfSub_' + i).value || '').trim();
      if (!title && !subtitle) continue;
      items.push({
        flag: document.getElementById('mfFlag1_' + i).value,
        flag2: document.getElementById('mfFlag2_' + i).value,
        icon: document.getElementById('mfIcon_' + i).value,
        title, subtitle
      });
    }
    if (!items.length) { alert('請填至少一條市場新聞'); return; }
    const tpl = (typeof COVER_TEMPLATES !== 'undefined' ? COVER_TEMPLATES : []).find(t => t.id === (lux ? 'market-focus-lux' : 'market-focus'));
    if (!tpl) { alert('搵唔到 market_focus 範本'); return; }
    const data = { title: '每日市場焦點', date, agent, tagline, cta, items };
    const out = document.getElementById('socialOutput');
    out.className = 'output-box filled';
    const ratio = '4:5';
    const dims = ratioToDims(ratio);
    out.innerHTML = `<div class="proposal-section" style="border-color:#3b82f6">
      <h4>📊 每日市場焦點${lux ? ' · 華麗版' : ''}</h4>
      <div class="cover-wrap"><canvas id="mfCanvas" class="social-canvas"></canvas></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="btn btn-sm btn-primary" onclick="SocialModule.downloadMultiCover('mfCanvas','market_focus')">⬇️ 圖</button>
        <button class="btn btn-sm btn-secondary" onclick="SocialModule.openMultiInCanva('xhs')">🎨 Canva</button>
      </div>
    </div>`;
    const cv = document.getElementById('mfCanvas');
    cv.width = dims.w * CANVAS_HD; cv.height = dims.h * CANVAS_HD;
    try { renderCover(cv, tpl, data); } catch (e) { console.warn(e); }
    try {
      Storage.addHistory({ type: 'social', topic: '每日市場焦點', platform: 'multi', ratio, templateId: tpl.id, templateName: tpl.name, title: '每日市場焦點' });
      if (typeof updateDashboardStats === 'function') updateDashboardStats();
    } catch (e) {}
  }

  window.generateSocialContent = generate;
  window.SocialModule = {
    init, rerenderWithSelected, markPublished, saveRedFoxKey, saveImageGenKey, toggleAiBackground,
    searchTrendTemplates, applyTrend, useAiAvatar, clearAvatar, toggleSeries, openInCanva,
    generateMultiPlatform, generateRealistic, downloadMultiCover, openMultiInCanva, copyAllMulti,
    // A–F 小紅書強化
    savePersona, generateTags, scanCompliance, scanCurrentOutput,
    analyzeViral, rewriteViral, generateWeekBatch, copyAllBatch,
    appendExtraPlatforms, generateExtraPlatforms,
    // 每日市場焦點（金融快訊圖）
    generateMarketFocus, toggleMarketFocusPanel, renderMarketFocusPanel, fetchTodayNews
  };
  // 測試用內部 hook（唔影響一般用戶）
  window.SocialModule.__test = {
    renderCover,
    setSeries: (s) => { seriesState = Object.assign(seriesState, s); },
    setAvatar: (img) => { avatarImage = img; },
    setPersona: (p) => { personaProfile = Object.assign(personaProfile, p); },
    personaSignature,
    suggestTags,
    checkCompliance,
    parseViral,
    rewriteViralText: (raw) => { const el = document.getElementById('viralInput'); if (el) el.value = raw; return rewriteViral(); },
    buildExtraCaption,
    expandTopicsFromSeed,
    normalizeTopicSeed,
    generateDetailedContent,
    getRichContent,
    detectDomain,
    COMPLIANCE_RULES,
    EXTRA_PLATFORMS,
    renderMarketFocus, drawFlag, drawIcon
  };
})();