
/* ================== SCHEDULE C (FNMA 1084 / FHLMC 91) ================== */
const SCHC_LINES = [
  {k:'net31',  sign:1,  label:'Line 31: Net Profit or (Loss)',                 cite:'Sch C Ln 31'},
  {k:'depl12', sign:1,  label:'Plus: Depletion',                               cite:'Sch C Ln 12'},
  {k:'depr13', sign:1,  label:'Plus: Depreciation',                            cite:'Sch C Ln 13'},
  {k:'meals',  sign:-1, label:'Less: Meals &amp; Entertainment Exclusion',     cite:'Sch C Ln 24b'},
  {k:'home30', sign:1,  label:'Plus: Business Use of Home',                    cite:'Sch C Ln 30'},
  {k:'amort',  sign:1,  label:'Plus: Amortization / Casualty Loss / Non-recurring',cite:'Sch C Other'},
  {k:'miles',  sign:0,  label:'Business Miles Driven (x depreciation rate)',   cite:'Sch C Pt IV Ln 44a'}
];
function newSchC(){
  return { id:uid(), use:true, b:1, mode:'manual', name:'', rate:0.30, method:'auto',
    y1:{yr:new Date().getFullYear()-1, net31:0, depl12:0, depr13:0, meals:0, home30:0, amort:0, miles:0},
    y2:{yr:new Date().getFullYear()-2, net31:0, depl12:0, depr13:0, meals:0, home30:0, amort:0, miles:0},
    custom:0 };
}
function calcSchC(b){
  const yr = y => {
    const d=b[y];
    return N(d.net31)+N(d.depl12)+N(d.depr13)-N(d.meals)+N(d.home30)+N(d.amort)+N(d.miles)*N(b.rate);
  };
  const a1=yr('y1'), a2=yr('y2');
  const m1=a1/12, m2=a2/12, avg=(a1+a2)/24;
  const declining = m1 < m2;
  let method = (b.mode==='auto') ? 'auto' : b.method, monthly;
  if (method==='auto') method = declining ? 'recent' : 'avg2';
  if (method==='recent') monthly=m1;
  else if (method==='avg2') monthly=avg;
  else if (method==='lower') monthly=Math.min(m1,m2);
  else monthly=N(b.custom);
  return {a1,a2,m1,m2,avg,declining,monthly,methodUsed:method};
}
function renderSchC(){
  $('schcList').innerHTML = S.schc.map((b,i)=>{
    const P=`schc-${b.id}`;
    const rows = SCHC_LINES.map(L=>`
      <tr><td class="rowlabel">${L.label}<span class="muted mono" style="margin-left:8px">${L.cite}</span></td>
      ${['y1','y2'].map(y=>`<td><input class="cell-input" type="number" step="0.01" value="${N(b[y][L.k])}"
        oninput="setField('schc','${b.id}','${y}.${L.k}',this.value,1)"></td>`).join('')}</tr>`).join('');
    return `<div class="card ${b.use===false?'excluded':''}">
      <div class="card-top"><span class="tag amber">Sch C #${i+1}</span>
        <input class="name-input" placeholder="Business name" value="${esc(b.name)}" oninput="setField('schc','${b.id}','name',this.value)">
        <div class="spacer"></div>
        ${cardCtl('schc', b)}
        ${guideBtn('schc','Guidelines')}
        <button class="btn-icon no-print" onclick="del('schc','${b.id}')"><svg class="icon"><use href="#i-trash"/></svg></button>
      </div>
      <div class="status-strip">${chips(stSchC(b))}</div>
      <div class="card-body">
        <div class="tbl-scroll"><table class="matrix">
          <thead><tr><th>Schedule C Line Item</th>
            <th style="width:230px">Most Recent Tax Year
              <input class="cell-input" style="width:80px;display:inline-block;margin-left:6px;padding:2px 5px" type="number"
                value="${b.y1.yr}" oninput="setField('schc','${b.id}','y1.yr',this.value,1)"></th>
            <th style="width:230px">Prior Tax Year
              <input class="cell-input" style="width:80px;display:inline-block;margin-left:6px;padding:2px 5px" type="number"
                value="${b.y2.yr}" oninput="setField('schc','${b.id}','y2.yr',this.value,1)"></th></tr></thead>
          <tbody>${rows}
            <tr class="total-row"><td class="rowlabel">Adjusted Annual Business Income</td>
              <td class="num" id="${P}-a1">$0.00</td><td class="num" id="${P}-a2">$0.00</td></tr>
            <tr class="meta-row"><td class="rowlabel">Monthly Equivalent</td>
              <td class="num" id="${P}-m1">$0.00</td><td class="num" id="${P}-m2">$0.00</td></tr>
          </tbody></table></div>
        <div class="grid g4" style="margin-top:14px">
          <div class="field"><label>Mileage depreciation rate ($ per mile)</label>
            <input class="cell-input" type="number" step="0.001" value="${b.rate}" oninput="setField('schc','${b.id}','rate',this.value,1)"></div>
          <div class="field"><label>Calculation Method${b.mode==='auto'?' — locked by Auto':''}</label>
            <select class="cell-input" ${b.mode==='auto'?'disabled':''} onchange="setField('schc','${b.id}','method',this.value)">
              <option value="auto"   ${b.method==='auto'?'selected':''}>Auto (agency rule)</option>
              <option value="avg2"   ${b.method==='avg2'?'selected':''}>24-Month Average</option>
              <option value="recent" ${b.method==='recent'?'selected':''}>Most Recent Year Only</option>
              <option value="lower"  ${b.method==='lower'?'selected':''}>Lower of the Two Years</option>
              <option value="custom" ${b.method==='custom'?'selected':''}>Custom Override</option>
            </select></div>
          <div class="field"><label>Custom Override ($/mo)</label>
            <input class="cell-input" type="number" step="0.01" ${b.mode==='auto'?'disabled':''}
              value="${N(b.custom)}" oninput="setField('schc','${b.id}','custom',this.value,1)"></div>
        </div>
        <div class="result-bar amber">
          <div><div class="big" id="${P}-res">Qualifying Sch C Income: $0.00 / mo</div>
               <div class="sub" id="${P}-sub">—</div></div>
          <div class="right" id="${P}-right">—</div>
        </div>
        ${usedBar(calcSchC(b).monthly, `${esc(b.name)||'This business'} — ${bName(b.b)}`, b.use!==false)}
      </div></div>`;
  }).join('') || `<div class="addblock" onclick="addSchC()"><div class="t"><svg class="icon icon-lg" style="color:var(--amber)"><use href="#i-plus"/></svg>Add Schedule C Business</div><div class="s">Sole proprietorship income analysed on Fannie Mae Form 1084 / Freddie Mac Form 91. The full worksheet opens once you add a business.</div></div>`;
  setT('cnt-schc', S.schc.length);
}
function paintSchC(){
  S.schc.forEach(b=>{ const P=`schc-${b.id}`, r=calcSchC(b);
    setT(`${P}-a1`, money(r.a1)); setT(`${P}-a2`, money(r.a2));
    setT(`${P}-m1`, money(r.m1)); setT(`${P}-m2`, money(r.m2));
    setT(`${P}-res`, `Qualifying Sch C Income: ${money(r.monthly)} / mo`);
    setT(`${P}-sub`, r.declining
      ? 'Income DECLINING year over year — most recent year used; declining self-employment income requires written justification.'
      : 'Income stable / increasing — 24-month combined average used.');
    setT(`${P}-right`, `Yr 1 Monthly: ${money(r.m1)}  |  Yr 2 Monthly: ${money(r.m2)}  |  Method: ${r.methodUsed}`);
  });
}

/* ================== CORPORATE / PARTNERSHIP ================== */
const K1_LINES = [
  {k:'ordinary', label:'Ordinary Business Income (Loss)', cite:'K-1 Pt III Ln 1'},
  {k:'netRental',label:'Net Rental Real Estate Income (Loss)', cite:'K-1 Pt III Ln 2'},
  {k:'othRental',label:'Other Net Rental Income (Loss)', cite:'K-1 Pt III Ln 3'},
  {k:'guar',     label:'Guaranteed Payments (1065 only)', cite:'K-1 Pt III Ln 4c'},
  {k:'dist',     label:'Distributions Received', cite:'1120S Ln 16d / 1065 Ln 19'},
  {k:'w2biz',    label:'W-2 Wages Received From This Business', cite:'W-2 / Ln 7'}
];
const BIZ_ADJ = [
  {k:'depr',   sign:1,  label:'Plus: Depreciation',                       cite:'1120S Ln 14 / 1065 Ln 16a'},
  {k:'depl',   sign:1,  label:'Plus: Depletion',                          cite:'1120S Ln 15 / 1065 Ln 17'},
  {k:'amort',  sign:1,  label:'Plus: Amortization / Casualty Loss',       cite:'Attached schedule'},
  {k:'nonrec', sign:-1, label:'Less: Non-recurring Other Income',         cite:'1120S Ln 4-5 / 1065 Ln 5-7'},
  {k:'notes',  sign:-1, label:'Less: Mortgages / Notes Payable &lt; 1 Yr',cite:'Sch L Ln 16/17 Col D'},
  {k:'travel', sign:-1, label:'Less: Travel &amp; Entertainment Exclusion',cite:'Sch M-1 Ln 3b / 4b'}
];
const C1120 = [
  {k:'taxable', sign:1,  label:'Taxable Income',                      cite:'1120 Ln 30'},
  {k:'tax',     sign:-1, label:'Less: Total Tax',                     cite:'1120 Ln 31'},
  {k:'gains',   sign:-1, label:'Less: Non-recurring (Gains) Losses',  cite:'1120 Ln 8 &amp; 9'},
  {k:'othinc',  sign:-1, label:'Less: Non-recurring Other (Income)',  cite:'1120 Ln 10'},
  {k:'depr',    sign:1,  label:'Plus: Depreciation',                  cite:'1120 Ln 20'},
  {k:'depl',    sign:1,  label:'Plus: Depletion',                     cite:'1120 Ln 21'},
  {k:'amort',   sign:1,  label:'Plus: Amortization / Casualty Loss',  cite:'1120 Ln 26 attach.'},
  {k:'nol',     sign:-1, label:'Less: Net Operating Loss &amp; Special Deductions', cite:'1120 Ln 29c'},
  {k:'notes',   sign:-1, label:'Less: Mortgages / Notes Payable &lt; 1 Yr',        cite:'Sch L Ln 17 Col D'},
  {k:'travel',  sign:-1, label:'Less: Travel &amp; Entertainment Exclusion',        cite:'Sch M-1 Ln 5c'},
  {k:'divid',   sign:0,  label:'Dividends Paid to Borrower (added after ownership %)', cite:'1040 Sch B Ln 6'}
];
function blankCorpYear(){ const o={}; [...K1_LINES,...BIZ_ADJ,...C1120].forEach(l=>o[l.k]=0); return o; }
function newCorp(){
  const y1=blankCorpYear(), y2=blankCorpYear();
  return { id:uid(), use:true, b:1, mode:'manual', name:'', form:'1065', own:100, liquidity:false,
    y1:Object.assign({yr:new Date().getFullYear()-1},y1), y2:Object.assign({yr:new Date().getFullYear()-2},y2),
    curAssets:0, curLiab:0, method:'auto', custom:0 };
}
function calcCorp(e){
  const own = N(e.own)/100;
  const gov = (S.agency==='FHA' || S.agency==='VA');
  const yearVal = y => {
    const d=e[y];
    if (e.form==='1120'){
      let v=0; C1120.forEach(l=>{ if(l.sign) v += l.sign*N(d[l.k]); });
      return v*own + N(d.divid);
    }
    let ord = N(d.ordinary);
    /* Conventional: use LESSER of distributions or ordinary income unless business liquidity is documented */
    if (!gov && !e.liquidity && N(d.dist)>0) ord = Math.min(ord, N(d.dist));
    let adj = 0; BIZ_ADJ.forEach(l=> adj += l.sign*N(d[l.k]) );
    const share = (ord + N(d.netRental) + N(d.othRental) + adj) * own;
    return share + (e.form==='1065' ? N(d.guar) : 0) + N(d.w2biz);
  };
  const a1=yearVal('y1'), a2=yearVal('y2');
  const m1=a1/12, m2=a2/12, avg=(a1+a2)/24;
  const declining = m1<m2;
  let method = (e.mode==='auto') ? 'auto' : e.method, monthly;
  if (method==='auto') method = declining ? 'recent' : 'avg2';
  if (method==='recent') monthly=m1; else if (method==='avg2') monthly=avg;
  else if (method==='lower') monthly=Math.min(m1,m2); else monthly=N(e.custom);
  const quick = N(e.curLiab) ? N(e.curAssets)/N(e.curLiab) : 0;
  return {a1,a2,m1,m2,avg,monthly,declining,methodUsed:method,quick,own,gov};
}
function renderCorp(){
  $('corpList').innerHTML = S.corp.map((e,i)=>{
    const P=`corp-${e.id}`;
    const lines = e.form==='1120' ? C1120 : [...K1_LINES,...BIZ_ADJ];
    const rows = lines.filter(l=>!(e.form==='1120S' && l.k==='guar')).map(L=>`
      <tr><td class="rowlabel">${L.label}<span class="muted mono" style="margin-left:8px">${L.cite}</span></td>
      ${['y1','y2'].map(y=>`<td><input class="cell-input" type="number" step="0.01" value="${N(e[y][L.k])}"
        oninput="setField('corp','${e.id}','${y}.${L.k}',this.value,1)"></td>`).join('')}</tr>`).join('');
    return `<div class="card ${e.use===false?'excluded':''}">
      <div class="card-top"><span class="tag violet">Entity #${i+1}</span>
        <input class="name-input" placeholder="Entity name" value="${esc(e.name)}" oninput="setField('corp','${e.id}','name',this.value)">
        <select class="cell-input" style="width:190px" onchange="setField('corp','${e.id}','form',this.value);renderCorp();RECALC()">
          <option value="1065"  ${e.form==='1065'?'selected':''}>Form 1065 Partnership</option>
          <option value="1120S" ${e.form==='1120S'?'selected':''}>Form 1120-S S-Corporation</option>
          <option value="1120"  ${e.form==='1120'?'selected':''}>Form 1120 C-Corporation</option>
        </select>
        <div class="spacer"></div>
        <span class="muted small">Ownership %</span>
        <input class="cell-input" style="width:70px" type="number" step="0.01" value="${N(e.own)}" oninput="setField('corp','${e.id}','own',this.value,1)">
        ${cardCtl('corp', e)}
        ${guideBtn(e.form==='1065'?'partnership':e.form==='1120S'?'scorp':'ccorp','Guidelines')}
        <button class="btn-icon no-print" onclick="del('corp','${e.id}')"><svg class="icon"><use href="#i-trash"/></svg></button>
      </div>
      <div class="status-strip">${chips(stCorp(e))}</div>
      <div class="card-body">
        <div class="tbl-scroll"><table class="matrix">
          <thead><tr><th>Tax Return / K-1 Line Item</th>
            <th style="width:230px">Yr 1 <input class="cell-input" style="width:80px;display:inline-block;margin-left:6px;padding:2px 5px" type="number" value="${e.y1.yr}" oninput="setField('corp','${e.id}','y1.yr',this.value,1)"></th>
            <th style="width:230px">Yr 2 <input class="cell-input" style="width:80px;display:inline-block;margin-left:6px;padding:2px 5px" type="number" value="${e.y2.yr}" oninput="setField('corp','${e.id}','y2.yr',this.value,1)"></th></tr></thead>
          <tbody>${rows}
            <tr class="total-row"><td class="rowlabel">Borrower Share of Annual Cash Flow</td>
              <td class="num" id="${P}-a1">$0.00</td><td class="num" id="${P}-a2">$0.00</td></tr>
            <tr class="meta-row"><td class="rowlabel">Monthly Equivalent</td>
              <td class="num" id="${P}-m1">$0.00</td><td class="num" id="${P}-m2">$0.00</td></tr>
          </tbody></table></div>

        <div class="block" style="margin-top:14px">
          <div class="block-head" onclick="this.parentNode.classList.toggle('collapsed')">
            <h3><svg class="icon"><use href="#i-shield"/></svg>Business Liquidity Test (Quick Ratio / Current Ratio)</h3>
            <svg class="icon chev"><use href="#i-chev"/></svg>
          </div>
          <div class="block-body">
            <div class="grid g4">
              <div class="field"><label>Current Assets ($)</label><input class="cell-input" type="number" value="${N(e.curAssets)}" oninput="setField('corp','${e.id}','curAssets',this.value,1)"></div>
              <div class="field"><label>Current Liabilities ($)</label><input class="cell-input" type="number" value="${N(e.curLiab)}" oninput="setField('corp','${e.id}','curLiab',this.value,1)"></div>
              <div class="field"><label>Ratio Result</label><div class="calc-cell" style="text-align:left" id="${P}-quick">—</div></div>
              <div class="field"><label>Liquidity Documented?</label>
                <select class="cell-input" onchange="setField('corp','${e.id}','liquidity',this.value==='1')">
                  <option value="0" ${!e.liquidity?'selected':''}>No — cap income at distributions</option>
                  <option value="1" ${e.liquidity?'selected':''}>Yes — use full ordinary income</option>
                </select></div>
            </div>
            <div class="notice info" style="margin-top:10px"><svg class="icon"><use href="#i-alert"/></svg>
              <span>Conventional: use the <b>lesser of K-1 distributions or ordinary business income</b>. To use the higher ordinary income
              the business must show adequate liquidity (ratio &ge; 1.00). Government loans (FHA / VA) use ordinary business income.</span></div>
          </div>
        </div>

        <div class="grid g4">
          <div class="field"><label>Calculation Method${e.mode==='auto'?' — locked by Auto':''}</label>
            <select class="cell-input" ${e.mode==='auto'?'disabled':''} onchange="setField('corp','${e.id}','method',this.value)">
              <option value="auto"   ${e.method==='auto'?'selected':''}>Auto (agency rule)</option>
              <option value="avg2"   ${e.method==='avg2'?'selected':''}>24-Month Average</option>
              <option value="recent" ${e.method==='recent'?'selected':''}>Most Recent Year Only</option>
              <option value="lower"  ${e.method==='lower'?'selected':''}>Lower of the Two Years</option>
              <option value="custom" ${e.method==='custom'?'selected':''}>Custom Override</option>
            </select></div>
          <div class="field"><label>Custom Override ($/mo)</label>
            <input class="cell-input" type="number" step="0.01" value="${N(e.custom)}" oninput="setField('corp','${e.id}','custom',this.value,1)"></div>
        </div>
        <div class="result-bar violet">
          <div><div class="big" id="${P}-res">Qualifying Corporate Income: $0.00 / mo</div>
               <div class="sub" id="${P}-sub">—</div></div>
          <div class="right" id="${P}-right">—</div>
        </div>
        ${usedBar(calcCorp(e).monthly, `${esc(e.name)||'This entity'} — ${bName(e.b)}`, e.use!==false)}
      </div></div>`;
  }).join('') || `<div class="addblock" onclick="addCorp()"><div class="t"><svg class="icon icon-lg" style="color:var(--violet)"><use href="#i-plus"/></svg>Add Corporate Entity</div><div class="s">Partnership, S-corporation or C-corporation cash flow with K-1 pass-through, ownership percentage and the liquidity test.</div></div>`;
  setT('cnt-corp', S.corp.length);
}
function paintCorp(){
  S.corp.forEach(e=>{ const P=`corp-${e.id}`, r=calcCorp(e);
    setT(`${P}-a1`, money(r.a1)); setT(`${P}-a2`, money(r.a2));
    setT(`${P}-m1`, money(r.m1)); setT(`${P}-m2`, money(r.m2));
    setT(`${P}-quick`, r.quick ? r.quick.toFixed(2) + (r.quick>=1?'  — PASS':'  — FAIL') : '—');
    setT(`${P}-res`, `Qualifying Corporate Income: ${money(r.monthly)} / mo`);
    setT(`${P}-sub`, `Based on ${N(e.own)}% ownership ${e.form==='1065'?'pass-through + guaranteed payments':'pass-through'}`
      + (r.declining ? ' — DECLINING, most recent year used.' : ' — stable, 24-month average used.'));
    setT(`${P}-right`, `Yr 1: ${money(r.a1)}  |  Yr 2: ${money(r.a2)}  |  Method: ${r.methodUsed}`);
  });
}

/* ================== SCHEDULE E — RENTALS ================== */
function newSchE(){
  return { id:uid(), use:true, b:1, addr:'', method:'sche', months:12,
    fairDays:365, personalDays:0, monthsOverride:0, subject:false,
    rents:0, ins:0, mortInt:0, taxes:0, depr:0, otherAdd:0, totalExp:0,
    leaseRent:0, vacancy:75, pitia:0 };
}
/* Months in service from Schedule E Line 2 "Fair Rental Days" (365-day year basis).
   A manual override wins when it is greater than zero. */
function scheMonths(p){
  if (N(p.monthsOverride) > 0) return Math.min(12, N(p.monthsOverride));
  const d = N(p.fairDays);
  if (d > 0) return Math.max(0.25, Math.min(12, d/365*12));
  return 12;
}
function calcSchE(p){
  let monthly=0, basis='';
  if (p.method==='sche'){
    const net = N(p.rents)+N(p.ins)+N(p.mortInt)+N(p.taxes)+N(p.depr)+N(p.otherAdd)-N(p.totalExp);
    const mos = scheMonths(p);
    monthly = net/mos - N(p.pitia);
    const pd = N(p.personalDays);
    basis = `Schedule E: (Rents + add-backs ${money(net)}) / ${mos.toFixed(2)} mo`
          + ` (${N(p.fairDays)} fair rental days${pd?` / ${pd} personal-use days`:''})`
          + ` − full PITIA ${money(N(p.pitia))}`;
    return {net, gross:net/mos, monthly, basis, mos};
  }
  const g = N(p.leaseRent)*N(p.vacancy)/100;
  monthly = g - N(p.pitia);
  basis = `Lease method: ${money(N(p.leaseRent))} gross x ${N(p.vacancy)}% − full PITIA ${money(N(p.pitia))}`;
  return {net:g*12, gross:g, monthly, basis, mos:12};
}
function renderSchE(){
  $('scheList').innerHTML = S.sche.map((p,i)=>{
    const P=`sche-${p.id}`;
    const schE = `
      <div class="grid g4">
        <div class="field"><label>Gross Rents Received ($/yr) &mdash; Ln 3</label><input class="cell-input" type="number" value="${N(p.rents)}" oninput="setField('sche','${p.id}','rents',this.value,1)"></div>
        <div class="field"><label>Total Expenses ($/yr) &mdash; Ln 20</label><input class="cell-input" type="number" value="${N(p.totalExp)}" oninput="setField('sche','${p.id}','totalExp',this.value,1)"></div>
        <div class="field"><label>Add: Insurance &mdash; Ln 9</label><input class="cell-input" type="number" value="${N(p.ins)}" oninput="setField('sche','${p.id}','ins',this.value,1)"></div>
        <div class="field"><label>Add: Mortgage Interest &mdash; Ln 12</label><input class="cell-input" type="number" value="${N(p.mortInt)}" oninput="setField('sche','${p.id}','mortInt',this.value,1)"></div>
        <div class="field"><label>Add: Taxes &mdash; Ln 16</label><input class="cell-input" type="number" value="${N(p.taxes)}" oninput="setField('sche','${p.id}','taxes',this.value,1)"></div>
        <div class="field"><label>Add: Depreciation / Depletion &mdash; Ln 18</label><input class="cell-input" type="number" value="${N(p.depr)}" oninput="setField('sche','${p.id}','depr',this.value,1)"></div>
        <div class="field"><label>Add: HOA / Documented Repairs &mdash; Ln 14/19</label><input class="cell-input" type="number" value="${N(p.otherAdd)}" oninput="setField('sche','${p.id}','otherAdd',this.value,1)"></div>
        <div class="field"><label>Fair Rental Days &mdash; Sch E Ln 2</label>
          <input class="cell-input" type="number" min="0" max="366" value="${N(p.fairDays)}" oninput="setField('sche','${p.id}','fairDays',this.value,1)"></div>
        <div class="field"><label>Personal Use Days &mdash; Sch E Ln 2</label>
          <input class="cell-input" type="number" min="0" max="366" value="${N(p.personalDays)}" oninput="setField('sche','${p.id}','personalDays',this.value,1)"></div>
        <div class="field"><label>Months in Service (from fair rental days)</label>
          <div class="calc-cell" style="text-align:left" id="sche-${p.id}-mos">12.00</div></div>
        <div class="field"><label>Override Months (0 = auto)</label>
          <input class="cell-input" type="number" step="0.01" min="0" max="12" value="${N(p.monthsOverride)}" oninput="setField('sche','${p.id}','monthsOverride',this.value,1)"></div>
      </div>
      <div class="notice info" style="margin-top:10px"><svg class="icon"><use href="#i-alert"/></svg>
        <span><b>Fair rental days</b> (Schedule E line 2) drive the annualization: months in service =
        fair rental days &divide; 365 &times; 12. A property rented only part of the year is annualized over that
        shorter period rather than 12 months. Enter an override only when the documented in-service period
        differs from the days reported on the return.</span></div>`;
    const lease = `
      <div class="grid g4">
        <div class="field"><label>Gross Monthly Lease Rent ($)</label><input class="cell-input" type="number" value="${N(p.leaseRent)}" oninput="setField('sche','${p.id}','leaseRent',this.value,1)"></div>
        <div class="field"><label>Vacancy Factor (%)</label><input class="cell-input" type="number" value="${N(p.vacancy)}" oninput="setField('sche','${p.id}','vacancy',this.value,1)"></div>
      </div>`;
    return `<div class="card ${p.use===false?'excluded':''}">
      <div class="card-top"><span class="tag green">Property #${i+1}</span>
        <input class="name-input" style="min-width:300px" placeholder="Property address" value="${esc(p.addr)}" oninput="setField('sche','${p.id}','addr',this.value)">
        <div class="spacer"></div>
        <select class="cell-input" style="width:250px" onchange="setField('sche','${p.id}','method',this.value);renderSchE();RECALC()">
          <option value="sche"  ${p.method==='sche'?'selected':''}>Schedule E Tax Return Method</option>
          <option value="lease" ${p.method==='lease'?'selected':''}>Lease Agreement / 75% Rule</option>
        </select>
        ${cardCtl('sche', p, {mode:false})}
        ${guideBtn('rental','Guidelines')}
        <button class="btn-icon no-print" onclick="del('sche','${p.id}')"><svg class="icon"><use href="#i-trash"/></svg></button>
      </div>
      <div class="status-strip">${chips(stSchE(p))}</div>
      <div class="card-body">
        ${p.method==='sche'?schE:lease}
        <div class="grid g4" style="margin-top:12px">
          <div class="field"><label>Full PITIA on This Property ($/mo)</label><input class="cell-input" type="number" value="${N(p.pitia)}" oninput="setField('sche','${p.id}','pitia',this.value,1)"></div>
          <div class="field"><label>Is this the subject property?</label>
            <select class="cell-input" onchange="setField('sche','${p.id}','subject',this.value==='1')">
              <option value="0" ${!p.subject?'selected':''}>No — existing REO</option>
              <option value="1" ${p.subject?'selected':''}>Yes — subject property</option>
            </select></div>
        </div>
        <div class="result-bar green" id="${P}-bar">
          <div><div class="big" id="${P}-res">Net Rental Cash Flow: $0.00 / month</div>
               <div class="sub" id="${P}-sub">—</div></div>
          <div class="right" id="${P}-right">—</div>
        </div>
        ${usedBar(calcSchE(p).monthly, `${esc(p.addr)||'This property'} — ${bName(p.b)}`
                  + (calcSchE(p).monthly<0?' · negative cash flow goes to liabilities':''),
                  p.use!==false, calcSchE(p).monthly<0)}
      </div></div>`;
  }).join('') || `<div class="addblock" onclick="addSchE()"><div class="t"><svg class="icon icon-lg" style="color:var(--emerald)"><use href="#i-plus"/></svg>Add Rental Property</div><div class="s">Schedule E cash flow with fair rental days, or the 75% lease agreement rule, offset by the full PITIA.</div></div>`;
  setT('cnt-sche', S.sche.length);
}
function paintSchE(){
  S.sche.forEach(p=>{ const P=`sche-${p.id}`, r=calcSchE(p);
    setT(`${P}-res`, `Net Rental Cash Flow: ${money(r.monthly)} / month`);
    setT(`${P}-sub`, r.monthly>=0 ? 'Positive cash flow — added to qualifying income.'
                                  : 'Negative cash flow — added to monthly liabilities (back-end DTI).');
    setT(`${P}-right`, r.basis);
    setT(`${P}-mos`, scheMonths(p).toFixed(2) + ' months');
    const bar=$(`${P}-bar`); if(bar) bar.className = 'result-bar ' + (r.monthly>=0?'green':'amber');
  });
}
