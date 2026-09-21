/* =====================================================================
   Release 53 — icons on the page-tab row.

   The row beneath the group nav — QUOTE, SETUP, PROPERTY and the rest —
   has no icons. The engine builds those tabs as text-only buttons, and
   its own stylesheet carries `.tab .icon { display:none }`, which no
   later rule overrides: a following `.tab .icon { opacity:.6 }` sets
   opacity, and opacity cannot undo display:none. So any icon put in a
   tab has been invisible the whole time.

   Release 52 fixed the group row above this one. This does the row
   beneath, from the same sprite the rest of the file already ships —
   35 symbols, so nothing new is embedded — and turns the engine's rule
   off for these tabs only.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function key(s){ return String(s||'').replace(/\s+/g,' ').trim().toUpperCase(); }
function setClass(el,c,on){ if (el && el.classList.contains(c)!==!!on) el.classList.toggle(c,!!on); }
var V53 = window.V53 = { version:'53.1' };

/* Page → sprite symbol. Every symbol named here exists in the file's
   own sprite; the test asserts that, because a <use> pointing at a
   missing id renders nothing and would look exactly like this bug. */
var PAGE_ICON = {
  'QUOTE':'i-calc',            'SETUP':'i-sliders',        'PROPERTY':'i-home',
  'RENOVATION':'i-magic',      'MAX MORTGAGE':'i-trend',   'MORTGAGE RATES':'i-trend',
  'CLOSING':'i-receipt',       'CLOSING COSTS':'i-receipt','ESCROW':'i-pig',
  'TAXES & PRORATION':'i-cal', 'QUALIFY':'i-check',        'QUALIFICATION':'i-check',
  'RENTAL':'i-building',       'CREDIT':'i-shield',        'ADVANCED':'i-sliders',
  'CONTRACT & LE':'i-doc',     'SCENARIOS':'i-grid',       'SUMMARY':'i-sheet',
  'DOCUMENTS & OCR':'i-scan',  'DOCUMENTS':'i-doc',        'DOCUMENTS & WORKSHEETS':'i-sheet',
  'WORKSHEETS':'i-sheet',      'DRAFT LE':'i-print',       'ASSETS':'i-coins',
  'W-2 & SALARY':'i-briefcase','SELF-EMPLOYMENT':'i-user', 'SCHEDULE E':'i-building',
  'VA INCOME':'i-shield',      'OTHER INCOME':'i-pie',     'PITIA & DTI':'i-calc',
  'AUS FINDINGS':'i-check',    'UW SUMMARY & GUIDELINES':'i-book', 'FULL':'i-grid'
};
/* a page this layer has not seen still gets something, by word */
var BY_WORD = [
  [/rate|trend|mortgage/i,'i-trend'], [/tax|escrow|proration/i,'i-cal'],
  [/document|ocr|scan/i,'i-scan'],    [/worksheet|summary|sheet/i,'i-sheet'],
  [/credit|shield|va\b/i,'i-shield'], [/rent|property|building/i,'i-building'],
  [/cost|closing|receipt/i,'i-receipt'], [/income|salary|employ/i,'i-briefcase'],
  [/scenario|grid|all/i,'i-grid'],    [/qualif|check|aus/i,'i-check'],
  [/renovat|magic/i,'i-magic'],       [/advanced|setup|slider/i,'i-sliders']
];
V53.iconFor = function(label){
  var k = key(label);
  if (PAGE_ICON[k]) return PAGE_ICON[k];
  for (var i=0;i<BY_WORD.length;i++) if (BY_WORD[i][0].test(k)) return BY_WORD[i][1];
  return 'i-doc';
};
V53.symbols = function(){ return PAGE_ICON; };

function rows(){
  /* Loan Suite's Release 50 context bar already owns its icon mask.
     Decorating it a second time produces a second glyph after every
     label when old and new schedulers overlap.  Income Calculator tabs
     do not have that owner, so they remain the only Release 53 target. */
  return $$('#calc-root .tabs, #calc-root .tabbar')
    .filter(function(r){ return r && r.querySelector('.tab'); });
}
function paint(){
  var any = false;
  rows().forEach(function(row){
    setClass(row, 'v53-tabs', true); any = true;
    $$('.tab', row).forEach(function(t){
      var label = (t.textContent || '').trim();
      if (!label) return;
      var want = V53.iconFor(label);

      /* Clear foreign icons on EVERY pass, not only when the symbol
         changes. Release 36 rebuilds the Assets tab on its own timer and
         re-inserts a `.v23-nav-icon i-coins` span; release 23's art then
         draws it as a bordered box beside the new glyph — the square.
         Checking only on change let anything re-added afterwards stay. */
      $$('.v23-nav-icon, svg.icon:not(.v53-ic), i.icon', t).forEach(function(x){ x.remove(); });

      var have = t.querySelector('svg.icon.v53-ic');
      if (have && have.dataset.sym === want) return;       /* settled */
      if (have) have.remove();
      var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('class','icon v53-ic'); svg.dataset.sym = want;
      svg.setAttribute('aria-hidden','true');
      var use = document.createElementNS('http://www.w3.org/2000/svg','use');
      use.setAttributeNS('http://www.w3.org/1999/xlink','href','#'+want);
      use.setAttribute('href','#'+want);
      svg.appendChild(use);
      t.insertBefore(svg, t.firstChild);
    });
  });
  return any;
}
function tick(){ try { paint(); } catch(e){} }
if (window.LOS_SCHEDULER && LOS_SCHEDULER.add) LOS_SCHEDULER.add(tick, 1200); else setInterval(tick, 900);
setTimeout(tick, 200); tick();
})();

/* =====================================================================
   Release 53.1.1 — Loan Suite workspace recovery.

   The retained Full-form layers intentionally hide the normal screen while
   their continuous worksheet is open. A stale class left behind during a
   browser restore could leave that rule active after the worksheet itself
   had been removed, producing a correctly rendered shell with an empty
   workspace. Recover only from that impossible state; a visible Full
   worksheet is never touched.
   ===================================================================== */
(function(){
"use strict";
function suiteRequested(){
  try { return (new URLSearchParams(location.search)).get('app') === 'suite'; }
  catch(e) { return false; }
}
function restoreWorkspace(){
  if (!suiteRequested()) return false;
  var root = document.getElementById('suite-root');
  var body = document.getElementById('screen-body');
  if (!root || !body) return false;
  var full = document.getElementById('v25FullSheet');
  var staleFull = root.classList.contains('v25-full-active') || root.classList.contains('v251-full-active');
  var fullVisible = !!(full && full.offsetParent !== null);
  if (staleFull && !fullVisible) {
    root.classList.remove('v25-full-active','v251-full-active');
    if (window.V25) V25.fullActive = false;
    if (window.V251) V251.fullActive = false;
  }
  var visible = Array.prototype.some.call(body.children, function(node){
    return node.id !== 'v12Modal' && node.offsetParent !== null;
  });
  if (visible || fullVisible) return false;
  var suite = window.mortgageSuite;
  if (!suite || !suite.store) return false;
  try {
    suite.store.setMode('quote');
    if (suite.app && suite.app.renderScreen) suite.app.renderScreen();
    root.dataset.v531WorkspaceRecovered = '1';
    return true;
  } catch(e) { return false; }
}
/* Let the base suite and retained add-on layers mount first. The duplicate
   timeout covers delayed browser-session restoration without a repaint loop. */
setTimeout(restoreWorkspace, 700);
setTimeout(restoreWorkspace, 1800);
window.V53 = window.V53 || {};
window.V53.restoreWorkspace = restoreWorkspace;
})();
