/* =====================================================================
   Release 46 — the big metric cards first, more of them, and an
   assistant panel with a prompt library and a copy button.
   Additive over 45.
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
var V46 = window.V46 = { version:'46.0' };

/* =================================================================== 1
   METRIC CARDS — first thing in the control centre, and more of them

   Release 44 put its four large cards at the bottom of the Scenario
   control centre, under the fields. They are the summary a person reads
   before touching anything, so they go directly under the title. Four
   more join them, each a live row that opens its source, in the same
   icon-and-figure card.
   =================================================================== */
var IC = {
  home:'<svg viewBox="0 0 16 16"><path d="M6.906.664a1.749 1.749 0 0 1 2.187 0l5.25 4.2c.415.332.657.835.657 1.367v7.019A1.75 1.75 0 0 1 13.25 15h-3.5a.75.75 0 0 1-.75-.75V9H7v5.25a.75.75 0 0 1-.75.75h-3.5A1.75 1.75 0 0 1 1 13.25V6.23c0-.531.242-1.034.657-1.366Z"/></svg>',
  card:'<svg viewBox="0 0 16 16"><path d="M1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5C0 2.784.784 2 1.75 2ZM1.5 5.5v6.75c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V5.5Zm0-1.5h13v-.25a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25Z"/></svg>',
  chart:'<svg viewBox="0 0 16 16"><path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"/></svg>',
  cash:'<svg viewBox="0 0 16 16"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm.75 2.5a.75.75 0 0 0-1.5 0V3c-1.53.164-2.5 1.113-2.5 2.5 0 1.6 1.35 2.115 2.5 2.4v2.55c-.55-.108-1-.35-1-.95a.75.75 0 0 0-1.5 0c0 1.387.97 2.336 2.5 2.5v.5a.75.75 0 0 0 1.5 0V13c1.53-.164 2.5-1.113 2.5-2.5 0-1.6-1.35-2.115-2.5-2.4V5.55c.55.108 1 .35 1 .95a.75.75 0 0 0 1.5 0c0-1.387-.97-2.336-2.5-2.5Z"/></svg>',
  pct:'<svg viewBox="0 0 16 16"><path d="M13.78 2.22a.75.75 0 0 1 0 1.06l-10.5 10.5a.75.75 0 1 1-1.06-1.06l10.5-10.5a.75.75 0 0 1 1.06 0ZM4.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm7 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/></svg>',
  check:'<svg viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.751.751 0 0 0-.018-1.042.751.751 0 0 0-1.042-.018L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z"/></svg>'
};
function card(label, value, mode, note, icon){
  return '<button type="button" class="v35-live-row v46-card" data-v35-label="' + esc(label) + '" data-v35-mode="' + esc(mode) + '">'
    + '<i class="v46-ic">' + IC[icon] + '</i><span class="v46-body"><small>' + esc(label) + '</small><b>' + value + '</b><em>' + esc(note||'') + '</em></span><i class="v46-chev">\u203A</i></button>';
}
function metricCards(){
  var punch = $('v44PunchIn'), strip = $('v44MetricStrip'); if (!punch || !strip) return false;
  var head = punch.querySelector('.v44-punch-head');
  if (head && head.nextElementSibling !== strip) head.parentNode.insertBefore(strip, head.nextSibling);
  var s = store(); if (!s) return true;
  var o = s.outputs || {}, p = o.payment || {}, cash = o.cash || {}, a = o.aus || {}, mmw = o.mmw || {};
  var extra = $('v46Extra');
  if (!extra){ extra = document.createElement('div'); extra.id = 'v46Extra'; extra.className = 'v44-metric-strip v46-strip'; strip.parentNode.insertBefore(extra, strip.nextSibling); }
  var html = card('Monthly payment', usd(p.totalMonthlyPayment,2), 'setup', 'P&I, MI, taxes and insurance', 'card')
    + card('Cash to close', usd(cash.cashToClose,2), 'closing', 'After credits and deposits', 'cash')
    + card('LTV', N(p.currentLtv) ? pct(p.currentLtv,2) : '\u2014', 'maxmortgage', N(o.value && o.value.valueBasis) ? 'on ' + usd(o.value.valueBasis) : 'value basis', 'pct')
    + card('Back-end DTI', N(a.backEndDti) ? pct(a.backEndDti,1) : 'Enter income', 'income', N(a.backEndLimit) ? 'cap ' + pct(a.backEndLimit,1) : 'against the programme cap', 'check');
  if (extra.__sig !== html){ extra.__sig = html; extra.innerHTML = html; }
  strip.classList.add('v46-strip');
  return true;
}

/* =================================================================== 2
   THE ASSISTANT PANEL — a prompt library, and a copy button

   The panel had one route: build a prompt from a document already
   loaded. Now it also carries a library — one generic reading prompt
   and one per document type — chosen from a select, filled into the
   box, copied with a button. Every prompt asks for JSON only, with the
   keys this file actually imports, and tells the assistant not to
   guess at blanks.
   =================================================================== */
var RULES = '\n\nRules:\n- Return ONLY a JSON object. No prose, no markdown fence.\n- Numbers as plain numbers: no $ signs, no commas, no % signs.\n- Rates as printed (6.875), never as decimals (0.06875).\n- Dates as YYYY-MM-DD.\n- If a field is blank or unreadable on the document, OMIT the key. Never guess a value.\n- Copy what is printed. Do not calculate, average, annualise or reconcile anything.';
var PROMPTS = {
  generic: { label:'Generic — any loan document', text:
    'You are reading a mortgage loan document. Identify what it is and extract every dollar figure, date, rate, name and identifier it prints, using descriptive camelCase keys. Add a "documentType" key with one of: paystub, w2, 1040, scheduleC, k1, bankStatement, loanEstimate, closingDisclosure, creditReport, lease, appraisal, contractorEstimate, voe, awardLetter, other.' + RULES },
  paystub: { label:'Paystub / earnings statement', text:
    'You are reading a paystub. Return: {"documentType":"paystub","employer","employeeName","payDate","periodStart","periodEnd","payFrequency" (weekly/biweekly/semimonthly/monthly),"hourlyRate","hoursThisPeriod","grossThisPeriod","grossYtd","baseYtd","overtimeYtd","bonusYtd","commissionYtd","otherYtd","hireDate"}.' + RULES },
  w2: { label:'W-2', text:
    'You are reading an IRS Form W-2. Return: {"documentType":"w2","taxYear","employer","employerEin","employeeName","box1Wages","box3SocialSecurityWages","box5MedicareWages","box12Codes":[{"code","amount"}]}.' + RULES },
  tax1040: { label:'1040 with Schedule C', text:
    'You are reading a Form 1040 with Schedule C. Return: {"documentType":"1040","taxYear","filers":[names],"line1Wages","line8OtherIncome","adjustedGrossIncome","scheduleC":[{"businessName","line31NetProfit","line13Depreciation","line30HomeOffice","line24bMealsDeducted","line12Depletion","line9CarExpenses"}]}.' + RULES },
  bank: { label:'Bank statement — large deposits', text:
    'You are reading a bank statement. Return: {"documentType":"bankStatement","institution","accountLast4","statementStart","statementEnd","beginningBalance","endingBalance","averageBalance" (only if printed),"deposits":[{"date","amount","description"}]}. Include EVERY deposit, not only large ones; the file applies its own threshold.' + RULES },
  le: { label:'Loan Estimate(s) — one object per LE', text:
    'You are reading one or more Loan Estimates. Return {"version":"nmb-loan-extract/1","estimates":[ one object per LE ]}, each with: {"label","loanProgram","renovation","basePurchasePrice","totalLoanAmount","interestRate","termYears","principalAndInterest","monthlyMi","monthlyEscrow","totalMonthlyPayment","insuranceAnnual","totalClosingCosts","loanCostsD","otherCostsI","closingCostsFinanced" (positive),"cashToClose" (keeps its sign),"points","originationFee","apr","dateIssued"}.' + RULES },
  credit: { label:'Credit report — tradelines', text:
    'You are reading a tri-merge credit report. Return: {"documentType":"creditReport","scores":{"equifax","experian","transunion"},"tradelines":[{"creditor","type" (mortgage/auto/lease/student/revolving/installment/collection),"balance","monthlyPayment","monthsRemaining" (if printed),"creditLimit","late30","late60","late90","pastDue","disputed":true/false,"authorizedUser":true/false,"dateOpened"}],"inquiriesLast12Months","publicRecords":[{"type","amount","date"}]}.' + RULES },
  lease: { label:'Lease agreement', text:
    'You are reading a residential lease. Return: {"documentType":"lease","propertyAddress","landlord","tenants":[names],"leaseStart","leaseEnd","monthlyRent","securityDeposit","utilitiesIncluded":[list],"unitCount" (if the building has more than one)}.' + RULES },
  appraisal: { label:'Appraisal (1004 / 203k)', text:
    'You are reading a residential appraisal. Return: {"documentType":"appraisal","propertyAddress","effectiveDate","opinionOfValue","asRepairedValue" (if a subject-to appraisal),"grossLivingArea","siteArea","yearBuilt","units","condition","comparables":[{"address","salePrice","saleDate","grossLivingArea","adjustedValue"}]}.' + RULES },
  contractor: { label:'Contractor estimate / bid', text:
    'You are reading a contractor estimate for a renovation. Return: {"documentType":"contractorEstimate","contractor","licenseNumber","propertyAddress","estimateDate","lineItems":[{"item","description","amount"}],"total","paymentTerms","drawSchedule":[{"milestone","amount"}] (only if printed)}.' + RULES },
  voe: { label:'Work Number / written VOE', text:
    'You are reading an employment verification. Return: {"documentType":"voe","employer","employeeName","hireDate","position","employmentStatus","payFrequency","baseRate","currentYearBase","currentYearOvertime","currentYearBonus","currentYearCommission","priorYearTotal","twoYearsPriorTotal","verifiedOn"}.' + RULES },
  award: { label:'Social Security / pension award letter', text:
    'You are reading a benefit award letter. Return: {"documentType":"awardLetter","agency","beneficiary","benefitType","monthlyBenefit","effectiveDate","medicarePremiumDeducted","taxable":true/false/unknown}.' + RULES }
};
V46.pick = function(k){ var p = PROMPTS[k]; var box = $('v9PromptBox'); if (!p || !box) return; box.value = p.text; box.dispatchEvent(new Event('input',{bubbles:true})); };
V46.copy = function(){ var box = $('v9PromptBox'); if (!box || !box.value.trim()) return say('Nothing to copy','Pick a prompt or build one from a document first.','warn',4000);
  var done = function(){ say('Prompt copied','Paste it to the assistant with the document, then paste the JSON back here.','good',5000); };
  try { navigator.clipboard.writeText(box.value).then(done, function(){ box.select(); document.execCommand && document.execCommand('copy'); done(); }); } catch(e){ box.select(); try { document.execCommand('copy'); } catch(x){} done(); } };
function aiPanel(){
  var box = $('v9PromptBox'); if (!box || $('v46Library')) return false;
  var lbl = box.previousElementSibling;
  var bar = document.createElement('div'); bar.id = 'v46Library'; bar.className = 'v46-lib';
  bar.innerHTML = '<label>Prompt library</label><select id="v46Pick" class="cell-input"><option value="">Choose a prompt\u2026</option>'
    + Object.keys(PROMPTS).map(function(k){ return '<option value="' + k + '">' + esc(PROMPTS[k].label) + '</option>'; }).join('')
    + '</select><button type="button" class="btn btn-primary btn-sm" onclick="V46.copy()">Copy prompt</button>'
    + '<span class="v46-hint">Generic reads anything; the specific ones ask for exactly the keys this file imports.</span>';
  (lbl && /prompt/i.test(lbl.textContent||'') ? lbl : box).parentNode.insertBefore(bar, lbl && /prompt/i.test(lbl.textContent||'') ? lbl : box);
  $('v46Pick').onchange = function(){ V46.pick(this.value); };
  return true;
}
V46.prompts = PROMPTS;

function tick(){ try { metricCards(); } catch(e){} try { aiPanel(); } catch(e){} }
if (window.LOS_SCHEDULER && LOS_SCHEDULER.add) LOS_SCHEDULER.add(tick, 1200); else setInterval(tick, 900);
setTimeout(tick, 240);
})();
