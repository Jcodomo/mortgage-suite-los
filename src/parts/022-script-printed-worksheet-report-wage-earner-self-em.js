
/* ==================================================================
   PRINTED WORKSHEET REPORT  —  Wage Earner / Self-Employed & Other
   Layout follows the NMB income worksheet print-outs. All values are
   read live from the calculator state, so the report always matches
   what is on screen.
   ================================================================== */
const M_NAME = {current:'Base Pay', ytd:'YTD', ytd12:'YTD + 12 Mos.', ytd24:'YTD + 24 Mos.',
                custom:'Custom Override', none:'N/A'};
const rMoney = v => (!isFinite(v)) ? '$0.00' : money(v);
const today  = () => new Date().toLocaleDateString('en-US');

function rptHead(title, sub){
  return `<div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:9px">
    <div><h1 class="rpt-title">${title}</h1>${sub?`<div class="rpt-sub">${sub}</div>`:''}</div>
    <div style="text-align:right;font-size:10.5px">
      <div><b>Date:</b> ${today()}</div>
      <div><b>Agency:</b> ${S.agency}</div>
    </div></div>`;
}
function rptIdBar(){
  return `<div class="rpt-frame" style="margin-bottom:9px">
    <div class="rpt-kv">
      <span class="rpt-lbl">Loan Number:</span><span class="rpt-val fill">${esc(S.file)||'&nbsp;'}</span>
      <span class="rpt-lbl">Borrower:</span><span class="rpt-val fill">${esc(S.borrower)||'&nbsp;'}</span>
    </div></div>`;
}

/* ---------------- WAGE EARNER PAGE ---------------- */
function rptW2Page(j, idx){
  const r = calcW2(j), yr = r.yr1;
  const C = r.comp;
  const yrRow = (key, label, cls) => {
    const d = j[key];
    const tot = N(d.base)+N(d.ot)+N(d.comm)+N(d.bonus)+N(d.other);
    return `<tr class="${cls||''}"><td class="c"><b>${label}</b></td>
      <td class="n">${rMoney(N(d.base))}</td><td class="n">${rMoney(N(d.ot))}</td>
      <td class="n">${rMoney(N(d.comm))}</td><td class="n">${rMoney(N(d.bonus))}</td>
      <td class="n">${rMoney(N(d.other))}</td>
      <td class="n hl-gry">${rMoney(tot)}</td></tr>`;
  };
  const usedCell = k => {
    if (j.m[k]==='none') return `<td class="n small ital">Not used</td>`;
    const need = (k!=='base' && (!N(j.y2[k]) || !N(j.y3[k])) && N(j.y1[k]));
    return `<td class="n hl-blue"><b>${rMoney(r.parts[k])}</b>${need?'<div class="small red">2-yr history needed</div>':''}</td>`;
  };
  const infoYTD = C.base.ytd + C.ot.ytd + C.comm.ytd + C.bonus.ytd + C.other.ytd;
  const infoY12 = C.base.a12 + C.ot.a12 + C.comm.a12 + C.bonus.a12 + C.other.a12;
  const infoY24 = C.base.a24 + C.ot.a24 + C.comm.a24 + C.bonus.a24 + C.other.a24;
  const diffPct = infoYTD ? (1 - r.total/infoYTD) : 0;
  const diffAnn = infoYTD*12 - r.total*12;
  const fmtD = d => { const x=pDate(d); return x ? x.toLocaleDateString('en-US') : '—'; };

  return `${rptHead('Wage Earner Income Calculator',
      'Base, overtime, bonus and commission analysis per FNMA Form 1084 / FHLMC Form 91 / HUD 4000.1')}
  ${rptIdBar()}
  <div class="rpt-frame">
    <div class="rpt-band">Employment Record #${idx+1}</div>
    <div class="rpt-kv">
      <span class="rpt-lbl">Borrower Name:</span><span class="rpt-val fill">${esc(S.borrower)||'&nbsp;'}</span>
      <span class="rpt-lbl">Employer Name:</span><span class="rpt-val fill">${esc(j.employer)||'&nbsp;'}</span>
      <span class="rpt-lbl">Type of Income:</span><span class="rpt-val fill">${j.incomeType==='consistent'?'Consistent Hours':'Irregular Hours'}</span>
      <span class="rpt-lbl">Months on Job:</span><span class="rpt-val fill">${r.monthsJob.toFixed(1)} months</span>
    </div>

    <div class="rpt-band light">Salary / Hourly</div>
    <div style="display:flex;gap:14px;padding:8px 10px">
      <div style="flex:1">
        <div class="rpt-row"><span class="rpt-lbl" style="width:110px">Frequency:</span><span class="rpt-val fill c">${j.freq}</span></div>
        <div class="rpt-row"><span class="rpt-lbl" style="width:110px">Amount:</span><span class="rpt-val fill c">${rMoney(N(j.rate))}</span></div>
        <div class="rpt-row"><span class="rpt-lbl" style="width:110px">Weekly Hours:</span><span class="rpt-val fill c">${N(j.hours)}</span></div>
      </div>
      <div style="flex:1.15">
        <div style="text-align:center;font-weight:700;font-size:10.5px">Base Salary</div>
        <div class="rpt-row"><span class="rpt-lbl" style="flex:1">Monthly Amount:</span><span class="rpt-val hl-blue" style="width:120px;text-align:right"><b>${rMoney(r.monthlyBase)}</b></span></div>
        <div class="rpt-row"><span class="rpt-lbl" style="flex:1">Monthly YTD Amount:</span><span class="rpt-val hl-yel" style="width:120px;text-align:right"><b>${rMoney(C.base.ytd)}</b></span></div>
        <div class="rpt-row"><span class="rpt-lbl" style="flex:1">Annual Amount:</span><span class="rpt-val hl-tan" style="width:120px;text-align:right"><b>${rMoney(r.monthlyBase*12)}</b></span></div>
      </div>
      <div style="flex:1.1;font-size:9.5px;color:#c00000;font-weight:700">
        * Use YTD if lower than monthly income unless a satisfactory explanation is entered in Notes for using the
        higher income.<br>If irregular hours, review the Amount Used below.
      </div>
    </div>

    <div class="rpt-band light">Overtime / Bonus / Commission</div>
    <div class="rpt-pad">
      <div style="display:flex;gap:26px;margin-bottom:6px">
        <div class="rpt-row" style="padding-left:0"><span class="rpt-lbl">Hire Date:</span><span class="rpt-val" style="width:104px;text-align:center">${fmtD(j.hireDate)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Pay Period End Date:</span><span class="rpt-val" style="width:104px;text-align:center">${fmtD(j.ytdThru)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">YTD Months Elapsed:</span><span class="rpt-val" style="width:80px;text-align:center">${r.mo.toFixed(2)}</span></div>
      </div>
      <div class="small" style="margin-bottom:4px"><b>Amounts taken from the most recent documentation available — paystubs and W-2s or written VOE.
        Amounts not likely to continue are excluded.</b></div>
      <table>
        <thead><tr><th style="width:52px">Year</th><th>Base Pay / YTD Amount</th><th>Overtime</th><th>Commission</th>
          <th>Bonuses</th><th>Other Income</th><th>Total Entered</th></tr></thead>
        <tbody>
          ${yrRow('y1', yr + ' YTD')}
          ${yrRow('y2', yr-1, 'alt')}
          ${yrRow('y3', yr-2)}
          <tr><td class="c hl-gry"><b>Amount Used</b></td>
            ${usedCell('base')}${usedCell('ot')}${usedCell('comm')}${usedCell('bonus')}${usedCell('other')}
            <td class="n hl-blue"><b>${rMoney(r.total)}</b></td></tr>
          <tr><td class="c hl-gry"><b>Method</b></td>
            <td class="c small">${M_NAME[j.m.base]}</td><td class="c small">${M_NAME[j.m.ot]}</td>
            <td class="c small">${M_NAME[j.m.comm]}</td><td class="c small">${M_NAME[j.m.bonus]}</td>
            <td class="c small">${M_NAME[j.m.other]}</td><td class="c small">Monthly</td></tr>
        </tbody>
      </table>

      <div class="rpt-boxrow">
        <div class="rpt-bigbox hl-gry"><div class="k">Base Only Annual:</div><div class="v">${rMoney(r.monthlyBase*12)}</div></div>
        <div class="rpt-bigbox hl-grn"><div class="k">Projected YTD Annual Base:</div><div class="v">${rMoney(C.base.ytd*12)}</div></div>
      </div>

      <div style="display:flex;gap:12px;margin-top:10px;align-items:flex-start">
        <div style="flex:1.05">
          <table style="border:none">
            <tr><td style="border:none"></td><td class="c" style="border:none;font-weight:700">Monthly</td>
                <td class="c" style="border:none;font-weight:700">Annual</td></tr>
            <tr><td style="border:none;font-size:13px;font-weight:700;text-align:right">Borrower's Income:</td>
                <td class="n hl-tan" style="font-size:13px"><b>${rMoney(r.total)}</b></td>
                <td class="n hl-tan" style="font-size:13px"><b>${rMoney(r.total*12)}</b></td></tr>
          </table>
          <div class="small" style="margin-top:7px"><b>The amounts below are for information only and DO include OT, bonus, etc.</b></div>
          <table style="margin-top:3px">
            <tr><td style="width:34%"><b>Base:</b></td><td class="n">${rMoney(r.monthlyBase)}</td>
                <td><b>YTD + 12 mos.:</b></td><td class="n">${N(j.y2.base)?rMoney(infoY12):'N/A'}</td></tr>
            <tr class="alt"><td><b>YTD:</b></td><td class="n">${rMoney(infoYTD)}</td>
                <td><b>YTD + 24 mos.:</b></td><td class="n">${N(j.y3.base)?rMoney(infoY24):'N/A'}</td></tr>
          </table>
        </div>
        <div style="flex:.95">
          <div class="rpt-band dark" style="text-align:center">For Information Only</div>
          <table>
            <tr><td class="ital"><b>YTD vs. Calc. Amt.</b></td><td class="c"><b>Monthly</b></td><td class="c"><b>Annual</b></td></tr>
            <tr><td>Total YTD Only:</td><td class="n">${rMoney(infoYTD)}</td><td class="n">${rMoney(infoYTD*12)}</td></tr>
            <tr class="alt"><td>Difference:</td><td class="n">${(diffPct*100).toFixed(2)}%</td><td class="n">${rMoney(diffAnn)}</td></tr>
          </table>
          ${diffPct < -0.05 ? `<div class="small red" style="margin-top:5px;text-align:center">
             Please be advised that the YTD amount is less than the calculated amount by more than 5%.</div>`:''}
          ${r.varPct < -0.05 ? `<div class="small red" style="margin-top:4px;text-align:center">
             The year to date amount is less than the base salary.</div>`:''}
        </div>
      </div>
    </div>

    <div class="rpt-band light">Notes</div>
    <div style="padding:7px 10px"><div class="rpt-val" style="min-height:58px;white-space:pre-wrap">${esc(j.notes||'')||'&nbsp;'}</div></div>
  </div>`;
}

/* ---------------- SELF-EMPLOYED: SCHEDULE C ---------------- */
function rptSchCPage(b, idx){
  const r = calcSchC(b);
  const row = (label, ref, k, alt, sign) => `<tr class="${alt?'alt':''}">
      <td class="item">${label}</td><td class="lineref">${ref}</td>
      <td class="n" style="width:118px">${rMoney((sign||1)*N(b.y2[k]))}</td>
      <td class="lineref">${ref}</td>
      <td class="n" style="width:118px">${rMoney((sign||1)*N(b.y1[k]))}</td></tr>`;
  return `${rptHead('Self-Employed &amp; Other Income',
    'Schedule Analysis Method (SAM) — based on FNMA Form 1084A / FHLMC Form 91')}
  <div class="rpt-frame" style="margin-bottom:9px"><div class="rpt-kv">
    <span class="rpt-lbl">Loan Number:</span><span class="rpt-val fill">${esc(S.file)||'&nbsp;'}</span>
    <span class="rpt-lbl">Business Name:</span><span class="rpt-val fill">${esc(b.name)||'&nbsp;'}</span>
    <span class="rpt-lbl">Loan Type:</span><span class="rpt-val fill">${S.agency==='FNMA'?'Conventional (Fannie Mae)':S.agency==='FHLMC'?'Conventional (Freddie Mac)':S.agency}</span>
    <span class="rpt-lbl">Borrower:</span><span class="rpt-val fill">${esc(S.borrower)||'&nbsp;'}</span>
  </div></div>
  <div class="rpt-frame">
    <div class="rpt-band">Schedule Analysis Method</div>
    <div class="rpt-pad">
      <div style="font-weight:700;margin-bottom:3px">A. Individual Tax Return (Form 1040)</div>
      <table style="border:none">
        <tr><td style="border:none"></td><td class="lineref"></td>
            <td class="c" style="border:none;font-weight:700">Year: ${N(b.y2.yr)}</td>
            <td class="lineref"></td>
            <td class="c" style="border:none;font-weight:700">Year: ${N(b.y1.yr)}</td></tr>
        <tr><td class="item" style="font-weight:700">1. Schedule C:</td><td colspan="4" style="border:none"></td></tr>
        ${row('a.  Net Profit or Loss','Line 31','net31',1)}
        ${row('b.  Depletion','Line 12','depl12',0)}
        ${row('c.  Depreciation','Line 13','depr13',1)}
        ${row('d.  Exclusion for Meals &amp; Entertainment','Line 24b','meals',0,-1)}
        ${row('e.  Expenses for Business Use of Your Home','Line 30','home30',1)}
        ${row('f.  Amortization / Casualty Loss','Part V','amort',0)}
        <tr><td class="item" style="font-weight:700;padding-top:7px">2. Schedule C Page 2</td><td colspan="4" style="border:none"></td></tr>
        ${row('a.  Business Auto Mileage (x $'+N(b.rate).toFixed(2)+' per mile)','Line 44A','miles',1)}
      </table>
      <div style="display:flex;justify-content:flex-end;align-items:center;gap:9px;margin-top:9px">
        <span style="font-weight:700">Section A Subtotal (monthly):</span>
        <span class="rpt-val hl-blue" style="width:130px;text-align:right"><b>${rMoney(r.monthly)}</b></span>
      </div>
      ${r.declining?`<div class="small red" style="text-align:right;margin-top:3px">
        Some portion of the income reported on the returns has decreased from the prior year, so the most recent year is being used.</div>`:''}
    </div>
    <div class="rpt-band light">Totals</div>
    <div class="rpt-pad">
      <table style="border:none">
        <tr><td style="border:none"></td>
            <td class="c" style="border:none;font-weight:700;width:150px">${N(b.y2.yr)} Total</td>
            <td class="n hl-blue" style="width:130px"><b>${rMoney(r.a2)}</b></td></tr>
        <tr><td style="border:none"></td>
            <td class="c" style="border:none;font-weight:700">${N(b.y1.yr)} Total</td>
            <td class="n hl-grn"><b>${rMoney(r.a1)}</b></td></tr>
        <tr><td style="border:none"></td>
            <td class="c" style="border:none;font-weight:700">Monthly Income</td>
            <td class="n hl-tan" style="font-size:13px"><b>${rMoney(r.monthly)}</b></td></tr>
      </table>
      <div class="small" style="margin-top:6px"><b>Method used:</b>
        ${r.methodUsed==='avg2'?'24-month combined average':r.methodUsed==='recent'?'Most recent year only':
          r.methodUsed==='lower'?'Lower of the two years':'Custom override'} &nbsp;|&nbsp;
        Yr ${N(b.y2.yr)} monthly ${rMoney(r.m2)} &nbsp;|&nbsp; Yr ${N(b.y1.yr)} monthly ${rMoney(r.m1)}</div>
    </div>
  </div>`;
}

/* ---------------- SELF-EMPLOYED: CORPORATE / PARTNERSHIP ---------------- */
function rptCorpPage(e, idx){
  const r = calcCorp(e);
  const secTitle = {1065:'E. Partnership Tax Returns (Form 1065)',
                    '1120S':'D. S-Corporation Tax Returns (Form 1120S)',
                    1120:'C. Corporate Tax Return Form (1120)'}[e.form];
  const line = (label, ref, k, alt, sign) => `<tr class="${alt?'alt':''}">
      <td class="item">${label}</td><td class="lineref">${ref}</td>
      <td class="n" style="width:118px">${rMoney((sign||1)*N(e.y2[k]))}</td>
      <td class="lineref">${ref}</td>
      <td class="n" style="width:118px">${rMoney((sign||1)*N(e.y1[k]))}</td></tr>`;
  const k1 = e.form==='1120' ? '' : `
      <div style="font-weight:700;margin:9px 0 3px">B. Schedule K-1 &mdash; Form ${e.form}</div>
      <table style="border:none">
        <tr><td style="border:none"></td><td class="lineref"></td>
            <td class="c" style="border:none;font-weight:700">Year: ${N(e.y2.yr)}</td>
            <td class="lineref"></td><td class="c" style="border:none;font-weight:700">Year: ${N(e.y1.yr)}</td></tr>
        ${line('a.  Ordinary Business Income (Loss)','Part III, Line 1','ordinary',1)}
        ${line('b.  Net Rental Real Estate Income (Loss)','Part III, Line 2','netRental',0)}
        ${line('c.  Other Net Rental Income (Loss)','Part III, Line 3','othRental',1)}
        ${e.form==='1065'?line('d.  Guaranteed Payments','Part III, Line 4c','guar',0):''}
        ${line('e.  Distributions Received', e.form==='1065'?'Line 19':'Line 16d','dist',1)}
        ${line('f.  W-2 Income from this Business','W-2','w2biz',0)}
      </table>`;
  const adj = e.form==='1120'
    ? `<table style="border:none">
        <tr><td style="border:none"></td><td class="lineref"></td>
            <td class="c" style="border:none;font-weight:700">Year: ${N(e.y2.yr)}</td>
            <td class="lineref"></td><td class="c" style="border:none;font-weight:700">Year: ${N(e.y1.yr)}</td></tr>
        ${C1120.map((L,i)=> L.k==='divid' ? line(L.label,L.cite,L.k,i%2) : line(L.label,L.cite,L.k,i%2,L.sign)).join('')}
      </table>`
    : `<table style="border:none">
        <tr><td style="border:none"></td><td class="lineref"></td>
            <td class="c" style="border:none;font-weight:700">Year: ${N(e.y2.yr)}</td>
            <td class="lineref"></td><td class="c" style="border:none;font-weight:700">Year: ${N(e.y1.yr)}</td></tr>
        ${BIZ_ADJ.map((L,i)=> line(L.label,L.cite,L.k,i%2,L.sign)).join('')}
        <tr><td class="item">Individual percentage of ownership</td><td class="lineref">Schedule K-1</td>
            <td class="n">${N(e.own)}%</td><td class="lineref">Schedule K-1</td><td class="n">${N(e.own)}%</td></tr>
      </table>`;
  return `${rptHead('Self-Employed &amp; Other Income',
    'Schedule Analysis Method (SAM) — based on FNMA Form 1084A / FHLMC Form 91')}
  <div class="rpt-frame" style="margin-bottom:9px"><div class="rpt-kv">
    <span class="rpt-lbl">Loan Number:</span><span class="rpt-val fill">${esc(S.file)||'&nbsp;'}</span>
    <span class="rpt-lbl">Business Name:</span><span class="rpt-val fill">${esc(e.name)||'&nbsp;'}</span>
    <span class="rpt-lbl">Loan Type:</span><span class="rpt-val fill">${S.agency==='FNMA'?'Conventional (Fannie Mae)':S.agency==='FHLMC'?'Conventional (Freddie Mac)':S.agency}</span>
    <span class="rpt-lbl">Ownership:</span><span class="rpt-val fill">${N(e.own)}%</span>
  </div></div>
  <div class="rpt-frame">
    <div class="rpt-band">Schedule Analysis Method</div>
    <div class="rpt-pad">
      ${k1}
      <div style="font-weight:700;margin:10px 0 3px">${secTitle}</div>
      ${adj}
      <div style="display:flex;justify-content:flex-end;align-items:center;gap:9px;margin-top:9px">
        <span style="font-weight:700">Section B, C, D &amp; E Subtotal (monthly):</span>
        <span class="rpt-val hl-blue" style="width:130px;text-align:right"><b>${rMoney(r.monthly)}</b></span>
      </div>
      ${(!r.gov && !e.liquidity && N(e.y1.dist)>0 && N(e.y1.dist)<N(e.y1.ordinary))
        ? `<div class="small red" style="margin-top:5px">** Conventional loans: the lower of the distribution or the ordinary income is used.
             Ordinary income exceeds distributions and business liquidity has not been documented, so income is capped at distributions.</div>`:''}
      ${r.quick ? `<div class="small" style="margin-top:4px"><b>Liquidity test:</b> current assets ${rMoney(N(e.curAssets))} &divide;
         current liabilities ${rMoney(N(e.curLiab))} = <b>${r.quick.toFixed(2)}</b> (${r.quick>=1?'PASS':'FAIL'})</div>`:''}
    </div>
    <div class="rpt-band light">Totals</div>
    <div class="rpt-pad">
      <table style="border:none">
        <tr><td style="border:none"></td><td class="c" style="border:none;font-weight:700;width:150px">${N(e.y2.yr)} Total</td>
            <td class="n hl-blue" style="width:130px"><b>${rMoney(r.a2)}</b></td></tr>
        <tr><td style="border:none"></td><td class="c" style="border:none;font-weight:700">${N(e.y1.yr)} Total</td>
            <td class="n hl-grn"><b>${rMoney(r.a1)}</b></td></tr>
        <tr><td style="border:none"></td><td class="c" style="border:none;font-weight:700">Monthly Income</td>
            <td class="n hl-tan" style="font-size:13px"><b>${rMoney(r.monthly)}</b></td></tr>
      </table>
    </div>
  </div>`;
}

/* ---------------- RENTAL PAGE ---------------- */
function rptRentalPage(list){
  const rows = (list||S.sche).map((p,i)=>{
    const r = calcSchE(p);
    const sch = p.method==='sche';
    return `<div class="rpt-frame" style="margin-bottom:10px">
      <div class="rpt-band light">Property #${i+1} &mdash; ${esc(p.addr)||'Address not entered'}</div>
      <div class="rpt-pad">
        <table>
          <tr><td style="width:56%">${sch?'1.  Rents Received':'1.  Gross Monthly Lease Rent'}</td>
              <td class="lineref">${sch?'Sch E Line 3':'Lease'}</td><td class="n">${rMoney(sch?N(p.rents):N(p.leaseRent))}</td></tr>
          ${sch?`
          <tr class="alt"><td>2.  Total Expenses</td><td class="lineref">Sch E Line 20</td><td class="n">(${rMoney(N(p.totalExp))})</td></tr>
          <tr><td>3.  Add back: Insurance</td><td class="lineref">Sch E Line 9</td><td class="n">${rMoney(N(p.ins))}</td></tr>
          <tr class="alt"><td>4.  Add back: Mortgage Interest</td><td class="lineref">Sch E Line 12</td><td class="n">${rMoney(N(p.mortInt))}</td></tr>
          <tr><td>5.  Add back: Taxes</td><td class="lineref">Sch E Line 16</td><td class="n">${rMoney(N(p.taxes))}</td></tr>
          <tr class="alt"><td>6.  Add back: Depreciation / Depletion</td><td class="lineref">Sch E Line 18</td><td class="n">${rMoney(N(p.depr))}</td></tr>
          <tr><td>7.  Add back: HOA Dues / Documented Repairs</td><td class="lineref">Sch E Line 14 / 19</td><td class="n">${rMoney(N(p.otherAdd))}</td></tr>
          <tr class="alt"><td>8.  Fair Rental Days / Personal Use Days</td><td class="lineref">Sch E Line 2</td><td class="n">${N(p.fairDays)} / ${N(p.personalDays)}</td></tr>
          <tr><td>9.  Months in Service</td><td class="lineref">Days &divide; 365 x 12</td><td class="n">${scheMonths(p).toFixed(2)}</td></tr>
          <tr class="alt hl-gry"><td><b>Net Annual Rental Income</b></td><td class="lineref"></td><td class="n"><b>${rMoney(r.net)}</b></td></tr>
          <tr><td><b>Net Monthly Rental Income</b></td><td class="lineref"></td><td class="n"><b>${rMoney(r.gross)}</b></td></tr>
          `:`
          <tr class="alt"><td>2.  Vacancy Factor Applied</td><td class="lineref">Agency rule</td><td class="n">${N(p.vacancy)}%</td></tr>
          <tr><td><b>Net Monthly Rental Income</b></td><td class="lineref"></td><td class="n"><b>${rMoney(r.gross)}</b></td></tr>
          `}
          <tr class="alt"><td>Less: Full monthly PITIA on this property</td><td class="lineref">PITIA</td><td class="n">(${rMoney(N(p.pitia))})</td></tr>
          <tr><td class="${r.monthly>=0?'hl-grn':'hl-tan'}"><b>Net Rental Cash Flow ${r.monthly>=0?'(added to income)':'(added to liabilities)'}</b></td>
              <td class="lineref"></td><td class="n ${r.monthly>=0?'hl-grn':'hl-tan'}" style="font-size:12px"><b>${rMoney(r.monthly)}</b></td></tr>
        </table>
      </div></div>`;
  }).join('');
  return `${rptHead('Rental Income Calculator','Schedule E cash flow / 75% lease agreement rule')}
    ${rptIdBar()}${rows}`;
}

/* ---------------- OTHER INCOME + ASSETS PAGE ---------------- */
function rptOtherPage(list, wantAssets){
  const a = calcAssets();
  const OL = list || S.other;
  const oth = OL.length ? `<div class="rpt-frame" style="margin-bottom:10px">
    <div class="rpt-band">Other &amp; Non-Employment Income</div>
    <div class="rpt-pad"><table>
      <thead><tr><th>Income Type</th><th>Source / Documentation</th><th>Monthly</th><th>Taxable</th>
        <th>Gross-Up</th><th>Continuance</th><th>Qualifying</th></tr></thead>
      <tbody>${OL.map((o,i)=>{ const r=calcOther(o), t=OTHER_TYPES.find(x=>x.v===o.type);
        return `<tr class="${i%2?'alt':''}"><td>${t?t.t:o.type}</td><td>${esc(o.desc)}</td>
          <td class="n">${rMoney(r.base)}</td><td class="c">${o.nonTax?'Non-taxable':'Taxable'}</td>
          <td class="c">${o.nonTax?N(o.grossUp)+'% ('+rMoney(r.up)+')':'—'}</td>
          <td class="c">${N(o.continuance)} mos${N(o.continuance)<36?' <span class="red">*</span>':''}</td>
          <td class="n hl-blue"><b>${rMoney(r.total)}</b></td></tr>`;}).join('')}
        <tr><td colspan="6" style="text-align:right"><b>Total Other Monthly Income</b></td>
            <td class="n hl-tan"><b>${rMoney(OL.reduce((s,o)=>s+calcOther(o).total,0))}</b></td></tr>
      </tbody></table>
      <div class="small" style="margin-top:5px"><span class="red">*</span> Continuance under 36 months — income generally may not be used for qualifying.</div>
    </div></div>` : '';
  const ast = (wantAssets !== false && S.assets.rows.length) ? `<div class="rpt-frame">
    <div class="rpt-band">Asset Depletion / Employment-Related Assets</div>
    <div class="rpt-pad"><table>
      <thead><tr><th>Account / Institution</th><th>Asset Type</th><th>Balance</th><th>Eligible %</th><th>Eligible Value</th></tr></thead>
      <tbody>${S.assets.rows.map((x,i)=>{ const t=ASSET_TYPES.find(y=>y.v===x.type);
        return `<tr class="${i%2?'alt':''}"><td>${esc(x.name)}</td><td>${t?t.t:x.type}</td>
          <td class="n">${rMoney(N(x.bal))}</td><td class="c">${N(x.elig)}%</td>
          <td class="n">${rMoney(N(x.bal)*N(x.elig)/100)}</td></tr>`;}).join('')}
        <tr><td colspan="4" style="text-align:right"><b>Eligible after haircut</b></td><td class="n">${rMoney(a.eligible)}</td></tr>
        <tr class="alt"><td colspan="4" style="text-align:right">Less: funds required to close</td><td class="n">(${rMoney(N(S.assets.fundsToClose))})</td></tr>
        <tr><td colspan="4" style="text-align:right">Less: required reserves</td><td class="n">(${rMoney(N(S.assets.reserves))})</td></tr>
        <tr class="alt"><td colspan="4" style="text-align:right"><b>Net eligible assets &divide; ${a.div} months</b></td>
            <td class="n hl-tan"><b>${rMoney(a.monthly)}</b></td></tr>
      </tbody></table>
      <div class="small" style="margin-top:5px">${S.assets.use?'Included in qualifying income.':'<b>Not</b> included in qualifying income.'}</div>
    </div></div>` : '';
  return `${rptHead('Other Income &amp; Asset Depletion','Non-employment income, gross-up and asset amortization')}
    ${rptIdBar()}${oth}${ast}`;
}

/* ---------------- SUMMARY PAGE ---------------- */
function rptSummaryPage(){
  const t = reportTotals(), rows = reportSummaryRows(), f = findings(), mx = DTI_MAX[S.agency];
  const allItems = reportItems(), excluded = allItems.filter(i=>!rptOn(i.k));
  return `${rptHead('Income Calculation Summary','Qualifying income recap, calculation method and debt ratios')}
  ${rptIdBar()}
  <div class="rpt-frame">
    <div class="rpt-band">Qualifying Monthly Income by Source</div>
    <div class="rpt-pad"><table>
      <thead><tr><th style="width:20%">Category</th><th>Source / Entity</th><th style="width:30%">Calculation Basis / Method</th>
        <th style="width:16%">Monthly Income</th></tr></thead>
      <tbody>${rows.map((r,i)=>`<tr class="${i%2?'alt':''}"><td>${r[0]}</td><td>${esc(r[1])||'—'}</td>
        <td class="small">${esc(r[2])}</td><td class="n">${rMoney(r[3])}</td></tr>`).join('')
        || '<tr><td colspan="4" class="c ital">No income sources entered.</td></tr>'}
        <tr><td colspan="3" style="text-align:right;font-size:12px"><b>TOTAL QUALIFYING MONTHLY INCOME</b></td>
            <td class="n hl-tan" style="font-size:13px"><b>${rMoney(t.income)}</b></td></tr>
        <tr class="alt"><td colspan="3" style="text-align:right"><b>Annualized</b></td>
            <td class="n"><b>${rMoney(t.income*12)}</b></td></tr>
      </tbody></table>
      ${excluded.length?`<div class="small red" style="margin-top:5px">
        Excluded from this report at the underwriter's selection: ${excluded.map(x=>x.n).join(', ')}.</div>`:''}</div>

    <div class="rpt-band light">Housing Expense &amp; Debt Ratios</div>
    <div class="rpt-pad"><table>
      <tr><td style="width:34%">Principal &amp; Interest</td><td class="n" style="width:16%">${rMoney(N(S.dti.pi))}</td>
          <td style="width:34%">Total Subject PITIA</td><td class="n hl-blue"><b>${rMoney(t.pitia)}</b></td></tr>
      <tr class="alt"><td>Property Taxes</td><td class="n">${rMoney(N(S.dti.taxes))}</td>
          <td>Total Monthly Liabilities</td><td class="n">${rMoney(t.debts)}</td></tr>
      <tr><td>Hazard Insurance</td><td class="n">${rMoney(N(S.dti.ins))}</td>
          <td>Front-End (Housing) Ratio</td><td class="n">${(t.front*100).toFixed(2)}%</td></tr>
      <tr class="alt"><td>HOA Dues</td><td class="n">${rMoney(N(S.dti.hoa))}</td>
          <td>Back-End (Total) Ratio</td><td class="n ${t.back<=mx.b?'hl-grn':'hl-tan'}"><b>${(t.back*100).toFixed(2)}%</b></td></tr>
      <tr><td>Mortgage Insurance</td><td class="n">${rMoney(N(S.dti.mi))}</td>
          <td>Agency Benchmark</td><td class="small">${mx.label}</td></tr>
      <tr class="alt"><td>Other Housing</td><td class="n">${rMoney(N(S.dti.otherHousing))}</td><td colspan="2"></td></tr>
    </table></div>

    <div class="rpt-band light">Underwriting Findings</div>
    <div class="rpt-pad">
      ${f.map(x=>`<div style="margin-bottom:4px;font-size:10px">
        <b>${x.k==='bad'?'<span class="red">[ACTION]</span>':x.k==='warn'?'<span class="red">[REVIEW]</span>':'[NOTE]'} ${x.t}:</b>
        ${stripTags(x.m)}</div>`).join('')}
    </div>

    <div class="rpt-band light">Underwriter Comments</div>
    <div style="padding:7px 10px"><div class="rpt-val" style="min-height:56px;white-space:pre-wrap">${esc(S.notes||'')||'&nbsp;'}</div></div>
  </div>`;
}

/* ---------------- CALCULATION DETAIL ---------------- */
const FREQ_TXT = (j) => {
  const r = rMoney(N(j.rate));
  switch(j.freq){
    case 'Hourly':       return `${r} / hr &times; ${N(j.hours)} hrs per week &times; 52 weeks &divide; 12 months`;
    case 'Weekly':       return `${r} per week &times; 52 weeks &divide; 12 months`;
    case 'Bi-Weekly':    return `${r} per pay &times; 26 pays &divide; 12 months`;
    case 'Semi-Monthly': return `${r} per pay &times; 24 pays &divide; 12 months`;
    case 'Monthly':      return `${r} per month as entered`;
    case 'Annually':     return `${r} per year &divide; 12 months`;
    default:             return '&mdash;';
  }
};
function detailW2(j, idx){
  const r = calcW2(j), C = r.comp, mo = r.mo, yr = r.yr1;
  const e = pDate(j.ytdThru), doy = e ? dayOfYear(e) : 0, diy = e ? (isLeap(e.getFullYear())?366:365) : 365;
  const rows = [];
  rows.push(['Monthly base pay', FREQ_TXT(j), rMoney(r.monthlyBase)]);
  rows.push(['YTD months elapsed', `${doy} days elapsed in ${yr} &divide; ${diy} days &times; 12 months`, mo.toFixed(4)]);
  rows.push(['Expected YTD base', `${rMoney(r.monthlyBase)} &times; ${mo.toFixed(2)} months`, rMoney(r.expectedYTD)]);
  rows.push(['Actual YTD base paid', 'Per the most recent paystub', rMoney(r.actualYTD)]);
  rows.push(['YTD variance', `${rMoney(r.actualYTD)} &minus; ${rMoney(r.expectedYTD)}`,
             `${r.varAmt>=0?'+':''}${rMoney(r.varAmt)}  (${(r.varPct*100).toFixed(2)}%)`]);
  const nm = {base:'Base pay', ot:'Overtime', comm:'Commission', bonus:'Bonus', other:'Other income'};
  ['base','ot','comm','bonus','other'].forEach(k=>{
    const m = j.m[k]; if (m==='none') return;
    const c = C[k], a=N(j.y1[k]), b=N(j.y2[k]), d=N(j.y3[k]);
    let f='', v=0;
    if (m==='current'){ f = FREQ_TXT(j); v = r.monthlyBase; }
    else if (m==='ytd'){   f = `${rMoney(a)} YTD &divide; ${mo.toFixed(2)} months`; v=c.ytd; }
    else if (m==='ytd12'){ f = `(${rMoney(a)} YTD + ${rMoney(b)} in ${yr-1}) &divide; (${mo.toFixed(2)} + 12 months)`; v=c.a12; }
    else if (m==='ytd24'){ f = `(${rMoney(a)} YTD + ${rMoney(b)} + ${rMoney(d)}) &divide; (${mo.toFixed(2)} + 24 months)`; v=c.a24; }
    else { f = 'Manual override entered by the underwriter'; v = N(j.c[k]); }
    rows.push([`${nm[k]} &mdash; ${M_NAME[m]}`, f, rMoney(v)]);
  });
  const used = ['base','ot','comm','bonus','other'].filter(k=>j.m[k]!=='none').map(k=>rMoney(r.parts[k]));
  rows.push(['<b>Total qualifying monthly income</b>', used.join(' + ') || '&mdash;', `<b>${rMoney(r.total)}</b>`]);
  const LN = [['base','Base pay / salary'],['ot','Overtime'],['comm','Commission'],
              ['bonus','Bonus'],['other','Other income']];
  const pre = `<div style="font-weight:700;font-size:10.5px;margin-bottom:4px">Income Line Items &mdash; Annual Amounts and Monthly Equivalents</div>
    <table>
      <thead><tr><th style="width:26%">Line Item</th>
        <th>${yr} YTD</th><th>&divide; ${mo.toFixed(2)} mo</th>
        <th>${yr-1}</th><th>&divide; 12 mo</th>
        <th>${yr-2}</th><th>&divide; 12 mo</th></tr></thead>
      <tbody>${LN.map(([k,lb],i)=>`<tr class="${i%2?'alt':''}">
        <td>${lb}</td>
        <td class="n">${rMoney(N(j.y1[k]))}</td><td class="n">${rMoney(N(j.y1[k])/mo)}</td>
        <td class="n">${rMoney(N(j.y2[k]))}</td><td class="n">${rMoney(N(j.y2[k])/12)}</td>
        <td class="n">${rMoney(N(j.y3[k]))}</td><td class="n">${rMoney(N(j.y3[k])/12)}</td></tr>`).join('')}
        <tr class="hl-gry"><td><b>Total entered</b></td>
          <td class="n"><b>${rMoney(r.t1)}</b></td><td class="n"><b>${rMoney(r.t1/mo)}</b></td>
          <td class="n"><b>${rMoney(r.t2)}</b></td><td class="n"><b>${rMoney(r.t2/12)}</b></td>
          <td class="n"><b>${rMoney(r.t3)}</b></td><td class="n"><b>${rMoney(r.t3/12)}</b></td></tr>
      </tbody></table>`;
  return {pageTitle:'W-2 Salary Income &mdash; Line-by-Line Calculation', title:`W-2 Salary Income &mdash; ${esc(j.employer)||'Job #'+(idx+1)}`, rows, pre,
          total:r.total, totalLabel:'Total W-2 Monthly Income Used',
          totalSub:`${esc(j.employer)||'Employment #'+(idx+1)} &mdash; ${esc(S.borrower)||'borrower'}`,
          note: j.notes ? '<b>Notes:</b> '+esc(j.notes) : ''};
}
function detailSchC(b, idx){
  const r = calcSchC(b), rows = [];
  ['y2','y1'].forEach(y=>{
    const d = b[y];
    const f = `Line 31 ${rMoney(N(d.net31))} + depletion ${rMoney(N(d.depl12))} + depreciation ${rMoney(N(d.depr13))}`
            + ` &minus; meals ${rMoney(N(d.meals))} + business use of home ${rMoney(N(d.home30))}`
            + ` + amortization ${rMoney(N(d.amort))} + (${N(d.miles)} mi &times; $${N(b.rate).toFixed(2)})`;
    const a = y==='y1' ? r.a1 : r.a2;
    rows.push([`${N(d.yr)} adjusted annual business income`, f, rMoney(a)]);
    rows.push([`${N(d.yr)} monthly equivalent`, `${rMoney(a)} &divide; 12 months`, rMoney(a/12)]);
  });
  const mtxt = {avg2:`24-month average: (${rMoney(r.a1)} + ${rMoney(r.a2)}) &divide; 24 months`,
                recent:`Most recent year only: ${rMoney(r.a1)} &divide; 12 months`,
                lower:`Lower of the two years used`,
                custom:'Manual override entered by the underwriter'}[r.methodUsed];
  rows.push(['<b>Qualifying monthly Schedule C income</b>',
    mtxt + (r.declining ? ' &mdash; income declined year over year, so the most recent year governs' : ''),
    `<b>${rMoney(r.monthly)}</b>`]);
  const LN = [['net31','Line 31 &mdash; Net profit or (loss)','+'],
              ['depl12','Line 12 &mdash; Depletion','+'],
              ['depr13','Line 13 &mdash; Depreciation','+'],
              ['meals','Line 24b &mdash; Meals &amp; entertainment exclusion','&minus;'],
              ['home30','Line 30 &mdash; Business use of home','+'],
              ['amort','Amortization / casualty loss','+']];
  const pre = `<div style="font-weight:700;font-size:10.5px;margin-bottom:4px">Schedule C Line-by-Line Analysis (FNMA Form 1084)</div>
    <table>
      <thead><tr><th style="width:8%">+/&minus;</th><th>Schedule C Line Item</th>
        <th style="width:17%">${N(b.y2.yr)}</th><th style="width:17%">${N(b.y1.yr)}</th></tr></thead>
      <tbody>${LN.map(([k,lb,sg],i)=>`<tr class="${i%2?'alt':''}">
          <td class="c">${sg}</td><td>${lb}</td>
          <td class="n">${rMoney(N(b.y2[k]))}</td><td class="n">${rMoney(N(b.y1[k]))}</td></tr>`).join('')}
        <tr class="alt"><td class="c">+</td><td>Line 44A &mdash; Business miles ${N(b.y2.miles)} / ${N(b.y1.miles)} &times; $${N(b.rate).toFixed(2)}</td>
          <td class="n">${rMoney(N(b.y2.miles)*N(b.rate))}</td><td class="n">${rMoney(N(b.y1.miles)*N(b.rate))}</td></tr>
        <tr class="hl-gry"><td></td><td><b>Adjusted annual business income</b></td>
          <td class="n"><b>${rMoney(r.a2)}</b></td><td class="n"><b>${rMoney(r.a1)}</b></td></tr>
        <tr><td></td><td><b>Monthly equivalent (&divide; 12)</b></td>
          <td class="n"><b>${rMoney(r.m2)}</b></td><td class="n"><b>${rMoney(r.m1)}</b></td></tr>
      </tbody></table>`;
  return {pageTitle:'Self-Employed Income &mdash; Line-by-Line Calculation', title:`Schedule C &mdash; ${esc(b.name)||'Business #'+(idx+1)}`, rows, pre,
          total:r.monthly, totalLabel:'Total Self-Employed Monthly Income Used',
          totalSub:`${esc(b.name)||'Schedule C business'} &mdash; ${r.methodUsed==='avg2'?'24-month average':r.methodUsed==='recent'?'most recent year':r.methodUsed==='lower'?'lower of two years':'custom override'}`,
          note:''};
}
function detailCorp(e, idx){
  const r = calcCorp(e), own = N(e.own), rows = [];
  ['y2','y1'].forEach(y=>{
    const d = e[y], yl = N(d.yr);
    if (e.form === '1120'){
      const f = C1120.filter(L=>L.sign).map(L=> `${L.sign>0?'+':'&minus;'} ${stripTags(L.label).replace(/^(Plus|Less):\s*/,'')} ${rMoney(N(d[L.k]))}`).join(' ');
      rows.push([`${yl} corporate cash flow`, f.replace(/^\+\s*/,''), rMoney((r[y==='y1'?'a1':'a2'] - N(d.divid))/ (own/100 || 1))]);
      rows.push([`${yl} borrower share`, `&times; ${own}% ownership + dividends ${rMoney(N(d.divid))}`, rMoney(y==='y1'?r.a1:r.a2)]);
    } else {
      let ord = N(d.ordinary), capped='';
      if (!r.gov && !e.liquidity && N(d.dist)>0 && N(d.dist)<N(d.ordinary)){
        ord = N(d.dist); capped = ` (ordinary income ${rMoney(N(d.ordinary))} capped at distributions ${rMoney(N(d.dist))})`;
      }
      const adjTxt = BIZ_ADJ.map(L=> `${L.sign>0?'+':'&minus;'} ${stripTags(L.label).replace(/^(Plus|Less):\s*/,'')} ${rMoney(N(d[L.k]))}`).join(' ');
      rows.push([`${yl} business cash flow`,
        `Ordinary ${rMoney(ord)}${capped} + net rental ${rMoney(N(d.netRental))} + other rental ${rMoney(N(d.othRental))} ${adjTxt}`,
        rMoney((ord + N(d.netRental) + N(d.othRental) + BIZ_ADJ.reduce((s,L)=>s+L.sign*N(d[L.k]),0)))]);
      rows.push([`${yl} borrower share`,
        `&times; ${own}% ownership${e.form==='1065'?` + guaranteed payments ${rMoney(N(d.guar))}`:''} + W-2 from business ${rMoney(N(d.w2biz))}`,
        rMoney(y==='y1'?r.a1:r.a2)]);
    }
    rows.push([`${N(d.yr)} monthly equivalent`, `${rMoney(y==='y1'?r.a1:r.a2)} &divide; 12 months`, rMoney((y==='y1'?r.a1:r.a2)/12)]);
  });
  if (r.quick) rows.push(['Business liquidity test',
    `Current assets ${rMoney(N(e.curAssets))} &divide; current liabilities ${rMoney(N(e.curLiab))}`,
    `${r.quick.toFixed(2)} &mdash; ${r.quick>=1?'PASS':'FAIL'}`]);
  const mtxt = {avg2:`24-month average: (${rMoney(r.a1)} + ${rMoney(r.a2)}) &divide; 24 months`,
                recent:`Most recent year only: ${rMoney(r.a1)} &divide; 12 months`,
                lower:'Lower of the two years used',
                custom:'Manual override entered by the underwriter'}[r.methodUsed];
  rows.push(['<b>Qualifying monthly business income</b>', mtxt, `<b>${rMoney(r.monthly)}</b>`]);
  const LN = e.form==='1120'
    ? C1120.map(L=>[L.k, L.label, L.sign>0?'+':L.sign<0?'&minus;':' '])
    : [...K1_LINES.filter(L=>!(e.form==='1120S'&&L.k==='guar')).map(L=>[L.k,L.label+' <i>('+L.cite+')</i>', L.k==='dist'?'i':'+']),
       ...BIZ_ADJ.map(L=>[L.k, L.label, L.sign>0?'+':'&minus;'])];
  const pre = `<div style="font-weight:700;font-size:10.5px;margin-bottom:4px">Form ${e.form} Line-by-Line Analysis (Schedule Analysis Method)</div>
    <table>
      <thead><tr><th style="width:8%">+/&minus;</th><th>Tax Return / K-1 Line Item</th>
        <th style="width:17%">${N(e.y2.yr)}</th><th style="width:17%">${N(e.y1.yr)}</th></tr></thead>
      <tbody>${LN.map(([k,lb,sg],i)=>`<tr class="${i%2?'alt':''}">
          <td class="c">${sg==='i'?'<span class="small ital">ref</span>':sg}</td><td>${lb}</td>
          <td class="n">${rMoney(N(e.y2[k]))}</td><td class="n">${rMoney(N(e.y1[k]))}</td></tr>`).join('')}
        <tr class="alt"><td class="c">&times;</td><td>Individual percentage of ownership</td>
          <td class="n">${own}%</td><td class="n">${own}%</td></tr>
        <tr class="hl-gry"><td></td><td><b>Borrower share of annual cash flow</b></td>
          <td class="n"><b>${rMoney(r.a2)}</b></td><td class="n"><b>${rMoney(r.a1)}</b></td></tr>
        <tr><td></td><td><b>Monthly equivalent (&divide; 12)</b></td>
          <td class="n"><b>${rMoney(r.m2)}</b></td><td class="n"><b>${rMoney(r.m1)}</b></td></tr>
      </tbody></table>`;
  return {pageTitle:'Self-Employed Income &mdash; Line-by-Line Calculation', title:`Form ${e.form} &mdash; ${esc(e.name)||'Entity #'+(idx+1)}`, rows, pre,
          total:r.monthly, totalLabel:'Total Self-Employed Monthly Income Used',
          totalSub:`${esc(e.name)||'Entity'} &mdash; ${own}% ownership, ${r.methodUsed==='avg2'?'24-month average':r.methodUsed==='recent'?'most recent year':r.methodUsed==='lower'?'lower of two years':'custom override'}`,
          note:''};
}
function detailSchE(p, idx){
  const r = calcSchE(p), rows = [];
  if (p.method==='sche'){
    rows.push(['Net annual rental income',
      `(rents ${rMoney(N(p.rents))} + insurance ${rMoney(N(p.ins))} + mortgage interest ${rMoney(N(p.mortInt))}`
      + ` + taxes ${rMoney(N(p.taxes))} + depreciation ${rMoney(N(p.depr))} + HOA/repairs ${rMoney(N(p.otherAdd))})`
      + ` &minus; total expenses ${rMoney(N(p.totalExp))}`, rMoney(r.net)]);
    rows.push(['Months in service',
      N(p.monthsOverride)>0 ? `Manual override entered by the underwriter`
        : `${N(p.fairDays)} fair rental days (Sch E line 2) &divide; 365 days &times; 12 months`,
      scheMonths(p).toFixed(2)]);
    rows.push(['Monthly rental income', `${rMoney(r.net)} &divide; ${scheMonths(p).toFixed(2)} months`, rMoney(r.gross)]);
  } else {
    rows.push(['Monthly rental income',
      `Gross lease rent ${rMoney(N(p.leaseRent))} &times; ${N(p.vacancy)}% vacancy factor`, rMoney(r.gross)]);
  }
  rows.push(['Less full monthly PITIA', `Principal, interest, taxes, insurance and association dues`, `(${rMoney(N(p.pitia))})`]);
  rows.push([`<b>Net rental cash flow</b>`,
    r.monthly>=0 ? 'Positive &mdash; added to qualifying income' : 'Negative &mdash; added to monthly liabilities',
    `<b>${rMoney(r.monthly)}</b>`]);
  return {pageTitle:'Rental Income &mdash; Line-by-Line Calculation', title:`Rental &mdash; ${esc(p.addr)||'Property #'+(idx+1)}`, rows,
          total:r.monthly, totalLabel:'Net Rental Cash Flow Used', totalSub:esc(p.addr)||'Rental property', note:''};
}
function detailOther(list){
  const rows = list.map(o=>{
    const r = calcOther(o), t = OTHER_TYPES.find(x=>x.v===o.type);
    return [`${t?t.t:o.type}${o.desc?' &mdash; '+esc(o.desc):''}`,
      o.nonTax ? `${rMoney(r.base)} documented + ${N(o.grossUp)}% non-taxable gross-up (${rMoney(r.up)})`
               : `${rMoney(r.base)} documented, taxable &mdash; no gross-up`,
      rMoney(r.total)];
  });
  rows.push(['<b>Total other monthly income</b>', rows.map(x=>x[2]).join(' + ')||'&mdash;',
    `<b>${rMoney(list.reduce((s,o)=>s+calcOther(o).total,0))}</b>`]);
  return {pageTitle:'Other Income &mdash; Line-by-Line Calculation', title:'Other &amp; Non-Employment Income', rows,
          total:list.reduce((s,o)=>s+calcOther(o).total,0),
          totalLabel:'Total Other Monthly Income Used', totalSub:'', note:''};
}
function detailAssets(){
  const a = calcAssets(), rows = [];
  S.assets.rows.forEach(x=>{ const t=ASSET_TYPES.find(y=>y.v===x.type);
    rows.push([esc(x.name)||'Account', `${t?t.t:x.type}: ${rMoney(N(x.bal))} &times; ${N(x.elig)}% eligible`,
      rMoney(N(x.bal)*N(x.elig)/100)]); });
  rows.push(['Net eligible assets',
    `${rMoney(a.eligible)} &minus; funds to close ${rMoney(N(S.assets.fundsToClose))} &minus; reserves ${rMoney(N(S.assets.reserves))}`,
    rMoney(a.net)]);
  rows.push(['<b>Qualifying monthly income</b>',
    `${rMoney(a.net)} &divide; ${a.div} months` + (S.assets.use?'':' &mdash; not included in qualifying income'),
    `<b>${rMoney(a.monthly)}</b>`]);
  return {pageTitle:'Asset Depletion &mdash; Line-by-Line Calculation', title:'Asset Depletion', rows, total:a.monthly,
          totalLabel:'Asset Depletion Monthly Income Used',
          totalSub: S.assets.use ? '' : 'Not included in qualifying income', note:''};
}
function rptDetailBlock(d){
  return `<div class="rpt-frame" style="margin-bottom:11px">
    <div class="rpt-band light">${d.title}</div>
    <div class="rpt-pad">
      ${d.pre||''}
      <div style="font-weight:700;font-size:10.5px;margin:${d.pre?'10px':'0'} 0 4px">Calculation Used</div>
      <table>
      <thead><tr><th style="width:26%">Step</th><th>Calculation</th><th style="width:17%">Result</th></tr></thead>
      <tbody>${d.rows.map((r,i)=>`<tr class="${i%2?'alt':''}${i===d.rows.length-1?' hl-tan':''}">
        <td>${r[0]}</td><td class="small">${r[1]}</td><td class="n">${r[2]}</td></tr>`).join('')}</tbody>
    </table>${d.note?`<div class="small" style="margin-top:5px">${d.note}</div>`:''}</div></div>`;
}
function rptTotalBox(label, amount, sub){
  return `<div class="rpt-frame" style="display:flex;align-items:center;gap:14px;padding:9px 14px;background:#fde9d9">
    <div style="flex:1"><div style="font-size:12.5px;font-weight:700">${label}</div>
      ${sub?`<div class="small" style="margin-top:2px">${sub}</div>`:''}</div>
    <div style="font-size:20px;font-weight:700;font-variant-numeric:tabular-nums">${rMoney(amount)} <span style="font-size:11px">/ month</span></div>
  </div>`;
}

/* ---------------- SELECTION + ASSEMBLE ---------------- */
const RPT = { pick:null, summary:false, detail:false, worksheets:true, encompass:false };
function reportItems(){
  const it = [];
  S.w2.forEach((j,i)=>   it.push({k:'w2:'+j.id,   g:'W-2 / Salary Employment', n:esc(j.employer)||`Job #${i+1}`,             a:calcW2(j).total}));
  S.schc.forEach((b,i)=> it.push({k:'schc:'+b.id, g:'Schedule C (Sole Prop)',   n:esc(b.name)||`Business #${i+1}`,            a:calcSchC(b).monthly}));
  S.corp.forEach((e,i)=> it.push({k:'corp:'+e.id, g:'Partnership / Corporate',  n:(esc(e.name)||`Entity #${i+1}`)+` — ${e.form}`, a:calcCorp(e).monthly}));
  S.sche.forEach((p,i)=> it.push({k:'sche:'+p.id, g:'Rental (Schedule E)',      n:esc(p.addr)||`Property #${i+1}`,            a:calcSchE(p).monthly}));
  S.other.forEach((o,i)=>{ const t=OTHER_TYPES.find(x=>x.v===o.type);
                         it.push({k:'other:'+o.id,g:'Other Income',             n:esc(o.desc)||(t?t.t:`Item #${i+1}`),       a:calcOther(o).total}); });
  if (S.assets.rows.length) it.push({k:'assets',  g:'Asset Depletion',          n:'Liquid financial assets',                 a:calcAssets().monthly});
  return it;
}
const rptOn = k => !RPT.pick || RPT.pick[k] !== false;
function reportTotals(){
  let income=0, rentNeg=0;
  const selW2 = S.w2.filter(j=>rptOn('w2:'+j.id) && ON(j));
  if (combineActive() && selW2.length>1) income += calcCombined(selW2).total;
  else selW2.forEach(j=> income += calcW2(j).total );
  S.schc.forEach(b=>{ if(rptOn('schc:'+b.id) && ON(b)) income += calcSchC(b).monthly; });
  S.corp.forEach(e=>{ if(rptOn('corp:'+e.id) && ON(e)) income += calcCorp(e).monthly; });
  S.sche.forEach(p=>{ if(!rptOn('sche:'+p.id) || !ON(p)) return; const m=calcSchE(p).monthly; if(m>=0) income+=m; else rentNeg+=-m; });
  S.other.forEach(o=>{ if(rptOn('other:'+o.id) && ON(o)) income += calcOther(o).total; });
  if (rptOn('assets') && S.assets.use) income += calcAssets().monthly;
  const pitia = N(S.dti.pi)+N(S.dti.taxes)+N(S.dti.ins)+N(S.dti.hoa)+N(S.dti.mi)+N(S.dti.otherHousing);
  const debts = S.dti.debts.reduce((s,d)=>s+N(d.amt),0) + rentNeg;
  return {income, pitia, debts, rentNeg, front: income?pitia/income:0, back: income?(pitia+debts)/income:0};
}
function reportSummaryRows(){
  const out = [];
  const selW2 = S.w2.filter(j=>rptOn('w2:'+j.id));
  if (combineActive() && selW2.length>1){
    const r = calcCombined(selW2);
    const MN={current:'Current Base',ytd:'YTD Avg',ytd12:'YTD + Prev Yr',ytd24:'YTD + Last 2 Yrs',custom:'Custom Override'};
    const CN={base:'Base',ot:'OT',comm:'Comm',bonus:'Bonus',other:'Other',unre:'Unreimb'};
    out.push(['W-2 Employment (combined)', selW2.map((j,i)=>j.employer||`Job #${i+1}`).join(' + '),
      'All jobs aggregated — ' + Object.keys(S.combine.m).filter(k=>S.combine.m[k]!=='none')
        .map(k=>`${CN[k]}: ${MN[S.combine.m[k]]}`).join(' | '), r.total]);
  } else
  S.w2.forEach(j=>{ if(!rptOn('w2:'+j.id)) return; const r=calcW2(j);
    const CN={base:'Base',ot:'OT',comm:'Comm',bonus:'Bonus',other:'Other',unre:'Unreimb'};
    const meth = Object.keys(j.m).filter(k=>j.m[k]!=='none').map(k=>`${CN[k]}: ${M_NAME[j.m[k]]}`).join(' | ');
    out.push(['W-2 Employment', j.employer, meth||'—', r.total]); });
  S.schc.forEach(b=>{ if(!rptOn('schc:'+b.id)) return; const r=calcSchC(b);
    out.push(['Schedule C Sole Prop', b.name, `Form 1084 add-backs — ${r.methodUsed}`, r.monthly]); });
  S.corp.forEach(e=>{ if(!rptOn('corp:'+e.id)) return; const r=calcCorp(e);
    out.push([`Corporate (${e.form})`, `${e.name} (${N(e.own)}%)`, `Pass-through${e.form==='1065'?' + guaranteed pay':''} — ${seName(r.methodUsed)}`, r.monthly]); });
  S.sche.forEach(p=>{ if(!rptOn('sche:'+p.id)) return; const r=calcSchE(p);
    out.push(['Schedule E Rental', p.addr, p.method==='sche'?'Sch E cash flow':'75% lease rule', r.monthly]); });
  S.other.forEach(o=>{ if(!rptOn('other:'+o.id)) return; const r=calcOther(o); const t=OTHER_TYPES.find(x=>x.v===o.type);
    out.push(['Other Income', o.desc || (t?t.t:''), o.nonTax?`Non-taxable + ${N(o.grossUp)}% gross-up`:'Taxable', r.total]); });
  if (rptOn('assets') && S.assets.use) out.push(['Asset Depletion','Liquid Financial Assets',
    `${calcAssets().div}-month amortization`, calcAssets().monthly]);
  return out;
}
function buildReportPages(){
  const pages = [];
  if (RPT.summary) pages.push(rptSummaryPage());
  /* worksheet page followed immediately by its own line-by-line calculation page */
  const detailPage = d => `${rptHead(d.pageTitle,
      'Every line item, the method applied, and the income used for qualifying')}
    ${rptIdBar()}${rptDetailBlock(d)}
    ${rptTotalBox(d.totalLabel||'Monthly Income Used', d.total||0, d.totalSub||'')}`;
  const add = (sheet, det) => { if (RPT.worksheets && sheet) pages.push(sheet); if (RPT.detail && det) pages.push(detailPage(det)); };

  S.w2.forEach((j,i)=>{ if(!rptOn('w2:'+j.id)) return; add(rptW2Page(j,i), detailW2(j,i)); });
  S.schc.forEach((b,i)=>{ if(!rptOn('schc:'+b.id)) return; add(rptSchCPage(b,i), detailSchC(b,i)); });
  S.corp.forEach((e,i)=>{ if(!rptOn('corp:'+e.id)) return; add(rptCorpPage(e,i), detailCorp(e,i)); });
  const rentals = S.sche.filter(p=>rptOn('sche:'+p.id));
  if (rentals.length){
    if (RPT.worksheets) pages.push(rptRentalPage(rentals));
    if (RPT.detail) rentals.forEach((p,i)=> pages.push(detailPage(detailSchE(p,i))) );
  }
  const others = S.other.filter(o=>rptOn('other:'+o.id));
  const wantAssets = rptOn('assets') && S.assets.rows.length;
  if (others.length || wantAssets){
    if (RPT.worksheets) pages.push(rptOtherPage(others, wantAssets));
    if (RPT.detail && others.length) pages.push(detailPage(detailOther(others)));
    if (RPT.detail && wantAssets)    pages.push(detailPage(detailAssets()));
  }
  if (RPT.encompass){ pages.push(encPage1()); pages.push(encPage2()); }
  if (!pages.length) pages.push(`${rptHead('Income Calculation Report','Nothing selected')}
    <div class="rpt-frame rpt-pad" style="text-align:center;padding:60px 20px">
      <b>No content selected.</b><div class="small" style="margin-top:6px">
      Tick at least one income source, or enable the summary page, above.</div></div>`);
  return pages;
}

/* ---------------- PICKER UI ---------------- */
function renderPicker(){
  const items = reportItems();
  if (!RPT.pick){ RPT.pick = {}; items.forEach(i=>RPT.pick[i.k]=true); }
  items.forEach(i=>{ if(RPT.pick[i.k]===undefined) RPT.pick[i.k]=true; });
  const groups = [...new Set(items.map(i=>i.g))];
  const onCount = items.filter(i=>rptOn(i.k)).length;
  const t = reportTotals();
  $('rptPicker').innerHTML = `
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px">
      <div><h4>Choose the income to include in this report</h4>
        <div class="sub">Each selected source gets its worksheet page plus a step-by-step calculation breakdown.</div></div>
      <div style="margin-left:auto;display:flex;gap:6px">
        <button class="btn btn-light btn-sm" onclick="pickAll(true)">Select all</button>
        <button class="btn btn-light btn-sm" onclick="pickAll(false)">Select none</button>
      </div>
    </div>
    ${items.length ? groups.map(g=>`
      <div class="rpt-grp">${g}</div>
      ${items.filter(i=>i.g===g).map(i=>`
        <label class="rpt-item ${rptOn(i.k)?'on':''}">
          <input type="checkbox" ${rptOn(i.k)?'checked':''} onchange="pickOne('${i.k}',this.checked)">
          <span class="nm">${i.n}</span><span class="am">${money(i.a)} / mo</span>
        </label>`).join('')}`).join('')
      : '<div class="sub" style="margin-top:10px">No income has been entered yet — the report will contain the summary page only.</div>'}
    <div class="rpt-opts">
      <label><input type="checkbox" ${RPT.summary?'checked':''} onchange="RPT.summary=this.checked;refreshReport()"> Income summary page</label>
      <label><input type="checkbox" ${RPT.worksheets?'checked':''} onchange="RPT.worksheets=this.checked;refreshReport()"> Worksheet pages</label>
      <label><input type="checkbox" ${RPT.detail?'checked':''} onchange="RPT.detail=this.checked;refreshReport()"> Calculation detail pages</label>
      <label title="Section 1a personal information, 1b employment with the Gross Monthly Income grid, and 1e other income — laid out the way Encompass takes it"><input type="checkbox" ${RPT.encompass?'checked':''} onchange="RPT.encompass=this.checked;refreshReport()"> Encompass / URLA 1003 pages</label>
      <span class="rpt-count">${onCount} of ${items.length} sources &nbsp;|&nbsp; selected income <b>${money(t.income)}</b> / mo</span>
    </div>`;
}
function pickOne(k, v){ RPT.pick[k]=v; refreshReport(); }
function reportHTML(){
  const pages = buildReportPages();
  return pages.map((h,i)=>`<div class="rpt-page">${h}
    <div class="rpt-foot"><span>${esc(S.borrower)||'Borrower'} &nbsp;|&nbsp; File #${esc(S.file)||'—'} &nbsp;|&nbsp; Prepared ${today()}</span>
    <span>Page ${i+1} of ${pages.length}</span></div></div>`).join('');
}
function reportLibsReady(){
  const jp = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  return (typeof html2canvas !== 'undefined') && !!jp;
}
function openReport(){
  RPT.pick = null;              /* rebuild the source list each time so new entries appear */
  refreshReport();
  $('rptModal').classList.add('on');
  document.body.style.overflow='hidden';
  const warn = $('rptLibWarn');
  if (warn) warn.style.display = reportLibsReady() ? 'none' : 'block';
}
function closeReport(){ $('rptModal').classList.remove('on'); document.body.style.overflow=''; }
function pickAll(v){ reportItems().forEach(i=>RPT.pick[i.k]=v); refreshReport(); }
function refreshReport(){
  renderPicker();
  const html = reportHTML();
  $('rptModalBody').innerHTML = html;
  $('rptStage').innerHTML = '<div class="rpt">'+html+'</div>';
}

/* ---------------- EXPORT ---------------- */
function reportName(ext){
  const who = (S.b1 || S.borrower || 'Borrower').trim().replace(/\s+/g,' ').replace(/[\\/:*?"<>|]/g,'');
  const d = new Date();
  const stamp = `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${d.getFullYear()}`;
  return `${who} Income Calc ${stamp}.${ext}`;
}

async function shotPages(scale){
  const nodes = [...$('rptStage').querySelectorAll('.rpt-page')];
  const out = [];
  for (const n of nodes){
    out.push(await html2canvas(n, {scale:scale||2, backgroundColor:'#ffffff', logging:false, useCORS:true}));
  }
  return out;
}
async function reportPDF(){
  const jsPDFctor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  if (typeof html2canvas === 'undefined' || !jsPDFctor){
    toast('Rendering library unavailable — opening the print dialog instead'); reportPrintWindow(); return;
  }
  toast('Building PDF…');
  try{
    const canvases = await shotPages(2);
    const pdf = new jsPDFctor({unit:'pt', format:'letter', orientation:'portrait'});
    canvases.forEach((c,i)=>{
      if(i) pdf.addPage();
      pdf.addImage(c.toDataURL('image/jpeg',0.94), 'JPEG', 0, 0, 612, 792, undefined, 'FAST');
    });
    const nm = reportName('pdf');
    noteReport(nm, 'pdf', pdf.output('blob'));
    pdf.save(nm);
    toast('PDF downloaded');
  }catch(err){ toast('PDF failed — opening print dialog'); reportPrintWindow(); }
}
async function reportJPEG(){
  if (typeof html2canvas === 'undefined'){ toast('Image library unavailable — use Print → Save as PDF'); return; }
  toast('Rendering image…');
  try{
    const canvases = await shotPages(2);
    canvases.forEach((c,i)=>{
      const nm = canvases.length>1 ? reportName('jpg').replace('.jpg',` p${i+1}.jpg`) : reportName('jpg');
      c.toBlob(b=>{ noteReport(nm,'jpg',b); dl(b, nm); }, 'image/jpeg', 0.93);
    });
    toast(canvases.length>1 ? `${canvases.length} JPEG pages downloaded` : 'JPEG downloaded');
  }catch(err){ toast('Image render failed: '+err.message); }
}
function reportPrintWindow(){
  const css = document.querySelector('style').textContent;
  const w = window.open('', '_blank');
  if(!w){ toast('Pop-up blocked — allow pop-ups to print the report'); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(S.borrower||'Income Calculation')}</title>
    <style>${css}
    @page{size:letter;margin:0}
    html,body{margin:0;padding:0;background:#fff}
    .rpt-page{margin:0 auto;box-shadow:none;page-break-after:always}
    .rpt-page:last-child{page-break-after:auto}
    </style></head><body class="rpt">${reportHTML()}</body></html>`);
  w.document.close();
  setTimeout(()=>{ w.focus(); w.print(); }, 500);
}
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && $('rptModal').classList.contains('on')) closeReport(); });
