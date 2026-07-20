// ===== Client.js — 客戶分析模組 =====
(function() {
  let lastAnalyzed = null;
  let editingId = null; // 正喺度編輯緊嘅客戶 id（儲存時用嚟 update 而唔係開新副本）

  function init() {
    // DOM 係「已選保障」嘅單一真相來源（chip 點擊只 toggle CSS class）
    document.querySelectorAll('.cov-chip').forEach(el => {
      el.addEventListener('click', () => { el.classList.toggle('active'); });
    });
  }

  // 由 DOM 讀取當前已選保障（修復：編輯客戶時 loadClientForEdit 只 toggle class，
  // 舊 code 用模組內 selectedCoverage 陣列會收唔到呢個變動，導致儲存時清空 coverage）
  function getCoverageFromDOM() {
    return Array.from(document.querySelectorAll('.cov-chip.active')).map(e => e.dataset.val);
  }

  function getCoverageLabels() {
    const map = {
      'company-med':'公司醫療','personal-med':'個人醫療','ci':'危疾','life':'人壽',
      'accident':'意外','mpf':'MPF','vhis':'VHIS','none':'暫無任何保障'
    };
    return getCoverageFromDOM().map(v => map[v] || v);
  }

  // 將客戶資料填返入表單（由 app.js 嘅 loadClientForEdit 呼叫）
  function loadForEdit(id) {
    const c = Storage.getClient(id);
    if (!c) return;
    editingId = id;
    document.getElementById('cName').value = c.name || '';
    document.getElementById('cAge').value = c.age || '';
    document.getElementById('cJob').value = c.job || '';
    document.getElementById('cIncome').value = c.income || '';
    document.getElementById('cMarital').value = c.marital || '';
    document.getElementById('cKids').value = c.kids || '';
    document.getElementById('cNotes').value = c.notes || '';
    // 用儲落嘅 coverageVals（值）去對 chip.dataset.val（值），正確還原已選保障
    const vals = c.coverageVals || [];
    document.querySelectorAll('.cov-chip').forEach(chip => {
      chip.classList.toggle('active', vals.includes(chip.dataset.val));
    });
  }

  function analyzeClient() {
    const name = document.getElementById('cName').value.trim() || '客戶';
    const age = parseInt(document.getElementById('cAge').value) || null;
    const job = document.getElementById('cJob').value.trim();
    const income = parseInt(document.getElementById('cIncome').value) || null;
    const marital = document.getElementById('cMarital').value;
    const kids = parseInt(document.getElementById('cKids').value) || 0;
    const notes = document.getElementById('cNotes').value.trim();

    const selectedCoverage = getCoverageFromDOM();

    if (selectedCoverage.length === 0 && !age) {
      alert('請至少填寫年齡或選擇現有保障'); return;
    }

    // Gap analysis
    const hasMedical = selectedCoverage.some(c => ['company-med','personal-med','vhis'].includes(c));
    const hasCI = selectedCoverage.includes('ci');
    const hasLife = selectedCoverage.includes('life');
    const hasAccident = selectedCoverage.includes('accident');
    const hasVHIS = selectedCoverage.includes('vhis');
    const hasNone = selectedCoverage.includes('none');

    let gaps = {};
    let riskPriority = [];
    let recommendations = [];

    if (!hasMedical || hasNone) {
      gaps.medical = true;
      gaps.medicalDetail = '建議補充個人醫療保險，避免依賴公司醫保（離職即失效）。';
      riskPriority.push('醫療保障');
      recommendations.push('個人醫療保險 / VHIS');
    }
    if (!hasCI || hasNone) {
      gaps.ci = true;
      gaps.ciDetail = age ? `年齡 ${age} 歲，危疾保費仍屬合理範圍，建議趁早配置。` : '建議配置危疾保險作為收入替代。';
      riskPriority.push('危疾保障');
      recommendations.push('危疾保險（保額建議 = 年薪 3-5 倍）');
    }
    if (!hasLife || hasNone) {
      if (marital === 'married' || kids > 0 || income) {
        gaps.life = true;
        gaps.lifeDetail = '有家庭供養責任，建議配置人壽保險。';
        riskPriority.push('人壽保障');
        recommendations.push('人壽保險（保額 = 5-10 年家庭開支）');
      }
    }
    if (!hasAccident) {
      recommendations.push('意外保險（基礎保障，保費低）');
    }

    // VHIS tax benefit note
    let vhisNote = '';
    if (!hasVHIS && income) {
      vhisNote = `\n💡 VHIS 自願醫保可享稅務扣減（每年最高 $8,000），建議納入配置。`;
    }

    // MPF cross-sell opportunity
    let mpfNote = '';
    if (job && (job.includes('老闆') || job.includes('東主') || job.includes('雇主') || job.includes('owner'))) {
      mpfNote = `\n💼 客戶為企業主，可從 MPF 顧問服務切入，逐步提供 ECI → 團體醫療 → VHIS 員工福利方案。`;
    }

    const analysisText = `📊 ${name} 嘅保障缺口分析

🔴 主要風險優先級：
${riskPriority.length ? riskPriority.map((r,i)=>`${i+1}. ${r}`).join('\n') : '✅ 基本保障充足'}

🔍 詳細分析：
${gaps.medical ? `• 醫療：${gaps.medicalDetail}\n` : ''}${gaps.ci ? `• 危疾：${gaps.ciDetail}\n` : ''}${gaps.life ? `• 人壽：${gaps.lifeDetail}\n` : ''}${!gaps.medical && !gaps.ci && !gaps.life ? '• 暫未發現明顯保障缺口\n' : ''}
📌 建議配置：
${recommendations.map(r=>'• '+r).join('\n')}
${vhisNote}${mpfNote}

⚠️ 免責：以上分析僅供參考，實際方案需與持牌顧問確認。`;

    // Store client object for other modules
    lastAnalyzed = {
      name, age, job, income, marital,
      maritalLabel: {single:'未婚',married:'已婚',divorced:'離異'}[marital] || '-',
      kids, notes,
      existingRaw: getCoverageLabels(),
      existingCoverage: getCoverageLabels().join('、'),
      gaps,
      riskPriority, recommendations
    };
    window._lastAnalyzedClient = lastAnalyzed;

    document.getElementById('clientOutput').className = 'output-box filled';
    document.getElementById('clientOutput').innerHTML = `
      <div class="proposal-section">
        <h4>🔍 分析結果</h4>
        <pre class="output-content" id="clientAnalysis">${escapeHtml(analysisText)}</pre>
        <button class="btn btn-sm btn-ghost copy-btn" onclick="copySingleText('clientAnalysis', this)">複製</button>
      </div>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button class="btn btn-sm btn-secondary" onclick="copyText(this)">複製全部</button>
        <button class="btn btn-sm btn-primary" onclick="navigateTo('meeting')">去見客準備 →</button>
        <button class="btn btn-sm btn-primary" onclick="navigateTo('proposal')">去 Proposal →</button>
      </div>`;

    Storage.addHistory({ type: 'client', client: name });
    updateDashboardStats();
  }

  function saveClient() {
    const name = document.getElementById('cName').value.trim();
    if (!name) { alert('請填寫客戶姓名'); return; }

    const clientData = {
      id: editingId || undefined, // 有 editingId = 更新原有客戶；冇 = 開新客戶
      name,
      age: parseInt(document.getElementById('cAge').value) || null,
      job: document.getElementById('cJob').value.trim(),
      income: parseInt(document.getElementById('cIncome').value) || null,
      marital: document.getElementById('cMarital').value,
      kids: parseInt(document.getElementById('cKids').value) || 0,
      notes: document.getElementById('cNotes').value.trim(),
      existingRaw: getCoverageLabels(),
      existingCoverage: getCoverageLabels().join('、'),
      coverageVals: getCoverageFromDOM() // 儲值（用嚟 edit 時還原 chip）
    };

    // Also store last analysis if available
    if (window._lastAnalyzedClient && window._lastAnalyzedClient.name === name) {
      Object.assign(clientData, { gaps: window._lastAnalyzedClient.gaps });
    }

    Storage.saveClient(clientData);
    refreshAllClientSelects();
    updateDashboardStats();

    // 清走 chip 選取狀態 + 重設編輯狀態（DOM 係單一真相來源）
    editingId = null;
    document.querySelectorAll('.cov-chip').forEach(c => c.classList.remove('active'));

    alert(`✅ 已儲存客戶「${name}」`);
  }

  window.analyzeClient = analyzeClient;
  window.saveClient = saveClient;
  window.ClientModule = { init, loadForEdit };
})();
