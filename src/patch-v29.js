/* =====================================================================
   v29 — a much fuller live summary, and a rate control that either
         searches the market or takes your own number.
   Additive. Nothing in an earlier layer is edited.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function N(v){ v = parseFloat(String(v==null?'':v).replace(/[$,%\s]/g,'')); return isFinite(v)?v:0; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function usd(v,dp){ dp=dp===undefined?0:dp; var n=N(v);
  return (n<0?'\u2212':'')+'$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp}); }
function pct(v,dp){ dp=dp===undefined?2:dp; var n=N(v); if (Math.abs(n)<=1) n*=100; return n.toFixed(dp)+'%'; }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }
function store(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
var V29 = window.V29 = { version:'29.0' };

/* =================================================================== 1
   THE EXPANDED LIVE SUMMARY

   The engine's own RAIL is a sealed descriptor, so this appends to the
   rendered card rather than editing it — the original lines and their
   jump-to-source behaviour are untouched and still sit at the top.

   What gets added is the material that was previously only reachable by
   opening three or four tabs: where the ratios sit against their caps,
   what the mortgage insurance is actually costing and when it stops,
   how the payment breaks down, what the closing costs total by bucket,
   and how much room is left before the file stops working.

   Every figure is read from the engine's own outputs. Nothing here
   recalculates anything, so it cannot disagree with the tabs.
   =================================================================== */
function num(v){ return (v===null||v===undefined||!isFinite(N(v))) ? null : N(v); }
function row(label, value, opts){
  opts = opts || {};
  if (value === null || value === undefined || value === '') return '';
  return '<div class="v29-row' + (opts.strong?' strong':'') + (opts.cls?(' '+opts.cls):'') + '">'
    + '<span class="l">' + esc(label) + '</span>'
    + '<span class="v">' + value + '</span>'
    + (opts.sub ? '<span class="s">' + esc(opts.sub) + '</span>' : '')
    + '</div>';
}
function head(t){ return '<div class="v29-head">' + esc(t) + '</div>'; }
function bar(used, cap, label){
  if (!cap) return '';
  var p = Math.max(0, Math.min(140, used/cap*100));
  var state = p > 100 ? 'over' : p > 92 ? 'tight' : 'ok';
  return '<div class="v29-bar ' + state + '"><i style="width:' + Math.min(100,p) + '%"></i>'
       + '<span>' + esc(label) + '</span></div>';
}
V29.build = function(){
  var st = store(); if (!st) return '';
  var out = st.outputs, i = st.activeInputs;
  if (!out || !out.payment) return '';
  var p = out.payment, aus = out.aus || {}, loan = out.loan || {}, cash = out.cash || {},
      closing = out.closing || {}, value = out.value || {}, reno = out.renovationOut || {};
  var isFha = !!out.isFha;
  var h = '';

  /* ---- ratios against their caps -------------------------------- */
  var front = num(aus.frontEndDti), back = num(aus.backEndDti);
  var fCap = num(aus.frontEndLimit), bCap = num(aus.backEndLimit);
  if (front != null || back != null){
    h += head('Ratios');
    if (front != null) h += row('Front-end', pct(front,1), { sub: fCap ? 'cap ' + pct(fCap,1) : '' });
    if (front != null && fCap) h += bar(front, fCap, pct(Math.max(0,fCap-front),1) + ' of front-end room left');
    if (back != null) h += row('Back-end', pct(back,1), { sub: bCap ? 'cap ' + pct(bCap,1) : '' });
    if (back != null && bCap) h += bar(back, bCap, pct(Math.max(0,bCap-back),1) + ' of back-end room left');
    if (num(aus.totalMonthlyLiabilities) != null)
      h += row('Other monthly debts', usd(aus.totalMonthlyLiabilities));
    if (num(aus.maxSupportedHousingPayment))
      h += row('Maximum payment', usd(aus.maxSupportedHousingPayment,0),
               { sub:'the lower of the two caps, after debts' });
  }

  /* ---- the payment, broken out ---------------------------------- */
  h += head('Monthly payment');
  h += row('Principal &amp; interest', usd(p.principalAndInterest,2));
  var mi = isFha ? num(p.monthlyFhaMip) : num(p.monthlyPmi);
  var miRate = isFha ? num(p.fhaMipRateUsed) : num(p.pmiRateUsed);
  if (mi) h += row(isFha ? 'FHA MIP' : 'Mortgage insurance', usd(mi,2),
                   { sub: miRate ? pct(miRate,2) + ' annual' + (p.creditTier ? ' \u00b7 tier ' + p.creditTier : '') : '' });
  if (num(p.monthlyTaxes)) h += row('Property taxes', usd(p.monthlyTaxes,2));
  if (num(p.monthlyInsurance)) h += row('Insurance', usd(p.monthlyInsurance,2));
  if (num(p.hoaMonthly)) h += row('HOA', usd(p.hoaMonthly,2));
  h += row('Total payment', usd(p.totalMonthlyPayment,2), { strong:true });
  if (num(p.paymentLow) && num(p.paymentHigh) && p.paymentLow !== p.paymentHigh)
    h += row('Rounded range', usd(p.paymentLow) + ' \u2013 ' + usd(p.paymentHigh),
             { sub:'from the rounding increment on the file' });

  /* ---- leverage and MI life ------------------------------------- */
  h += head('Leverage');
  if (num(p.currentLtv)) h += row('LTV', pct(p.currentLtv,2));
  if (num(value.valueBasis)) h += row('Value basis', usd(value.valueBasis),
      { sub: isFha ? 'lower of the cascade, capped at 110% ARV' : '' });
  if (num(p.pmiCancelValue))
    h += row(isFha ? 'MIP review value' : 'PMI drops at', usd(p.pmiCancelValue),
             { sub: isFha ? 'FHA MIP runs the life of the loan at this LTV unless the term or LTV change'
                          : 'value at which 78% LTV is reached' });

  /* ---- cash and costs ------------------------------------------- */
  h += head('Cash and costs');
  if (num(loan.requiredInvestment)) h += row('Required investment', usd(loan.requiredInvestment,2));
  if (num(closing.buyerClosingCosts)) h += row('Buyer closing costs', usd(closing.buyerClosingCosts));
  if (num(cash.sellerConcessionApplied))
    h += row('Seller concession applied', usd(cash.sellerConcessionApplied),
             { sub: num(cash.sellerConcessionCeiling) ? 'ceiling ' + usd(cash.sellerConcessionCeiling) : '' });
  if (num(i && i.closing && i.closing.earnestMoneyDeposit))
    h += row('Earnest money', usd(i.closing.earnestMoneyDeposit));
  if (num(cash.cashToClose) !== null)
    h += row('Cash to close', usd(cash.cashToClose,2), { strong:true,
             cls: N(cash.cashToClose) < 0 ? 'good' : '' , sub: N(cash.cashToClose) < 0 ? 'borrower receives funds' : '' });

  /* ---- reserves -------------------------------------------------- */
  if (num(aus.reserveMonths) != null || num(aus.reserveMonthsAvailable) != null){
    h += head('Reserves');
    if (num(aus.reserveMonthsAvailable) != null)
      h += row('Months available', N(aus.reserveMonthsAvailable).toFixed(1));
    if (num(aus.reserveMonths) != null)
      h += row('Months required', N(aus.reserveMonths).toFixed(1));
    if (aus.reserveStatus) h += row('Status', esc(String(aus.reserveStatus)),
      { cls: /pass|ok/i.test(aus.reserveStatus) ? 'good' : 'warn' });
  }

  /* ---- renovation, only when it applies -------------------------- */
  if (num(reno.finalRenovationAmount)){
    h += head('Renovation');
    h += row('Renovation total', usd(reno.finalRenovationAmount));
    if (num(reno.contingency)) h += row('Contingency', usd(reno.contingency));
    if (num(reno.financedFees)) h += row('Financed fees', usd(reno.financedFees));
    if (num(value.afterRepairValue)) h += row('After-repair value', usd(value.afterRepairValue));
  }

  /* ---- terms ----------------------------------------------------- */
  h += head('Terms');
  h += row('Note rate', pct(i.interestRate,3), { sub:'click the Rate chip in the header to change it' });
  if (num(i.termYears)) h += row('Term', N(i.termYears) + ' years');
  if (out.programLabel) h += row('Programme', esc(out.programLabel));
  if (i.state) h += row('Jurisdiction', esc(i.state) + (i.nyCounty ? ' \u00b7 ' + esc(i.nyCounty) : ''));

  return h ? '<div class="v29-extra">' + h + '</div>' : '';
};
V29.paint = function(){
  var rail = document.querySelector('#suite-root .rail'); if (!rail) return;
  var card = rail.querySelector('.card') || rail;
  var host = $('v29Extra');
  var html = V29.build();
  if (!html){ if (host) host.style.display='none'; return; }
  if (!host || !host.isConnected){
    if (host) host.remove();
    host = document.createElement('div');
    host.id = 'v29Extra';
    card.appendChild(host);
  }
  host.style.display = '';
  /* only rewrite when something moved — this runs on a poll */
  if (host.__sig === html) return;
  host.__sig = html;
  host.innerHTML = html;
};

/* =================================================================== 2
   THE RATE CONTROL

   Clicking the Rate chip opens a small popover with the two things
   anyone wants at that moment: run the market search, or type the rate
   you were quoted. The board's own rows appear as one-click picks when
   a search has been run, so a quoted rate and a market rate sit side by
   side rather than in two different places.

   Typing a rate writes it straight to the file; it does not wait for a
   search and does not need one.
   =================================================================== */
V29.openRate = function(anchor){
  var pop = $('v29RatePop');
  if (!pop){
    pop = document.createElement('div');
    pop.id = 'v29RatePop'; pop.className = 'v29-pop no-print';
    document.body.appendChild(pop);
    document.addEventListener('mousedown', function(e){
      var p = $('v29RatePop');
      if (p && p.classList.contains('on') && !p.contains(e.target) && !e.target.closest('#v28RateStat'))
        V29.closeRate();
    });
  }
  V29.renderRate();
  pop.classList.add('on');
  var a = anchor || $('v28RateStat');
  if (a){
    var r = a.getBoundingClientRect();
    pop.style.top  = (r.bottom + 8) + 'px';
    pop.style.left = Math.max(10, Math.min(window.innerWidth - 330, r.left)) + 'px';
  }
  var f = $('v29RateInput'); if (f){ f.focus(); f.select(); }
};
V29.closeRate = function(){ var p = $('v29RatePop'); if (p) p.classList.remove('on'); };
V29.applyRate = function(v){
  var r = N(v);
  if (!r) return say('Enter a rate', 'Type the note rate, for example 6.875.', 'warn', 5000);
  if (r > 25) return say('That looks too high', 'Enter the rate as a percent \u2014 6.875, not 687.5.', 'warn', 6000);
  var st = store(); if (!st) return;
  /* the engine stores the rate as a fraction; the form and every quote
     print it as a percent, which is the 100x trap */
  try { st.setField('interestRate', r/100, 'Rate chip'); } catch(e){}
  if (window.RECALC) window.RECALC();
  V29.renderRate();
  say('Rate set to ' + r.toFixed(3).replace(/0+$/,'').replace(/\.$/,'') + '%',
      'Payment, ratios and cash to close have all moved with it.', 'good', 5000);
};
V29.searchRates = function(){
  if (!window.RATES || !RATES.fetchLive)
    return say('Rates board not loaded', 'The Mortgage Rates workspace has not finished building.', 'warn', 6000);
  var b = $('v29RateSearch'); if (b){ b.disabled = true; b.textContent = 'Searching\u2026'; }
  try { RATES.fetchLive(); } catch(e){}
  setTimeout(function(){
    if (b){ b.disabled = false; b.textContent = 'Run a market search'; }
    V29.renderRate();
  }, 2600);
};
V29.openBoard = function(){
  V29.closeRate();
  if (window.V28 && V28.version){ var b = $('v28nav-rates'); if (b) return b.click(); }
  if (window.V8 && V8.go) V8.go('rates');
};
function boardRows(){
  try {
    var s = RATES.state, rows = s && s.rows; if (!rows) return [];
    return [['fixed30','30-year fixed'],['fixed15','15-year fixed'],['fha30','FHA 30'],['va30','VA 30']]
      .filter(function(k){ return rows[k[0]] && N(rows[k[0]].rate); })
      .map(function(k){ return { key:k[0], label:k[1], rate:N(rows[k[0]].rate) }; });
  } catch(e){ return []; }
}
V29.renderRate = function(){
  var pop = $('v29RatePop'); if (!pop) return;
  var st = store();
  var cur = 0;
  try { cur = N(st.activeInputs.interestRate); if (cur && cur <= 1) cur *= 100; } catch(e){}
  var rows = boardRows();
  var stamp = '';
  try { stamp = RATES.state && RATES.state.fetchedAt
    ? new Date(RATES.state.fetchedAt).toLocaleString() : ''; } catch(e){}
  pop.innerHTML =
    '<div class="v29-pop-hd">Note rate</div>'
    + '<div class="v29-pop-row">'
      + '<input class="cell-input" id="v29RateInput" value="' + (cur ? cur.toFixed(3).replace(/0+$/,'').replace(/\.$/,'') : '') + '" '
      + 'placeholder="6.875" inputmode="decimal" '
      + 'onkeydown="if(event.key===\'Enter\'){V29.applyRate(this.value);V29.closeRate();}">'
      + '<span class="v29-pct">%</span>'
      + '<button class="btn btn-primary btn-sm" onclick="V29.applyRate(document.getElementById(\'v29RateInput\').value)">Use this</button>'
    + '</div>'
    + '<div class="v29-pop-sub">Type the rate you were quoted, or search the market below.</div>'
    + '<button class="btn btn-light btn-sm v29-pop-wide" id="v29RateSearch" onclick="V29.searchRates()">Run a market search</button>'
    + (rows.length
        ? '<div class="v29-pop-list">' + rows.map(function(r){
            return '<button type="button" class="v29-pick" onclick="V29.applyRate(' + r.rate + ')">'
              + '<span>' + esc(r.label) + '</span><b>' + r.rate.toFixed(3).replace(/0+$/,'').replace(/\.$/,'') + '%</b></button>';
          }).join('') + '</div>'
          + '<div class="v29-pop-note">Board figures are national averages from the feed, not a lock '
          + 'quote. Price the file before relying on one.' + (stamp ? ' Last fetched ' + esc(stamp) + '.' : '') + '</div>'
        : '<div class="v29-pop-note">No board figures yet \u2014 run a search, or open the full rates '
          + 'workspace for spreads and history.</div>')
    + '<button class="btn btn-light btn-sm v29-pop-wide" onclick="V29.openBoard()">Open the rates workspace</button>';
};
function wireRateChip(){
  var b = $('v28RateStat'); if (!b || b.__v29) return false;
  b.__v29 = true;
  b.onclick = function(e){ e.preventDefault(); e.stopPropagation(); V29.openRate(b); };
  b.title = 'Note rate \u2014 set it here, or search the market';
  return true;
}
document.addEventListener('keydown', function(e){ if (e.key === 'Escape') V29.closeRate(); });

/* =================================================================== 3
   WIRING
   =================================================================== */
setInterval(function(){
  try { V29.paint(); } catch(e){}
  try { wireRateChip(); } catch(e){}
}, 700);
})();
