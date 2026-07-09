// ===== Social.js — 社交內容引擎 =====
(function() {
  let state = { type: 'post' };

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
  }

  function generate() {
    const topic = document.getElementById('socialTopic').value.trim();
    if (!topic) { alert('請填寫主題'); return; }

    const platform = document.getElementById('socialPlatform').value;
    const ratio = document.getElementById('socialRatio').value;
    const style = document.getElementById('socialStyle').value;
    const persona = document.getElementById('socialPersona').value;
    const extra = document.getElementById('socialExtra').value.trim();

    const content = buildContent(topic, platform, ratio, style, persona, extra, state.type);

    document.getElementById('socialOutput').className = 'output-box filled';
    document.getElementById('socialOutput').innerHTML = content;

    Storage.addHistory({ type: 'social', topic, platform });
    updateDashboardStats();
  }

  function buildContent(topic, platform, ratio, style, persona, extra, type) {
    // Try to find template match
    const key = Object.keys(TEMPLATES.socialTopics).find(k => topic.includes(k) || k.includes(topic));
    const tpl = key ? TEMPLATES.socialTopics[key] : null;

    const platformNames = {
      'fb': 'Facebook / Instagram', 'threads': 'Threads',
      'xhs-hk': '小紅書 · HK 版', 'xhs-cn': '小紅書 · 內地版', 'linkedin': 'LinkedIn'
    };
    const styleNames = { professional:'專業型', casual:'親切貼地', educational:'教育型', storytelling:'故事型' };
    const personaNames = { expert:'資深顧問', friendly:'鄰家朋友', mentor:'導師型' };

    // Caption
    let caption = '';
    if (tpl) {
      caption = `${tpl.hooks[0]}\n\n${tpl.keyPoints.map((k,i)=>`${i+1}. ${k}`).join('\n')}\n\n${tpl.cta}`;
    } else {
      const hookByStyle = {
        professional: `【${topic}】專業分析：點樣做出明智決定`,
        casual: `講真，${topic}呢件事，好多人都諗錯咗`,
        educational: `關於${topic}，你需要知道嘅 3 件事`,
        storytelling: `上個月幫一位客戶處理${topic}，佢嘅情況好值得分享`
      };
      caption = `${hookByStyle[style] || `關於${topic}`}\n\n1. 點解重要？\n2. 常見錯誤\n3. 點樣正確做\n\n有疑問隨時 PM 我 💬`;
    }

    if (extra) caption += `\n\n（備註：${extra}）`;

    // Image prompt for ImageGen
    const imgPrompt = buildImagePrompt(topic, platform, style, persona, ratio, type);

    // 小紅書特化
    let xhsBlock = '';
    if (platform === 'xhs-hk' || platform === 'xhs-cn') {
      const xhs = TEMPLATES.xiaohongshuTemplates.medical;
      const isCN = platform === 'xhs-cn';
      xhsBlock = `
      <div class="proposal-section" style="border-color:#ec4899">
        <h4>📕 小紅書專屬格式（${isCN?'內地版':'HK版'}）</h4>
        <p>
          <strong>封面標題：</strong>${xhs.title}<br>
          <strong>副標題：</strong>${xhs.subtitle}<br><br>
          <strong>正文：</strong><br>${xhs.body.replace(/\n/g,'<br>')}<br><br>
          <strong>留言關鍵字 CTA：</strong>${xhs.commentCta}<br>
          <strong>Hashtags：</strong>${xhs.hashtags}
        </p>
      </div>`;
    }

    return `
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

      <div class="proposal-section" style="border-color:#8b5cf6">
        <h4>🎨 配圖 Prompt（交畫圖工具用）</h4>
        <pre class="output-content" id="socialImgPrompt">${escapeHtml(imgPrompt)}</pre>
        <button class="btn btn-sm btn-ghost copy-btn" onclick="copySingleText('socialImgPrompt', this)">複製</button>
      </div>

      <div style="margin-top:14px;display:flex;gap:8px">
        <button class="btn btn-sm btn-secondary" onclick="copyText(this)">複製全部</button>
        ${tpl ? `<button class="btn btn-sm btn-ghost" onclick="alert('功能：複製文案後可粘貼到畫圖工具（ImageGen）生成配圖')">🎨 如何出圖？</button>` : ''}
      </div>
    `;
  }

  function buildImagePrompt(topic, platform, style, persona, ratio, type) {
    const styleDesc = {
      professional: 'clean, professional, corporate blue tones, minimalist',
      casual: 'warm, friendly, soft pastel colors, approachable',
      educational: 'infographic style, clear icons, bright and informative',
      storytelling: 'lifestyle photography, emotional, relatable scene'
    };
    const ratioMap = { '1:1':'square format', '4:5':'vertical portrait', '16:9':'horizontal banner', '9:16':'vertical story format' };
    const personaDesc = {
      expert: 'expert financial advisor character, confident pose',
      friendly: 'approachable neighbor character, smiling',
      mentor: 'wise mentor figure, guiding hand gesture'
    };

    let base = `Insurance social media post image about "${topic}". `;
    base += `${styleDesc[style] || styleDesc.professional}. `;
    base += `${ratioMap[ratio] || 'square format'}. `;
    if (persona !== 'expert' || type === 'recruit') base += `${personaDesc[persona]}. `;
    base += `No text overlay, high quality, modern Chinese aesthetic, Hong Kong style.`;

    if (type === 'recruit') {
      base = `Recruitment poster for insurance agency. ${styleDesc[style]}. ${ratioMap[ratio]}. Theme: career growth, financial freedom, team success. Modern, inspiring, professional. No text.`;
    }

    return base;
  }

  window.generateSocialContent = generate;
  window.SocialModule = { init };
})();
