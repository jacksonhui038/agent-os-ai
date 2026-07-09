// ===== Proposal.js — Proposal 引擎 (升級版 v2) =====
(function() {
  let selectedProducts = [];

  function init() {
    populateProducts();
    attachStyleChips();
  }

  // 動態生成產品 chips（按類別分組，最多選 3 個）
  function populateProducts() {
    const wrap = document.getElementById('propProducts');
    if (!wrap || !window.PRODUCTS) return;
    const cats = window.PRODUCT_CATEGORIES || {};
    let html = '';
    Object.keys(cats).forEach(catKey => {
      const items = Object.values(window.PRODUCTS).filter(p => p.category === catKey);
      if (items.length) {
        html += `<div style="width:100%;font-size:12px;color:var(--text-tertiary);margin:8px 0 2px">${cats[catKey]}</div>`;
        items.forEach(p => {
          html += `<span class="chip chip-outline prop-chip" data-val="${p.id}" title="${p.insurer}">${p.insurer.split(' ')[0]} · ${p.name}</span>`;
        });
      }
    });
    wrap.innerHTML = html;
    wrap.querySelectorAll('.prop-chip').forEach(el => {
      el.addEventListener('click', () => {
        const active = wrap.querySelectorAll('.prop-chip.active');
        if (!el.classList.contains('active') && active.length >= 3) {
          alert('最多只可以揀 3 個產品（建議書要聚焦）');
          return;
        }
        el.classList.toggle('active');
        selectedProducts = Array.from(wrap.querySelectorAll('.prop-chip.active')).map(e => e.dataset.val);
      });
    });
  }

  function attachStyleChips() {
    document.querySelectorAll('.prop-style-chip').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.prop-style-chip').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
      });
    });
  }

  function getStyleKey() {
    const el = document.querySelector('.prop-style-chip.active');
    return el ? el.dataset.val : 'advisor';
  }

  function getClient() {
    const clientId = document.getElementById('propClientSelect').value;
    let client = null;
    if (clientId) client = Storage.getClient(clientId);
    else if (window._lastAnalyzedClient) client = window._lastAnalyzedClient;
    return client;
  }

  function generate() {
    const client = getClient();
    if (!client) { alert('請先選擇客戶或在客戶分析模組輸入資料'); return; }

    const ids = selectedProducts.length ? selectedProducts : Array.from(document.querySelectorAll('.prop-chip.active')).map(e => e.dataset.val);
    if (ids.length === 0) { alert('請至少選擇一個產品'); return; }

    const depth = document.getElementById('propDepth').value;
    const audience = document.getElementById('propAudience').value;
    const title = document.getElementById('propTitle').value.trim() || `${client.name} 保障建議書`;
    const styleKey = getStyleKey();
    const styleMeta = (window.PROPOSAL_STYLES && window.PROPOSAL_STYLES[styleKey]) || { label:'專業顧問式', coverSubtitle:'專業保障方案', accent:'#1e3a5f' };

    const products = buildProductDetails(ids, client);
    client.solutionLogic = buildSolutionLogic(products, client);

    const html = renderProposal(client, products, depth, audience, title, styleMeta);
    document.getElementById('proposalOutput').className = 'output-box filled';
    document.getElementById('proposalOutput').innerHTML = html;

    Storage.addHistory({ type: 'proposal', client: client.name, title, products: ids, style: styleKey, depth });
    updateDashboardStats();
  }

  function buildProductDetails(ids, client) {
    if (!window.PRODUCTS) return [];
    return ids.map(id => window.PRODUCTS[id]).filter(Boolean).map(p => ({
      ...p,
      desc: buildProductDesc(p)
    }));
  }

  function buildProductDesc(p) {
    return `🏢 ${p.insurer}\n📌 ${p.tagline}\n✅ ${p.highlights.join('／')}\n🎯 適合：${p.bestFor}\n💰 月供由 $${p.monthlyFrom} 起${p.taxDeductible ? '（可扣稅）' : ''}\n💡 ${p.notes}`;
  }

  function buildSolutionLogic(products, client) {
    const parts = [];
    if (client.age && client.age < 35) parts.push('年輕投保享有最低保費優勢，建議趁早鎖定長期保障');
    else if (client.age && client.age > 45) parts.push('根據年齡調整配置策略，優先確保核心保障充足');

    if (client.kids > 0) parts.push(`有 ${client.kids} 名子女，建議以「家庭保障」為出發點`);
    if (client.marital === 'married') parts.push('已婚狀況下需考慮配偶及全家保障需求');

    if (client.income && client.income > 80000) parts.push('收入水平較高，可考慮更全面的保障配置');
    else if (client.income && client.income < 30000) parts.push('預算有限情況下建議分階段配置，優先醫療＋危疾');

    // 基於揀咗嘅真實產品給配置建議
    products.forEach(p => {
      if (p.taxDeductible) parts.push(`利用 ${p.name} 嘅稅務扣減優惠，實際降低保費負擔`);
      if (p.category === 'retirement') parts.push(`透過 ${p.name} 鎖定退休後穩定現金流`);
      if (p.category === 'ci') parts.push(`以 ${p.name} 做家庭經濟支柱嘅收入替代保障`);
    });

    return parts.join('；') || '按客戶實際需求，分階段配置保障';
  }

  function renderProposal(client, products, depth, audience, title, styleMeta) {
    const depthLabels = { comprehensive:'全面詳細版', concise:'精簡版', comparison:'對比分析版', story:'故事情境版' };
    const audienceLabels = { client:'客戶本人', couple:'夫妻共同決策', family:'全家保障' };

    const styleIntro = {
      advisor: '本建議書基於專業風險評估，為您提供審慎、客觀的配置建議。',
      data: '以下以數據與比較為基礎，協助您清楚了解各方案優劣。',
      warm: '我們以守護您與家人幸福為出發點，準備咗呢份貼心方案。'
    };

    let html = `<div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-sm btn-secondary" onclick="copyText(this)">複製全部</button>
      <button class="btn btn-sm btn-ghost" onclick="window.print()">🖨️ 列印</button>
      <button class="btn btn-sm btn-primary" onclick="generateProposalPPT()">📊 下載 PPT</button>
    </div>

    <div style="text-align:center;margin-bottom:24px;padding:24px;background:${styleMeta.accent};border-radius:var(--radius);color:#fff">
      <div style="font-size:12px;letter-spacing:2px;opacity:.8">PROPOSAL</div>
      <h2 style="font-size:24px;margin:6px 0 4px">${escapeHtml(title)}</h2>
      <p style="font-size:14px;opacity:.92">${styleMeta.coverSubtitle}</p>
      <p style="font-size:12px;opacity:.75;margin-top:8px">客戶：${escapeHtml(client.name)} · 風格：${styleMeta.label} · 詳細度：${depthLabels[depth]} · 受眾：${audienceLabels[audience]}</p>
      <p style="font-size:11px;opacity:.65">製作日期：${new Date().toLocaleDateString('zh-HK')}</p>
    </div>`;

    html += `<div class="proposal-section" style="border-color:${styleMeta.accent}">
      <h4 style="color:${styleMeta.accent}">💡 關於呢份建議書</h4>
      <p style="font-size:14px">${styleIntro[getStyleKey()] || styleIntro.advisor}</p>
    </div>`;

    // Sections（保留原有結構）
    if (typeof TEMPLATES !== 'undefined' && TEMPLATES.proposalSections) {
      TEMPLATES.proposalSections.forEach(section => {
        html += `<div class="proposal-section">
          <h4>${section.icon} ${section.title}</h4>
          <p>${escapeHtml(section.template(client, products)).replace(/\n/g, '<br>')}</p>
        </div>`;
      });
    }

    // 產品詳情
    html += `<div class="proposal-section"><h4>📦 推薦產品詳情</h4>`;
    products.forEach(p => {
      html += `<div style="background:var(--surface);padding:14px;border-radius:8px;margin-bottom:10px;border:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <strong style="color:${styleMeta.accent};font-size:15px">${escapeHtml(p.name)}</strong>
          <span style="font-size:11px;color:var(--text-tertiary)">${escapeHtml(p.insurer)} · ${escapeHtml((window.PRODUCT_CATEGORIES||{})[p.category]||'')}</span>
        </div>
        <pre style="font-size:13px;margin-top:6px;white-space:pre-wrap;color:var(--text-secondary)">${escapeHtml(p.desc).replace(/\n/g, '<br>')}</pre>
      </div>`;
    });
    html += `</div>`;

    if (depth === 'comparison') html += renderComparisonTable(products, styleMeta);
    else if (depth === 'story') html += renderStorySection(client, styleMeta);

    html += `<div style="margin-top:20px;padding:14px;background:#fefce8;border-radius:8px;font-size:12px;color:#854d0e;border:1px solid #fde68a">
      ⚠️ 免責聲明：此建議書由 Agent OS AI 工具生成，僅供參考。實際保費、保障範圍及條款以保單文件為準。
      建議與持牌保險顧問確認細節後才作出投保決定。
    </div>`;

    return html;
  }

  function renderComparisonTable(products, styleMeta) {
    const cats = window.PRODUCT_CATEGORIES || {};
    let h = `<div class="proposal-section"><h4>📊 方案比較</h4>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr style="background:${styleMeta.accent};color:#fff"><th style="padding:8px;border:1px solid var(--border)">項目</th>`;
    products.forEach(p => h += `<th style="padding:8px;border:1px solid var(--border)">${escapeHtml(p.name.slice(0,8))}</th>`);
    h += '</tr>';

    const rows = [
      ['保險公司', ...products.map(p => p.insurer)],
      ['類別', ...products.map(p => cats[p.category] || '-')],
      ['主打', ...products.map(p => p.tagline)],
      ['月供(起)', ...products.map(p => '$' + p.monthlyFrom)],
      ['稅務優惠', ...products.map(p => p.taxDeductible ? '✅ 可扣稅' : '-')],
      ['適合對象', ...products.map(p => p.bestFor)]
    ];

    rows.forEach((row, ri) => {
      h += '<tr style="background:' + (ri % 2 ? 'var(--bg)' : 'var(--surface)') + '">';
      row.forEach((cell, i) => h += `<td style="padding:8px;border:1px solid var(--border)${i === 0 ? ';font-weight:600' : ''}">${escapeHtml(String(cell))}</td>`);
      h += '</tr>';
    });

    h += '</table></div>';
    return h;
  }

  function renderStorySection(client, styleMeta) {
    return `<div class="proposal-section" style="border-color:${styleMeta.accent}">
      <h4 style="color:${styleMeta.accent}">📖 情境模擬</h4>
      <p style="font-size:14px;line-height:1.8">
        <strong>假設情境：</strong><br>
        ${client.name} 今年 ${client.age || '?'} 歲，${client.job || '在職'}，每月收入 ${client.income ? '$' + Number(client.income).toLocaleString() : '-' }。<br><br>
        如果不幸因健康問題需要住院治療，私院日均費用可能高達 $5,000-$15,000。<br>
        一週住院就可能花掉 ${client.income ? Math.round(client.income * 0.3 * 7).toLocaleString() : 'XXXXX'} 元 —— 相當於 <strong>${Math.round((client.income || 50000) * 0.21 / 100)}% 的月薪</strong>。<br><br>
        但如果提前配置了合適嘅保障，呢筆費用可以大部分甚至全數轉嫁俾保險公司。<br>
        <em>呢就係點解我哋話：「保險唔係消費，係轉移風險嘅工具。」</em>
      </p>
    </div>`;
  }

  // ===== PPT 輸出 =====
  function generateProposalPPT() {
    const client = getClient();
    const ids = selectedProducts.length ? selectedProducts : Array.from(document.querySelectorAll('.prop-chip.active')).map(e => e.dataset.val);
    if (!client) { alert('請先選擇客戶'); return; }
    if (ids.length === 0) { alert('請至少選擇一個產品'); return; }
    if (typeof PptxGenJS === 'undefined') { alert('PPT 庫未載入，請重新整理頁面'); return; }

    const depth = document.getElementById('propDepth').value;
    const title = document.getElementById('propTitle').value.trim() || `${client.name} 保障建議書`;
    const styleKey = getStyleKey();
    const styleMeta = (window.PROPOSAL_STYLES && window.PROPOSAL_STYLES[styleKey]) || { label:'專業顧問式', coverSubtitle:'專業保障方案', accent:'#1e3a5f' };
    const products = buildProductDetails(ids, client);
    client.solutionLogic = buildSolutionLogic(products, client);

    const A = hexToRgb(styleMeta.accent);
    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
    pptx.layout = 'WIDE';

    // Slide 1 — 封面
    let s = pptx.addSlide();
    s.background = { color: A };
    s.addText('PROPOSAL', { x: 0.8, y: 2.2, w: 6, h: 0.5, fontSize: 16, color: 'FFFFFF', charSpacing: 4 });
    s.addText(title, { x: 0.8, y: 2.7, w: 11.7, h: 1.3, fontSize: 34, bold: true, color: 'FFFFFF' });
    s.addText(styleMeta.coverSubtitle, { x: 0.8, y: 4.0, w: 11, h: 0.6, fontSize: 18, color: 'FFFFFF' });
    s.addText(`客戶：${client.name}　｜　製作日期：${new Date().toLocaleDateString('zh-HK')}`, { x: 0.8, y: 5.3, w: 11, h: 0.4, fontSize: 13, color: 'FFFFFF' });

    // Slide 2 — 客戶背景摘要
    s = pptx.addSlide();
    s.addText('客戶背景摘要', { x: 0.6, y: 0.4, w: 12, h: 0.7, fontSize: 26, bold: true, color: A });
    s.addText([
      { text: `姓名：${client.name}`, options: { bullet: true } },
      { text: `年齡：${client.age || '-'} 歲　｜　職業：${client.job || '-'}`, options: { bullet: true } },
      { text: `婚姻：${client.maritalLabel || '-'}　｜　子女：${client.kids || 0} 人`, options: { bullet: true } },
      { text: `月收入：${client.income ? '$' + Number(client.income).toLocaleString() : '-'}`, options: { bullet: true } },
      { text: `現有保障：${client.existingCoverage || '暫無'}`, options: { bullet: true } },
      { text: `特殊關注：${client.notes || '無'}`, options: { bullet: true } }
    ], { x: 0.9, y: 1.4, w: 11.5, h: 4.5, fontSize: 16, color: '333333', lineSpacingMultiple: 1.3 });

    // Slide 3 — 產品比較（詳細度 comparison 或任何都給）
    s = pptx.addSlide();
    s.addText('產品方案比較', { x: 0.6, y: 0.4, w: 12, h: 0.7, fontSize: 26, bold: true, color: A });
    const cats = window.PRODUCT_CATEGORIES || {};
    const tableRows = [
      [{ text: '項目', options: { bold: true, fill: { color: A }, color: 'FFFFFF' } },
       ...products.map(p => ({ text: p.name, options: { bold: true, fill: { color: A }, color: 'FFFFFF' } }))],
      ['保險公司', ...products.map(p => p.insurer)],
      ['類別', ...products.map(p => cats[p.category] || '-')],
      ['主打賣點', ...products.map(p => p.tagline)],
      ['月供 (起)', ...products.map(p => '$' + p.monthlyFrom)],
      ['稅務優惠', ...products.map(p => p.taxDeductible ? '✅ 可扣稅' : '—')],
      ['適合對象', ...products.map(p => p.bestFor)]
    ].map(r => r.map((c, i) => {
      if (typeof c === 'object') return c;
      return { text: String(c), options: { bold: i === 0, fontSize: 12, align: 'left', valign: 'middle' } };
    }));
    s.addTable(tableRows, { x: 0.5, y: 1.4, w: 12.3, fontSize: 12, border: { type: 'solid', color: 'DDDDDD' }, color: '333333' });

    // 產品詳細頁
    products.forEach(p => {
      s = pptx.addSlide();
      s.addText(p.name, { x: 0.6, y: 0.4, w: 12, h: 0.7, fontSize: 26, bold: true, color: A });
      s.addText(`${p.insurer}　｜　${cats[p.category] || ''}`, { x: 0.6, y: 1.05, w: 12, h: 0.4, fontSize: 14, color: '888888' });
      s.addText(p.tagline, { x: 0.6, y: 1.5, w: 12, h: 0.5, fontSize: 18, italic: true });
      s.addText([
        { text: '產品重點', options: { bold: true, fontSize: 16, color: A } },
        ...p.highlights.map(h => ({ text: h, options: { bullet: true } })),
        { text: ' ', options: { fontSize: 6 } },
        { text: '適合對象', options: { bold: true, fontSize: 16, color: A } },
        { text: p.bestFor, options: { bullet: true } },
        { text: ' ', options: { fontSize: 6 } },
        { text: '月供', options: { bold: true, fontSize: 16, color: A } },
        { text: `$${p.monthlyFrom} 起${p.taxDeductible ? '（可扣稅）' : ''}`, options: { bullet: true } },
        { text: ' ', options: { fontSize: 6 } },
        { text: '顧問筆記', options: { bold: true, fontSize: 16, color: A } },
        { text: p.notes, options: { bullet: true } }
      ], { x: 0.9, y: 2.2, w: 11.5, h: 4.2, fontSize: 14, color: '333333', lineSpacingMultiple: 1.2 });
    });

    // 最後 — 下一步 + 免責
    s = pptx.addSlide();
    s.addText('下一步行動', { x: 0.6, y: 0.4, w: 12, h: 0.7, fontSize: 26, bold: true, color: A });
    s.addText([
      { text: '1. 確認方案內容與保費預算', options: { bullet: true } },
      { text: '2. 準備投保文件（身份證、地址證明）', options: { bullet: true } },
      { text: '3. 安排簽署（可視像／上門）', options: { bullet: true } },
      { text: '4. 提交核保（約 7-14 工作天出批單）', options: { bullet: true } },
      { text: '5. 保單生效 + Follow-up 排期', options: { bullet: true } }
    ], { x: 0.9, y: 1.4, w: 11.5, h: 3, fontSize: 16, color: '333333', lineSpacingMultiple: 1.3 });
    s.addText('⚠️ 免責聲明：此建議書由 Agent OS AI 工具生成，僅供參考。實際保費、保障範圍及條款以保單文件為準。', { x: 0.6, y: 6.3, w: 12, h: 0.8, fontSize: 11, color: '999999' });

    const safe = title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 20);
    const fname = `${client.name}_建議書_${safe}.pptx`;
    pptx.writeFile({ fileName: fname }).then(() => {
      alert('PPT 已生成並下載 ✅\n' + fname);
    }).catch(e => {
      alert('PPT 生成失敗：' + e.message);
    });
  }

  function hexToRgb(h) { return (h || '#1e3a5f').replace('#', '').toUpperCase(); }

  // Expose to global
  window.generateProposal = generate;
  window.generateProposalPPT = generateProposalPPT;
  window.ProposalModule = { init };
  window.refreshPropClientSelects = refreshSelects;

  function refreshSelects() {
    const sel = document.getElementById('propClientSelect');
    if (!sel) return;
    const clients = Storage.getClients();
    sel.innerHTML = '<option value="">-- 選擇客戶 --</option>' +
      clients.map(c => `<option value="${c.id}">${c.name} (${c.age}歲)</option>`).join('');
  }
})();
