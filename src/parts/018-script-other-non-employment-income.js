
/* ================== OTHER / NON-EMPLOYMENT INCOME ================== */
const OTHER_TYPES = [
  {v:'ssa',      t:'Social Security (Retirement / Survivor)', nt:true,  g:'ss'},
  {v:'ssdi',     t:'Social Security Disability (SSDI / SSI)', nt:true,  g:'ss'},
  {v:'pension',  t:'Pension / Retirement Distribution',       nt:false, g:'retire'},
  {v:'ira',      t:'IRA / 401(k) Distribution',               nt:false, g:'retire'},
  {v:'annuity',  t:'Annuity Income',                          nt:false, g:'retire'},
  {v:'disab',    t:'Long-Term Disability',                    nt:true,  g:'disab'},
  {v:'va',       t:'VA Benefits (non-education)',             nt:true,  g:'va'},
  {v:'military', t:'Military Entitlements (BAH / BAS / Flight)',nt:true, g:'military'},
  {v:'alimony',  t:'Alimony / Separate Maintenance',          nt:false, g:'support'},
  {v:'support',  t:'Child Support',                           nt:true,  g:'support'},
  {v:'foster',   t:'Foster Care Income',                      nt:true,  g:'foster'},
  {v:'trust',    t:'Trust Income',                            nt:false, g:'trust'},
  {v:'notes',    t:'Notes Receivable / Installment Sale',     nt:false, g:'notes'},
  {v:'royalty',  t:'Royalty Income (Sch E Part I)',           nt:false, g:'royalty'},
  {v:'intdiv',   t:'Interest &amp; Dividend Income',              nt:false, g:'intdiv'},
  {v:'capgain',  t:'Recurring Capital Gains',                 nt:false, g:'capgain'},
  {v:'unemp',    t:'Seasonal Unemployment',                   nt:false, g:'unemp'},
  {v:'boarder',  t:'Boarder Income',                          nt:false, g:'boarder'},
  {v:'autoallow',t:'Automobile / Housing Allowance',          nt:false, g:'allow'},
  {v:'1099',     t:'1099 / Contract Income',                  nt:false, g:'c1099'},
  {v:'pubassist',t:'Public Assistance',                       nt:true,  g:'pubassist'},
  {v:'tip',      t:'Tip Income',                              nt:false, g:'tip'},
  {v:'other',    t:'Other (describe)',                        nt:false, g:'other'}
];
function grossUpDefault(){ return S.agency==='FHA' ? 15 : 25; }
function newOther(){ return { id:uid(), use:true, b:1, type:'ssa', desc:'', amt:0,
  nonTax:true, grossUp:grossUpDefault(), continuance:36, docs:'' }; }
function calcOther(o){
  const base=N(o.amt);
  const up = o.nonTax ? base*N(o.grossUp)/100 : 0;
  return {base, up, total:base+up};
}
function renderOther(){
  $('otherList').innerHTML = S.other.length ? `<div class="card"><div class="card-body">
    <div class="tbl-scroll"><table class="matrix" style="min-width:1050px">
      <thead><tr><th>Income Type</th><th>Description / Source</th><th class="num">Monthly Amount</th>
        <th>Non-Taxable?</th><th class="num">Gross-Up %</th><th class="num">Continuance (mos)</th>
        <th>Borrower</th><th style="width:64px">Use</th>
        <th class="num">Qualifying Monthly</th><th>Guideline</th></tr></thead>
      <tbody>${S.other.map(o=>{
        const P=`oth-${o.id}`;
        return `<tr ${o.use===false?'style="opacity:.5"':''}>
          <td><select class="cell-input" style="min-width:210px" onchange="setField('other','${o.id}','type',this.value);syncOtherType('${o.id}')">
            ${OTHER_TYPES.map(t=>`<option value="${t.v}" ${o.type===t.v?'selected':''}>${t.t}</option>`).join('')}</select></td>
          <td><input class="cell-input" style="min-width:180px" placeholder="Source / documentation" value="${esc(o.desc)}" oninput="setField('other','${o.id}','desc',this.value)"></td>
          <td><input class="cell-input" type="number" step="0.01" value="${N(o.amt)}" oninput="setField('other','${o.id}','amt',this.value,1)"></td>
          <td><select class="cell-input" onchange="setField('other','${o.id}','nonTax',this.value==='1')">
            <option value="0" ${!o.nonTax?'selected':''}>Taxable</option>
            <option value="1" ${o.nonTax?'selected':''}>Non-Taxable</option></select></td>
          <td><input class="cell-input" type="number" step="0.01" value="${N(o.grossUp)}" oninput="setField('other','${o.id}','grossUp',this.value,1)"></td>
          <td><input class="cell-input" type="number" value="${N(o.continuance)}" oninput="setField('other','${o.id}','continuance',this.value,1)"></td>
          <td><select class="cell-input" style="min-width:74px" onchange="setBor('other','${o.id}',this.value)">
            <option value="1" ${o.b!==2?'selected':''}>B1</option>
            <option value="2" ${o.b===2?'selected':''}>B2</option></select></td>
          <td class="c"><label class="sw" style="gap:0"><input type="checkbox" ${o.use!==false?'checked':''}
            onchange="setUse('other','${o.id}',this.checked)"></label></td>
          <td class="num"><span class="calc-cell" id="${P}-tot">$0.00</span></td>
          <td style="white-space:nowrap">${guideBtn((OTHER_TYPES.find(x=>x.v===o.type)||{g:'other'}).g,'Guide')}
            <button class="btn-icon no-print" onclick="del('other','${o.id}')"><svg class="icon"><use href="#i-trash"/></svg></button></td>
        </tr>
        <tr ${o.use===false?'style="opacity:.5"':''}><td colspan="10" style="padding-top:0;padding-bottom:8px;border-bottom:2px solid var(--line)">
          ${chips(stOther(o))}</td></tr>`;}).join('')}
        <tr class="total-row"><td colspan="8">Total Other Monthly Income (sources in use)</td><td class="num" id="oth-total">$0.00</td><td></td></tr>
      </tbody></table></div>
    <div class="notice info" style="margin-top:12px"><svg class="icon"><use href="#i-alert"/></svg>
      <span><b>Gross-up:</b> Fannie Mae / Freddie Mac permit up to <b>25%</b> of documented non-taxable income;
      FHA permits <b>15%</b> (or the borrower's actual tax rate if higher and documented). Income must be expected to
      continue at least <b>3 years</b>; a continuance under 36 months is flagged below.</span></div>
    <div id="oth-flags"></div>
  </div></div>
  <div class="section-head" style="margin-top:4px">
    <div><h2 style="font-size:14px"><svg class="icon icon-lg" style="color:#0891b2"><use href="#i-book"/></svg>
      Guidelines, Documentation &amp; Calculation for the Income Types in Use</h2>
      <p>One card per income type entered above — agency requirements, what the file needs, and how the figure is derived.</p></div>
    <button class="btn-link no-print" onclick="document.querySelectorAll('#oth-guides .gl-card').forEach(c=>c.classList.toggle('open'))">
      <svg class="icon"><use href="#i-chev"/></svg>Expand / collapse all</button>
  </div>
  <div id="oth-guides">${othDocKeys().map(k=>docCard(k)).join('')}</div>`
  : `<div class="addblock" onclick="addOther()"><div class="t"><svg class="icon icon-lg" style="color:#0891b2"><use href="#i-plus"/></svg>Add Other Income</div><div class="s">Social Security, retirement, disability, support, trust, notes, interest and dividends — with gross-up and the continuance test.</div></div>`;
  setT('cnt-other', S.other.length);
}
function othDocKeys(){
  const k = [];
  S.other.forEach(o=>{ const t=OTHER_TYPES.find(x=>x.v===o.type); const g=t?t.g:'other';
    if (DOCREQ[g] && !k.includes(g)) k.push(g); });
  if (S.other.some(o=>o.nonTax) && !k.includes('grossup')) k.push('grossup');
  return k;
}
function syncOtherType(id){
  const o=findRec('other',id); const t=OTHER_TYPES.find(x=>x.v===o.type);
  if(t){ o.nonTax=t.nt; o.grossUp = t.nt ? grossUpDefault() : 0; }
  renderOther(); RECALC();
}
function paintOther(){
  let tot=0, flags='';
  S.other.forEach(o=>{ const r=calcOther(o); if(o.use!==false) tot+=r.total; setT(`oth-${o.id}-tot`, money(r.total));
    if (N(o.amt)>0 && N(o.continuance)<36)
      flags += `<div class="notice warn"><svg class="icon"><use href="#i-alert"/></svg><span><b>${esc(o.desc||o.type)}</b>: documented continuance of ${N(o.continuance)} months is less than the 3-year requirement — income may not be used.</span></div>`;
  });
  setT('oth-total', money(tot)); setH('oth-flags', flags);
}

/* ================== ASSET DEPLETION ================== */
const ASSET_TYPES = [
  {v:'checking', t:'Checking / Savings', e:100},
  {v:'mm',       t:'Money Market / CD',  e:100},
  {v:'stocks',   t:'Stocks / Bonds / Mutual Funds', e:70},
  {v:'ret59',    t:'Retirement — age 59½ or older', e:70},
  {v:'ret',      t:'Retirement — under 59½ (penalty)', e:60},
  {v:'trust',    t:'Trust / Vested Assets', e:100},
  {v:'other',    t:'Other Eligible Asset', e:100}
];
function newAsset(){ return {id:uid(), name:'', type:'checking', bal:0, elig:100}; }
function calcAssets(){
  const gross = S.assets.rows.reduce((s,r)=>s+N(r.bal),0);
  const eligible = S.assets.rows.reduce((s,r)=>s+N(r.bal)*N(r.elig)/100,0);
  const net = Math.max(0, eligible - N(S.assets.fundsToClose) - N(S.assets.reserves));
  const div = Math.max(1,N(S.assets.divisor));
  const monthly = S.assets.use ? net/div : 0;
  return {gross, eligible, net, monthly, div};
}
function renderAssets(){
  $('assetsBody').innerHTML = `
    <div class="tbl-scroll"><table class="matrix" style="min-width:760px">
      <thead><tr><th>Account / Institution</th><th>Asset Type</th><th class="num">Balance ($)</th>
        <th class="num">Eligible %</th><th class="num">Eligible Value</th><th></th></tr></thead>
      <tbody>${S.assets.rows.map(a=>`<tr>
        <td><input class="cell-input" placeholder="Account / institution" value="${esc(a.name)}" oninput="setAsset('${a.id}','name',this.value)"></td>
        <td><select class="cell-input" onchange="setAsset('${a.id}','type',this.value);syncAssetType('${a.id}')">
          ${ASSET_TYPES.map(t=>`<option value="${t.v}" ${a.type===t.v?'selected':''}>${t.t}</option>`).join('')}</select></td>
        <td><input class="cell-input" type="number" value="${N(a.bal)}" oninput="setAsset('${a.id}','bal',this.value,1)"></td>
        <td><input class="cell-input" type="number" value="${N(a.elig)}" oninput="setAsset('${a.id}','elig',this.value,1)"></td>
        <td class="num"><span class="calc-cell" id="ast-${a.id}">$0.00</span></td>
        <td><button class="btn-icon no-print" onclick="delAsset('${a.id}')"><svg class="icon"><use href="#i-trash"/></svg></button></td>
      </tr>`).join('')}</tbody></table></div>
    <button class="btn btn-light btn-sm no-print" style="margin-top:10px" onclick="S.assets.rows.push(newAsset());renderAssets();RECALC()">
      <svg class="icon"><use href="#i-plus"/></svg>Add Asset Account</button>
    <div class="grid g4" style="margin-top:16px">
      <div class="field"><label>Less: Funds Required to Close ($)</label>
        <input class="cell-input" type="number" value="${N(S.assets.fundsToClose)}" oninput="S.assets.fundsToClose=N(this.value);RECALC()"></div>
      <div class="field"><label>Less: Required Reserves ($)</label>
        <input class="cell-input" type="number" value="${N(S.assets.reserves)}" oninput="S.assets.reserves=N(this.value);RECALC()"></div>
      <div class="field"><label>Amortization Divisor (months)</label>
        <input class="cell-input" type="number" value="${N(S.assets.divisor)}" oninput="S.assets.divisor=N(this.value);RECALC()"></div>
      <div class="field"><label>Use Asset Depletion Income?</label>
        <select class="cell-input" onchange="S.assets.use=this.value==='1';RECALC()">
          <option value="0" ${!S.assets.use?'selected':''}>No</option>
          <option value="1" ${S.assets.use?'selected':''}>Yes — include in qualifying income</option></select></div>
    </div>
    <div class="stats">
      <div class="stat"><span class="k">Gross Assets</span><span class="v" id="ast-gross">$0.00</span></div>
      <div class="stat"><span class="k">Eligible After Haircut</span><span class="v" id="ast-elig">$0.00</span></div>
      <div class="stat"><span class="k">Net After Close &amp; Reserves</span><span class="v" id="ast-net">$0.00</span></div>
      <div class="stat"><span class="k">Monthly Income</span><span class="v blue" id="ast-mo">$0.00</span><span class="s" id="ast-div">—</span></div>
    </div>
    <div class="notice info" style="margin-top:14px"><svg class="icon"><use href="#i-alert"/></svg>
      <span><b>Divisor reference:</b> Fannie Mae employment-related assets use a <b>360-month</b> (or note-term) divisor;
      Freddie Mac asset-depletion uses <b>240 months</b>; FHA does not permit asset depletion as income (assets may still be reserves).</span></div>`;
}
function setAsset(id,f,v,num){ const a=S.assets.rows.find(r=>r.id===id); if(a){a[f]= num?N(v):v; RECALC();} }
function syncAssetType(id){ const a=S.assets.rows.find(r=>r.id===id); const t=ASSET_TYPES.find(x=>x.v===a.type); if(t)a.elig=t.e; renderAssets(); RECALC(); }
function delAsset(id){ S.assets.rows=S.assets.rows.filter(r=>r.id!==id); renderAssets(); RECALC(); }
function paintAssets(){
  const r=calcAssets();
  S.assets.rows.forEach(a=> setT(`ast-${a.id}`, money(N(a.bal)*N(a.elig)/100)) );
  setT('ast-gross', money(r.gross)); setT('ast-elig', money(r.eligible));
  setT('ast-net', money(r.net)); setT('ast-mo', money(r.monthly));
  setT('ast-div', `${money(r.net)} ÷ ${r.div} months`);
}

/* ================== DTI ================== */
const ON = r => r.use !== false;
function calcTotals(){
  const useW2 = S.w2.filter(ON);
  const w2  = (combineActive() && useW2.length>1) ? calcCombined(useW2).total
                                                  : useW2.reduce((s,j)=>s+calcW2(j).total,0);
  const sc  = S.schc.filter(ON).reduce((s,b)=>s+calcSchC(b).monthly,0);
  const co  = S.corp.filter(ON).reduce((s,e)=>s+calcCorp(e).monthly,0);
  let rentPos=0, rentNeg=0;
  S.sche.filter(ON).forEach(p=>{ const m=calcSchE(p).monthly; if(m>=0) rentPos+=m; else rentNeg+=Math.abs(m); });
  const ot  = S.other.filter(ON).reduce((s,o)=>s+calcOther(o).total,0);
  const ad  = calcAssets().monthly;
  const income = w2+sc+co+rentPos+ot+ad;
  const byB = b => {
    let v = 0;
    S.w2.filter(r=>ON(r)&&r.b===b).forEach(j=> v += calcW2(j).total );
    S.schc.filter(r=>ON(r)&&r.b===b).forEach(x=> v += calcSchC(x).monthly );
    S.corp.filter(r=>ON(r)&&r.b===b).forEach(x=> v += calcCorp(x).monthly );
    S.sche.filter(r=>ON(r)&&r.b===b).forEach(x=>{ const m=calcSchE(x).monthly; if(m>0) v += m; });
    S.other.filter(r=>ON(r)&&r.b===b).forEach(x=> v += calcOther(x).total );
    if ((S.assets.b||1)===b) v += calcAssets().monthly;
    return v;
  };
  const b1 = byB(1), b2 = byB(2);
  const pitia = N(S.dti.pi)+N(S.dti.taxes)+N(S.dti.ins)+N(S.dti.hoa)+N(S.dti.mi)+N(S.dti.otherHousing);
  const debts = S.dti.debts.reduce((s,d)=>s+N(d.amt),0) + rentNeg;
  const front = income ? pitia/income : 0;
  const back  = income ? (pitia+debts)/income : 0;
  return {w2,sc,co,rentPos,rentNeg,ot,ad,income,pitia,debts,front,back,b1,b2};
}
const DTI_MAX = {FNMA:{f:0,b:0.50,label:'DU: 50% back-end max (no front-end limit)'},
                  FHLMC:{f:0,b:0.50,label:'LPA: 50% back-end max (no front-end limit)'},
                  FHA:{f:0.31,b:0.43,label:'Manual: 31% / 43% (up to 40% / 56.9% with compensating factors)'},
                  VA:{f:0,b:0.41,label:'41% guideline + residual income test'},
                  AUTO:{f:0,b:0.50,label:'Auto selection pending'}};
function renderDTI(){
  const syncOn = S.loan && S.loan.sync !== false, L0 = S.loan || {};
  $('dtiBody').innerHTML = loanSetupCard() + `
  <div class="card"><div class="card-top"><span class="tag">Housing</span>
      <span class="doc-name">Subject Property Housing Expense &mdash; type over anything</span>
      <div class="spacer"></div>
      <span class="muted small">${syncOn
        ? 'Calculated from the loan setup above; a figure you type here holds and flows back up'
        : 'Loan setup is not feeding this block — every figure is yours'}</span></div>
    <div class="card-body">
      <div class="grid g6">
        ${[['pi','Principal &amp; Interest'],['taxes','Property Taxes'],['ins','Hazard Insurance'],
           ['hoa','HOA Dues'],['mi','Mortgage Insurance'],['otherHousing','Other (flood, lease)']]
          .map(([k,l])=>{
            const held = (k==='pi' && L0.piHold!=null && L0.piHold!=='')
                      || (k==='mi' && L0.miHold!=null && L0.miHold!=='');
            return `<div class="field"><label>${l} ($/mo)</label>
              <input class="cell-input" type="number" step="0.01" id="dti-in-${k}"
                value="${N(S.dti[k]).toFixed(2)}" oninput="setHousing('${k}',this.value)"
                ${(k==='pi'||k==='mi')?'onchange="renderDTI()"':''}>
              ${held?`<div class="fhint">Typed over the calculation.
                <button class="btn-link no-print" style="padding:0 4px" onclick="clearHold('${k}')">use calculated</button></div>`
                   :''}</div>`; }).join('')}
      </div>
      <div class="stats">
        <div class="stat"><span class="k">Total Subject PITIA</span><span class="v blue" id="dti-pitia">$0.00</span></div>
        <div class="stat"><span class="k">Total Monthly Debts</span><span class="v" id="dti-debts">$0.00</span><span class="s">Incl. negative rental cash flow</span></div>
        <div class="stat"><span class="k">Front-End Ratio</span><span class="v" id="dti-front">0.00%</span><span class="band ok" id="dti-fband">—</span></div>
        <div class="stat"><span class="k">Back-End Ratio</span><span class="v" id="dti-back">0.00%</span><span class="band ok" id="dti-bband">—</span></div>
      </div>
      <div class="notice info" style="margin-top:12px"><svg class="icon"><use href="#i-alert"/></svg><span id="dti-bench">—</span></div>
    </div></div>
  <div class="card"><div class="card-top"><span class="tag slate">Monthly Liabilities</span>
      <div class="spacer"></div>
      <button class="btn btn-light btn-sm no-print" onclick="S.dti.debts.push({id:uid(),name:'New Liability',amt:0});renderDTI();RECALC()">
        <svg class="icon"><use href="#i-plus"/></svg>Add Liability</button></div>
    <div class="card-body">
      <div class="tbl-scroll"><table class="matrix" style="min-width:520px">
        <thead><tr><th>Creditor / Description</th><th class="num">Monthly Payment ($)</th><th></th></tr></thead>
        <tbody>${S.dti.debts.map(d=>`<tr>
          <td><input class="cell-input" placeholder="Creditor" value="${esc(d.name)}" oninput="setDebt('${d.id}','name',this.value)"></td>
          <td><input class="cell-input" type="number" step="0.01" value="${N(d.amt)}" oninput="setDebt('${d.id}','amt',this.value,1)"></td>
          <td><button class="btn-icon no-print" onclick="S.dti.debts=S.dti.debts.filter(x=>x.id!=='${d.id}');renderDTI();RECALC()"><svg class="icon"><use href="#i-trash"/></svg></button></td>
        </tr>`).join('') || '<tr><td colspan="3" class="muted">No liabilities entered.</td></tr>'}</tbody></table></div>
    </div></div>`;
}
function setDebt(id,f,v,num){ const d=S.dti.debts.find(x=>x.id===id); if(d){ d[f]= num?N(v):v; RECALC(); } }
function paintDTI(){
  const t=calcTotals(), mx=DTI_MAX[S.agency];
  setT('dti-pitia', money(t.pitia)); setT('dti-debts', money(t.debts));
  setT('dti-front', (t.front*100).toFixed(2)+'%'); setT('dti-back', (t.back*100).toFixed(2)+'%');
  const fb=$('dti-fband'), bb=$('dti-bband');
  if(fb){ const lim=mx.f; fb.className='band ' + (!lim?'ok': t.front<=lim?'ok': t.front<=lim*1.3?'warn':'bad');
    fb.textContent = lim ? `Max ${(lim*100).toFixed(0)}%` : 'No agency front-end cap'; }
  if(bb){ bb.className='band ' + (t.back<=mx.b?'ok': t.back<=mx.b*1.14?'warn':'bad');
    bb.textContent = t.back<=mx.b ? `Within ${(mx.b*100).toFixed(0)}% max` : `Exceeds ${(mx.b*100).toFixed(0)}% max`; }
  setT('dti-bench', `${S.agency} benchmark — ${mx.label}`);
}
