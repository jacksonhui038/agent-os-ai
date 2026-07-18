// ===== Templates.js — 內容模板庫 =====

const TEMPLATES = {

  // 社交內容模板
  socialTopics: {
    '自願醫保扣稅懶人包': {
      hooks: ['2025/26 稅季到了！你知唔知買 VHIS 可以扣稅？', '每年最多扣 $8,000！等於政府幫你付部份保費'],
      keyPoints: ['什麼是 VHIS 自願醫保', '扣稅上限同條件', '點揀適合嘅計劃', '常見 Q&A'],
      cta: '留言「醫保」或 PM 我，幫你免費評估現有保障夠唔夠',
      hashtags: '#香港保險 #VHIS #稅務優惠 #自願醫保 #扣稅'
    },
    '年輕家庭醫療保障規劃': {
      hooks: ['有咗小朋友之後，你嘅醫療保障更新過未？', '一個細菌入院，醫療費可以係六位數'],
      keyPoints: ['公院 vs 私院選擇權', '全家保障 vs 個人計劃', '小朋友常見住院情況', '預算分配建議'],
      cta: 'DM「家庭」拎免費保障檢查表 👨‍👩‍👧',
      hashtags: '#家庭保障 #兒童保險 #香港醫療 #新手爸媽 #保險規劃'
    },
    '危疾保障常見誤解': {
      hooks: ['以為有公司醫保就夠？呢 3 個誤解可能害到你', '危疾保險唔係「得咗病先賠錢」咁簡單'],
      keyPoints: ['誤解1：有醫保就不需要危疾', '誤解2：年輕唔使急', '誤解3：一份用到老', '正確做法：分階段配置'],
      cta: '想知自己嘅保障缺口？留言「檢查」我幫你看',
      hashtags: '#危疾保險 #保障缺口 #香港保險 #財務策劃 #理財'
    },
    '退休金及儲蓄規劃': {
      hooks: ['30 歲開始每月儲 $3,000，退休可以有幾多？', 'MPF 夠唔夠退休？答案可能令你驚訝'],
      keyPoints: ['MPF 實際回報分析', '通脹對退休金嘅影響', '何時開始儲蓄最好', '不同儲蓄工具比較'],
      cta: '免費幫你做退休需求分析 — PM「退休」即時預約',
      hashtags: '#退休規劃 #儲蓄保險 #MPF #財務自由 #長線投資'
    },
  },

  // 小紅書特化模板
  xiaohongshuTemplates: {
    medical: {
      title: '來香港買醫療險前先看這 3 點',
      subtitle: '高端醫療 · 家庭保障 · 跨境就醫',
      body: `很多內地家庭想來香港配置醫療險，第一步不是買最貴，而是先看：

1️⃣ 預算 —— 每月能承受多少保費？
2️⃣ 醫院選擇 —— 只在香港？還是需要覆蓋內地／全球？
3️⃣ 是否需要覆蓋全家 —— 配偶、子女、父母？

💡 小貼士：香港高端醫療的免賠額設計很靈活，選對了可以慳 30-50% 保費。

👇 評論「醫療」領取配置清單`,
      commentCta: '評論「醫療」領取配置清單',
      hashtags: '#香港醫療險 #高端醫療 #跨境家庭 #香港保險 #家庭保障規劃'
    }
  },

  // Follow-Up 訊息模板
  followupMessages: {
    first: {
      professional: {
        short: '{name} 你好，謝謝今日抽時間傾。我整理左今日討論要點，有需要隨時聯絡我。',
        long: `{name} 你好，

感謝今日撽空見面！以下係今日討論重點：

📌 您目前保障狀況：{product}
📌 我哋討論到嘅方向：{summary}
📌 下一步建議：{nextStep}

有任何問題歡迎隨時 WhatsApp 我，祝順利！`,
        day3: '{name} 早！距離上次見面幾日啦，不知您對之前討論嘅方案有冇進一步想法？有問題隨時搵我 😊',
        day7: '{name} 你好！上週傾嘅嘢，您有時間再傾多陣嗎？我可以安排電話或視像會議，方便您。',
      },
      casual: {
        short: '{name} 多謝今日傾！有嘢随时找我 🙌',
        long: `嘿 {name}！

今日傾得好開心！記住我哋講嘅幾個重點：

✅ {product} 其實好適合你嘅情況
✅ 預算可以彈性處理
✅ 冇壓力，慢慢嚟

有嘢直接 WhatsApp 我啦！`,
        day3: '{name} 早啊 ☀️ 上次傾嘅嘢有冇諗到？唔使急，有疑問隨時問我～',
        day7: 'Hi {name}！一個禮拜咁快過 📅 上次傾嘅方案你想點？話我知吓，我幫你跟進！',
      },
      gentle: {
        short: '{name} 你好，今日傾完想再多謝你一次。祝一切順利！',
        long: `{name} 你好，

今日非常感謝你願意分享自己嘅情況。

我明白做保障決定需要時間，完全唔使急。
當你有任何疑問或準備好繼續討論時，隨時聯絡我就可以。

祝你生活愉快！`,
        day3: '{name} 你好，只係輕輕問候一下。上次傾嘅嘢有任何問題都可以随时問我，不急的 😊',
        day7: '{name} 你好，希望這週一切都好。關於保障嘅事情隨時可以再聊，沒有壓力的。',
      }
    },
    thinking: {
      professional: [
        '明白 {name}，保障係重要決定，需要時間考慮。我有份更詳細嘅資料想傳俾您參考，方便嗎？',
        '收到！如果方便嘅話，我可以安排一個短電話解答您嘅疑慮，大概 10 分鐘就好。',
        '了解。其實很多客人都係第一次接觸呢類產品，有疑問係正常嘅。我整理咗一個 FAQ 可以發俾您。'
      ],
      casual: [
        'OK 沒問題 {name}！慢慢諗，唔好畀壓力自己 😄 有咩唔明隨時問我',
        '收到～ 其實我都建議客人諗清楚先好，買保險唔係衝動消費嘛。等你消息！',
        '明白明白！你可以同屋企人商量下，有任何問題我都在線等你 📱'
      ],
      gentle: [
        '完全理解，{name}。這種事情確實值得慎重考慮，不用着急。',
        '好的，請慢慢考慮。當你準備好了或者有任何想法，隨時告訴我。',
        '沒問題的，{name}。保障的事情不趕這一兩天，你按照自己的節奏來就好。'
      ]
    },
    ghosted: {
      professional: [
        '{name} 你好，之前傾嘅保障方案不知道您有冇機會睇？如有任何問題歡迎提出，我可以調整方案配合您需要。',
        '{name} 你好，近期工作忙嗎？關於之前討論嘅保障事宜，如果您已經有其他安排也請告知，多謝！',
        'Hi {name}，只是想確認一下之前的資料是否收到。如果現在不太方便也沒關係，改天再聊。'
      ],
      casual: [
        '{name}！好久不見 👋 你最近好忙呀？之前傾嘅嘢仲記得嗎？哈哈冇壓力，有空再聊～',
        '喂 {name} 你消失埋咗 😂 係咪忙到飛起？得閒記得覆我一下哈，唔急嘅！',
        '{name} 早啊！又係新的一週 ⭐ 上次傾嘅方案還在等你審批呢～'
      ],
      gentle: [
        '{name} 你好，很久沒聯絡了，希望你一切都好。只是想輕輕提醒一下，之前的保障方案隨時可以繼續討論。',
        'Hi {name}，不打擾你忙碌的工作和生活。只是在想，如果有任何我能幫上忙的地方，請告訴我。',
        '{name} 你好，知道大家都很忙。如果之前的討論不合適時機了，完全理解。祝你一切順利！'
      ]
    },
    proposalSent: {
      professional: [
        '{name} 你好，建議書已經發送。重點摘要：\n\n📋 方案概覽：{product}\n💰 月供範圍：根據您的預算\n⏱️ 保障年期：長期至終身\n\n有什麼問題隨時提出！',
        '{name} 建議書收到嗎？我想安排一個時間同您過一遍內容，大約 20-30 分鐘。您這週方便嗎？'
      ],
      casual: [
        '{name} Proposal 發出啦！📄 有空記得睇下，有乜嘢唔明直接問我～',
        'Proposal 到貨！🎁 {name} 你睇完話我知，我可以電話解釋或者約出黎傾都得！'
      ],
      gentle: [
        '{name} 你好，建議書已經發給你了。請在不忙的時候看看，有任何不清楚的地方隨時告訴我。',
        'Hi {name}，提案文件已發送。不用急著看，有空的時候瀏覽一下，我們再找時間討論。'
      ]
    },
    objection: {
      price: [
        '明白預算係重要考量。其實我哋有唔同價位嘅選擇，可以根據您嘅預算去配。不如我先幫你做個比較表？',
        '了解。其實保障唔一定要一次過買齊，可以分階段配置。我哋可以由最基本的開始。'
      ],
      needTime: [
        '完全理解！其實我建議客人起碼睇三次才決定，呢行係長期承諾嘛。我可以提供更多資料俾你參考。',
        '沒問題，慢慢來。我可以把方案和相關資料都留给你，隨時回來問問題都可以。'
      ],
      askFamily: [
        '非常好嘅做法！保障係全家嘅事，同家人商量係應該嘅。我可以準備一份更易明嘅版本俾您同家人一齊睇。',
        '同意！夫妻共同決策會更好。如果你需要的話，我可以安排一次家庭會議，一起討論方案。'
      ],
      compareOthers: [
        '明白，多比較係精明消費者嘅做法！我可以幫你做一份公平嘅比較表，列清楚各家公司嘅優缺點。',
        '沒問題，歡迎比較。其實每間公司都有自己嘅強項，最重要係搵到最適合你需求嘅方案。'
      ]
    },
    closeDeal: [
      '太好了 {name}！咁我就開始處理投保手續。需要你準備：身份證、地址證明、銀行戶口資料。我可以上門或視像簽署 ✍️',
      '恭喜 {name}！🎉 你做了一個好嘅決定。下一步我會：\n1. 準備申請表格\n2. 安排簽署（可視像）\n3. 提交核保\n4. 大約 X 工作日出批單\n\n有任何問題隨時問我！'
    ]
  },

  // Meeting Flow 模板
  meetingFlows: {
    first: {
      phases: [
        { name: '破冰 (5 min)', content: '寒暄 → 了解客戶背景 → 建立信任' },
        { name: '需求探索 (15 min)', content: '現有保障 → 家庭結構 → 財務狀況 → 擔憂與目標' },
        { name: '缺口分析 (10 min)', content: '展示保障缺口 → 用具體例子說明風險 → 引導思考' },
        { name: '方案介紹 (15 min)', content: '推薦產品 → 解釋保證利益 → 回答疑問' },
        { name: '反對處理 (10 min)', content: '聆聽 → 認同理 → 解答 → 確認理解' },
        { name: '總結與下一步 (5 min)', content: '總結討論要點 → 約下次見面 / 發建議書 → Follow-up 安排' }
      ]
    },
    proposal: {
      phases: [
        { name: '回顧 (5 min)', content: '快速回顧上次討論要點 → 確認需求無變化' },
        { name: '方案詳解 (25 min)', content: '逐項解讀建議書 → 保費結構 → 保障範圍 → 不保事項' },
        { name: '比較分析 (10 min)', content: '與其他方案比較 → 強調獨特優勢 → 性價比分析' },
        { name: '答疑 (10 min)', content: '逐一回答疑問 → 展示數據支持' },
        { name: '促成 (10 min)', content: '試探購買意願 → 處理最後猶豫 → 確認下一步' }
      ]
    },
    followup: {
      phases: [
        { name: '溫習 (3 min)', content: '回顧之前討論內容 + 客戶最新情況' },
        { name: '解決疑慮 (12 min)', content: '專注處理客戶上次提出嘅疑慮 → 用案例說服' },
        { name: '加強信心 (10 min)', content: '展示成功案例 / 客戶見證 → 強調延遲成本' },
        { name: '促成 (5 min)', content: '引導成交 → 提供簡化方案（如減低保額）→ 確認' }
      ]
    },
    review: {
      phases: [
        { name: '年度回顧 (10 min)', content: '檢視現有保單 → 保障是否足夠 → 人生階段變化' },
        { name: '缺口更新 (10 min)', content: '新嘅風險 → 通脹影響 → 家庭變動（新生嬰/換樓）' },
        { name: '優化建議 (15 min)', content: '加保建議 → 退保/轉保分析 → 新產品機會' },
        { name: '行動 (5 min)', content: '確定調整方案 → 安排後續步驟' }
      ]
    }
  },

  // 反對處理話術
  objections: {
    '太貴了': {
      acknowledge: '明白，保費確實是一筆開支。',
      reframe: '但如果將它看作每日少杯咖啡錢，換來的是整個家庭的安心。而且越年輕買越平——現在的保費比五年後可能便宜 30%。',
      close: '要不我們先看一個基礎版本？月供只需 $XXX 起，之後可以再加。'
    },
    '我要同家人商量': {
      acknowledge: '非常好的做法，保障是全家人的事。',
      reframe: '我完全可以準備一份簡潔版資料給你和家人一起看。其實很多客人都會和家人商量，這是正常流程。',
      close: '我這週末可以準備好資料，您方便什麼時候和另一半一起聊？'
    },
    '我還年輕，不用急': {
      acknowledge: '年輕確实是資本，但也是最好的投保時機。',
      reframe: '年輕時保費最低、核保最容易。一旦身體出現小問題，可能就要加費甚至不保。現在每月 $XXX 就能鎖定終身保障。',
      close: '要不先看看只需要 $XXX/月的入門方案？之後隨時可以升級。'
    },
    '已有公司醫保': {
      acknowledge: '公司醫保很好，但它有限制。',
      reframe: '公司醫保通常：離職就失效、保障額度有限、不保家人。個人保障是隨身帶走的，不管換多少份工都在。',
      close: '我們可以先補足公司醫保不到的部分，每月可能只需要補 $XXX。'
    },
    '我想再比較一下': {
      acknowledge: '多比較是精明的做法。',
      reframe: '我可以幫你做一份公平的比較表，列出各家公司的優缺點。其實每家都有自己的強項——關鍵是找到最適合你需求的。',
      close: '我這两天准备好比较表发给你，然後我們再約时间讨论？'
    },
    '不需要，我很健康': {
      acknowledge: '很高兴听你这么说，健康是最大的财富。',
      reframe: '但保險正是给健康的人买的。一旦身體出了问题，想买也买不了了。就像雨傘——要在晴天准备。',
      close: '要不先了解一下？不需要现在决定，至少知道自己有哪些选择。'
    }
  },

  // Proposal 範例框架
  proposalSections: [
    { id: 'summary', title: '客戶背景摘要', icon: '👤', template: (c) =>
      `姓名：${c.name || '-'} | 年齡：${c.age || '-'} 歲 | 職業：${c.job || '-'}\n婚姻：${c.maritalLabel || '-'} | 子女：${c.kids || 0} 人\n月收入：${c.income ? '$' + Number(c.income).toLocaleString() : '-'}\n現有保障：${c.existingCoverage || '暫無'}\n特殊關注：${c.notes || '無'}`
    },
    { id: 'gap', title: '保障缺口分析', icon: '🔍', template: (c) =>
      `基於 ${c.name || '客戶'} 的情況，主要保障缺口如下：

**醫療保障** ${c.gaps?.medical ? '❌ 存在缺口' : '✅ 基本充足'}
${c.gaps?.medicalDetail || ''}

**危疾保障** ${c.gaps?.ci ? '❌ 存在缺口' : '✅ 基本充足'}
${c.gaps?.ciDetail || ''}

**人壽保障** ${c.gaps?.life ? '❌ 存在缺口' : '✅ 基本充足'}
${c.gaps?.lifeDetail || ''}

**意外保障** ${c.gaps?.accident ? '❌ 建議補充' : '✅ 基本充足'}`
    },
    { id: 'solution', title: '建議方案', icon: '💡', template: (c, products) =>
      `${products.map(p => `【${p.name}】\n${p.desc}\n`).join('\n')}

配置邏輯：${c.solutionLogic || '按客戶實際需求，分階段配置保障'}`
    },
    { id: 'nextSteps', title: '下一步行動', icon: '📌', template: () =>
      `1. 確認方案內容與保費預算\n2. 準備投保文件（身份證、地址證明）\n3. 安排簽署（可視像/上門）\n4. 提交核保（約 7-14 工作出批單）\n5. 保單生效 + Follow-up 排期`
    }
  ]
};

// ===== Cover Templates（小紅書 / FB / IG 社交封面範本庫）=====
// 設計根據 2026 小紅書爆款規律：大字≤15字、高飽和對比配色、
// 黃底紅字 / 藍底白字、情緒引導、真實感。
// 每款：背景漸變 + 頂部 badge + 標題字色/粗細 + 裝飾 + 底部品牌。
const COVER_TEMPLATES = [
  // —— 專業 ——
  { id:'pro-navy', name:'專業藏青', cat:'專業',
    bg:{from:'#0f2c4c',to:'#1e4d7b',dir:'d'},
    badge:{text:'專業分析',bg:'#4cc9f0',color:'#06243f'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#bcdcff', bulletColor:'#e8f3ff',
    footer:{text:'Jackson Hui',color:'#9ec5ef'}, decor:'circle', accent:'#4cc9f0' },
  { id:'photo-clean', name:'寫實大片', cat:'專業', layout:'photo',
    bg:{from:'#0b1f3a',to:'#1b3a5f',dir:'d'},
    badge:{text:'理財規劃',bg:'#f5c518',color:'#0b1f3a'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#eef3fb', bulletColor:'#f3f6fc',
    footer:{text:'Jackson Hui',color:'#cbd5e1'}, decor:'none', accent:'#f5c518' },
  { id:'pro-slate', name:'沉穩石板', cat:'專業',
    bg:{from:'#1f2937',to:'#374151',dir:'v'},
    badge:{text:'深度解讀',bg:'#93c5fd',color:'#11203a'},
    titleColor:'#f8fafc', titleWeight:800, subColor:'#cbd5e1', bulletColor:'#e2e8f0',
    footer:{text:'Jackson Hui',color:'#94a3b8'}, decor:'dots', accent:'#93c5fd' },
  { id:'pro-teal', name:'理性藍綠', cat:'專業',
    bg:{from:'#0b3d3a',to:'#157a6e',dir:'d'},
    badge:{text:'理財筆記',bg:'#5eead4',color:'#053f37'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#a7f3d0', bulletColor:'#d1fae5',
    footer:{text:'Jackson Hui',color:'#5eead4'}, decor:'wave', accent:'#5eead4' },

  // —— 溫馨 ——
  { id:'warm-pink', name:'溫柔粉', cat:'溫馨',
    bg:{from:'#ffe4ec',to:'#ffc2d1',dir:'v'},
    badge:{text:'貼地分享',bg:'#ff5d8f',color:'#ffffff'},
    titleColor:'#7a1f3d', titleWeight:900, subColor:'#b3305a', bulletColor:'#9d2147',
    footer:{text:'Jackson Hui',color:'#9d2147'}, decor:'dots', accent:'#ff5d8f' },
  { id:'warm-peach', name:'暖杏', cat:'溫馨',
    bg:{from:'#fff1e6',to:'#ffd9b3',dir:'d'},
    badge:{text:'生活感',bg:'#ff8c42',color:'#ffffff'},
    titleColor:'#7c3a12', titleWeight:800, subColor:'#b45309', bulletColor:'#92400e',
    footer:{text:'Jackson Hui',color:'#92400e'}, decor:'circle', accent:'#ff8c42' },
  { id:'warm-rose', name:'玫瑰金', cat:'溫馨',
    bg:{from:'#4a1c2e',to:'#7d2a44',dir:'v'},
    badge:{text:'女性理財',bg:'#ffb3c6',color:'#5a1430'},
    titleColor:'#ffe3ec', titleWeight:900, subColor:'#ffd0e0', bulletColor:'#ffe3ec',
    footer:{text:'Jackson Hui',color:'#ffb3c6'}, decor:'dots', accent:'#ffb3c6' },

  // —— 數據 ——
  { id:'data-green', name:'數據綠', cat:'數據',
    bg:{from:'#064e3b',to:'#047857',dir:'d'},
    badge:{text:'數據說話',bg:'#34d399',color:'#053b2c'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#a7f3d0', bulletColor:'#d1fae5',
    footer:{text:'Jackson Hui',color:'#6ee7b7'}, decor:'grid', accent:'#34d399' },
  { id:'data-lime', name:'清新青', cat:'數據',
    bg:{from:'#ecfdf5',to:'#d1fae5',dir:'v'},
    badge:{text:'圖表筆記',bg:'#10b981',color:'#ffffff'},
    titleColor:'#065f46', titleWeight:900, subColor:'#047857', bulletColor:'#065f46',
    footer:{text:'Jackson Hui',color:'#047857'}, decor:'dots', accent:'#10b981' },
  { id:'data-mint', name:'薄荷', cat:'數據',
    bg:{from:'#0f766e',to:'#14b8a6',dir:'d'},
    badge:{text:'實測對比',bg:'#99f6e4',color:'#0b4f49'},
    titleColor:'#ffffff', titleWeight:800, subColor:'#ccfbf1', bulletColor:'#f0fdfa',
    footer:{text:'Jackson Hui',color:'#99f6e4'}, decor:'wave', accent:'#99f6e4' },

  // —— 極簡 ——
  { id:'min-black', name:'極簡黑', cat:'極簡',
    bg:{from:'#111827',to:'#1f2937',dir:'v'},
    badge:{text:'觀點',bg:'#fbbf24',color:'#1a1303'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#9ca3af', bulletColor:'#e5e7eb',
    footer:{text:'Jackson Hui',color:'#9ca3af'}, decor:'none', accent:'#fbbf24' },
  { id:'min-white', name:'潔白', cat:'極簡',
    bg:{from:'#ffffff',to:'#f1f5f9',dir:'v'}, border:true,
    badge:{text:'精簡',bg:'#0ea5e9',color:'#ffffff'},
    titleColor:'#0f172a', titleWeight:900, subColor:'#475569', bulletColor:'#334155',
    footer:{text:'Jackson Hui',color:'#475569'}, decor:'none', accent:'#0ea5e9' },
  { id:'min-contrast', name:'黑白對比', cat:'極簡',
    bg:{from:'#0a0a0a',to:'#1a1a1a',dir:'v'},
    badge:{text:'硬道理',bg:'#facc15',color:'#1a1503'},
    titleColor:'#fefce8', titleWeight:900, subColor:'#d4d4d4', bulletColor:'#fefce8',
    footer:{text:'Jackson Hui',color:'#facc15'}, decor:'none', accent:'#facc15' },

  // —— 大字報（高飽和對比）——
  { id:'big-yellow', name:'黃底紅字', cat:'大字報',
    bg:{from:'#ffe600',to:'#ffd000',dir:'v'},
    badge:{text:'必看',bg:'#d10000',color:'#ffffff'},
    titleColor:'#d10000', titleWeight:900, subColor:'#7a0000', bulletColor:'#7a0000',
    footer:{text:'Jackson Hui',color:'#7a0000'}, decor:'none', accent:'#d10000' },
  { id:'big-red', name:'紅底白字', cat:'大字報',
    bg:{from:'#e11d48',to:'#be123c',dir:'d'},
    badge:{text:'警告',bg:'#ffffff',color:'#be123c'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#ffe4e6', bulletColor:'#fff1f2',
    footer:{text:'Jackson Hui',color:'#fecdd3'}, decor:'none', accent:'#ffffff' },
  { id:'big-orange', name:'橙底黑字', cat:'大字報',
    bg:{from:'#ff7a00',to:'#ff9e00',dir:'v'},
    badge:{text:'避坑',bg:'#1a1a1a',color:'#ff9e00'},
    titleColor:'#1a1a1a', titleWeight:900, subColor:'#5c2e00', bulletColor:'#5c2e00',
    footer:{text:'Jackson Hui',color:'#5c2e00'}, decor:'none', accent:'#1a1a1a' },

  // —— 漸變 ——
  { id:'grad-purple', name:'夢幻紫', cat:'漸變',
    bg:{from:'#4c1d95',to:'#7c3aed',dir:'d'},
    badge:{text:'靈感',bg:'#c4b5fd',color:'#3b1d73'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#ddd6fe', bulletColor:'#f5f3ff',
    footer:{text:'Jackson Hui',color:'#c4b5fd'}, decor:'dots', accent:'#c4b5fd' },
  { id:'grad-violet', name:'霓虹紫', cat:'漸變',
    bg:{from:'#6d28d9',to:'#a855f7',dir:'d'},
    badge:{text:'種草',bg:'#e9d5ff',color:'#5b21b6'},
    titleColor:'#f5f3ff', titleWeight:800, subColor:'#ede9fe', bulletColor:'#faf5ff',
    footer:{text:'Jackson Hui',color:'#e9d5ff'}, decor:'wave', accent:'#e9d5ff' },
  { id:'grad-indigo', name:'靛藍漸', cat:'漸變',
    bg:{from:'#1e1b4b',to:'#4338ca',dir:'d'},
    badge:{text:'策略',bg:'#a5b4fc',color:'#1e1b4b'},
    titleColor:'#e0e7ff', titleWeight:900, subColor:'#c7d2fe', bulletColor:'#e0e7ff',
    footer:{text:'Jackson Hui',color:'#a5b4fc'}, decor:'circle', accent:'#a5b4fc' },

  // —— 醫療 ——
  { id:'med-green', name:'醫療綠', cat:'醫療',
    bg:{from:'#0d9488',to:'#0f766e',dir:'d'},
    badge:{text:'健康保障',bg:'#ccfbf1',color:'#0b4f49'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#ccfbf1', bulletColor:'#f0fdfa',
    footer:{text:'Jackson Hui',color:'#99f6e4'}, decor:'cross', accent:'#ccfbf1' },
  { id:'med-blue', name:'醫護藍', cat:'醫療',
    bg:{from:'#0369a1',to:'#0284c7',dir:'d'},
    badge:{text:'VHIS',bg:'#e0f2fe',color:'#075985'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#e0f2fe', bulletColor:'#f0f9ff',
    footer:{text:'Jackson Hui',color:'#bae6fd'}, decor:'cross', accent:'#e0f2fe' },

  // —— 儲蓄 ——
  { id:'save-gold', name:'富貴金', cat:'儲蓄',
    bg:{from:'#7c5e10',to:'#b45309',dir:'d'},
    badge:{text:'儲蓄規劃',bg:'#fde68a',color:'#713f12'},
    titleColor:'#fffbeb', titleWeight:900, subColor:'#fef3c7', bulletColor:'#fffbeb',
    footer:{text:'Jackson Hui',color:'#fde68a'}, decor:'dots', accent:'#fde68a' },
  { id:'save-cream', name:'奶油金', cat:'儲蓄',
    bg:{from:'#fffbeb',to:'#fef3c7',dir:'v'},
    badge:{text:'退休',bg:'#b45309',color:'#ffffff'},
    titleColor:'#92400e', titleWeight:900, subColor:'#b45309', bulletColor:'#92400e',
    footer:{text:'Jackson Hui',color:'#b45309'}, decor:'none', accent:'#b45309' },

  // —— 招聘 ——
  { id:'recruit-orange', name:'招募橙', cat:'招聘',
    bg:{from:'#ea580c',to:'#c2410c',dir:'d'},
    badge:{text:'招募夥伴',bg:'#ffedd5',color:'#9a3412'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#ffedd5', bulletColor:'#fff7ed',
    footer:{text:'Jackson Hui',color:'#fed7aa'}, decor:'circle', accent:'#ffedd5' },
  { id:'recruit-navy', name:'事業藍', cat:'招聘',
    bg:{from:'#1e3a8a',to:'#1e40af',dir:'d'},
    badge:{text:'事業發展',bg:'#bfdbfe',color:'#1e3a8a'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#bfdbfe', bulletColor:'#eff6ff',
    footer:{text:'Jackson Hui',color:'#bfdbfe'}, decor:'dots', accent:'#bfdbfe' },

  // —— 高端 / 奢華 ——
  { id:'lux-black', name:'高端黑', cat:'高端',
    bg:{from:'#050505',to:'#1a1a1a',dir:'v'},
    badge:{text:'Premium',bg:'#d4af37',color:'#000000'},
    titleColor:'#f8f8f8', titleWeight:900, subColor:'#b0b0b0', bulletColor:'#d4d4d4',
    footer:{text:'Jackson Hui',color:'#d4af37'}, decor:'circle', accent:'#d4af37' },
  { id:'lux-crimson', name:'奢華紅', cat:'高端',
    bg:{from:'#300000',to:'#7f1d1d',dir:'d'},
    badge:{text:'高端規劃',bg:'#fecaca',color:'#7f1d1d'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#fecaca', bulletColor:'#fef2f2',
    footer:{text:'Jackson Hui',color:'#fecaca'}, decor:'dots', accent:'#fecaca' },
  { id:'lux-navy', name:'紳士藍', cat:'高端',
    bg:{from:'#0a0f1c',to:'#172554',dir:'d'},
    badge:{text:'VIP',bg:'#fde047',color:'#1a1503'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#bfdbfe', bulletColor:'#dbeafe',
    footer:{text:'Jackson Hui',color:'#fde047'}, decor:'circle', accent:'#fde047' },

  // —— 柔和 ——
  { id:'soft-cloud', name:'雲朵', cat:'柔和',
    bg:{from:'#f8fafc',to:'#e2e8f0',dir:'v'}, border:true,
    badge:{text:'輕鬆睇',bg:'#94a3b8',color:'#ffffff'},
    titleColor:'#334155', titleWeight:800, subColor:'#64748b', bulletColor:'#475569',
    footer:{text:'Jackson Hui',color:'#475569'}, decor:'none', accent:'#94a3b8' },
  { id:'soft-sage', name:'鼠尾草', cat:'柔和',
    bg:{from:'#f0fdf4',to:'#dcfce7',dir:'v'},
    badge:{text:'清新',bg:'#16a34a',color:'#ffffff'},
    titleColor:'#14532d', titleWeight:900, subColor:'#166534', bulletColor:'#15803d',
    footer:{text:'Jackson Hui',color:'#166534'}, decor:'none', accent:'#16a34a' },
  { id:'soft-lavender', name:'薰衣草', cat:'柔和',
    bg:{from:'#faf5ff',to:'#f3e8ff',dir:'v'},
    badge:{text:'溫柔',bg:'#a855f7',color:'#ffffff'},
    titleColor:'#581c87', titleWeight:900, subColor:'#7e22ce', bulletColor:'#6b21a8',
    footer:{text:'Jackson Hui',color:'#7e22ce'}, decor:'dots', accent:'#a855f7' },

  // —— 現代 / 玻璃 ——
  { id:'mod-royal', name:'皇家藍', cat:'專業',
    bg:{from:'#1e40af',to:'#312e81',dir:'d'},
    badge:{text:'專業',bg:'#ffffff',color:'#1e40af'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#c7d2fe', bulletColor:'#e0e7ff',
    footer:{text:'Jackson Hui',color:'#ffffff'}, decor:'circle', accent:'#ffffff' },
  { id:'mod-ink', name:'墨水黑', cat:'專業',
    bg:{from:'#020617',to:'#1e293b',dir:'d'},
    badge:{text:'深度',bg:'#38bdf8',color:'#020617'},
    titleColor:'#f8fafc', titleWeight:900, subColor:'#94a3b8', bulletColor:'#e2e8f0',
    footer:{text:'Jackson Hui',color:'#38bdf8'}, decor:'dots', accent:'#38bdf8' },
  { id:'mod-sky', name:'天空藍', cat:'專業',
    bg:{from:'#0ea5e9',to:'#0284c7',dir:'d'},
    badge:{text:'透明',bg:'#ffffff',color:'#0284c7'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#e0f2fe', bulletColor:'#f0f9ff',
    footer:{text:'Jackson Hui',color:'#ffffff'}, decor:'wave', accent:'#ffffff' },

  // —— 分割 / 幾何 ——
  { id:'split-rose', name:'玫瑰分割', cat:'溫馨',
    bg:{from:'#fff1f2',to:'#ffe4e6',dir:'v'}, border:true,
    badge:{text:'生活',bg:'#e11d48',color:'#ffffff'},
    titleColor:'#881337', titleWeight:900, subColor:'#be123c', bulletColor:'#9f1239',
    footer:{text:'Jackson Hui',color:'#9f1239'}, decor:'none', accent:'#e11d48' },
  { id:'split-forest', name:'森林分割', cat:'數據',
    bg:{from:'#ecfdf5',to:'#d1fae5',dir:'v'}, border:true,
    badge:{text:'實證',bg:'#059669',color:'#ffffff'},
    titleColor:'#064e3b', titleWeight:900, subColor:'#047857', bulletColor:'#065f46',
    footer:{text:'Jackson Hui',color:'#065f46'}, decor:'none', accent:'#059669' },

  // —— 大字報 2 ——
  { id:'big-pink', name:'粉紅大字', cat:'大字報',
    bg:{from:'#ec4899',to:'#be185d',dir:'d'},
    badge:{text:'必睇',bg:'#ffffff',color:'#be185d'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#fce7f3', bulletColor:'#fdf2f8',
    footer:{text:'Jackson Hui',color:'#ffffff'}, decor:'none', accent:'#ffffff' },
  { id:'big-teal', name:'藍綠大字', cat:'大字報',
    bg:{from:'#14b8a6',to:'#0f766e',dir:'d'},
    badge:{text:'關注',bg:'#ffffff',color:'#0f766e'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#ccfbf1', bulletColor:'#f0fdfa',
    footer:{text:'Jackson Hui',color:'#ffffff'}, decor:'none', accent:'#ffffff' },

  // —— 日落 / 海洋 ——
  { id:'grad-sunset', name:'日落', cat:'漸變',
    bg:{from:'#f97316',to:'#be123c',dir:'d'},
    badge:{text:'熱門',bg:'#fff7ed',color:'#c2410c'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#ffedd5', bulletColor:'#fff7ed',
    footer:{text:'Jackson Hui',color:'#fff7ed'}, decor:'circle', accent:'#fff7ed' },
  { id:'grad-ocean', name:'海洋', cat:'漸變',
    bg:{from:'#0c4a6e',to:'#0284c7',dir:'d'},
    badge:{text:'涼爽',bg:'#e0f2fe',color:'#075985'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#bae6fd', bulletColor:'#e0f2fe',
    footer:{text:'Jackson Hui',color:'#e0f2fe'}, decor:'wave', accent:'#e0f2fe' },

  // —— 醫療 2 ——
  { id:'med-rose', name:'玫瑰醫護', cat:'醫療',
    bg:{from:'#fff1f2',to:'#fecdd3',dir:'v'},
    badge:{text:'醫療',bg:'#e11d48',color:'#ffffff'},
    titleColor:'#881337', titleWeight:900, subColor:'#be123c', bulletColor:'#9f1239',
    footer:{text:'Jackson Hui',color:'#9f1239'}, decor:'cross', accent:'#e11d48' },
  { id:'med-slate', name:'石板醫護', cat:'醫療',
    bg:{from:'#475569',to:'#334155',dir:'d'},
    badge:{text:'健康',bg:'#e2e8f0',color:'#334155'},
    titleColor:'#f8fafc', titleWeight:900, subColor:'#cbd5e1', bulletColor:'#e2e8f0',
    footer:{text:'Jackson Hui',color:'#e2e8f0'}, decor:'cross', accent:'#e2e8f0' },

  // —— 儲蓄 2 ——
  { id:'save-lux', name:'奢華金', cat:'儲蓄',
    bg:{from:'#1c1917',to:'#292524',dir:'d'},
    badge:{text:'財富',bg:'#d4af37',color:'#000000'},
    titleColor:'#fafaf9', titleWeight:900, subColor:'#d6d3d1', bulletColor:'#e7e5e4',
    footer:{text:'Jackson Hui',color:'#d4af37'}, decor:'dots', accent:'#d4af37' },
  { id:'save-midnight', name:'午夜儲蓄', cat:'儲蓄',
    bg:{from:'#0f172a',to:'#1e293b',dir:'d'},
    badge:{text:'穩健',bg:'#38bdf8',color:'#0f172a'},
    titleColor:'#f8fafc', titleWeight:900, subColor:'#bae6fd', bulletColor:'#e0f2fe',
    footer:{text:'Jackson Hui',color:'#38bdf8'}, decor:'circle', accent:'#38bdf8' },

  // —— 招募 2 ——
  { id:'recruit-red', name:'熱血招募', cat:'招聘',
    bg:{from:'#dc2626',to:'#991b1b',dir:'d'},
    badge:{text:'Join Us',bg:'#ffffff',color:'#dc2626'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#fecaca', bulletColor:'#fef2f2',
    footer:{text:'Jackson Hui',color:'#ffffff'}, decor:'circle', accent:'#ffffff' },
  { id:'recruit-gold', name:'金色機會', cat:'招聘',
    bg:{from:'#78350f',to:'#92400e',dir:'d'},
    badge:{text:'誠邀',bg:'#fde68a',color:'#78350f'},
    titleColor:'#fffbeb', titleWeight:900, subColor:'#fde68a', bulletColor:'#fef3c7',
    footer:{text:'Jackson Hui',color:'#fde68a'}, decor:'dots', accent:'#fde68a' },

  // —— 故事 / 影片封面 ——
  { id:'story-amber', name:'故事琥珀', cat:'故事',
    bg:{from:'#f59e0b',to:'#b45309',dir:'d'},
    badge:{text:'影片',bg:'#ffffff',color:'#b45309'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#fef3c7', bulletColor:'#fffbeb',
    footer:{text:'Jackson Hui',color:'#ffffff'}, decor:'wave', accent:'#ffffff' },
  { id:'story-midnight', name:'故事午夜', cat:'故事',
    bg:{from:'#0f172a',to:'#312e81',dir:'d'},
    badge:{text:'Reels',bg:'#a5b4fc',color:'#1e1b4b'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#c7d2fe', bulletColor:'#e0e7ff',
    footer:{text:'Jackson Hui',color:'#a5b4fc'}, decor:'dots', accent:'#a5b4fc' },

  // ===== 卡通趣味（emoji 主角 + 對話氣泡，吸睛）=====
  { id:'toon-panda', name:'熊貓儲錢', cat:'卡通',
    bg:{from:'#059669',to:'#10b981',dir:'d'},
    badge:{text:'貼地理財',bg:'#ffffff',color:'#047857'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#d1fae5', bulletColor:'#ecfdf5',
    footer:{text:'Jackson Hui',color:'#ffffff'}, decor:'dots', accent:'#ffffff',
    mascot:'🐼', bubble:'儲錢唔難，由今日開始！' },
  { id:'toon-fox', name:'狐狸精明', cat:'卡通',
    bg:{from:'#ea580c',to:'#db2777',dir:'d'},
    badge:{text:'精明理財',bg:'#fff7ed',color:'#c2410c'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#ffe4e6', bulletColor:'#fff1f2',
    footer:{text:'Jackson Hui',color:'#ffe4e6'}, decor:'circle', accent:'#ffe4e6',
    mascot:'🦊', bubble:'精明女人咁樣理財！' },
  { id:'toon-robot', name:'機械人智能', cat:'卡通',
    bg:{from:'#1e3a8a',to:'#0ea5e9',dir:'d'},
    badge:{text:'AI 智能',bg:'#e0f2fe',color:'#1e3a8a'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#e0f2fe', bulletColor:'#f0f9ff',
    footer:{text:'Jackson Hui',color:'#e0f2fe'}, decor:'grid', accent:'#e0f2fe',
    mascot:'🤖', bubble:'AI 幫你計掂保障！' },
  { id:'toon-king', name:'國王保險', cat:'卡通',
    bg:{from:'#581c87',to:'#b45309',dir:'d'},
    badge:{text:'保險王',bg:'#fde68a',color:'#581c87'},
    titleColor:'#fffbeb', titleWeight:900, subColor:'#fde68a', bulletColor:'#fef9c3',
    footer:{text:'Jackson Hui',color:'#fde68a'}, decor:'dots', accent:'#fde68a',
    mascot:'👑', bubble:'我做咗自己嘅保險王！' },
  { id:'toon-pig', name:'豬仔錢罌', cat:'卡通',
    bg:{from:'#f472b6',to:'#fb7185',dir:'d'},
    badge:{text:'脫離月光',bg:'#fff1f2',color:'#be185d'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#ffe4e6', bulletColor:'#fff1f2',
    footer:{text:'Jackson Hui',color:'#ffe4e6'}, decor:'circle', accent:'#ffe4e6',
    mascot:'🐷', bubble:'月光族變有錢人！' },
  { id:'toon-rocket', name:'火箭增長', cat:'卡通',
    bg:{from:'#0c4a6e',to:'#0369a1',dir:'d'},
    badge:{text:'財富增長',bg:'#bae6fd',color:'#0c4a6e'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#bae6fd', bulletColor:'#e0f2fe',
    footer:{text:'Jackson Hui',color:'#bae6fd'}, decor:'wave', accent:'#bae6fd',
    mascot:'🚀', bubble:'財富起飛 🚀 唔係夢！' },
  { id:'toon-shield', name:'盾牌保障', cat:'卡通',
    bg:{from:'#0d9488',to:'#0e7490',dir:'d'},
    badge:{text:'全家保障',bg:'#ccfbf1',color:'#0d9488'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#ccfbf1', bulletColor:'#f0fdfa',
    footer:{text:'Jackson Hui',color:'#ccfbf1'}, decor:'cross', accent:'#ccfbf1',
    mascot:'🛡️', bubble:'呢個盾牌保你全家！' },
  { id:'toon-dog', name:'狗仔溫馨', cat:'卡通',
    bg:{from:'#d97706',to:'#fde68a',dir:'d'},
    badge:{text:'毛孩保障',bg:'#7c2d12',color:'#fde68a'},
    titleColor:'#7c2d12', titleWeight:900, subColor:'#92400e', bulletColor:'#78350f',
    footer:{text:'Jackson Hui',color:'#7c2d12'}, decor:'dots', accent:'#7c2d12',
    mascot:'🐶', bubble:'毛孩都要有保障！' },
  { id:'toon-cat', name:'貓咪可愛', cat:'卡通',
    bg:{from:'#be185d',to:'#f472b6',dir:'d'},
    badge:{text:'貓奴理財',bg:'#fff1f2',color:'#be185d'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#fce7f3', bulletColor:'#fbcfe8',
    footer:{text:'Jackson Hui',color:'#fce7f3'}, decor:'circle', accent:'#fce7f3',
    mascot:'🐱', bubble:'貓奴嘅理財法 🐾' },
  { id:'toon-bunny', name:'兔仔儲蓄', cat:'卡通',
    bg:{from:'#7c3aed',to:'#c4b5fd',dir:'d'},
    badge:{text:'復活節儲錢',bg:'#f5f3ff',color:'#6d28d9'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#ede9fe', bulletColor:'#f5f3ff',
    footer:{text:'Jackson Hui',color:'#ede9fe'}, decor:'dots', accent:'#ede9fe',
    mascot:'🐰', bubble:'復活節儲錢大計！' },
  { id:'toon-bear', name:'熊熊儲錢', cat:'卡通',
    bg:{from:'#78350f',to:'#b45309',dir:'d'},
    badge:{text:'儲錢術',bg:'#fde68a',color:'#78350f'},
    titleColor:'#fffbeb', titleWeight:900, subColor:'#fef3c7', bulletColor:'#fef9c3',
    footer:{text:'Jackson Hui',color:'#fde68a'}, decor:'circle', accent:'#fde68a',
    mascot:'🐻', bubble:'熊熊儲錢術 🍯' },
  { id:'toon-lion', name:'獅子招募', cat:'卡通',
    bg:{from:'#b45309',to:'#f59e0b',dir:'d'},
    badge:{text:'誠邀加盟',bg:'#422006',color:'#fde68a'},
    titleColor:'#422006', titleWeight:900, subColor:'#78350f', bulletColor:'#451a03',
    footer:{text:'Jackson Hui',color:'#422006'}, decor:'dots', accent:'#422006',
    mascot:'🦁', bubble:'獅子王招募夥伴！' },
  { id:'toon-frog', name:'蛙仔避坑', cat:'卡通',
    bg:{from:'#15803d',to:'#84cc16',dir:'d'},
    badge:{text:'避坑指南',bg:'#ffffff',color:'#166534'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#dcfce7', bulletColor:'#f7fee7',
    footer:{text:'Jackson Hui',color:'#dcfce7'}, decor:'wave', accent:'#dcfce7',
    mascot:'🐸', bubble:'蛙仔話你知避坑！' },
  { id:'toon-unicorn', name:'獨角獸夢想', cat:'卡通',
    bg:{from:'#a21caf',to:'#818cf8',dir:'d'},
    badge:{text:'理財夢想',bg:'#fdf4ff',color:'#a21caf'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#f5d0fe', bulletColor:'#fae8ff',
    footer:{text:'Jackson Hui',color:'#f5d0fe'}, decor:'dots', accent:'#f5d0fe',
    mascot:'🦄', bubble:'實現你嘅理財夢想！' },
  { id:'toon-clover', name:'四葉草好運', cat:'卡通',
    bg:{from:'#16a34a',to:'#65a30d',dir:'d'},
    badge:{text:'好運符',bg:'#f7fee7',color:'#15803d'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#ecfccb', bulletColor:'#f7fee7',
    footer:{text:'Jackson Hui',color:'#ecfccb'}, decor:'circle', accent:'#ecfccb',
    mascot:'🍀', bubble:'好運理財符 🍀' },
  { id:'toon-diamond', name:'鑽石高端', cat:'卡通',
    bg:{from:'#0f172a',to:'#334155',dir:'d'},
    badge:{text:'鑽石保障',bg:'#e2e8f0',color:'#0f172a'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#e2e8f0', bulletColor:'#f1f5f9',
    footer:{text:'Jackson Hui',color:'#e2e8f0'}, decor:'grid', accent:'#e2e8f0',
    mascot:'💎', bubble:'鑽石級保障 ✨' },
  { id:'toon-chart', name:'圖表向上', cat:'卡通',
    bg:{from:'#064e3b',to:'#0d9488',dir:'d'},
    badge:{text:'數據說話',bg:'#5eead4',color:'#064e3b'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#a7f3d0', bulletColor:'#d1fae5',
    footer:{text:'Jackson Hui',color:'#5eead4'}, decor:'wave', accent:'#5eead4',
    mascot:'📈', bubble:'數字會自己講嘢！' },
  { id:'toon-target', name:'目標達成', cat:'卡通',
    bg:{from:'#b91c1c',to:'#f97316',dir:'d'},
    badge:{text:'目標攻略',bg:'#fff7ed',color:'#b91c1c'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#ffedd5', bulletColor:'#fff7ed',
    footer:{text:'Jackson Hui',color:'#ffedd5'}, decor:'circle', accent:'#ffedd5',
    mascot:'🎯', bubble:'目標達成攻略！' },
  { id:'toon-bolt', name:'閃電比較', cat:'卡通',
    bg:{from:'#ca8a04',to:'#facc15',dir:'d'},
    badge:{text:'慳保費',bg:'#422006',color:'#fde68a'},
    titleColor:'#422006', titleWeight:900, subColor:'#78350f', bulletColor:'#451a03',
    footer:{text:'Jackson Hui',color:'#422006'}, decor:'wave', accent:'#422006',
    mascot:'⚡', bubble:'快速比較慳保費！' },
  { id:'toon-coin', name:'錢仔主角', cat:'卡通',
    bg:{from:'#92400e',to:'#fbbf24',dir:'d'},
    badge:{text:'錢生錢',bg:'#451a03',color:'#fde68a'},
    titleColor:'#451a03', titleWeight:900, subColor:'#78350f', bulletColor:'#451a03',
    footer:{text:'Jackson Hui',color:'#451a03'}, decor:'dots', accent:'#451a03',
    mascot:'💰', bubble:'錢生錢嘅秘密！' },

  // ===== 深色高端大字風（參考 Alfred / 財富帳號）=====
  { id:'lux-city', name:'城市夜景', cat:'高端',
    bg:{from:'#050505',to:'#1a1a2e',dir:'d'}, layout:'luxury',
    badge:{text:'財富密碼',bg:'#d4af37',color:'#000000'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#d4af37', bulletColor:'#e5e5e5',
    footer:{text:'Jackson Hui',color:'#d4af37'}, decor:'sparkle', accent:'#d4af37' },
  { id:'lux-gold', name:'黑金大字', cat:'高端',
    bg:{from:'#0a0a0a',to:'#262626',dir:'v'}, layout:'luxury',
    badge:{text:'破解',bg:'#ffffff',color:'#000000'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#d4af37', bulletColor:'#d4d4d4',
    footer:{text:'Jackson Hui',color:'#d4af37'}, decor:'sparkle', accent:'#d4af37' },
  { id:'lux-navy-gold', name:'深藍金', cat:'高端',
    bg:{from:'#020617',to:'#1e3a8a',dir:'d'}, layout:'luxury',
    badge:{text:'頂級規劃',bg:'#facc15',color:'#0f172a'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#facc15', bulletColor:'#e2e8f0',
    footer:{text:'Jackson Hui',color:'#facc15'}, decor:'sparkle', accent:'#facc15' },

  // ===== 資訊圖表步驟風（參考 hkwealthylife 九宮格）=====
  { id:'info-9steps', name:'九宮步驟', cat:'數據',
    bg:{from:'#fffbeb',to:'#fef3c7',dir:'v'}, layout:'infographic',
    badge:{text:'懶人包',bg:'#f59e0b',color:'#ffffff'},
    titleColor:'#92400e', titleWeight:900, subColor:'#b45309', bulletColor:'#78350f',
    footer:{text:'Jackson Hui',color:'#92400e'}, decor:'none', accent:'#f59e0b' },
  { id:'info-blue', name:'藍色步驟', cat:'數據',
    bg:{from:'#eff6ff',to:'#dbeafe',dir:'v'}, layout:'infographic',
    badge:{text:'3步搞掂',bg:'#2563eb',color:'#ffffff'},
    titleColor:'#1e40af', titleWeight:900, subColor:'#3b82f6', bulletColor:'#1d4ed8',
    footer:{text:'Jackson Hui',color:'#2563eb'}, decor:'none', accent:'#2563eb' },
  { id:'info-green', name:'綠色步驟', cat:'數據',
    bg:{from:'#f0fdf4',to:'#dcfce7',dir:'v'}, layout:'infographic',
    badge:{text:'攻略',bg:'#16a34a',color:'#ffffff'},
    titleColor:'#166534', titleWeight:900, subColor:'#15803d', bulletColor:'#14532d',
    footer:{text:'Jackson Hui',color:'#16a34a'}, decor:'none', accent:'#16a34a' },

  // ===== 對比表格風（參考 Expectation vs Reality）=====
  { id:'compare-red', name:'Expectation vs Reality', cat:'對比',
    bg:{from:'#0f172a',to:'#1e293b',dir:'d'}, layout:'compare',
    badge:{text:'殘酷真相',bg:'#ef4444',color:'#ffffff'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#94a3b8', bulletColor:'#e2e8f0',
    footer:{text:'Jackson Hui',color:'#94a3b8'}, decor:'none', accent:'#ef4444', compareLabels:['Expectation','Reality'] },
  { id:'compare-green', name:'前後對比', cat:'對比',
    bg:{from:'#ffffff',to:'#f8fafc',dir:'v'}, border:true, layout:'compare',
    badge:{text:'Before vs After',bg:'#10b981',color:'#ffffff'},
    titleColor:'#0f172a', titleWeight:900, subColor:'#475569', bulletColor:'#334155',
    footer:{text:'Jackson Hui',color:'#475569'}, decor:'none', accent:'#10b981', compareLabels:['Before','After'] },

  // ===== 漫畫爆炸框風（參考 ACT Perspective）=====
  { id:'comic-yellow', name:'黃色爆炸框', cat:'大字報',
    bg:{from:'#1e1b4b',to:'#312e81',dir:'d'}, layout:'comic',
    badge:{text:'震撼',bg:'#facc15',color:'#1e1b4b'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#c7d2fe', bulletColor:'#e0e7ff',
    footer:{text:'Jackson Hui',color:'#facc15'}, decor:'burst', accent:'#facc15' },
  { id:'comic-orange', name:'橙色爆炸框', cat:'大字報',
    bg:{from:'#000000',to:'#1a1a1a',dir:'v'}, layout:'comic',
    badge:{text:'重磅',bg:'#f97316',color:'#ffffff'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#fdba74', bulletColor:'#fed7aa',
    footer:{text:'Jackson Hui',color:'#f97316'}, decor:'burst', accent:'#f97316' },

  // ===== 可愛卡通風（參考 hk_wealth_mgt 柔和可愛）=====
  { id:'cute-cat', name:'可愛貓咪', cat:'卡通',
    bg:{from:'#ecfccb',to:'#d9f99d',dir:'d'}, layout:'cute',
    badge:{text:'輕鬆睇',bg:'#84cc16',color:'#ffffff'},
    titleColor:'#3f6212', titleWeight:900, subColor:'#4d7c0f', bulletColor:'#365314',
    footer:{text:'Jackson Hui',color:'#4d7c0f'}, decor:'circles', accent:'#84cc16', mascot:'🐱' },
  { id:'cute-bear', name:'可愛熊熊', cat:'卡通',
    bg:{from:'#fff1f2',to:'#ffe4e6',dir:'v'}, layout:'cute',
    badge:{text:'療癒',bg:'#fb7185',color:'#ffffff'},
    titleColor:'#881337', titleWeight:900, subColor:'#9f1239', bulletColor:'#881337',
    footer:{text:'Jackson Hui',color:'#9f1239'}, decor:'circles', accent:'#fb7185', mascot:'🐻' },
  { id:'cute-bunny', name:'可愛兔仔', cat:'卡通',
    bg:{from:'#faf5ff',to:'#f3e8ff',dir:'d'}, layout:'cute',
    badge:{text:'萌',bg:'#c084fc',color:'#ffffff'},
    titleColor:'#6b21a8', titleWeight:900, subColor:'#7e22ce', bulletColor:'#581c87',
    footer:{text:'Jackson Hui',color:'#7e22ce'}, decor:'circles', accent:'#c084fc', mascot:'🐰' },
  { id:'cute-pig', name:'可愛豬仔', cat:'卡通',
    bg:{from:'#fdf2f8',to:'#fce7f3',dir:'v'}, layout:'cute',
    badge:{text:'慳錢',bg:'#ec4899',color:'#ffffff'},
    titleColor:'#9d174d', titleWeight:900, subColor:'#be185d', bulletColor:'#9d174d',
    footer:{text:'Jackson Hui',color:'#be185d'}, decor:'circles', accent:'#ec4899', mascot:'🐷' },

  // ===== 真人／公仔頭像風（參考 Alfred：真人 + 大字）=====
  { id:'person-alfred', name:'Alfred 風真人', cat:'高端', layout:'person',
    bg:{from:'#050507',to:'#1a1a2e',dir:'d'},
    badge:{text:'財富密碼',bg:'#d4af37',color:'#000000'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#fde68a', bulletColor:'#e5e5e5',
    footer:{text:'Jackson Hui',color:'#d4af37'}, decor:'sparkle', accent:'#d4af37', avatar:true },
  { id:'person-clean', name:'型格真人', cat:'專業', layout:'person',
    bg:{from:'#0f172a',to:'#334155',dir:'d'},
    badge:{text:'理財教室',bg:'#38bdf8',color:'#0f172a'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#bae6fd', bulletColor:'#e2e8f0',
    footer:{text:'Jackson Hui',color:'#38bdf8'}, decor:'circle', accent:'#38bdf8', avatar:true },
  { id:'person-warm', name:'親和真人', cat:'溫馨', layout:'person',
    bg:{from:'#7c2d12',to:'#f59e0b',dir:'d'},
    badge:{text:'貼地分享',bg:'#fff7ed',color:'#7c2d12'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#fff7ed', bulletColor:'#fff7ed',
    footer:{text:'Jackson Hui',color:'#fff7ed'}, decor:'dots', accent:'#fff7ed', avatar:true },

  // ===== 更多黑金高端（參考 Alfred）=====
  { id:'lux-marble', name:'大理石金', cat:'高端', layout:'luxury',
    bg:{from:'#1c1917',to:'#44403c',dir:'d'},
    badge:{text:'Premium',bg:'#d4af37',color:'#000000'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#fde68a', bulletColor:'#e7e5e4',
    footer:{text:'Jackson Hui',color:'#d4af37'}, decor:'sparkle', accent:'#d4af37' },
  { id:'lux-emerald', name:'翡翠金', cat:'高端', layout:'luxury',
    bg:{from:'#022c22',to:'#065f46',dir:'d'},
    badge:{text:'頂級',bg:'#fde68a',color:'#022c22'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#fde68a', bulletColor:'#d1fae5',
    footer:{text:'Jackson Hui',color:'#fde68a'}, decor:'sparkle', accent:'#fde68a' },
  { id:'lux-noir', name:'黑金極簡', cat:'高端', layout:'luxury',
    bg:{from:'#000000',to:'#0a0a0a',dir:'v'},
    badge:{text:'EDITION',bg:'#ffffff',color:'#000000'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#d4af37', bulletColor:'#d4d4d4',
    footer:{text:'Jackson Hui',color:'#d4af37'}, decor:'sparkle', accent:'#d4af37' },

  // ===== 更多資訊圖表步驟風（參考 hkwealthylife 九宮格）=====
  { id:'info-wealth9', name:'財富九宮', cat:'數據', layout:'infographic',
    bg:{from:'#fff7ed',to:'#ffedd5',dir:'v'},
    badge:{text:'9 大價值',bg:'#f97316',color:'#ffffff'},
    titleColor:'#9a3412', titleWeight:900, subColor:'#c2410c', bulletColor:'#7c2d12',
    footer:{text:'Jackson Hui',color:'#9a3412'}, decor:'none', accent:'#f97316' },
  { id:'info-pink', name:'粉色步驟', cat:'數據', layout:'infographic',
    bg:{from:'#fdf2f8',to:'#fce7f3',dir:'v'},
    badge:{text:'3 步搞掂',bg:'#ec4899',color:'#ffffff'},
    titleColor:'#9d174d', titleWeight:900, subColor:'#be185d', bulletColor:'#9d174d',
    footer:{text:'Jackson Hui',color:'#be185d'}, decor:'none', accent:'#ec4899' },

  // ===== 更多漫畫爆炸框風（參考 ACT Perspective）=====
  { id:'comic-red', name:'紅色爆炸框', cat:'大字報', layout:'comic',
    bg:{from:'#7f1d1d',to:'#b91c1c',dir:'d'},
    badge:{text:'震撼',bg:'#fde047',color:'#7f1d1d'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#fecaca', bulletColor:'#fef2f2',
    footer:{text:'Jackson Hui',color:'#fde047'}, decor:'burst', accent:'#fde047' },
  { id:'comic-blue', name:'藍色爆炸框', cat:'大字報', layout:'comic',
    bg:{from:'#0c4a6e',to:'#0369a1',dir:'d'},
    badge:{text:'必睇',bg:'#7dd3fc',color:'#0c4a6e'},
    titleColor:'#ffffff', titleWeight:900, subColor:'#e0f2fe', bulletColor:'#f0f9ff',
    footer:{text:'Jackson Hui',color:'#7dd3fc'}, decor:'burst', accent:'#7dd3fc' },

  // ===== 更多可愛卡通風（參考 hk_wealth_mgt）=====
  { id:'cute-fox', name:'可愛狐狸', cat:'卡通', layout:'cute',
    bg:{from:'#fff7ed',to:'#ffedd5',dir:'d'},
    badge:{text:'俏皮',bg:'#fb923c',color:'#ffffff'},
    titleColor:'#9a3412', titleWeight:900, subColor:'#c2410c', bulletColor:'#7c2d12',
    footer:{text:'Jackson Hui',color:'#c2410c'}, decor:'circles', accent:'#fb923c', mascot:'🦊' },
  { id:'cute-panda', name:'可愛熊貓', cat:'卡通', layout:'cute',
    bg:{from:'#f0fdf4',to:'#dcfce7',dir:'v'},
    badge:{text:'萌',bg:'#22c55e',color:'#ffffff'},
    titleColor:'#14532d', titleWeight:900, subColor:'#15803d', bulletColor:'#14532d',
    footer:{text:'Jackson Hui',color:'#15803d'}, decor:'circles', accent:'#22c55e', mascot:'🐼' },
  { id:'cute-duck', name:'可愛鴨仔', cat:'卡通', layout:'cute',
    bg:{from:'#fefce8',to:'#fef08a',dir:'d'},
    badge:{text:'治癒',bg:'#eab308',color:'#ffffff'},
    titleColor:'#713f12', titleWeight:900, subColor:'#854d0e', bulletColor:'#713f12',
    footer:{text:'Jackson Hui',color:'#854d0e'}, decor:'circles', accent:'#eab308', mascot:'🦆' },
  { id:'cute-penguin', name:'可愛企鵝', cat:'卡通', layout:'cute',
    bg:{from:'#eff6ff',to:'#dbeafe',dir:'v'},
    badge:{text:'可愛',bg:'#3b82f6',color:'#ffffff'},
    titleColor:'#1e3a8a', titleWeight:900, subColor:'#1d4ed8', bulletColor:'#1e3a8a',
    footer:{text:'Jackson Hui',color:'#1d4ed8'}, decor:'circles', accent:'#3b82f6', mascot:'🐧' },

  // —— 每日市場焦點（金融快訊圖：標題＋3 新聞卡＋代理人簽名）——
  { id:'market-focus', name:'每日市場焦點', cat:'專業', layout:'market_focus', lux:false,
    bg:{from:'#f8fafc',to:'#e8eef6',dir:'v'},
    badge:{text:'每日市場焦點',bg:'#1e3a8a',color:'#ffffff'},
    titleColor:'#0f172a', titleWeight:900, subColor:'#475569', bulletColor:'#1e293b',
    footer:{text:'Jackson Hui',color:'#475569'}, decor:'none', accent:'#1e3a8a' },
  { id:'market-focus-lux', name:'市場焦點·華麗版', cat:'高端', layout:'market_focus', lux:true,
    bg:{from:'#0a0e27',to:'#1a1f4d',dir:'d'},
    badge:{text:'每日市場焦點',bg:'#d4af37',color:'#1a1f4d'},
    titleColor:'#f5d782', titleWeight:900, subColor:'#cbd5e1', bulletColor:'#f8fafc',
    footer:{text:'Jackson Hui',color:'#d4af37'}, decor:'none', accent:'#d4af37' }
];
