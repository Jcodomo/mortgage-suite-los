/* =====================================================================
   Release 47 — the release-16 look as the default: classic blue, white
   and green; one flat row of pill tabs; the actions inline on the
   scenario row. Mortgage Rates as a page that actually replaces the
   worksheet, a rate popup from Loan tools and from the Quote rate
   field, and the calculator opening on W-2.
   Additive over 46. One source edit (v24 theme list) noted.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function N(v){ v = parseFloat(String(v==null?'':v).replace(/[$,%\s]/g,'')); return isFinite(v)?v:0; }
function norm(s){ return String(s||'').replace(/\s+/g,' ').trim(); }
function key(s){ return norm(s).toUpperCase(); }
function get(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
function set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function setClass(el,c,on){ if (el && el.classList.contains(c)!==!!on) el.classList.toggle(c,!!on); }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }
function store(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
var V47 = window.V47 = { version:'47.0' };

/* =================================================================== 1
   THE DEFAULT LOOK — classic, light, paper

   A fresh browser lands on the release-16 palette. A choice someone has
   already made is kept: only the never-set case is seeded.
   =================================================================== */
function seedLook(){
  if (V47.__seeded) return; V47.__seeded = true;
  var seeded = get('los.v47.seeded','');
  if (seeded) return;
  set('los.v47.seeded','1');
  if (!get('los.v24.theme','')){ set('los.v24.theme','classic'); document.documentElement.dataset.v24Theme = 'classic'; }
  if (!get('los.v25.surface','')){ set('los.v25.surface','light'); document.documentElement.dataset.v25Surface = 'light'; try { if (window.LOS && LOS.setSkin) LOS.setSkin('light'); } catch(e){} }
  if (!get('los.v24.inputTone','')){ set('los.v24.inputTone','paper'); document.documentElement.dataset.inputTone = 'paper'; }
  try { if (window.V24 && V24.setTheme && get('los.v24.theme','') === 'classic') V24.setTheme('classic', true); } catch(e){}
}

/* =================================================================== 2
   ONE FLAT ROW OF TABS, THE ACTIONS ON THE SCENARIO ROW

   Release 16 had a masthead, a scenario row with its buttons inline,
   and a single row of pill tabs. That simplicity is restored: the group
   nav is stowed (kept in the DOM, off screen), every tab in the row is
   shown, and the button cluster moves onto the scenario row after the
   scenario fields. Nothing is removed — the groups still exist and the
   All-pages directory still lists them.
   =================================================================== */
function flatTabs(){
  if (window.V48) return true;   /* release 48 restored the grouped structure */
  var row = document.querySelector('#suite-root .tabs'); if (!row) return false;
  setClass(row, 'v47-flat', true);
  $$('.tab', row).forEach(function(t){ if (t.dataset.v23Visible !== '1') t.dataset.v23Visible = '1'; setClass(t,'v27-hidden-tab',false); setClass(t,'v37-promoted-copy',false); });
  var nav = $('v23SuitePrimaryNav'); if (nav) setClass(nav, 'v47-stowed', true);
  /* order like release 16 */
  var ORDER = ['QUOTE','SETUP','PROPERTY','RENOVATION','MAX MORTGAGE','CLOSING','ESCROW','TAXES & PRORATION','QUALIFY','RENTAL','CREDIT','ADVANCED','CONTRACT & LE','SCENARIOS','SUMMARY','MORTGAGE RATES','DOCUMENTS & OCR'];
  var by = {}; $$('.tab', row).forEach(function(t){ by[key(t.textContent)] = t; });
  var sig = ORDER.filter(function(k){ return by[k]; }).join('|');
  if (row.__v47sig !== sig){ row.__v47sig = sig; ORDER.forEach(function(k){ var t = by[k]; if (t) row.appendChild(t); }); }
  return true;
}
function actionsInline(){
  var cluster = $('v42Row'), top = document.querySelector('#suite-root .topbar'); if (!cluster || !top) return false;
  var scen = top.querySelector('.v25-header-main') || top.querySelector('.v24-scenario-bar');
  var want = scen ? scen.nextSibling : null;
  if (cluster.parentNode !== top) top.insertBefore(cluster, want);
  setClass(cluster, 'v47-inline', true);
  var bar = $('v34Bar'); if (bar) setClass(bar, 'v47-readings', true);
  return true;
}

/* =================================================================== 3
   MORTGAGE RATES — a page that replaces the worksheet

   Release 8's V8.go hides the main column with an inline display:none;
   release 31's stylesheet forces it back to grid with !important, so
   the parked page rendered underneath the worksheet. A class on the
   root wins the cascade instead of an inline style, and comes off the
   moment the store moves to a normal page.
   =================================================================== */
function wrapGo(){
  if (!window.V8 || !V8.go || V8.go.__v47) return;
  var inner = V8.go;
  V8.go = function(id){
    var r = inner.apply(this, arguments);
    var root = $('suite-root'); if (root){ setClass(root,'v47-parked',true); root.dataset.v47Parked = id; }
    try { if (id === 'rates' && window.RATES) RATES.render(); } catch(e){}
    try { window.scrollTo(0,0); } catch(e){}
    return r;
  };
  V8.go.__v47 = true;
}
function unpark(){
  var root = $('suite-root'); if (!root || !root.classList.contains('v47-parked')) return;
  var s = store(); var stage = $('v8Stage');
  /* a normal tab is active in the row, or the stage is gone: unpark */
  var active = document.querySelector('#suite-root .tabs .tab.active');
  var stageActive = stage && stage.querySelector('.panel.active');
  if (!stage || !stageActive || (active && !active.dataset.v8 && !active.classList.contains('v43-tab') && s && s.snapshot && s.snapshot.mode && key(active.textContent) === key(s.snapshot.mode).replace('MAXMORTGAGE','MAX MORTGAGE'))){
    setClass(root,'v47-parked',false); var cm = root.querySelector('.cols-main'); if (cm) cm.style.display = '';
    if (stage) stage.style.display = 'none';
  }
}
/* the tab itself always routes through the wrapped V8.go */
function wireRatesTab(){
  var t = $$('#suite-root .tabs .tab').filter(function(x){ return key(x.textContent) === 'MORTGAGE RATES'; })[0];
  if (!t || t.__v47) return; t.__v47 = true;
  t.addEventListener('click', function(e){ e.stopImmediatePropagation(); e.preventDefault();
    var root = $('suite-root'); if (root) root.classList.remove('v25-full-active','v251-full-active');
    $$('#suite-root .tabs .tab').forEach(function(x){ x.classList.remove('active'); }); t.classList.add('active');
    if (window.V8 && V8.go) V8.go('rates');
  }, true);
}

/* =================================================================== 4
   THE RATE POPUP — from Loan tools, and from the Quote rate field
   =================================================================== */
function openPopup(anchor){ if (window.V29 && V29.openRate) V29.openRate(anchor || $('v28RateStat') || $('v47RateBtn')); else if (window.V8) V8.go('rates'); }
document.addEventListener('click', function(e){
  var card = e.target.closest('#v43Menu .v43-card[data-l*="Mortgage rates" i], #v43Menu .v43-card[data-l*="MORTGAGE RATES"]');
  if (!card) return;
  e.stopImmediatePropagation(); e.preventDefault();
  if (window.V43 && V43.close) V43.close();
  setTimeout(function(){ openPopup($('v42-tools')); }, 40);
}, true);
function quoteRateButton(){
  var inp = document.querySelector('#suite-root [data-v35-quote="interestRate"], #suite-root [data-v44-quote="interestRate"], #suite-root [data-path="interestRate"]');
  if (!inp) return false;
  var host = inp.parentNode; if (!host || host.querySelector('#v47RateBtn')) return true;
  var b = document.createElement('button'); b.type='button'; b.id='v47RateBtn'; b.className='v47-ratebtn no-print';
  b.innerHTML = '<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"/></svg><span>Rates</span>';
  b.title = 'Market rates — pick one, or open the Mortgage Rates page';
  b.onclick = function(e){ e.stopPropagation(); e.preventDefault(); openPopup(b); };
  host.classList.add('v47-ratehost'); host.appendChild(b);
  return true;
}
/* picking a rate in the popup fills the quote field too */
document.addEventListener('click', function(e){
  var pick = e.target.closest('.v29-pick'); if (!pick) return;
  setTimeout(function(){ var s = store(); var inp = document.querySelector('#suite-root [data-v35-quote="interestRate"], #suite-root [data-path="interestRate"]');
    if (inp && s){ var r = N(s.activeInputs.interestRate); if (r <= 1) r *= 100; var v = String(parseFloat(r.toFixed(6))); if (inp.value !== v){ inp.value = v; inp.dispatchEvent(new Event('input',{bubbles:true})); } } }, 80);
}, true);

/* =================================================================== 5
   THE CALCULATOR OPENS ON W-2
   =================================================================== */
function calcStart(){
  if (V47.__calc) return; V47.__calc = true;
  setTimeout(function(){ try { if (window.switchTab) switchTab('w2'); } catch(e){} }, 900);
}

/* =================================================================== 6
   SMALL TEXT FAULTS THE SCREENSHOTS SHOW
   =================================================================== */
function textFixes(){
  /* "Conventional HomeStyle HomeStyle" in the Quote footer strip */
  $$('#suite-root #screen-body .foot, #suite-root #screen-body .card-foot, #suite-root .v20-footline').forEach(function(f){
    var first = f.firstElementChild || f; var t = first.textContent || '';
    var fixed = t.replace(/\b(\w+)( \1\b)+/g,'$1');
    if (fixed !== t && first.childNodes.length === 1) first.textContent = fixed;
  });
  var sl = document.querySelector('#suite-root .rail .v5-scenline'); if (sl) sl.remove();
}

/* =================================================================== 7
   WIRING
   =================================================================== */
seedLook();
function tick(){
  try { flatTabs(); actionsInline(); } catch(e){}
  try { wrapGo(); wireRatesTab(); unpark(); } catch(e){}
  try { quoteRateButton(); } catch(e){}
  try { calcStart(); } catch(e){}
  try { textFixes(); } catch(e){}
}
if (window.LOS_SCHEDULER && LOS_SCHEDULER.add) LOS_SCHEDULER.add(tick, 1200); else setInterval(tick, 900);
setTimeout(tick, 200);
})();
