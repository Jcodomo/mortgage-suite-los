
/* ==================================================================
   MORTGAGE INCOME CALCULATOR — CALCULATION ENGINE
   Logic sourced from: FNMA Form 1084 (Cash Flow Analysis),
   FHLMC Form 91, HUD 4000.1 II.A.4/5, and the NMB Income Worksheet
   (Wage Earner / SE & Other Income / Rental tabs).
   ================================================================== */

let UID = 1;
const uid = () => 'x' + (UID++);
const N   = v => { const n = parseFloat(String(v ?? '').replace(/[$,\s%]/g,'')); return isFinite(n) ? n : 0; };
const $   = id => document.getElementById(id);
const money = v => (v<0?'-':'') + '$' + Math.abs(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const money0= v => (v<0?'-':'') + '$' + Math.abs(v||0).toLocaleString('en-US',{maximumFractionDigits:0});
const pct  = v => (v>0?'+':'') + (v*100).toFixed(1) + '%';
const esc  = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const setT = (id,txt) => { const e=$(id); if(e) e.textContent = txt; };
const setH = (id,html) => { const e=$(id); if(e) e.innerHTML = html; };

function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }

/* ---------- date helpers (mirrors NMB YTD-month convention) ---------- */
function pDate(s){ if(!s) return null; const p=String(s).split('-'); if(p.length!==3) return null;
  const d=new Date(+p[0], +p[1]-1, +p[2]); return isNaN(d)?null:d; }
const isLeap = y => (y%4===0 && y%100!==0) || y%400===0;
function dayOfYear(d){ return Math.round((d - new Date(d.getFullYear(),0,1))/86400000) + 1; }
/* YTD months elapsed = days elapsed in calendar year / days in year * 12 */
function ytdMonths(endStr, hireStr){
  const e = pDate(endStr); if(!e) return 0;
  const h = pDate(hireStr);
  let days = dayOfYear(e);
  const diy = isLeap(e.getFullYear()) ? 366 : 365;
  if (h && h.getFullYear() === e.getFullYear()) days = Math.max(1, dayOfYear(e) - dayOfYear(h) + 1);
  return Math.max(0.03, days / diy * 12);
}
function monthsOnJob(hireStr, endStr){
  const h=pDate(hireStr), e=pDate(endStr); if(!h||!e) return 0;
  return Math.max(0,(e-h)/86400000/30.4375);
}

/* ================== GLOBAL STATE ================== */
const S = {
  b1:'', b2:'', borrower:'', file:'', agency:'FNMA',
  settings:{ autosave:false }, checklist:{},
  loan:{ address:'', program:'FHA', txn:'Purchase', occ:'Primary Residence', units:1, fico:680,
         price:0, value:0, dpMode:'pct', dpPct:3.5, dpAmt:0, baseOverride:0,
         rate:0, term:30, ufmipRate:1.75, financeUfmip:true, miOverride:0,
         vaFirstUse:true, vaExempt:false, limit:726200,
         taxAnnual:0, insAnnual:0, floodAnnual:0, hoaMonthly:0, sync:true },
  w2:[], schc:[], corp:[], sche:[], other:[],
  combine:{ on:false, m:{base:'current',ot:'none',comm:'none',bonus:'none',other:'none',unre:'none'},
            c:{base:0,ot:0,comm:0,bonus:0,other:0,unre:0} },
  assets:{ rows:[], fundsToClose:0, reserves:0, divisor:360, use:false },
  dti:{ pi:0, taxes:0, ins:0, hoa:0, mi:0, otherHousing:0, debts:[] },
  notes:''
};

const FREQ = ['Hourly','Weekly','Bi-Weekly','Semi-Monthly','Monthly','Annually'];
function monthlyFromFreq(freq, rate, hours){
  switch(freq){
    case 'Hourly':       return rate * (hours||0) * 52 / 12;
    case 'Weekly':       return rate * 52 / 12;
    case 'Bi-Weekly':    return rate * 26 / 12;
    case 'Semi-Monthly': return rate * 24 / 12;
    case 'Monthly':      return rate;
    case 'Annually':     return rate / 12;
    default:             return 0;
  }
}
const COMPS = [
  {k:'base',  label:'Base Pay',      firstLabel:'Current base'},
  {k:'ot',    label:'Overtime Pay',  firstLabel:'Not used'},
  {k:'comm',  label:'Commissions',   firstLabel:'Not used'},
  {k:'bonus', label:'Bonuses',       firstLabel:'Not used'},
  {k:'other', label:'Other Income',  firstLabel:'Not used'}
];

/* ================== GENERIC BINDING ================== */
function bind(path, value){
  /* path like "w2.<id>.y1.base"  or  "dti.pi" */
  const seg = path.split('.');
  let ref = S;
  for (let i=0;i<seg.length-1;i++){
    let s = seg[i];
    if (Array.isArray(ref[s]) === false && ref[s] !== undefined) { ref = ref[s]; continue; }
    if (Array.isArray(ref[s])) { ref = ref[s]; continue; }
    ref = ref[s];
  }
  ref[seg[seg.length-1]] = value;
}
function findRec(list,id){ return S[list].find(r=>r.id===id); }
/* fill in fields added after a file was saved */
function normalise(){
  ['w2','schc','corp','sche','other'].forEach(k=>{
    (S[k]||[]).forEach(r=>{
      if (r.use === undefined)  r.use = true;
      if (r.b === undefined)    r.b = 1;
      if (r.mode === undefined) r.mode = 'manual';
      if (k==='w2' && r.notes === undefined) r.notes = '';
    });
  });
  if (!S.settings)  S.settings = {autosave:false};
  if (!S.checklist) S.checklist = {};
  if (S.b1 === undefined) S.b1 = S.borrower || '';
  if (S.b2 === undefined) S.b2 = '';
  if (!S.combine) S.combine = {on:false, m:{base:'current',ot:'none',comm:'none',bonus:'none',other:'none',unre:'none'},
                               c:{base:0,ot:0,comm:0,bonus:0,other:0,unre:0}};
  if (!S.assets.b) S.assets.b = 1;
  if (!S.loan) S.loan = { address:'', program:'FHA', txn:'Purchase', occ:'Primary Residence', units:1, fico:680,
    price:0, value:0, dpMode:'pct', dpPct:3.5, dpAmt:0, baseOverride:0, rate:0, term:30,
    ufmipRate:1.75, financeUfmip:true, miOverride:0, vaFirstUse:true, vaExempt:false, limit:726200,
    taxAnnual:0, insAnnual:0, floodAnnual:0, hoaMonthly:0, sync:true };
}
const bName = n => (n===2 ? (S.b2 || 'Borrower 2') : (S.b1 || 'Borrower 1'));
function setUse(list,id,v){ const r=findRec(list,id); if(r){ r.use=v;
  ({w2:renderW2,schc:renderSchC,corp:renderCorp,sche:renderSchE,other:renderOther})[list](); RECALC(); } }
function setBor(list,id,v){ const r=findRec(list,id); if(r){ r.b=N(v)||1; RECALC(); } }
function setMode(list,id,v){ const r=findRec(list,id); if(r){ r.mode=v;
  ({w2:renderW2,schc:renderSchC,corp:renderCorp,sche:renderSchE,other:renderOther})[list](); RECALC(); } }

/* shared card controls */
function cardCtl(list, r, opts){
  const o = opts||{};
  return `<div class="rowflex no-print" style="gap:10px">
    ${o.mode !== false ? `<span class="seg" title="Auto uses the agency-recommended method; Manual lets you choose">
      <button class="${r.mode==='auto'?'on':''}" onclick="setMode('${list}','${r.id}','auto')">Auto</button>
      <button class="${r.mode!=='auto'?'on':''}" onclick="setMode('${list}','${r.id}','manual')">Manual</button></span>`:''}
    <select class="cell-input" style="width:auto;padding:5px 7px;font-size:11px"
      onchange="setBor('${list}','${r.id}',this.value)" title="Which borrower this income belongs to">
      <option value="1" ${r.b!==2?'selected':''}>B1 — ${esc(S.b1||'Borrower 1')}</option>
      <option value="2" ${r.b===2?'selected':''}>B2 — ${esc(S.b2||'Borrower 2')}</option>
    </select>
    <label class="sw" title="Turn off to keep the calculation but exclude it from qualifying income">
      <input type="checkbox" ${r.use!==false?'checked':''} onchange="setUse('${list}','${r.id}',this.checked)">
      ${r.use!==false?'Used':'Not used'}</label>
  </div>`;
}
function chips(list){ return `<div class="chips">${list.filter(Boolean).map(c=>
  `<span class="chip-st ${c[0]}">${c[0]==='ok'?'&#10003;':c[0]==='warn'?'&#9888;':c[0]==='bad'?'&#10007;':'&#8226;'} ${c[1]}</span>`).join('')}</div>`; }
function stW2(j){
  const r=calcW2(j), o=[];
  o.push(r.t2 ? ((r.chg1>=0&&r.chg2>=0)?['ok','Stable / increasing']
              : (r.chg1<0&&r.chg2<0)?['bad','Declining trend']:['warn','Mixed trend'])
              : ['info','No prior-year history']);
  if (r.hasVariable) o.push(r.monthsJob>=24?['ok','2-yr history OK']
                                           :['warn',`Tenure ${r.monthsJob.toFixed(0)} mo`]);
  const vp = r.varPct*100;
  o.push(!r.expectedYTD ? ['info','Awaiting paystub']
        : Math.abs(vp)<=5 ? ['ok',`YTD ${vp>=0?'+':''}${vp.toFixed(1)}%`]
        : [Math.abs(vp)<=10?'warn':'bad', `YTD ${vp>=0?'+':''}${vp.toFixed(1)}%`]);
  o.push((j.ytdThru && j.hireDate && N(j.y1.base)) ? ['ok','Documentation'] : ['warn','Docs incomplete']);
  o.push(['info', j.mode==='auto'?'Auto method':'Manual method']);
  return o;
}
function stSchC(b){
  const r=calcSchC(b), o=[];
  o.push(r.declining?['warn','Declining — recent year used']:['ok','Stable / increasing']);
  o.push((N(b.y1.net31)&&N(b.y2.net31))?['ok','2 yrs of returns']:['warn','Second year missing']);
  o.push(N(b.y1.net31)<0?['bad','Business loss']:['ok','Positive net profit']);
  o.push(['info', b.mode==='auto'?'Auto method':'Manual method']);
  return o;
}
function stCorp(e){
  const r=calcCorp(e), o=[];
  o.push(r.declining?['warn','Declining — recent year used']:['ok','Stable / increasing']);
  o.push(N(e.own)>0?['ok',`${N(e.own)}% ownership`]:['bad','Ownership not set']);
  if (r.quick) o.push(r.quick>=1?['ok',`Liquidity ${r.quick.toFixed(2)}`]:['bad',`Liquidity ${r.quick.toFixed(2)}`]);
  else o.push(['info','Liquidity not tested']);
  if (!r.gov && !e.liquidity && N(e.y1.dist)>0 && N(e.y1.dist)<N(e.y1.ordinary))
    o.push(['warn','Capped at distributions']);
  o.push(['info', e.mode==='auto'?'Auto method':'Manual method']);
  return o;
}
function stSchE(p){
  const r=calcSchE(p), o=[];
  o.push(r.monthly>=0?['ok','Positive cash flow']:['warn','Loss — added to debts']);
  if (p.method==='sche'){
    o.push(N(p.fairDays)?['ok',`${N(p.fairDays)} fair rental days`]:['warn','Fair rental days missing']);
    o.push(N(p.totalExp)?['ok','Sch E expenses entered']:['warn','Total expenses missing']);
  } else o.push(['info',`${N(p.vacancy)}% lease factor`]);
  o.push(N(p.pitia)?['ok','PITIA entered']:['warn','PITIA missing']);
  return o;
}
function stOther(o1){
  const o=[];
  o.push(N(o1.continuance)>=36?['ok','3-yr continuance']:['bad',`Continuance ${N(o1.continuance)} mo`]);
  o.push(o1.nonTax?['ok',`Grossed up ${N(o1.grossUp)}%`]:['info','Taxable']);
  o.push(o1.desc?['ok','Source documented']:['warn','Source not described']);
  return o;
}
function usedBar(amount, sub, on, neg){
  return `<div class="used-bar ${on?(neg?'neg':''):'off'}">
    <div><div class="lab">${on?'Qualifying income used':'Calculated — not used for qualifying'}</div>
      <div class="sub">${sub||''}</div></div>
    <div class="val">${money(amount)} <small>/ mo</small></div></div>`;
}
const bNameRaw = n => (n===2 ? (S.b2||'') : (S.b1||''));
function setW2Borrower(id, v){
  const j = findRec('w2', id); if(!j) return;
  if (j.b === 2){ S.b2 = v; $('b2Name').value = v; } else { S.b1 = v; S.borrower = v; $('b1Name').value = v; }
  RECALC();
}
function setField(list,id,field,value,numeric){
  const r = findRec(list,id); if(!r) return;
  const parts = field.split('.');
  let t=r; for(let i=0;i<parts.length-1;i++) t=t[parts[i]];
  t[parts[parts.length-1]] = numeric ? N(value) : value;
  RECALC();
}

/* ================== W-2 ================== */
const ISO = d => d.toISOString().slice(0,10);
function newW2(){
  const t=new Date();
  return { id:uid(), use:true, b:1, mode:'manual', employer:'', incomeType:'consistent',
    freq:'Hourly', rate:0, hours:0,
    hireDate:ISO(new Date(t.getFullYear()-2,0,1)), ytdThru:ISO(t),
    y1:{base:0,ot:0,comm:0,bonus:0,other:0,unre:0},
    y2:{base:0,ot:0,comm:0,bonus:0,other:0,unre:0},
    y3:{base:0,ot:0,comm:0,bonus:0,other:0,unre:0},
    m:{base:'current',ot:'none',comm:'none',bonus:'none',other:'none',unre:'none'},
    c:{base:0,ot:0,comm:0,bonus:0,other:0,unre:0}, notes:'' };
}
function calcW2(j){
  const end = pDate(j.ytdThru);
  const yr1 = end ? end.getFullYear() : new Date().getFullYear();
  const mo  = ytdMonths(j.ytdThru, j.hireDate);
  const monthlyBase = monthlyFromFreq(j.freq, N(j.rate), N(j.hours));
  const expectedYTD = monthlyBase * mo;
  const actualYTD   = N(j.y1.base);
  const varAmt = actualYTD - expectedYTD;
  const varPct = expectedYTD ? varAmt/expectedYTD : 0;
  const comp = {};
  ['base','ot','comm','bonus','other','unre'].forEach(k=>{
    const a=N(j.y1[k]), b=N(j.y2[k]), c=N(j.y3[k]);
    const ytd   = mo ? a/mo : 0;
    const a12   = (a+b)/(mo+12);
    const a24   = (a+b+c)/(mo+24);
    const m1=ytd, m2=b/12, m3=c/12;
    let rec = (m1<=m2 || !b) ? 'ytd' : (m2<=m3 ? 'ytd12' : 'ytd24');
    let why = '';
    if (k==='base'){
      rec = (j.incomeType==='consistent') ? (ytd >= monthlyBase ? 'current' : rec) : rec;
      why = (j.incomeType!=='consistent') ? 'Irregular hours — the YTD average governs, not the base rate'
          : (ytd >= monthlyBase) ? 'YTD tracks the base rate — use the current base'
          : 'YTD is running below the base rate — the lower figure governs unless explained in writing';
    } else {
      if (!a && !b && !c) { rec='none'; why = 'Nothing entered for this component'; }
      else if (!b) why = 'No prior-year history — a 2-year record is normally required before this can be used';
      else if (rec==='ytd')   why = 'Current year is the lowest — use the YTD average';
      else if (rec==='ytd12') why = 'Prior year is the lower of the two — average YTD with the prior year';
      else                    why = 'Declining across both prior years — the 24-month average is the conservative figure';
    }
    comp[k] = {y1:a,y2:b,y3:c, ytd, a12, a24, rec, why, monthlyBase};
  });
  const tot = y => N(j[y].base)+N(j[y].ot)+N(j[y].comm)+N(j[y].bonus)+N(j[y].other);
  const t1=tot('y1'), t2=tot('y2'), t3=tot('y3');
  const ann1 = mo ? t1/mo*12 : 0;
  const chg1 = t2 ? ann1/t2-1 : 0;
  const chg2 = t3 ? t2/t3-1 : 0;
  const val = k => {
    const m = (j.mode==='auto') ? comp[k].rec : j.m[k], C=comp[k];
    if (m==='none')   return 0;
    if (m==='current')return monthlyBase;
    if (m==='ytd')    return C.ytd;
    if (m==='ytd12')  return C.a12;
    if (m==='ytd24')  return C.a24;
    if (m==='custom') return N(j.c[k]);
    return 0;
  };
  const parts = {base:val('base'),ot:val('ot'),comm:val('comm'),bonus:val('bonus'),other:val('other'),unre:val('unre')};
  const total = parts.base+parts.ot+parts.comm+parts.bonus+parts.other;
  const variable = N(j.y1.ot)+N(j.y2.ot)+N(j.y1.comm)+N(j.y2.comm)+N(j.y1.bonus)+N(j.y2.bonus);
  return {yr1, mo, monthlyBase, expectedYTD, actualYTD, varAmt, varPct, comp, t1,t2,t3, ann1, chg1, chg2,
          parts, total, hasVariable: variable>0, monthsJob: monthsOnJob(j.hireDate,j.ytdThru)};
}
function renderW2(){
  const wrap=$('w2List');
  wrap.innerHTML = S.w2.map((j,i)=>w2Card(j,i)).join('') ||
    '<div class="card"><div class="empty">No employment added. Click <b>Add Employment / Job</b> to begin.</div></div>';
  setT('cnt-w2', S.w2.length);
  if (typeof renderCombine === 'function') renderCombine();
}
function w2Card(j,i){
  const P=`w2-${j.id}`;
  const yrRow = (y,label,editable=true)=>`
    <tr>
      <td class="rowlabel">${label}</td>
      ${['y1','y2','y3'].map(yy=>`<td><input class="cell-input" type="number" step="0.01" value="${N(j[yy][y])}"
        oninput="setField('w2','${j.id}','${yy}.${y}',this.value,1)"></td>`).join('')}
      <td class="num"><span class="calc-cell" id="${P}-${y}-a12">$0.00</span></td>
      <td class="num"><span class="calc-cell" id="${P}-${y}-a24">$0.00</span></td>
    </tr>`;
  const methodBox = c => `
    <div class="method-box">
      <div class="method-top">
        <span class="method-name">${c.label}<span class="tag slate" id="${P}-${c.k}-recchip" style="font-size:9px">—</span></span>
        <span class="why" id="${P}-${c.k}-why"></span>
        <span class="method-amt" id="${P}-${c.k}-amt">$0.00 / month</span>
      </div>
      <div class="opts">
        ${[['first',c.firstLabel],['ytd','YTD avg'],['ytd12','+ Prev yr'],['ytd24','+ 2 yrs']].map(([v,lbl])=>{
          const val = v==='first' ? (c.k==='base'?'current':'none') : v;
          return `<label class="opt" id="${P}-${c.k}-opt-${val}">
            <input type="radio" name="${P}-${c.k}" value="${val}" ${j.m[c.k]===val?'checked':''}
              onchange="setField('w2','${j.id}','m.${c.k}','${val}')">
            <span><span class="ol">${lbl}<span class="rec" id="${P}-${c.k}-rec-${val}" style="display:none">REC</span></span>
            <span class="ov" id="${P}-${c.k}-v-${val}">$0.00</span></span></label>`;
        }).join('')}
        <label class="opt" id="${P}-${c.k}-opt-custom">
          <input type="radio" name="${P}-${c.k}" value="custom" ${j.m[c.k]==='custom'?'checked':''}
            onchange="setField('w2','${j.id}','m.${c.k}','custom')">
          <span style="flex:1"><span class="ol">Override</span>
          <input class="cell-input" style="margin-top:3px;padding:3px 6px;font-size:11px" type="number" step="0.01"
            value="${N(j.c[c.k])}" oninput="setField('w2','${j.id}','c.${c.k}',this.value,1)"
            onfocus="setField('w2','${j.id}','m.${c.k}','custom')"></span></label>
      </div>
    </div>`;
  return `
  <div class="card ${j.use===false?'excluded':''}">
    <div class="card-top">
      <span class="tag">Employment Record #${i+1}</span>
      <span class="doc-name" id="${P}-cardname">${esc(j.employer)||'New employment'}</span>
      <div class="spacer"></div>
      ${cardCtl('w2', j)}
      ${guideBtn('w2','Guidelines')}
      <button class="btn-icon no-print" title="Remove job" onclick="del('w2','${j.id}')"><svg class="icon"><use href="#i-trash"/></svg></button>
    </div>
    <div class="status-strip">${chips(stW2(j))}</div>
    <div class="card-body">
      <div class="emprec">
        <div class="er"><label>Borrower Name</label>
          <input class="cell-input" value="${esc(bNameRaw(j.b))}" placeholder="Borrower ${j.b===2?2:1}"
            oninput="setW2Borrower('${j.id}',this.value)"></div>
        <div class="er"><label>Employer Name</label>
          <input class="cell-input" value="${esc(j.employer)}" placeholder="Employer"
            oninput="setField('w2','${j.id}','employer',this.value)"></div>
        <div class="er"><label>Type of Income</label>
          <select class="cell-input" onchange="setField('w2','${j.id}','incomeType',this.value)">
            <option value="consistent" ${j.incomeType==='consistent'?'selected':''}>Consistent Hours</option>
            <option value="irregular"  ${j.incomeType==='irregular'?'selected':''}>Irregular Hours</option>
          </select>
          <span class="er-note">Consistent = the same hours every pay period. Irregular = union, shift or variable hours.</span></div>
      </div>

      <div class="block">
        <div class="block-head" onclick="this.parentNode.classList.toggle('collapsed')">
          <h3><svg class="icon"><use href="#i-grid"/></svg>Earnings &amp; Base Calculation</h3>
          <span class="hint">All fields editable&nbsp;<svg class="icon chev" style="vertical-align:-3px"><use href="#i-chev"/></svg></span>
        </div>
        <div class="block-body">
          <div class="cfields">
            <div class="cf"><label>Pay frequency</label>
              <select class="cell-input" onchange="setField('w2','${j.id}','freq',this.value)">
                ${FREQ.map(f=>`<option ${j.freq===f?'selected':''}>${f}</option>`).join('')}
              </select></div>
            <div class="cf"><label>Rate / salary ($)</label>
              <input class="cell-input" type="number" step="0.01" value="${N(j.rate)}" oninput="setField('w2','${j.id}','rate',this.value,1)"></div>
            <div class="cf"><label>Hours / week</label>
              <input class="cell-input" type="number" step="0.01" value="${N(j.hours)}" oninput="setField('w2','${j.id}','hours',this.value,1)"></div>
            <div class="cf"><label>Hire date</label>
              ${dateFld(j.hireDate,'setField','w2',j.id,'hireDate')}</div>
            <div class="cf"><label>Paystub end (YTD thru)</label>
              ${dateFld(j.ytdThru,'setField','w2',j.id,'ytdThru')}</div>

          </div>

          <div class="tbl-scroll" style="margin-top:9px"><table class="matrix">
            <thead><tr>
              <th>Income Category</th>
              <th id="${P}-h1">YTD (Year 1)</th><th id="${P}-h2">Prior Year</th><th id="${P}-h3">2 Years Prior</th>
              <th class="num">YTD + Prev Yr</th><th class="num">YTD + Last 2 Yrs</th>
            </tr></thead>
            <tbody>
              ${yrRow('base','Base Earnings')}
              ${yrRow('ot','Overtime Pay')}
              ${yrRow('comm','Commissions')}
              ${yrRow('bonus','Bonuses')}
              ${yrRow('other','Other Income')}
              <tr class="total-row">
                <td class="rowlabel">Total Earnings</td>
                <td class="num" id="${P}-t1">$0.00</td><td class="num" id="${P}-t2">$0.00</td><td class="num" id="${P}-t3">$0.00</td>
                <td class="num" id="${P}-ta12">$0.00</td><td class="num" id="${P}-ta24">$0.00</td>
              </tr>
              <tr class="meta-row">
                <td class="rowlabel">Income Change (%)</td>
                <td id="${P}-chg1">—</td><td id="${P}-chg2">—</td><td class="mono">Baseline</td>
                <td colspan="2" class="right" id="${P}-trend">—</td>
              </tr>
            </tbody>
          </table></div>

          <div class="stats s4">
            <div class="stat"><span class="k">Calculated monthly base</span><span class="v" id="${P}-mbase">$0.00</span><span class="s" id="${P}-mbase-s">—</span></div>
            <div class="stat"><span class="k">Expected YTD base</span><span class="v" id="${P}-expytd">$0.00</span><span class="s" id="${P}-expytd-s">Rate x YTD months</span></div>
            <div class="stat"><span class="k">Actual YTD base paid</span><span class="v blue" id="${P}-actytd">$0.00</span><span class="s" id="${P}-actytd-s">—</span></div>
            <div class="stat"><span class="k">YTD variance ($ / %)</span><span class="v" id="${P}-var">$0.00</span><span class="band ok" id="${P}-varband">—</span></div>
          </div>
          <div id="${P}-jobnotice" style="margin-top:8px"></div>
        </div>
      </div>

      <div class="block">
        <div class="block-head" onclick="this.parentNode.classList.toggle('collapsed')">
          <h3><svg class="icon"><use href="#i-check"/></svg>Qualifying Income Method</h3>
          <span class="hint"><span id="${P}-varflag"></span>&nbsp;<svg class="icon chev" style="vertical-align:-3px"><use href="#i-chev"/></svg></span>
        </div>
        <div class="block-body">
          <div class="notice info no-print"><svg class="icon"><use href="#i-alert"/></svg>
            <span><b>Rule:</b> use the YTD figure when it is lower than the current base rate unless a satisfactory
            written explanation is documented. Variable income (OT / bonus / commission) requires a 2-year history;
            a declining trend forces the longer averaging period.
            <button class="btn btn-light btn-sm" style="margin-left:8px" onclick="applyRec('${j.id}')">Apply Recommended Methods</button></span></div>
          ${j.mode==='auto' ? `<div class="notice good"><svg class="icon"><use href="#i-check"/></svg>
            <span><b>Auto:</b> each component is using the recommended method shown below. Switch the toggle at the top
            of this card to <b>Manual</b> to override any of them.</span></div>` : ''}
          <div style="${j.mode==='auto'?'pointer-events:none;opacity:.62':''}">
          ${COMPS.map(methodBox).join('')}
          </div>
          <div class="field" style="margin-top:12px">
            <label>Notes / Written Explanation for this Employment</label>
            <textarea class="cell-input" style="min-height:56px" placeholder="e.g. using full salary of $110,193 — borrower was on leave of absence 07/08–09/08, income is contractual"
              oninput="setField('w2','${j.id}','notes',this.value)">${esc(j.notes||'')}</textarea>
          </div>
        </div>
      </div>
      ${usedBar(calcW2(j).total, `${esc(j.employer)||'This employment'} — ${bName(j.b)}`
                + (j.mode==='auto'?' · Auto method':''), j.use!==false)}
    </div>
  </div>`;
}
function paintW2(){
  S.w2.forEach(j=>{
    const P=`w2-${j.id}`, r=calcW2(j);
    setT(`${P}-cardname`, j.employer || 'New employment');
    setT(`${P}-h1`, `YTD ${r.yr1} (Year 1)`); setT(`${P}-h2`, `Prior Year ${r.yr1-1}`); setT(`${P}-h3`, `2 Years Prior ${r.yr1-2}`);
    setT(`${P}-mbase`, money(r.monthlyBase)); setT(`${P}-mbase-s`, j.freq + ' basis');
    setT(`${P}-expytd`, money(r.expectedYTD)); setT(`${P}-expytd-s`, `Rate x ${r.mo.toFixed(2)} YTD months`);
    setT(`${P}-actytd`, money(r.actualYTD)); setT(`${P}-actytd-s`, `YTD Monthly Avg: ${money(r.comp.base.ytd)}`);
    setT(`${P}-var`, `${r.varAmt>=0?'+':''}${money(r.varAmt)} (${(r.varPct*100).toFixed(1)}%)`);
    const vb=$(`${P}-varband`);
    if(vb && !r.expectedYTD && !r.actualYTD){ vb.className='band'; vb.textContent='Awaiting paystub figures'; }
    else if(vb){
      const ap=Math.abs(r.varPct);
      vb.className='band ' + (ap<=0.05?'ok':ap<=0.10?'warn':'bad');
      vb.textContent = ap<=0.05 ? 'Consistent (YTD matches base rate)'
                     : ap<=0.10 ? 'Moderate variance — document reason'
                     : (r.varPct<0 ? 'Material shortfall — YTD well below base' : 'YTD materially exceeds base — verify OT/hours');
    }
    let jn='';
    if (r.monthsJob>0 && r.monthsJob<1) jn+='<div class="notice bad"><svg class="icon"><use href="#i-alert"/></svg><span>Borrower has been on this job <b>30 days or less</b> — income cannot be calculated per the worksheet rule.</span></div>';
    else if (r.monthsJob<24 && r.hasVariable) jn+='<div class="notice warn"><svg class="icon"><use href="#i-alert"/></svg><span>Less than <b>24 months</b> on this job. Variable income (OT / bonus / commission) generally requires a 2-year receipt history.</span></div>';
    if (r.varPct < -0.05) jn+='<div class="notice warn"><svg class="icon"><use href="#i-alert"/></svg><span>YTD earnings are more than <b>5% below</b> the calculated base. Use the YTD figure or document a written explanation.</span></div>';
    setH(`${P}-jobnotice`, jn);

    ['base','ot','comm','bonus','other'].forEach(k=>{
      setT(`${P}-${k}-a12`, money(r.comp[k].a12));
      setT(`${P}-${k}-a24`, money(r.comp[k].a24));
    });
    setT(`${P}-t1`, money(r.t1)); setT(`${P}-t2`, money(r.t2)); setT(`${P}-t3`, money(r.t3));
    setT(`${P}-ta12`, money((r.t1+r.t2)/(r.mo+12))); setT(`${P}-ta24`, money((r.t1+r.t2+r.t3)/(r.mo+24)));
    setT(`${P}-chg1`, r.t2 ? `${pct(r.chg1)} (annualized vs Yr 2)` : '—');
    setT(`${P}-chg2`, r.t3 ? `${pct(r.chg2)} (vs Yr 3)` : '—');
    const trend = (!r.t1 && !r.t2 && !r.t3) ? '—'
                : (r.chg1>=0 && r.chg2>=0) ? 'Stable / Increasing Income Trend'
                : (r.chg1<0 && r.chg2<0) ? 'Declining Income — use lower figure & document'
                : 'Mixed Trend — review with caution';
    setT(`${P}-trend`, trend);
    setH(`${P}-varflag`, r.hasVariable
      ? '<span style="color:var(--n-warn-tx);background:var(--n-warn-bg);border:1px solid var(--n-warn-bd);padding:2px 7px;border-radius:5px">Variable income detected: 24-month averaging enabled for OT / Bonus / Commission per FNMA 1084</span>' : '');

    COMPS.forEach(c=>{
      const k=c.k, C=r.comp[k];
      const vals = {current:r.monthlyBase, none:0, ytd:C.ytd, ytd12:C.a12, ytd24:C.a24, custom:N(j.c[k])};
      Object.keys(vals).forEach(v=>{ setT(`${P}-${k}-v-${v}`, money(vals[v])); });
      ['current','none','ytd','ytd12','ytd24','custom'].forEach(v=>{
        const o=$(`${P}-${k}-opt-${v}`); if(o) o.classList.toggle('sel', j.m[k]===v);
        const rc=$(`${P}-${k}-rec-${v}`); if(rc) rc.style.display = (C.rec===v ? 'inline-block' : 'none');
      });
      const chip=$(`${P}-${k}-recchip`);
      if(chip){ const lbl={current:'Current base',none:'Not used',ytd:'YTD avg',ytd12:'+ Prev yr',ytd24:'+ 2 yrs'}[C.rec]||'—';
        chip.textContent = 'Rec: '+lbl; chip.className='tag ' + (j.m[k]===C.rec?'green':'amber'); }
      setT(`${P}-${k}-amt`, money(r.parts[k]) + ' / month');
      setT(`${P}-${k}-why`, C.why || '');
    });
  });
}
function applyRec(id){
  const j=findRec('w2',id); if(!j) return;
  const r=calcW2(j);
  Object.keys(j.m).forEach(k=> j.m[k]=r.comp[k].rec );
  renderW2(); RECALC(); toast('Recommended methods applied');
}
