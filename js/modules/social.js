// ===== Social.js — 社交內容引擎（一鍵出文案＋真正出圖）=====
(function() {
  let state = { type: 'post', templateId: 'pro-navy', last: null, lastHistoryId: null };

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
      tagline: tpl.mascot ? `${tpl.mascot} ${s.tagline}` : s.tagline,
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
  function renderCover(canvas, tpl, data) {
    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return; // 無 2d context（如測試環境）就跳過
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // 背景漸變
    const g = tpl.bg.dir === 'd'
      ? ctx.createLinearGradient(0, 0, W, H)
      : ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, tpl.bg.from);
    g.addColorStop(1, tpl.bg.to);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 淺色範本加邊框
    if (tpl.border) {
      ctx.strokeStyle = tpl.accent;
      ctx.lineWidth = Math.max(6, W * 0.012);
      ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
    }

    drawDecor(ctx, tpl, W, H);

    // 預先計算常用尺寸（要在畫 mascot / badge 之前）
    const pad = W * 0.07;
    const base = Math.min(W, H);
    const portrait = H >= W;
    const titleSize = Math.round(base * (portrait ? 0.14 : 0.17));
    const font = (wt, size) => `${wt} ${Math.round(size)}px "PingFang SC","Microsoft YaHei","Heiti SC","Noto Sans CJK SC",sans-serif`;

    // 卡通主角 emoji（右上角大圖，漫畫吸睛感）
    if (tpl.mascot) {
      ctx.font = `${Math.round(base * 0.30)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif`;
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText(tpl.mascot, W - pad, pad);
    }

    let y = pad;

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

    // 標題（大字）
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillStyle = tpl.titleColor;
    const titleFont = font(tpl.titleWeight, titleSize);
    const lines = wrapText(ctx, data.title, titleFont, W - pad * 2, 3);
    lines.forEach((ln, i) => ctx.fillText(ln, pad, y + i * titleSize * 1.18));
    y += lines.length * titleSize * 1.18 + W * 0.03;

    // 副標題（tagline）
    if (data.tagline) {
      ctx.fillStyle = tpl.subColor;
      const subFont = font(600, Math.round(titleSize * 0.40));
      const sl = wrapText(ctx, data.tagline, subFont, W - pad * 2, 2);
      sl.forEach((ln, i) => ctx.fillText(ln, pad, y + i * titleSize * 0.5));
      y += sl.length * titleSize * 0.5 + W * 0.03;
    }

    // 要點（bullet）—— 預留底部 footer 空間，避免疊字
    if (data.points && data.points.length) {
      const bFont = font(600, Math.round(titleSize * 0.34));
      let by2 = y;
      const footerReserve = titleSize * 0.9;
      const maxBottom = H - pad - footerReserve;
      data.points.slice(0, 3).forEach(pt => {
        if (by2 >= maxBottom) return; // 無位就唔再畫
        const bl = wrapText(ctx, pt, bFont, W - pad * 2 - W * 0.04, 2);
        // 如果畫完會超界，縮細啲再試一次
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

    // 對話氣泡（右下角，卡通角色「說話」，吸睛）
    if (tpl.bubble) drawBubble(ctx, tpl, W, H, pad, base);

    // 底部品牌（右下角，細字 + 半透明底，唔遮住內容）
    const footerH = Math.max(W * 0.045, titleSize * 0.35);
    const fx = W - pad;
    const fy = H - pad - footerH / 2;
    const fText = tpl.footer.text;
    ctx.font = font(500, Math.round(W * 0.024));
    const fW = ctx.measureText(fText).width + W * 0.03;
    // 統一深色半透明底 + 白色字，任何背景都睇到
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    roundRect(ctx, fx - fW, fy - footerH / 2, fW, footerH, footerH * 0.3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
    ctx.fillText(fText, fx - W * 0.015, fy);
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
    }
    ctx.restore();
  }

  // 對話氣泡（卡通角色「說話」）—— 右下角，白色圓角框 + 左下小三角
  function drawBubble(ctx, tpl, W, H, pad, base) {
    const text = tpl.bubble || '';
    if (!text) return;
    const fs = Math.round(base * 0.052);
    const f = `600 ${fs}px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif`;
    ctx.font = f;
    const maxW = W * 0.50;
    const lines = wrapText(ctx, text, f, maxW, 3);
    const lh = fs * 1.32;
    const tw = Math.max.apply(null, lines.map(l => ctx.measureText(l).width));
    const bw = Math.min(maxW, tw) + W * 0.06;
    const bh = lines.length * lh + W * 0.05;
    const bx = W - pad - bw;          // 靠右
    const by = H * 0.60;              // 中下偏底，避開標題同 footer，亦避開左側要點
    // 框
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    roundRect(ctx, bx, by, bw, bh, W * 0.035); ctx.fill();
    // 小三角（指向左下，似角色在右下講嘢）
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.78, by + bh);
    ctx.lineTo(bx + bw * 0.62, by + bh + W * 0.045);
    ctx.lineTo(bx + bw * 0.90, by + bh);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.fill();
    // 文字
    ctx.fillStyle = '#15171c';
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
  function generate() {
    const topic = document.getElementById('socialTopic').value.trim();
    if (!topic) { alert('請填寫主題'); return; }

    const platform = document.getElementById('socialPlatform').value;
    const ratio = document.getElementById('socialRatio').value;
    const style = document.getElementById('socialStyle').value;
    const persona = document.getElementById('socialPersona').value;
    const extra = document.getElementById('socialExtra').value.trim();
    const tpl = (typeof COVER_TEMPLATES !== 'undefined' ? COVER_TEMPLATES : []).find(t => t.id === state.templateId) || null;

    const dupMsg = findDuplicate(topic, tpl ? tpl.id : '');
    const built = buildContent(topic, platform, ratio, style, persona, extra, state.type, dupMsg);

    const out = document.getElementById('socialOutput');
    out.className = 'output-box filled';
    out.innerHTML = built.html;

    // 出圖
    const canvas = document.getElementById('socialCanvas');
    if (canvas && tpl) {
      const dims = ratioToDims(ratio);
      canvas.width = dims.w; canvas.height = dims.h;
      renderCover(canvas, tpl, { title: topic, tagline: built.hook, points: built.keyPoints });
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
  }

  function buildContent(topic, platform, ratio, style, persona, extra, type, dupMsg) {
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
  window.SocialModule = { init, rerenderWithSelected, markPublished, saveRedFoxKey, searchTrendTemplates, applyTrend };
})();