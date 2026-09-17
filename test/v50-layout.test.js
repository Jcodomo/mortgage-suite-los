const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'src','release-50','release-50.css'),'utf8');
const dist=fs.readFileSync(path.join(root,'dist','mortgage-suite-los.html'),'utf8');
const checks=[
  ['Loan Suite uses a wider 1520px centered canvas without changing the Income Calculator',/\.cols-main\{[\s\S]*?width:min\(1520px,calc\(100% - 40px\)\)[\s\S]*?max-width:1520px[\s\S]*?margin:0 auto/.test(css)],
  ['Live Summary remains a fixed right rail on desktop',/grid-template-columns:minmax\(0,1fr\) 300px/.test(css)],
  ['Narrow screens retain a responsive centered canvas',/@media \(max-width:640px\)[\s\S]*?\.cols-main\{ width:calc\(100% - 24px\)/.test(css)],
  ['Expanded Live Summary exposes borrower-funds rows',/Minimum investment[\s\S]*?Plus closing costs[\s\S]*?Less seller credit[\s\S]*?Less earnest money[\s\S]*?Remaining cash to close[\s\S]*?With the cushion/.test(dist)],
  ['Expanded Live Summary includes credit, ARV and state-rule status',/Representative score[\s\S]*?ARV test/.test(dist)&&/Attorney state/.test(dist)],
  ['Live Summary routes credit and rate rows to their workspaces',/credit:'CREDIT'[\s\S]*?rates:'MORTGAGE RATES'/.test(dist)],
  ['Freeform percentage displays suppress floating-point artifacts',/function paintFreeformValues\(\)[\s\S]*?Math\.round\(v\*1000\)\/1000[\s\S]*?setInterval\(function\(\)\{ if\(!document\.hidden\) paintFreeformValues\(\); \}, 250\)/.test(dist)],
  ['Loan Suite defaults current calculator income through the public importer',/function syncCalculatorIncome\(force\)[\s\S]*?s\.importIncomeText\(JSON\.stringify\(patch\),'Income Calculator default handoff'\)[\s\S]*?function installIncomeHandoff\(\)/.test(dist)],
  ['Loan Suite renderer idles while the Income Calculator is active',/function tick\(\)[\s\S]*?paintIncome\(\)[\s\S]*?SHELL\.mode==='calc'\) return;/.test(dist)],
  ['Duplicate Documents navigation is suppressed while the working direct launcher remains',/function dedupeDocumentsNavigation\(\)[\s\S]*?v28nav-documents[\s\S]*?v50-documents-duplicate/.test(dist)&&/button\[data-group="documents"\][\s\S]*?display:none !important/.test(css)],
  ['Release rendering pauses while a browser tab is hidden and resumes on return',/if\(document\.hidden\) return;[\s\S]*?visibilitychange[\s\S]*?if\(!document\.hidden\) soon\(\)/.test(dist)],
  ['Income Calculator keeps its controls but uses a quieter visual hierarchy',/#calc-root \.toolbar[\s\S]*?#calc-root nav\.tabbar[\s\S]*?#calc-root \.subtabs[\s\S]*?#calc-root \.card:not\(\.major\)/.test(css)],
  ['Income menu keeps its launcher inside the outside-click boundary',/#v50IncMenu, #shellbar \.lnk\.v50-inc/.test(dist)],
  ['Action menus and Loan Suite popovers close on a background click',/function installPopupDismissal\(\)[\s\S]*?pointerdown[\s\S]*?\.v23-action-menu\[open\][\s\S]*?V44\.closeMenu/.test(dist)],
  ['Loan Suite uses the quieter card, tab and status treatment',/#suite-root #v34Bar[\s\S]*?#suite-root #v50Top \.v50-card[\s\S]*?#suite-root #screen-body \.card\.lvl-major[\s\S]*?#suite-root #v44LiveSummary/.test(css)],
  ['Universal Prompt covers payroll, tax-return, self-employed, rental, K-1, benefit and other income documents',/var UNIVERSAL_PROMPT_TYPES[\s\S]*?paystub:[\s\S]*?w2:[\s\S]*?voe:[\s\S]*?tax1040:[\s\S]*?scheduleC:[\s\S]*?scheduleE:[\s\S]*?k1:[\s\S]*?business:[\s\S]*?income1099:[\s\S]*?benefits:[\s\S]*?support:/.test(dist)],
  ['Universal Prompt is available from calculator documents, suite documents and Contract & LE',/v50UniversalCalcHub[\s\S]*?v50UniversalLoanHub[\s\S]*?v50UniversalContract/.test(dist)],
  ['Universal Prompt extends the Documents and All Actions menus',/function installUniversalMenu\(\)[\s\S]*?kind==='docs'\|\|kind==='actions'[\s\S]*?data-v50-universal-menu/.test(dist)],
  ['Returned Universal Prompt JSON is placed into review without auto-application',/never auto-applied[\s\S]*?v9JsonBox[\s\S]*?JSON ready for review/.test(dist)],
  ['Universal Prompt has a responsive modal and compact AI launcher styling',/\.v50-universal-entry[\s\S]*?min-width:34px[\s\S]*?#calc-root \.v15-hub-head/.test(css)&&/\.v50-universal-modal[\s\S]*?\.v50-universal-dialog/.test(css)],
  ['Release 50 layer is present in the shipped file',/id="los-release-50"/.test(dist)]
];
let failed=0;for(const [name,ok] of checks){console.log((ok?'PASS  ':'FAIL  ')+name);if(!ok)failed++;}
assert.equal(failed,0);console.log(`\nv50 layout: ${checks.length} passed, 0 failed`);
