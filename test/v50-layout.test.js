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
  ['Freeform percentage displays suppress floating-point artifacts without a high-frequency repaint loop',/function paintFreeformValues\(\)[\s\S]*?Math\.round\(v\*1000\)\/1000[\s\S]*?setInterval\(function\(\)\{ if\(!document\.hidden\) paintFreeformValues\(\); \}, 600\)/.test(dist)],
  ['Loan Suite defaults current calculator income through the public importer',/function syncCalculatorIncome\(force\)[\s\S]*?s\.importIncomeText\(JSON\.stringify\(patch\),'Income Calculator default handoff'\)[\s\S]*?function installIncomeHandoff\(\)/.test(dist)],
  ['Loan Suite renderer idles while the Income Calculator is active',/function inCalculator\(\)[\s\S]*?SHELL\.mode==='calc'[\s\S]*?function decorate\(\)[\s\S]*?if\(inCalculator\(\)\) return;/.test(dist)],
  ['Live Summary paints on the next frame while noncritical decoration is throttled',/function paintLiveNow\(\)[\s\S]*?paintTop\(\)[\s\S]*?paintVerdict\(\)[\s\S]*?paintLiveExtras\(\)[\s\S]*?function refreshLive\(\)[\s\S]*?requestAnimationFrame/.test(dist)&&/DECORATE_EVERY\s*=\s*2200[\s\S]*?function scheduleDecor\(delay, force\)[\s\S]*?requestIdleCallback/.test(dist)],
  ['Income handoff is retained but no longer recalculates the workbook on every render pass',/INCOME_SYNC_EVERY = 3000[\s\S]*?Date\.now\(\)-lastIncomeSync>=INCOME_SYNC_EVERY[\s\S]*?syncCalculatorIncome\(false\)/.test(dist)],
  ['Duplicate Documents navigation is suppressed while the working direct launcher remains',/function dedupeDocumentsNavigation\(\)[\s\S]*?buttons\.length<2[\s\S]*?v28nav-documents[\s\S]*?style\.setProperty\('display','none','important'\)/.test(dist)&&/\.v50-documents-duplicate[\s\S]*?display:none !important/.test(css)],
  ['Release rendering pauses while a browser tab is hidden and resumes on return',/if\(document\.hidden\) return;[\s\S]*?visibilitychange[\s\S]*?if\(!document\.hidden\)\{ refreshLive\(\); scheduleDecor\(0,true\); \}/.test(dist)],
  ['A direct Loan Suite entry remains in Loan Suite through delayed calculator startup',/function calcStart\(\)[\s\S]*?URLSearchParams\(location\.search\)[\s\S]*?get\('app'\) === 'suite'[\s\S]*?return;[\s\S]*?switchTab\('w2'\)/.test(dist)&&/function pinSuiteEntry\(\)/.test(dist)],
  ['Loan Suite restores the requested workspace on refresh and keeps a compact browser resume marker',/id="los-release-50-bootstrap"[\s\S]*?los\.v50\.requestedWorkspace[\s\S]*?var RESUME_KEY='los\.v50\.resume', WORKSPACE_COOKIE='los\.v50\.workspace', REQUESTED_WORKSPACE_KEY='los\.v50\.requestedWorkspace'[\s\S]*?function requestedWorkspace\(\)[\s\S]*?function pinSuiteEntry\(\)[\s\S]*?preferredWorkspace\(\)/.test(dist)],
  ['Loan Suite form commits are deferred to change or blur while the Income Calculator remains live',/function liveUpgrade\(e\)[\s\S]*?closest\('#suite-root'\)\) return;/.test(dist)&&/function deferSuiteInputCommit\(\)[\s\S]*?el\.removeAttribute\('oninput'\)[\s\S]*?el\.addEventListener\('change'/.test(dist)&&/function bindQuoteInputs\(\)[\s\S]*?input\.addEventListener\('change',apply\)/.test(dist)],
  ['ZIP and mortgage-insurance worksheet commits wait for a completed Loan Suite field',/function wireZipAuto\(\)[\s\S]*?el\.addEventListener\('change'/.test(dist)&&/function enhancePmi\(\)[\s\S]*?el\.addEventListener\('change'/.test(dist)],
  ['The File group opens Setup by default, including after a late workspace mount',/function wireFileToSetup\(\)[\s\S]*?data-group="file"[\s\S]*?V50\.go\('SETUP'\)[\s\S]*?function installFileSetupDelegation\(\)[\s\S]*?document\.addEventListener\('click'[\s\S]*?\[420,1300,2600\]\.forEach\(function\(ms\)\{ setTimeout\(wireFileToSetup,ms\); \}\)/.test(dist)],
  ['The summary rail grows with the page instead of rendering its own scrollbar',/\.cols-main > \.rail\.v31-rail[\s\S]*?max-height:none !important; overflow:visible !important/.test(css)],
  ['Live Summary uses a compact accessible icon toggle',/#v44Header #v44Live\{[\s\S]*?width:28px[\s\S]*?height:28px/.test(css)&&/aria-label','Toggle live summary'/.test(dist)],
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
