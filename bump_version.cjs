// bump_version.cjs — 一鍵搞掂 cache-busting + version.json
//
// 用法（在你個 deploy 工作區根目錄）：
//   node bump_version.cjs              // 用今日日期（YYYYMMDD）
//   node bump_version.cjs 20260826      // 指定版本
//   node bump_version.cjs --msg "..."   // 預填 commit message
//
// 做咗咩：
//   1. 將 index.html 入面所有 `?v=YYYYMMDD` 替換成新版本
//   2. 寫新 version.json（v + ts）
//   3. 印出 git commit hint

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const INDEX = path.join(ROOT, 'index.html');
const VERSION_JSON = path.join(ROOT, 'version.json');

const newVer = process.argv[2] && !process.argv[2].startsWith('--')
  ? process.argv[2]
  : (() => {
      const d = new Date();
      return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    })();

if (!/^\d{8}$/.test(newVer)) {
  console.error(`❌ 版本號格式錯：${newVer}（要 8 位數字 YYYYMMDD）`);
  process.exit(1);
}

const oldVerMatch = fs.readFileSync(INDEX, 'utf8').match(/[?&]v=(\d{8})/);
const oldVer = oldVerMatch ? oldVerMatch[1] : null;

if (oldVer === newVer) {
  console.log(`ℹ️  已經係 ${newVer}，唔需要 bump。`);
  process.exit(0);
}

// 1. update index.html
let html = fs.readFileSync(INDEX, 'utf8');
const before = (html.match(/[?&]v=\d{8}/g) || []).length;
html = html.replace(/([?&]v=)\d{8}/g, `$1${newVer}`);
fs.writeFileSync(INDEX, html);
console.log(`✅ index.html: ${before} 個 ?v= tag 全部 ${oldVer} → ${newVer}`);

// 2. update version.json
const vj = JSON.parse(fs.readFileSync(VERSION_JSON, 'utf8'));
vj.v = `v${newVer}`;
vj.ts = Date.now();
fs.writeFileSync(VERSION_JSON, JSON.stringify(vj, null, 2) + '\n');
console.log(`✅ version.json: v${newVer}  (ts=${vj.ts})`);

console.log(`\n下一步：`);
console.log(`  robocopy . _repo /MIR /XD .git _repo extracted /XF *.zip`);
console.log(`  cd _repo && git add -A && git -c user.name="Jackson Deploy" -c user.email="deploy@agent-os.ai" commit -m "release: v${newVer}"`);
console.log(`  git remote set-url origin https://<PAT>@github.com/jacksonhui038/agent-os-ai.git && git push origin main`);
console.log(`  git remote set-url origin https://github.com/jacksonhui038/agent-os-ai.git   # 剝走 PAT`);
