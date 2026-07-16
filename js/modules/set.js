/* =========================================================================
 * SET 智能體平台 — 嵌入 Agent OS AI 工作台
 * 來源：gangcheng-web（SET 保險智能體平台，手機 chat app）
 * 整合方式：將 SET 的「專家陣容 + 傾偈介面」搬做 Agent OS 其中一個功能
 * 模式：離線示範（mock 回覆），唔依賴 server.js / LLM API key
 * ========================================================================= */
const SetModule = (() => {

  const ICONS = {
    star: `<svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.3 6.8.5-5.2 4.4 1.7 6.6L12 17.8 6.1 20.8l1.7-6.6L2.6 8.8l6.8-.5L12 2z"/></svg>`,
    chat: `<svg viewBox="0 0 24 24"><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z"/></svg>`,
    target: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>`,
    brief: `<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    coin: `<svg viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>`,
    bell: `<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>`
  };

  const agents = [
    {
      id: 'negotiation',
      name: 'SET全能顧問',
      desc: 'SET全能顧問：一個 agent 包晒六大範疇——VHIS 自願醫保、人壽危疾、ECI 勞工保險、MPF/TVC 轉化、新員工 Onboarding，外加內地客專項。同時佢亦係你嘅 AI 私人助理：直接落指令，就會幫你一次過出 3 平台社交貼文（IG/小紅書/FB）、寫 proposal、follow-up、見客 brief、客戶分析——唔使入後台慢慢填表，講一句就搞掂。',
      author: 'SET',
      uses: '∞',
      hero: true,
      color: '#000',
      icon: '<img src="assets/set-logo.jpg" alt="SET" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:1.5px solid var(--gold);background:#000;" />',
      welcome: '你好，我係 SET全能顧問 ⚡\n\n我包晒六大範疇：VHIS 自願醫保、人壽危疾、ECI 勞工保險、MPF/TVC 轉化、新員工 Onboarding，仲有內地客專項（見內地客嘅困難、開 case 話術、內地市場消息）。無論係要拆客戶底牌、準備開價話術、定係講解某款產品，我都可以幫手。\n\n我仲係你嘅 AI 私人助理：直接落指令，我就幫你出 3 平台社交貼文、寫 proposal、follow-up、見客 brief、客戶分析——唔使慢慢填表。例如：\n• 「幫我出 3 個小紅書理財 post」\n• 「幫陳生準備一個危疾 proposal」\n• 「寫個 follow-up 俾而家諗緊嘅客」\n• 「幫我準備聽日見李太嘅 meeting brief」\n• 「寫實封面：家庭財務規劃」\n\n你想從邊方面開始？',
      chips: ['分析客戶底牌', '準備開價話術', 'VHIS 稅務扣減', '處理「已有醫保」異議', '向僱主推 ECI', '見內地客嘅困難', '出 3 平台社交貼文', '寫實 AI 封面', '準備 proposal', '寫 follow-up', '準備見客 brief', '分析客戶保障']
    },
    {
      id: 'shadow',
      name: 'SET影子專家小Q 試用版',
      desc: 'SET影子業務專家，陪保險經紀演練銷售流程、梳理保單異議處理、生成準客戶跟進話術。',
      author: 'SET',
      uses: '9',
      color: '#3b6fb0',
      icon: ICONS.chat,
      welcome: '你好，我是SET影子專家小Q。我可以模仿你的客戶或同事，陪你做銷售演練。\n\n告訴我你想練什麼場景？',
      chips: ['演練初次拜訪', '處理價格異議', '跟進沉默客戶', '模擬異議對話']
    },
    {
      id: 'strategy',
      name: 'SET (INHERIT) 2026 年度戰略規劃師',
      desc: '專注於年度戰略拆解、目標設定、資源配置與執行節奏規劃。',
      author: 'SET',
      uses: '2',
      color: '#5b6478',
      icon: ICONS.target,
      welcome: '你好，我是SET戰略規劃師。讓我們一起把 2026 年的大目標拆成可執行的小節奏。\n\n你今年的核心目標是什麼？',
      chips: ['拆解年度目標', '規劃季度節奏', '分配團隊資源', '設定檢查指標']
    },
    {
      id: 'group',
      name: 'SET 團體福利顧問',
      desc: '專為僱主客戶而設：ECI 勞工保險、團體醫療、員工福利 package，由 MPF 關係順勢轉化為保險客。',
      author: 'SET',
      uses: '11',
      color: '#0f7a6b',
      icon: ICONS.brief,
      welcome: '你好，我是SET 團體福利顧問。僱主客係我哋由 MPF 轉化保險嘅黃金來源。\n\nECI 法例必買、團體醫療留人、員工福利 package 提升滿意度——你想先拆解邊一環？',
      chips: ['ECI 勞工保險', '團體醫療方案', '員工福利 package', '僱主轉化節奏']
    },
    {
      id: 'wealth',
      name: 'SET 理財規劃師',
      desc: '退休策劃、資產配置、TVC 自願供款、儲蓄分紅險——幫客戶做長線財務藍圖。',
      author: 'SET',
      uses: '7',
      color: '#b0772a',
      icon: ICONS.coin,
      welcome: '你好，我是SET 理財規劃師。無論係退休缺口、美元資產配置、定係 TVC 扣稅，我都可以幫你同客戶計到明。\n\n想從邊方面開始？',
      chips: ['退休策劃', 'TVC 自願供款', '資產配置', '儲蓄分紅險']
    },
    {
      id: 'crm',
      name: 'SET 客戶跟進助手',
      desc: '自動生成跟進訊息、喚醒沉默客戶、約見提醒、WhatsApp／email 雙軌腳本。',
      author: 'SET',
      uses: '5',
      color: '#8a4f9e',
      icon: ICONS.bell,
      welcome: '你好，我是SET 客戶跟進助手。低壓力、有價值、定時跟進——我幫你寫好每則訊息。\n\n想跟進邊類客戶？',
      chips: ['跟進沉默客戶', '生成跟進訊息', '約見提醒', 'WhatsApp 腳本']
    }
  ];

  let currentAgent = null;
  let conversation = [];
  let isBotTyping = false;
  // ── LLM 後端設定（多 backend 支援）──
  // 優先讀用家喺 SET ⚙️ 設定填嘅 localStorage，其次 config.js，最後 fallback mock
  const LS_KEY = 'set_llm_config';
  function getLLMConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (saved && saved.provider) return saved;
    } catch (e) {}
    // 注意：APP_CONFIG 係 const 宣告，唔會掛落 window，直接用全局綁定
    if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.llm) {
      const l = APP_CONFIG.llm;
      return { provider: l.provider || 'mock', baseUrl: l.baseUrl || '', apiKey: l.apiKey || '', model: l.model || '' };
    }
    return { provider: 'mock', baseUrl: '', apiKey: '', model: '' };
  }

  const $ = (id) => document.getElementById(id);

  function renderAgents(filter = '') {
    const list = $('setAgentList');
    if (!list) return;
    list.innerHTML = '';
    const term = (filter || '').toLowerCase().trim();
    // SET全能顧問已升級成「全能顧問 + AI 私人助理」二合一入口，保留佢一個 hero 卡；其餘專家暫時隱藏
    const filtered = agents.filter(a => a.id === 'negotiation' && (!term || a.name.toLowerCase().includes(term) || a.desc.toLowerCase().includes(term)));
    filtered.forEach(a => {
      const card = document.createElement('div');
      card.className = 'agent-card fade-in' + (a.hero ? ' badge-hero' : '');
      card.innerHTML = `
        <div class="agent-icon" style="background:${a.color}">${a.icon}</div>
        <div class="agent-body">
          <div class="agent-name">${a.name}</div>
          <div class="agent-desc">${a.desc}</div>
          <div class="agent-meta">
            <span><svg class="icon" viewBox="0 0 24 24" style="width:13px;height:13px;stroke-width:2;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> By ${a.author}</span>
            <span><svg class="icon" viewBox="0 0 24 24" style="width:13px;height:13px;stroke-width:2;"><path d="M12 2v20M2 12h20"/></svg> ${a.uses}</span>
          </div>
        </div>`;
      card.onclick = () => openChat(a.id);
      list.appendChild(card);
    });
  }

  function showDiscover() {
    $('setDiscover').style.display = 'flex';
    $('setChat').classList.remove('active');
  }

  function openChat(id) {
    currentAgent = agents.find(a => a.id === id);
    if (!currentAgent) return;
    $('setDiscover').style.display = 'none';
    const chat = $('setChat');
    chat.classList.add('active');
    $('setChatTitle').textContent = currentAgent.name;
    const msgs = $('setChatMessages');
    msgs.innerHTML = '';
    conversation = [];
    addBotMessage(currentAgent.welcome);
    renderChips(currentAgent.chips);
    $('setMsgInput').focus();
    const cfg = getLLMConfig();
    const privacy = getPrivacyMode();
    $('setStatusDot').textContent = statusText(cfg, privacy);
  }

  function createAvatar(isUser) {
    const div = document.createElement('div');
    div.className = 'msg-avatar' + (isUser ? ' user' : '');
    if (isUser) {
      div.textContent = '我';
    } else {
      div.innerHTML = '<img src="assets/set-logo.jpg" alt="SET" />';
    }
    return div;
  }

  function scrollToBottom() {
    const msgs = $('setChatMessages');
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addBotMessage(text) {
    const msgs = $('setChatMessages');
    const row = document.createElement('div');
    row.className = 'message bot fade-in';
    row.appendChild(createAvatar(false));
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    msgs.appendChild(row);
    scrollToBottom();
  }

  function renderChips(chips) {
    const bar = $('setChipsBar');
    bar.innerHTML = '';
    if (chips && chips.length) {
      chips.forEach(c => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = c;
        chip.onclick = () => sendUserText(c);
        bar.appendChild(chip);
      });
      bar.classList.remove('hidden-chips');
    } else {
      bar.classList.add('hidden-chips');
    }
  }

  function clearChips() {
    const bar = $('setChipsBar');
    bar.innerHTML = '';
    bar.classList.add('hidden-chips');
  }

  function addUserMessage(text) {
    const msgs = $('setChatMessages');
    const row = document.createElement('div');
    row.className = 'message user fade-in';
    row.appendChild(createAvatar(true));
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    msgs.appendChild(row);
    scrollToBottom();
  }

  function showTyping() {
    const msgs = $('setChatMessages');
    const row = document.createElement('div');
    row.className = 'message bot';
    row.id = 'setTypingRow';
    row.appendChild(createAvatar(false));
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
    row.appendChild(bubble);
    msgs.appendChild(row);
    scrollToBottom();
  }

  function removeTyping() {
    const t = $('setTypingRow');
    if (t) t.remove();
  }

  // ---- 模擬回覆（離線 fallback）----
  const mockReplies = {
    '分析客戶底牌': '好，我們先從三個維度分析：\n1. 對方決策權限（誰說了算）\n2. 預算天花板與支付方式\n3. 時間壓力與替代方案\n\n你先補充一下手頭掌握的資料，我幫你畫張底牌圖。',
    '準備開價話術': '開價要記住「先錨定、後鬆動」：\n• 第一句報出高於目標的錨點\n• 用「價值」而不是「價格」包裝\n\n你要我針對哪個產品或方案生成一段話術？',
    '模擬砍價對話': '沒問題，我現在扮演砍價的客戶，你來回應。\n\n客戶：「你這個報價比市場貴 20%，我們預算沒這麼多。」\n\n輪到你回應。',
    '制定談判策略': '先確認目標：\n• 理想結果是什麼？\n• 可接受的底線是什麼？\n• 有什麼籌碼可以交換？\n\n填完這三個，我幫你排談判節奏。',
    '演練初次拜訪': '我現在扮演新客戶，你來做初次拜訪。\n\n客戶：「你好，我對你們服務有點興趣，但先說說你們跟別人有什麼不同。」\n\n輪到你。',
    '處理價格異議': '價格異議通常藏著三個問題：預算、價值感、比較對象。\n\n你可以先問：「您覺得貴，是相對哪一個方案比較？」這樣能鎖定真正的異議點。',
    '跟進沉默客戶': '沉默客戶最怕硬催。建議三段式：\n1. 提供一條有價值資訊\n2. 給一個低摩擦選擇題\n3. 設下溫和截止\n\n要我直接寫一則跟進訊息給你嗎？',
    '模擬異議對話': '好，我來扮客戶。\n\n客戶：「我們內部還在評估，暫時不會決定。」\n\n你怎麼回？',
    '拆解年度目標': '把年度目標拆成 OKR 節奏：\n• Objectives：3-5 個大方向\n• Key Results：每個方向 2-4 個可量化指標\n\n告訴我你今年的收入或客戶數目標，我幫你拆。',
    '規劃季度節奏': '建議每季度一個主戰場：\nQ1 建基礎流程、Q2 擴大獲客、Q3 提升轉化、Q4 穩定回購。\n\n你想先看哪一季？',
    '分配團隊資源': '資源分配前先盤點：\n• 人（誰有時間／誰有經驗）\n• 錢（預算與 ROI）\n• 時間（deadline）\n\n你現階段最卡哪一項？',
    '設定檢查指標': '指標要分層：\n• 領先指標（可控制）\n• 落後指標（結果）\n\n例如：每月主動聯繫數 vs 成交數。你想追蹤哪些？',
    'VHIS 稅務扣減': 'VHIS 自願醫保最大賣點係稅務扣減：每名受保人每年保費最多扣 HK$8,000，夫婦兩人就 HK$16,000。你可以咁同客講：「買埋醫療保障，仲可以慳稅。」',
    '靈活 vs 標準計劃': '標準計劃（SMP）保障劃一、保費平、保證續保；靈活計劃（FMP）自選保障、保額高啲、可能包埋未知危疾同精神疾病。推銷通常由標準計劃入手，再 upgrade。',
    '向客戶講解保障': '講解 VHIS 用「三層」：1) 公營醫療排期長 2) 私家醫院貴 3) VHIS 補位。要客觀，唔好硬 sell。',
    '比較醫療保險': 'VHIS 係自願、可扣稅、保證續保；普通醫療保險就冇扣稅、可能不保續保。面向中產客，VHIS 通常係首選。',
    '計算保障缺口': '保障缺口 = 家庭未來開支 + 按揭 + 子女教育 − 現有保障 − 流動資產。你畀我客嘅家庭狀況，我幫你計。',
    '處理「已有醫保」異議': '「公司醫保只係在職先有，離職就冇；而且保額通常唔夠 cover 家庭開支。」呢句可以溫柔帶出缺口。',
    '危疾 vs 醫保': '醫保報銷醫療費；危疾一筆過賠，補貼收入中斷同康復開支。兩樣係互補，唔係二揀一。',
    '家庭保障規劃': '家庭保障先保「經濟支柱」，再保配偶同子女。優先：人壽 → 危疾 → 醫療 → 意外。',
    'ECI 法例要求': '《僱員補償條例》規定所有僱主必須為員工投購 ECI，唔係最高罰 HK$10萬同埋監禁。呢點係你同僱主開口嘅 legal hook。',
    '向僱主推 ECI': '切入點：「先生，你請咗人就一定法律上限要買 ECI，唔買係犯法㗎。我幫你搞掂，順便送你個 MPF 檢查。」',
    'ECI 保障範圍': 'ECI 保工傷同職業病，包括意外受傷、上下班途中意外、職業病。但不包括非工傷病假。',
    'MPF 客轉化第一步': '第一步就係 ECI：因為僱主必買、接觸自然、你已經有 MPF 關係。ECI 成交後，再順勢講團體醫療、VHIS。',
    '每月供款接觸點': '每月 MPF 供款通知＝最佳問候機會。乜都唔使講，先關心「供款順唔順」，再帶出「順便幫你檢查下保障」。',
    '加新員工 onboarding': '加人＝新接觸點。即時主動聯絡：「恭喜擴充！新同事 ECI 要加名，我幫你搞，順便出份員工福利包。」',
    '轉化階梯規劃': '階梯：ECI → 團體醫療 → VHIS → 人壽+危疾 → TVC。每層都係建立信任再 cross-sell，唔好跳步。',
    'TVC 自願供款': 'TVC 係 MPF 自願供款，可扣稅（每年上限 HK$6萬），係你最後一層 cross-sell，面向已有基本保障嘅客。',
    '生成 onboarding 腳本': '畀我：1) 行業 2) 新員工人數 3) 現有福利。我出一份 onboarding 流程 + 員工福利介紹 + 順勢推 ECI/團醫嘅腳本。',
    '員工福利介紹': '員工福利包＝ECI（法例必須）+ 團體醫療（留人）＋ VHIS（扣稅）。用「幫你請人更容易留人」做賣點。',
    '順勢推保險': 'Onboarding 尾段加一句：「新同事入職，順便幫佢哋加 ECI 同名額，員工覺得你周到，你又合規。」',
    '新員工名單跟進': '每次收人名單，24 小時內聯絡。用 WhatsApp 快訊＋email 正式信，雙軌跟進。',
    '見內地客嘅困難': '香港 agent 見內地客常撞到呢幾關：\n1. 信任——內地客怕被騙、怕跨境冇保障\n2. 見面安排——深圳 vs 香港、時間成本\n3. 合規紅線——唔好跨境無牌銷售、唔好講「保證回報」\n4. 用詞差異——「重疾」vs「危疾」、「理財」vs「儲蓄」\n你想深入邊一關？',
    '開 case 破冰話術': '破冰用「關心」開頭，唔好急住 sell：\n「X 生，聽講你哋最近諗緊小朋友教育／資產配置？其實好多內地朋友都會用香港保險做呢一環，我方便同你分享下點解？」\n由「佢嘅需要」入，唔係由「我嘅產品」入。',
    '約見內地客話術': '約見要低壓力、有價值：\n「我呢排喺深圳／香港，如果你得閒，我帶份香港保險嘅比較同你飲杯嘢，半個鐘搞掂，當幫你做功課。」\n重點：半個鐘、有嘢帶、無硬銷。',
    '內地市場最新消息': '近期內地客對港險嘅關注點：\n• 美元資產配置／抗匯率波動\n• 子女海外教育資金\n• 高端醫療（北上就醫 vs 香港私院）\n• 分紅儲蓄險嘅長線回報\n要我就某點展開？',
    '跨境簽單注意': '簽單要合規：\n• 唔好喺內地境內做銷售／收錢／簽約動作\n• 保單原則上喺香港簽（或經認可跨境視像簽署，視公司政策）\n• 做 KYC、盡職審查、唔好代客填健康申報\n• 清楚講外匯管制同跨境理賠實務\n具體問你間公司合規部最穩。',
    '內地客常見疑慮': '內地客最多疑慮：\n1. 外匯——續保／理賠啲錢點返內地？（要合規渠道）\n2. 理賠難唔難——其實文件齊就批，最怕申報唔實\n3. 保單喺內地有冇效——香港保單受香港法例管，全球有效\n4. 公司會唔會執笠——揀大行（如 Manulife）信譽保障\n你可以照呢四點準備 Q&A。',
    'ECI 勞工保險': 'ECI 係《僱員補償條例》規定所有僱主必買。賣點：法例必須 + 保障員工工傷 + 你順便做 MPF 檢查，建立關係。開口句：「請咗人就一定法律上限要買，我幫你搞掂。」',
    '團體醫療方案': '團體醫療係僱主留人利器。設計時分 3 層：核心（必須）+ 自選附加（牙科／產檢）+ 高管升級。推銷點：「請到人才，仲要留到人才。」',
    '員工福利 package': '一份靚嘅員工福利 package＝ECI（法例）+ 團體醫療（留人）+ VHIS（扣稅）+ 自願 MPF/TVC。用「幫你請人更容易、留人更穩」做主軸。',
    '僱主轉化節奏': '僱主轉化節奏：ECI（法例切入）→ 團體醫療（留人）→ VHIS（扣稅）→ 人壽+危疾（高管）→ TVC。每層靠信任 cross-sell，唔好跳步。',
    '退休策劃': '退休策劃先計「退休缺口」＝預期退休開支 × 年份 − 強積金／現有儲蓄。再配保險（年金／終身壽）補保證現金流。要我幫你計？',
    'TVC 自願供款': 'TVC 係 MPF 自願供款，可扣稅（每年上限 HK$6萬），靈活供款。面向已有基本保障、想慳稅又做長線儲蓄嘅客。',
    '資產配置': '資產配置講「唔好將所有雞蛋放同一籃」。保險（分紅／儲蓄）提供保證底 + 長線增值，對沖股市波動。用「防守底倉」角度講。',
    '儲蓄分紅險': '儲蓄分紅險賣點：長線複息、保單貸款靈活、受保人傳承。講「時間做複息」而唔係「保證高回報」（合規）。',
    '跟進沉默客戶': '沉默客戶最怕硬催。三段式：1) 俾佢有價值資訊（如新政策）2) 低摩擦選擇題 3) 溫和截止。要我寫一則？',
    '生成跟進訊息': '畀我：客戶名 + 上次接觸內容 + 目標（約見／續保／加保）。我出一段 WhatsApp 用語，自然唔硬銷。',
    '約見提醒': '約見提醒腳本：見面前 1 日「X 生，聽日 3 點見，我帶埋份比較表」；見面後 1 日「多謝抽空，呢度係我講過嘅重點」。定時但唔煩。',
    'WhatsApp 腳本': 'WhatsApp 腳本要短、有價值、一行 call-to-action：\n「X 生，朝早！最近 TVC 扣稅額度改咗，同你情況啱啱好，得閒我 send 個 1 分鐘比較你睇？」\n要我按你客度身寫？'
  };
  // ---- 對話上下文推導：令離線回覆更人性化 ----
  function recentUserTurns(n) {
    return conversation
      .filter(m => m.role === 'user')
      .slice(-n)
      .map(m => m.content);
  }
  function recentAssistantTurns(n) {
    return conversation
      .filter(m => m.role === 'assistant')
      .slice(-n)
      .map(m => m.content);
  }
  function lastAssistantReply() {
    const arr = recentAssistantTurns(1);
    return arr.length ? arr[0] : '';
  }
  function detectEmotion(text) {
    const lower = text.toLowerCase();
    if (/唔識|不會|不会|不懂|唔懂|新手|第一次|驚|怕|緊張|焦虑|焦慮|擔心|担心|壓力|压力|好慌|亂|無從|不知點|點算|點搞|怎麼辦|怎么办|無助|无助/.test(lower)) return 'anxious';
    if (/煩|討厭|廢|垃圾|冇用|無用|浪費時間|唔好用|不好用|罐頭|機械人|機器人|死板|唔似人|不像人|無聊|无聊|認真|冇認真|無認真|冇答|無答|冇解決|無解決|無幫助|冇幫助/.test(lower)) return 'frustrated';
    if (/想學|學下|教我|點學|點練|怎麼學|怎樣學|想知|想知道|請問|請教|點樣做好|點樣做先|如何/.test(lower)) return 'curious';
    return 'neutral';
  }
  function inferTopicFromHistory(text) {
    const recent = recentUserTurns(3).join(' ');
    const combined = (recent + ' ' + text).toLowerCase();
    // 避免「初次見客話術」被單獨一個「僱主」觸發 ECI；ECI 要較強證據
    if (/(eci|勞工|劳工|工傷|補償).*(僱主|雇主|員工|员工|公司)|僱主|雇主.*(勞工|劳工|員工|员工|工傷|補償|買|買保|法例)/.test(combined)) return 'ECI';
    if (/vhis|自願醫保|醫保|医保|醫療|医疗|住院|扣稅|扣税/.test(combined)) return 'VHIS';
    if (/危疾|重疾|人壽|人寿|ci|癌症|癌|中風|心臟病|嚴重疾病/.test(combined)) return '人壽/危疾';
    if (/mpf|強積金|强积金|tvc|退休|年金|供款|自願供款/.test(combined)) return 'MPF/TVC';
    if (/內地|内地|跨境|大陸|深圳|北上|國內|国内|普通話|人民幣/.test(combined)) return '內地客';
    if (/儲蓄|储蓄|分紅|分紅險|教育金|美元資產|理財|投资|投資/.test(combined)) return '儲蓄/理財';
    if (/跟進|跟进|whatsapp|沉默|喚醒|唤醒|覆|回覆|追|催/.test(combined)) return '跟進';
    if (/約見|约见|見面|见面|初次|拜訪|拜访|開場|破冰|開口|開白|約出/.test(combined)) return '初次見客/約見';
    if (/價格|价格|貴|贵|平|便宜|預算|预算|異議|异议|反對|反对|拒絕|拒绝|考慮|考虑|諗緊|想想/.test(combined)) return '處理異議';
    return '';
  }
  function isProspectingQuestion(text) {
    const lower = text.toLowerCase();
    return /搵客|冇客|没客|沒客|冇客見|没客見|客源|人脈|人脉|network|轉介紹|转介绍|referral|點搵客|怎搵客|如何搵客|點找客|點樣搵客|搵人見|約唔到|約人|搵客仔|客仔|潛在客|新客|陌生客|cold call|打電話|名單|leads/.test(lower);
  }
  function isStudentProfile(text) {
    const lower = text.toLowerCase();
    return /畢業|毕业|大學生|大学生|fresh grad|student|學生|師兄|師弟|同學|同學會|校友|社團|社团|系會|學會|系會|大學畢業|讀緊書|讀書|22|23|24|25 歲|25岁|後生|年轻|年輕/.test(lower);
  }
  function hasNetworkHint(text) {
    const lower = text.toLowerCase();
    return /有人脈|有人脉|人脈|人脉|識人|识人|friend|朋友|親戚|亲戚|介紹|介绍|轉介|转介|介紹人|介紹客/.test(lower);
  }
  function inferScriptContext(text) {
    const lower = text.toLowerCase();
    const emotion = detectEmotion(text);
    const recent = recentUserTurns(3).join(' ');
    const recentLower = recent.toLowerCase();
    const topic = inferTopicFromHistory(text);
    let goal = '';
    if (isProspectingQuestion(text)) goal = '搵客';
    else if (/約見|约见|見面|见面|約出|约出/.test(lower)) goal = '約見';
    else if (/初次|第一次|開場|破冰|拜訪|拜访|開口|開白|唔識見客|不会见客|點見|點樣見/.test(lower)) goal = '初次見客';
    else if (/異議|反对|拒絕|拒绝|價格|貴|預算|考慮|諗緊|想想|再諗/.test(lower)) goal = '處理異議';
    else if (/跟進|跟进|沉默|whatsapp|訊息|message|覆|回覆|追/.test(lower)) goal = '跟進';
    else if (/話術|脚本|script|開場|開口|腳本|怎麼講|點講/.test(recentLower)) goal = '話術';
    return { emotion, topic, goal };
  }
  // 畢業大學生 + 有人脈 搵客攻略
  function prospectingForStudent() {
    return `以你情況（畢業大學生 + 有人脈），最快搵客唔係 cold call，而係用好你嘅「弱關係」：

1. **同學／師兄師弟／社團**  
   大學 network 最值錢，因為大家後生、開始諗保障。你可以喺 IG / WhatsApp status 講：「而家畢業咗做保險，幫人檢查公司有冇買夠醫保、強積金有冇揀錯基金。」——呢啲係後生仔都關心嘅事。

2. **家庭轉介紹**  
   同阿爸阿媽、叔伯兄弟講：「我而家做保險，如果身邊有人想檢查下醫保/強積金，可以介紹我，我先幫佢做免費 review。」長輩通常好願意介紹。

3. **LinkedIn / 校友會**  
   寫一個簡短 DM：「師兄，我而家做財務顧問，專幫後生仔檢查公司有醫保夠唔夠、MPF 有冇揀錯。如果你或者身邊朋友有興趣，可以約 15 分鐘傾吓。」

4. **社交內容**  
   每星期出 2-3 篇小紅書/IG 講「後生仔買保險常犯錯誤」「公司醫保離職就冇」等，吸引 inbound 查詢。

想我直接幫你寫一段「約同學出嚟傾保險」嘅開場白？我寫一段你照用。`;
  }
  // 通用搵客渠道
  function prospectingGeneral() {
    return `冇客見好常見，尤其頭半年。最實際嘅 5 個搵客方向：

1. **現有人脈盤點**  
   列低 50 個你識嘅人（同學、舊同事、親戚、鄰居、健身朋友），send 一個「我轉行做保險，想幫人檢查保障」訊息，唔係 sell，而係通知。

2. **社交內容 inbound**  
   每星期出 2-3 篇 IG/小紅書/FB：「後生仔買保險 3 個誤區」「公司醫保其實唔夠」等。有人留言就 DM。

3. **LinkedIn 主動出擊**  
   搜尋同業/校友，send 簡短 DM：「我而家做財務顧問，專幟人檢查醫保/強積金。如果方便，可以約 15 分鐘飲杯嘢傾吓。」

4. **轉介紹系統**  
   每見完一個客，即使無成交，都問：「你覺得呢個 review 有用？有冇朋友都想做？我可以送佢一份免費保障檢查。」

5. **合作渠道**  
   搵地產經紀、補習老師、婚禮攝影師等接觸家庭客嘅人，互相介紹。

你而家邊個渠道最啱你？同學網絡、家庭介紹、定社交內容？我針對嗰個渠道幫你寫段開場白。`;
  }
  // 通用初次見客開場白（無指定產品時用）
  function genericOpeningScript() {
    return `【通用初次見客開場白——後生網絡版】

「阿明，多謝你抽時間出嚟。我知大家好耐冇見，其實我今次唔係想即刻 sell 你嘢。我而家做保險，發覺好多後生仔都唔知道自己公司醫保買得夠唔夠、MPF 有冇揀錯，我想免費幫你做一次保障檢查，十幾分鐘搞掂。你當多個資訊，睇完唔啱都無所謂。」

▸ 重點：
• 唔好 sell，講「免費檢查」
• 用後生仔關心嘅話題（公司醫保、MPF）
• 畀低壓力退路（唔啱都無所謂）

想我按你個客嘅背景（例如內地客、家庭客、僱主）改一版？話我知。`;
  }

  function fallbackReply(text) {
    const lower = text.toLowerCase();
    const ctx = inferScriptContext(text);
    const SCRIPT_HINT = /話術|话术|腳本|脚本|script|開場|开场|破冰|開白|開口|點講|点讲|點開口|怎麼講|怎么讲|寫段|写段|寫一段|写一段|幫我寫|帮我写|生成|我想要|我要|寫一個|写一个/.test(text);

    // 0. 最優先：搵客 / 冇客見 / 人脈 —— 直接畀實質答案，唔再叫佢揀情境
    if (ctx.goal === '搵客' || isProspectingQuestion(text)) {
      if (isStudentProfile(text) || isStudentProfile(recentUserTurns(3).join(' '))) return prospectingForStudent();
      return prospectingGeneral();
    }

    // 1. 用戶表達挫敗 / 覺得罐頭 → 先認同，再引導
    if (ctx.emotion === 'frustrated') {
      return `收到，我感受到你覺得啲回覆太機械、唔似真人。呢個反饋好重要，我哋一齊調整。

為咗寫一段真正貼你嘅話術，我只需要你答兩條：
1. 你而家最想解決咩場景？（初次見客／搵客／約見／處理異議／跟進）
2. 你個客大概係邊類人？（內地客／僱主／家庭客／年輕客）

你答完，我直接幫你砌一段自然、唔似罐頭嘅開場白。`;
    }

    // 2. 用戶焦慮 / 新手 / 唔識 → 先安撫，再畀框架，唔再叫人打指令
    if (ctx.emotion === 'anxious') {
      if (ctx.goal === '初次見客' || ctx.goal === '約見' || SCRIPT_HINT) {
        return `放心，唔識見客、緊張好正常，尤其頭幾次。我哋唔使背稿，記住三個位就得：

1. **開場唔好 sell**：先問「你而家最想解決邊樣？」
2. **中場用故事帶出缺口**：例如「好多人以為公司醫保夠，但離職就冇咗」
3. **收尾畀低壓力下一步**：「我整理份比較你睇，睇完先再決定」

想我直接幫你寫一段「初次見客」嘅開場白？你話我知：你個客係邊類人（內地客／家庭客／僱主），我寫一段你照用。`;
      }
      return `明白，新手階段最緊要係有個框架傍身，唔使驚。我哋可以由一個具體場景開始練：

• 初次見客開場（點開口唔尷尬）
• 搵客／約人見（點搵客、點約出嚟）
• 處理「我要諗諗」（唔硬銷又唔流失）
• 跟進沉默客（WhatsApp 點開口）

你揀一個，或者簡單講你而家卡喺邊。`;
    }

    // 3. 用戶想學 → 引導揀場景
    if (ctx.emotion === 'curious') {
      return `好，想學就最好。我建議由一個具體場景開始練，唔好一次學晒：

• 初次見客開場（點開口唔尷尬）
• 搵客／約人見（點搵客、點約出嚟）
• 約見內地客（低壓力約出嚟）
• 處理「我要諗諗」（唔硬銷又唔流失）
• 跟進沉默客（WhatsApp 點開口）

你揀一個，或者講你個客背景，我直接寫段你練。`;
    }

    // 4. 話術相關：唔好直接畀「X 生」範本，先問清楚；但如果已講「初次見客」就畀通用版
    if (SCRIPT_HINT) {
      if (ctx.goal === '初次見客' || ctx.goal === '約見') {
        return genericOpeningScript();
      }
      // 如果已經能推導到 topic，就直接問一個 follow-up
      if (ctx.topic && ctx.goal) {
        return `好，你想做 ${ctx.topic} 嘅 ${ctx.goal}話術。為咗寫得更貼你風格，答我兩條：
1. 你個客係邊類人？（例如：30 歲內地客／僱主／家庭主婦）
2. 你想佢聽完之後做咩？（例如：約見／交資料／俾預算）

我寫一段自然、唔似罐頭嘅話術你照用。`;
      }
      // 完全無 context，先問 3 個關鍵問題
      return `好，我幫你寫段話術。不過「X 生」範本太 generic，我寧願問清楚少少，寫段你真正用得嘅：

1. **客戶類型**：係內地客、僱主、家庭客、定年輕客？
2. **產品/場景**：VHIS、危疾、人壽、約見、跟進、定處理異議？
3. **目的**：你想佢聽完做咩？（約見/交資料/俾預算/回覆）

答到兩項，我即刻寫。`;
    }

    // 5. 其餘 keyword 保留原有特定話術，但最後引導更自然
    if (lower.includes('內地') || lower.includes('内地')) return '內地客最緊要係信任同合規：見面安排、破冰用關心唔好硬 sell、簽單要喺香港。你而家係卡喺「約唔到出嚟」，定係「出到嚟唔知講咩」？我針對嗰個環節幫你寫。';
    if (/(eci|勞工|劳工|工傷|補償).*(僱主|雇主|員工|员工|公司)|僱主|雇主.*(勞工|劳工|員工|员工|工傷|補償|買|買保|法例)/.test(text)) return '向僱主推 ECI 最自然係用 legal hook：「請咗人就要買，唔買係犯法」。你而家係想開門白，定係想應對「我而家冇請人」？';
    if (lower.includes('vhis') || lower.includes('醫保') || lower.includes('医保') || lower.includes('醫療') || lower.includes('医疗')) return 'VHIS 講解通常由「慳稅 + 公院排期 + 私院貴」三點入手。你個客係年輕單身，定係有家室？我寫段貼佢嘅版本。';
    if (lower.includes('危疾') || lower.includes('人壽') || lower.includes('重疾')) return '危疾/人壽最緊要講「收入缺口」同「家庭責任」。你個客係單身、已婚未有小朋友，定係有家庭？背景唔同，開口白完全唔同。';
    if (lower.includes('跟進') || lower.includes('跟进') || lower.includes('沉默') || lower.includes('whatsapp') || lower.includes('喚醒') || lower.includes('唤醒')) return '跟進沉默客最怕硬催。我建議三段式：有價值資訊 → 低摩擦選擇題 → 溫和截止。你上次同個客傾完幾耐？主題係咩？我寫段跟進訊息。';
    if (lower.includes('約見') || lower.includes('约见') || lower.includes('見面') || lower.includes('见面')) return '約見要低壓力、有價值。我幫你寫段 WhatsApp：講明「半個鐘」「有嘢帶」「無硬銷」。你約緊邊類客？內地客、僱主、定家庭客？';
    if (lower.includes('價格') || lower.includes('贵') || lower.includes('貴')) return '價格異議通常有三層：預算、價值感、比較對象。可以先問客：「您覺得貴，係相對邊個方案比較？」鎖定真正異議點。你想我寫段應對話術？話我知客背景。';
    if (lower.includes('客戶') || lower.includes('客户')) return '講講呢個客嘅背景：行業、職位、決策權限，同目前卡喺邊關？我幫你分析底牌，或直接生成對應話術。';
    if (lower.includes('目標') || lower.includes('目标') || lower.includes('年度')) return '年度目標建議用 OKR 拆：先寫 3-5 個 Objectives，再配可量化嘅 Key Results。畀我你今年收入／客戶數目標，我幫你拆。';
    if (lower.includes('僱主') || lower.includes('雇主') || lower.includes('員工') || lower.includes('员工')) return '僱主客由 ECI 法例切入最自然，建立關係後再 cross-sell 團體醫療同 VHIS。你係想開門白，定係想應對「我而家冇請人」？';
    if (lower.includes('退休') || lower.includes('理財') || lower.includes('理财') || lower.includes('tvc')) return '退休／理財我幫你計缺口同講扣稅。畀我客嘅年齡同目標，我出個藍圖；想要話術就話我知客背景。';

    // 6. 最後 fallback：如果上個回覆已經係同一個 fallback，改為更具體嘅追問；否則畀情境選擇
    const last = lastAssistantReply();
    if (last && last.includes('我聽到喇。我哋可以由一個具體場景開始')) {
      return `睇返你之前講，我哋講緊「初次見客」同「搵客」。我直接問一句：你而家係卡喺「搵唔到客」，定係「搵到客但唔知點開口」？

你答呢句，我直接寫一段你照用。`;
    }
    return `我聽到喇。我哋可以由一個具體場景開始，唔使講太複雜：

• 幫我寫初次見客開場
• 幫我搵客／約人見
• 幫我寫處理異議話術
• 幫我寫跟進沉默客 WhatsApp

你簡單講你個客背景，我直接幫你砌一段。`;
  }

  // ── 私隱守護：PII 遮蔽 + 敏感模式 ──
  const PRIVACY_KEY = 'set_privacy_mode';
  function getPrivacyMode() { try { return (localStorage.getItem(PRIVACY_KEY) || 'off') === 'on'; } catch (e) { return false; } }
  function setPrivacyMode(on) { try { localStorage.setItem(PRIVACY_KEY, on ? 'on' : 'off'); } catch (e) {} }

  const HEALTH_TERMS = ['糖尿病','高血壓','心臟病','心臟','癌症','腫瘤','中風','乙肝','肝炎','哮喘','精神病','抑鬱症','抑鬱','腎病','膽固醇','痛風','甲亢','帶狀疱疹','長期病','慢性病','自閉症','柏金遜','認知障礙','肺癆','結核','地中海貧血','血友病','紅斑狼瘡','牛皮癬','癲癇'];
  // 返回 { text: 遮蔽後文字, count: 遮蔽咗幾處 }
  function maskPII(text) {
    if (!text) return { text: text, count: 0 };
    let t = text, count = 0;
    const apply = (re, repl) => {
      const m = t.match(re);
      if (m) count += m.length;
      t = t.replace(re, repl);
    };
    apply(/\b[A-Z]{1,2}[0-9]{6}[0-9A]\b/g, '[身份證號碼]');                          // 香港身份證
    apply(/(\+?852[\s-]?)?[569]\d{3}[\s-]?\d{4}\b/g, '[電話號碼]');                  // 電話（香港手機 / +852）
    apply(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[電郵]');              // 電郵
    apply(/[一-鿿A-Za-z]{1,3}(先生|小姐|女士|太太|太|Sir|sen|Sen)/g, '[客戶]');        // 姓名（稱謂前綴）
    apply(/(姓名|名字|客戶名|name)[:：]\s*[^\s,，]{1,12}/gi, '[客戶姓名]');            // 「姓名：XXX」格式
    if (HEALTH_TERMS.length) {
      const hr = new RegExp('(' + HEALTH_TERMS.join('|') + ')', 'g');
      apply(hr, '[健康資料]');                                                        // 健康資料（疾病名）
    }
    return { text: t, count };
  }

  function maskInput() {
    const input = $('setMsgInput');
    if (!input) return;
    const raw = input.value;
    if (!raw.trim()) { showSetToast('冇內容可遮蔽'); return; }
    const { text, count } = maskPII(raw);
    input.value = text;
    showSetToast(count > 0 ? ('已遮蔽 ' + count + ' 處敏感資料 ✓') : '未發現常見敏感資料（仍請自行檢查）');
  }

  function showSetToast(msg) {
    let el = $('setToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'setToast';
      el.className = 'set-toast';
      const chat = $('setChat');
      if (chat) chat.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function statusText(cfg, privacy) {
    if (privacy) return '🔒 私隱守護開啟 · 對話唔出雲端（離線）';
    if (cfg.provider === 'mock') return '離線示範模式（模擬回覆）';
    if (cfg.provider === 'ollama') return '真 LLM 模式 · 本地 Ollama（' + (cfg.model || 'llama3.2') + '）';
    return '真 LLM 模式 · API（' + (cfg.model || '未設 model') + '）';
  }

  // ── 真 LLM 呼叫（ollama / openai-compatible）──
  function buildSystemPrompt(agent) {
    return '你係「' + agent.name + '」，一個專為香港保險經紀（Manulife HK 持牌）而設嘅 AI 助手。\n\n' +
      '你的角色定位：\n' + agent.desc + '\n\n' +
      '規則：\n' +
      '- 用繁體中文（粵語口吻）回答，簡潔、實用、可直接出口。\n' +
      '- 你專注保險銷售實務：VHIS、人壽危疾、ECI 勞工保險、MPF/TVC 轉化、員工福利、內地客專項。\n' +
      '- 涉及金額數字要準確（VHIS 扣稅上限 HK$8,000/人、TVC HK$60,000/年）。\n' +
      '- 唔好講「保證回報」等違規字眼；合規優先。\n' +
      '- 如果對方想要話術／腳本，直接畀一段可以照抄用嘅版本。';
  }

  async function callLLM(text) {
    const cfg = getLLMConfig();
    const messages = [{ role: 'system', content: buildSystemPrompt(currentAgent) }];
    conversation.forEach(m => messages.push({ role: m.role, content: m.content }));
    messages.push({ role: 'user', content: text });

    if (cfg.provider === 'ollama') {
      const base = (cfg.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
      const res = await fetch(base + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: cfg.model || 'llama3.2', messages: messages, stream: false })
      });
      if (!res.ok) throw new Error('Ollama HTTP ' + res.status);
      const data = await res.json();
      return (data.message && data.message.content ? data.message.content : '').trim() || '(Ollama 冇回應內容)';
    }

    // openai-compatible（OpenAI / Gemini / Groq / DeepSeek / OpenRouter…）
    const base = (cfg.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
    const res = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({ model: cfg.model || 'gpt-4o-mini', messages: messages, temperature: 0.7 })
    });
    if (!res.ok) {
      let msg = 'API HTTP ' + res.status;
      try { const e = await res.json(); if (e.error && e.error.message) msg += ': ' + e.error.message; } catch (_) {}
      throw new Error(msg);
    }
    const data = await res.json();
    const content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    return content.trim() || '(API 冇回應內容)';
  }

  // ===== AI 私人助理（function calling + 離線路由）=====
  const ASSISTANT_TOOLS = [
    { type: 'function', function: { name: 'social_create', description: '根據主題一次過生成 Instagram、小紅書、Facebook 三個平台的貼文文案同封面圖（自動轉去社交內容引擎頁）', parameters: { type: 'object', properties: { topic: { type: 'string', description: '貼文主題，例如「自願醫保扣稅懶人包」' }, style: { type: 'string', enum: ['professional','casual','educational','storytelling'], description: '文案風格' }, persona: { type: 'string', enum: ['expert','friendly','mentor'], description: '人設' }, audience: { type: 'string', enum: ['hk','cn','all'], description: 'hk=香港觀眾, cn=內地觀眾, all=兩者都做' }, realistic: { type: 'boolean', description: 'true=用 AI 生成寫實家庭/香港天際線背景（似片中專業美工）' } }, required: ['topic'] } } },
    { type: 'function', function: { name: 'proposal_create', description: '開啟 Proposal 引擎並填好標題/客戶，等用家補產品', parameters: { type: 'object', properties: { title: { type: 'string' }, client: { type: 'string' }, product: { type: 'string' }, purpose: { type: 'string', enum: ['client','couple','family'] } }, required: [] } } },
    { type: 'function', function: { name: 'followup_create', description: '開啟 Follow-Up 生成器並填好客戶/階段/語氣', parameters: { type: 'object', properties: { client: { type: 'string' }, stage: { type: 'string', enum: ['first','thinking','ghosted','proposal-sent','objection','close'] }, tone: { type: 'string', enum: ['professional','casual','gentle','urgent'] }, product: { type: 'string' } }, required: [] } } },
    { type: 'function', function: { name: 'meeting_create', description: '開啟見客準備並填好客戶/目的/時長', parameters: { type: 'object', properties: { client: { type: 'string' }, purpose: { type: 'string', enum: ['first','proposal','followup','review'] }, duration: { type: 'string', enum: ['30','60','90'] } }, required: [] } } },
    { type: 'function', function: { name: 'client_analyze', description: '開啟客戶分析並填好基本資料', parameters: { type: 'object', properties: { name: { type: 'string' }, age: { type: 'string' }, job: { type: 'string' }, income: { type: 'string' }, marital: { type: 'string', enum: ['single','married','divorced'] }, kids: { type: 'string' } }, required: [] } } }
  ];

  function consultantSystem() {
    return '你係「SET全能顧問」，一個為香港保險經紀（Manulife HK 持牌）而設嘅全能 AI 顧問，亦係用家嘅私人工作助理，嵌入喺 Agent OS AI 工作台。\n\n你嘅雙重角色：\n（一）保險銷售顧問知識——包晒六大範疇：VHIS 自願醫保、人壽危疾、ECI 勞工保險、MPF/TVC 轉化、新員工 Onboarding，外加內地客專項（見面困難、開 case 話術、內地市場知識）。幫用家制定談判策略、拆解客戶底牌、模擬簽單對話。\n（二）AI 私人助理動作能力（用 function calling 自動執行）：\nsocial_create — 一次過生成 IG / 小紅書 / Facebook 三平台貼文同封面圖\nproposal_create — 開 Proposal 引擎\nfollowup_create — 開 Follow-Up 生成器\nmeeting_create — 開見客準備\nclient_analyze — 開客戶分析\n\n規則：\n- 用繁體中文（粵語口吻）回答，簡潔、實用、可直接出口。\n- 當用家想做具體工作（出 post、寫 proposal、跟進、見客準備、分析客戶），優先 call 對應 tool，唔好淨係講。\n- 當用家想傾保險知識／策略／話術，直接俾專業答案（六大範疇＋內地客專項）。\n- 涉及金額要準確（VHIS 扣稅上限 HK$8,000/人、TVC HK$60,000/年）。\n- 唔好講「保證回報」等違規字眼；國內平台對保險業有限制，內容要合規、避免敏感字眼。\n- 正式發佈前提醒用家自己再檢查一次。';
  }

  function extractTopic(text) {
    const T = (typeof TEMPLATES !== 'undefined' && TEMPLATES.socialTopics) ? TEMPLATES.socialTopics : {};
    for (const k of Object.keys(T)) if (text.indexOf(k) >= 0) return k;
    const m = text.match(/(?:主題|關於|講|出|生成|generate|做)\s*[:：]?\s*([^\n，,。.\n]{2,20})/);
    if (m) return m[1].trim();
    return null;
  }
  function extractArgs(text) {
    const a = {};
    const clientM = text.match(/(?:客戶|客|幫)\s*[:：]?\s*([^\s，,。.]{1,8}?)(?:嘅|的|準備|做|寫|生成|proposal|follow|brief|分析|見)/);
    if (clientM) a.client = clientM[1].replace(/[嘅的]/g, '');
    const prodM = text.match(/(?:產品|推|講)\s*[:：]?\s*([^\s，,。.]{1,12}?)(?:保|險|計劃|產品)/);
    if (prodM) a.product = prodM[1];
    const nameM = text.match(/([^\s，,。.]{1,6}?)(?:先生|小姐|女士|太|生)/);
    if (nameM) a.name = nameM[1];
    return a;
  }
  function setVal(id, v) { const el = document.getElementById(id); if (el && v) el.value = v; }
  function activateByClass(cls, val) {
    document.querySelectorAll('.' + cls).forEach(ch => {
      if (ch.dataset && ch.dataset.val === val) ch.classList.add('active');
      else if (ch.dataset && ch.dataset.val) ch.classList.remove('active');
    });
  }
  function prefillProposal(a) {
    setVal('propTitle', a.title || (a.client ? a.client + ' 建議書' : ''));
    if (a.client) { const s = document.getElementById('propClientSelect'); if (s) { for (const o of s.options) { if (a.client && o.text && o.text.indexOf(a.client) >= 0) { s.value = o.value; break; } } } }
  }
  function prefillFollowup(a) {
    setVal('fuClient', a.client || '');
    setVal('fuProduct', a.product || '');
    if (a.stage) activateByClass('fu-stage', a.stage);
    if (a.tone) setVal('fuTone', a.tone);
  }
  function prefillMeeting(a) {
    if (a.client) { const s = document.getElementById('meetClientSelect'); if (s) { for (const o of s.options) { if (a.client && o.text && o.text.indexOf(a.client) >= 0) { s.value = o.value; break; } } } }
    if (a.purpose) activateByClass('meet-purpose-chip', a.purpose);
  }
  function prefillClient(a) {
    setVal('cName', a.name || a.client || '');
    setVal('cAge', a.age || '');
    setVal('cJob', a.job || '');
    setVal('cIncome', a.income || '');
    setVal('cMarital', a.marital || '');
    setVal('cKids', a.kids || '');
  }

  async function execAssistantTool(name, args) {
    try {
      if (name === 'social_create') {
        const topic = args.topic || (document.getElementById('socialTopic') ? document.getElementById('socialTopic').value : '') || '家庭財務規劃';
        navigateTo('social');
        const r = await SocialModule.generateMultiPlatform({ topic: topic, style: args.style, persona: args.persona, audience: args.audience, realistic: !!args.realistic });
        return { ok: true, action: 'social_create', topic: topic, platforms: ['Instagram', '小紅書', 'Facebook'] };
      }
      if (name === 'proposal_create') { navigateTo('proposal'); prefillProposal(args); return { ok: true, action: 'proposal_create' }; }
      if (name === 'followup_create') { navigateTo('followup'); prefillFollowup(args); return { ok: true, action: 'followup_create' }; }
      if (name === 'meeting_create') { navigateTo('meeting'); prefillMeeting(args); return { ok: true, action: 'meeting_create' }; }
      if (name === 'client_analyze') { navigateTo('client'); prefillClient(args); return { ok: true, action: 'client_analyze' }; }
      return { ok: false, error: 'unknown tool ' + name };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  async function consultantLLM(text) {
    const cfg = getLLMConfig();
    const messages = [{ role: 'system', content: consultantSystem() }];
    conversation.forEach(m => { if (m.role === 'user' || m.role === 'assistant') messages.push({ role: m.role, content: m.content }); });
    messages.push({ role: 'user', content: text });
    const base = (cfg.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
    const mk = (msgs, tools) => fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({ model: cfg.model, messages: msgs, tools: tools || undefined, tool_choice: tools ? 'auto' : undefined, temperature: 0.5 })
    });
    let res = await mk(messages, ASSISTANT_TOOLS);
    if (!res.ok) { let e = 'API ' + res.status; try { const j = await res.json(); if (j.error && j.error.message) e += ': ' + j.error.message; } catch (_) {} throw new Error(e); }
    const data = await res.json();
    const msg = data.choices && data.choices[0] && data.choices[0].message;
    if (msg && msg.tool_calls && msg.tool_calls.length) {
      addBotMessage('⏳ 幫你用 OS 平台搞緊…');
      let anyNav = false;
      const toolResults = [];
      for (const tc of msg.tool_calls) {
        let args = {};
        try { args = JSON.parse(tc.function.arguments || '{}'); } catch (_) {}
        const result = await execAssistantTool(tc.function.name, args);
        if (tc.function.name === 'social_create') anyNav = true;
        toolResults.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      const msgs2 = messages.slice();
      msgs2.push({ role: 'assistant', content: msg.content || '', tool_calls: msg.tool_calls });
      toolResults.forEach(r => msgs2.push(r));
      msgs2.push({ role: 'user', content: '請用繁體中文（粵語口吻）簡短確認你剛才做咗啲咩，同下一步建議（唔使重複工具結果細節）。' });
      let summary = text;
      try {
        const res2 = await mk(msgs2, null);
        if (res2.ok) { const d2 = await res2.json(); summary = (d2.choices && d2.choices[0] && d2.choices[0].message && d2.choices[0].message.content) || summary; }
      } catch (_) {}
      return (summary.trim() || '搞掂！') + (anyNav ? '\n\n（已轉去「社交內容引擎」頁，睇 3 平台結果）' : '');
    }
    return (msg && msg.content ? msg.content : '').trim() || '(無回應)';
  }

  async function assistantOffline(text) {
    const t = text.toLowerCase();
    const isSocial = /小紅書|xiaohongshu|ig|instagram|facebook|fb|帖文|貼文|貼|post|社交|封面|圖|content|發/.test(t);
    if (isSocial) {
      const topic = extractTopic(text) || (document.getElementById('socialTopic') ? document.getElementById('socialTopic').value : '') || '家庭財務規劃';
      const audience = /內地|cn|大陆|中國|内地/.test(t) ? 'cn' : (/香港|hk/.test(t) ? 'hk' : 'all');
      const style = /專業|professional/.test(t) ? 'professional' : /故事|story/.test(t) ? 'storytelling' : /教育|education/.test(t) ? 'educational' : /親切|casual|貼地/.test(t) ? 'casual' : 'professional';
      const realistic = /寫實|realistic|專業美工|片中美工/.test(t);
      addBotMessage('⏳ 幫你一次過生成 Instagram / 小紅書 / Facebook 三個版本…' + (realistic ? '（寫實 AI 封面）' : ''));
      await SocialModule.generateMultiPlatform({ topic: topic, audience: audience, style: style, realistic: realistic });
      return '✅ 搞掂！已經幫你出咗 3 個平台版本（Instagram 1:1 / 小紅書 3:4 / Facebook 1.91:1），自動轉咗去「社交內容引擎」頁睇結果，每張圖下面有「⬇️ 圖」同「🎨 Canva」。\n\n想再調就喺個頁改主題再撳；「寫實 AI 封面」掣會用 AI 幫你畫家庭／香港天際線背景。';
    }
    if (/proposal|建議書|建議/.test(t)) { navigateTo('proposal'); prefillProposal(extractArgs(text)); return '✅ 已開啟 Proposal 引擎，幫你填好標題／客戶。補返想推介嘅產品，撳「生成建議書框架」就得。想我直接寫，俾我：客戶名 + 產品 + 目的。'; }
    if (/follow|跟進|跟上/.test(t) && /whatsapp|訊息|message|客|跟/.test(t)) { navigateTo('followup'); prefillFollowup(extractArgs(text)); return '✅ 已開啟 Follow-Up 生成器。揀返階段同語氣，就出 WhatsApp 訊息。'; }
    if (/見客|meeting|brief|準備|約見|見面/.test(t)) { navigateTo('meeting'); prefillMeeting(extractArgs(text)); return '✅ 已開啟見客準備，幫你填好目的同時長。揀客戶撳「生成 Meeting Flow」就得。'; }
    if (/客戶|分析|保障缺口|client|風險/.test(t)) { navigateTo('client'); prefillClient(extractArgs(text)); return '✅ 已開啟客戶分析，填入資料就自動分析保障缺口同風險重點。'; }
    return fallbackReply(text) + '\n\n（想我做實際嘢，可以講：出社交貼文 / 準備 proposal / 寫 follow-up / 準備見客 brief / 分析客戶）';
  }

  // 判斷用家句說話係咪「做緊嘢」嘅動作指令（出 post / proposal / follow-up / 見客 / 客戶分析）
  // 注意：要避開純顧問知識指令（如「分析客戶底牌」「準備開價話術」），否則會錯誤跳去 client/meeting 模組
  function isActionIntent(text) {
    const t = text.toLowerCase();
    if (/小紅書|xiaohongshu|ig|instagram|facebook|fb|帖文|貼文|post|社交|封面|content|發文|發帖|出圖|做圖|圖/.test(t)) return true;
    if (/proposal|建議書|建議/.test(t)) return true;
    if (/follow|跟進|跟上/.test(t)) return true;
    if (/見客準備|meeting|brief|約見|見面準備/.test(t)) return true;
    if (/客戶分析|保障缺口|client分析|風險分析/.test(t)) return true;
    return false;
  }

  async function sendConsultant(text) {
    conversation.push({ role: 'user', content: text });
    const cfg = getLLMConfig();
    const privacy = getPrivacyMode();
    // 空 key pre-check（同 SET 其他 agent 一致，避免 user 見到 401）
    if (cfg.provider === 'openai' && !cfg.apiKey) {
      const reply = '⚠️ 你仲未填 API Key。\n\n請按右上角 ⚙️ 設定 → 撳「NVIDIA」或「OpenRouter」preset 掣 → 喺「API Key」一欄貼你嘅 key → 再撳「保存設定」後重新發送。\n\n* NVIDIA NIM（免費無限）→ https://build.nvidia.com → 註冊 → Settings → API Keys\n* OpenRouter（免費模型）→ https://openrouter.ai/keys → 註冊拎 key\n\n（冇 key 都唔緊要，我可以暫時用離線助理幫你做基本嘢。）';
      conversation.push({ role: 'assistant', content: reply });
      removeTyping();
      addBotMessage(reply);
      isBotTyping = false;
      const sb = $('setSendBtn'); if (sb) sb.disabled = false;
      return;
    }
    let reply;
    try {
      if (cfg.provider === 'mock' || privacy) {
        // 離線：動作指令 → AI 私人助理路由；否則 → 全能顧問知識庫
        if (isActionIntent(text)) reply = await assistantOffline(text);
        else { await new Promise(r => setTimeout(r, 300)); reply = mockReplies[text] || fallbackReply(text); }
      } else {
        reply = await consultantLLM(text);
      }
    } catch (e) {
      reply = (isActionIntent(text) ? (await assistantOffline(text)) : (mockReplies[text] || fallbackReply(text))) + '\n\n⚠️ 真 LLM 失敗（' + e.message + '），已用離線助理。';
    }
    conversation.push({ role: 'assistant', content: reply });
    removeTyping();
    addBotMessage(reply);
    isBotTyping = false;
    const sb = $('setSendBtn'); if (sb) sb.disabled = false;
  }

  async function sendUserText(text) {
    if (isBotTyping) return;
    addUserMessage(text);
    clearChips();
    isBotTyping = true;
    $('setSendBtn').disabled = true;
    showTyping();
    // SET全能顧問 = 顧問知識 + AI 私人助理動作能力（二合一，委派去專屬處理）
    if (currentAgent && currentAgent.id === 'negotiation') {
      await sendConsultant(text);
      return;
    }
    const cfg = getLLMConfig();
    const privacy = getPrivacyMode();   // 敏感模式：強制離線，唔出雲端
    let reply;
    // 空 key pre-check：唔直接 call API 令用家見到 401
    if (cfg.provider === 'openai' && !cfg.apiKey) {
      reply = '⚠️ 你仲未填 API Key。\n\n請按右上角 ⚙️ 設定 → 撳「NVIDIA」或「OpenRouter」preset 掣 → 喺「API Key」一欄貼你嘅 key → 再撳「保存設定」後重新發送。\n\n* NVIDIA NIM（免費無限）→ https://build.nvidia.com → 註冊 → Settings → API Keys\n* OpenRouter（免費模型）→ https://openrouter.ai/keys → 註冊拎 key';
      conversation.push({ role: 'assistant', content: reply });
      addBotMessage(reply);
      isBotTyping = false;
      $('setSendBtn').disabled = false;
      removeTyping();
      return;
    }
    try {
      if (cfg.provider === 'mock' || privacy) {
        // 離線示範：極短思考 delay 令三點動畫有呼吸感
        await new Promise(r => setTimeout(r, 300));
        reply = mockReplies[text] || fallbackReply(text);
        conversation.push({ role: 'assistant', content: reply });
      } else {
        reply = await callLLM(text);
        conversation.push({ role: 'user', content: text });
        conversation.push({ role: 'assistant', content: reply });
      }
    } catch (e) {
      // 真 LLM 呼叫失敗 → 退回 mock + 提示，唔會整崩個介面
      reply = (mockReplies[text] || fallbackReply(text)) + '\n\n⚠️ 真 LLM 呼叫失敗（' + e.message + '），已退回離線示範回覆。';
      conversation.push({ role: 'assistant', content: reply });
    }
    removeTyping();
    addBotMessage(reply);
    isBotTyping = false;
    $('setSendBtn').disabled = false;
  }

  function sendMessage() {
    const input = $('setMsgInput');
    const text = input.value.trim();
    if (!text || isBotTyping) return;
    input.value = '';
    sendUserText(text);
  }

  function init() {
    const input = $('setMsgInput');
    const search = $('setSearchInput');
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
    if (search) search.addEventListener('input', e => renderAgents(e.target.value));
    renderAgents('SET');
  }

  // ── LLM 設定界面 ──
  function openSettings() {
    const cfg = getLLMConfig();
    $('setLlmProvider').value = cfg.provider || 'mock';
    renderSettingsFields(cfg);
    const tog = $('setPrivacyToggle');
    if (tog) tog.checked = getPrivacyMode();
    $('setSettingsModal').style.display = 'flex';
  }
  function closeSettings() { const m = $('setSettingsModal'); if (m) m.style.display = 'none'; }
  function onProviderChange() {
    const cfg = getLLMConfig();
    cfg.provider = $('setLlmProvider').value;
    renderSettingsFields(cfg);
  }
  function renderSettingsFields(cfg) {
    const wrap = $('setLlmFields');
    const hint = $('setLlmHint');
    if (!wrap) return;
    const p = cfg.provider;
    let html = '';
    if (p === 'ollama') {
      html = '<div class="form-group"><label class="form-label" style="color:var(--navy)">Ollama 地址</label><input id="setLlmBase" class="form-input" value="' + (cfg.baseUrl || 'http://localhost:11434') + '" placeholder="http://localhost:11434"></div>' +
             '<div class="form-group"><label class="form-label" style="color:var(--navy)">模型名稱</label><input id="setLlmModel" class="form-input" value="' + (cfg.model || 'llama3.2') + '" placeholder="llama3.2"></div>';
      if (hint) hint.innerHTML = '喺你部電腦裝好 Ollama 並 <code>ollama pull llama3.2</code>，SET 會經 localhost 呼叫，唔使任何 key。';
    } else if (p === 'openai') {
      html = '<div class="form-group"><label class="form-label" style="color:var(--navy)">API Base URL</label><input id="setLlmBase" class="form-input" value="' + (cfg.baseUrl || '') + '" placeholder="https://api.openai.com/v1"></div>' +
             '<div class="form-group"><label class="form-label" style="color:var(--navy)">API Key</label><input id="setLlmKey" type="password" class="form-input" value="' + (cfg.apiKey || '') + '" placeholder="sk-...（OpenAI / OpenRouter key）"></div>' +
             '<div class="form-group"><label class="form-label" style="color:var(--navy)">模型</label><input id="setLlmModel" class="form-input" value="' + (cfg.model || '') + '" placeholder="gpt-4o-mini / gemini-2.0-flash / claude-3-haiku"></div>';
      if (hint) hint.innerHTML = '支援任何 OpenAI-compatible 外國端點（NVIDIA / OpenRouter / OpenAI / Google）。Key 只存在你瀏覽器 localStorage，唔會上傳任何 server。推薦用 <b>NVIDIA NIM</b>（build.nvidia.com）完全免費無限額，唔使信用卡。';
    } else {
      if (hint) hint.innerHTML = '離線示範模式用內建模擬回覆，唔使任何設定，啟動即用。想用真 LLM 請揀上面兩個。';
    }
    wrap.innerHTML = html;
  }
  function saveSettings() {
    const cfg = { provider: $('setLlmProvider').value, baseUrl: '', apiKey: '', model: '' };
    if (cfg.provider === 'ollama' || cfg.provider === 'openai') {
      cfg.baseUrl = $('setLlmBase') ? $('setLlmBase').value.trim() : '';
      cfg.model = $('setLlmModel') ? $('setLlmModel').value.trim() : '';
    }
    if (cfg.provider === 'openai') cfg.apiKey = $('setLlmKey') ? $('setLlmKey').value.trim() : '';
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
    const tog = $('setPrivacyToggle');
    setPrivacyMode(tog ? tog.checked : false);
    closeSettings();
    if (currentAgent) {
      const dot = $('setStatusDot');
      if (dot) dot.textContent = statusText(cfg, getPrivacyMode());
    }
  }

  // ── 一鍵切 LLM 供應商（全部外國服務，唔用中國 provider）──
  // NVIDIA NIM（build.nvidia.com）：完全免費、無限額、40 RPM、開源大額模型、OpenAI-compatible
  // OpenRouter（openrouter.ai）：免費模型（:free 後綴）、20 RPM、多模型閘道
  const LLM_PRESETS = {
    nvidia:      { label: 'NVIDIA（免費無限）',    provider: 'openai', baseUrl: 'https://integrate.api.nvidia.com/v1', model: 'meta/llama-4-maverick' },
    openrouter:  { label: 'OpenRouter（免費）',    provider: 'openai', baseUrl: 'https://openrouter.ai/api/v1',       model: 'meta-llama/llama-3.3-70b-instruct:free' },
    mock:        { label: '離線示範',              provider: 'mock',   baseUrl: '', model: '' }
  };
  function quickSwitch(key) {
    const p = LLM_PRESETS[key];
    if (!p) return;
    const cfg = getLLMConfig();
    cfg.provider = p.provider;
    cfg.baseUrl = p.baseUrl || '';
    cfg.model = p.model || '';
    // 離線模式清空 key；API 模式保留用家之前填過嘅 key
    if (p.provider === 'mock') cfg.apiKey = '';
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
    // 同步設定界面
    const prov = $('setLlmProvider'); if (prov) prov.value = cfg.provider;
    renderSettingsFields(cfg);
    if (cfg.provider === 'openai') {
      const b = $('setLlmBase'); if (b) b.value = cfg.baseUrl;
      const m = $('setLlmModel'); if (m) m.value = cfg.model;
    }
    // 即時更新 chat 狀態顯示
    if (currentAgent) {
      const dot = $('setStatusDot');
      if (dot) dot.textContent = statusText(cfg, getPrivacyMode());
    }
    const name = (cfg.provider === 'mock') ? '離線示範模式' : (p.label + ' · ' + cfg.model);
    showSetToast('已切換 LLM → ' + name + (cfg.provider === 'openai' && !cfg.apiKey ? '（記得填 API Key 先出到真回覆）' : ''));
  }

  const api = { init, showDiscover, sendMessage, openSettings, closeSettings, saveSettings, onProviderChange, maskInput, quickSwitch };
  api.__test = { fallbackReply, detectEmotion, inferScriptContext, recentUserTurns, inferTopicFromHistory, isProspectingQuestion, isStudentProfile, hasNetworkHint, pushConversation: (role, content) => conversation.push({ role, content }) };
  return api;
})();
window.SetModule = SetModule;
