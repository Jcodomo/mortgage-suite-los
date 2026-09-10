/* =====================================================================
   v30 — scenario presets with a renovation toggle, a real document
         generator set, tidier menus, and a rail that cannot drift.
   Additive. Nothing in an earlier layer is edited.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function norm(s){ return String(s||'').replace(/\s+/g,' ').trim().toUpperCase(); }
function N(v){ v = parseFloat(String(v==null?'':v).replace(/[$,%\s]/g,'')); return isFinite(v)?v:0; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function usd(v,dp){ dp=dp===undefined?0:dp; var n=N(v);
  return '$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp}); }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }
function store(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
var V30 = window.V30 = { version:'30.0' };

/* =================================================================== 1
   SCENARIO PRESETS

   Four starting points rather than two half-ones. The two existing chips
   only set a down payment percentage and left price, programme and
   renovation wherever they happened to be, so "FHA 3.5%" could land on a
   renovation file with somebody else's price still in it.

   Each preset now sets everything that defines it, and the renovation
   presets and the plain ones are explicit opposites: the plain two turn
   renovation OFF and zero the budget, the 203(k) and HomeStyle turn it
   on with a real number. A preset that leaves half the file behind is
   worse than no preset.

   Zip is a Nassau placeholder so taxes and jurisdiction resolve to
   something real while the file is being set up.
   =================================================================== */
var ZIP = '11801';                       /* Hicksville, Nassau County NY */
var PRESETS = [
  { id:'fha35',  label:'FHA 3.5%',       program:'FHA',          down:3.5, price:600000, reno:0,      badge:'no reno' },
  { id:'conv5',  label:'Conv 5%',        program:'Conventional', down:5,   price:600000, reno:0,      badge:'no reno' },
  { id:'fha203', label:'FHA 203(k)',     program:'FHA',          down:3.5, price:600000, reno:100000, badge:'reno' },
  { id:'convhs', label:'Conv HomeStyle', program:'Conventional', down:5,   price:600000, reno:100000, badge:'reno' }
];
V30.applyPreset = function(id){
  var p = PRESETS.filter(function(x){ return x.id === id; })[0]; if (!p) return;
  var s = store(); if (!s) return say('Not ready', 'The loan file has not finished loading.', 'warn');
  var i = s.activeInputs;
  try {
    s.setField('loanProgram', p.program, 'Preset ' + p.label);
    s.setField('basePurchasePrice', p.price, 'Preset ' + p.label);
    s.setField('finalDownPaymentPct', p.down / 100, 'Preset ' + p.label);
    if (!i.zipCode) { s.setField('zipCode', ZIP, 'Preset ' + p.label); try { s.applyZipLookup(); } catch(e){} }
    V30.setReno(!!p.reno, p.reno, true);
  } catch(e){}
  if (window.RECALC) window.RECALC();
  try { s.emit(); } catch(e){}
  paintPresets();
  say(p.label + ' applied',
      usd(p.price) + ' at ' + p.down + '% down' + (p.reno ? ' with ' + usd(p.reno) + ' of renovation'
        : ' \u2014 renovation is off and the budget was cleared')
      + '. Everything else on the file was left alone.', 'good', 7000);
};
/* One switch that genuinely turns renovation off rather than hiding it:
   the flag, the budget and the scope all move together, because leaving
   a budget behind an off flag is how a "no renovation" file still prices
   like a 203(k). */
V30.setReno = function(on, amount, quiet){
  var s = store(); if (!s) return;
  try {
    if (on){
      s.setField('renovation', true, 'Renovation toggle');
      if (amount != null) s.setField('reno.baseCost', N(amount), 'Renovation toggle');
      var i = s.activeInputs;
      if (i && !i.renovationScope) s.setField('renovationScope', 'Auto', 'Renovation toggle');
      if (i) i.v21RenoIntent = true;
    } else {
      s.setField('reno.baseCost', 0, 'Renovation turned off');
      s.setField('renovation', false, 'Renovation turned off');
      var j = s.activeInputs; if (j) j.v21RenoIntent = false;
    }
    s.emit();
  } catch(e){}
  if (window.RECALC) window.RECALC();
  paintPresets();
  if (!quiet)
    say(on ? 'Renovation on' : 'Renovation off',
        on ? 'The renovation workspace and its fees are in play again.'
           : 'The budget was cleared and the renovation fees, contingency and holdback are out of the '
             + 'numbers \u2014 not just hidden.', 'info', 6000);
};
V30.renoOn = function(){
  var s = store(); try { return !!(s && s.activeInputs && s.activeInputs.renovation); } catch(e){ return false; }
};
function presetRow(){
  var host = document.querySelector('#suite-root .v20-quick'); if (!host) return null;
  var row = $('v30Presets');
  if (!row){
    row = document.createElement('div');
    row.id = 'v30Presets'; row.className = 'v30-presets no-print';
    host.parentNode.insertBefore(row, host);
  }
  return row;
}
function paintPresets(){
  var row = presetRow(); if (!row) return;
  var s = store(); var i = s && s.activeInputs;
  var on = V30.renoOn();
  var html = PRESETS.map(function(p){
    var active = i && norm(i.loanProgram).indexOf(norm(p.program).slice(0,4)) === 0
      && Math.abs(N(i.finalDownPaymentPct)*100 - p.down) < 0.01
      && (!!N(i.reno && i.reno.baseCost)) === (!!p.reno);
    return '<button type="button" class="v30-preset' + (active?' on':'') + '" '
      + 'onclick="V30.applyPreset(\'' + p.id + '\')" title="' + esc(usd(p.price)
      + ' \u00b7 ' + p.down + '% down' + (p.reno ? ' \u00b7 ' + usd(p.reno) + ' renovation' : ' \u00b7 no renovation')) + '">'
      + '<span>' + esc(p.label) + '</span><i>' + esc(p.badge) + '</i></button>';
  }).join('');
  html += '<label class="v30-renotoggle' + (on?' on':'') + '" title="Turns the renovation flag, the budget '
       + 'and every renovation fee on or off together">'
       + '<input type="checkbox"' + (on?' checked':'') + ' onchange="V30.setReno(this.checked)">'
       + '<span class="v30-tr"><i></i></span><b>Renovation</b></label>';
  if (row.__sig === html) return;
  row.__sig = html;
  row.innerHTML = html;
}

/* =================================================================== 2
   RAIL — pinned, and re-asserted

   The rail is positioned by CSS, but a screen re-render can rebuild the
   column and drop the class the layout keys off. This re-attaches it
   rather than relying on the markup surviving.
   =================================================================== */
function pinRail(){
  if (window.V31) return true;   /* v31 owns the rail column and its state */
  var rail = document.querySelector('#suite-root .rail'); if (!rail) return false;
  if (!rail.classList.contains('v30-pinned')) rail.classList.add('v30-pinned');
  var root = $('suite-root');
  if (root && !root.classList.contains('v24-summary-open')) root.classList.add('v24-summary-open');
  return true;
}

/* =================================================================== 3
   DOCUMENTS — one place, both sets

   "Documents" now lands on the suite's own Documents & OCR and shows the
   worksheet documents from the Income Calculator alongside it, so the
   two lists people were switching shells to compare sit together.
   =================================================================== */
V30.gotoDocuments = function(){
  if (window.V28 && $('v28nav-documents')) { $('v28nav-documents').click(); }
  else if (window.V8 && V8.go) V8.go('documents');
  setTimeout(mirrorCalcDocs, 260);
};
function mirrorCalcDocs(){
  var panel = $('panel-v9docs') || document.querySelector('#v8Stage .panel.active');
  if (!panel) return;
  var host = $('v30CalcDocs');
  if (!host){
    host = document.createElement('div');
    host.id = 'v30CalcDocs'; host.className = 'v30-calcdocs';
    panel.appendChild(host);
  }
  /* read the calculator's own document list rather than duplicating its
     parser — one source, shown in two places */
  var rows = [];
  try {
    var DOCS = window.S && window.S.docs;
    if (Array.isArray(DOCS)) rows = DOCS.map(function(d){
      return { name: d.name || d.file || 'document', kind: d.kind || d.type || 'other' }; });
  } catch(e){}
  var html = '<div class="v30-cd-hd">Documents &amp; worksheets \u2014 from the Income Calculator</div>';
  html += rows.length
    ? '<div class="v30-cd-list">' + rows.map(function(r){
        return '<div class="v30-cd"><b>' + esc(r.name) + '</b><i>' + esc(r.kind) + '</i></div>'; }).join('') + '</div>'
      + '<button class="btn btn-light btn-sm" onclick="if(window.LOS&&LOS.go)LOS.go(\'c:docs\')">'
      + 'Open the calculator\u2019s Documents tab</button>'
    : '<div class="v30-cd-empty">Nothing loaded on the calculator side yet. Anything dropped there \u2014 '
      + 'paystubs, W-2s, returns, AUS findings \u2014 will list here too.'
      + '<div style="margin-top:8px"><button class="btn btn-light btn-sm" '
      + 'onclick="if(window.LOS&&LOS.go)LOS.go(\'c:docs\')">Open the calculator\u2019s Documents tab</button></div></div>';
  if (host.__sig === html) return;
  host.__sig = html;
  host.innerHTML = html;
}

/* =================================================================== 4
   DOCUMENT GENERATORS

   Five of these already existed in one menu or another and are
   delegated to. Three did not exist at all — a contractor estimate, a
   generic addendum and a lease — so they are generated here from the
   file's own figures.

   Those three print as clearly marked DRAFTS with the fields a person
   still has to complete left visibly blank rather than invented. A
   generated lease with a made-up security deposit is worse than no
   lease.
   =================================================================== */
var GEN = [
  { t:'Income Report',      w:'calc',  names:['Income Report'],       d:'Income calculation with worksheets and 1003 pages.' },
  { t:'Profit &amp; Loss',  w:'suite', names:['P&L','Profit & Loss','Profit and Loss'], d:'Business P&L summary from the worksheets.' },
  { t:'Draft Schedule C',   w:'calc',  names:['Draft Schedule C'],    d:'1040-style profit and loss write-up.' },
  { t:'Pay stub generator', w:'calc',  names:['Pay Stub Generator','Paystub'], d:'New York pay statement with full withholding.' },
  { t:'Draft Loan Estimate',w:'suite', names:['Draft LE'],            d:'Three-page LE with the full A\u2013J breakdown.' },
  { t:'Loan summary',       w:'suite', names:['Print summary'],       d:'The scenario as a printable one-pager.' },
  { t:'Contractor estimate',w:'build', fn:'contractor',               d:'Renovation scope and draw schedule for the contractor.' },
  { t:'Addendum',           w:'build', fn:'addendum',                 d:'Contract addendum covering the financing terms.' },
  { t:'Lease',              w:'build', fn:'lease',                    d:'Residential lease for a rental or departing residence.' }
];
function findCtl(names, where){
  var pools = where === 'calc'
    ? ['#calc-root .toolbar-inner','#v23CalcActions','#calc-root']
    : ['#v23SuiteActions','#v24LoanTools','#suite-root .toolbar','#v25HeaderActions'];
  for (var p=0;p<pools.length;p++){
    var root = document.querySelector(pools[p]); if (!root) continue;
    for (var n=0;n<names.length;n++){
      var hit = $$('button,a', root).filter(function(b){
        return norm(b.textContent) === norm(names[n]); })[0];
      if (hit) return hit;
    }
  }
  return null;
}
function shell(title, body){
  return '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>'
    + 'body{font:13px/1.55 Inter,system-ui,sans-serif;color:#12161f;margin:34px;max-width:760px}'
    + 'h1{font-size:19px;margin:0 0 2px}h2{font-size:12px;text-transform:uppercase;letter-spacing:.08em;'
    + 'color:#5A6379;margin:22px 0 6px;border-bottom:1px solid #D6DBE6;padding-bottom:4px}'
    + 'table{width:100%;border-collapse:collapse;margin-top:6px}'
    + 'td,th{border-bottom:1px solid #E6EAF2;padding:5px 4px;font-size:12px;text-align:left}'
    + 'td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}'
    + '.sub{color:#5A6379;font-size:11px}.blank{display:inline-block;min-width:190px;border-bottom:1px solid #9aa3b5}'
    + '.draft{position:fixed;top:38%;left:0;right:0;text-align:center;font-size:88px;font-weight:800;'
    + 'color:rgba(220,60,80,.13);transform:rotate(-22deg);pointer-events:none}'
    + '.note{font-size:11px;color:#5A6379;border-left:2px solid #d99620;padding-left:9px;margin-top:16px;line-height:1.5}'
    + '@media print{.draft{position:fixed}}</style></head><body><div class="draft">DRAFT</div>'
    + body + '</body></html>';
}
function openPrint(html){
  var w = window.open('', '_blank');
  if (!w) return say('Pop-up blocked', 'Allow pop-ups for this page to print the document.', 'warn', 7000);
  w.document.write(html); w.document.close();
}
function facts(){
  var s = store(), i = s ? s.activeInputs : {}, o = s ? s.outputs : {};
  return {
    borrower: (window.S && window.S.b1) || i.borrowerName || '',
    address: i.propertyAddress || '', zip: i.zipCode || '', state: i.state || '',
    price: N(i.basePurchasePrice), reno: N(i.reno && i.reno.baseCost),
    rate: N(i.interestRate) * 100, term: N(i.termYears),
    loan: o && o.loan ? N(o.loan.totalLoan) : 0,
    payment: o && o.payment ? N(o.payment.totalMonthlyPayment) : 0,
    program: (o && o.programLabel) || i.loanProgram || '',
    date: new Date().toLocaleDateString('en-US')
  };
}
V30.build = {
  contractor: function(){
    var f = facts();
    if (!f.reno) say('No renovation budget on the file',
      'The estimate will print with an empty scope table for you to fill in.', 'info', 6000);
    var draws = [1,2,3,4,5].map(function(n){
      return '<tr><td>Draw ' + n + '</td><td class="blank"></td><td class="n">'
        + (f.reno ? usd(f.reno/5, 2) : '') + '</td><td class="blank"></td></tr>'; }).join('');
    return shell('Contractor estimate',
      '<h1>Contractor estimate</h1><div class="sub">' + esc(f.address || 'Subject property')
      + (f.zip ? ' \u00b7 ' + esc(f.zip) : '') + ' \u00b7 prepared ' + f.date + '</div>'
      + '<h2>Parties</h2><table><tr><td>Borrower</td><td>' + esc(f.borrower || '') + '</td></tr>'
      + '<tr><td>Contractor</td><td><span class="blank"></span></td></tr>'
      + '<tr><td>Licence no.</td><td><span class="blank"></span></td></tr>'
      + '<tr><td>Insurance carrier</td><td><span class="blank"></span></td></tr></table>'
      + '<h2>Scope of work</h2><table><thead><tr><th>Item</th><th>Description</th><th class="n">Cost</th></tr></thead>'
      + '<tbody><tr><td>1</td><td><span class="blank"></span></td><td class="n"></td></tr>'
      + '<tr><td>2</td><td><span class="blank"></span></td><td class="n"></td></tr>'
      + '<tr><td>3</td><td><span class="blank"></span></td><td class="n"></td></tr>'
      + '<tr><td><b>Total</b></td><td></td><td class="n"><b>' + (f.reno ? usd(f.reno) : '') + '</b></td></tr></tbody></table>'
      + '<h2>Draw schedule</h2><table><thead><tr><th>Draw</th><th>Milestone</th><th class="n">Amount</th><th>Date</th></tr></thead>'
      + '<tbody>' + draws + '</tbody></table>'
      + '<div class="note">Amounts are split evenly across five draws as a starting point only \u2014 the '
      + 'real schedule follows the milestones the consultant and lender agree, and the totals must match '
      + 'the accepted bid, not this file. Signatures, licence and insurance details are deliberately blank.</div>'
      + '<h2>Signatures</h2><p class="sub">Contractor <span class="blank"></span> &nbsp; Date <span class="blank" style="min-width:110px"></span></p>'
      + '<p class="sub">Borrower <span class="blank"></span> &nbsp; Date <span class="blank" style="min-width:110px"></span></p>');
  },
  addendum: function(){
    var f = facts();
    return shell('Contract addendum',
      '<h1>Addendum to contract of sale</h1><div class="sub">' + esc(f.address || 'Subject property')
      + ' \u00b7 prepared ' + f.date + '</div>'
      + '<h2>Financing terms</h2><table>'
      + '<tr><td>Programme</td><td>' + esc(f.program) + '</td></tr>'
      + '<tr><td>Purchase price</td><td>' + (f.price ? usd(f.price) : '<span class="blank"></span>') + '</td></tr>'
      + (f.reno ? '<tr><td>Renovation budget</td><td>' + usd(f.reno) + '</td></tr>' : '')
      + '<tr><td>Loan amount</td><td>' + (f.loan ? usd(f.loan) : '<span class="blank"></span>') + '</td></tr>'
      + '<tr><td>Note rate</td><td>' + (f.rate ? f.rate.toFixed(3).replace(/0+$/,'').replace(/\.$/,'') + '%' : '<span class="blank"></span>') + '</td></tr>'
      + '<tr><td>Term</td><td>' + (f.term ? f.term + ' years' : '<span class="blank"></span>') + '</td></tr>'
      + '</table>'
      + '<h2>Additional provisions</h2><p><span class="blank" style="min-width:100%"></span></p>'
      + '<p><span class="blank" style="min-width:100%"></span></p>'
      + '<p><span class="blank" style="min-width:100%"></span></p>'
      + '<div class="note">This is a working draft assembled from the loan file. It is not legal advice '
      + 'and it is not a form anyone has reviewed for your jurisdiction \u2014 an attorney has to settle the '
      + 'wording, the contingency dates and the remedies before it goes anywhere near a signature.</div>'
      + '<h2>Acknowledged</h2><p class="sub">Buyer <span class="blank"></span> &nbsp; Date <span class="blank" style="min-width:110px"></span></p>'
      + '<p class="sub">Seller <span class="blank"></span> &nbsp; Date <span class="blank" style="min-width:110px"></span></p>');
  },
  lease: function(){
    var f = facts();
    return shell('Residential lease',
      '<h1>Residential lease agreement</h1><div class="sub">' + esc(f.address || 'Premises')
      + (f.state ? ' \u00b7 ' + esc(f.state) : '') + ' \u00b7 prepared ' + f.date + '</div>'
      + '<h2>Parties and premises</h2><table>'
      + '<tr><td>Landlord</td><td><span class="blank"></span></td></tr>'
      + '<tr><td>Tenant</td><td><span class="blank"></span></td></tr>'
      + '<tr><td>Premises</td><td>' + (f.address ? esc(f.address) : '<span class="blank"></span>') + '</td></tr>'
      + '</table>'
      + '<h2>Term and rent</h2><table>'
      + '<tr><td>Lease start</td><td><span class="blank" style="min-width:130px"></span></td></tr>'
      + '<tr><td>Lease end</td><td><span class="blank" style="min-width:130px"></span></td></tr>'
      + '<tr><td>Monthly rent</td><td><span class="blank" style="min-width:130px"></span></td></tr>'
      + '<tr><td>Security deposit</td><td><span class="blank" style="min-width:130px"></span></td></tr>'
      + '<tr><td>Due date</td><td><span class="blank" style="min-width:130px"></span></td></tr>'
      + '</table>'
      + '<div class="note">Rent, deposit and dates are left blank on purpose. A lease used as qualifying '
      + 'income has to match what is actually agreed and what the bank statements show \u2014 pre-filling it '
      + 'from a projection would produce a document that disagrees with the file. Deposit limits, notice '
      + 'periods and required disclosures vary by state and are not built into this draft.</div>'
      + '<h2>Signatures</h2><p class="sub">Landlord <span class="blank"></span> &nbsp; Date <span class="blank" style="min-width:110px"></span></p>'
      + '<p class="sub">Tenant <span class="blank"></span> &nbsp; Date <span class="blank" style="min-width:110px"></span></p>');
  }
};
V30.run = function(idx){
  var g = GEN[idx]; if (!g) return;
  if (g.w === 'build'){
    V30.closeGen();
    try { openPrint(V30.build[g.fn]()); } catch(e){ say('Could not build that document', (e&&e.message)||'', 'warn'); }
    return;
  }
  var ctl = findCtl(g.names, g.w);
  if (!ctl) return say('Not available', g.t.replace(/&amp;/g,'&') + ' could not be found \u2014 the menu that '
    + 'holds it may not have finished building.', 'warn', 7000);
  V30.closeGen();
  setTimeout(function(){ ctl.click(); }, 40);
};
V30.openGen  = function(){ var m=$('v30GenModal'); if(m){ V30.renderGen(); m.classList.add('on'); } };
V30.closeGen = function(){ var m=$('v30GenModal'); if(m) m.classList.remove('on'); };
V30.renderGen = function(){
  var b = $('v30GenBody'); if (!b) return;
  b.innerHTML = GEN.map(function(g,i){
    var ok = g.w === 'build' || !!findCtl(g.names, g.w);
    return '<button type="button" class="v30-gen' + (ok?'':' off') + '"'
      + (ok ? ' onclick="V30.run(' + i + ')"' : ' disabled') + '>'
      + '<span class="t">' + g.t + '</span><span class="d">' + esc(g.d) + '</span>'
      + '<span class="w">' + (g.w==='calc'?'Calculator':g.w==='build'?'Generated here':'Loan Suite')
      + (ok?'':' \u00b7 not loaded') + '</span></button>';
  }).join('');
};
function installGen(){
  var actions = $('v25HeaderActions'); if (!actions) return false;
  var old = $('v28PrintGen'); if (old) old.remove();          /* v28's version */
  var oldM = $('v28GenModal'); if (oldM) oldM.remove();
  if (!$('v30PrintGen')){
    var btn = document.createElement('button');
    btn.id = 'v30PrintGen'; btn.type = 'button'; btn.className = 'btn ghost v30-printgen';
    btn.textContent = 'Print / Generate';
    btn.title = 'Produce a document from either shell';
    btn.onclick = V30.openGen;
    actions.appendChild(btn);
  }
  if (!$('v30GenModal')){
    var m = document.createElement('div');
    m.id = 'v30GenModal'; m.className = 'v30-modal no-print';
    m.innerHTML = '<div class="v30-card"><div class="v30-hd"><b>Print / Generate</b>'
      + '<button type="button" class="v30-x" onclick="V30.closeGen()">Esc</button></div>'
      + '<div class="v30-grid" id="v30GenBody"></div>'
      + '<div class="v30-ft">The first six open a generator that already exists elsewhere \u2014 nothing was '
      + 'moved, so those routes still work. The last three are built here from the file and print as '
      + 'drafts with the fields you still have to settle left blank.</div></div>';
    m.addEventListener('click', function(e){ if (e.target === m) V30.closeGen(); });
    document.body.appendChild(m);
  }
  return true;
}
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape'){ var m=$('v30GenModal'); if (m && m.classList.contains('on')) V30.closeGen(); }
});

/* =================================================================== 5
   MENUS — grouped instead of one long grid

   File actions and Loan tools were a single flat run of buttons in
   whatever order the layers happened to append them. Headings are
   inserted so related things sit together; nothing is removed or
   reordered destructively, the entries are just sorted into their
   section.
   =================================================================== */
var SECTIONS = [
  ['File',      ['NEW','RESET','SAVE','SAVE SCENARIO','EXPORT SCENARIO JSON','IMPORT SCENARIO JSON','IMPORT / AI']],
  ['Compare',   ['COMPARE','LIVE COMPARISON','SCENARIOS']],
  ['Documents', ['DOCUMENTS & OCR','DRAFT LE','PRINT SUMMARY','PRINT / PDF','COPY BORROWER QUOTE','P&L','PMI WORKSHEET','RENO FEES']],
  ['Review',    ['CREDIT','CREDIT REVIEW','RECALCULATE','ALL PAGES','THEME & INPUTS']]
];
function sectionFor(label){
  for (var i=0;i<SECTIONS.length;i++)
    if (SECTIONS[i][1].indexOf(label) >= 0) return SECTIONS[i][0];
  return 'More';
}
function groupMenu(grid){
  if (!grid || grid.__v30 === grid.children.length) return;
  var items = $$(':scope > *', grid).filter(function(n){ return !n.classList.contains('v30-mhead'); });
  if (!items.length) return;
  $$(':scope > .v30-mhead', grid).forEach(function(h){ h.remove(); });
  var buckets = {};
  items.forEach(function(n){
    var k = sectionFor(norm(n.textContent).replace(/\s*\u25be\s*$/,'').slice(0,40));
    (buckets[k] = buckets[k] || []).push(n);
  });
  ['File','Compare','Documents','Review','More'].forEach(function(name){
    var list = buckets[name]; if (!list || !list.length) return;
    var h = document.createElement('div');
    h.className = 'v30-mhead'; h.textContent = name;
    grid.appendChild(h);
    list.forEach(function(n){ grid.appendChild(n); });
  });
  grid.__v30 = grid.children.length;
}
function tidyMenus(){ $$('.v23-actions-grid').forEach(groupMenu); }

/* =================================================================== 6
   FREEFORM — re-assert over anything rendered since the last pass
   =================================================================== */
function freeform(){
  $$('input[type=number]').forEach(function(el){
    if (el.__v30) return; el.__v30 = true;
    el.type = 'text'; el.inputMode = 'decimal';
    el.addEventListener('input', function(){
      if (/[$,\s]/.test(el.value)) el.value = el.value.replace(/[$,\s]/g,'');
    }, true);
  });
}

/* =================================================================== 7
   WIRING
   =================================================================== */
setInterval(function(){
  try { paintPresets(); } catch(e){}
  try { pinRail(); } catch(e){}
  try { installGen(); } catch(e){}
  try { tidyMenus(); } catch(e){}
  try { freeform(); } catch(e){}
  try { if (document.querySelector('#panel-v9docs.active')) mirrorCalcDocs(); } catch(e){}
}, 750);
})();
