// ===== FollowUp.js — WhatsApp Follow-Up 生成器 =====
(function() {
  let selectedStage = 'first';

  function init() {
    document.querySelectorAll('.fu-stage').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.fu-stage').forEach(s => s.classList.remove('active'));
        el.classList.add('active');
        selectedStage = el.dataset.val;
      });
    });
  }

  function generate() {
    const name = document.getElementById('fuClient').value.trim();
    const tone = document.getElementById('fuTone').value;
    const product = document.getElementById('fuProduct').value.trim();
    const notes = document.getElementById('fuNotes').value.trim();

    if (!name) { alert('請填寫客戶名'); return; }

    let messages = [];
    const templates = TEMPLATES.followupMessages[selectedStage];

    if (typeof templates === 'object' && !Array.isArray(templates)) {
      const tSet = templates[tone] || templates.professional;
      if (tSet.short) messages.push({ label: '短版（WhatsApp Quick Reply）', text: fillTemplate(tSet.short, { name, product }) });
      if (tSet.long) messages.push({ label: '長版（詳細 Follow-Up）', text: fillTemplate(tSet.long, { name, product, summary: product || '保障方案', nextStep: '安排下一次會面詳談' }) });
      if (tSet.day3) messages.push({ label: '第 3 天跟進', text: fillTemplate(tSet.day3, { name }) });
      if (tSet.day7) messages.push({ label: '第 7 天跟進', text: fillTemplate(tSet.day7, { name }) });
    } else if (Array.isArray(templates)) {
      const tTemplates = getTonedArray(templates, tone);
      tTemplates.forEach((tmpl, i) => {
        messages.push({ label: `選項 ${i + 1}`, text: fillTemplate(tmpl, { name, product }) });
      });
    }

    if (notes) {
      messages.push({
        label: '📝 根據特殊情況定制',
        text: customizeMessage(name, product, notes, selectedStage)
      });
    }

    const html = renderFollowUpOutput(messages, name, selectedStage, tone, product);
    document.getElementById('followupOutput').className = 'output-box filled';
    document.getElementById('followupOutput').innerHTML = html;

    Storage.addHistory({ type: 'followup', client: name, stage: selectedStage, tone, count: messages.length });
    updateDashboardStats();
  }

  function fillTemplate(tpl, vars) {
    let result = tpl;
    for (const [k, v] of Object.entries(vars)) result = result.replaceAll(`{${k}}`, v || '');
    return result;
  }

  function getTonedArray(arr, tone) {
    if (arr.length >= 3) { const idx = { professional: 0, casual: 1, gentle: 2 }[tone] || 0; return [arr[idx]]; }
    return arr;
  }

  function customizeMessage(name, product, notes, stage) {
    let base = `{name} 你好，\n\n我知道${notes.slice(0, 50)}。\n\n針對呢個情况，我建議：\n\n`;
    if (stage === 'thinking') base += `其實好多客人都有類似嘅考慮。我可以準備多份資料俾你參考，或者安排一個短電話傾清楚？完全唔使急。`;
    else if (stage === 'ghosted') base += `明白大家都很忙。如果之前討論嘅嘢不合時機了，完全理解。不過如果你改變主意或有任何問題，我都在這裡等你。`;
    else if (stage === 'objection') base += `我理解你嘅顧慮。讓我針對呢點再詳細解釋一下：\n${product ? `關於${product}，實際上...` : ''}\n\n我們可以安排一個短時間傾詳細啲？`;
    base += `\n\n祝一切順利！😊`;
    return fillTemplate(base, { name, product });
  }

  function renderFollowUpOutput(msgs, name, stage, tone, product) {
    const stageNames = { first:'初見完', thinking:'再諗緊', ghosted:'已讀不回', 'proposal-sent':'已發建議書', objection:'有疑慮/反對', close:'臨門一腳' };
    const toneNames = { professional:'專業正式', casual:'親切貼地', gentle:'溫和提醒', urgent:'稍急促' };

    let html = `<div style="margin-bottom:16px"><button class="btn btn-sm btn-secondary" onclick="copyText(this)">複製全部訊息</button></div>`;
    html += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;font-size:12px">
      <span class="tag tag-blue">客戶：${escapeHtml(name)}</span>
      <span class="tag tag-orange">階段：${stageNames[stage]}</span>
      <span class="tag tag-green">語氣：${toneNames[tone]}</span>
      ${product ? `<span class="tag tag-gray">產品：${escapeHtml(product)}</span>` : ''}
    </div>`;

    msgs.forEach((m, i) => {
      html += `<div class="proposal-section">
        <h4>${m.label}</h4>
        <pre class="output-content" id="fuMsg${i}">${escapeHtml(m.text)}</pre>
        <button class="btn btn-sm btn-ghost copy-btn" onclick="copySingleText('fuMsg${i}', this)">複製</button>
      </div>`;
    });

    const tips = getStageTips(stage);
    if (tips.length > 0) {
      html += `<div class="proposal-section" style="border-color:#f59e0b">
        <h4 style="color:#d97706">💡 ${stageNames[stage]}階段技巧</h4>
        <ul style="padding-left:18px;font-size:13px;line-height:2">${tips.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
      </div>`;
    }
    return html;
  }

  function getStageTips(stage) {
    const m = {
      first: ['見完客 24 小時內發送效果最好','短版適合 Quick Reply，長版適合單獨發送','第3、7天記得再跟進','每次帶新價值'],
      thinking: ['不要催促決定','分享成功案例','提議做比較表','約定下次聯繫時間'],
      ghosted: ['連續未回覆勿超過3條','間隔至少1週','轉換話題或提供新價值','超過1月轉長期培育'],
      'proposal-sent': ['發送後2-3日跟進','主動提議過一遍內容','準備好回答具體問題','約定明確下次時間'],
      objection: ['先完整聆聽不要打斷','認同理比反駁重要','用數據和案例支持','反對往往是成交前奏'],
      close: ['果斷但唔好給壓力','準備好簽署文件清單','明確告知下一步流程','成交後立刻安排Follow-Up']
    };
    return m[stage] || [];
  }

  window.generateFollowUp = generate;
  window.FollowUpModule = { init };
})();
