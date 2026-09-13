/* =====================================================================
   Release 48 — the group structure back, Full as the toggle that shows
   every page, the four Quote presets, the state tests and the ARV test
   on the live summary, and Loan tools routing to the rates page.
   Additive over 47.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function N(v){ v = parseFloat(String(v==null?'':v).replace(/[$,%\s]/g,'')); return isFinite(v)?v:0; }
function norm(s){ return String(s||'').replace(/\s+/g,' ').trim(); }
function key(s){ return norm(s).toUpperCase(); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function usd(v,dp){ dp=dp===undefined?0:dp; var n=N(v);
  return (n<0?'\u2212':'')+'$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp}); }
function pct(v,dp){ dp=dp===undefined?2:dp; var n=N(v); if (Math.abs(n)<=1) n*=100; return n.toFixed(dp)+'%'; }
function get(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
function set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function setClass(el,c,on){ if (el && el.classList.contains(c)!==!!on) el.classList.toggle(c,!!on); }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }
function store(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
var V48 = window.V48 = { version:'48.0' };

/* =================================================================== 1
   THE GROUP STRUCTURE, AND FULL AS THE TOGGLE

   Release 47 flattened the tabs into one row of seventeen. That was the
   wrong reading: the structure wanted is the grouped one —

     File · Loan · Costs · Underwriting · Results · Full · Documents

   with the rounded row underneath showing the pages of the group you
   are in. **Full** is the toggle that shows every rounded page at once;
   pressing it again returns to the group you were on.
   =================================================================== */
var GROUPS = {
  file:         ['QUOTE','SETUP','PROPERTY'],
  loan:         ['RENOVATION','MAX MORTGAGE','MORTGAGE RATES'],
  costs:        ['CLOSING','ESCROW','TAXES & PRORATION'],
  underwriting: ['QUALIFY','RENTAL','CREDIT','ADVANCED','CONTRACT & LE'],
  results:      ['SCENARIOS','SUMMARY'],
  documents:    ['DOCUMENTS & OCR','DOCUMENTS & WORKSHEETS','DRAFT LE']
};
var ALL = Object.keys(GROUPS).reduce(function(a,k){ return a.concat(GROUPS[k]); }, []);
V48.fullOpen = function(){ return get('los.v48.full','0') === '1'; };
V48.toggleFull = function(){ set('los.v48.full', V48.fullOpen() ? '0' : '1'); paintTabs(); };
function currentGroup(){ return get('los.v23.suiteGroup','file'); }
function restoreNav(){
  var nav = $('v23SuitePrimaryNav'); if (!nav) return false;
  setClass(nav, 'v47-stowed', false);
  setClass(nav, 'v48-nav', true);
  /* a Documents group button, if the nav has none */
  if (!nav.querySelector('[data-group="documents"]')){
    var model = nav.querySelector('[data-group="results"]') || nav.querySelector('button');
    if (model){
      var b = model.cloneNode(true); b.dataset.group = 'documents';
      var lab = b.querySelector('span:not(.v23-nav-icon)') || b;
      if (lab === b) b.textContent = 'Documents'; else lab.textContent = 'Documents';
      var ic = b.querySelector('.v23-nav-icon'); if (ic) ic.innerHTML = '<svg viewBox="0 0 16 16"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Z"/></svg>';
      b.onclick = function(){ set('los.v23.suiteGroup','documents'); set('los.v48.full','0'); paintTabs(); };
      var full = nav.querySelector('[data-group="full"]'); if (full) nav.insertBefore(b, full.nextSibling); else nav.appendChild(b);
    }
  }
  /* Full becomes the show-everything toggle */
  var fb = nav.querySelector('[data-group="full"]');
  if (fb && !fb.__v48){ fb.__v48 = true;
    fb.addEventListener('click', function(e){ e.stopImmediatePropagation(); e.preventDefault(); V48.toggleFull(); }, true); }
  /* every other group button just selects its group */
  $$('button[data-group]', nav).forEach(function(b){
    var g = b.dataset.group; if (g === 'full' || b.__v48sel) return; b.__v48sel = true;
    b.addEventListener('click', function(){ set('los.v48.full','0'); set('los.v23.suiteGroup', g); setTimeout(paintTabs, 20); }, true);
  });
  return true;
}
function paintTabs(){
  var row = document.querySelector('#suite-root .tabs'); if (!row) return false;
  setClass(row, 'v47-flat', false); setClass(row, 'v48-context', true);
  var full = V48.fullOpen(), g = currentGroup();
  var show = full ? ALL : (GROUPS[g] || GROUPS.file);
  $$('.tab', row).forEach(function(t){
    var k = key(t.textContent);
    var on = show.indexOf(k) >= 0;
    t.dataset.v23Visible = on ? '1' : '0';
    setClass(t, 'v48-hide', !on);
    setClass(t, 'v27-hidden-tab', false); setClass(t, 'v37-promoted-copy', false);
  });
  /* order within the row */
  var by = {}; $$('.tab', row).forEach(function(t){ by[key(t.textContent)] = t; });
  var sig = full + '|' + g + '|' + ALL.filter(function(k){ return by[k]; }).join(',');
  if (row.__v48sig !== sig){ row.__v48sig = sig; ALL.forEach(function(k){ if (by[k]) row.appendChild(by[k]); }); }
  var nav = $('v23SuitePrimaryNav');
  if (nav){ $$('button[data-group]', nav).forEach(function(b){ setClass(b, 'active', full ? b.dataset.group === 'full' : b.dataset.group === g); }); }
  return true;
}

/* =================================================================== 2
   THE THREE PAGES THAT NEED A TAB

   Documents & worksheets and Draft LE had no tab of their own; Taxes &
   proration had one but its handler opened a panel the parked-stage
   rules then hid. All three are synthetic tabs routed explicitly.
   =================================================================== */
var SYNTH = {
  'DOCUMENTS & WORKSHEETS': function(){
    if (window.V9 && V9.renderDocs){ var t = $$('#suite-root .tabs .tab').filter(function(x){ return key(x.textContent) === 'DOCUMENTS & OCR'; })[0]; if (t){ t.click(); try { V9.renderDocs(); } catch(e){} } }
    if (window.V30 && V30.gotoDocuments) V30.gotoDocuments();
  },
  'DRAFT LE': function(){
    var b = $$('#v23SuiteActions button, #v24LoanTools button, #v35Panel button, #v43Menu button').filter(function(x){ return /draft le/i.test(x.textContent||''); })[0];
    if (b) b.click(); else say('Draft LE is not loaded','The generator has not finished building.','warn',4000);
  },
  'TAXES & PRORATION': function(){
    var root = $('suite-root'); if (root) root.classList.remove('v25-full-active','v251-full-active');
    if (window.V39 && V39.goTaxes){ V39.goTaxes(); if (root) root.classList.add('v47-parked'); }
    try { if (window.TAXPRO) TAXPRO.render(); } catch(e){}
    try { window.scrollTo(0,0); } catch(e){}
  }
};
function synthTabs(){
  var row = document.querySelector('#suite-root .tabs'); if (!row) return false;
  Object.keys(SYNTH).forEach(function(label){
    var t = $$('.tab', row).filter(function(x){ return key(x.textContent) === label; })[0];
    if (!t){ t = document.createElement('button'); t.type='button'; t.className='tab v43-tab'; t.textContent = label; row.appendChild(t); }
    if (t.__v48) return; t.__v48 = true;
    t.addEventListener('click', function(e){ e.stopImmediatePropagation(); e.preventDefault();
      $$('.tab', row).forEach(function(x){ x.classList.remove('active'); }); t.classList.add('active');
      SYNTH[label](); }, true);
  });
  return true;
}

/* =================================================================== 3
   LOAN TOOLS → THE RATES PAGE

   Release 47 turned this into a popup. The page is what was asked for,
   so the menu entry goes to the page and the popup stays on the Quote
   rate field where it belongs.
   =================================================================== */
V48.goRates = function(){
  var root = $('suite-root'); if (root) root.classList.remove('v25-full-active','v251-full-active');
  var t = $$('#suite-root .tabs .tab').filter(function(x){ return key(x.textContent) === 'MORTGAGE RATES'; })[0];
  if (t) return t.click();
  if (window.V8 && V8.go) V8.go('rates');
};
document.addEventListener('click', function(e){
  var c = e.target.closest('#v43Menu .v43-card, .v42-item, .v39-item, .v35-item');
  if (!c || !/mortgage rates/i.test(c.textContent||'')) return;
  e.stopImmediatePropagation(); e.preventDefault();
  if (window.V43 && V43.close) V43.close();
  if (window.V42 && V42.close) V42.close();
  setTimeout(V48.goRates, 40);
}, true);

/* =================================================================== 4
   THE FOUR QUOTE PRESETS

   FHA 3.5% and 5% down existed; the two renovation presets did not,
   though the applier already understood them. Both set a $50,000 budget
   when the file has none, which turns renovation on and re-runs the
   draw count and its fees through release 45's tier rule.
   =================================================================== */
var PRESETS = [
  ['fha35','FHA 3.5%','No renovation'],
  ['conv5','5% down','No renovation'],
  ['fha203','FHA 203(k)','$50,000 renovation'],
  ['convhs','HomeStyle','$50,000 renovation']
];
V48.preset = function(id){
  var s = store(); if (!s) return;
  var i = s.activeInputs, reno = /fha203|convhs/.test(id);
  if (reno && !N(i.reno && i.reno.baseCost)){ try { s.setField('reno.baseCost', 50000, 'Quote preset'); } catch(e){} }
  if (window.V35 && V35.applyQuotePreset) V35.applyQuotePreset(id);
  if (reno){
    try { if (window.V30 && V30.setReno) V30.setReno(true, N(s.activeInputs.reno && s.activeInputs.reno.baseCost) || 50000, true); } catch(e){}
    /* let release 45's tier rule re-derive the draw count and fees */
    try { if (s.activeInputs.draws){ s.activeInputs.draws.v45Last = null; s.setField('draws.manualOverride', false, 'Preset \u2014 redo draws'); } } catch(e){}
    try { if (s.activeInputs.reno) s.setField('reno.syncDrawFees', true, 'Preset \u2014 redo fees'); } catch(e){}
  }
  if (window.RECALC) window.RECALC();
  try { s.emit(); } catch(e){}
  var p = PRESETS.filter(function(x){ return x[0] === id; })[0];
  say((p ? p[1] : 'Preset') + ' applied', reno ? 'Renovation on with a $50,000 budget; the draw count and its fees were re-derived.' : 'Renovation off and the budget cleared.', 'good', 6000);
};
function presetButtons(){
  var host = document.querySelector('#suite-root .v44-punch-actions'); if (!host) return false;
  if (host.__v48) return true; host.__v48 = true;
  $$('[data-v44-preset]', host).forEach(function(b){ b.remove(); });
  var frag = document.createDocumentFragment();
  PRESETS.forEach(function(p){
    var b = document.createElement('button'); b.type='button'; b.className='v48-preset'; b.dataset.v48Preset = p[0];
    b.innerHTML = '<b>' + esc(p[1]) + '</b><small>' + esc(p[2]) + '</small>';
    b.onclick = function(){ V48.preset(p[0]); };
    frag.appendChild(b);
  });
  host.insertBefore(frag, host.firstChild);
  return true;
}

/* =================================================================== 5
   STATE TESTS AND THE ARV TEST, ON THE LIVE SUMMARY

   The things that change how a file closes but are not calculations:
   who conducts the closing, whether the state is community property,
   and — on a renovation file — whether the value test passes with the
   margin it passes by.

   The lists are the settled ones. Attorney-state practice is the
   closing convention, not a statute in every case, so it is phrased as
   what to expect rather than as a rule.
   =================================================================== */
var ATTORNEY = ['Connecticut','Delaware','Georgia','Massachusetts','New York','North Carolina','South Carolina','Vermont','West Virginia'];
var ATTORNEY_SOFT = ['Alabama','Maine','Maryland','New Hampshire','New Jersey','Rhode Island','Virginia'];
var COMMUNITY = ['Arizona','California','Idaho','Louisiana','Nevada','New Mexico','Texas','Washington','Wisconsin'];
var ESCROW_WAIVER_LIMIT = { 'New Mexico':1, 'Utah':1, 'Oregon':1 };
V48.stateNotes = function(state, i, o){
  state = norm(state); var out = [];
  if (!state) return out;
  if (ATTORNEY.indexOf(state) >= 0) out.push({ k:'Attorney state', v:'Yes', note:state + ' closings are conducted by an attorney \u2014 budget the fee and the lead time in section B or C.' });
  else if (ATTORNEY_SOFT.indexOf(state) >= 0) out.push({ k:'Attorney involved', v:'Usually', note:'Attorney involvement is customary in ' + state + ' even where title handles the closing.' });
  if (COMMUNITY.indexOf(state) >= 0) out.push({ k:'Community property', v:'Yes', note:'A non-borrowing spouse\u2019s debts can count against the ratio on government loans, and both spouses usually sign the security instrument.' });
  if (state === 'New York') out.push({ k:'Mortgage recording tax', v:'Yes', note:'NY charges a mortgage recording tax on the loan amount \u2014 it is in section E and it moves with the loan, not the price.' });
  if (state === 'Florida') out.push({ k:'Doc stamps & intangible tax', v:'Yes', note:'Florida documentary stamps on the note and intangible tax on the mortgage are both in section E.' });
  if (ESCROW_WAIVER_LIMIT[state]) out.push({ k:'Escrow rules', v:'State-specific', note:state + ' limits how escrow may be held or waived \u2014 confirm before pricing a waiver.' });
  return out;
};
V48.arvTest = function(i, o){
  if (!i || !i.renovation) return null;
  var value = o.value || {}, loan = o.loan || {};
  var arv = N(value.afterRepairValue), base = N(loan.maximumBaseLoan || loan.totalLoan);
  if (!arv || !base) return { pass:null, text:'Enter an after-repair value to run the test.' };
  var fha = /fha/i.test(i.loanProgram||'');
  /* FHA 203(k) caps the value basis at 110% of ARV; HomeStyle caps the
     loan at 95% of the as-completed value. Two different tests. */
  if (fha){
    var basis = N(value.valueBasis), ceiling = arv * 1.10;
    return { pass: basis <= ceiling, ratio: basis/arv*100, limit:110,
      text: basis <= ceiling ? 'Value basis is ' + pct(basis/arv*100,2) + ' of ARV, inside the 110% ceiling by ' + usd(ceiling-basis)
                             : 'Value basis is ' + pct(basis/arv*100,2) + ' of ARV \u2014 over the 110% ceiling by ' + usd(basis-ceiling) };
  }
  var cap = arv * 0.95;
  return { pass: base <= cap, ratio: base/arv*100, limit:95,
    text: base <= cap ? 'Loan is ' + pct(base/arv*100,2) + ' of the as-completed value, inside the 95% cap by ' + usd(cap-base)
                      : 'Loan is ' + pct(base/arv*100,2) + ' of the as-completed value \u2014 over the 95% cap by ' + usd(base-cap) };
};
function railNotes(){
  var rail = document.querySelector('#suite-root .cols-main > .rail'); if (!rail) return false;
  var card = rail.querySelector(':scope > .card'), body = card && card.querySelector(':scope > .body'); if (!body) return false;
  var s = store(); if (!s) return true;
  var i = s.activeInputs || {}, o = s.outputs || {};
  var html = '';
  var arv = V48.arvTest(i, o);
  if (arv){
    html += '<div class="sec-head v40-sec">Value test</div>'
      + '<div class="v48-test ' + (arv.pass === true ? 'ok' : arv.pass === false ? 'bad' : 'wait') + '">'
      + (arv.pass === true ? '\u2713 ' : arv.pass === false ? '\u26A0 ' : '') + esc(arv.text) + '</div>';
  }
  var notes = V48.stateNotes(i.state, i, o);
  if (notes.length){
    html += '<div class="sec-head v40-sec">' + esc(norm(i.state)) + ' \u2014 what to expect</div>'
      + notes.map(function(n){ return '<div class="out v40-out v48-note"><div class="l">' + esc(n.k) + '<small>' + esc(n.note) + '</small></div><div class="v">' + esc(n.v) + '</div></div>'; }).join('');
  }
  var host = $('v48Notes');
  if (!html){ if (host) host.remove(); return true; }
  if (!host || !host.isConnected){ if (host) host.remove(); host = document.createElement('div'); host.id='v48Notes'; host.className='v40-rail v48-notes'; body.appendChild(host); }
  if (host.parentNode === body && body.lastElementChild !== host) body.appendChild(host);
  if (host.__sig !== html){ host.__sig = html; host.innerHTML = html; }
  return true;
}

function tick(){
  try { restoreNav(); paintTabs(); synthTabs(); } catch(e){}
  try { presetButtons(); } catch(e){}
  try { railNotes(); } catch(e){}
}
if (window.LOS_SCHEDULER && LOS_SCHEDULER.add) LOS_SCHEDULER.add(tick, 1200); else setInterval(tick, 900);
setTimeout(tick, 220);
})();
