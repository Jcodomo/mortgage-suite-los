
/* ==================================================================
   AUS FINDINGS — parse a DU / LPA report and line it up against the
   income calculated in this file.
   ================================================================== */
const AUS_LABEL = {casefile:'Casefile ID', recommendation:'Recommendation', b1:'Borrower 1', b2:'Borrower 2',
  loanNo:'Lender loan number', duVer:'DU version', subDate:'Submission date',
  ltv:'LTV / CLTV / HCLTV', housing:'Housing expense ratio', dti:'Debt-to-income ratio',
  loanAmt:'Total loan amount', price:'Sales price', value:'Appraised value', reserves:'Months reserves',
  rate:'Note rate', loanType:'Loan type', term:'Loan term', amort:'Amortization', purpose:'Loan purpose',
  address:'Property address', propType:'Property type', units:'Units', occ:'Occupancy'};

function parseAUS(text){
  const t = String(text||'');
  /* Accepts one pattern or a list — DU, LPA and the various PDF text layers all
     label the same figure differently, so the first pattern that hits wins. */
  const g = re => {
    for (const r of (Array.isArray(re) ? re : [re])){
      const m = t.match(r);
      if (m && m[1]) return m[1].replace(/\s+/g,' ').trim();
    }
    return '';
  };
  const f = {};
  f.casefile = g(/Casefile\s*ID\s*[:\-]?\s*(\d{6,})/i);
  f.recommendation = g(/Recommendation\s*[:\-]?\s*(Approve\s*\/\s*Eligible|Approve\s*\/\s*Ineligible|Refer\s*\/\s*Eligible|Refer\s*with\s*Caution|Accept|Caution|Out\s*of\s*Scope|Error)/i);
  const NAME = "([A-Z][A-Za-z.'\\-]+(?:[^\\S\\n]+[A-Z][A-Za-z.'\\-]+){0,3})";
  f.b1 = g([new RegExp("Borrower\\s*1\\s*[:\\-]?[^\\S\\n]*"+NAME),
            new RegExp("Borrower(?:\\s*Name)?\\s*[:\\-][^\\S\\n]*"+NAME)]);
  f.b2 = g(new RegExp("Borrower\\s*2\\s*[:\\-]?[^\\S\\n]*"+NAME));
  f.loanNo = g(/Lender\s*Loan\s*Number\s*[:\-]?\s*([\w\-]{4,})/i);
  f.duVer  = g(/DU\s*Version\s*[:\-]?\s*([\d.]+)/i);
  f.subDate= g(/Submission\s*Date\s*[:\-]?\s*([\d\/]+\s*[\d:]*\s*[AP]?M?)/i);
  f.ltv    = g(/LTV\s*\/\s*CLTV\s*\/\s*HCLTV\s*[:\-]?\s*([\d.]+%\s*\/\s*[\d.]+%\s*\/\s*[\d.]+%)/i);
  if (!f.ltv){                                    /* labelled separately on some reports */
    const one = l => g(new RegExp('(?:^|[^CH])\\b'+l+'\\s*[:\\-]?\\s*([\\d.]+\\s*%)','i'));
    const a = one('LTV'), b = g(/\bCLTV\s*[:\-]?\s*([\d.]+\s*%)/i), c = g(/\bHCLTV\s*[:\-]?\s*([\d.]+\s*%)/i);
    if (a || b || c) f.ltv = [a||'—', b||'—', c||'—'].join(' / ');
  }
  f.housing= g([/Housing\s*Expense\s*Ratio\s*[:\-]?\s*([\d.]+\s*%)/i,
                /Housing\s*Ratio\s*[:\-]?\s*([\d.]+\s*%)/i,
                /Front[\s\-]*End\s*(?:Ratio|DTI)\s*[:\-]?\s*([\d.]+\s*%)/i]);
  f.dti    = g([/Debt[\s\-]*to[\s\-]*Income\s*Ratio\s*[:\-]?\s*([\d.]+\s*%)/i,
                /Total\s*Expense\s*Ratio\s*[:\-]?\s*([\d.]+\s*%)/i,
                /Back[\s\-]*End\s*(?:Ratio|DTI)\s*[:\-]?\s*([\d.]+\s*%)/i]);
  f.loanAmt= g([/Total\s*Loan\s*Amount\s*[:\-]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
                /(?:Base\s*)?Loan\s*Amount\s*[:\-]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i]);
  f.price  = g([/Sales\s*Price[^$\n]{0,40}\$?\s*([\d,]+(?:\.\d{2})?)/i,
                /Purchase\s*Price\s*[:\-]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i]);
  f.value  = g(/Appraised\s*Value\s*[:\-]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i);
  f.reserves=g([/Months\s*Reserves\s*[:\-]?\s*([\d.]+)/i,
                /Reserves\s*(?:Required|Verified)?\s*[:\-]?\s*([\d.]+)\s*months?/i]);
  f.reserveAmt = g(/Reserves\s*(?:Required|Verified)?\s*[:\-]?\s*\$\s*([\d,]+(?:\.\d{2})?)/i);
  f.rate   = g(/Note\s*Rate\s*[:\-]?\s*([\d.]+\s*%)/i);
  f.loanType=g(/Loan\s*Type\s*[:\-]?\s*(Conventional|FHA|VA|USDA|RHS)/i);
  f.term   = g([/Loan\s*Term\s*[:\-]?\s*(\d{2,3})/i, /\bTerm\s*[:\-]\s*(\d{2,3})\b/i]);
  f.amort  = g(/Amortization\s*Type\s*[:\-]?\s*([A-Za-z ]{3,20})/i);
  f.purpose= g(/Loan\s*Purpose\s*[:\-]?\s*(Purchase|Refinance|Cash[\s\-]*Out\s*Refinance|Limited\s*Cash[\s\-]*Out)/i);
  f.address= g(/Property\s*Address\s*[:\-]?\s*([^\n]{6,80})/i);
  f.propType=g(/Property\s*Type\s*[:\-]?\s*([A-Za-z \-]{3,26})/i);
  f.units  = g(/Number\s*of\s*Units\s*[:\-]?\s*(\d)/i);
  f.occ    = g([/Occupancy\s*Status\s*[:\-]?\s*([A-Za-z ]{3,26})/i,
                /Occupancy\s*[:\-]\s*([A-Za-z ]{3,26})/i]);

  const findings = [];
  const re = /(?:^|\n)\s*(\d{1,3})\s+([\s\S]{10,900}?)\(\s*MSG\s*ID\s*(\d{3,5})\s*\)/g;
  let m; while ((m = re.exec(t)) !== null){
    findings.push({n:+m[1], text:m[2].replace(/\s+/g,' ').trim(), msg:m[3]});
  }
  const duIncome = [];
  const ri = new RegExp(
    '(Base\\s*(?:Employment\\s*)?Income|Bonus(?:es)?(?:\\s*Income)?|Overtime(?:\\s*Income)?|Commissions?(?:\\s*Income)?'
    + '|Military(?:\\s*Entitlements?)?|Social\\s*Security|Pension(?:\\s*\\/?\\s*Retirement)?|Retirement\\s*Income'
    + '|Disability(?:\\s*Income)?|Alimony|Child\\s*Support|Trust\\s*Income|Interest(?:\\s*(?:and|&|\\/)\\s*Dividends?)?'
    + '|Net\\s*Rental(?:\\s*Income)?|Self[\\s\\-]*Employ(?:ment|ed)(?:\\s*Income)?|Other\\s*Income)'
    + '[\\s\\S]{0,260}?\\$?\\s*([\\d,]+\\.\\d{2})', 'gi');
  while ((m = ri.exec(t)) !== null){
    const type = m[1].replace(/\s+/g,' ').trim();
    if (!type) continue;
    if (!duIncome.some(x=>String(x.type).toLowerCase()===type.toLowerCase())) duIncome.push({type, amt:toNum(m[2])});
  }
  return {f, findings, duIncome, raw:t};
}

/* keyword → the guideline card that answers it */
const AUS_TOPIC = [
  [/paystub|w-?2|verification of employment|voe|1005/i, 'w2',        'Employment documentation'],
  [/bonus|overtime|commission|variable/i,               'variable',  'Variable income'],
  [/self[\s\-]?employ|4506|tax return|schedule c/i,     'schc',      'Self-employment'],
  [/rental|adu|accessory dwelling/i,                    'rental',    'Rental income'],
  [/asset|reserve|bank statement/i,                     'assets',    'Assets & reserves'],
  [/mortgage insurance|mi coverage/i,                   'dti',       'Mortgage insurance'],
  [/debt|liabilit|collection|charge[\s\-]?off|past[\s\-]?due/i,'dti','Liabilities & ratios'],
  [/appraisal|value acceptance|property data/i,         '',          'Valuation'],
  [/credit report|score/i,                              'docs',      'Credit documentation']
];
function ausTopic(txt){
  const hit = AUS_TOPIC.find(([re])=>re.test(txt));
  return hit ? {key:hit[1], label:hit[2]} : {key:'', label:'General'};
}
function ausMsgLink(id){
  return `https://singlefamily.fanniemae.com/media/document/pdf/du-underwriting-findings-messages` +
         `#msg-${encodeURIComponent(id)}`;
}
function applyAUS(text, name){
  S.aus = parseAUS(text);
  S.aus.file = name || 'AUS findings';
  S.aus.at = new Date().toISOString();
  if (S.aus.f.b1 && !S.b1){ S.b1 = S.aus.f.b1; $('b1Name').value = S.b1; }
  if (S.aus.f.b2 && !S.b2){ S.b2 = S.aus.f.b2; $('b2Name').value = S.b2; }
  if (S.aus.f.loanNo && !S.file){ S.file = S.aus.f.loanNo; $('fileNumber').value = S.file; }
  renderAUS(); RECALC();
}
function clearAUS(){ S.aus = null; renderAUS(); RECALC(); }

function renderAUS(){
  const A = S.aus;
  setT('cnt-aus', A ? (A.findings||[]).length : 0);
  if (!A){
    $('ausBody').innerHTML = `<div class="addblock" onclick="switchTab('docs');document.getElementById('docFile').click()">
      <div class="t"><svg class="icon icon-lg" style="color:var(--accent)"><use href="#i-plus"/></svg>Drop a DU or LPA findings report</div>
      <div class="s">Drag the PDF anywhere on the page, or click here to browse. The findings are read, the loan
        figures are pulled out, every numbered message is indexed against the matching guideline, and the AUS
        income is lined up against what this file calculates.</div></div>`;
    return;
  }
  const f = A.f, t = calcTotals();
  const duDTI = parseFloat(String(f.dti).replace('%','')) || 0;
  const ourDTI = t.back*100;
  const duTotal = A.duIncome.reduce((n,x)=>n+x.amt,0);
  const tile = (k,v,s2)=>`<div class="stat"><span class="k">${k}</span><span class="v">${v||'—'}</span>${s2?`<span class="s">${s2}</span>`:''}</div>`;
  const rec = (f.recommendation||'').toLowerCase();
  const recCls = /approve|accept/.test(rec) ? 'ok' : /refer|caution/.test(rec) ? 'bad' : 'info';
  const groups = {};
  (A.findings||[]).forEach(x=>{ const g=ausTopic(x.text); (groups[g.label] = groups[g.label] || {key:g.key, list:[]}).list.push(x); });
  const plan = ausIncomePlan();
  const CN = {base:'Base', ot:'Overtime', comm:'Commission', bonus:'Bonus', other:'Other / entitlements'};

  $('ausBody').innerHTML = `
  <div class="card major">
    <div class="card-top"><span class="tag">AUS</span>
      <span class="doc-name">${esc(f.recommendation||'Findings')} &mdash; casefile ${esc(f.casefile||'—')}</span>
      <div class="spacer"></div>
      <span class="muted small" style="color:#cddcf0">${esc(A.file)} · ${new Date(A.at).toLocaleString()}</span>
      <button class="btn-link no-print" onclick="clearAUS()"><svg class="icon"><use href="#i-trash"/></svg>Clear</button>
    </div>
    <div class="card-body">
      <div class="chips" style="margin-bottom:9px">
        <span class="chip-st ${recCls}">${esc(f.recommendation||'No recommendation read')}</span>
        ${f.duVer?`<span class="chip-st info">DU ${esc(f.duVer)}</span>`:''}
        ${f.loanType?`<span class="chip-st info">${esc(f.loanType)}</span>`:''}
        ${f.purpose?`<span class="chip-st info">${esc(f.purpose)}</span>`:''}
        ${f.occ?`<span class="chip-st info">${esc(f.occ)}</span>`:''}
      </div>
      <div class="stats s4">
        ${tile('Borrowers', esc([f.b1,f.b2].filter(Boolean).join(' & ')||'—'))}
        ${tile('LTV / CLTV / HCLTV', esc(f.ltv))}
        ${tile('AUS housing ratio', esc(f.housing))}
        ${tile('AUS back-end DTI', esc(f.dti), ourDTI?`This file calculates ${ourDTI.toFixed(2)}%`:'')}
        ${tile('Total loan amount', f.loanAmt?money(toNum(f.loanAmt)):'—')}
        ${tile('Sales price', f.price?money(toNum(f.price)):'—')}
        ${tile('Appraised value', f.value?money(toNum(f.value)):'—')}
        ${tile('Months reserves', esc(f.reserves))}
      </div>
      ${f.address?`<div class="notice info" style="margin-top:9px"><svg class="icon"><use href="#i-home"/></svg>
        <span>${esc(f.address)}${f.propType?` · ${esc(f.propType)}`:''}${f.units?` · ${esc(f.units)} unit(s)`:''}</span></div>`:''}
      ${f.loanAmt && N(S.loan.price)===0 ? `<div class="notice warn"><svg class="icon"><use href="#i-alert"/></svg>
        <span>The loan setup on the PITIA tab is still empty.
        <button class="btn-link no-print" onclick="ausToLoan()">Copy the AUS loan figures into Loan Setup</button></span></div>`:''}
    </div>
  </div>

  <div class="card">
    <div class="card-top"><span class="tag">Income</span><span class="doc-name">AUS income vs this file</span></div>
    <div class="card-body">
      ${A.duIncome.length ? `<div class="tbl-scroll"><table class="cmp">
        <thead><tr><th>Income type reported to the AUS</th><th class="num">AUS amount</th><th>Loads into</th></tr></thead>
        <tbody>${A.duIncome.map(x=>{
          const k = ausMatch(AUS_COMP, x.type), o = ausMatch(AUS_OTHER, x.type);
          const t = OTHER_TYPES.find(y=>y.v===o);
          return `<tr><td>${esc(x.type)}</td><td class="num">${money(x.amt)}</td>
            <td class="small">${k ? `W-2 worksheet &mdash; <b>${CN[k]}</b>`
              : o ? `Other Income &mdash; <b>${t?t.t:o}</b>`
              : '<span class="muted">kept on its own worksheet</span>'}</td></tr>`; }).join('')}
          <tr><td><b>Total read from the findings</b></td><td class="num"><b>${money(duTotal)}</b></td><td></td></tr>
          <tr><td><b>Qualifying income calculated here</b></td><td class="num"><b>${money(t.income)}</b></td><td></td></tr>
          <tr><td><b>Difference</b></td><td class="num"><b>${money(t.income - duTotal)}</b></td><td></td></tr>
        </tbody></table></div>
        <div class="rule" style="margin-top:11px;display:flex;flex-wrap:wrap;gap:9px;align-items:center">
          <div style="flex:1;min-width:230px">
            <b>Load ${money(plan.total)} / mo into the worksheets</b>
            <div class="small muted" style="margin-top:2px">
              ${Object.keys(plan.comp).map(k=>`${CN[k]} ${money(plan.comp[k])}`).join(' &middot; ') || 'No wage components read'}
              ${plan.other.length?` &middot; ${plan.other.length} other-income item${plan.other.length===1?'':'s'}`:''}
              ${plan.skipped.length?` &middot; ${plan.skipped.length} left on its own worksheet`:''}
            </div>
          </div>
          <select class="cell-input" id="ausTarget" style="width:auto;min-width:190px">${ausTargetOptions()}</select>
          <button class="btn btn-primary btn-sm no-print" onclick="ausToIncome()">
            <svg class="icon"><use href="#i-magic"/></svg>Load into income calculator</button>
          <button class="btn btn-light btn-sm no-print" onclick="ausLoadAll()">
            <svg class="icon"><use href="#i-down"/></svg>Load income + loan setup</button>
        </div>
        <div class="notice warn" style="margin-top:9px"><svg class="icon"><use href="#i-alert"/></svg>
          <span>AUS figures arrive as <b>qualifying monthly amounts</b>, so each one is written as a
          <b>Custom Override</b> on its component. That records what was submitted &mdash; it does not evidence it.
          Re-run the calculation from the paystubs, W-2s or returns before you clear the file to close.</span></div>`
        : '<div class="muted small">No income amounts were readable in this report — the DU validation tables may not be present.</div>'}
      ${duDTI && ourDTI ? `<div class="notice ${Math.abs(duDTI-ourDTI)<=1?'good':'warn'}" style="margin-top:9px">
        <svg class="icon"><use href="#i-alert"/></svg><span>AUS back-end DTI <b>${duDTI.toFixed(2)}%</b> against
        <b>${ourDTI.toFixed(2)}%</b> calculated here — a gap of ${(ourDTI-duDTI).toFixed(2)} points.
        ${Math.abs(duDTI-ourDTI)<=1?'Close enough to be the same file.':'Reconcile the income and liabilities before relying on the findings.'}</span></div>`:''}
    </div>
  </div>

  <div class="card">
    <div class="card-top"><span class="tag">Findings</span>
      <span class="doc-name">${(A.findings||[]).length} numbered messages, grouped by topic</span>
      <div class="spacer"></div>
      <button class="btn-link no-print" onclick="document.querySelectorAll('#ausFind .gl-card').forEach(c=>c.classList.toggle('open'))">
        <svg class="icon"><use href="#i-chev"/></svg>Expand / collapse all</button>
    </div>
    <div class="card-body" id="ausFind">
      ${Object.keys(groups).map(lbl=>{
        const G = groups[lbl];
        return `<div class="gl-card">
          <div class="gl-head" onclick="this.parentNode.classList.toggle('open')">
            <svg class="icon chev"><use href="#i-chev"/></svg>
            <span class="t">${lbl} <span class="muted small">(${G.list.length})</span></span>
            ${G.key?`<button class="btn-link no-print" onclick="event.stopPropagation();openGuide('${G.key}')">
              <svg class="icon"><use href="#i-book"/></svg>Guideline</button>`:''}
          </div>
          <div class="gl-body">
            ${G.list.map(x=>`<div style="padding:7px 0;border-bottom:1px dashed var(--line)">
              <div style="display:flex;gap:8px;align-items:baseline">
                <span class="tag slate">${x.n}</span>
                <span style="flex:1">${esc(x.text)}</span>
                <a class="btn-link" target="_blank" rel="noopener" href="${ausMsgLink(x.msg)}">
                  <svg class="icon"><use href="#i-ext"/></svg>MSG ${x.msg}</a>
              </div></div>`).join('')}
          </div></div>`;
      }).join('') || '<div class="muted small">No numbered findings were readable.</div>'}
    </div>
  </div>

  <div class="card">
    <div class="card-top"><span class="tag">Text</span><span class="doc-name">Full extracted findings text</span></div>
    <div class="card-body"><div class="raw">${esc((A.raw||'').slice(0,20000))}</div></div>
  </div>`;
}
/* ==================================================================
   AUS  ->  INCOME CALCULATOR
   The findings carry qualifying MONTHLY figures, already blessed by the
   agency engine. They land as a Custom Override on each component rather
   than pretending to be YTD dollars, so the audit trail stays honest and
   the method column reads "Custom Override" instead of an averaged method
   nobody actually ran.
   ================================================================== */
const AUS_COMP = [                       /* AUS wording -> wage-earner component */
  [/base/i,                    'base' ],
  [/overtime/i,                'ot'   ],
  [/bonus/i,                   'bonus'],
  [/commission/i,              'comm' ],
  [/military|entitlement/i,    'other'],
  [/^other\s*income$/i,        'other']
];
const AUS_OTHER = [                      /* AUS wording -> Other Income type */
  [/social\s*security/i,       'ssa'    ],
  [/disability/i,              'disab'  ],
  [/pension|retirement/i,      'pension'],
  [/alimony/i,                 'alimony'],
  [/child\s*support/i,         'support'],
  [/trust/i,                   'trust'  ],
  [/interest|dividend/i,       'intdiv' ]
];
const ausMatch = (tbl, label) => (tbl.find(([re]) => re.test(label)) || [])[1];

/* what the current findings would do, without doing it — drives the preview */
function ausIncomePlan(){
  const A = S.aus; if (!A) return {comp:{}, other:[], skipped:[], total:0};
  const comp = {}, other = [], skipped = [];
  (A.duIncome||[]).forEach(row=>{
    const k = ausMatch(AUS_COMP, row.type);
    if (k){ comp[k] = (comp[k]||0) + row.amt; return; }
    const o = ausMatch(AUS_OTHER, row.type);
    if (o){ other.push({type:o, label:row.type, amt:row.amt}); return; }
    skipped.push(row);                 /* rental and self-employment keep their own worksheets */
  });
  const total = Object.values(comp).reduce((a,b)=>a+b,0) + other.reduce((a,b)=>a+b.amt,0);
  return {comp, other, skipped, total};
}

function ausTargetOptions(){
  return S.w2.map((j,i)=>`<option value="${j.id}">${esc(j.employer)||'Employment #'+(i+1)}</option>`).join('')
       + '<option value="NEW">+ New employment record</option>';
}

function ausToIncome(){
  const A = S.aus; if (!A){ toast('No findings loaded'); return; }
  const plan = ausIncomePlan();
  if (!plan.total){ toast('No income amounts were readable in these findings'); return; }

  const sel = $('ausTarget');
  const pick = sel ? sel.value : 'NEW';
  let j = pick && pick !== 'NEW' ? findRec('w2', pick) : null;
  if (!j){ j = newW2(); S.w2.push(j); }
  if (!j.employer) j.employer = 'Per AUS findings' + (A.f.casefile ? ` — casefile ${A.f.casefile}` : '');
  j.mode = 'manual';
  Object.keys(plan.comp).forEach(k=>{ j.c[k] = round2(plan.comp[k]); j.m[k] = 'custom'; });
  j.notes = (j.notes ? j.notes + '\n' : '')
    + `Income loaded from ${A.f.recommendation||'AUS'} findings (${A.file}) on ${today()}. `
    + `Each component is entered as a custom override at the amount submitted to the AUS — `
    + `document the underlying calculation before final approval.`;

  plan.other.forEach(o=>{
    const t = OTHER_TYPES.find(x=>x.v===o.type);
    let rec = S.other.find(x=>x.type===o.type);
    if (!rec){ rec = newOther(); rec.type = o.type; S.other.push(rec); }
    rec.amt   = round2(o.amt);
    rec.desc  = rec.desc || `Per AUS findings — ${o.label}`;
    rec.nonTax = t ? t.nt : rec.nonTax;
    if (!rec.nonTax) rec.grossUp = 0;
  });

  if (A.f.b1 && !S.b1){ S.b1 = A.f.b1; S.borrower = A.f.b1; $('b1Name').value = A.f.b1; }
  if (A.f.b2 && !S.b2){ S.b2 = A.f.b2; $('b2Name').value = A.f.b2; }

  renderW2(); renderOther(); RECALC(); switchTab('w2');
  toast(`${money(plan.total)}/mo loaded from the findings — verify each component against the documents`);
}

/* one button: borrowers + loan setup + income */
function ausLoadAll(){
  const A = S.aus; if (!A) return;
  ausToLoan();          /* loan figures and PITIA */
  ausToIncome();        /* income components */
  toast('Loan setup and income loaded from the AUS findings');
}

function ausToLoan(){
  const f = S.aus && S.aus.f; if(!f) return;
  const L = S.loan;
  if (f.price) L.price = toNum(f.price);
  if (f.value) L.value = toNum(f.value);
  if (f.rate)  L.rate  = parseFloat(f.rate) || L.rate;
  if (f.term)  L.term  = Math.round(N(f.term)/12) || L.term;
  if (f.loanType) L.program = /fha/i.test(f.loanType)?'FHA':/va/i.test(f.loanType)?'VA':/usda|rhs/i.test(f.loanType)?'USDA':'Conventional';
  if (f.occ) L.occ = /primary/i.test(f.occ)?'Primary Residence':/second/i.test(f.occ)?'Second Home':'Investment';
  if (f.units) L.units = N(f.units) || 1;
  if (f.address) L.address = f.address;
  if (f.loanAmt && f.price){
    const base = toNum(f.loanAmt), price = toNum(f.price);
    if (price > 0 && base > 0){ L.dpMode='pct'; L.dpPct = Math.round((1 - base/price)*10000)/100; }
  }
  renderDTI(); RECALC(); switchTab('dti');
  toast('AUS loan figures copied into Loan Setup — check the down payment and rate');
}
