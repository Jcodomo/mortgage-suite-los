const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const dist=fs.readFileSync(path.join(root,'dist','mortgage-suite-los.html'),'utf8');
const js=fs.readFileSync(path.join(root,'src','release-53','patch-v53.js'),'utf8');
const css=fs.readFileSync(path.join(root,'src','release-53','patch-v53.css'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const landing=fs.readFileSync(path.join(root,'index.html'),'utf8');
const income=fs.readFileSync(path.join(root,'income-calculator.html'),'utf8');
const loan=fs.readFileSync(path.join(root,'loan-suite.html'),'utf8');

const pageMap=(js.match(/var PAGE_ICON = \{([\s\S]*?)\n\};/)||[])[1]||'';
const symbols=[...pageMap.matchAll(/:'(i-[a-z0-9-]+)'/g)].map(m=>m[1]);
const unique=[...new Set(symbols)];
const clearAt=js.indexOf("$$('.v23-nav-icon, svg.icon:not(.v53-ic), i.icon', t)");
const settledAt=js.indexOf("if (have && have.dataset.sym === want) return");

const checks=[
  ['Release metadata is 53.1',pkg.version==='53.1.0'&&/<meta name="los-release" content="53\.1">/.test(dist)&&/Mortgage Suite v53\.1/.test(dist)],
  ['All page icons map to a shipped sprite symbol',unique.length>=15&&unique.every(s=>dist.includes('id="'+s+'"'))],
  ['Cleanup runs before the settled-state return',clearAt>=0&&settledAt>clearAt],
  ['Foreign legacy tab icons are suppressed by CSS',/\.v53-tabs \.tab \.v23-nav-icon[\s\S]*?display:none !important/.test(css)&&/content:none !important/.test(css)],
  ['Release 50 tab pseudo-icons are disabled when the Release 53 SVG is present',/\.v53-tabs\.v48-context \.tab::before[\s\S]*?display:none !important[\s\S]*?mask:none !important/.test(css)],
  ['Current SVG icon is explicitly visible and uses the stroke sprite correctly',/svg\.icon\.v53-ic[\s\S]*?display:inline-block !important[\s\S]*?fill:none !important[\s\S]*?stroke:currentColor !important/.test(css)],
  ['Percentage controls round their visible value instead of exposing binary floating-point tails',/String\(Math\.round\(num\(v\)\*1000000\)\/10000\)/.test(dist)],
  ['Shared screen cleanup is redraw-safe',/function clear\(node\) \{[\s\S]*?node\.replaceChildren\(\)/.test(dist)],
  ['Group icon owner covers every retained primary group',/file:[\s\S]*?loan:[\s\S]*?costs:[\s\S]*?underwriting:[\s\S]*?results:[\s\S]*?full:[\s\S]*?documents:[\s\S]*?income:[\s\S]*?qualification:/.test(dist)],
  ['Release stamp is unique and at the final document boundary',(dist.match(/id="los-release-53-stamp"/g)||[]).length===1&&dist.indexOf('los-release-53-stamp')>dist.indexOf('<!-- ===== V53 END ===== -->')],
  ['Landing and direct workspace routes identify 53.1',/Release 53\.1/.test(landing)&&/release=53\.1/.test(income)&&/release=53\.1/.test(loan)],
  ['Page icon mapping covers both Loan Suite and Income Calculator tabs',['QUOTE','SETUP','PROPERTY','CREDIT','DOCUMENTS & OCR','W-2 & SALARY','SELF-EMPLOYMENT','SCHEDULE E','ASSETS'].every(label=>pageMap.includes("'"+label+"'"))]
  ,['Loan Suite page tabs retain the single Release 50 mask owner',js.includes("return $$('#calc-root .tabs, #calc-root .tabbar')")&&!js.includes("return $$('#suite-root .tabs")]
  ,['Loan Suite recovers from a stale Full-view class without touching a visible full worksheet',/function restoreWorkspace\(\)\{[\s\S]*?staleFull[\s\S]*?root\.classList\.remove\('v25-full-active','v251-full-active'\)[\s\S]*?if \(visible \|\| fullVisible\) return false;[\s\S]*?suite\.store\.setMode\('quote'\)/.test(dist)]
];

let failed=0;
for(const [name,ok] of checks){console.log((ok?'PASS  ':'FAIL  ')+name);if(!ok)failed++;}
assert.equal(failed,0);
console.log(`\nv53 icons: ${checks.length} passed, 0 failed`);
