const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(root,'src','patch-v44.js'),'utf8');
const css=fs.readFileSync(path.join(root,'src','patch-v44.css'),'utf8');
const build=fs.readFileSync(path.join(root,'build','inject.py'),'utf8');
const html=fs.readFileSync(path.join(root,'dist','mortgage-suite-los.html'),'utf8');

function has(pattern,text,message){assert(pattern.test(text),message);}

for(let version=38;version<=44;version++){
  has(new RegExp(`patch-v${version}\\.js`),build,`build includes v${version} JavaScript`);
  has(new RegExp(`patch-v${version}\\.css`),build,`build includes v${version} CSS`);
}

['File','View','Documents','Compare','Loan tools','Live','Actions'].forEach(label=>{
  has(new RegExp(`headerButton\\([^\\n]+,'${label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}'`),js,`header exposes ${label}`);
});

['QUOTE','SETUP','PROPERTY','RENOVATION','MAX MORTGAGE','MORTGAGE RATES','CLOSING','ESCROW','TAXES & PRORATION','QUALIFY','RENTAL','CREDIT','ADVANCED','CONTRACT & LE','SCENARIOS','SUMMARY','DOCUMENTS & OCR'].forEach(page=>{
  assert(js.includes(`'${page}'`),`retained route is reachable: ${page}`);
});

['ledger','slate','bank','graphite','terminal','github','github-dark','lightgray','cloudgrey','nord','dracula','solarized','linear'].forEach(theme=>assert(js.includes(`'${theme}'`),`appearance includes ${theme}`));
['light','dark','oled'].forEach(surface=>assert(js.includes(`'${surface}'`),`appearance includes ${surface} surface`));
['paper','mist','mint','sand','ink'].forEach(tone=>assert(js.includes(`'${tone}'`),`appearance includes ${tone} input tone`));

has(/input\[type="number"\],input\[type="date"\]/,js,'numeric and date inputs are upgraded to freeform text');
has(/function bindQuoteInputs\(\)/,js,'quick Quote inputs update the shared scenario store live');
has(/v44-moved-active #suiteMoved/,css,'focused post-v21 workspaces remain visible');
has(/option\.value='AUTO'/,js,'Income Calculator starts with Auto agency option');
has(/enforceEntryShell/,js,'direct Loan Suite and Income Calculator links win over saved shell state');
has(/#suite-root\.v44-final/,css,'release styling is scoped to the Loan Suite');
assert(!css.includes('#calc-root.v44-final'),'release styling does not rewrite the Income Calculator');
has(/#v28nav-documents\.v42-off/,css,'Documents remains a visible first-class destination');
has(/Final header refinement/,css,'Loan Suite header receives the Income Calculator full-width band treatment');
has(/#suite-root\.v44-final \.topbar\.v25-topbar,[\s\S]*max-width:none !important/,css,'Loan Suite masthead is full width instead of a floating card');
has(/#suite-root\.v44-final #v25HeaderMain[\s\S]*max-width:1560px !important/,css,'Loan Suite header content stays centered like the Income Calculator');
has(/grid-template-columns:repeat\(4,minmax\(150px,1fr\)\)/,css,'calculation tiles use a four-card desktop row');
has(/Version 21-inspired final Loan Suite shell/,html,'built artifact contains the final Loan Suite layer');

console.log('v44 final merge checks passed');
