// ===== Social.js — 社交內容引擎（一鍵出文案＋真正出圖）=====
(function() {
  let state = { type: 'post', templateId: 'pro-navy', last: null };

  // 畫廊迷你預覽用嘅示範數據
  const SAMPLE = {
    title: '醫療保障規劃',
    tagline: '你嘅保障，夠未？',
    points: ['公院 vs 私院', '全家點配置', '預算點分配']
  };

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
      label.innerHTML = `<span class="tpl-cat">${escapeHtml(tpl.cat)}</span>${escapeHtml(tpl.name)}`;
      card.appendChild(label);
      card.onclick = () => {
        state.templateId = tpl.id;
        document.querySelectorAll('.tpl-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        if (document.getElementById('socialCanvas')) rerenderWithSelected();
      };
      wrap.appendChild(card);
      renderCover(cv, tpl, SAMPLE);
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

    const font = (wt, size) => `${wt} ${Math.round(size)}px "PingFang SC","Microsoft YaHei","Heiti SC","Noto Sans CJK SC",sans-serif`;
    const pad = W * 0.07;
    const portrait = H >= W;
    const base = Math.min(W, H);
    const titleSize = Math.round(base * (portrait ? 0.14 : 0.17));

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

    // 要點（bullet）
    if (data.points && data.points.length) {
      const bFont = font(600, Math.round(titleSize * 0.34));
      let by2 = y;
      data.points.slice(0, 3).forEach(pt => {
        const bl = wrapText(ctx, pt, bFont, W - pad * 2 - W * 0.04, 2);
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

    // 底部品牌 + 分隔線
    const fy = H - pad - titleSize * 0.3;
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = tpl.accent; ctx.lineWidth = W * 0.004;
    ctx.beginPath();
    ctx.moveTo(pad, fy - W * 0.02);
    ctx.lineTo(W - pad, fy - W * 0.02);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = tpl.footer.color;
    ctx.font = font(600, Math.round(W * 0.028));
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(tpl.footer.text, pad, fy);
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

    Storage.addHistory({
      type: 'social', topic,
      platform, ratio,
      templateId: tpl ? tpl.id : '', templateName: tpl ? tpl.name : '',
      title: topic, caption: built.caption
    });
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
        </div>
        <p class="cover-tip">小貼士：封面大字按小紅書爆款規律設計（高對比、易讀）。落去前可改主題字再重出；用過嘅範本同文案會自動記錄，避免重覆。</p>
      </div>

      <div style="margin-top:14px;display:flex;gap:8px">
        <button class="btn btn-sm btn-secondary" onclick="copyText(this)">複製全部</button>
      </div>
    `;

    return { html, caption, hook, keyPoints };
  }

  // ===== 查重：避免重覆使用 =====
  function findDuplicate(topic, templateId) {
    const h = (Storage.getHistory() || []).filter(e => e.type === 'social');
    const t = (topic || '').trim();
    const fmt = d => { try { return new Date(d).toLocaleDateString('zh-HK'); } catch { return ''; } };
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

  window.generateSocialContent = generate;
  window.SocialModule = { init, rerenderWithSelected };
})();
