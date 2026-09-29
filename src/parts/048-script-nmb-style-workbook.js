
/* ==================================================================
   NMB-STYLE WORKBOOK
   Lays the export out the way the NMB Income Worksheet does: title,
   Employment Record bands, Salary/Hourly and Overtime/Bonus/Commission
   sections, the year matrix with Amount Used and Method rows, and the
   Borrower's Income box — then the Schedule Analysis Method outline for
   self-employment, the rental cash-flow blocks and the summary tabs.
   ================================================================== */

function nmbBook(){
  const St = styleBook(), xf = St.xf;

  /* --- the style vocabulary of the NMB sheets --- */
  const S_TITLE  = xf({sz:24, b:true, h:'left'});
  const S_SUB    = xf({sz:11, i:true, color:'FF595959'});
  const S_LBLR   = xf({sz:11, b:true, h:'right'});
  const S_LBL    = xf({sz:11, b:true, h:'left'});
  const S_TXT    = xf({sz:11, h:'left'});
  const S_TXTB   = xf({sz:11, h:'left', bord:'thin'});
  const S_BAND   = xf({sz:16, b:true, color:NC.white, fill:NC.band,  h:'left'});
  const S_BAND2  = xf({sz:14, b:true, color:NC.white, fill:NC.band2, h:'left'});
  const S_BAND3  = xf({sz:12, b:true, color:NC.white, fill:NC.band3, h:'center'});
  const S_HEAD   = xf({sz:11, b:true, fill:NC.head, bord:'thin', h:'center', wrap:true});
  const S_YEAR   = xf({sz:11, b:true, fill:NC.row,  bord:'thin', h:'center'});
  const S_MONEY  = xf({sz:11, fmt:FMT.money, bord:'thin', h:'right'});
  const S_MONEYB = xf({sz:11, b:true, fmt:FMT.money, bord:'thin', h:'right'});
  const S_USED   = xf({sz:12, b:true, fmt:FMT.money, fill:NC.blue, bord:'thin', h:'right'});
  const S_METH   = xf({sz:10, b:true, fill:NC.blue, bord:'thin', h:'center', wrap:true});
  const S_BLUE   = xf({sz:11, b:true, fmt:FMT.money, fill:NC.lblue, bord:'thin', h:'right'});
  const S_GREEN  = xf({sz:11, b:true, fmt:FMT.money, fill:NC.green, bord:'thin', h:'right'});
  const S_YELLOW = xf({sz:13, b:true, fmt:FMT.money, fill:NC.yellow, bord:'medium', h:'right'});
  const S_YLBL   = xf({sz:12, b:true, fill:NC.yellow, bord:'medium', h:'left'});
  const S_BIGLBL = xf({sz:16, b:true, h:'right'});
  const S_BIG    = xf({sz:16, b:true, fmt:FMT.money, fill:NC.green, bord:'medium', h:'right'});
  const S_RED    = xf({sz:10, b:true, color:NC.red, wrap:true, v:'top', h:'left'});
  const S_NUM    = xf({sz:11, fmt:FMT.num2, bord:'thin', h:'center'});
  const S_INT    = xf({sz:11, fmt:FMT.int,  bord:'thin', h:'center'});
  const S_DATE   = xf({sz:11, fmt:FMT.date, bord:'thin', h:'center'});
  const S_PCT    = xf({sz:11, fmt:FMT.pct2, bord:'thin', h:'right'});
  const S_PCT3   = xf({sz:11, fmt:FMT.pct3, bord:'thin', h:'right'});
  const S_ITEM   = xf({sz:11, h:'left', indent:2});
  const S_ITEM2  = xf({sz:11, h:'left', indent:3});
  const S_SECT   = xf({sz:12, b:true, h:'left'});
  const S_REF    = xf({sz:10, i:true, color:'FF595959', h:'right'});
  const S_TOTLBL = xf({sz:12, b:true, fill:NC.tan, bord:'thin', h:'left'});
  const S_TOT    = xf({sz:12, b:true, fmt:FMT.money, fill:NC.tan, bord:'thin', h:'right'});
  const S_NOTE   = xf({sz:10, color:'FF595959', wrap:true, v:'top', h:'left'});

  const SE_METHOD = {avg2:'24-month average', recent:'most recent year only',
                     lower:'lower of the two years', custom:'custom override'};
  const seMeth = m => SE_METHOD[m] || m;
  const XD = iso => { const d = pDate(iso); if(!d) return null;
    return Math.round((d - new Date(Date.UTC(1899,11,30))) / 86400000); };
  const sheets = [];

  /* ---------- shared header block ---------- */
  /* L = {l:label col, v:value col, ve:value end col, rl:right label col, rv:right value col} */
  function head(sh, title, sub, L){
    sh.put(1,1,title,S_TITLE).height(1,32);
    if (sub) sh.put(2,1,sub,S_SUB).merge(2,1,2,Math.max(L.rv,7));
    sh.put(3,L.l,'Loan Number:',S_LBLR).put(3,L.v,S.file||'',S_TXTB);
    if (L.ve>L.v) sh.merge(3,L.v,3,L.ve);
    sh.put(3,L.rl,'Date:',S_LBLR).put(3,L.rv, XD(new Date().toISOString().slice(0,10)) || 0, S_DATE);
    sh.put(4,L.l,'Borrower:',S_LBLR).put(4,L.v,S.borrower||'',S_TXTB);
    if (L.ve>L.v) sh.merge(4,L.v,4,L.ve);
    sh.put(4,L.rl,'Agency:',S_LBLR).put(4,L.rv,S.agency,S_TXTB);
    return 6;
  }
  const widths = (sh, map) => { Object.keys(map).forEach(k=> sh.width(+k, map[k]) ); return sh; };

  /* ================= WAGE EARNER ================= */
  const we = XSheet('Wage Earner');
  widths(we, {1:2.7, 2:3.7, 3:2.4, 4:19, 5:17.5, 6:16.5, 7:17.5, 8:17, 9:16.5, 10:20, 11:30});
  let r = head(we, 'Wage Earner Income Calculator',
    'Base, overtime, bonus and commission per FNMA Form 1084 / FHLMC Form 91 / HUD 4000.1',
    {l:4, v:5, ve:8, rl:10, rv:11});
  we.freeze = 5;

  if (!S.w2.length) we.put(r,4,'No employment records entered.',S_TXT);
  S.w2.forEach((j, idx)=>{
    const c = calcW2(j), yr = c.yr1;
    r += 1;
    we.put(r,1,`Employment Record #${idx+1}${ON(j)?'':'   (excluded from qualifying income)'}`,S_BAND)
      .merge(r,1,r,11).height(r,22);
    r += 2;
    we.put(r,4,'Borrower Name:',S_LBLR).put(r,5, j.b===2?(S.b2||''):(S.b1||''), S_TXTB).merge(r,5,r,11); r++;
    we.put(r,4,'Employer Name:',S_LBLR).put(r,5, j.employer||'', S_TXTB).merge(r,5,r,11); r++;
    we.put(r,4,'Type of Income:',S_LBLR)
      .put(r,5, j.incomeType==='consistent'?'Consistent Hours':'Irregular Hours', S_TXTB).merge(r,5,r,7);
    we.put(r,8,'Months on Job:',S_LBLR).put(r,9, c.monthsJob, S_NUM);
    r += 2;

    we.put(r,2,'Salary/Hourly',S_BAND2).merge(r,2,r,11).height(r,19); r++;
    we.put(r,8,'Base Salary',xf({sz:12,b:true,h:'center'})).merge(r,8,r,9);
    we.put(r,10,'* Use YTD if lower than the monthly amount unless a satisfactory explanation is entered in Notes '
      + 'for using the higher figure. If hours are irregular, review the Amount Used below.', S_RED)
      .merge(r,10,r+4,11).height(r,14); r++;
    we.put(r,4,'Frequency:',S_LBLR).put(r,5, j.freq, S_TXTB)
      .put(r,7,'Monthly Amount:',S_LBLR).put(r,8, c.monthlyBase, S_BLUE); r++;
    we.put(r,4,'Amount:',S_LBLR).put(r,5, N(j.rate), S_MONEY)
      .put(r,7,'Monthly YTD Amount:',S_LBLR).put(r,8, c.comp.base.ytd, S_BLUE); r++;
    we.put(r,4,'Weekly Hours:',S_LBLR).put(r,5, N(j.hours), S_NUM)
      .put(r,7,'Annual Amount:',S_LBLR).put(r,8, c.monthlyBase*12, S_GREEN);
    r += 2;

    we.put(r,2,'Overtime / Bonus / Commission',S_BAND2).merge(r,2,r,11).height(r,19); r++;
    we.put(r,5,'Hire Date:',S_LBLR).put(r,6, XD(j.hireDate), S_DATE)
      .put(r,7,'Pay Period End Date:',S_LBLR).put(r,8, XD(j.ytdThru), S_DATE)
      .put(r,9,'YTD Months:',S_LBLR).put(r,10, c.mo, S_NUM); r += 2;
    we.put(r,4,'Enter the amounts from the most recent documentation available — paystubs and W-2s, or a written VOE.',S_LBL)
      .merge(r,4,r,11); r++;
    we.put(r,4,'Do not enter any amounts that are not likely to continue.',S_LBL).merge(r,4,r,11); r++;

    ['Year','Base Pay / YTD Amount','Overtime','Commission','Bonus','Other Income','Total Amount Entered']
      .forEach((h,i)=> we.put(r, 4+i, h, S_HEAD) );
    we.height(r,30); r++;
    [['y1', yr+' YTD'],['y2', String(yr-1)],['y3', String(yr-2)]].forEach(([k,lbl])=>{
      const d = j[k];
      we.put(r,4,lbl,S_YEAR)
        .put(r,5,N(d.base),S_MONEY).put(r,6,N(d.ot),S_MONEY).put(r,7,N(d.comm),S_MONEY)
        .put(r,8,N(d.bonus),S_MONEY).put(r,9,N(d.other),S_MONEY)
        .put(r,10, N(d.base)+N(d.ot)+N(d.comm)+N(d.bonus)+N(d.other), S_MONEYB);
      r++;
    });
    we.put(r,4,'Amount Used',S_YEAR)
      .put(r,5,c.parts.base,S_USED).put(r,6,c.parts.ot,S_USED).put(r,7,c.parts.comm,S_USED)
      .put(r,8,c.parts.bonus,S_USED).put(r,9,c.parts.other,S_USED).put(r,10,c.total,S_USED); r++;
    we.put(r,4,'Method',S_YEAR)
      .put(r,5,M_NAME[j.m.base],S_METH).put(r,6,M_NAME[j.m.ot],S_METH).put(r,7,M_NAME[j.m.comm],S_METH)
      .put(r,8,M_NAME[j.m.bonus],S_METH).put(r,9,M_NAME[j.m.other],S_METH).put(r,10,'Monthly',S_METH);
    we.height(r,26); r += 2;

    we.put(r,4,'Base Only Annual:',S_YLBL).merge(r,4,r,5).put(r,6, c.monthlyBase*12, S_YELLOW)
      .put(r,7,'Projected YTD Annual Base:',S_YLBL).merge(r,7,r,8)
      .put(r,9, c.comp.base.ytd*12, S_YELLOW).height(r,20); r += 2;

    we.put(r,6,'Monthly',xf({sz:14,b:true,h:'center'})).put(r,7,'Annual',xf({sz:14,b:true,h:'center'}));
    we.put(r,9,'For Information Only',S_BAND3).merge(r,9,r,11); r++;
    we.put(r,5,"Borrower's Income:",S_BIGLBL).put(r,6, c.total, S_BIG).put(r,7, c.total*12, S_BIG).height(r,24);
    we.put(r,9,'YTD vs. Calc. Amount',S_HEAD).put(r,10,'Monthly',S_HEAD).put(r,11,'Annual',S_HEAD); r++;
    const infoYTD = c.comp.base.ytd + c.comp.ot.ytd + c.comp.comm.ytd + c.comp.bonus.ytd + c.comp.other.ytd;
    we.put(r,9,'Total YTD Only:',S_YEAR).put(r,10, infoYTD, S_MONEY).put(r,11, infoYTD*12, S_MONEY); r++;
    we.put(r,9,'Difference vs. Used:',S_YEAR)
      .put(r,10, infoYTD - c.total, S_MONEY).put(r,11, (infoYTD - c.total)*12, S_MONEY); r++;
    if (j.notes){ r++; we.put(r,4,'Notes:',S_LBLR).put(r,5, j.notes, S_NOTE).merge(r,5,r,11).height(r,30); }
    r += 3;
  });

  if (combineActive() && S.w2.filter(ON).length > 1){
    const rc = calcCombined();
    we.put(r,1,'Combined — All Employment',S_BAND).merge(r,1,r,11).height(r,22); r += 2;
    ['Component','YTD (Yr 1)','Prior Yr','2 Yrs Prior','YTD Avg','YTD + 12','YTD + 24','Monthly Used']
      .forEach((h,i)=> we.put(r,4+i,h,S_HEAD) ); we.height(r,30); r++;
    const CN = {base:'Base', ot:'Overtime', comm:'Commission', bonus:'Bonus', other:'Other Income'};
    ['base','ot','comm','bonus','other'].forEach(k=>{ const x = rc.comp[k];
      we.put(r,4,CN[k],S_YEAR).put(r,5,x.y1,S_MONEY).put(r,6,x.y2,S_MONEY).put(r,7,x.y3,S_MONEY)
        .put(r,8,x.ytd,S_MONEY).put(r,9,x.a12,S_MONEY).put(r,10,x.a24,S_MONEY)
        .put(r,11,rc.parts[k],S_USED); r++; });
    we.put(r,4,'Total Combined Qualifying',S_TOTLBL).merge(r,4,r,10).put(r,11, rc.total, S_TOT);
    r += 2;
  }
  sheets.push(we);

  /* ================= SE & OTHER INCOME ================= */
  const se = XSheet('SE & Other Income');
  widths(se, {1:2, 2:3, 3:3.5, 4:3, 5:46, 6:14, 7:14, 8:3, 9:16, 10:14, 11:14});
  r = head(se, 'Self-Employed & Other Income',
    'Schedule Analysis Method — FNMA Form 1084 / FHLMC Form 91. Add-backs follow the agency selected in the header.',
    {l:5, v:6, ve:7, rl:9, rv:10});
  se.freeze = 5;
  const seRow = (label, ref, y1, y2, style)=>{
    se.put(r,5,label, style||S_ITEM2).put(r,9, ref||'', S_REF)
      .put(r,10, y1, S_MONEY).put(r,11, y2===null?'':y2, y2===null?S_TXTB:S_MONEY); r++;
  };

  if (S.schc.length){
    se.put(r,2,'A.  Individual Tax Return (Form 1040)',S_SECT); r++;
    S.schc.forEach((b,i)=>{
      se.put(r,3,`${i+1}.  Schedule C — ${b.name||'Sole Proprietorship'}`,S_SECT); r++;
      se.put(r,9,'Line ref.',S_HEAD).put(r,10, String(b.y1.yr||''), S_HEAD).put(r,11, String(b.y2.yr||''), S_HEAD); r++;
      const AB = 'abcdefghij';
      SCHC_LINES.forEach((L,k)=> seRow(`${AB[k]}.  ${stripTags(L.label)}`, stripTags(L.cite), N(b.y1[L.k]), N(b.y2[L.k])) );
      const cx = calcSchC(b);
      seRow('Adjusted annual income', '', cx.a1, cx.a2, S_LBL);
      seRow('Monthly income', '', cx.m1, cx.m2, S_LBL);
      se.put(r,5,`Qualifying monthly income — ${seMeth(cx.methodUsed)}`,S_TOTLBL).merge(r,5,r,10)
        .put(r,11, cx.monthly, S_TOT); r += 2;
    });
  }
  if (S.corp.length){
    se.put(r,2,'B.  Business Returns and Schedule K-1',S_SECT); r++;
    S.corp.forEach((e,i)=>{
      const t = {'1065':'Form 1065 — Partnership','1120S':'Form 1120-S — S Corporation','1120':'Form 1120 — Corporation'}[e.form]||e.form;
      se.put(r,3,`${i+1}.  ${t} — ${e.name||''}  (${N(e.own).toFixed(2)}% ownership)`,S_SECT); r++;
      se.put(r,9,'Line ref.',S_HEAD).put(r,10, String(e.y1.yr||''), S_HEAD).put(r,11, String(e.y2.yr||''), S_HEAD); r++;
      const lines = e.form==='1120' ? C1120 : [...K1_LINES, ...BIZ_ADJ];
      const AB = 'abcdefghijklmnop';
      lines.forEach((L,k)=> seRow(`${AB[k]||'-'}.  ${stripTags(L.label)}`, stripTags(L.cite), N(e.y1[L.k]), N(e.y2[L.k])) );
      const cx = calcCorp(e);
      seRow("Borrower's share, annual", '', cx.a1, cx.a2, S_LBL);
      se.put(r,5,`Qualifying monthly income — ${seMeth(cx.methodUsed)}`,S_TOTLBL).merge(r,5,r,10)
        .put(r,11, cx.monthly, S_TOT); r += 2;
    });
  }
  if (S.other.length){
    se.put(r,2,'C.  Other Income',S_SECT); r++;
    se.put(r,5,'Income type',S_HEAD).put(r,9,'Basis',S_HEAD).put(r,10,'Monthly',S_HEAD).put(r,11,'Qualifying',S_HEAD); r++;
    S.other.forEach(o=>{ const cx = calcOther(o), t = OTHER_TYPES.find(x=>x.v===o.type);
      se.put(r,5, `${t?stripTags(t.t):o.type}${o.desc?` — ${o.desc}`:''}`, S_ITEM)
        .put(r,9, o.nonTax?`Non-taxable +${N(o.grossUp)}%`:'Taxable', S_REF)
        .put(r,10, cx.base, S_MONEY).put(r,11, cx.total, S_MONEYB); r++; });
    const ot = S.other.filter(ON).reduce((n,o)=>n+calcOther(o).total,0);
    se.put(r,5,'Total other income',S_TOTLBL).merge(r,5,r,10).put(r,11, ot, S_TOT); r += 2;
  }
  if (S.assets.rows.length){
    const a = calcAssets();
    se.put(r,2,'D.  Employment-Related Assets / Asset Depletion',S_SECT); r++;
    se.put(r,5,'Account',S_HEAD).put(r,9,'Eligible %',S_HEAD).put(r,10,'Balance',S_HEAD).put(r,11,'Eligible value',S_HEAD); r++;
    S.assets.rows.forEach(x=>{ const t = ASSET_TYPES.find(y=>y.v===x.type);
      se.put(r,5, `${x.name||''}${t?` — ${stripTags(t.t)}`:''}`, S_ITEM)
        .put(r,9, N(x.elig), S_NUM).put(r,10, N(x.bal), S_MONEY)
        .put(r,11, N(x.bal)*N(x.elig)/100, S_MONEY); r++; });
    [['Eligible after haircut',a.eligible],['Less funds to close',-N(S.assets.fundsToClose)],
     ['Less required reserves',-N(S.assets.reserves)],['Net eligible',a.net]].forEach(([l,v])=>{
      se.put(r,5,l,S_ITEM).put(r,11,v,S_MONEYB); r++; });
    se.put(r,5,`Monthly income — ${a.div}-month amortization${S.assets.use?'':'  (not included)'}`,S_TOTLBL)
      .merge(r,5,r,10).put(r,11, a.monthly, S_TOT); r += 2;
  }
  if (!S.schc.length && !S.corp.length && !S.other.length && !S.assets.rows.length)
    se.put(r,2,'No self-employment, other income or asset depletion entered.',S_TXT);
  sheets.push(se);

  /* ================= RENTAL ================= */
  const rn = XSheet('Rental');
  widths(rn, {1:2, 2:3, 3:3.5, 4:3, 5:44, 6:16, 7:16, 8:3, 9:14, 10:14});
  r = head(rn, `${S.agency==='FHA'?'FHA':S.agency==='VA'?'VA':'Conventional'} Rental Income Calculator`,
    'Schedule E cash flow with fair rental days, or the 75% lease rule, less the full PITIA.',
    {l:5, v:6, ve:7, rl:9, rv:10});
  rn.freeze = 5;
  if (!S.sche.length) rn.put(r,2,'No rental properties entered.',S_TXT);
  S.sche.forEach((p,i)=>{
    const cx = calcSchE(p), mo = scheMonths(p);
    rn.put(r,2,`Property ${i+1}`,S_BAND).merge(r,2,r,10).height(r,22); r += 2;
    rn.put(r,5,'Property Address:',S_LBLR).put(r,6, p.addr||'', S_TXTB).merge(r,6,r,10); r += 2;
    rn.put(r,3,`${i+1}.  Schedule E`,S_SECT); r++;
    const line = (n,label,v,ref)=>{ rn.put(r,5,`${n}.  ${label}`,S_ITEM2).put(r,9, ref||'', S_REF)
        .put(r,10, v, S_MONEY); r++; };
    if (p.method === 'sche'){
      line(1,'Rents Received', N(p.rents), 'Line 3');
      line(2,'Insurance', N(p.ins), 'Line 9');
      line(3,'Mortgage Interest', N(p.mortInt), 'Line 12');
      line(4,'Taxes', N(p.taxes), 'Line 16');
      line(5,'Depreciation Expense or Depletion', N(p.depr), 'Line 18');
      line(6,'Other — documented repairs and/or HOA', N(p.otherAdd), 'Line 14');
      line(7,'Sub-total of Expenses', N(p.totalExp), 'Line 20');
      rn.put(r,5,'Fair Rental Days',S_ITEM2).put(r,9,'Line 2',S_REF).put(r,10, N(p.fairDays), S_INT); r++;
      rn.put(r,5,'Personal Use Days',S_ITEM2).put(r,9,'Line 2',S_REF).put(r,10, N(p.personalDays), S_INT); r++;
      rn.put(r,5,'Months in Service',S_ITEM2).put(r,9,'days ÷ 365 × 12',S_REF).put(r,10, mo, S_NUM); r++;
    } else {
      line(1,'Gross Lease Rent', N(p.leaseRent), 'Lease');
      rn.put(r,5,'Vacancy Factor Applied',S_ITEM2).put(r,9,'Agency',S_REF).put(r,10, N(p.vacancy), S_NUM); r++;
      line(2,'Net Rent After Vacancy Factor', N(p.leaseRent)*N(p.vacancy)/100, '');
    }
    r++;
    rn.put(r,3,'B.  Current Property Expenses',S_SECT); r++;
    line(1,'Full PITIA on this property', N(p.pitia), '');
    r++;
    rn.put(r,5, cx.monthly>=0 ? 'Net Monthly Rental Income' : 'Net Monthly Rental LOSS — carried to liabilities',
      S_TOTLBL).merge(r,5,r,9).put(r,10, cx.monthly, S_TOT); r += 3;
  });
  sheets.push(rn);

  /* ================= INCOME SUMMARY ================= */
  const t = calcTotals();
  const sm = XSheet('Income Summary');
  widths(sm, {1:2.7, 2:24, 3:38, 4:42, 5:19, 6:19});
  r = head(sm, 'Qualifying Income Summary',
    'Every income source in this file, the method applied, and the monthly amount used.',
    {l:2, v:3, ve:3, rl:4, rv:5});
  sm.freeze = 5;
  ['Category','Source / Entity','Method / Basis','Monthly Qualifying Income'].forEach((h,i)=> sm.put(r,2+i,h,S_HEAD));
  sm.height(r,26); r++;
  summaryRows().forEach(x=>{
    sm.put(r,2,x[0],S_TXTB).put(r,3,x[1],S_TXTB).put(r,4,stripTags(x[2]),S_TXTB).put(r,5,round2(x[3]),S_MONEYB); r++; });
  sm.put(r,2,'TOTAL QUALIFYING MONTHLY INCOME',S_TOTLBL).merge(r,2,r,4).put(r,5, t.income, S_TOT); r += 2;

  sm.put(r,2,'Ratios',S_BAND2).merge(r,2,r,5).height(r,19); r++;
  [['Total Subject PITIA', t.pitia, S_MONEYB],
   ['Total Monthly Liabilities', t.debts, S_MONEYB],
   ['Front-End (Housing) DTI', t.front*100, S_PCT],
   ['Back-End (Total) DTI', t.back*100, S_PCT]].forEach(([l,v,st])=>{
    sm.put(r,2,l,S_LBL).merge(r,2,r,4).put(r,5, round2(v), st); r++; });
  sm.put(r,2,`Agency benchmark — ${S.agency}`,S_LBL).merge(r,2,r,4).put(r,5, DTI_MAX[S.agency].label, S_TXTB); r += 2;

  if (S.b2){
    sm.put(r,2,'By borrower',S_BAND2).merge(r,2,r,5).height(r,19); r++;
    sm.put(r,2, S.b1||'Borrower 1', S_LBL).merge(r,2,r,4).put(r,5, round2(t.b1), S_MONEYB); r++;
    sm.put(r,2, S.b2||'Borrower 2', S_LBL).merge(r,2,r,4).put(r,5, round2(t.b2), S_MONEYB); r += 2;
  }
  sm.put(r,2,'Underwriting findings',S_BAND2).merge(r,2,r,5).height(r,19); r++;
  sm.put(r,2,'Severity',S_HEAD).put(r,3,'Finding',S_HEAD).put(r,4,'Detail',S_HEAD).merge(r,4,r,5); r++;
  findings().forEach(x=>{ sm.put(r,2,x.k.toUpperCase(),S_TXTB).put(r,3,stripTags(x.t),S_TXTB)
      .put(r,4,stripTags(x.m),S_NOTE).merge(r,4,r,5).height(r,28); r++; });
  if (S.notes){ r++; sm.put(r,2,'UW Notes',S_LBL).put(r,3, S.notes, S_NOTE).merge(r,3,r,5).height(r,44); }
  sheets.unshift(sm);

  /* ================= LOAN / PITIA ================= */
  const ln = calcLoan();
  const ld = XSheet('Loan & PITIA');
  widths(ld, {1:2.7, 2:34, 3:22, 4:6, 5:30, 6:20});
  r = head(ld, 'Loan Setup, Mortgage Insurance & PITIA',
    'Subject property terms, MI calculation and the housing expense used in the ratios.',
    {l:2, v:3, ve:3, rl:5, rv:6});
  ld.freeze = 5;
  const kv = (c, label, v, st)=>{ ld.put(r, c, label, S_LBL).put(r, c+1, v, st||S_TXTB); };
  const rows = [
    ['Property address', S.loan.address, S_TXTB], ['Loan program', S.loan.program, S_TXTB],
    ['Transaction', S.loan.txn, S_TXTB], ['Occupancy', S.loan.occ, S_TXTB],
    ['Units', N(S.loan.units), S_INT], ['Representative FICO', N(S.loan.fico), S_INT],
    ['Purchase price / basis', N(S.loan.price), S_MONEY], ['Appraised value', ln.value, S_MONEY],
    ['Down payment', ln.dp, S_MONEY], ['Down payment %', round2(ln.dpPct), S_PCT],
    ['Base loan amount', ln.base, S_MONEYB], ['LTV', round2(ln.ltv*100), S_PCT],
    [ln.upfrontLabel||'Upfront fee', ln.upfront, S_MONEY], ['Financed into the loan', ln.financed, S_MONEY],
    ['Total loan amount', ln.totalLoan, S_MONEYB], ['Note rate %', N(S.loan.rate), S_PCT3],
    ['Term (years)', N(S.loan.term), S_INT], ['Annual MI rate %', round2(ln.annualRate*100), S_PCT],
    ['Monthly mortgage insurance', ln.miMonthly, S_MONEYB], ['MI duration', ln.miDrop, S_TXTB]
  ];
  rows.forEach(([l,v,st])=>{ kv(2,l,v,st); r++; });
  r++;
  ld.put(r,2,'Subject PITIA',S_BAND2).merge(r,2,r,3).height(r,19); r++;
  [['Principal & Interest', N(S.dti.pi)],['Property Taxes', N(S.dti.taxes)],['Hazard Insurance', N(S.dti.ins)],
   ['HOA Dues', N(S.dti.hoa)],['Mortgage Insurance', N(S.dti.mi)],['Other Housing', N(S.dti.otherHousing)]]
   .forEach(([l,v])=>{ ld.put(r,2,l,S_LBL).put(r,3, v, S_MONEY); r++; });
  ld.put(r,2,'TOTAL PITIA',S_TOTLBL).put(r,3, t.pitia, S_TOT); r += 2;
  ld.put(r,2,'Monthly Liabilities',S_BAND2).merge(r,2,r,3).height(r,19); r++;
  S.dti.debts.forEach(d=>{ ld.put(r,2, d.name||'Liability', S_LBL).put(r,3, N(d.amt), S_MONEY); r++; });
  if (t.rentNeg){ ld.put(r,2,'Negative rental cash flow',S_LBL).put(r,3, t.rentNeg, S_MONEY); r++; }
  ld.put(r,2,'TOTAL LIABILITIES',S_TOTLBL).put(r,3, t.debts, S_TOT);
  sheets.push(ld);

  /* ================= GUIDELINES ================= */
  const gk = activeGuideKeys();
  const gd = XSheet('Guidelines');
  widths(gd, {1:2.7, 2:30, 3:18, 4:20, 5:20, 6:20, 7:90});
  r = head(gd, 'Agency Guidelines In Play',
    'Selected automatically from the income types entered in this file.',
    {l:2, v:3, ve:3, rl:5, rv:6});
  gd.freeze = 5;
  ['Topic','Category','FNMA cite','FHLMC cite','FHA cite',`Requirement — ${S.agency}`]
    .forEach((h,i)=> gd.put(r,2+i,h,S_HEAD)); gd.height(r,26); r++;
  GUIDES.filter(g=>gk.has(g.key)).forEach(g=>{
    const ag = S.agency==='VA' ? 'FHA' : S.agency;
    gd.put(r,2,stripTags(g.title),S_TXTB).put(r,3,g.cat,S_TXTB)
      .put(r,4,g.cite.FNMA,S_TXTB).put(r,5,g.cite.FHLMC,S_TXTB).put(r,6,g.cite.FHA,S_TXTB)
      .put(r,7,stripTags(g[ag]),S_NOTE).height(r,42); r++; });
  sheets.push(gd);

  return {sheets, styles:St};
}

function exportWorkbook(){
  try{
    const {sheets, styles} = nmbBook();
    writeXLSX(sheets, styles, reportName('xlsx'));
    toast('Excel workbook exported in NMB worksheet format');
  }catch(err){
    console.error(err);
    toast('Workbook export failed: ' + err.message);
  }
}
