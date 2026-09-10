const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(root,'src','patch-v22.js'),'utf8');
const css=fs.readFileSync(path.join(root,'src','patch-v22.css'),'utf8');
const landing=fs.readFileSync(path.join(root,'index.html'),'utf8');
const loan=fs.readFileSync(path.join(root,'loan-suite.html'),'utf8');
const income=fs.readFileSync(path.join(root,'income-calculator.html'),'utf8');
const checks=[
  ['four scenario metric icons',/var ICONS=\[[\s\S]*?<svg[\s\S]*?<svg[\s\S]*?<svg[\s\S]*?<svg/.test(js)],
  ['stable render protects active fields',/editing\|\|next===last/.test(js)],
  ['shell controller is exposed for direct links',/window\.SHELL=SHELL/.test(js)],
  ['direct route selects requested workspace',/target=app==='income'\?'calc':'suite'/.test(js)&&/shell\.go\(target\)/.test(js)],
  ['direct route is guarded after initial navigation',/if\(V\.routeApplied\)return true/.test(js)&&/V\.routeApplied=true/.test(js)],
  ['release stamp',/losRelease='22'/.test(js)],
  ['metric cards use theme tokens',/var\(--panel\)/.test(css)&&/var\(--calc-bg\)/.test(css)&&/var\(--accent\)/.test(css)],
  ['metric cards remain responsive',/@media\(max-width:520px\)/.test(css)],
  ['landing identifies current release',/Release (?:22|23|24|25(?:\.1)?|35)/.test(landing)],
  ['landing links loan entry page',/loan-suite\.html/.test(landing)],
  ['landing links income entry page',/income-calculator\.html/.test(landing)],
  ['loan entry routes to quote',/app=suite(?:&|&amp;)tab=quote/.test(loan)],
  ['income entry routes to calculator',/app=income/.test(income)]
];
let failed=0;for(const [name,ok] of checks){console.log((ok?'PASS  ':'FAIL  ')+name);if(!ok)failed++;}assert.equal(failed,0);console.log(`\nv22 UI: ${checks.length} passed, 0 failed`);
