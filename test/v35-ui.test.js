const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'src', 'patch-v35.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'patch-v35.css'), 'utf8');
const inject = fs.readFileSync(path.join(root, 'build', 'inject.py'), 'utf8');
const landing = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const checks = [
  ['Release 35 marker is monotonic', /current<35/.test(js) && /losRelease='35'/.test(js)],
  ['one Actions button owns the visible action surface', /id = 'v35Btn'/.test(js) && /v35-stowed/.test(css)],
  ['original controls stay wired in the DOM', /el\.click\(\)/.test(js) && /ITEMS\.map/.test(js)],
  ['action labels are canonically deduplicated', /actionKey/.test(js) && /PANDL/.test(js) && /RENOVATION FEES/.test(js)],
  ['Actions panel is portaled outside header clipping', /document\.body\.appendChild\(p\)/.test(js) && /position:fixed/.test(css)],
  ['Actions panel has accessible dialog semantics', /aria-haspopup/.test(js) && /role','dialog/.test(js) && /aria-controls/.test(js)],
  ['Live summary action focuses instead of closing', /focusSummary/.test(js) && /v35-summary-pulse/.test(css)],
  ['Live summary is a sticky frameless column', /grid-template-columns:minmax\(0,1fr\) minmax\(328px,376px\)/.test(css) && /position:sticky !important/.test(css) && /box-shadow:none !important/.test(css)],
  ['Live summary stacks safely on narrow layouts', /@media \(max-width:1180px\)/.test(css) && /grid-column:1 !important/.test(css)],
  ['ultrawide summary width is bounded', /@media \(min-width:2400px\)/.test(css) && /400px !important/.test(css)],
  ['Quote has four freeform quick fields', /v35QuoteControls/.test(js) && /basePurchasePrice/.test(js) && /zipCode/.test(js) && /finalDownPaymentPct/.test(js) && /bps\.loanAmountOverride/.test(js)],
  ['Quote owns four program presets plus renovation action', /QUOTE_PRESETS/.test(js) && /applyQuotePreset/.test(js) && /data-v35-preset/.test(js) && /#suite-root #v30Presets\{display:none/.test(css)],
  ['Max Mortgage and Escrow are nested subtabs', /v35-nested-source/.test(css) && /Max mortgage/.test(js) && /Taxes & escrow/.test(js)],
  ['Actions owns a compact previous-session picker', /v35SessionPick/.test(js) && /v35-sessionbar/.test(css)],
  ['Live summary includes rate, renovation, income need and ranges', /Interest rate/.test(js) && /Income needed - live planning/.test(js) && /Cash to close range/.test(js)],
  ['Advanced view includes borrower planning ranges', /v35BorrowerRange/.test(js) && /Borrower planning range/.test(js)],
  ['fresh Release 35 sessions default to light mode', /los\.v35\.appearanceSeeded/.test(js) && /setSurface\('light'\)/.test(js)],
  ['Documents is its own primary workspace after Full', /v35-documents-nav/.test(js) && /<span>Documents<\/span>/.test(js)],
  ['landing is a minimal two-route chooser with shared appearance', /class="routes"/.test(landing) && /id="modeToggle"/.test(landing) && /los\.v25\.surface/.test(landing) && /loan-suite\.html/.test(landing) && /income-calculator\.html/.test(landing)],
  ['Both workspaces share a centered 1320px working width', /#calc-root main \.wrap,#suite-root \.app,#suite-root \.cols-main\{width:100% !important;max-width:1320px/.test(css)],
  ['Documents uses the full canvas without Live Summary', /v35-documents-active/.test(js) && /v35-documents-active \.cols-main>\.rail\.v31-rail\{display:none/.test(css)],
  ['Page scrolling is owned by the browser instead of work columns', /#suite-root \.v31-main\{overflow:visible/.test(css) && /max-height:none !important;overflow:visible/.test(css)],
  ['right summary supports direct editing or source navigation', /openRailEditor/.test(js) && /data-v35-rail-apply/.test(js) && /data-v35-rail-go/.test(js) && /wireRail/.test(js)],
  ['light surfaces explicitly restyle menus and rate popovers', /data-v25-surface="light"\] \.v35-panel/.test(css) && /data-v25-surface="light"\] \.v29-pop/.test(css) && /data-v25-surface="light"\] \.v251-appearance-panel/.test(css)],
  ['live summary and linked subitems use interactive row styling', /\.v35-live-row::after/.test(css) && /\.v35-linked-subtabs button\.active/.test(css) && /v24-preset-chips/.test(css)],
  ['all Release 26 through 35 layers are injected', Array.from({length:10},(_,i)=>`patch-v${i+26}`).every(name=>inject.includes(name))],
  ['all prior release layers remain injected', Array.from({length:21},(_,i)=>`patch-v${i+5}`).every(name=>inject.includes(name))]
];

let failed = 0;
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS  ' : 'FAIL  '}${name}`);
  if (!pass) failed += 1;
}
assert.equal(failed, 0);
console.log(`\nv35 UI: ${checks.length} passed, 0 failed`);
