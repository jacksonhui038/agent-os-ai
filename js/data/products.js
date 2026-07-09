// ===== Products.js — 真實保險產品資料庫 =====
// 用途：Proposal 引擎多選產品、Agent OS AI 風格建議書
// 資料僅為展示用範本，實際條款/保費以保司最新資料為準

const PRODUCT_CATEGORIES = {
  retirement: '退休年金',
  medical: '高端醫療',
  ci: '危疾保障',
  life: '人壽保險',
  vhis: '自願醫保 VHIS',
  savings: '儲蓄計劃'
};

const PRODUCTS = {
  // ---------- 退休年金 ----------
  'hsbc-annuity': {
    id: 'hsbc-annuity', name: '邁豐裕年金計劃', insurer: 'HSBC 滙豐', category: 'retirement',
    tagline: '保證每月年金入息，退休唔使憂',
    highlights: ['保證年金期最長 20 年', '可選即時/延期提取', '身故退還累積本金', '潛在紅利加碼'],
    bestFor: '45 歲以上、有一次性資金想轉做穩定退休入息',
    monthlyFrom: 2000, taxDeductible: false,
    notes: '適合想要「保證現金流」多過「高回報」嘅保守型客戶。可對接 TVC 自願供款。'
  },
  'manulife-esa': {
    id: 'manulife-esa', name: '宏利歲稅佳年金', insurer: 'Manulife 宏利', category: 'retirement',
    tagline: '退休入息 + 稅務扣減雙重着數',
    highlights: ['保證年金期最長 20 年', '合資格可享稅務扣減', '活到老領到老選項', '靈活供款期'],
    bestFor: '中高收入、想慳稅同時儲退休金',
    monthlyFrom: 1500, taxDeductible: true,
    notes: '同 VHIS 一樣可以扣稅，配合「醫保＋年金」組合做稅務規劃好有說服力。'
  },

  // ---------- 高端醫療 ----------
  'fwd-vprime': {
    id: 'fwd-vprime', name: '醫療計劃 vPrime', insurer: 'FWD 富衛', category: 'medical',
    tagline: '全額賠償私院，全球保障無上限',
    highlights: ['私院全額賠償（最高 $40M）', '環球緊急醫療', '未知既有情況受保', '門診／產前可選附加'],
    bestFor: '追求高品質私院服務、有跨境就醫需要嘅家庭',
    monthlyFrom: 800, taxDeductible: false,
    notes: '適合原本買緊公司醫保、想升級到私院全額嘅客戶。可作公司醫保嘅補足。'
  },
  'manulife-global-med': {
    id: 'manulife-global-med', name: '全球醫療保險', insurer: 'Manulife 宏利', category: 'medical',
    tagline: '亞洲頂級私院網絡，攞藥唔使煩',
    highlights: ['亞洲私院直付網絡', '癌症治療全額', '24/7 環球支援', '中港跨境理賠'],
    bestFor: '經常往返中港、需要內地頂級醫療網絡',
    monthlyFrom: 600, taxDeductible: false,
    notes: '對內地客尤其吸引——內地三甲特需部／香港私院都 cover。'
  },

  // ---------- 危疾 ----------
  'manulife-ci-pro': {
    id: 'manulife-ci-pro', name: '活躍人生危疾保 PRO', insurer: 'Manulife 宏利', category: 'ci',
    tagline: '確診即賠，多重賠償打底',
    highlights: ['覆蓋 100+ 種嚴重疾病', '癌症／心臟／中風多重賠償', '早期危疾預支', '保證續保至 100 歲'],
    bestFor: '家庭經濟支柱、想鎖定最高保額',
    monthlyFrom: 800, taxDeductible: false,
    notes: '建議保額＝年薪 3-5 倍。可同人壽疊加做「收入替代」組合。'
  },
  'prudential-ci-plus': {
    id: 'prudential-ci-plus', name: '危疾加護保', insurer: 'Prudential 保誠', category: 'ci',
    tagline: '兒童先天性疾病都受保',
    highlights: ['先天性疾病受保', '兒童危疾保障', '多重癌症賠償', '保費固定唔加價'],
    bestFor: '有小朋友／準備生仔嘅家庭',
    monthlyFrom: 900, taxDeductible: false,
    notes: '「保小朋友先天疾病」係好強嘅切入點，見年輕家庭客好用。'
  },
  'aia-ci': {
    id: 'aia-ci', name: '加裕智倍保', insurer: 'AIA 友邦', category: 'ci',
    tagline: '危疾＋儲蓄一舖搞掂',
    highlights: ['危疾賠償 + 紅利增值', '多重賠償選項', '保費豁免', '靈活提取'],
    bestFor: '想保障同時有儲蓄元素嘅客戶',
    monthlyFrom: 1000, taxDeductible: false,
    notes: '對「怕繳咗保费無事發生蝕底」嘅客戶，儲蓄元素減低抗拒感。'
  },

  // ---------- 人壽 ----------
  'prudential-legacy': {
    id: 'prudential-legacy', name: '富裕承傳萬用壽險', insurer: 'Prudential 保誠', category: 'life',
    tagline: '資產傳承 + 靈活提取',
    highlights: ['身故賠償 + 現金價值', '靈活保費提取', '資產傳承工具', '保單逆按選項'],
    bestFor: '高資產客、想做財富傳承／遺產規劃',
    monthlyFrom: 1500, taxDeductible: false,
    notes: '適合做「稅務規劃 + 傳承」話題，見老闆／高淨值客好用。'
  },
  'manulife-life-premier': {
    id: 'manulife-life-premier', name: '宏利尊尚終身壽險', insurer: 'Manulife 宏利', category: 'life',
    tagline: '終身保障，紅利滾存',
    highlights: ['終身人壽保障', '保證 + 潛在紅利', '保單貸款靈活', '可作退休補充'],
    bestFor: '想兼顧保障同長線增值',
    monthlyFrom: 1200, taxDeductible: false,
    notes: '可包裝成「退休後提取紅利做補充收入」嘅雙重功能。'
  },

  // ---------- VHIS 自願醫保 ----------
  'manulife-vhis': {
    id: 'manulife-vhis', name: '自願醫保計劃', insurer: 'Manulife 宏利', category: 'vhis',
    tagline: '可扣稅！每年慳到 $8,000',
    highlights: ['稅務扣減最高 $8,000/年', '保證續保至 100 歲', '覆蓋未知既有情況', '標準/靈活計劃可揀'],
    bestFor: '所有納稅人士，特別係中產',
    monthlyFrom: 300, taxDeductible: true,
    notes: '最好嘅「第一張單」切入點——保費低、有稅務着數、易開口。'
  },
  'fwd-vhis': {
    id: 'fwd-vhis', name: '自願醫保靈活計劃', insurer: 'FWD 富衛', category: 'vhis',
    tagline: '扣稅 + 高靈活自選',
    highlights: ['稅務扣減最高 $8,000/年', '自選保障額', '門診手術受保', '網上索償快'],
    bestFor: '想扣稅又想彈性自訂',
    monthlyFrom: 280, taxDeductible: true,
    notes: '對年輕客可以用「每年慳返嘅稅差唔多 cover 咗保费」做賣點。'
  },

  // ---------- 儲蓄 ----------
  'manulife-save': {
    id: 'manulife-save', name: '宏利環宇儲蓄', insurer: 'Manulife 宏利', category: 'savings',
    tagline: '長線儲蓄 + 貨幣自由',
    highlights: ['保證現金價值 + 紅利', '多幣種（USD/HKD/RMB）', '教育金/退休金提取', '財富傳承'],
    bestFor: '長線儲蓄、子女教育、退休規劃',
    monthlyFrom: 500, taxDeductible: false,
    notes: '適合「想儲但怕自己儲唔到」嘅客戶，強制定期供款係賣點。'
  },
  'prudential-save': {
    id: 'prudential-save', name: '雋陞儲蓄計劃', insurer: 'Prudential 保誠', category: 'savings',
    tagline: '高潛在回報長線滾存',
    highlights: ['潛在紅利回報', '靈活提取', '多幣種選擇', '財富增值'],
    bestFor: '可接受波動、追求長線增值',
    monthlyFrom: 700, taxDeductible: false,
    notes: '對同時有投資意欲嘅客戶，比純儲蓄型吸引。'
  }
};

// 簡報風格（對應 Agent OS AI 嘅 Proposal Engine）
const PROPOSAL_STYLES = {
  advisor: {
    id: 'advisor', label: '專業顧問式',
    desc: '沉穩、權威、以專業建議為主導',
    tone: 'professional',
    accent: '#1e3a5f',
    coverSubtitle: '為您度身訂造的專業保障方案'
  },
  data: {
    id: 'data', label: '科技數據風',
    desc: '強調數據、比較、清晰圖表邏輯',
    tone: 'analytical',
    accent: '#0f766e',
    coverSubtitle: '以數據說話的方案分析'
  },
  warm: {
    id: 'warm', label: '明亮親和',
    desc: '溫馨、同理心、以家庭幸福為切入',
    tone: 'warm',
    accent: '#db2777',
    coverSubtitle: '守護您與家人未來的貼心方案'
  }
};

// 暴露到全域
window.PRODUCTS = PRODUCTS;
window.PRODUCT_CATEGORIES = PRODUCT_CATEGORIES;
window.PROPOSAL_STYLES = PROPOSAL_STYLES;
