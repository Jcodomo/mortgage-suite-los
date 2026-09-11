/* =====================================================================
   Release 42 — the header cluster rebuilt from scratch with names no
   earlier layer touches, centred navigation, the rail on the right with
   the borrower summary in exact figures.
   Additive over 41.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((s&&r)?r.querySelectorAll(s):document.querySelectorAll(s)); };
function N(v){ v = parseFloat(String(v==null?'':v).replace(/[$,%\s]/g,'')); return isFinite(v)?v:0; }
function norm(s){ return String(s||'').replace(/\s+/g,' ').trim(); }
function key(s){ return norm(s).toUpperCase(); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function usd(v,dp){ dp=dp===undefined?0:dp; var n=N(v);
  return (n<0?'\u2212':'')+'$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp}); }
function pct(v,dp){ dp=dp===undefined?2:dp; var n=N(v); if (Math.abs(n)<=1) n*=100; return n.toFixed(dp)+'%'; }
function setClass(el,c,on){ if (el && el.classList.contains(c)!==!!on) el.classList.toggle(c,!!on); }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }
function store(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
var V42 = window.V42 = { version:'42.0' };

/* =================================================================== 1
   THE CLUSTER, FROM SCRATCH

   Two releases tried to rescue the icon bar in place and it stayed
   crushed. Whatever ancestor rule is doing it, it targets the class
   names those layers used. This cluster uses none of them: new element,
   new classes, `all:unset` on every control so nothing is inherited,
   and every dimension then set explicitly. It sits in its own band
   directly under the masthead, right-aligned, opposite the readings.

   Every button carries an icon AND a label, always. Nothing here has an
   icon-only state.
   =================================================================== */
var I = {
  file:'<svg viewBox="0 0 16 16"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914Z"/></svg>',
  view:'<svg viewBox="0 0 16 16"><path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2Zm0 8a2 2 0 1 0-.001-3.999A2 2 0 0 0 8 10Z"/></svg>',
  docs:'<svg viewBox="0 0 16 16"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Z"/></svg>',
  compare:'<svg viewBox="0 0 16 16"><path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"/></svg>',
  tools:'<svg viewBox="0 0 16 16"><path d="M5.433 2.304A4.494 4.494 0 0 0 3.5 6c0 1.598.832 3.002 2.09 3.802.518.328.929.923.902 1.64v.008l-.164 3.337a.75.75 0 0 1-1.498-.073l.163-3.33c.002-.085-.05-.216-.207-.316A5.996 5.996 0 0 1 2 6a5.993 5.993 0 0 1 2.567-4.92.75.75 0 0 1 .866 1.224Zm5.134 0a.75.75 0 0 1 .866-1.224A5.993 5.993 0 0 1 14 6a5.996 5.996 0 0 1-2.786 5.068c-.157.1-.209.231-.207.316l.163 3.33a.75.75 0 1 1-1.498.073l-.164-3.337v-.008c-.027-.717.384-1.312.902-1.64A4.496 4.496 0 0 0 12.5 6a4.494 4.494 0 0 0-1.933-3.696Z"/></svg>',
  actions:'<svg viewBox="0 0 16 16"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/></svg>',
  live:'<svg viewBox="0 0 16 16"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"/></svg>'
};
function inventory(){
  var out = {}, seen = {};
  ['#v23SuiteActions','#v24LoanTools','#v25HeaderActions','#v34Bar','#v39Bar','#v40Bar','#v35Panel','#suite-root .toolbar','#suite-root .topbar']
  .forEach(function(sel){ $$(sel + ' button, ' + sel + ' a').forEach(function(b){
    if (b.closest('#v42Row') || b.closest('.v42-menu')) return;
    var l = key(b.textContent).replace(/\s*\u25BE\s*$/,''); if (!l || l.length > 40 || seen[l]) return; seen[l] = true; out[l] = b; }); });
  return out;
}
function fire(labels){ var inv = inventory(); for (var i=0;i<labels.length;i++){ var b = inv[key(labels[i])]; if (b){ setTimeout(function(){ try{ b.click(); }catch(e){} }, 30); return true; } } return false; }
var BTNS = [
  { id:'file',    icon:'file',    label:'File',       menu:[['File',['Save','New','Reset','Save scenario','Export scenario JSON','Import scenario JSON','Import / AI']]] },
  { id:'view',    icon:'view',    label:'View',       menu:[['View',['Full form','All pages','Print / PDF','Copy borrower quote','Theme & inputs']]] },
  { id:'docs',    icon:'docs',    label:'Documents',  menu:[['Print',['Print / PDF','Print summary']],['Generate',['Print / Generate','Draft LE','Draft Schedule C','P&L','Income Report']],['Open',['Documents & OCR']]] },
  { id:'compare', icon:'compare', label:'Compare',    go:function(){ if (!fire(['Live comparison','Compare'])) say('Comparison not loaded','','warn',4000); } },
  { id:'tools',   icon:'tools',   label:'Loan tools', menu:[['Loan tools',['Credit','Credit review','Recalculate','PMI / FHA MIP','Renovation fees','Profit & Loss','PMI Worksheet','Reno Fees']]] },
  { id:'live',    icon:'live',    label:'Live',       go:function(){ if (!fire(['Live comparison','Compare'])) say('Comparison not loaded','','warn',4000); } },
  { id:'actions', icon:'actions', label:'Actions',    primary:true, go:function(){ if (window.V35 && V35.toggle) return V35.toggle(); fire(['Actions']); } }
];
V42.close = function(){ var m = $('v42Menu'); if (m){ m.classList.remove('on'); m.hidden = true; } $$('#v42Row [aria-expanded="true"]').forEach(function(b){ b.setAttribute('aria-expanded','false'); }); };
V42.menu = function(id){
  var spec = BTNS.filter(function(b){ return b.id === id; })[0]; if (!spec) return;
  var m = $('v42Menu'); if (!m) return;
  if (m.dataset.for === id && !m.hidden){ V42.close(); return; }
  V42.close();
  var inv = inventory(), html = '';
  spec.menu.forEach(function(g){
    var have = g[1].filter(function(l){ return inv[key(l)]; }); if (!have.length) return;
    html += '<div class="v42-sec">' + esc(g[0]) + '</div>' + have.map(function(l){
      return '<button type="button" class="v42-item" data-l="' + esc(l) + '">' + esc(norm(inv[key(l)].textContent).replace(/\s*\u25BE\s*$/,'')) + '</button>'; }).join('');
  });
  /* anything real nobody lists lands under File so it cannot go missing */
  if (id === 'file'){ var claimed = {}; BTNS.forEach(function(b){ (b.menu||[]).forEach(function(g){ g[1].forEach(function(l){ claimed[key(l)] = 1; }); }); });
    var extra = Object.keys(inv).filter(function(k){ return !claimed[k] && !/^(ACTIONS|LIVE|LIVE SUMMARY|COMPARE|LIVE COMPARISON)$/.test(k); });
    if (extra.length) html += '<div class="v42-sec">More</div>' + extra.map(function(k){ return '<button type="button" class="v42-item" data-l="' + esc(k) + '">' + esc(norm(inv[k].textContent)) + '</button>'; }).join(''); }
  m.innerHTML = html || '<div class="v42-sec">Nothing here on this build.</div>';
  m.dataset.for = id;
  var b = $('v42-' + id), row = $('v42Row');
  if (b && row){ var r = b.getBoundingClientRect(), rr = row.getBoundingClientRect(); m.style.left = Math.max(0, r.left - rr.left) + 'px'; }
  m.hidden = false; m.classList.add('on');
  if (b) b.setAttribute('aria-expanded','true');
};
function build(){
  /* Same band as the readings: stats on the left half, this cluster on
     the right. Release 34 only ever touches .v34-left and .v34-right, so
     a third child of its bar is safe from it. */
  var band = $('v34Bar') || document.querySelector('#suite-root .topbar'); if (!band) return false;
  if ($('v42Row')) return true;
  var row = document.createElement('div'); row.id = 'v42Row'; row.className = 'v42-row no-print';
  row.innerHTML = BTNS.map(function(b){
    return '<button type="button" id="v42-' + b.id + '" class="v42-b' + (b.primary?' v42-primary':'') + '"' + (b.menu ? ' aria-haspopup="true" aria-expanded="false"' : '') + '>' + I[b.icon] + '<span>' + esc(b.label) + '</span></button>'; }).join('')
    + '<div class="v42-menu" id="v42Menu" hidden></div>';
  if (band.id === 'v34Bar') band.appendChild(row);
  else if (band.nextSibling) band.parentNode.insertBefore(row, band.nextSibling); else band.parentNode.appendChild(row);
  BTNS.forEach(function(b){ var el = $('v42-' + b.id); el.onclick = function(e){ e.stopPropagation(); if (b.menu) V42.menu(b.id); else b.go(); }; });
  $('v42Menu').onclick = function(e){ var it = e.target.closest('.v42-item'); if (!it) return; V42.close(); fire([it.dataset.l]); };
  return true;
}
/* the earlier clusters, off screen but wired */
function stowOld(){ ['v40Bar','v39Bar','v35Btn','v36LiveButton','v41-bar'].forEach(function(id){ var el = $(id); if (el) setClass(el, 'v42-off', true); }); }
document.addEventListener('mousedown', function(e){ if (!e.target.closest('#v42Row')) V42.close(); });
document.addEventListener('keydown', function(e){ if (e.key === 'Escape') V42.close(); });

/* =================================================================== 2
   THE RAIL — the borrower summary, exact figures

   The scenario summary's borrower block prints ranges — "$5,300 –
   $5,525" — because it is built to be shown to a borrower. On the rail
   the exact figure is wanted, so each line is read from the same output
   the summary reads and printed to the cent. Every row opens the edit
   popout or the workspace, through release 35's delegation.
   =================================================================== */
function outRow(label, value, mode, note){
  if (value == null || value === '') return '';
  return '<div class="out v40-out" data-out="' + esc(label) + '" data-v35-label="' + esc(label) + '" data-v35-mode="' + esc(mode||'') + '">'
    + '<div class="l">' + esc(label) + (note ? '<small>' + esc(note) + '</small>' : '') + '</div><div class="v">' + value + '</div></div>';
}
function sec(t){ return '<div class="sec-head v40-sec">' + esc(t) + '</div>'; }
V42.railHtml = function(){
  var s = store(); if (!s) return '';
  var o = s.outputs || {}, i = s.activeInputs || {}, loan = o.loan || {}, p = o.payment || {}, closing = o.closing || {}, cash = o.cash || {}, value = o.value || {}, reno = o.renovationOut || {};
  var h = sec('Borrower summary');
  h += outRow('Program', esc(o.programLabel || i.loanProgram || ''), 'setup');
  h += outRow('Purchase price', usd(i.basePurchasePrice), 'setup');
  if (N(value.afterRepairValue)) h += outRow('Estimated after-repair value', usd(value.afterRepairValue), 'maxmortgage');
  if (N(loan.requiredInvestment)) h += outRow('Down payment', usd(loan.requiredInvestment,2), 'maxmortgage', N(i.finalDownPaymentPct) ? pct(i.finalDownPaymentPct,2) + ' of price' : '');
  if (N(loan.maximumBaseLoan)) h += outRow('Base loan', usd(loan.maximumBaseLoan,2), 'maxmortgage');
  if (N(loan.ufmip)) h += outRow('Upfront MIP / fee', usd(loan.ufmip,2), 'setup');
  if (N(loan.totalLoan)) h += outRow('Total loan', usd(loan.totalLoan,2), 'maxmortgage');
  h += outRow('Interest rate', pct(i.interestRate,3) + (N(i.termYears) ? ' / ' + N(i.termYears) + ' yr' : ''), 'rates');
  if (N(p.totalMonthlyPayment)) h += outRow('Monthly payment', usd(p.totalMonthlyPayment,2), 'setup', 'exact, not the borrower range');
  if (N(closing.buyerClosingCosts)) h += outRow('Closing costs', usd(closing.buyerClosingCosts,2), 'closing', 'exact');
  if (N(cash.cashToClose)) h += outRow('Cash to close', usd(cash.cashToClose,2), 'closing', 'exact');
  if (N(cash.earnestMoneyDeposit)) h += outRow('Earnest money paid', usd(cash.earnestMoneyDeposit,2), 'closing', 'credited');
  if (N(value.afterRepairValue) && value.equityAfterLoan != null) h += outRow('Equity after the renovation', usd(value.equityAfterLoan,2), 'maxmortgage', N(value.equityPct) ? pct(value.equityPct,2) : '');
  if (N(value.projectedValue)) h += outRow('Projected value', usd(value.projectedValue,2), 'maxmortgage', (value.projectionYears || 5) + ' years' + (N(value.appreciationRate) ? ' at ' + pct(value.appreciationRate,2) : ''));
  if (N(value.minimumAsIsValueNeeded)) h += outRow('Minimum as-is value needed', usd(value.minimumAsIsValueNeeded,2), 'maxmortgage');
  if (N(reno.finalRenovationAmount)) h += outRow('Renovation amount', usd(reno.finalRenovationAmount,2), 'renovation');
  return h;
};
function paintRail(){
  var rail = document.querySelector('#suite-root .cols-main > .rail'); if (!rail) return false;
  var card = rail.querySelector(':scope > .card'), body = card && card.querySelector(':scope > .body'); if (!body) return false;
  var html = V42.railHtml(), host = $('v42Rail');
  if (!host || !host.isConnected){ if (host) host.remove(); host = document.createElement('div'); host.id = 'v42Rail'; host.className = 'v40-rail';
    var first = $('v40Rail'); if (first && first.parentNode === body) body.insertBefore(host, first); else body.appendChild(host); }
  if (host.__sig !== html){ host.__sig = html; host.innerHTML = html; }
  return true;
}

function tick(){ try { build(); stowOld(); } catch(e){} try { paintRail(); } catch(e){} }
if (window.LOS_SCHEDULER && LOS_SCHEDULER.add) LOS_SCHEDULER.add(tick, 1200); else setInterval(tick, 900);
setTimeout(tick, 200);
})();
