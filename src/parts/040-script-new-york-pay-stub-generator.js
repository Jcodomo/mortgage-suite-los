
/* ==================================================================
   NEW YORK PAY STUB GENERATOR
   Builds a realistic NY paystub from the same inputs the wage-earner
   worksheet uses, then pushes the YTD figures back into an employment
   record. Withholding uses the IRS Pub 15-T annualised percentage
   method and the NY / NYC / Yonkers annual tables. Every rate below is
   editable because the tables change every January.
   ================================================================== */

const PS = {
  emp :{name:'', addr:'', ein:''},
  ee  :{name:'', addr:'', ssn:'', id:''},
  freq:'Bi-Weekly',
  pStart:'', pEnd:'', payDate:'', periodNo:0,
  rate:0, hours:0, otHrs:0, otMult:1.5, dtHrs:0,
  bonus:0, comm:0, otherPay:0, otherLbl:'Other Earnings',
  ptoHrs:0, holHrs:0,
  fed:{filing:'single', step2:false, depCredit:0, otherInc:0, deductions:0, extra:0},
  ny :{filing:'single', allow:0, extra:0, locality:'none', nycAllow:0},
  pre:{k401:0, med:0, hsa:0, fsa:0}, post:{lbl:'', amt:0},
  ytdMode:'auto',
  ytd:{base:0, ot:0, comm:0, bonus:0, other:0},
  rates:{ ss:6.2, ssCap:184500, medi:1.45, mediAdd:0.9, mediAddOver:200000,
          sdiPct:0.5, sdiWeekCap:0.60, pflPct:0.388, pflCap:354.53 }
};

const PS_PPY = {'Hourly':52,'Weekly':52,'Bi-Weekly':26,'Semi-Monthly':24,'Monthly':12,'Annual':1};
const psPPY  = () => PS_PPY[PS.freq] || 26;
const psWeeks= () => 52 / psPPY();

/* ---------- 2026 federal annual percentage-method tables (Pub 15-T) ---------- */
const FED_SD = {single:16100, mfj:32200, hoh:24150};
const FED_BR = {
  single:[[0,.10],[12400,.12],[50400,.22],[105700,.24],[201775,.32],[256225,.35],[640600,.37]],
  mfj   :[[0,.10],[24800,.12],[100800,.22],[211400,.24],[403550,.32],[512450,.35],[768700,.37]],
  hoh   :[[0,.10],[17700,.12],[67450,.22],[105700,.24],[201750,.32],[256200,.35],[640600,.37]]
};
/* ---------- New York State annual tables ---------- */
const NY_SD = {single:8000, mfj:16050};
const NY_BR = {
  single:[[0,.04],[8500,.045],[11700,.0525],[13900,.055],[80650,.06],[215400,.0685],
          [1077550,.0965],[5000000,.103],[25000000,.109]],
  mfj   :[[0,.04],[17150,.045],[23600,.0525],[27900,.055],[161550,.06],[323200,.0685],
          [2155350,.0965],[5000000,.103],[25000000,.109]]
};
/* ---------- New York City resident annual tables ---------- */
const NYC_BR = {
  single:[[0,.03078],[12000,.03762],[25000,.03819],[50000,.03876]],
  mfj   :[[0,.03078],[21600,.03762],[45000,.03819],[90000,.03876]]
};
const YONKERS_SURCHARGE = .1675;   /* % of NY State tax withheld */

function bracketTax(income, table, div){
  const d = div || 1;
  let inc = Math.max(0, income), tax = 0;
  for (let i = table.length - 1; i >= 0; i--){
    const floor = table[i][0] / d;
    if (inc > floor){ tax += (inc - floor) * table[i][1]; inc = floor; }
  }
  return tax;
}

/* ---------- the withholding engine ---------- */
function psCalc(){
  const ppy = psPPY(), R = PS.rates;
  const rate = N(PS.rate), hrs = N(PS.hours);

  /* --- current-period earnings --- */
  const regular = PS.freq === 'Hourly' ? rate * hrs
                : PS.freq === 'Annual' ? rate / 1
                : rate;
  const otRate  = (PS.freq === 'Hourly' ? rate : (hrs ? (rate * ppy) / (hrs * ppy) : 0)) * N(PS.otMult || 1.5);
  const hourly  = PS.freq === 'Hourly' ? rate : (hrs ? (rate * ppy) / (52 * hrs) : 0);
  const otPay   = (PS.freq === 'Hourly' ? rate : hourly) * N(PS.otMult || 1.5) * N(PS.otHrs);
  const dtPay   = (PS.freq === 'Hourly' ? rate : hourly) * 2 * N(PS.dtHrs);
  const ptoPay  = (PS.freq === 'Hourly' ? rate : hourly) * (N(PS.ptoHrs) + N(PS.holHrs));
  const bonus   = N(PS.bonus), comm = N(PS.comm), otherP = N(PS.otherPay);

  const E = [
    {k:'base',  lbl: PS.freq === 'Hourly' ? 'Regular' : 'Salary',
     hrs: PS.freq === 'Hourly' ? hrs : null, rate: PS.freq === 'Hourly' ? rate : null, amt: regular},
    {k:'pto',   lbl:'PTO / Holiday', hrs:N(PS.ptoHrs)+N(PS.holHrs), rate:hourly, amt:ptoPay},
    {k:'ot',    lbl:'Overtime',      hrs:N(PS.otHrs), rate:(PS.freq==='Hourly'?rate:hourly)*N(PS.otMult||1.5), amt:otPay},
    {k:'dt',    lbl:'Double Time',   hrs:N(PS.dtHrs), rate:(PS.freq==='Hourly'?rate:hourly)*2, amt:dtPay},
    {k:'comm',  lbl:'Commission',    hrs:null, rate:null, amt:comm},
    {k:'bonus', lbl:'Bonus',         hrs:null, rate:null, amt:bonus},
    {k:'other', lbl:PS.otherLbl||'Other Earnings', hrs:null, rate:null, amt:otherP}
  ].filter(r => r.amt !== 0 || r.k === 'base');

  const gross = E.reduce((s,r)=>s+r.amt, 0);

  /* --- pre-tax deductions --- */
  const k401 = N(PS.pre.k401), sec125 = N(PS.pre.med) + N(PS.pre.hsa) + N(PS.pre.fsa);
  const fedTaxable  = Math.max(0, gross - k401 - sec125);   /* 401(k) is pre-income-tax  */
  const ficaTaxable = Math.max(0, gross - sec125);          /* but NOT pre-FICA          */

  /* --- period number & prior-period YTD --- */
  const per = Math.max(1, Math.min(ppy, N(PS.periodNo) || psGuessPeriod()));
  const prior = per - 1;

  /* --- federal income tax (annualised percentage method) --- */
  const annual   = fedTaxable * ppy;
  const div      = PS.fed.step2 ? 2 : 1;
  const adjusted = annual + N(PS.fed.otherInc) - N(PS.fed.deductions) - FED_SD[PS.fed.filing] / div;
  let fedAnnual  = bracketTax(adjusted, FED_BR[PS.fed.filing], div) - N(PS.fed.depCredit);
  fedAnnual = Math.max(0, fedAnnual);
  const fedWH = fedAnnual / ppy + N(PS.fed.extra);

  /* --- FICA (Social Security capped, Medicare + additional) --- */
  const ssYTDprior = ficaTaxable * prior;
  const ssRoom     = Math.max(0, R.ssCap - ssYTDprior);
  const ssWage     = Math.min(ficaTaxable, ssRoom);
  const ss         = ssWage * R.ss / 100;
  let medi         = ficaTaxable * R.medi / 100;
  const mediPrior  = ficaTaxable * prior;
  if (mediPrior + ficaTaxable > R.mediAddOver){
    const over = Math.min(ficaTaxable, mediPrior + ficaTaxable - R.mediAddOver);
    medi += over * R.mediAdd / 100;
  }

  /* --- New York State / NYC / Yonkers --- */
  const nyFil     = PS.ny.filing;
  const nyAnnual  = Math.max(0, fedTaxable * ppy - NY_SD[nyFil] - 1000 * N(PS.ny.allow));
  const nyTax     = bracketTax(nyAnnual, NY_BR[nyFil]) / ppy + N(PS.ny.extra);
  let nyc = 0, yonkers = 0;
  if (PS.ny.locality === 'nyc'){
    const nycAnnual = Math.max(0, fedTaxable * ppy - 1000 * N(PS.ny.nycAllow));
    nyc = bracketTax(nycAnnual, NYC_BR[nyFil]) / ppy;
  } else if (PS.ny.locality === 'yonkers'){
    yonkers = nyTax * YONKERS_SURCHARGE;
  }

  /* --- NY statutory: disability + paid family leave --- */
  const sdi = Math.min(gross * R.sdiPct / 100, R.sdiWeekCap * psWeeks());
  const pflRoom = Math.max(0, R.pflCap - (gross * R.pflPct / 100) * prior);
  const pfl = Math.min(gross * R.pflPct / 100, pflRoom);

  const post = N(PS.post.amt);
  const taxes = [
    {lbl:'Federal Income Tax',        amt:fedWH},
    {lbl:'Social Security (OASDI)',   amt:ss},
    {lbl:'Medicare',                  amt:medi},
    {lbl:'NY State Income Tax',       amt:nyTax},
    PS.ny.locality === 'nyc'     ? {lbl:'NYC Resident Tax',    amt:nyc}     : null,
    PS.ny.locality === 'yonkers' ? {lbl:'Yonkers Resident Tax',amt:yonkers} : null,
    {lbl:'NY Disability (SDI)',       amt:sdi},
    {lbl:'NY Paid Family Leave',      amt:pfl}
  ].filter(Boolean);

  const preList = [
    N(PS.pre.k401)? {lbl:'401(k) Pre-Tax', amt:N(PS.pre.k401)} : null,
    N(PS.pre.med) ? {lbl:'Medical (§125)', amt:N(PS.pre.med)}  : null,
    N(PS.pre.hsa) ? {lbl:'HSA',            amt:N(PS.pre.hsa)}  : null,
    N(PS.pre.fsa) ? {lbl:'FSA',            amt:N(PS.pre.fsa)}  : null
  ].filter(Boolean);
  const postList = post ? [{lbl:PS.post.lbl || 'Post-Tax Deduction', amt:post}] : [];

  const taxTotal  = taxes.reduce((s,t)=>s+t.amt,0);
  const preTotal  = preList.reduce((s,t)=>s+t.amt,0);
  const postTotal = postList.reduce((s,t)=>s+t.amt,0);
  const net = gross - taxTotal - preTotal - postTotal;

  /* --- YTD --- */
  const auto = PS.ytdMode === 'auto';
  const ytdOf = (k, cur) => auto ? cur * per : N(PS.ytd[k]);
  const ytdE = {
    base : auto ? (regular + ptoPay) * per : N(PS.ytd.base),
    ot   : ytdOf('ot',    otPay + dtPay),
    comm : ytdOf('comm',  comm),
    bonus: ytdOf('bonus', bonus),
    other: ytdOf('other', otherP)
  };
  const ytdGross = ytdE.base + ytdE.ot + ytdE.comm + ytdE.bonus + ytdE.other;
  const scale = gross ? ytdGross / (gross * per || 1) : 1;
  const ytdTax  = taxes.map(t => ({lbl:t.lbl, amt:t.amt * per * (auto?1:scale)}));
  const ytdPre  = preList.map(t => ({lbl:t.lbl, amt:t.amt * per}));
  const ytdPost = postList.map(t => ({lbl:t.lbl, amt:t.amt * per}));
  const ytdTaxTotal = ytdTax.reduce((s,t)=>s+t.amt,0);
  const ytdNet = ytdGross - ytdTaxTotal - ytdPre.reduce((s,t)=>s+t.amt,0) - ytdPost.reduce((s,t)=>s+t.amt,0);

  return {E, gross, hourly, taxes, preList, postList, taxTotal, preTotal, postTotal, net,
          per, ppy, ytdE, ytdGross, ytdTax, ytdPre, ytdPost, ytdTaxTotal, ytdNet,
          fedTaxable, ficaTaxable, annual};
}

/* pay-period number of the year implied by the pay date */
function psGuessPeriod(){
  const d = pDate(PS.payDate) || pDate(PS.pEnd);
  if (!d) return 1;
  const day = dayOfYear(d), ppy = psPPY();
  return Math.max(1, Math.round(day / (365 / ppy)));
}

/* ---------- field plumbing ---------- */
function psSet(path, v){
  const p = path.split('.');
  let o = PS; while (p.length > 1) o = o[p.shift()];
  o[p[0]] = v;
  paintPaystub();
}
function psSetR(path, v){ psSet(path, v); }
function psSetHard(path, v){ const p=path.split('.'); let o=PS; while(p.length>1) o=o[p.shift()]; o[p[0]]=v; renderPaystub(); }

const psF = (lbl, path, val, type, extra) => `<div class="field"><label>${lbl}</label>
  <input class="cell-input" type="${type||'text'}" value="${esc(val)}"
    ${type==='number'?'step="0.01"':''} ${extra||''}
    oninput="psSet('${path}', this.value)"></div>`;
const psSel = (lbl, path, val, opts) => `<div class="field"><label>${lbl}</label>
  <select class="cell-input" onchange="psSetHard('${path}', this.value)">
    ${opts.map(o=>`<option value="${o[0]}" ${val===o[0]?'selected':''}>${o[1]}</option>`).join('')}
  </select></div>`;

function renderPaystub(){
  const body = $('psBody'); if (!body) return;
  body.innerHTML = `
  <div class="card"><div class="card-top"><span class="doc-name">Employer &amp; Employee</span>
    <span class="muted small" style="margin-left:auto">Names sync with the employment record when you push the stub across</span></div>
    <div class="card-body">
      <div class="grid g4">
        ${psF('Employer Name','emp.name',PS.emp.name)}
        ${psF('Employer Address','emp.addr',PS.emp.addr)}
        ${psF('Employer EIN','emp.ein',PS.emp.ein)}
        ${psF('Employee ID','ee.id',PS.ee.id)}
      </div>
      <div class="grid g4" style="margin-top:10px">
        ${psF('Employee Name','ee.name',PS.ee.name)}
        ${psF('Employee Address','ee.addr',PS.ee.addr)}
        ${psF('SSN (last 4)','ee.ssn',PS.ee.ssn)}
        ${psSel('Pay Frequency','freq',PS.freq,[['Hourly','Hourly'],['Weekly','Weekly'],
          ['Bi-Weekly','Bi-Weekly'],['Semi-Monthly','Semi-Monthly'],['Monthly','Monthly']])}
      </div>
    </div></div>

  <div class="card"><div class="card-top"><span class="doc-name">Pay Period &amp; Earnings</span></div>
    <div class="card-body">
      <div class="grid g4">
        <div class="field"><label>Period Start</label>${dateFld(PS.pStart,'setPS','','','pStart')}</div>
        <div class="field"><label>Period End</label>${dateFld(PS.pEnd,'setPS','','','pEnd')}</div>
        <div class="field"><label>Pay Date</label>${dateFld(PS.payDate,'setPS','','','payDate')}</div>
        ${psF('Pay Period # of Year','periodNo', PS.periodNo || psGuessPeriod(),'number')}
      </div>
      <div class="grid g6" style="margin-top:10px">
        ${psF(PS.freq==='Hourly'?'Hourly Rate':'Amount per Period','rate',PS.rate,'number')}
        ${psF('Hours this Period','hours',PS.hours,'number')}
        ${psF('Overtime Hours','otHrs',PS.otHrs,'number')}
        ${psF('OT Multiplier','otMult',PS.otMult,'number')}
        ${psF('Double-Time Hours','dtHrs',PS.dtHrs,'number')}
        ${psF('PTO / Holiday Hours','ptoHrs',PS.ptoHrs,'number')}
      </div>
      <div class="grid g4" style="margin-top:10px">
        ${psF('Commission','comm',PS.comm,'number')}
        ${psF('Bonus','bonus',PS.bonus,'number')}
        ${psF('Other Earnings','otherPay',PS.otherPay,'number')}
        ${psF('Other Earnings Label','otherLbl',PS.otherLbl)}
      </div>
    </div></div>

  <div class="card"><div class="card-top"><span class="doc-name">Withholding Elections</span>
    <span class="muted small" style="margin-left:auto">IRS Pub 15-T annualised percentage method + NY IT-2104</span></div>
    <div class="card-body">
      <div class="grid g5">
        ${psSel('Federal Filing Status','fed.filing',PS.fed.filing,
          [['single','Single / MFS'],['mfj','Married Filing Jointly'],['hoh','Head of Household']])}
        ${psSel('W-4 Step 2 (Two Jobs)','fed.step2',String(PS.fed.step2),[['false','Not checked'],['true','Checked']])}
        ${psF('W-4 Step 3 Credits ($/yr)','fed.depCredit',PS.fed.depCredit,'number')}
        ${psF('W-4 Step 4a Other Income','fed.otherInc',PS.fed.otherInc,'number')}
        ${psF('W-4 Step 4b Deductions','fed.deductions',PS.fed.deductions,'number')}
      </div>
      <div class="grid g5" style="margin-top:10px">
        ${psF('Extra Federal / Period','fed.extra',PS.fed.extra,'number')}
        ${psSel('NY Filing Status','ny.filing',PS.ny.filing,[['single','Single'],['mfj','Married']])}
        ${psF('NY Allowances (IT-2104)','ny.allow',PS.ny.allow,'number')}
        ${psSel('Locality','ny.locality',PS.ny.locality,
          [['none','None — NY State only'],['nyc','New York City resident'],['yonkers','Yonkers resident']])}
        ${psF('Extra NY / Period','ny.extra',PS.ny.extra,'number')}
      </div>
      <div class="grid g5" style="margin-top:10px">
        ${psF('401(k) Pre-Tax','pre.k401',PS.pre.k401,'number')}
        ${psF('Medical §125','pre.med',PS.pre.med,'number')}
        ${psF('HSA','pre.hsa',PS.pre.hsa,'number')}
        ${psF('FSA','pre.fsa',PS.pre.fsa,'number')}
        ${psF('Post-Tax Deduction','post.amt',PS.post.amt,'number')}
      </div>
    </div></div>

  <div class="card"><div class="card-top"><span class="doc-name">Year to Date</span>
    <div class="seg" style="margin-left:auto">
      <button class="${PS.ytdMode==='auto'?'on':''}" onclick="psSetHard('ytdMode','auto')">Auto &times; period #</button>
      <button class="${PS.ytdMode==='manual'?'on':''}" onclick="psSetHard('ytdMode','manual')">Enter YTD</button>
    </div></div>
    <div class="card-body">
      ${PS.ytdMode==='auto'
        ? `<div class="sub">Year-to-date is the current period multiplied by the pay-period number
             (${PS.periodNo || psGuessPeriod()} of ${psPPY()}). Switch to <b>Enter YTD</b> to type real
             figures from a client stub &mdash; overtime and bonus are rarely level across the year.</div>`
        : `<div class="grid g5">
            ${psF('YTD Base / Regular','ytd.base',PS.ytd.base,'number')}
            ${psF('YTD Overtime','ytd.ot',PS.ytd.ot,'number')}
            ${psF('YTD Commission','ytd.comm',PS.ytd.comm,'number')}
            ${psF('YTD Bonus','ytd.bonus',PS.ytd.bonus,'number')}
            ${psF('YTD Other','ytd.other',PS.ytd.other,'number')}
          </div>`}
    </div></div>

  <details class="card" style="margin-bottom:12px"><summary class="card-top" style="cursor:pointer">
      <span class="doc-name">Tax Rate Table &mdash; edit each January</span>
      <span class="muted small" style="margin-left:auto">2026 figures loaded; confirm against Pub 15-T and NYS Pub NYS-50-T-NYS</span></summary>
    <div class="card-body"><div class="grid g4">
      ${psF('Social Security %','rates.ss',PS.rates.ss,'number')}
      ${psF('SS Wage Base','rates.ssCap',PS.rates.ssCap,'number')}
      ${psF('Medicare %','rates.medi',PS.rates.medi,'number')}
      ${psF('Additional Medicare %','rates.mediAdd',PS.rates.mediAdd,'number')}
      ${psF('Addl Medicare Over','rates.mediAddOver',PS.rates.mediAddOver,'number')}
      ${psF('NY SDI %','rates.sdiPct',PS.rates.sdiPct,'number')}
      ${psF('NY SDI Weekly Cap','rates.sdiWeekCap',PS.rates.sdiWeekCap,'number')}
      ${psF('NY PFL %','rates.pflPct',PS.rates.pflPct,'number')}
      ${psF('NY PFL Annual Cap','rates.pflCap',PS.rates.pflCap,'number')}
    </div></div></details>

  <div class="section-head" style="margin-top:4px">
    <div><h2 style="font-size:15px">Generated Pay Statement</h2>
      <p>Preview updates live. Push the stub into an employment record to carry the YTD figures into the worksheet.</p></div>
    <div style="display:flex;gap:6px" class="no-print">
      <button class="btn btn-primary btn-sm" onclick="psToW2()"><svg class="icon"><use href="#i-plus"/></svg>Send to Employment Record</button>
      <button class="btn btn-light btn-sm" onclick="psPDF()">Download PDF</button>
      <button class="btn btn-light btn-sm" onclick="psJPEG()">Download JPEG</button>
      <button class="btn btn-light btn-sm" onclick="psPrint()">Print</button>
    </div>
  </div>
  <div id="psStage"><div class="rpt" id="psSheet"></div></div>`;
  paintPaystub();
}
function setPS(_a,_b,key,iso){ PS[key] = iso; paintPaystub(); }

/* seed the period dates from today's date and the chosen frequency */
function psResetDates(force){
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const end = new Date(); end.setHours(0,0,0,0);
  const days = {'Hourly':7,'Weekly':7,'Bi-Weekly':14,'Semi-Monthly':15,'Monthly':30}[PS.freq] || 14;
  const start = new Date(end); start.setDate(end.getDate() - (days - 1));
  const pay = new Date(end); pay.setDate(end.getDate() + 5);
  if (force || !PS.pStart)  PS.pStart  = iso(start);
  if (force || !PS.pEnd)    PS.pEnd    = iso(end);
  if (force || !PS.payDate) PS.payDate = iso(pay);
  if (force || !N(PS.periodNo)) PS.periodNo = psGuessPeriod();
  if (!PS.ee.name && S.b1) PS.ee.name = S.b1;
  if (!PS.emp.name && S.w2[0] && S.w2[0].employer) PS.emp.name = S.w2[0].employer;
  if (!N(PS.rate) && S.w2[0]){ PS.rate = N(S.w2[0].rate); PS.freq = S.w2[0].freq || PS.freq; PS.hours = N(S.w2[0].hours); }
  renderPaystub();
}

function paintPaystub(){
  const el = $('psSheet'); if (!el) return;
  el.innerHTML = `<div class="rpt-page">${psStubHTML()}</div>`;
}

function psStubHTML(){
  const r = psCalc();
  const fmtD = s => { const d = pDate(s); return d ? d.toLocaleDateString('en-US') : '—'; };
  const earnRow = e => `<tr><td>${esc(e.lbl)}</td>
    <td class="n">${e.rate!=null&&e.rate?rMoney(e.rate):''}</td>
    <td class="n">${e.hrs!=null&&e.hrs?e.hrs.toFixed(2):''}</td>
    <td class="n">${rMoney(e.amt)}</td>
    <td class="n">${rMoney(psYtdFor(e.k, r))}</td></tr>`;
  const dedRow = (t, y) => `<tr><td>${esc(t.lbl)}</td><td class="n">${rMoney(t.amt)}</td><td class="n">${rMoney(y)}</td></tr>`;

  return `
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
    <div>
      <div style="font-size:14px;font-weight:800">${esc(PS.emp.name)||'Employer Name'}</div>
      <div class="rpt-sub">${esc(PS.emp.addr)||'Employer address'}${PS.emp.ein?` &nbsp;|&nbsp; EIN ${esc(PS.emp.ein)}`:''}</div>
    </div>
    <div style="text-align:right;font-size:10.5px">
      <div style="font-weight:800;font-size:12px">EARNINGS STATEMENT</div>
      <div>Pay Date: <b>${fmtD(PS.payDate)}</b></div>
      <div>Period ${fmtD(PS.pStart)} &ndash; ${fmtD(PS.pEnd)}</div>
      <div>Pay Period ${r.per} of ${r.ppy}</div>
    </div>
  </div>

  <div class="rpt-frame" style="margin-bottom:9px">
    <div class="rpt-kv">
      <span class="rpt-lbl">Employee:</span><span class="rpt-val fill">${esc(PS.ee.name)||'&nbsp;'}</span>
      <span class="rpt-lbl">Employee ID:</span><span class="rpt-val fill">${esc(PS.ee.id)||'&nbsp;'}</span>
      <span class="rpt-lbl">SSN:</span><span class="rpt-val fill">${PS.ee.ssn?'XXX-XX-'+esc(PS.ee.ssn):'&nbsp;'}</span>
    </div>
    <div class="rpt-kv">
      <span class="rpt-lbl">Address:</span><span class="rpt-val fill">${esc(PS.ee.addr)||'&nbsp;'}</span>
      <span class="rpt-lbl">Fed Filing:</span><span class="rpt-val fill">${
        {single:'Single / MFS',mfj:'Married Filing Jointly',hoh:'Head of Household'}[PS.fed.filing]}${PS.fed.step2?' &middot; Step 2':''}</span>
      <span class="rpt-lbl">NY:</span><span class="rpt-val fill">${PS.ny.filing==='mfj'?'Married':'Single'} &middot; ${N(PS.ny.allow)} allow${
        PS.ny.locality==='nyc'?' &middot; NYC':PS.ny.locality==='yonkers'?' &middot; Yonkers':''}</span>
    </div>
  </div>

  <div style="display:flex;gap:10px;align-items:flex-start">
    <div style="flex:1.35">
      <div class="rpt-frame">
        <div class="rpt-band">Earnings</div>
        <div class="rpt-pad"><table>
          <thead><tr><th>Description</th><th class="n" style="width:66px">Rate</th>
            <th class="n" style="width:56px">Hours</th><th class="n" style="width:82px">Current</th>
            <th class="n" style="width:92px">Year to Date</th></tr></thead>
          <tbody>${r.E.map(earnRow).join('')}
            <tr class="hl-tan"><td><b>Gross Pay</b></td><td></td><td></td>
              <td class="n"><b>${rMoney(r.gross)}</b></td><td class="n"><b>${rMoney(r.ytdGross)}</b></td></tr>
          </tbody></table></div>
      </div>
    </div>
    <div style="flex:1">
      <div class="rpt-frame">
        <div class="rpt-band">Taxes Withheld</div>
        <div class="rpt-pad"><table>
          <thead><tr><th>Description</th><th class="n" style="width:78px">Current</th><th class="n" style="width:88px">YTD</th></tr></thead>
          <tbody>${r.taxes.map((t,i)=>dedRow(t, r.ytdTax[i].amt)).join('')}
            <tr class="hl-gry"><td><b>Total Taxes</b></td><td class="n"><b>${rMoney(r.taxTotal)}</b></td>
              <td class="n"><b>${rMoney(r.ytdTaxTotal)}</b></td></tr>
          </tbody></table></div>
      </div>
      ${(r.preList.length || r.postList.length) ? `
      <div class="rpt-frame" style="margin-top:8px">
        <div class="rpt-band light">Other Deductions</div>
        <div class="rpt-pad"><table>
          <thead><tr><th>Description</th><th class="n" style="width:78px">Current</th><th class="n" style="width:88px">YTD</th></tr></thead>
          <tbody>${r.preList.map((t,i)=>dedRow(t, r.ytdPre[i].amt)).join('')}
                 ${r.postList.map((t,i)=>dedRow(t, r.ytdPost[i].amt)).join('')}</tbody></table></div>
      </div>` : ''}
    </div>
  </div>

  <div class="rpt-frame" style="display:flex;align-items:center;gap:14px;padding:9px 14px;background:#fde9d9;margin-top:9px">
    <div style="flex:1"><div style="font-size:12.5px;font-weight:700">Net Pay &mdash; this period</div>
      <div class="small" style="margin-top:2px">Year to date net ${rMoney(r.ytdNet)} &nbsp;|&nbsp;
        Gross YTD ${rMoney(r.ytdGross)} &nbsp;|&nbsp; ${PS.freq} payroll</div></div>
    <div style="font-size:20px;font-weight:700;font-variant-numeric:tabular-nums">${rMoney(r.net)}</div>
  </div>

  <div class="small" style="margin-top:7px;line-height:1.5">
    <b>Prepared as a worksheet illustration.</b> Federal withholding uses the IRS Publication 15-T annualised
    percentage method; New York State, New York City and Yonkers use the annual tables with the allowances entered
    above. Statutory NY disability is capped at ${rMoney(PS.rates.sdiWeekCap)} per week and Paid Family Leave at
    ${rMoney(PS.rates.pflCap)} per year. Confirm the current tables before relying on the withholding figures.
  </div>`;
}
function psYtdFor(k, r){
  if (k==='base' || k==='pto') return k==='base' ? r.ytdE.base : 0;
  if (k==='ot' || k==='dt')    return k==='ot'   ? r.ytdE.ot   : 0;
  return r.ytdE[k] || 0;
}

/* ---------- push the stub into an employment record ---------- */
function psToW2(){
  const r = psCalc();
  const blank = x => !(x.employer||'').trim() && !N(x.rate) &&
    !['base','ot','comm','bonus','other'].some(k=>N(x.y1[k])||N(x.y2[k])||N(x.y3[k]));
  let j = PS.emp.name && S.w2.find(x => (x.employer||'').trim().toLowerCase() === PS.emp.name.trim().toLowerCase());
  if (!j) j = S.w2.find(blank);
  if (!j){ j = newW2(); S.w2.push(j); }
  j.employer = PS.emp.name || j.employer;
  j.freq     = PS.freq;
  j.rate     = PS.freq === 'Hourly' ? N(PS.rate) : N(PS.rate);
  j.hours    = N(PS.hours) || j.hours;
  j.ytdThru  = PS.pEnd || PS.payDate || j.ytdThru;
  j.y1.base  = round2(r.ytdE.base);
  j.y1.ot    = round2(r.ytdE.ot);
  j.y1.comm  = round2(r.ytdE.comm);
  j.y1.bonus = round2(r.ytdE.bonus);
  j.y1.other = round2(r.ytdE.other);
  if (PS.ee.name && !S.b1){ S.b1 = PS.ee.name; S.borrower = PS.ee.name; const el=$('b1Name'); if(el) el.value = PS.ee.name; }
  renderW2(); RECALC(); switchTab('w2');
  toast('Pay stub applied to the employment record — YTD figures loaded');
}

/* ---------- output ---------- */
function psShot(scale){
  const node = $('psSheet').querySelector('.rpt-page');
  return html2canvas(node, {scale:scale||2, backgroundColor:'#ffffff', logging:false, useCORS:true});
}
function psName(ext){
  const who = (PS.ee.name || S.b1 || 'Employee').trim().replace(/\s+/g,' ').replace(/[\\/:*?"<>|]/g,'');
  const d = pDate(PS.payDate) || new Date();
  const stamp = `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${d.getFullYear()}`;
  return `${who} Pay Stub ${stamp}.${ext}`;
}
async function psPDF(){
  const ctor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  if (typeof html2canvas === 'undefined' || !ctor){ toast('Rendering library unavailable — using print'); psPrint(); return; }
  try{
    const c = await psShot(2);
    const pdf = new ctor({unit:'pt', format:'letter', orientation:'portrait'});
    const h = Math.min(792, 612 * c.height / c.width);
    pdf.addImage(c.toDataURL('image/jpeg',0.94),'JPEG',0,0,612,h,undefined,'FAST');
    const nm = psName('pdf'); noteReport(nm,'pdf',pdf.output('blob')); pdf.save(nm);
    toast('Pay stub PDF downloaded');
  }catch(e){ toast('PDF failed — using print'); psPrint(); }
}
async function psJPEG(){
  if (typeof html2canvas === 'undefined'){ toast('Image library unavailable — use Print'); return; }
  try{
    const c = await psShot(2);
    c.toBlob(b=>{ const nm=psName('jpg'); noteReport(nm,'jpg',b); dl(b,nm); }, 'image/jpeg', 0.93);
    toast('Pay stub JPEG downloaded');
  }catch(e){ toast('Image render failed: '+e.message); }
}
function psPrint(){
  const w = window.open('', '_blank');
  if (!w){ toast('Pop-up blocked — allow pop-ups to print'); return; }
  const css = [...document.querySelectorAll('style')].map(s=>s.textContent).join('\n');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${psName('pdf').replace('.pdf','')}</title>
    <style>${css}</style></head><body style="background:#fff"><div class="rpt"><div class="rpt-page">
    ${psStubHTML()}</div></div></body></html>`);
  w.document.close();
  setTimeout(()=>{ w.focus(); w.print(); }, 500);
}
