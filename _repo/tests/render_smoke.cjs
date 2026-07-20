// 渲染冒煙測試：用 mock 2D context 真正執行 renderCover 各 layout，捕 runtime 錯
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function makeCtx() {
  const grad = { addColorStop() {} };
  return {
    fillStyle:'#000', strokeStyle:'#000', lineWidth:1, font:'', textAlign:'left',
    textBaseline:'top', globalAlpha:1, shadowColor:'', shadowBlur:0, shadowOffsetY:0, lineJoin:'',
    fillRect(){}, clearRect(){}, strokeRect(){},
    beginPath(){}, moveTo(){}, lineTo(){}, arc(){}, arcTo(){}, closePath(){}, rect(){},
    quadraticCurveTo(){}, bezierCurveTo(){}, ellipse(){}, translate(){}, rotate(){}, scale(){},
    fill(){}, stroke(){}, save(){}, restore(){}, clip(){}, setLineDash(){},
    drawImage(){}, fillText(){},
    measureText(t){ return { width: (t ? String(t).length : 0) * 12 }; },
    createLinearGradient(){ return grad; },
    createRadialGradient(){ return grad; }
  };
}

function makeEl(tag) {
  return {
    tagName: tag, style:{}, dataset:{}, classList:{ add(){}, remove(){}, contains(){return false;} },
    innerHTML:'', value:'', checked:false, files:[],
    width:220, height:275, className:'',
    appendChild(){}, addEventListener(){}, removeEventListener(){},
    scrollIntoView(){}, querySelectorAll(){ return []; },
    getContext(){ return makeCtx(); }
  };
}

const doc = {
  getElementById(){ return makeEl('div'); },
  querySelectorAll(){ return []; },
  createElement(tag){ return makeEl(tag); }
};

const sandbox = {
  console,
  document: doc,
  window: {},
  Image: function(){ this.onload=null; this.src=''; this.width=10; this.height=10; },
  sessionStorage: { getItem(){return null;}, setItem(){}, removeItem(){} },
  Storage: {
    getSetting(){ return ''; }, setSetting(){}, addHistory(){ return {id:'x'}; },
    getHistory(){ return []; }, getTeamPosts(){ return []; }, confirmPublished(){ return {id:'x'}; }
  },
  setTimeout, clearTimeout
};
sandbox.window = sandbox;
vm.createContext(sandbox);

const root = 'D:/work buddy/2026-07-09-20-49-28/_repo';
const tpl = fs.readFileSync(path.join(root,'js/data/templates.js'),'utf8');
const soc = fs.readFileSync(path.join(root,'js/modules/social.js'),'utf8');
vm.runInContext(tpl + '\n' + soc + '\nglobalThis.COVER_TEMPLATES = COVER_TEMPLATES;', sandbox, { filename:'bundle.js' });

const COVER = sandbox.COVER_TEMPLATES;
if (!COVER || !COVER.length) { console.error('❌ COVER_TEMPLATES 未載入'); process.exit(1); }

// 1) init → buildGallery 會 renderCover 全範本
try {
  sandbox.SocialModule.init();
  console.log('✅ init + buildGallery 全', COVER.length, '款範本 renderCover 無報錯');
} catch (e) {
  console.error('❌ init 報錯:', e.message); console.error(e.stack); process.exit(1);
}

// 2) 進階分支：有頭像 + 系列啟動
try {
  const cv = makeEl('canvas'); cv.getContext = () => makeCtx();
  const fakeImg = { width: 400, height: 500 };
  sandbox.SocialModule.__test.setAvatar(fakeImg);
  sandbox.SocialModule.__test.setSeries({ active: true, name: '每周危疾教室', ep: 3, templateId: 'person-alfred' });
  const cases = ['person-alfred','lux-city','comic-yellow','info-9steps','cute-cat','compare-red','pro-navy'];
  for (const id of cases) {
    const t = COVER.find(x => x.id === id);
    sandbox.SocialModule.__test.renderCover(cv, t, { title: '30歲必買危疾', tagline: '唔好等病咗先買', points: ['年輕保費平','核保易','覆蓋廣'] });
  }
  console.log('✅ 有頭像 + 系列啟動 分支 renderCover 無報錯');
} catch (e) {
  console.error('❌ 進階分支報錯:', e.message); console.error(e.stack); process.exit(1);
}

console.log('=== 渲染冒煙測試 OK ===');
