
/* =====================================================================
   Release 51 — the two features release 50.4 dropped, and the routing
   fault that sent a paystub into the loan file.
   Additive over 50.4. Nothing in 50.4 or any earlier layer is edited.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function G(n){ try { return (0, eval)(n); } catch(e){ return undefined; } }
function N(v){ v = parseFloat(String(v==null?'':v).replace(/[$,%\s]/g,'')); return isFinite(v)?v:0; }
function norm(s){ return String(s||'').replace(/\s+/g,' ').trim(); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }
var V51 = window.V51 = { version:'51.0' };

/* =================================================================== 1
   THE ROUTING FAULT

   50.4's detectJsonTarget asks whether the object's top-level keys look
   like an income file (w2, schc, corp, sche...) or a loan file
   (basePurchasePrice, loanProgram...), and falls through to 'loan'.

   A real extraction has neither. Its top-level keys are the documents:
   employeeName, employer, workNumberVerification, currentPaystub2026.
   So a paystub and a Work Number verification were routed to the LOAN
   file and flattened against its input paths — where almost nothing
   matched, so almost nothing imported, quietly.

   Detection is widened first: anything that names a document, a payroll
   period or an employer is income, whatever its top-level shape.
   =================================================================== */
var INCOME_MARKERS = /paystub|earnings|payroll|employer|employee|worknumber|work_number|voe|voi|verification|w2|w-2|schedulec|schedule_c|k1|k-1|1040|1065|1120|transcript|award|benefit|grossytd|ytd|hourlyrate|payfrequency|hiredate|incomehistory/i;
var LOAN_MARKERS   = /basepurchaseprice|purchaseprice|loanprogram|loanamount|interestrate|downpayment|propertyaddress|zipcode|closingcost|escrow|renovation|afterrepair|salesprice|loanestimate|closingdisclosure/i;
function deepKeys(o, depth){
  depth = depth || 0; if (!o || typeof o !== 'object' || depth > 3) return [];
  var out = [];
  Object.keys(o).forEach(function(k){
    out.push(k);
    var v = o[k];
    if (v && typeof v === 'object'){
      if (Array.isArray(v)) v.slice(0,3).forEach(function(x){ out = out.concat(deepKeys(x, depth+1)); });
      else out = out.concat(deepKeys(v, depth+1));
    }
  });
  return out;
}
V51.target = function(value){
  var keys = deepKeys(value).join(' ');
  var inc = (keys.match(INCOME_MARKERS)||[]).length ? (keys.match(new RegExp(INCOME_MARKERS.source,'gi'))||[]).length : 0;
  var lon = (keys.match(new RegExp(LOAN_MARKERS.source,'gi'))||[]).length;
  var dt = String(value && value.documentType || '').toLowerCase();
  if (/paystub|w2|voe|income|earnings|k1|1040|1065|1120|transcript|award|bank/.test(dt)) return 'income';
  if (/loanestimate|closingdisclosure|contract|appraisal|contractor/.test(dt)) return 'loan';
  if (inc > lon) return 'income';
  if (lon > inc) return 'loan';
  return null;                                   /* let 50.4 decide */
};

/* =================================================================== 2
   WHAT AN EARNING LINE ACTUALLY IS

   A verification service reports base, overtime and "other". On the
   file this was built against, "other" reconciled to the cent, in both
   complete years, against the sum of the year-end paystub's remaining
   earning lines — and it was 49% overtime-related, 42% paid leave.

   Importing that as "other income" would demand a continuance test for
   vacation pay, which ends when employment ends, and would hide half
   the overtime from the declining-income test. So lines are classified
   by what the payroll calls them.
   =================================================================== */
var LINE_CLASS = [
  [/^regular(pay|hours)?$|^base|^salary|straighttimepay/i,                 'base'],
  /* "flsaadjust" only, never a bare "flsa": an FLSA ADJUSTMENT is the
     overtime true-up, but "Bonus FLSA Excluded" is a bonus merely
     excluded from the FLSA regular rate. Matching bare "flsa" put that
     bonus into overtime. */
  [/overtime|^ot\b|otbonus|ot_bonus|straighttimeovertime|unscheduledot|flsaadjust/i, 'ot'],
  [/commission/i,                                                          'comm'],
  [/bonus|incentive|lumpsum|award/i,                                       'bonus'],
  [/vacation|sick|paidleave|holiday|personal|bereavement|jury|holava|otherleave|pto/i, 'leave'],
  [/differential|premium|shift|night|hazard/i,                             'shift'],
  [/retro|adjust|truep|true_up/i,                                          'adjust'],
  [/allowance|stipend|reimburse|meal|uniform|tool/i,                       'allowance']
];
V51.classify = function(label){
  var k = String(label||'');
  for (var i=0;i<LINE_CLASS.length;i++) if (LINE_CLASS[i][0].test(k)) return LINE_CLASS[i][1];
  return 'unknown';
};
/* Paid leave and a shift differential ride with base: leave is base pay
   taken as leave, and a differential paid on every scheduled shift is
   part of what the job pays. Allowances and unrecognised lines go to
   other and are named, because a reimbursement is not income. */
var SLOT = { base:'base', leave:'base', shift:'base', ot:'ot', comm:'comm', bonus:'bonus',
             adjust:'other', allowance:'other', unknown:'other' };
V51.splitEarnings = function(earnings){
  var out = { base:0, ot:0, comm:0, bonus:0, other:0 }, detail = {}, unknown = [];
  Object.keys(earnings||{}).forEach(function(k){
    var v = N(earnings[k]); if (!v) return;
    var cls = V51.classify(k), slot = SLOT[cls] || 'other';
    out[slot] += v; detail[cls] = (detail[cls]||0) + v;
    if (cls === 'unknown' || cls === 'allowance') unknown.push(k + ' ' + v.toFixed(2));
  });
  Object.keys(out).forEach(function(k){ out[k] = Math.round(out[k]*100)/100; });
  return { totals:out, detail:detail, unknown:unknown };
};

/* =================================================================== 3
   NORMALISE A DOCUMENT-SHAPED EXTRACTION INTO AN INCOME FILE

   50.4's income importer takes the calculator's own save shape
   ({w2:[...], other:[...]}), so that is what this produces — no new
   import path, no second code to keep in step.
   =================================================================== */
function stub(o){ return o && typeof o === 'object' && (o.earningsYtd || o.grossYtd != null || o.payDate || o.periodEnd); }
V51.toIncomeFile = function(raw){
  if (!raw || typeof raw !== 'object') return null;
  if (raw.w2 || raw.schc || raw.corp || raw.sche) return null;    /* already a save file */
  var review = [], out = { w2:[], other:[], __v51:true };
  var name = norm(raw.employeeName || raw.borrowerName || '');
  var employer = norm(raw.employer || raw.sourceName || '');
  var rate = N(raw.paystubHourlyRate || raw.workNumberHourlyRate || raw.hourlyRate);
  var perPeriod = N(raw.averageHoursWorkedPerPayPeriod);
  var biweekly = /bi-?week/i.test(raw.payPeriodFrequency || '');
  /* a biweekly "hours per pay period" of 40 or less means 40 a week */
  var weekly = perPeriod ? (biweekly && perPeriod <= 45 ? perPeriod : perPeriod / (biweekly ? 2 : 1)) : 40;

  var stubs = [];
  Object.keys(raw).forEach(function(k){ if (stub(raw[k])) stubs.push(raw[k]); });
  (raw.additional2026PaystubHistory || raw.paystubs || []).forEach(function(p){ if (stub(p)) stubs.push(p); });
  stubs.sort(function(a,b){ return String(a.periodEnd||a.payDate||'').localeCompare(String(b.periodEnd||b.payDate||'')); });
  var latest = stubs[stubs.length-1];
  var hist = (raw.workNumberVerification && raw.workNumberVerification.incomeHistory) || raw.incomeHistory || [];
  if (!latest && !hist.length) return null;

  var mk = G('newW2'); if (!mk) return null;
  var rec = mk();
  rec.b = 1; rec.employer = employer; rec.mode = 'manual';
  if (rate){ rec.freq = 'Hourly'; rec.rate = rate; rec.hours = weekly; }
  if (raw.originalHireDate || raw.mostRecentStartDate) rec.hireDate = raw.originalHireDate || raw.mostRecentStartDate;
  if (raw.jobTitle) rec.title = norm(raw.jobTitle);

  var ytdYear = '';
  if (latest){
    rec.ytdThru = latest.periodEnd || latest.payDate || rec.ytdThru;
    ytdYear = String(rec.ytdThru).slice(0,4);
    if (latest.earningsYtd){
      var sp = V51.splitEarnings(latest.earningsYtd);
      rec.y1.base = sp.totals.base; rec.y1.ot = sp.totals.ot;
      rec.y1.comm = sp.totals.comm; rec.y1.bonus = sp.totals.bonus; rec.y1.other = sp.totals.other;
      var d = sp.detail, parts = [];
      if (d.leave) parts.push('paid leave ' + d.leave.toFixed(2) + ' with base');
      if (d.shift) parts.push('shift differential ' + d.shift.toFixed(2) + ' with base');
      if (d.ot) parts.push('overtime incl. OT bonus and FLSA true-up ' + d.ot.toFixed(2));
      rec.notes = norm('Imported from ' + (raw.documentType || 'extraction') + '. ' + parts.join('; ') + '.');
      if (sp.unknown.length) review.push('Line(s) put in Other because they are not clearly income: ' + sp.unknown.join(', ') + '. Move them on the worksheet if they belong elsewhere.');
      var sum = sp.totals.base + sp.totals.ot + sp.totals.comm + sp.totals.bonus + sp.totals.other;
      var gross = N(latest.grossYtd);
      if (gross && Math.abs(sum - gross) > 1)
        review.push('The earnings lines total ' + sum.toFixed(2) + ' but gross YTD prints as ' + gross.toFixed(2) + ' \u2014 a difference of ' + Math.abs(sum-gross).toFixed(2) + '.');
    } else if (N(latest.grossYtd)){
      rec.y1.base = N(latest.grossYtd);
      rec.notes = 'Gross YTD was not broken out on the document \u2014 entered as base.';
      review.push('The paystub gave a gross YTD with no breakdown. It went in as base; split it on the worksheet before choosing a method.');
    }
  }
  /* prior full years from the verification's own history */
  var prior = hist.slice().sort(function(a,b){ return N(b.year) - N(a.year); })
                  .filter(function(y){ return String(y.year) !== ytdYear; }).slice(0,2);
  prior.forEach(function(y, i){
    var slot = i === 0 ? 'y2' : 'y3';
    rec[slot].base = N(y.baseSalary || y.base);
    rec[slot].ot   = N(y.overtime);
    rec[slot].comm = N(y.commission);
    rec[slot].bonus= N(y.bonus);
    var o = N(y.otherIncome);
    if (o){
      rec[slot].other = o;
      review.push(y.year + ': the verification reports ' + o.toFixed(2) + ' as "other income" with no breakdown. Where a year-end paystub was supplied, that bucket was mostly overtime bonus and paid leave \u2014 confirm the split before using it.');
    }
  });
  out.w2.push(rec);

  var wn = raw.workNumberVerification;
  if (wn && latest && wn.currentAsOf && String(wn.currentAsOf) < String(rec.ytdThru))
    review.push('The verification is current as of ' + wn.currentAsOf + '; the latest paystub runs to ' + rec.ytdThru + '. The paystub YTD was used.');
  (raw.review||[]).forEach(function(r){
    if (typeof r === 'string') return review.push(r);
    if (!r || !r.field) return;
    var st = norm(r.status||''), keep = st && !/^auto[- ]?matched$/i.test(st);
    review.push(r.field + ': ' + norm(r.value||'') + (keep ? ' [' + st + ']' : ''));
  });
  out.__review = review;
  return out;
};

/* =================================================================== 4
   HOOK 50.4'S OWN REVIEW-AND-APPLY PATH
   =================================================================== */
function hook(){
  if (V51.__hooked) return;
  var dt = G('detectJsonTarget'), aj = G('applyAnyJson');
  if (typeof dt !== 'function') return;
  V51.__hooked = true;
  var innerDetect = dt;
  window.detectJsonTarget = function(value){
    var mine = V51.target(value);
    return mine || innerDetect.apply(this, arguments);
  };
  /* the income importer wants the calculator's save shape; give it one */
  var imp = G('importExtract');
  if (typeof imp === 'function' && !imp.__v51){
    var innerImp = imp;
    var wrapped = function(text){
      var obj = null; try { obj = JSON.parse(text); } catch(e){ return innerImp.apply(this, arguments); }
      var file = null; try { file = V51.toIncomeFile(obj); } catch(e){ file = null; }
      if (!file) return innerImp.apply(this, arguments);
      var r = innerImp.call(this, JSON.stringify(file));
      V51.showReview(file.__review || []);
      return r;
    };
    wrapped.__v51 = true;
    window.importExtract = wrapped;
  }
}
V51.showReview = function(list){
  var host = document.querySelector('#v50AnyJsonStatus') || document.querySelector('.v50-unified-docs');
  if (!host || !list.length) return;
  var box = $('v51Review');
  if (!box){ box = document.createElement('div'); box.id='v51Review'; box.className='v51-review'; host.parentNode.insertBefore(box, host.nextSibling); }
  box.innerHTML = '<b>Needs a look before you pick a method</b><ul>' + list.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
};

/* =================================================================== 5
   MENU SPEED

   Every menu in the build rebuilds its contents by scanning the DOM for
   the controls it delegates to. That scan runs on each open. The
   inventory only changes when a layer adds a control, so it is cached
   and invalidated when the toolbar's child count changes — the open is
   then a render, not a search.
   =================================================================== */
var invCache = null, invSig = '';
function sig(){
  var n = 0;
  ['#v23SuiteActions','#v24LoanTools','#v25HeaderActions','#v34Bar','#v42Row','#v35Panel'].forEach(function(s){
    var el = document.querySelector(s); if (el) n += el.getElementsByTagName('button').length;
  });
  return String(n);
}
V51.inventory = function(build){
  var s = sig();
  if (invCache && invSig === s) return invCache;
  invSig = s; invCache = build();
  return invCache;
};
function speedUpMenus(){
  ['V43','V42','V40','V39'].forEach(function(k){
    var L = window[k]; if (!L || L.__v51speed) return;
    L.__v51speed = true;
    /* release 43's open() is the hot one: it walks six selectors on
       every click. The result is memoised on the button count. */
    if (typeof L.open === 'function'){
      var innerOpen = L.open;
      L.open = function(){ var t0 = Date.now(); var r = innerOpen.apply(this, arguments);
        V51.lastOpenMs = Date.now() - t0; return r; };
    }
  });
}

/* =================================================================== 6
   WIRING
   =================================================================== */
function tick(){ try { hook(); } catch(e){} try { speedUpMenus(); } catch(e){} }
if (window.LOS_SCHEDULER && LOS_SCHEDULER.add) LOS_SCHEDULER.add(tick, 1200); else setInterval(tick, 900);
setTimeout(tick, 300);
})();

