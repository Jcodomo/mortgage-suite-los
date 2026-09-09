/* =====================================================================
   v12 — credit report reader

   Reads a credit report, classifies each tradeline, applies the agency
   rules that decide whether a payment counts against DTI, flags the
   derogatory history that actually matters, estimates a rate where the
   arithmetic supports one, and ranks what is worth paying off.

   Nothing in either engine is edited.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function G(n){ try { return (0, eval)(n); } catch(e){ return undefined; } }
function N(v){ v = parseFloat(String(v == null ? '' : v).replace(/[$,\s%]/g,'')); return isFinite(v) ? v : 0; }
function usd(v,dp){ dp = dp===undefined?0:dp; var n=N(v);
  return (n<0?'\u2212':'')+'$'+Math.abs(n).toLocaleString('en-US',
    {minimumFractionDigits:dp,maximumFractionDigits:dp}); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function suite(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }

var V12 = window.V12 = {};
var CR = V12.CREDIT = { lines: [], gross: 0, agency: 'FNMA' };

/* =================================================================== 1
   THE RULES

   These differ by agency in ways that change the answer, so they are
   written out per agency rather than averaged into one "10 months" rule.

   The trap in all of this is LEASES. A lease payment is never excluded
   for having few payments left, because the vehicle has to be returned
   or replaced — the obligation does not end, it renews. Fannie and FHA
   both say so explicitly, and it is the single most common way a
   "10 or fewer payments" exclusion is applied wrongly.
   =================================================================== */
var RULES = {
  FNMA: {
    name: 'Fannie Mae',
    cite: 'B3-6-05',
    maxMonths: 10,
    test: 'or fewer payments remaining',
    incomeCapPct: 0,
    note: 'Installment debt with 10 or fewer monthly payments remaining may be excluded. '
        + 'Fannie still expects the payment to be counted where it is large enough to affect '
        + 'the borrower in the months right after closing.'
  },
  FHLMC: {
    name: 'Freddie Mac',
    cite: '5401.2',
    maxMonths: 10,
    test: 'or fewer months remaining',
    incomeCapPct: 0,
    note: 'Installment debt with 10 or fewer months remaining may be excluded.'
  },
  FHA: {
    name: 'FHA',
    cite: '4000.1 II.A.4.b',
    maxMonths: 9,          /* FHA says FEWER than 10, i.e. 9 or fewer */
    test: 'fewer than 10 months remaining',
    incomeCapPct: 5,
    note: 'FHA is "fewer than 10 months", so 10 remaining does NOT qualify \u2014 9 or fewer does. '
        + 'It also caps the exclusion: the cumulative payments of all debts excluded this way must '
        + 'be 5% or less of gross monthly income.'
  },
  VA: {
    name: 'VA',
    cite: 'Lenders Handbook ch.4',
    maxMonths: 10,
    test: 'or fewer payments remaining',
    incomeCapPct: 0,
    note: 'Debts lasting 10 months or less may be excluded unless the payment is large enough to '
        + 'affect the borrower during the first months of the loan. VA also runs a residual income '
        + 'test that an excluded payment does not escape.'
  }
};

/* Account types. `neverExclude` is the lease rule and its cousins. */
var TYPES = {
  mortgage:   { label:'Mortgage',        installment:true,  neverExclude:false, sensitive:true  },
  heloc:      { label:'HELOC',           installment:false, neverExclude:false, sensitive:true  },
  auto:       { label:'Auto loan',       installment:true,  neverExclude:false, sensitive:true  },
  lease:      { label:'Lease',           installment:true,  neverExclude:true,  sensitive:true  },
  student:    { label:'Student loan',    installment:true,  neverExclude:false, sensitive:false },
  personal:   { label:'Installment',     installment:true,  neverExclude:false, sensitive:false },
  revolving:  { label:'Revolving',       installment:false, neverExclude:false, sensitive:false },
  collection: { label:'Collection',      installment:false, neverExclude:false, sensitive:true  },
  chargeoff:  { label:'Charge-off',      installment:false, neverExclude:false, sensitive:true  },
  other:      { label:'Other',           installment:false, neverExclude:false, sensitive:false }
};

function classify(text){
  var t = String(text || '').toLowerCase();
  if (/\blease\b|leas(ed|ing)/.test(t))                          return 'lease';
  if (/mortgage|home\s*loan|conventional re|fha re|va re/.test(t)) return 'mortgage';
  if (/heloc|home equity/.test(t))                                return 'heloc';
  if (/\bauto\b|vehicle|car loan|motor/.test(t))                  return 'auto';
  if (/student|sallie|navient|nelnet|mohela|dept of ed/.test(t))  return 'student';
  if (/collection|collect/.test(t))                               return 'collection';
  if (/charge[\s-]?off|charged off/.test(t))                      return 'chargeoff';
  if (/revolving|credit card|card|visa|mastercard|amex|discover/.test(t)) return 'revolving';
  if (/installment|instal|personal loan|note loan/.test(t))       return 'personal';
  return 'other';
}

/* =================================================================== 2
   RATE ESTIMATE

   For an installment account with a balance, a payment and a number of
   payments left, the rate is recoverable: it is the i that makes the
   present value of the remaining payments equal the balance. Solved by
   bisection, which cannot diverge here because PV falls monotonically
   as i rises.

   For REVOLVING accounts it is not recoverable and this refuses to
   guess. A card's minimum payment is a percentage of the balance set by
   the issuer — typically 1-3% plus interest — and carries no information
   about the rate. Two cards at 12% and 29% with the same balance can
   show the same minimum. Anything printed there would be invention.
   =================================================================== */
function pvFactor(i, n){ return i <= 0 ? n : (1 - Math.pow(1 + i, -n)) / i; }
V12.solveApr = function(balance, payment, months){
  balance = N(balance); payment = N(payment); months = Math.round(N(months));
  if (balance <= 0 || payment <= 0 || months <= 0) return null;
  var total = payment * months;
  /* Exactly equal is a genuine 0% loan, not a broken one — promotional
     furniture, dental and buy-now-pay-later balances are all like this,
     and an earlier draft rejected every one of them by testing <= here
     instead of <. Only a shortfall means no positive rate exists. */
  if (total < balance) return { apr: null, reason: 'payments do not repay the balance' };
  if (Math.abs(total - balance) < 0.01) return { apr: 0, reason: 'interest-free' };
  var lo = 0, hi = 2 / 12;                       /* up to 200% nominal */
  for (var k = 0; k < 200; k++){
    var mid = (lo + hi) / 2;
    if (payment * pvFactor(mid, months) > balance) lo = mid; else hi = mid;
  }
  var monthly = (lo + hi) / 2;
  var apr = monthly * 12 * 100;
  if (apr < 0.05) return { apr: 0, reason: 'interest-free or nearly so' };
  if (apr > 190)  return { apr: null, reason: 'figures imply an implausible rate \u2014 check them' };
  return { apr: apr, reason: '' };
};

/* =================================================================== 3
   EXCLUSION TEST
   =================================================================== */
V12.testExclusion = function(line, agency, gross){
  var R = RULES[agency] || RULES.FNMA;
  var T = TYPES[line.type] || TYPES.other;
  var out = { eligible:false, why:'', cite:R.cite };

  if (T.neverExclude){
    out.why = 'A lease is never excluded for having few payments left \u2014 the vehicle has to be '
            + 'returned or replaced, so the obligation renews rather than ending. ' + R.name + ' ' + R.cite + '.';
    return out;
  }
  if (!T.installment){
    out.why = TYPES[line.type].label + ' is not installment debt, so the remaining-payment test does not apply.';
    return out;
  }
  if (line.type === 'student'){
    out.why = 'Student loans have their own treatment (a payment must be counted even when deferred, '
            + 'calculated from the documented payment or a percentage of the balance). The '
            + 'remaining-payment shortcut does not apply.';
    return out;
  }
  var m = Math.round(N(line.months));
  if (!m){
    out.why = 'No remaining-payment count on the tradeline. Enter it before this test means anything.';
    return out;
  }
  if (m > R.maxMonths){
    out.why = m + ' payments remaining is above ' + R.name + '\u2019s ' + R.test + '.';
    return out;
  }
  out.eligible = true;
  out.why = m + ' payments remaining meets ' + R.name + ' ' + R.cite + ' (' + R.test + ').';
  if (line.type === 'mortgage')
    out.why += ' A mortgage this close to term is worth confirming against the note before excluding it.';
  return out;
};
/* FHA caps the total excluded this way at 5% of gross monthly income —
   applied across the whole file, not per account, so it can only be
   resolved after every line has been tested. */
V12.applyFhaCap = function(lines, agency, gross){
  var R = RULES[agency] || RULES.FNMA;
  if (!R.incomeCapPct || !gross) return null;
  var excluded = lines.filter(function(l){ return l.exclude && l.test && l.test.eligible; });
  var sum = excluded.reduce(function(a,l){ return a + N(l.payment); }, 0);
  var cap = gross * R.incomeCapPct / 100;
  if (sum <= cap) return { ok:true, sum:sum, cap:cap };
  excluded.forEach(function(l){ l.capBlocked = true; });
  return { ok:false, sum:sum, cap:cap };
};

/* =================================================================== 4
   RISK FLAGS
   =================================================================== */
V12.flags = function(line){
  var f = [];
  var T = TYPES[line.type] || TYPES.other;
  var late30 = N(line.late30), late60 = N(line.late60), late90 = N(line.late90);
  var anyLate = late30 + late60 + late90;

  if (line.type === 'mortgage' && anyLate)
    f.push({ level:'high', text:'Mortgage late(s) on file. This is the single most heavily weighted '
      + 'derogatory in mortgage underwriting \u2014 most programmes want 0x30 in the last 12 months, and '
      + 'a recent one can fail an approval outright rather than just costing price.' });
  else if (line.type === 'auto' && anyLate)
    f.push({ level:'high', text:'Auto late(s) on file. Secured-debt lates read as a stronger signal than '
      + 'a card late and are commonly asked about by letter of explanation.' });
  else if (anyLate)
    f.push({ level:'watch', text:anyLate + ' late payment(s) reported.' });

  if (late90) f.push({ level:'high', text:'90+ day late reported.' });
  if (line.type === 'collection') f.push({ level:'high', text:'Collection account.' });
  if (line.type === 'chargeoff')  f.push({ level:'high', text:'Charged-off account.' });
  if (N(line.pastDue) > 0) f.push({ level:'high', text:'Currently past due ' + usd(line.pastDue) + '.' });
  if (line.disputed) f.push({ level:'watch', text:'Marked disputed. AUS will usually not issue a usable '
      + 'finding while a dispute flag is live \u2014 it has to be resolved, not worked around.' });
  if (line.authUser) f.push({ level:'watch', text:'Authorised user. The payment may be excludable if '
      + 'someone else demonstrably pays it, and the account is not the borrower\u2019s own credit history.' });

  if (line.type === 'revolving' && N(line.limit) > 0){
    var util = N(line.balance) / N(line.limit) * 100;
    if (util >= 90) f.push({ level:'high',  text:'Utilisation ' + util.toFixed(0) + '% \u2014 at or near the limit.' });
    else if (util >= 75) f.push({ level:'watch', text:'Utilisation ' + util.toFixed(0) + '%.' });
  }
  return f;
};

/* =================================================================== 5
   PAYOFF RANKING

   Two different questions, deliberately kept apart because they give
   different answers and confusing them is how borrowers get told to pay
   the wrong thing:

   DTI RELIEF  - monthly payment removed per dollar spent. This is the
                 origination question: what gets the ratio down cheapest.
   INTEREST    - the rate. This is the money question.

   A 0% furniture loan with a large payment is near the top of the first
   list and the bottom of the second. Both are shown.

   The important mechanical caveat: an INSTALLMENT payment does not fall
   when you pay the balance down. The payment is fixed by the note, so
   only paying it OFF removes it. Revolving minimums do move with the
   balance. This is flagged per row rather than left for someone to find
   out after advising a paydown that changed nothing.
   =================================================================== */
V12.rank = function(lines){
  var live = lines.filter(function(l){ return N(l.payment) > 0 && N(l.balance) > 0; });
  var byRelief = live.map(function(l){
    var T = TYPES[l.type] || TYPES.other;
    return {
      line: l,
      relief: N(l.payment) / N(l.balance),          /* $ of payment per $ paid */
      cost: N(l.balance),
      payment: N(l.payment),
      apr: l.apr && l.apr.apr != null ? l.apr.apr : null,
      mustPayInFull: T.installment,
      canPayDown: !T.installment
    };
  }).sort(function(a,b){ return b.relief - a.relief; });
  var byRate = byRelief.slice().sort(function(a,b){
    if (a.apr == null && b.apr == null) return 0;
    if (a.apr == null) return 1;
    if (b.apr == null) return -1;
    return b.apr - a.apr;
  });
  return { byRelief: byRelief, byRate: byRate };
};

/* =================================================================== 6
   PARSER

   Credit report layouts vary far too much for one grammar to cover, so
   this reads line by line and takes what it can recognise, leaving
   everything editable afterwards. It is a first pass to save typing, not
   an authority — every figure still has to be confirmed against the
   report, and the panel says so.
   =================================================================== */
V12.parse = function(text){
  var norm = (window.DOCP && DOCP._norm) ? DOCP._norm(text) : String(text || '');
  var rows = norm.split(/\r?\n/);
  var out = [];
  rows.forEach(function(raw){
    var line = raw.trim();
    if (line.length < 8) return;
    /* needs at least one dollar figure to be a tradeline at all */
    var money = line.match(/\$?\s?[\d,]{3,12}(?:\.\d{2})?/g);
    if (!money || money.length < 2) return;
    if (/^(total|subtotal|inquiries|score|summary)/i.test(line)) return;

    var nums = money.map(function(m){ return N(m); }).filter(function(n){ return n > 0; });
    if (nums.length < 2) return;
    var name = line.replace(/\$?\s?[\d,]{3,12}(?:\.\d{2})?/g,'').replace(/\s{2,}/g,' ').trim().slice(0,48);
    if (!name) return;

    var type = classify(line);
    /* balance is normally the largest figure on the row, payment the
       smallest non-trivial one — stated as an assumption, not a fact */
    var balance = Math.max.apply(null, nums);
    var payment = Math.min.apply(null, nums.filter(function(n){ return n < balance; }).concat([balance]));
    var mm = line.match(/(\d{1,3})\s*(?:payments?|mos?|months?)\s*(?:remaining|left|rem)/i)
          || line.match(/remaining[:\s]*(\d{1,3})/i);
    var lm = line.match(/(\d{1,2})\s*x\s*30/i);
    var lm60 = line.match(/(\d{1,2})\s*x\s*60/i);
    var lm90 = line.match(/(\d{1,2})\s*x\s*90/i);

    out.push({
      id: 'cl' + out.length + Date.now().toString(36),
      name: name, type: type,
      balance: balance, payment: payment === balance ? 0 : payment,
      limit: type === 'revolving' ? 0 : 0,
      months: mm ? N(mm[1]) : 0,
      late30: lm ? N(lm[1]) : 0, late60: lm60 ? N(lm60[1]) : 0, late90: lm90 ? N(lm90[1]) : 0,
      pastDue: 0, disputed: /disput/i.test(line), authUser: /authorized user|auth user/i.test(line),
      include: true, exclude: false, raw: line.slice(0,140)
    });
  });
  return out;
};

/* =================================================================== 7
   RECOMPUTE + RENDER
   =================================================================== */
V12.recompute = function(){
  CR.lines.forEach(function(l){
    var T = TYPES[l.type] || TYPES.other;
    l.apr = T.installment && !l.aprManual
      ? V12.solveApr(l.balance, l.payment, l.months)
      : (l.aprManual ? { apr: N(l.aprManual), reason:'entered by hand' } : null);
    l.test = V12.testExclusion(l, CR.agency, CR.gross);
    l.flagList = V12.flags(l);
    l.capBlocked = false;
    if (!l.test.eligible) l.exclude = false;
  });
  CR.cap = V12.applyFhaCap(CR.lines, CR.agency, CR.gross);
  CR.counted = CR.lines.filter(function(l){ return l.include && !(l.exclude && !l.capBlocked); })
                       .reduce(function(a,l){ return a + N(l.payment); }, 0);
  CR.totalBal = CR.lines.reduce(function(a,l){ return a + N(l.balance); }, 0);
  CR.ranked = V12.rank(CR.lines);
};
V12.set = function(id, field, val){
  var l = CR.lines.filter(function(x){ return x.id === id; })[0]; if (!l) return;
  if (field === 'include' || field === 'exclude' || field === 'disputed' || field === 'authUser') l[field] = !l[field];
  else if (field === 'type') l.type = val;
  else l[field] = N(val);
  V12.recompute(); V12.render();
};
V12.setAgency = function(a){ CR.agency = a; V12.recompute(); V12.render(); };
V12.setGross = function(v){ CR.gross = N(v); V12.recompute(); V12.render(); };
V12.addLine = function(){
  CR.lines.push({ id:'cl'+Date.now().toString(36), name:'New account', type:'revolving',
    balance:0, payment:0, limit:0, months:0, late30:0, late60:0, late90:0, pastDue:0,
    disputed:false, authUser:false, include:true, exclude:false, raw:'' });
  V12.recompute(); V12.render();
};
V12.removeLine = function(id){
  CR.lines = CR.lines.filter(function(x){ return x.id !== id; });
  V12.recompute(); V12.render();
};
/* Only the counted payments go across, and each keeps its own row so the
   worksheet shows what it is rather than one lump. */
V12.pushToCalculator = function(){
  var S = G('S'); if (!S || !S.dti) return say('Calculator not ready', '', 'warn');
  var take = CR.lines.filter(function(l){ return l.include && !(l.exclude && !l.capBlocked) && N(l.payment) > 0; });
  if (!take.length) return say('Nothing to send', 'Every line is either excluded or has no payment.', 'warn');
  S.dti.debts = S.dti.debts.filter(function(d){ return !/^\[credit\]/.test(d.name || ''); });
  take.forEach(function(l){
    S.dti.debts.push({ id: (G('uid') ? G('uid')() : 'd'+Math.random().toString(36).slice(2)),
      name: '[credit] ' + l.name, amt: N(l.payment) });
  });
  if (typeof window.renderDTI === 'function') window.renderDTI();
  if (window.RECALC) window.RECALC();
  say('Sent ' + take.length + ' liability(ies)',
      'Only the payments that count under ' + (RULES[CR.agency]||RULES.FNMA).name + ' went across. '
      + 'Excluded lines were left behind on purpose \u2014 they are still on the credit panel.', 'good', 8000);
};

function agencyBar(){
  return '<div class="v12-row"><span class="v12-lbl">Agency</span>'
    + Object.keys(RULES).map(function(a){
        return '<button type="button" class="v12-ag' + (CR.agency===a?' on':'') + '" '
             + 'onclick="V12.setAgency(\'' + a + '\')">' + esc(RULES[a].name) + '</button>';
      }).join('')
    + '<span class="v12-lbl" style="margin-left:14px">Gross monthly income</span>'
    + '<input class="cell-input" style="width:130px" value="' + (CR.gross || '') + '" '
    + 'placeholder="for the FHA 5% cap" onchange="V12.setGross(this.value)">'
    + '</div>'
    + '<div class="v12-note">' + esc(RULES[CR.agency].note) + '</div>';
}
function lineRow(l){
  var T = TYPES[l.type] || TYPES.other;
  var counted = l.include && !(l.exclude && !l.capBlocked);
  var aprTxt = l.apr && l.apr.apr != null ? l.apr.apr.toFixed(1) + '%'
             : (T.installment ? '<span class="v12-dim">' + esc(l.apr && l.apr.reason ? l.apr.reason : 'needs months left') + '</span>'
                              : '<span class="v12-dim">not recoverable</span>');
  var high = (l.flagList||[]).filter(function(f){ return f.level==='high'; }).length;
  var watch = (l.flagList||[]).filter(function(f){ return f.level==='watch'; }).length;
  return '<tr class="' + (counted ? '' : 'v12-off') + '">'
    + '<td><input class="cell-input v12-nm" value="' + esc(l.name) + '" onchange="V12.set(\'' + l.id + '\',\'name\',this.value)"></td>'
    + '<td><select class="cell-input" onchange="V12.set(\'' + l.id + '\',\'type\',this.value)">'
      + Object.keys(TYPES).map(function(k){
          return '<option value="' + k + '"' + (k===l.type?' selected':'') + '>' + esc(TYPES[k].label) + '</option>';
        }).join('') + '</select></td>'
    + '<td><input class="cell-input num" value="' + (l.balance||'') + '" onchange="V12.set(\'' + l.id + '\',\'balance\',this.value)"></td>'
    + '<td><input class="cell-input num" value="' + (l.payment||'') + '" onchange="V12.set(\'' + l.id + '\',\'payment\',this.value)"></td>'
    + '<td><input class="cell-input num" style="width:56px" value="' + (l.months||'') + '" onchange="V12.set(\'' + l.id + '\',\'months\',this.value)"></td>'
    + '<td class="num">' + aprTxt + '</td>'
    + '<td>' + (l.test && l.test.eligible
        ? '<label class="v12-chk"><input type="checkbox"' + (l.exclude?' checked':'') + ' onchange="V12.set(\'' + l.id + '\',\'exclude\')"> omit</label>'
        : '<span class="v12-dim">counts</span>') + '</td>'
    + '<td>' + (high ? '<span class="v12-pill high">' + high + '</span>' : '')
             + (watch ? '<span class="v12-pill watch">' + watch + '</span>' : '')
             + (l.capBlocked ? '<span class="v12-pill high">cap</span>' : '') + '</td>'
    + '<td><button class="btn-icon" onclick="V12.removeLine(\'' + l.id + '\')">\u00d7</button></td>'
    + '</tr>'
    + ((l.flagList && l.flagList.length) || (l.test && !l.test.eligible && l.test.why) ?
      '<tr class="v12-why"><td colspan="9">'
        + (l.test ? '<div class="v12-cite">' + esc(l.test.why) + '</div>' : '')
        + (l.flagList||[]).map(function(f){
            return '<div class="v12-flag ' + f.level + '">' + esc(f.text) + '</div>'; }).join('')
      + '</td></tr>' : '');
}
V12.render = function(){
  var host = $('v12Body'); if (!host) return;
  if (!CR.lines.length){
    host.innerHTML = agencyBar()
      + '<div class="v12-empty">Drop a credit report above, or add lines by hand. '
      + 'Nothing is imported automatically \u2014 you choose what crosses into the file.</div>';
    return;
  }
  var r = CR.ranked || { byRelief:[], byRate:[] };
  host.innerHTML = agencyBar()
    + '<div class="v12-sum">'
      + '<div><span>Counted monthly</span><b>' + usd(CR.counted) + '</b></div>'
      + '<div><span>Total balances</span><b>' + usd(CR.totalBal) + '</b></div>'
      + '<div><span>Tradelines</span><b>' + CR.lines.length + '</b></div>'
    + '</div>'
    + (CR.cap && !CR.cap.ok ? '<div class="notice warn"><div><b>FHA 5% cap exceeded.</b> The payments you '
        + 'have marked to omit total ' + usd(CR.cap.sum) + ', over the ' + usd(CR.cap.cap) + ' ceiling '
        + '(5% of gross monthly income). FHA does not allow the exclusion at that size, so those lines '
        + 'are being counted anyway \u2014 omit fewer of them, or the ratio will not hold at underwriting.</div></div>' : '')
    + '<table class="tbl v12-tbl"><thead><tr><th>Account</th><th>Type</th><th class="num">Balance</th>'
      + '<th class="num">Payment</th><th class="num">Mos</th><th class="num">Est. APR</th>'
      + '<th>DTI</th><th>Flags</th><th></th></tr></thead><tbody>'
    + CR.lines.map(lineRow).join('')
    + '</tbody></table>'
    + '<div class="v12-row"><button class="btn btn-light btn-sm" onclick="V12.addLine()">Add a line</button>'
      + '<button class="btn btn-primary btn-sm" onclick="V12.pushToCalculator()">Send counted payments to the calculator</button></div>'
    + (r.byRelief.length ? '<h4 class="v12-h">What is worth paying off</h4>'
      + '<div class="v12-note">Two different questions, kept apart because they rank differently. '
      + '<b>DTI relief</b> is monthly payment removed per dollar spent \u2014 the origination question. '
      + '<b>Rate</b> is the money question. A 0% loan with a big payment tops the first list and the '
      + 'bottom of the second.</div>'
      + '<div class="v12-cols">'
      + '<div><div class="v12-sub">Best DTI relief per dollar</div><ol class="v12-ol">'
      + r.byRelief.slice(0,6).map(function(x){
          return '<li><b>' + esc(x.line.name) + '</b> \u2014 ' + usd(x.payment) + '/mo off for '
            + usd(x.cost) + ' <span class="v12-dim">(' + (x.relief*100).toFixed(1) + '\u00a2 of payment per $1)</span>'
            + (x.mustPayInFull ? '<div class="v12-warnline">Installment: the payment is fixed by the note, '
                + 'so paying the balance down changes nothing. Only paying it off removes it.</div>' : '')
            + '</li>'; }).join('')
      + '</ol></div>'
      + '<div><div class="v12-sub">Highest rate first</div><ol class="v12-ol">'
      + r.byRate.slice(0,6).map(function(x){
          return '<li><b>' + esc(x.line.name) + '</b> \u2014 '
            + (x.apr != null ? x.apr.toFixed(1) + '%' : '<span class="v12-dim">rate not recoverable</span>')
            + ' on ' + usd(x.cost) + '</li>'; }).join('')
      + '</ol></div></div>' : '');
};

/* =================================================================== 8
   PANEL + FILE INTAKE
   =================================================================== */
V12.readFiles = function(files){
  var f = Array.prototype.slice.call(files)[0]; if (!f) return;
  var done = function(text){
    var found = V12.parse(text);
    if (!found.length){
      say('Nothing recognised', 'No tradelines matched. Credit report layouts vary a lot \u2014 add the '
        + 'accounts by hand, or use the AI prompt path on the Documents tab and paste the result.', 'warn', 9000);
      return;
    }
    CR.lines = CR.lines.concat(found);
    V12.recompute(); V12.render();
    say('Read ' + found.length + ' tradeline(s)',
        'This is a first pass to save typing, not an authority. Confirm every balance, payment and '
        + 'remaining-payment count against the report before any of it reaches a file.', 'good', 10000);
  };
  if (/\.pdf$/i.test(f.name) && typeof window.pdfText === 'function'){
    window.pdfText(f).then(function(r){
      if ((r.text||'').replace(/\s/g,'').length > 40) return done(r.text);
      return window.pdfPageImages(r.pdf, 10).then(window.ocrImages).then(done);
    }).catch(function(){ say('Could not read that PDF','','warn'); });
  } else {
    f.text().then(done);
  }
};
function buildPanel(){
  if ($('v12Modal')) return true;
  var w = document.createElement('div');
  w.className = 'rpt-modal v11-modal v12-modal'; w.id = 'v12Modal';
  w.innerHTML = '<div class="rpt-modal-bar"><span class="ttl">Credit report</span>'
    + '<span class="v11-grow"></span>'
    + '<button class="btn btn-light btn-sm" onclick="document.getElementById(\'v12File\').click()">Load a report</button>'
    + '<button class="btn btn-sm" onclick="V12.close()">Close</button></div>'
    + '<div class="rpt-picker">'
      + '<div class="dropzone v12-dz" id="v12Dz"><div class="dz-t">Drop a credit report, or click to browse</div>'
      + '<div class="dz-s">Read locally through the same OCR engine as the rest of the file. '
      + 'Nothing is sent anywhere, and nothing crosses into the loan file until you send it.</div></div>'
      + '<input type="file" id="v12File" accept=".pdf,.txt" style="display:none">'
      + '<div id="v12Body"></div>'
    + '</div>';
  document.body.appendChild(w);
  var dz = $('v12Dz'), fi = $('v12File');
  dz.addEventListener('click', function(){ fi.click(); });
  fi.addEventListener('change', function(){ if (fi.files.length) V12.readFiles(fi.files); fi.value=''; });
  ['dragenter','dragover'].forEach(function(ev){ dz.addEventListener(ev, function(e){
    e.preventDefault(); e.stopPropagation(); dz.classList.add('drag'); }); });
  ['dragleave','drop'].forEach(function(ev){ dz.addEventListener(ev, function(e){
    e.preventDefault(); e.stopPropagation(); dz.classList.remove('drag'); }); });
  dz.addEventListener('drop', function(e){
    if (e.dataTransfer && e.dataTransfer.files.length) V12.readFiles(e.dataTransfer.files); });
  V12.render();
  return true;
}
V12.open = function(){
  buildPanel();
  /* seed gross income from the calculator if it is already known */
  if (!CR.gross){ try { var t = window.calcTotals(); if (t && t.income) CR.gross = t.income; } catch(e){} }
  V12.recompute(); V12.render();
  $('v12Modal').classList.add('on');
  document.body.style.overflow = 'hidden';
};
V12.close = function(){
  var m = $('v12Modal'); if (m) m.classList.remove('on');
  document.body.style.overflow = '';
};
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape'){ var m = $('v12Modal'); if (m && m.classList.contains('on')) V12.close(); }
});
function buildButton(){
  var tb = document.querySelector('#suite-root .toolbar'); if (!tb) return false;
  if ($('v12Btn')) return true;
  var b = document.createElement('button');
  b.type = 'button'; b.id = 'v12Btn'; b.className = 'btn ghost';
  b.textContent = 'Credit';
  b.title = 'Read a credit report, apply the exclusion rules, rank what to pay off';
  b.addEventListener('click', V12.open);
  var le = $('v11LeBtn');
  if (le) tb.insertBefore(b, le); else tb.appendChild(b);
  return true;
}
setInterval(function(){ try { buildButton(); } catch(e){} }, 600);
})();
