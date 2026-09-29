
/* ==================================================================
   LOAN SETUP, MORTGAGE INSURANCE & THE RENOVATION SUITE BRIDGE
   Mirrors the Renovation Suite scenario model so a file can move
   between the two tools.
   ================================================================== */
function setLoan(k,v,num){ S.loan[k] = num ? N(v) : v; renderDTI(); RECALC(); }
/* Typing in a field must not tear down the card the caret is sitting in. */
function setLoanLive(k,v,num){ S.loan[k] = num ? N(v) : v; paintLoan(); RECALC(); }

/* ------------------------------------------------------------------
   FREE-FORM LOAN ENTRY
   Price, down payment and loan amount are three views of the same
   arithmetic, so any one of them can be typed and the other two follow.
   Escrows accept an annual figure, a monthly figure, or (for taxes) a
   percentage of value — whichever the underwriter has in front of them.
   ------------------------------------------------------------------ */
function setLinked(field, raw){
  const L = S.loan, v = N(raw);
  const price = N(L.price), value = N(L.value) || price;
  if (field === 'price'){
    L.price = v;
    if (N(L.baseOverride) > 0){                    /* loan held: down payment follows */
      L.dpAmt = Math.max(0, v - N(L.baseOverride));
      L.dpPct = v ? L.dpAmt / v * 100 : 0;
    } else if (L.dpMode === 'amt'){
      L.dpPct = v ? N(L.dpAmt) / v * 100 : 0;
    } else {
      L.dpAmt = v * N(L.dpPct) / 100;
    }
  } else if (field === 'dpPct'){
    L.dpMode = 'pct'; L.dpPct = v; L.dpAmt = price * v / 100; L.baseOverride = 0;
  } else if (field === 'dpAmt'){
    L.dpMode = 'amt'; L.dpAmt = v; L.dpPct = price ? v / price * 100 : 0; L.baseOverride = 0;
  } else if (field === 'loanAmt'){
    L.baseOverride = v;                            /* the loan is now the held figure */
    if (price){ L.dpAmt = Math.max(0, price - v); L.dpPct = L.dpAmt / price * 100; L.dpMode = 'amt'; }
  } else if (field === 'value'){
    L.value = v;
  }
  paintLoan(); RECALC();
}
/* taxes / insurance / flood / HOA — enter it any way you have it */
const ESC_KEY = {taxes:'taxAnnual', ins:'insAnnual', flood:'floodAnnual', hoa:'hoaMonthly'};
function setEsc(which, raw, per){
  const L = S.loan, v = N(raw), key = ESC_KEY[which];
  const value = N(L.value) || N(L.price);
  if (which === 'hoa') L.hoaMonthly = per === 'yr' ? v / 12 : v;
  else if (per === 'mo')  L[key] = v * 12;
  else if (per === 'pct') L[key] = value * v / 100;
  else                    L[key] = v;
  paintLoan(); RECALC();
}
/* the housing block below is live too — a typed figure flows back to its source */
function setHousing(k, raw){
  const v = N(raw), L = S.loan;
  if (k === 'taxes')            L.taxAnnual   = v * 12;
  else if (k === 'ins')         L.insAnnual   = v * 12;
  else if (k === 'otherHousing')L.floodAnnual = v * 12;
  else if (k === 'hoa')         L.hoaMonthly  = v;
  else if (k === 'pi')          L.piHold      = v;   /* held until cleared */
  else if (k === 'mi')          L.miHold      = v;
  S.dti[k] = v;
  paintLoan(); RECALC();
}
function clearHold(k){ if(k==='pi') S.loan.piHold = null; else S.loan.miHold = null;
  renderDTI(); RECALC(); toast('Back to the calculated figure'); }

/* FHA annual MIP — post-March-2023 schedule. Base-loan threshold is editable. */
function fhaMip(base, ltv, term, limit){
  const high = base > N(limit);
  if (term <= 15){
    if (high) return ltv<=0.78 ? 0.0015 : ltv<=0.90 ? 0.0040 : 0.0065;
    return ltv<=0.90 ? 0.0015 : 0.0040;
  }
  if (high) return ltv<=0.90 ? 0.0070 : 0.0075;
  return ltv<=0.90 ? 0.0050 : 0.0055;
}
/* Conventional BPMI — representative monthly rate card. Always confirm against the MI company's quote. */
const PMI_TABLE = [
  {max:0.97, r:[[760,0.0041],[740,0.0053],[720,0.0072],[700,0.0088],[680,0.0109],[660,0.0135],[640,0.0160],[0,0.0185]]},
  {max:0.95, r:[[760,0.0028],[740,0.0038],[720,0.0052],[700,0.0064],[680,0.0079],[660,0.0099],[640,0.0118],[0,0.0138]]},
  {max:0.90, r:[[760,0.0019],[740,0.0024],[720,0.0032],[700,0.0042],[680,0.0052],[660,0.0066],[640,0.0079],[0,0.0094]]},
  {max:0.85, r:[[760,0.0014],[740,0.0017],[720,0.0020],[700,0.0025],[680,0.0031],[660,0.0039],[640,0.0047],[0,0.0056]]}
];
function pmiRate(ltv, fico){
  if (ltv <= 0.8001) return 0;
  const band = PMI_TABLE.find(b=> ltv <= b.max + 0.0001) || PMI_TABLE[0];
  const row = band.r.find(([f])=> N(fico) >= f) || band.r[band.r.length-1];
  return row[1];
}
function vaFee(ltvPctDown, firstUse){
  const d = ltvPctDown;
  if (firstUse) return d>=10 ? 1.25 : d>=5 ? 1.50 : 2.15;
  return d>=10 ? 1.25 : d>=5 ? 1.50 : 3.30;
}
function calcLoan(){
  const L = S.loan, price = N(L.price), value = N(L.value) || price;
  const dp = L.dpMode==='pct' ? price*N(L.dpPct)/100 : N(L.dpAmt);
  const dpPct = price ? dp/price*100 : 0;
  const base = N(L.baseOverride)>0 ? N(L.baseOverride) : Math.max(0, price - dp);
  const ltv = value ? base/value : 0;
  let upfront=0, upfrontLabel='', annualRate=0, miDrop='', miBasis='';
  if (L.program==='FHA'){
    upfront = base * N(L.ufmipRate)/100; upfrontLabel = 'Upfront MIP (UFMIP)';
    annualRate = N(L.miOverride)>0 ? N(L.miOverride)/100 : fhaMip(base, ltv, N(L.term), L.limit);
    miDrop = ltv<=0.90 ? 'Cancels after 11 years' : 'For the life of the loan';
    miBasis = 'Total loan including financed UFMIP';
  } else if (L.program==='Conventional'){
    annualRate = N(L.miOverride)>0 ? N(L.miOverride)/100 : pmiRate(ltv, N(L.fico));
    miDrop = ltv>0.8001 ? 'Borrower may request removal at 80% LTV; automatic at 78%' : 'No mortgage insurance required';
    miBasis = 'Base loan amount';
  } else if (L.program==='VA'){
    upfront = L.vaExempt ? 0 : base * vaFee(dpPct, L.vaFirstUse)/100;
    upfrontLabel = 'VA funding fee' + (L.vaExempt?' (exempt)':'');
    annualRate = 0; miDrop = 'VA loans carry no monthly mortgage insurance'; miBasis = '—';
  } else {
    upfront = base * 0.01; upfrontLabel = 'USDA guarantee fee';
    annualRate = N(L.miOverride)>0 ? N(L.miOverride)/100 : 0.0035;
    miDrop = 'For the life of the loan'; miBasis = 'Base loan amount';
  }
  const financed = (L.program==='Conventional') ? 0 : (L.financeUfmip ? upfront : 0);
  const totalLoan = base + financed;
  const miCalc = (L.program==='FHA' ? totalLoan : base) * annualRate / 12;
  const miMonthly = (L.miHold != null && L.miHold !== '') ? N(L.miHold) : miCalc;
  const i = N(L.rate)/100/12, n = N(L.term)*12;
  const piCalc = (n>0) ? (i>0 ? totalLoan*i/(1-Math.pow(1+i,-n)) : totalLoan/n) : 0;
  /* a figure typed into the housing block below wins until it is cleared */
  const pi = (L.piHold != null && L.piHold !== '') ? N(L.piHold) : piCalc;
  const taxes=N(L.taxAnnual)/12, ins=N(L.insAnnual)/12, flood=N(L.floodAnnual)/12, hoa=N(L.hoaMonthly);
  return {dp, dpPct, base, value, ltv, upfront, upfrontLabel, financed, totalLoan,
          annualRate, miMonthly, miDrop, miBasis, pi, piCalc, miCalc, taxes, ins, flood, hoa,
          pitia: pi+taxes+ins+flood+hoa+miMonthly};
}
function syncLoanToDTI(){
  if (!S.loan || !S.loan.sync) return;
  const r = calcLoan();
  S.dti.pi = r.pi; S.dti.taxes = r.taxes; S.dti.ins = r.ins;
  S.dti.hoa = r.hoa; S.dti.mi = r.miMonthly; S.dti.otherHousing = r.flood;
}

/* Every escrow accepts whichever unit the underwriter is holding; the others
   re-render from it, so nothing has to be converted by hand. */
function escGrid(L){
  const value = N(L.value) || N(L.price);
  const row = (lbl, which, annual, extra) => `
    <tr>
      <td class="rowlabel">${lbl}</td>
      <td><input class="cell-input" type="number" step="0.01" id="esc-${which}-yr"
            value="${round2(annual)}" oninput="setEsc('${which}',this.value,'yr')"></td>
      <td><input class="cell-input" type="number" step="0.01" id="esc-${which}-mo"
            value="${round2(annual/12)}" oninput="setEsc('${which}',this.value,'mo')"></td>
      <td>${extra||'<span class="muted small">&mdash;</span>'}</td>
    </tr>`;
  return `<div class="tbl-scroll"><table class="matrix" style="min-width:560px">
    <thead><tr><th>Escrow item</th><th class="num">Annual ($)</th><th class="num">Monthly ($)</th>
      <th class="num">% of value</th></tr></thead>
    <tbody>
      ${row('Property taxes','taxes', N(L.taxAnnual),
        `<input class="cell-input" type="number" step="0.001" id="esc-taxes-pct"
           value="${value?round2(N(L.taxAnnual)/value*100):0}" oninput="setEsc('taxes',this.value,'pct')">`)}
      ${row('Hazard insurance','ins', N(L.insAnnual))}
      ${row('Flood insurance','flood', N(L.floodAnnual))}
      ${row('HOA dues','hoa', N(L.hoaMonthly)*12)}
    </tbody></table></div>
    <div class="fhint" style="margin-top:7px">Type into any column &mdash; the others convert as you go.
      Property taxes also accept a mill-rate style percentage of the appraised value.</div>`;
}

function loanSetupCard(){
  const L = S.loan, prog = L.program;
  const f = (lbl,k,type,extra)=>`<div class="field"><label>${lbl}</label>
    <input class="cell-input" type="${type||'number'}" step="0.001" value="${type==='text'?esc(L[k]):N(L[k])}"
      ${extra||''} oninput="setLoan('${k}',this.value,${type==='text'?0:1})"></div>`;
  const sel = (lbl,k,opts)=>`<div class="field"><label>${lbl}</label>
    <select class="cell-input" onchange="setLoan('${k}',this.value)">
      ${opts.map(o=>`<option ${L[k]===o?'selected':''}>${o}</option>`).join('')}</select></div>`;
  return `<div class="card major">
    <div class="card-top"><span class="tag">Setup</span>
      <span class="doc-name">Loan Setup &mdash; Terms, Escrows &amp; Mortgage Insurance</span>
      <div class="spacer"></div>
      <label class="sw"><input type="checkbox" ${L.sync!==false?'checked':''}
        onchange="setLoan('sync',this.checked)">Feed PITIA below</label>
      <button class="btn-link no-print" onclick="importReno()"><svg class="icon"><use href="#i-up"/></svg>Import from Renovation Suite</button>
      <button class="btn-link no-print" onclick="exportReno()"><svg class="icon"><use href="#i-down"/></svg>Send income to Suite</button>
    </div>
    <div class="card-body">
      <div class="block"><div class="block-head" onclick="this.parentNode.classList.toggle('collapsed')">
        <h3><svg class="icon"><use href="#i-home"/></svg>Transaction</h3><svg class="icon chev"><use href="#i-chev"/></svg></div>
        <div class="block-body"><div class="grid g4">
          <div class="field"><label>Property address</label>
            <input class="cell-input" style="text-align:left" value="${esc(L.address)}" oninput="setLoan('address',this.value)"></div>
          ${sel('Loan program','program',['FHA','Conventional','VA','USDA'])}
          ${sel('Transaction','txn',['Purchase','Rate & Term Refinance','Cash-Out Refinance'])}
          ${sel('Occupancy','occ',['Primary Residence','Second Home','Investment'])}
          ${f('Units','units')}
          ${f('Representative FICO','fico')}
          <div class="field"><label>Purchase price / cost basis ($)</label>
            <input class="cell-input" type="number" step="0.01" id="ln-f-price" value="${N(L.price)}"
              oninput="setLinked('price',this.value)"></div>
          <div class="field"><label>Appraised value ($, blank = price)</label>
            <input class="cell-input" type="number" step="0.01" id="ln-f-value" value="${N(L.value)}"
              oninput="setLinked('value',this.value)"></div>
        </div></div></div>

      <div class="block"><div class="block-head" onclick="this.parentNode.classList.toggle('collapsed')">
        <h3><svg class="icon"><use href="#i-dollar"/></svg>Loan Amount &amp; Terms</h3><svg class="icon chev"><use href="#i-chev"/></svg></div>
        <div class="block-body"><div class="grid g4">
          <div class="field"><label>Down payment (%)</label>
            <input class="cell-input" type="number" step="0.001" id="ln-f-dpPct" value="${round2(N(L.dpPct))}"
              oninput="setLinked('dpPct',this.value)"></div>
          <div class="field"><label>Down payment ($)</label>
            <input class="cell-input" type="number" step="0.01" id="ln-f-dpAmt" value="${round2(N(L.dpAmt))}"
              oninput="setLinked('dpAmt',this.value)"></div>
          <div class="field"><label>Loan amount ($)</label>
            <input class="cell-input" type="number" step="0.01" id="ln-f-loanAmt" value="${round2(calcLoan().base)}"
              oninput="setLinked('loanAmt',this.value)">
            <div class="fhint">${N(L.baseOverride)>0
              ? `Held — the down payment follows. <button class="btn-link no-print" style="padding:0 4px"
                   onclick="setLoan('baseOverride',0,1)">release</button>`
              : 'Follows price less down payment — type here to hold it instead.'}</div></div>
          ${f('Note rate (%)','rate')}
          ${f('Term (years)','term')}
          ${prog!=='Conventional' ? f(prog==='VA'?'VA funding fee is calculated':'Upfront fee rate (%)','ufmipRate',
              'number', prog==='VA'?'disabled':'') : ''}
          ${prog!=='Conventional' ? `<div class="field"><label>Finance the upfront fee?</label>
            <select class="cell-input" onchange="setLoan('financeUfmip',this.value==='1')">
              <option value="1" ${L.financeUfmip!==false?'selected':''}>Yes — add to the loan</option>
              <option value="0" ${L.financeUfmip===false?'selected':''}>No — paid at closing</option></select></div>`:''}
          ${prog==='VA' ? `<div class="field"><label>VA use / exemption</label>
            <select class="cell-input" onchange="setLoan('vaExempt',this.value==='ex');setLoan('vaFirstUse',this.value==='first')">
              <option value="first" ${L.vaFirstUse&&!L.vaExempt?'selected':''}>First use</option>
              <option value="sub" ${!L.vaFirstUse&&!L.vaExempt?'selected':''}>Subsequent use</option>
              <option value="ex" ${L.vaExempt?'selected':''}>Fee exempt</option></select></div>`:''}
          ${prog==='FHA' ? f('High-balance threshold ($)','limit') : ''}
          ${f('Annual MI rate override (%, 0 = auto)','miOverride')}
        </div></div></div>

      <div class="block"><div class="block-head" onclick="this.parentNode.classList.toggle('collapsed')">
        <h3><svg class="icon"><use href="#i-shield"/></svg>Escrows &mdash; enter annually, monthly, or as a rate</h3>
        <svg class="icon chev"><use href="#i-chev"/></svg></div>
        <div class="block-body">${escGrid(L)}</div></div>

      <div class="stats">
        <div class="stat"><span class="k">Base loan amount</span><span class="v" id="ln-base">$0.00</span><span class="s" id="ln-dp">—</span></div>
        <div class="stat"><span class="k">LTV</span><span class="v" id="ln-ltv">0.0%</span><span class="s" id="ln-up">—</span></div>
        <div class="stat"><span class="k">Total loan amount</span><span class="v" id="ln-total">$0.00</span><span class="s">Base plus any financed fee</span></div>
        <div class="stat"><span class="k">Principal &amp; interest</span><span class="v" id="ln-pi">$0.00</span><span class="s" id="ln-terms">—</span></div>
        <div class="stat"><span class="k">Monthly mortgage insurance</span><span class="v" id="ln-mi">$0.00</span><span class="s" id="ln-mirate">—</span></div>
        <div class="stat"><span class="k">Taxes + insurance</span><span class="v" id="ln-ti">$0.00</span><span class="s" id="ln-tinote">—</span></div>
        <div class="stat"><span class="k">HOA + flood</span><span class="v" id="ln-hoa">$0.00</span><span class="s">Monthly</span></div>
        <div class="stat"><span class="k">Total PITIA</span><span class="v blue" id="ln-pitia">$0.00</span><span class="s" id="ln-sync">—</span></div>
      </div>
      <div class="notice info" style="margin-top:10px"><svg class="icon"><use href="#i-alert"/></svg>
        <span id="ln-note">—</span></div>
    </div></div>`;
}
function paintLoan(){
  if (!$('ln-pitia')) return;
  const r = calcLoan(), L = S.loan;
  setT('ln-base', money(r.base)); setT('ln-dp', `Down payment ${money(r.dp)} (${r.dpPct.toFixed(2)}%)`);
  setT('ln-ltv', (r.ltv*100).toFixed(2)+'%');
  setT('ln-up', r.upfront ? `${r.upfrontLabel} ${money(r.upfront)}${r.financed?' — financed':' — paid at closing'}` : 'No upfront fee');
  setT('ln-total', money(r.totalLoan));
  setT('ln-pi', money(r.pi)); setT('ln-terms', `${N(L.rate).toFixed(3)}% over ${N(L.term)} years`);
  setT('ln-mi', money(r.miMonthly));
  setT('ln-mirate', r.annualRate ? `${(r.annualRate*100).toFixed(2)}% annual on the ${r.miBasis.toLowerCase()}` : 'None');
  setT('ln-ti', money(r.taxes + r.ins)); setT('ln-tinote', `Taxes ${money(r.taxes)} · insurance ${money(r.ins)}`);
  setT('ln-hoa', money(r.hoa + r.flood));
  setT('ln-pitia', money(r.pitia));
  setT('ln-sync', L.sync!==false ? 'Feeding the housing expense below' : 'Not feeding the housing expense');
  /* Refresh every linked input except the one being typed into, so the whole
     card stays in agreement while the caret keeps its place. */
  const live = document.activeElement;
  const set = (id, v, dp) => { const el = $(id);
    if (el && el !== live) el.value = Number(v || 0).toFixed(dp == null ? 2 : dp); };
  if (L.sync!==false){
    const map = {pi:r.pi, taxes:r.taxes, ins:r.ins, hoa:r.hoa, mi:r.miMonthly, otherHousing:r.flood};
    Object.keys(map).forEach(k=> set('dti-in-'+k, map[k]) );
  }
  set('ln-f-price', N(L.price)); set('ln-f-value', N(L.value));
  set('ln-f-dpPct', N(L.dpPct), 3); set('ln-f-dpAmt', N(L.dpAmt));
  set('ln-f-loanAmt', r.base);
  const value = N(L.value) || N(L.price);
  [['taxes', N(L.taxAnnual)], ['ins', N(L.insAnnual)], ['flood', N(L.floodAnnual)], ['hoa', N(L.hoaMonthly)*12]]
    .forEach(([k, annual])=>{ set(`esc-${k}-yr`, annual); set(`esc-${k}-mo`, annual/12); });
  set('esc-taxes-pct', value ? N(L.taxAnnual)/value*100 : 0, 3);
  setT('ln-note', `${L.program} — ${r.miDrop}.` + (L.program==='Conventional'
    ? ' The PMI rate is a representative monthly rate card driven by LTV and FICO; confirm the exact factor against the MI company quote and override above.'
    : L.program==='FHA' ? ' Annual MIP follows the published schedule for the term, LTV and base loan amount.' : ''));
}

/* ---------------- Renovation Suite bridge ---------------- */
const RENO_KEY = 'mortgage-suite-state-v2';
function renoState(){ try{ const raw = localStorage.getItem(RENO_KEY); return raw ? JSON.parse(raw) : null; }catch(e){ return null; } }
function renoInputs(st){ try{ return st.scenarios[st.activeScenarioId].inputs; }catch(e){ return null; } }
function applyReno(inp){
  const L = S.loan;
  const bs = inp.borrowers || [];
  if (bs[0] && bs[0].name && !/^Borrower \d$/.test(bs[0].name)) S.b1 = bs[0].name;
  if (bs[1] && bs[1].name && !/^Borrower \d$/.test(bs[1].name)) S.b2 = bs[1].name;
  if (!S.b1 && inp.borrowerName) S.b1 = inp.borrowerName;
  const debts = bs.reduce((n,b)=>n+N(b.monthlyDebts),0);
  if (debts > 0){
    const row = S.dti.debts.find(d=>d.name==='Imported from Renovation Suite');
    if (row) row.amt = debts; else S.dti.debts.push({id:uid(), name:'Imported from Renovation Suite', amt:debts});
  }
  L.address = inp.propertyAddress || L.address;
  L.program = ({FHA:'FHA', Conventional:'Conventional', VA:'VA', USDA:'USDA'})[inp.loanProgram] || 'Conventional';
  L.txn  = inp.transactionType || L.txn;
  L.occ  = inp.occupancy || L.occ;
  L.units = N(inp.units) || L.units;
  L.fico = N(inp.creditScore) || L.fico;
  L.price = N(inp.basePurchasePrice);
  L.value = N(inp.afterRepairValue) || N(inp.asIsValue) || 0;
  const pctOf = v => Math.round(N(v)*100*1e6)/1e6;   /* 0.035 → 3.5, without float dust */
  L.dpMode = 'pct'; L.dpPct = pctOf(inp.finalDownPaymentPct || inp.baseDownPaymentPct);
  L.rate = pctOf(inp.interestRate);
  L.term = N(inp.termYears) || 30;
  L.ufmipRate = pctOf(inp.ufmipRate) || L.ufmipRate;
  L.miOverride = pctOf(inp.fhaMipOverrideRate || inp.pmiOverrideRate) || 0;
  if (!L.miOverride && inp.fhaAnnualMipRate && L.program==='FHA') L.miOverride = 0;
  L.taxAnnual = inp.propertyTaxBasis==='Monthly' ? N(inp.propertyTaxAmount)*12 : N(inp.propertyTaxAmount);
  L.insAnnual = inp.insuranceBasis==='Monthly' ? N(inp.insuranceAmount)*12 : N(inp.insuranceAmount);
  L.floodAnnual = N(inp.escrow && inp.escrow.annualFlood);
  L.hoaMonthly = N(inp.hoaMonthly);
  if (inp.assets && N(inp.assets.liquidAssets) > 0)
    S.assets.rows.push({id:uid(), name:'Liquid assets (Renovation Suite)', type:'checking',
                        bal:N(inp.assets.liquidAssets), elig:100});
  $('b1Name').value = S.b1||''; $('b2Name').value = S.b2||'';
  renderAll();
}
function importReno(){
  const st = renoState(), inp = st && renoInputs(st);
  if (!inp){
    if (confirm('No Renovation Suite file found in this browser.\n\nChoose a scenario JSON exported from the Suite instead?')) $('renoFile').click();
    return;
  }
  if (!confirm(`Import "${inp.name||'scenario'}" from the Renovation Suite in this browser?\n\nBorrower names, loan terms, escrows and monthly debts will be brought across.`)) return;
  applyReno(inp);
  toast('Imported from the Renovation Suite — check the loan setup');
}
function importRenoFile(ev){
  const f = ev.target.files[0]; if(!f) return;
  const rd = new FileReader();
  rd.onload = e => { try{
      const j = JSON.parse(e.target.result);
      const inp = j.scenarios ? renoInputs(j) : (j.inputs || j);
      if (!inp || !('basePurchasePrice' in inp)) throw new Error('That does not look like a Renovation Suite scenario');
      applyReno(inp); toast('Renovation Suite scenario imported');
    }catch(err){ alert('Could not read that file: '+err.message); } };
  rd.readAsText(f); ev.target.value='';
}
function renoPatch(){
  const t = calcTotals();
  return { borrowerName: [S.b1,S.b2].filter(Boolean).join(' & '),
           borrowers: [
             {name:S.b1||'Borrower 1', grossMonthlyIncome:round2(t.b1), otherMonthlyIncome:0,
              monthlyDebts:round2(S.dti.debts.reduce((n,d)=>n+N(d.amt),0) + t.rentNeg)},
             {name:S.b2||'Borrower 2', grossMonthlyIncome:round2(t.b2), otherMonthlyIncome:0, monthlyDebts:0},
             {name:'Borrower 3', grossMonthlyIncome:0, otherMonthlyIncome:0, monthlyDebts:0},
             {name:'Borrower 4', grossMonthlyIncome:0, otherMonthlyIncome:0, monthlyDebts:0}
           ] };
}
function exportReno(){
  const t = calcTotals(), patch = renoPatch();
  const st = renoState();
  const inSuite = st && renoInputs(st);
  const msg = `Send this file's qualifying income to the Renovation Suite?\n\n`
    + `${patch.borrowers[0].name}: ${money(t.b1)} / mo\n`
    + `${patch.borrowers[1].name}: ${money(t.b2)} / mo\n`
    + `Monthly debts: ${money(patch.borrowers[0].monthlyDebts)}\n\n`
    + (inSuite ? `It will be written into the Suite scenario "${inSuite.name||'active'}" in this browser.`
               : 'No Suite file was found in this browser — a JSON patch will be downloaded instead.');
  if (!confirm(msg)) return;
  if (inSuite){
    try{
      const sc = st.scenarios[st.activeScenarioId];
      sc.inputs = { ...sc.inputs, ...patch };
      sc.updatedAt = new Date().toISOString();
      localStorage.setItem(RENO_KEY, JSON.stringify(st));
      toast('Income written to the Renovation Suite — reload the Suite tab to see it');
      return;
    }catch(e){ /* fall through to the download */ }
  }
  dl(new Blob([JSON.stringify(patch,null,2)],{type:'application/json'}),
     `RenovationSuite_Income_${(S.b1||'Borrower').replace(/[^\w]+/g,'')}.json`);
  toast('Income patch downloaded for the Renovation Suite');
}
