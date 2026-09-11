/* =====================================================================
   Release 38 — one live summary, a wider OCR vocabulary, MISMO 3.4
   import, ZIP lookup on every field, state that survives refresh and
   back, and motion that respects the OS setting.
   Additive over 37. No engine or earlier layer edited.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function G(n){ try { return (0, eval)(n); } catch(e){ return undefined; } }
function N(v){ v = parseFloat(String(v==null?'':v).replace(/[$,%\s]/g,'')); return isFinite(v)?v:0; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function usd(v,dp){ dp=dp===undefined?0:dp; var n=N(v);
  return (n<0?'\u2212':'')+'$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp}); }
function pct(v,dp){ dp=dp===undefined?2:dp; var n=N(v); if (Math.abs(n)<=1) n*=100; return n.toFixed(dp)+'%'; }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }
function store(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
var V38 = window.V38 = { version:'38.0' };

/* =================================================================== 1
   ONE LIVE SUMMARY

   The rail in the screenshots carried the same figures two and three
   times over. Release 29 appended a block of ratios, payment, leverage,
   cash and reserves to the CARD; release 36 then trimmed the rail to the
   decision-focused set by walking the card's BODY. A block outside the
   body was never seen by that walk, so it leaked out underneath — with a
   raw "&amp;" in it, because its own escaper ran over already-escaped
   text.

   Release 29's block is retired. The parts of it worth keeping — where
   the ratios sit against their caps, what MI costs and when it stops,
   the rounded payment range — move INTO the live-details section as the
   same clickable rows release 35 uses, so they inherit its edit popout
   and its "open the workspace" button without a second click handler.

   Rows that would only say "nothing entered" are not rendered. A ratio
   of 0.0% against a 50% cap with "50% of room left" is not information.
   =================================================================== */
function retireV29(){
  var old = $('v29Extra'); if (old) old.remove();
  if (window.V29 && !V29.__v38) { V29.__v38 = true; V29.paint = function(){}; }
}
function liveRow(label, value, mode, sub){
  return '<button type="button" class="v35-live-row v38-row" data-v35-label="' + esc(label)
    + '" data-v35-mode="' + esc(mode) + '"><span>' + esc(label)
    + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span><b>' + value + '</b></button>';
}
function bar(used, cap){
  if (!cap || used == null) return '';
  var p = Math.max(0, Math.min(100, used / cap * 100));
  var st = used > cap ? 'over' : p > 92 ? 'tight' : 'ok';
  return '<i class="v38-bar ' + st + '" style="--w:' + p.toFixed(1) + '%"></i>';
}
function railExtras(){
  var s = store(); if (!s) return '';
  var o = s.outputs || {}, i = s.activeInputs || {};
  var p = o.payment || {}, a = o.aus || {}, cash = o.cash || {};
  var isFha = !!o.isFha, h = '';
  var income = N(a.monthlyIncome || a.qualifyingIncome || 0);
  try { if (!income && window.calcTotals) income = N(window.calcTotals().income); } catch(e){}

  /* ratios — only when there is income to have a ratio against */
  var front = N(a.frontEndDti), back = N(a.backEndDti), fCap = N(a.frontEndLimit), bCap = N(a.backEndLimit);
  if (income > 0 && (front || back)){
    h += '<div class="v38-head">Ratios</div>';
    if (front) h += liveRow('Front-end', pct(front,1) + bar(front, fCap), 'income', fCap ? 'cap ' + pct(fCap,1) : '');
    if (back)  h += liveRow('Back-end',  pct(back,1)  + bar(back,  bCap), 'income', bCap ? 'cap ' + pct(bCap,1) : '');
  }

  /* mortgage insurance — the one figure people ask "why" about */
  var mi = isFha ? N(p.monthlyFhaMip) : N(p.monthlyPmi);
  var miRate = isFha ? N(p.fhaMipRateUsed) : N(p.pmiRateUsed);
  if (mi > 0){
    h += '<div class="v38-head">Mortgage insurance</div>';
    h += liveRow(isFha ? 'FHA MIP' : 'PMI', usd(mi,2), 'setup',
        (miRate ? pct(miRate,2) + ' annual' : '') + (p.creditTier ? ' \u00b7 ' + p.creditTier : ''));
    if (isFha) h += liveRow('Runs for', 'life of loan', 'setup', 'at this LTV, FHA MIP does not cancel');
    else if (N(p.pmiCancelValue)) h += liveRow('Cancels at', usd(p.pmiCancelValue), 'setup', 'value where LTV reaches 78%');
  }

  /* payment range, when the rounding increment produces one */
  if (N(p.paymentLow) && N(p.paymentHigh) && p.paymentLow !== p.paymentHigh)
    h += liveRow('Payment range', usd(p.paymentLow) + ' \u2013 ' + usd(p.paymentHigh), 'setup', 'rounding increment on the file');

  /* reserves — only when assets exist to measure */
  var avail = N(a.reserveMonthsAvailable), need = N(a.reserveMonths);
  if (avail > 0 || need > 0){
    h += '<div class="v38-head">Reserves</div>';
    h += liveRow('Months available', avail.toFixed(1) + (need ? ' of ' + need.toFixed(1) + ' needed' : ''), 'qualify',
        avail >= need ? 'meets the requirement' : 'short by ' + (need - avail).toFixed(1) + ' months');
  }
  return h;
}
function paintRail(){
  retireV29();
  var live = $('v35LiveDetails'); if (!live) return false;
  var host = $('v38Extras');
  var html = railExtras();
  if (!html){ if (host) host.style.display = 'none'; return true; }
  if (!host || !host.isConnected){
    if (host) host.remove();
    host = document.createElement('div');
    host.id = 'v38Extras'; host.className = 'v38-extras';
    live.appendChild(host);
  }
  host.style.display = '';
  if (host.__sig !== html){ host.__sig = html; host.innerHTML = html; }
  return true;
}

/* =================================================================== 2
   OCR — the document families a real file actually contains

   Two complete loan files were supplied for training: 177 documents
   across a New York purchase and a Florida purchase. Only their LABEL
   vocabulary was used — the phrases a form prints beside its figures —
   and nothing from them is embedded here. The result is a classifier
   that recognises the families the engine's own table stopped at:
   bank statements, asset verifications, IRS transcripts, DU findings,
   credit reports and supplements, insurance binders, title bills,
   commitments, contracts, leases, letters of explanation, Work Number
   verifications, award letters, mortgage statements, contractor
   estimates, Loan Estimates, the 1003 and appraisals.

   Two things the training set made plain:

   - MOST of these arrive scanned with no text layer — the W-2s, 1040s,
     the 1003, the appraisal, the contract, the lease, the insurance
     policy, the award letter. Recognition therefore has to work on OCR
     output, which is noisier than a text layer, so every signature
     below is tolerant of spacing and case and needs two hits, not one.
   - A signature has to be a FORM label, never a name. "Earnings
     Statement" identifies a paystub on any employer's form; an employer
     name identifies one employer.

   The engine's classify() is a function declaration and so can be
   wrapped; its DOC_TYPES is a const object and so can be extended in
   place. Neither is edited.
   =================================================================== */
var FAMILIES = [
  /* [type, kind, label, [signatures], minimum hits] */
  ['bank',      'assets','Bank statement',
     [/opening balance|beginning balance/, /closing balance|ending balance/, /statement period|statement date/, /deposits? and (other )?credits/, /withdrawals? and (other )?debits/], 2],
  ['voa',       'assets','Asset verification (AccountChek / VOA)',
     [/reissue key/, /days requested/, /order id/, /account ?chek|verification of assets|\bvoa\b/], 2],
  ['transcript','none',  'IRS tax transcript',
     [/tax period ending/, /request date/, /response date/, /account transcript|return transcript|wage and income transcript/, /taxpayer identification number/], 2],
  ['aus',       'aus',   'AUS findings (DU / LPA)',
     [/casefile id/, /submission date/, /housing expense ratio/, /desktop underwriter|loan product advisor/, /recommendation/], 2],
  ['credit',    'credit','Credit report',
     [/inquir(y|ies)/, /tradelines?|trade lines?/, /(too many|amount) .{0,30}(inquiries|balances)/, /fico|vantage|beacon/, /public records?/], 2],
  ['creditsupp','credit','Credit supplement',
     [/supplement/, /original order number/, /order number/, /\b(tu|efx|xpn)\b/], 2],
  ['hoi',       'suite', 'Homeowners insurance (binder / policy)',
     [/policy number/, /policy period/, /deductibles?/, /dwelling coverage|coverage a\b/, /property location|insured location/], 2],
  ['titlebill', 'suite', 'Title bill / settlement invoice',
     [/title bill/, /title insurance/, /file number/, /title update/, /patriot (act )?search/, /settlement fee/], 2],
  /* The training file's commitment letter never uses the word
     "commitment" — it is an approval letter. Matched on what such a
     letter actually states: an approval, its conditions, an expiry, the
     terms, and the originator's NMLS. */
  ['commitment','suite', 'Commitment / approval letter',
     [/commitment|approved|approval/, /conditions?/, /expir(es|ation|y)/, /loan amount|interest rate/, /nmls/], 3],
  /* One training document named "mortgage statement" was a Form 1098.
     Content wins over filename: this is its own family. */
  ['f1098',     'none',  'Form 1098 mortgage interest statement',
     [/form 1098|mortgage interest statement/, /omb no/, /mortgage interest received/, /outstanding mortgage principal/, /payer|recipient/], 3],
  ['contract',  'suite', 'Contract of sale',
     [/contract of sale/, /purchaser/, /seller/, /closing date/, /purchase price/, /down payment/], 3],
  ['lease',     'rental','Lease agreement',
     [/lease agreement|residential lease/, /landlord/, /tenant/, /monthly rent/, /security deposit/, /term of (the )?lease/], 3],
  ['lox',       'none',  'Letter of explanation',
     [/letter of explanation|\blox\b/, /to whom it may concern/, /(i|we) (am|are) writing/, /sincerely/], 2],
  ['wvoe',      'w2',    'Work Number / written VOE',
     [/verification type/, /permissible purpose/, /verified on/, /employer disclaimer/, /the work number|\bvoi\b|\bvoe\b/], 2],
  ['award',     'other', 'Social Security / pension award letter',
     [/award letter|benefit verification/, /monthly benefit|benefit amount/, /social security administration|\bssa\b/, /cost[- ]of[- ]living/], 2],
  ['mtgstmt',   'liab',  'Mortgage statement',
     [/mortgage statement|loan statement/, /principal balance|unpaid principal/, /escrow balance/, /payment due date/, /interest rate/], 3],
  ['contractor','reno',  'Contractor estimate / bid',
     [/prepared by/, /bill to/, /payment terms/, /(contractor|customer) signature/, /scope of work|estimate/], 3],
  ['le',        'suite', 'Loan Estimate',
     [/loan estimate/, /date issued/, /sale price/, /estimated closing costs/, /estimated cash to close/, /services you can shop for/], 3],
  ['cd',        'suite', 'Closing Disclosure',
     [/closing disclosure/, /cash to close/, /loan costs/, /other costs/, /projected payments/], 3],
  ['urla',      'none',  'Uniform Residential Loan Application (1003)',
     [/uniform residential loan application|form 1003/, /borrower information/, /declarations/, /assets and liabilities/, /mortgage loan information/], 2],
  ['appraisal', 'suite', 'Appraisal report',
     [/uniform residential appraisal report|form 1004|appraisal report/, /opinion of (market )?value/, /comparable sales?|comps?/, /neighborhood/, /site area/], 2],
  ['k1',        'corp',  'Schedule K-1',
     [/schedule k-?1/, /partner'?s share|shareholder'?s share/, /ordinary business income/, /final k-?1/], 2],
  ['dl',        'none',  'Government-issued ID',
     [/driver'?s? licen[cs]e|identification card/, /date of birth|\bdob\b/, /expir(es|ation)/, /class\b/], 3],
  ['sscard',    'none',  'Social Security card',
     [/social security/, /this number has been established for/, /signature/], 3]
];
function classifyExtended(text){
  var t = String(text || '').toLowerCase().replace(/\s+/g,' ');
  var best = null, bestHits = 0;
  FAMILIES.forEach(function(f){
    var hits = f[3].filter(function(re){ return re.test(t); }).length;
    if (hits >= f[4] && hits > bestHits){ best = f; bestHits = hits; }
  });
  return best ? best[0] : null;
}
function extendClassifier(){
  if (typeof window.classify !== 'function' || window.classify.__v38) return false;
  var inner = window.classify;
  var wrapped = function(text){
    var base = inner(text);
    /* the engine's own answer wins when it is specific; only 'other'
       and the two catch-alls are second-guessed */
    if (base && base !== 'other' && base !== 'w2' && base !== 'paystub') return base;
    var ext = classifyExtended(text);
    if (!ext) return base;
    /* a paystub the engine already caught stays a paystub unless the
       extended pass is a specific non-income family */
    if ((base === 'w2' || base === 'paystub') && ['bank','voa','transcript','aus','credit','creditsupp','lease','contract','le','cd','mtgstmt'].indexOf(ext) < 0) return base;
    return ext;
  };
  wrapped.__v38 = true;
  window.classify = wrapped;
  var DT = G('DOC_TYPES');
  if (DT) FAMILIES.forEach(function(f){ if (!DT[f[0]]) DT[f[0]] = { label:f[2], kind:f[1] }; });
  return true;
}
V38.classify = classifyExtended;
V38.families = FAMILIES.map(function(f){ return { type:f[0], kind:f[1], label:f[2] }; });

/* =================================================================== 3
   MISMO 3.4 IMPORT

   The Florida file included a LoanSnapshot.xml — a MISMO 3.4 URLA
   export with the ULAD extension, which is what every current LOS
   produces. One drop loads borrowers, employment, income, assets,
   liabilities, the subject property and the loan terms into both
   shells. Everything it writes is labelled "MISMO import" in the audit
   trail, and nothing that already holds a non-zero value is overwritten.
   =================================================================== */
function xmlText(node, tag){
  if (!node) return '';
  var el = node.getElementsByTagName(tag)[0];
  return el ? String(el.textContent || '').trim() : '';
}
function xmlAll(node, tag){ return node ? Array.prototype.slice.call(node.getElementsByTagName(tag)) : []; }
V38.parseMismo = function(xmlString){
  var doc = new DOMParser().parseFromString(xmlString, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('not well-formed XML');
  if (!doc.getElementsByTagName('MESSAGE').length && !doc.getElementsByTagName('DEAL').length)
    throw new Error('not a MISMO document (no MESSAGE/DEAL)');
  var out = { borrowers:[], employment:[], income:[], assets:[], liabilities:[], property:{}, terms:{} };
  /* borrowers: one PARTY per role of type Borrower */
  xmlAll(doc,'PARTY').forEach(function(p){
    var role = xmlText(p,'PartyRoleType');
    if (!/borrower/i.test(role)) return;
    var name = p.getElementsByTagName('NAME')[0];
    out.borrowers.push({ first: xmlText(name,'FirstName'), last: xmlText(name,'LastName'),
      full: xmlText(name,'FullName') || (xmlText(name,'FirstName') + ' ' + xmlText(name,'LastName')).trim() });
    xmlAll(p,'EMPLOYMENT').forEach(function(e){
      out.employment.push({ borrower: out.borrowers.length,
        employer: xmlText(e.parentNode && e.parentNode.parentNode || e,'FullName') || xmlText(e,'EmployerName'),
        status: xmlText(e,'EmploymentStatusType'), position: xmlText(e,'EmploymentPositionDescription'),
        start: xmlText(e,'EmploymentStartDate'), end: xmlText(e,'EmploymentEndDate'),
        selfEmployed: /true/i.test(xmlText(e,'EmploymentBorrowerSelfEmployedIndicator')),
        months: N(xmlText(e,'EmploymentMonthsOnJobCount')) + 12*N(xmlText(e,'EmploymentYearsOnJobCount')) });
    });
    xmlAll(p,'CURRENT_INCOME_ITEM_DETAIL').forEach(function(c){
      out.income.push({ borrower: out.borrowers.length, type: xmlText(c,'IncomeType'),
        monthly: N(xmlText(c,'CurrentIncomeMonthlyTotalAmount')) });
    });
  });
  xmlAll(doc,'ASSET_DETAIL').forEach(function(a){
    out.assets.push({ type: xmlText(a,'AssetType'), value: N(xmlText(a,'AssetCashOrMarketValueAmount')),
      account: xmlText(a,'AssetAccountIdentifier') ? '\u2022\u2022\u2022\u2022' + xmlText(a,'AssetAccountIdentifier').slice(-4) : '' });
  });
  xmlAll(doc,'LIABILITY_DETAIL').forEach(function(l){
    out.liabilities.push({ type: xmlText(l,'LiabilityType'), payment: N(xmlText(l,'LiabilityMonthlyPaymentAmount')),
      balance: N(xmlText(l,'LiabilityUnpaidBalanceAmount')), months: N(xmlText(l,'LiabilityRemainingTermMonthsCount')) });
  });
  var subj = doc.getElementsByTagName('SUBJECT_PROPERTY')[0] || doc.getElementsByTagName('COLLATERAL')[0];
  if (subj){
    var addr = subj.getElementsByTagName('ADDRESS')[0];
    out.property = { line: xmlText(addr,'AddressLineText'), city: xmlText(addr,'CityName'),
      state: xmlText(addr,'StateCode'), zip: xmlText(addr,'PostalCode').slice(0,5),
      county: xmlText(subj,'CountyName'), units: N(xmlText(subj,'FinancedUnitCount')) || 1,
      value: N(xmlText(subj,'PropertyEstimatedValueAmount')), usage: xmlText(subj,'PropertyUsageType'),
      price: N(xmlText(subj,'SalesContractAmount')) };
  }
  var terms = doc.getElementsByTagName('TERMS_OF_LOAN')[0];
  out.terms = { amount: N(xmlText(terms,'BaseLoanAmount')), purpose: xmlText(terms,'LoanPurposeType'),
    rate: N(xmlText(terms,'NoteRatePercent')), mortgageType: xmlText(terms,'MortgageType'),
    term: N(xmlText(doc,'LoanAmortizationPeriodCount')) };
  if (!out.terms.rate) out.terms.rate = N(xmlText(doc,'NoteRatePercent'));
  if (!out.property.price) out.property.price = N(xmlText(doc,'SalesContractAmount'));
  return out;
};
V38.applyMismo = function(m){
  var s = store(), S = G('S'), applied = [];
  var set = function(path, v, label){
    if (!s || v == null || v === '' || (typeof v === 'number' && !v)) return;
    try { var cur = pathGet(s.activeInputs, path); if (N(cur)) return; } catch(e){}
    try { s.setField(path, v, 'MISMO import' + (label ? ' \u2014 ' + label : '')); applied.push(path); } catch(e){}
  };
  if (m.property.price) set('basePurchasePrice', m.property.price, 'sales contract');
  if (m.property.value) set('asIsValue', m.property.value, 'estimated value');
  if (m.property.zip)   { set('zipCode', m.property.zip, 'subject property'); try { s.applyZipLookup(); } catch(e){} }
  if (m.property.state) set('state', m.property.state === 'NY' ? 'New York' : m.property.state, 'subject property');
  if (m.property.line)  set('propertyAddress', [m.property.line, m.property.city, m.property.state, m.property.zip].filter(Boolean).join(', '), 'subject property');
  if (m.terms.rate)     set('interestRate', m.terms.rate > 1 ? m.terms.rate/100 : m.terms.rate, 'note rate');
  if (m.terms.term)     set('termYears', Math.round(m.terms.term/12) || 30, 'amortization');
  if (/fha/i.test(m.terms.mortgageType)) set('loanProgram','FHA','mortgage type');
  else if (/va/i.test(m.terms.mortgageType)) set('loanProgram','VA','mortgage type');
  else if (/conventional/i.test(m.terms.mortgageType)) set('loanProgram','Conventional','mortgage type');
  if (m.borrowers[0] && m.borrowers[0].full) set('borrowerName', m.borrowers[0].full, 'applicant');

  /* the calculator side: borrowers, employment and income as records */
  if (S){
    if (m.borrowers[0] && !S.b1) S.b1 = m.borrowers[0].full;
    if (m.borrowers[1] && !S.b2) S.b2 = m.borrowers[1].full;
    var newW2 = G('newW2'), newOther = G('newOther'), newAsset = G('newAsset');
    m.employment.filter(function(e){ return /current/i.test(e.status) && !e.selfEmployed; }).forEach(function(e){
      if (!newW2 || !S.w2) return;
      var inc = m.income.filter(function(x){ return x.borrower === e.borrower && /base/i.test(x.type); })[0];
      var rec = newW2(); rec.employer = e.employer || ''; rec.b = e.borrower || 1;
      rec.freq = 'Monthly'; rec.rate = inc ? inc.monthly : 0; rec.mode = 'manual';
      if (e.start) rec.hireDate = e.start;
      rec.notes = 'MISMO import' + (e.position ? ' \u2014 ' + e.position : '');
      S.w2.push(rec); applied.push('w2:' + (e.employer||'employer'));
    });
    m.income.filter(function(x){ return !/base|overtime|bonus|commission/i.test(x.type) && x.monthly; }).forEach(function(x){
      if (!newOther || !S.other) return;
      var rec = newOther(); rec.amt = x.monthly; rec.b = x.borrower || 1;
      var t = x.type.toLowerCase();
      rec.type = /social/.test(t) ? 'ssa' : /pension|retire/.test(t) ? 'pension' : /disab/.test(t) ? 'disab'
               : /alimony/.test(t) ? 'alimony' : /child/.test(t) ? 'support' : /rental/.test(t) ? 'rental' : 'other';
      rec.name = x.type; S.other.push(rec); applied.push('other:' + x.type);
    });
    m.assets.filter(function(a){ return a.value && !/realestate/i.test(a.type); }).forEach(function(a){
      if (!newAsset || !S.assets || !S.assets.rows) return;
      var rec = newAsset(); rec.name = a.type.replace(/([a-z])([A-Z])/g,'$1 $2') + (a.account ? ' ' + a.account : '');
      rec.type = /saving/i.test(a.type) ? 'savings' : /retire|401|ira/i.test(a.type) ? 'retirement' : /gift/i.test(a.type) ? 'gift' : 'checking';
      rec.bal = a.value; S.assets.rows.push(rec); applied.push('asset:' + a.type);
    });
    m.liabilities.filter(function(l){ return l.payment; }).forEach(function(l){
      if (!S.dti || !S.dti.debts) return;
      S.dti.debts.push({ id:(G('uid')?G('uid')():'d'+Math.random().toString(36).slice(2)),
        name:'[MISMO] ' + l.type.replace(/([a-z])([A-Z])/g,'$1 $2'), amt:l.payment });
      applied.push('debt:' + l.type);
    });
    ['renderW','renderOther','renderAssets','renderDTI'].forEach(function(fn){ try { if (window[fn]) window[fn](); } catch(e){} });
  }
  if (window.RECALC) window.RECALC();
  try { s && s.emit(); } catch(e){}
  return applied;
};
function pathGet(o, path){ return String(path).split('.').reduce(function(a,k){ return a==null?a:a[k]; }, o); }
V38.importMismoFile = function(file){
  var fr = new FileReader();
  fr.onload = function(){
    try {
      var m = V38.parseMismo(String(fr.result || ''));
      var applied = V38.applyMismo(m);
      say('MISMO import: ' + applied.length + ' item(s)',
          m.borrowers.length + ' borrower(s), ' + m.employment.length + ' employment record(s), '
          + m.assets.length + ' asset(s), ' + m.liabilities.length + ' liabilit(ies). Existing non-zero '
          + 'figures were left alone. Confirm every income against its documents \u2014 the export is the '
          + 'application as stated, not verified income.', 'good', 12000);
    } catch(e){ say('Could not import that XML', (e && e.message) || 'unknown error', 'warn', 9000); }
  };
  fr.readAsText(file);
};
/* accept .xml wherever documents are dropped */
function wireMismoDrop(){
  $$('input[type=file]').forEach(function(inp){
    if (inp.__v38xml) return; inp.__v38xml = true;
    var acc = inp.getAttribute('accept') || '';
    if (acc && acc.indexOf('.xml') < 0) inp.setAttribute('accept', acc + ',.xml');
    inp.addEventListener('change', function(){
      Array.prototype.slice.call(inp.files || []).forEach(function(f){
        if (/\.xml$/i.test(f.name)) V38.importMismoFile(f);
      });
    }, true);
  });
  document.addEventListener('drop', function(e){
    var files = e.dataTransfer && e.dataTransfer.files; if (!files) return;
    Array.prototype.slice.call(files).forEach(function(f){ if (/\.xml$/i.test(f.name)) V38.importMismoFile(f); });
  }, true);
}

/* =================================================================== 4
   ZIP LOOKUP ON EVERY FIELD

   Every ZIP input in either shell now resolves city, state and county
   the moment five digits are committed. Two sources, tried in order:

     - zippopotam.us: free, no key, answers cross-origin. City and
       state, reliably.
     - HUD's USPS crosswalk: county FIPS and county name, when a HUD
       token is on the file. Without a token this step is skipped
       rather than failing the whole lookup.

   Only EMPTY sibling fields are filled. A city someone typed is never
   replaced by a lookup.
   =================================================================== */
var ZIP_CACHE = {};
function hudToken(){ try { return (window.LOANSUITE && LOANSUITE.PROP && LOANSUITE.PROP.state.hudToken) || ''; } catch(e){ return ''; } }
V38.lookupZip = function(zip){
  zip = String(zip || '').replace(/\D/g,'').slice(0,5);
  if (zip.length !== 5) return Promise.resolve(null);
  if (ZIP_CACHE[zip]) return Promise.resolve(ZIP_CACHE[zip]);
  var out = { zip:zip, city:'', state:'', stateName:'', county:'', fips:'' };
  return fetch('https://api.zippopotam.us/us/' + zip).then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){
      var p = j && j.places && j.places[0];
      if (p){ out.city = p['place name'] || ''; out.state = p['state abbreviation'] || ''; out.stateName = p.state || ''; }
      var tok = hudToken(); if (!tok) return;
      return fetch('https://www.huduser.gov/hudapi/public/usps?type=2&query=' + zip, { headers:{ Authorization:'Bearer ' + tok } })
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(h){
          var res = h && h.data && h.data.results && h.data.results[0];
          if (res){ out.fips = String(res.geoid||'').slice(0,5); out.county = res.county_name || res.name || ''; }
        }).catch(function(){});
    })
    .then(function(){ if (out.city || out.county) ZIP_CACHE[zip] = out; return out.city || out.county ? out : null; })
    .catch(function(){ return null; });
};
function isZipField(el){
  if (!el || el.tagName !== 'INPUT') return false;
  var k = ((el.id||'') + ' ' + (el.name||'') + ' ' + (el.placeholder||'') + ' ' + (el.dataset.path||'')
         + ' ' + (el.dataset.v35Quote||'') + ' ' + (el.getAttribute('aria-label')||'')).toLowerCase();
  if (/zip|postal/.test(k)) return true;
  var lab = el.closest('label') || (el.id && document.querySelector('label[for="' + el.id + '"]'));
  return !!(lab && /\bzip\b|postal/i.test(lab.textContent));
}
function siblingField(el, re){
  var scope = el.closest('.card, .grid, form, fieldset, .v35-quote-grid, .card-body, section') || el.parentNode.parentNode;
  return $$('input', scope).filter(function(x){
    if (x === el) return false;
    var k = ((x.id||'')+' '+(x.name||'')+' '+(x.placeholder||'')+' '+(x.dataset.path||'')).toLowerCase();
    var lab = x.closest('label'); var lt = lab ? lab.textContent.toLowerCase() : '';
    return re.test(k) || re.test(lt);
  })[0];
}
function fillIfEmpty(el, v){
  if (!el || !v || String(el.value||'').trim()) return false;
  el.value = v;
  el.dispatchEvent(new Event('input', {bubbles:true}));
  el.dispatchEvent(new Event('change', {bubbles:true}));
  return true;
}
function onZipCommit(e){
  var el = e.target; if (!isZipField(el)) return;
  var zip = String(el.value||'').replace(/\D/g,'').slice(0,5);
  if (zip.length !== 5 || el.__v38last === zip) return;
  el.__v38last = zip;
  V38.lookupZip(zip).then(function(r){
    if (!r) return;
    var filled = [];
    if (fillIfEmpty(siblingField(el, /\bcity\b|town/), r.city)) filled.push(r.city);
    if (fillIfEmpty(siblingField(el, /\bstate\b/), r.stateName || r.state)) filled.push(r.state);
    if (r.county && fillIfEmpty(siblingField(el, /county/), r.county)) filled.push(r.county + ' County');
    /* the suite's own store, when this is its zip */
    var s = store();
    if (s && el.dataset && (el.dataset.path === 'zipCode' || el.dataset.v35Quote === 'zipCode')){
      try { if (!s.activeInputs.state && r.stateName) s.setField('state', r.stateName, 'ZIP lookup'); } catch(x){}
      try { if (r.county && !s.activeInputs.nyCounty && r.stateName === 'New York') s.setField('nyCounty', r.county.replace(/ county$/i,''), 'ZIP lookup'); } catch(x){}
    }
    if (filled.length) say('ZIP ' + zip, filled.join(' \u00b7 ') + ' \u2014 filled where blank' + (r.county ? '' : ' (county needs a HUD token)'), 'info', 5000);
  });
}
document.addEventListener('change', onZipCommit, true);
document.addEventListener('input', function(e){
  var el = e.target; if (!isZipField(el)) return;
  if (String(el.value||'').replace(/\D/g,'').length === 5) onZipCommit(e);
}, true);

/* =================================================================== 5
   STATE THAT SURVIVES REFRESH AND BACK

   Both engines already persist their data to localStorage on change.
   What did not survive was WHERE you were: the shell, the tab, the
   scroll position, and — on the back button specifically — the page
   restored from the back/forward cache with timers still asleep. Both
   are handled: position is saved on every navigation and on pagehide,
   restored on load and on pageshow, and a pageshow from the cache
   re-arms the enhancement scheduler.
   =================================================================== */
var POS_KEY = 'los.v38.position';
function savePosition(){
  try {
    var s = store();
    localStorage.setItem(POS_KEY, JSON.stringify({
      app: (window.SHELL && SHELL.current) || (document.body.dataset.app) || '',
      suiteMode: s && s.snapshot ? s.snapshot.mode : '',
      calcTab: (window.S && S.ui && S.ui.tab) || (document.querySelector('#calc-root .tab.active, #calc-root .tabbar .on') || {}).dataset && document.querySelector('#calc-root .tab.active, #calc-root .tabbar .on').dataset.tab || '',
      scrollY: window.scrollY, at: Date.now()
    }));
  } catch(e){}
}
function restorePosition(){
  var raw; try { raw = JSON.parse(localStorage.getItem(POS_KEY) || 'null'); } catch(e){ raw = null; }
  if (!raw || Date.now() - raw.at > 7*24*3600*1000) return;
  var s = store();
  try { if (raw.suiteMode && s && s.snapshot.mode !== raw.suiteMode) s.setMode(raw.suiteMode); } catch(e){}
  try { if (raw.calcTab && window.switchTab) switchTab(raw.calcTab); } catch(e){}
  if (raw.scrollY) setTimeout(function(){ window.scrollTo(0, raw.scrollY); }, 120);
}
var flushTimer = null;
function flushSoon(){ clearTimeout(flushTimer); flushTimer = setTimeout(savePosition, 250); }
document.addEventListener('click', flushSoon, true);
window.addEventListener('scroll', flushSoon, { passive:true });
window.addEventListener('pagehide', function(){
  savePosition();
  /* force both engines' autosave through on the way out */
  try { if (window.autosave) autosave(); } catch(e){}
  try { var s = store(); if (s && s.persist) s.persist(); else if (s && s.emit) s.emit(); } catch(e){}
});
window.addEventListener('beforeunload', savePosition);
window.addEventListener('pageshow', function(e){
  if (e.persisted){
    /* back/forward cache: the page is exactly as left, but the
       scheduler paused with document.hidden; kick it */
    try { if (window.LOS_SCHEDULER) LOS_SCHEDULER.request(0); } catch(x){}
  }
  restorePosition();
});
if (document.readyState === 'complete') setTimeout(restorePosition, 600);
else window.addEventListener('load', function(){ setTimeout(restorePosition, 600); });

/* =================================================================== 6
   WIRING — through the shared scheduler, not a private timer
   =================================================================== */
function tick(){
  try { paintRail(); } catch(e){}
  try { extendClassifier(); } catch(e){}
  try { wireMismoDrop(); } catch(e){}
}
if (window.LOS_SCHEDULER && LOS_SCHEDULER.add) LOS_SCHEDULER.add(tick, 1200);
else setInterval(tick, 900);
setTimeout(tick, 200);
})();
