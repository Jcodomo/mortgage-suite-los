/* =====================================================================
   v28 — header layout, working direct nav, one appearance cluster,
         a rate stat, and Print / Generate.
   Additive. Nothing in an earlier layer is edited.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function norm(s){ return String(s||'').replace(/\s+/g,' ').trim().toUpperCase(); }
function N(v){ v = parseFloat(String(v==null?'':v).replace(/[$,%\s]/g,'')); return isFinite(v)?v:0; }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }
function store(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
var V28 = window.V28 = { version:'28.0' };

/* =================================================================== 1
   DIRECT NAV — real handlers instead of clicking whatever tab exists

   This is the reported bug and it was mine. v27's buttons found the tab
   by label and clicked it. For Documents that tab is v8's hand-off,
   whose handler is LOS.go('c:docs') — it switches the whole shell to the
   Income Calculator. So "Documents" appeared to break the suite: it was
   working exactly as written and going somewhere nobody wanted.

   Rates had a quieter version of the same problem: clicking the tab
   parked the panel but never asked RATES to render, so the page could
   arrive empty until something else triggered a repaint.

   Each destination now has an explicit handler that opens the right
   surface AND renders it.
   =================================================================== */
function leaveFull(){
  var root = $('suite-root'); if (root) root.classList.remove('v25-full-active','v251-full-active');
  if (window.V25)  V25.fullActive = false;
  if (window.V251) V251.fullActive = false;
}
var DEST = {
  rates: {
    label:'Rates', title:'Mortgage rates — live board and spreads',
    go: function(){
      leaveFull();
      if (window.V8 && V8.go) V8.go('rates');
      try { if (window.RATES) RATES.render(); } catch(e){}
      V28.freshenRates();
    }
  },
  property: {
    label:'Property', title:'Subject property, value and rent',
    go: function(){
      leaveFull();
      if (window.V8 && V8.go) V8.go('property');
      try { if (window.LOANSUITE) LOANSUITE.PROP.render(); } catch(e){}
    }
  },
  documents: {
    label:'Documents', title:'Documents, OCR and worksheets — in the Loan Suite',
    go: function(){
      leaveFull();
      /* the SUITE's own documents panel (v9), not the calculator hand-off */
      if (window.V9 && V9.renderDocs){
        var btn = $$('#suite-root .tabs .tab').filter(function(t){
          return norm(t.textContent) === 'DOCUMENTS & OCR' && t.dataset.v8 === 'v9docs'; })[0];
        if (btn) { btn.click(); try { V9.renderDocs(); } catch(e){} return; }
      }
      if (window.V8 && V8.go) V8.go('documents');
      try { if (window.V9) V9.renderDocs(); } catch(e){}
    }
  },
  advanced: {
    label:'Advanced', title:'Rule tables and advanced settings',
    go: function(){
      leaveFull();
      if (window.V251 && V251.openSource) return V251.openSource('advanced');
      var s = store(); if (s) s.setMode('advanced');
    }
  }
};
/* Rates only auto-fetches when the board is stale — refetching on every
   visit would hammer the source and overwrite a rate someone just typed. */
V28.freshenRates = function(){
  try {
    if (!window.RATES || !RATES.state) return;
    var d = RATES.state.fetchedAt ? new Date(RATES.state.fetchedAt) : null;
    var stale = !d || (Date.now() - d.getTime()) > 6*3600*1000;
    if (stale && RATES.fetchLive) RATES.fetchLive();
  } catch(e){}
};
function installDirect(){
  var nav = $('v23SuitePrimaryNav'); if (!nav) return false;
  if (!nav.querySelector('[data-group="full"]')) return false;
  Object.keys(DEST).forEach(function(k){
    var id = 'v28nav-' + k, old = $('v27nav-' + k.toUpperCase().replace(/[^A-Z]/g,''));
    if (old) old.remove();                       /* retire v27's version */
    if ($(id)) return;
    var b = document.createElement('button');
    b.id = id; b.type = 'button'; b.className = 'v25-full-nav v28-direct';
    b.innerHTML = '<span>' + DEST[k].label + '</span>';
    b.title = DEST[k].title;
    b.onclick = DEST[k].go;
    nav.appendChild(b);
  });
  /* v27 hid the group-row copies; keep that, it is still right */
  return true;
}

/* =================================================================== 2
   HEADER ORDER — stats left, actions right

   Requested order in the action row, left to right: the stats, then
   Print / Generate, Live comparison, Full form, then the two menus, then
   Save. Menus sit furthest right because they are the least frequent.
   =================================================================== */
var ORDER = ['v251HeaderStats','v30PrintGen','v24LiveSummary','v25FullForm',
             'v23SuiteActions','v24LoanTools','v23QuickSave'];
function orderHeader(){
  var actions = $('v25HeaderActions'); if (!actions) return false;
  /* Only reorder when the order is actually wrong. The first version
     called appendChild on every node on every tick, which detaches and
     re-attaches each one 
     — that is what made the buttons flicker, drop
     hover state and occasionally close their own menu mid-click. */
  var present = ORDER.map(function(id){ return $(id); })
                     .filter(function(n){ return n && n.parentNode === actions; });
  var current = Array.prototype.filter.call(actions.children, function(n){
    return present.indexOf(n) >= 0; });
  var same = current.length === present.length
          && current.every(function(n,i){ return n === present[i]; });
  if (same) return true;
  present.forEach(function(n){ actions.appendChild(n); });
  return true;
}

/* =================================================================== 3
   LIVE SUMMARY ALWAYS ON THE RIGHT, and the button repurposed

   The rail is pinned open by v27 and forced to the right rail position
   by CSS below, so a button whose only job was to toggle it is dead
   weight in the busiest row. It becomes Live comparison, which is what
   people actually reach for and which was buried in a menu.
   =================================================================== */
function repurposeLive(){
  var b = $('v24LiveSummary'); if (!b || b.__v28) return false;
  b.__v28 = true;
  b.textContent = 'Live comparison';
  b.title = 'Compare scenarios side by side';
  b.classList.remove('v27-on');
  b.onclick = function(){
    if (window.V14 && V14.open) { try { V14.open('v14CompareModal'); return; } catch(e){} }
    var alt = $$('#v23SuiteActions button, #v24LoanTools button').filter(function(x){
      return /live comparison|^compare$/i.test((x.textContent||'').trim()); })[0];
    if (alt) alt.click();
    else say('Comparison is not available yet', 'The scenario tools have not finished loading.', 'warn', 5000);
  };
  return true;
}

/* =================================================================== 4
   RATE STAT, right of Cash to close and Back DTI

   Clicking it opens the rates board, which is the natural next step from
   "is this rate right?".
   =================================================================== */
function installRateStat(){
  var stats = $('v251HeaderStats'); if (!stats) return false;
  var b = $('v28RateStat');
  if (!b){
    b = document.createElement('button');
    b.id = 'v28RateStat'; b.type = 'button';
    b.className = 'v28-rate-stat';
    b.innerHTML = '<span>Rate</span><b>\u2014</b>';
    b.title = 'Note rate \u2014 opens the live rates board';
    b.onclick = DEST.rates.go;
    stats.appendChild(b);
  }
  var s = store();
  var v = null;
  try { v = s && s.activeInputs ? N(s.activeInputs.interestRate) : null; } catch(e){}
  if (v != null && v > 0){
    if (v <= 1) v *= 100;                       /* stored as a fraction */
    b.querySelector('b').textContent = v.toFixed(3).replace(/0+$/,'').replace(/\.$/,'') + '%';
  }
  return true;
}

/* =================================================================== 5
   PRINT / GENERATE — moved out

   This lived here in release 28. Release 30 replaced it with a nine-item
   version, and for one build BOTH were installed on their own polls:
   v30 removed #v28PrintGen and added its own, v28 put #v28PrintGen back,
   750ms later v30 removed it again. That loop is what made the button
   area flicker and refuse to stay clicked. The generator now lives only
   in v30 — see the GEN table there.
   =================================================================== */

/* =================================================================== 6
   APPEARANCE — one cluster, not two controls in two places
   =================================================================== */
function groupAppearance(){
  var app = $('v23Appearance'); if (!app || app.__v28) return false;
  app.__v28 = true;
  app.classList.add('v28-appearance');
  var sw = $('v27DayNight');
  if (sw && sw.parentNode !== app) app.insertBefore(sw, app.firstChild);
  var cycle = $('v25SurfaceButton');
  if (cycle) cycle.classList.add('v28-surface-cycle');
  return true;
}

/* =================================================================== 7
   WIRING
   =================================================================== */
setInterval(function(){
  try { installDirect(); } catch(e){}
  try { orderHeader(); } catch(e){}
  try { repurposeLive(); } catch(e){}
  try { installRateStat(); } catch(e){}
  try { groupAppearance(); } catch(e){}
}, 700);
})();
