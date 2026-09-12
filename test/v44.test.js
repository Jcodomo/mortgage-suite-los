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
has(/\.v44-theme-chip\[data-theme\],\.v44-appearance-chip\[data-tone\],\.v44-appearance-chip\[data-surface\]/,js,'menu clicks only enter appearance mode from actual appearance chips');
has(/function positionMenu\(\)/,js,'header menus are positioned below the visible button row');
has(/rect\.bottom\+10/,js,'open menu cannot overlap the Loan Suite header buttons');
has(/data-direct="documents"/,js,'header Documents control opens Documents and OCR directly');
has(/panel\.scrollIntoView\(\{behavior:'smooth',block:'start'\}\)/,js,'Documents navigation scrolls its workspace into view');
has(/function bindSharedLook\(\)/,js,'shared Look control opens the organized Appearance panel');
has(/function bindUniqueTabRoutes\(\)/,js,'visible context tabs share the same unique page router as menus');
has(/V\.goPage\(label\)/,js,'context tab clicks route by their page label');
has(/PUNCH_FIELDS=\[/,js,'Quote and Setup share a complete freeform scenario punch-in surface');
has(/inputPercent\(value\)/,js,'percentage inputs use stable display rounding');
has(/Math\.round\(n\*1000000\)\/10000/,js,'FHA 3.5 percent is displayed without floating-point noise');
has(/V\.searchAddress=function/,js,'property address has an explicit OpenStreetMap search');
has(/nominatim\.openstreetmap\.org\/search/,js,'address search uses the documented Nominatim search endpoint');
has(/function paintLiveSummary\(\)/,js,'right-side live summary is rendered from current scenario outputs');
has(/<h4>Checks<\/h4>/,js,'ARV and warning status are grouped under Checks');
assert(!js.includes('(arvFit.ratio*100).toFixed'),'ARV status uses the percentage returned by the value-fit engine without multiplying twice');
has(/function enhanceRailEditor\(\)/,js,'live summary editor includes calculation formula context');
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
has(/\.v44-punch-grid/,css,'scenario punch-in fields have a responsive grid');
has(/\.v44-live-summary/,css,'live summary has the reference-style compact rail');
has(/Final layout polish/,css,'final layout polish layer tightens redundant chrome');
has(/#suite-root\.v44-final \.v23-context-tabs \.tab[\s\S]*height:27px !important/,css,'context tabs are compact but retained');
has(/Version 21-inspired final Loan Suite shell/,html,'built artifact contains the final Loan Suite layer');

console.log('v44 final merge checks passed');
