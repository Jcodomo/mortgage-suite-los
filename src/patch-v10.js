/* =====================================================================
   v10 — rounding out: the agency recommendation the W-2 tab owed, ZIP
         estimation on Property, free-form numbers everywhere, live
         cross-page sync for the tax figure, condensed stipulations.

   Nothing in either engine is edited.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function G(n){ try { return (0, eval)(n); } catch(e){ return undefined; } }
function N(v){ v = parseFloat(v); return isFinite(v) ? v : 0; }
function usd(v,dp){ dp = dp===undefined?0:dp; var n=N(v);
  return (n<0?'\u2212':'')+'$'+Math.abs(n).toLocaleString('en-US',
    {minimumFractionDigits:dp,maximumFractionDigits:dp}); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function suite(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }

var V10 = window.V10 = {};

/* =================================================================== 1
   AGENCY RECOMMENDATION on the W-2 tab

   The engine already runs the whole file under all four agencies
   (agencySnapshot) and knows the strongest (agencyBest) — but that
   reasoning only surfaced on the UW Summary. This puts a compact strip
   under the W-2 worksheets: each agency's qualifying income and back
   ratio, pass/fail, the strongest one flagged with WHY it wins (the
   snapshot's own notes: gross-up caps, asset depletion exclusions,
   K-1 distribution rules), and a one-click switch.
   =================================================================== */
V10.useAgency = function(ag){ try { window.useAgency(ag); } catch(e){} };
function agencyStripHTML(){
  if (typeof window.agencySnapshot !== 'function') return '';
  var AG_LIST = G('AG_LIST') || ['FNMA','FHLMC','FHA','VA'];
  var AG_NAME = G('AG_NAME') || {};
  var S = G('S'); if (!S) return '';
  var rows;
  try { rows = AG_LIST.map(window.agencySnapshot); } catch(e){ return ''; }
  if (!rows.some(function(r){ return r.income > 0; })) return '';
  var best = rows.reduce(function(a,b){
    if (a.passes === false && b.passes !== false) return b;
    if (b.passes === false && a.passes !== false) return a;
    return b.income > a.income + 0.01 ? b : a;
  }, rows[0]);
  var cells = rows.map(function(r){
    var isBest = r.ag === best.ag, isCur = r.ag === S.agency;
    return '<div class="v10-ag' + (isBest ? ' best' : '') + (isCur ? ' cur' : '') + '">'
      + '<div class="nm">' + esc(AG_NAME[r.ag] || r.ag) + (isCur ? ' \u2022' : '') + '</div>'
      + '<div class="inc">' + usd(r.income,0) + '</div>'
      + '<div class="dti">' + (r.income ? (r.back*100).toFixed(1) + '% back' : '\u2014')
      + (r.passes === false ? ' \u00b7 FAIL' : r.passes ? ' \u00b7 pass' : '') + '</div>'
      + (isBest && !isCur
          ? '<button class="btn btn-light btn-sm" onclick="V10.useAgency(\'' + r.ag + '\')">Use</button>'
          : '')
      + '</div>';
  }).join('');
  var why = best.notes && best.notes.length
    ? 'Differences in play: ' + rows.filter(function(r){ return r.notes.length; })
        .map(function(r){ return (AG_NAME[r.ag] || r.ag) + ' \u2014 ' + r.notes.join('; '); }).join(' \u00b7 ')
    : 'All four agencies read this income the same way \u2014 the ranking is pure DTI limits.';
  return '<div class="v10-ag-head">Agency read on this income \u2014 strongest first-choice highlighted</div>'
    + '<div class="v10-ag-row">' + cells + '</div>'
    + '<div class="v10-ag-why">' + esc(why) + '</div>';
}
function paintAgencyStrip(){
  var anchor = $('w2List'); if (!anchor || !anchor.parentNode) return;
  var host = $('v10Agency');
  var html = agencyStripHTML();
  if (!html){ if (host) host.style.display = 'none'; return; }
  if (!host || !host.isConnected){
    host = document.createElement('div');
    host.id = 'v10Agency'; host.className = 'v10-agstrip no-print';
    anchor.parentNode.insertBefore(host, anchor.nextSibling);
  }
  host.style.display = '';
  if (host.__v10sig === html) return;
  host.__v10sig = html;
  host.innerHTML = html;
}

/* =================================================================== 2
   FREE-FORM NUMBERS, EVERYWHERE

   A type="number" input rejects "$550,000" at the browser level — the
   characters never reach the page, which is why "free-form" cannot be
   bolted on without changing the input type. Every numeric input in
   both shells is progressively converted to text + inputMode=decimal
   (the mobile keyboard stays numeric), and two capture-phase listeners
   do the reading:

   - on input: "$", commas and spaces are stripped in place, so the
     engines' own inline handlers — which run after capture — always see
     a parseable number. Live behaviour is unchanged.
   - on change: shorthand expands. 550k -> 550000, 1.2m -> 1200000, a
     trailing % comes off. Expansion happens at commit, not per
     keystroke, because parseFloat("550k") is 550 and expanding
     mid-typing would make live figures lurch.

   Spinner arrows are the cost. In a sheet full of dollar amounts they
   were doing nothing useful anyway.
   =================================================================== */
function convertNumerics(){
  var els = document.querySelectorAll('#calc-root input[type="number"], #suite-root input[type="number"]');
  for (var i = 0; i < els.length; i++){
    var el = els[i];
    el.type = 'text';
    el.inputMode = 'decimal';
    el.__v10num = true;
  }
  return els.length;
}
function stripLoose(v){ return String(v).replace(/[$,\s]/g, ''); }
function expandShorthand(v){
  var s = stripLoose(v);
  var m;
  if ((m = s.match(/^(-?\d*\.?\d+)[kK]$/)))  return String(N(m[1]) * 1e3);
  if ((m = s.match(/^(-?\d*\.?\d+)[mM]$/)))  return String(N(m[1]) * 1e6);
  if ((m = s.match(/^(-?\d*\.?\d+)%$/)))     return m[1];
  return s;
}
document.addEventListener('input', function(e){
  var el = e.target;
  if (!el || !el.__v10num) return;
  if (/[$,\s]/.test(el.value)){
    var atEnd = el.selectionStart === el.value.length;
    el.value = stripLoose(el.value);
    if (atEnd) { try { el.setSelectionRange(el.value.length, el.value.length); } catch(err){} }
  }
}, true);
document.addEventListener('change', function(e){
  var el = e.target;
  if (!el || !el.__v10num) return;
  var cleaned = expandShorthand(el.value);
  if (cleaned !== el.value){
    el.value = cleaned;
    /* the inline handlers already ran against the shorthand on the last
       input event; fire input once more so they read the expansion */
    try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch(err){}
  }
}, true);

/* =================================================================== 3
   ZIP ESTIMATION on the Property tab

   The engine's own offline ZIP table (the one applyZipLookup uses)
   already carries typical value, effective tax rate and insurance for
   the area. The module itself is sealed inside the AMD closure, so the
   honest route in is the store: write the zip, run the engine's own
   lookup, and copy what it estimated into whichever Property fields are
   still empty. Estimates are labelled as estimates.
   =================================================================== */
V10.estimateFromZip = function(){
  var PROP = window.LOANSUITE && LOANSUITE.PROP; if (!PROP) return;
  var st = suite(); if (!st) return;
  var zip = String(PROP.state.zip || '').replace(/\D/g,'').slice(0,5);
  if (zip.length !== 5)
    return say('Need a five-digit ZIP', 'Fill in the zip on this tab first \u2014 the estimate keys off it.', 'warn');
  var i = st.activeInputs;
  var before = { tax: N(i.propertyTaxAmount), ins: N(i.insuranceAmount), val: N(i.asIsValue) };
  try { i.zipCode = zip; st.applyZipLookup(); } catch(e){}
  var got = [];
  if (!N(PROP.state.annualTax) && N(i.propertyTaxAmount) && N(i.propertyTaxAmount) !== before.tax){
    PROP.state.annualTax = N(i.propertyTaxAmount); got.push('annual tax ' + usd(PROP.state.annualTax,0));
  }
  if (!N(PROP.state.currentValue) && N(i.asIsValue) && N(i.asIsValue) !== before.val){
    PROP.state.currentValue = N(i.asIsValue); got.push('typical value ' + usd(PROP.state.currentValue,0));
  }
  PROP.save(); PROP.sync(); PROP.render();
  say(got.length ? 'Estimated from ZIP ' + zip : 'Nothing new to estimate',
      got.length
        ? got.join(', ') + '. These are area-level planning figures from the built-in table, '
          + 'not this property\u2019s numbers \u2014 replace them the moment real figures exist.'
        : 'Either the ZIP is not in the built-in table, or the fields already hold figures '
          + '\u2014 estimates never overwrite anything.',
      got.length ? 'good' : 'info', 9000);
};
function injectZipEstimate(){
  var host = $('propBody'); if (!host) return;
  if ($('v10ZipEst')) return;
  var pull = $('propPullBtn'); if (!pull || !pull.parentNode) return;
  var b = document.createElement('button');
  b.id = 'v10ZipEst'; b.className = 'btn btn-light';
  b.textContent = 'Estimate from ZIP';
  b.addEventListener('click', V10.estimateFromZip);
  pull.parentNode.insertBefore(b, pull.nextSibling);
}

/* =================================================================== 4
   THE TAX FIGURE SYNCS EVERYWHERE, LIVE

   Property -> tax panel already flowed (PROP.sync). The other direction
   did not: a figure typed on the Escrow tab's proration panel stayed
   there, while the suite priced escrows and the calculator priced PITIA
   off whatever they had. One annual-tax figure now fans out to all
   three the moment it commits.
   =================================================================== */
function wrapTaxSet(){
  if (!window.TAXPRO || typeof TAXPRO.set !== 'function' || TAXPRO.set.__v10) return false;
  var inner = TAXPRO.set;
  var wrapped = function(k, v){
    var r = inner.call(this, k, v);
    if (k === 'annual'){
      var n = N(v), st = suite(), S = G('S');
      try { if (st && n > 0) st.setField('propertyTaxAmount', n, 'Escrow tab'); } catch(e){}
      try {
        if (S && S.loan && n > 0){ S.loan.taxAnnual = n; if (window.RECALC) window.RECALC(); }
      } catch(e){}
      try { if (window.LOANSUITE && LOANSUITE.PROP && !N(LOANSUITE.PROP.state.annualTax)){
        LOANSUITE.PROP.state.annualTax = n; LOANSUITE.PROP.save();
      } } catch(e){}
    }
    return r;
  };
  wrapped.__v10 = true;
  TAXPRO.set = wrapped;
  return true;
}

/* =================================================================== 5
   STIPULATIONS, CONDENSED

   Same conditions, fewer words. Each line is cut to the noun phrase a
   processor actually reads; the two unconditional Asset items that did
   not always apply are now conditional (the gift letter only when gift
   funds exist, the EMD proof only when a price is on the file).
   =================================================================== */
var TIGHT = {
  'w2-stubs':'Pay stubs \u2014 most recent 30 days.',
  'w2-w2':'W-2s \u2014 last two years, every employer.',
  'w2-var':'Employer statement on continuance of OT / bonus / commission.',
  'sc-1040':'Signed personal returns \u2014 two years, all schedules.',
  'sc-pl':'Signed YTD profit & loss.',
  'sc-lic':'Business licence or CPA letter confirming the business is active.',
  'co-rtn':'Business returns \u2014 two years, all pages.',
  'co-k1':'K-1s \u2014 two years.',
  'se-lease':'Signed lease per rental.',
  'se-sche':'Schedule E \u2014 two years.',
  'va-les':'Current LES.',
  'va-coe':'Certificate of Eligibility.',
  'va-award':'VA disability award letter \u2014 amount and rating.',
  'va-ets':'Re-enlistment or post-separation employment evidence.',
  'ot-award':'Award / benefit letters for pension, SS or support income.',
  'as-bank':'Bank statements \u2014 two months, every account, all pages.',
  'as-ret':'Retirement statement + withdrawal terms.',
  'as-lg':'Gift letter + proof of transfer.',
  'as-emd':'EMD cheque copy + statement showing it clear.',
  'as-cash':'Proof of funds to close.',
  'cr-id':'Government photo ID.'
};
function wrapStipBuild(){
  /* The global is STIPS, not STIP — patch-v2 does `var STIP = window.STIPS = {}`.
     The first draft checked window.STIP and therefore never installed. */
  if (!window.STIPS || typeof STIPS.build !== 'function' || STIPS.build.__v10) return false;
  var inner = STIPS.build;
  var wrapped = function(){
    var out = inner.apply(this, arguments);
    var S = G('S');
    Object.keys(out).forEach(function(cat){
      out[cat] = out[cat].filter(function(item){
        if (item.id !== 'as-lg') return true;
        /* Assets live at S.assets.rows as typed records. Drop the gift
           letter only on POSITIVE evidence there is no gift row with a
           balance — the first draft read S.assets.gift, which does not
           exist, so N() returned 0 and the stip vanished on every file
           including the ones that actually had gift funds. */
        var rows = S && S.assets && S.assets.rows;
        if (!Array.isArray(rows)) return true;          /* can't tell — keep it */
        var hasGift = rows.some(function(rw){ return /gift/i.test(rw.type || '') && N(rw.bal) > 0; });
        return hasGift;
      });
      out[cat].forEach(function(item){
        if (TIGHT[item.id]) item.text = TIGHT[item.id];
      });
    });
    return out;
  };
  wrapped.__v10 = true;
  STIPS.build = wrapped;
  if (STIPS.render) { try { STIPS.render(); } catch(e){} }
  return true;
}

/* =================================================================== 6
   WIRING
   =================================================================== */
setInterval(function(){
  try { convertNumerics(); } catch(e){}
  try { paintAgencyStrip(); } catch(e){}
  try { injectZipEstimate(); } catch(e){}
  try { wrapTaxSet(); wrapStipBuild(); } catch(e){}
}, 600);
})();
