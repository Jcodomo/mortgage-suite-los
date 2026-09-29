
/* ==================================================================
   ENCOMPASS / URLA (1003) VIEW OF THE INCOME
   Renders the calculated income the way it lands on the Encompass
   1003 entry screens — Section 1a Personal Information, 1b Current
   Employment with the Gross Monthly Income grid, and 1e Income from
   Other Sources — so the figures can be keyed straight across.
   ================================================================== */

const ENC_LBL = {base:'Base', ot:'Overtime', bonus:'Bonus', comm:'Commission',
                 mil:'Military Entitlements', other:'Other'};

function encBox(txt, w){
  return `<span class="enc-box" style="${w?`width:${w}`:'flex:1'}">${txt||'&nbsp;'}</span>`;
}
function encChk(on, lbl){
  return `<span class="enc-chk"><i>${on?'&#10007;':'&nbsp;'}</i>${lbl}</span>`;
}
function encRow(pairs){
  return `<div class="enc-row">${pairs.map(p=>`<span class="enc-lbl">${p[0]}</span>${encBox(p[1], p[2])}`).join('')}</div>`;
}
function encGMI(rows, total, note){
  return `<table class="enc-gmi">
    <thead><tr><th colspan="2">Gross Monthly Income</th></tr></thead>
    <tbody>
      ${rows.map(r=>`<tr><td>${r[0]}</td><td class="n">$ ${r[1]?rMoney(r[1]).replace('$',''):'0.00'} /month</td></tr>`).join('')}
      <tr class="tot"><td><b>TOTAL</b></td><td class="n"><b>$ ${rMoney(total).replace('$','')} /month</b></td></tr>
    </tbody>
    ${note?`<tfoot><tr><td colspan="2" class="small">${note}</td></tr></tfoot>`:''}
  </table>`;
}

/* --- one 1b employment block per wage-earner record --- */
function encW2Block(j, idx){
  const r = calcW2(j);
  const fmtD = s => { const d=pDate(s); return d ? d.toLocaleDateString('en-US') : ''; };
  const who = j.b===2 ? (S.b2||'Borrower 2') : (S.b1||S.borrower||'Borrower 1');
  return `<div class="enc-block">
    <div class="enc-band">1b. Current Employment/Self-Employment and Income &nbsp;&nbsp;<span style="font-weight:600">
      Employment #${idx+1} &mdash; ${esc(who)}</span></div>
    <div class="enc-body">
      ${encRow([['Employer or Business Name', esc(j.employer)],['Phone','']])}
      ${encRow([['Street',''],['Unit #','','90px']])}
      ${encRow([['City',''],['State','','70px'],['ZIP','','80px']])}
      ${encRow([['Position or Title',''],['Start Date', fmtD(j.hireDate),'110px'],
                ['How long in this line of work?', r.monthsJob>=12?`${Math.floor(r.monthsJob/12)} yrs ${Math.round(r.monthsJob%12)} mos`:`${r.monthsJob.toFixed(0)} mos`,'150px']])}
      <div class="enc-row" style="gap:14px">
        ${encChk(false,'I am employed by a family member, property seller, real estate agent, or other party to the transaction.')}
        ${encChk(false,'I am the Business Owner or Self-Employed')}
      </div>
      ${encGMI([
        ['Base', r.parts.base],['Overtime', r.parts.ot],['Bonus', r.parts.bonus],
        ['Commission', r.parts.comm],['Military Entitlements', 0],['Other', r.parts.other]
      ], r.total,
      `Method used &mdash; ${Object.keys(j.m).filter(k=>j.m[k]!=='none')
        .map(k=>`${ENC_LBL[k]||k}: ${M_NAME[j.m[k]]}`).join(' &nbsp;|&nbsp; ') || 'not selected'}
       &nbsp;&middot;&nbsp; YTD through ${fmtD(j.ytdThru)} over ${r.mo.toFixed(2)} months elapsed.`)}
    </div></div>`;
}

/* --- self-employment blocks (Schedule C and entity returns) --- */
function encSEBlock(name, share, monthly, form, note, who){
  return `<div class="enc-block">
    <div class="enc-band">1b. Current Employment/Self-Employment and Income &nbsp;&nbsp;<span style="font-weight:600">
      Self-Employed &mdash; ${esc(who||S.b1||'Borrower 1')}</span></div>
    <div class="enc-body">
      ${encRow([['Employer or Business Name', esc(name)],['Phone','']])}
      ${encRow([['Position or Title','Owner'],['Ownership Share', share!=null?share.toFixed(2)+' %':'','120px'],
                ['Business Type', form,'130px']])}
      <div class="enc-row" style="gap:14px">
        ${encChk(false,'I am employed by a family member, property seller, real estate agent, or other party to the transaction.')}
        ${encChk(true,'I am the Business Owner or Self-Employed')}
        <span class="enc-lbl" style="margin-left:6px">I have an ownership share of</span>
        ${encChk(share!=null && share<25,'Less than 25%')}${encChk(share!=null && share>=25,'25% or more')}
      </div>
      ${encGMI([['Monthly Income (or Loss)', monthly]], monthly, note)}
    </div></div>`;
}

function encEmploymentBlocks(){
  const out = [];
  S.w2.forEach((j,i)=>{ if (rptOn('w2:'+j.id) && ON(j)) out.push(encW2Block(j,i)); });
  S.schc.forEach(b=>{ if (!rptOn('schc:'+b.id) || !ON(b)) return;
    const r = calcSchC(b);
    out.push(encSEBlock(b.name || 'Sole Proprietorship', 100, r.monthly, 'Sole Proprietorship (Schedule C)',
      `Form 1084 Schedule Analysis Method &mdash; ${r.methodUsed}.`, b.b===2?S.b2:S.b1));
  });
  S.corp.forEach(e=>{ if (!rptOn('corp:'+e.id) || !ON(e)) return;
    const r = calcCorp(e);
    const t = {'1065':'Partnership (Form 1065)','1120S':'S Corporation (Form 1120-S)','1120':'Corporation (Form 1120)'}[e.form] || e.form;
    out.push(encSEBlock(e.name || t, N(e.own), r.monthly, t,
      `Pass-through income at ${N(e.own).toFixed(2)}% ownership &mdash; ${r.methodUsed}.`, e.b===2?S.b2:S.b1));
  });
  return out;
}

/* --- 1e. Income from Other Sources --- */
function encOtherRows(){
  const rows = [];
  S.sche.forEach((p,i)=>{ if (!rptOn('sche:'+p.id) || !ON(p)) return;
    const m = calcSchE(p).monthly;
    rows.push([m>=0?'Net Rental Income':'Net Rental Loss', esc(p.addr)||`Rental property #${i+1}`, m]); });
  S.other.forEach((o,i)=>{ if (!rptOn('other:'+o.id) || !ON(o)) return;
    const t = OTHER_TYPES.find(x=>x.v===o.type);
    const r = calcOther(o);
    rows.push([t?t.t:'Other', (esc(o.desc)||'') + (o.nonTax?` — non-taxable, grossed up ${N(o.grossUp)}%`:''), r.total]); });
  if (rptOn('assets') && S.assets.use){
    const a = calcAssets();
    rows.push(['Employment-Related Assets', `Liquid assets over ${a.div} months`, a.monthly]);
  }
  return rows;
}
function encOtherBlock(){
  const rows = encOtherRows();
  const tot = rows.reduce((s,r)=>s+r[2],0);
  return `<div class="enc-block">
    <div class="enc-band">1e. Income from Other Sources</div>
    <div class="enc-body">
      <div class="enc-row" style="gap:14px">${encChk(!rows.length,'I do not have additional income')}</div>
      <table class="enc-gmi wide">
        <thead><tr><th style="width:34%">Income Source</th><th>Description / Notes</th><th class="n" style="width:24%">Monthly Income</th></tr></thead>
        <tbody>
          ${rows.length ? rows.map(r=>`<tr><td>${r[0]}</td><td class="small">${r[1]}</td>
              <td class="n">$ ${rMoney(r[2]).replace('$','')}</td></tr>`).join('')
            : `<tr><td>&nbsp;</td><td></td><td class="n">$ 0.00</td></tr>
               <tr><td>&nbsp;</td><td></td><td class="n">$ 0.00</td></tr>`}
          <tr class="tot"><td colspan="2"><b>Provide TOTAL Amount Here</b></td>
            <td class="n"><b>$ ${rMoney(tot).replace('$','')}</b></td></tr>
        </tbody></table>
    </div></div>`;
}

/* --- Encompass pages --- */
function encPage1(){
  const t = reportTotals();
  const b2 = (S.b2||'').trim();
  const blocks = encEmploymentBlocks();
  return `${rptHead('Uniform Residential Loan Application &mdash; Encompass View',
      'Section 1: Borrower Information &mdash; how the calculated income is keyed on the 1003')}
    <div class="enc-block">
      <div class="enc-band">1a. Personal Information</div>
      <div class="enc-body">
        ${encRow([['Name (First, Middle, Last, Suffix)', esc(S.b1||S.borrower)]])}
        ${encRow([['Alternate Names',''],['Social Security Number','___ &ndash; __ &ndash; ____','150px'],
                  ['Date of Birth (mm/dd/yyyy)','','130px']])}
        <div class="enc-row" style="gap:14px">
          <span class="enc-lbl">Citizenship</span>
          ${encChk(false,'U.S. Citizen')}${encChk(false,'Permanent Resident Alien')}${encChk(false,'Non-Permanent Resident Alien')}
        </div>
        <div class="enc-row" style="gap:14px">
          <span class="enc-lbl">Type of Credit</span>
          ${encChk(!b2,'I am applying for individual credit')}
          ${encChk(!!b2,'I am applying for joint credit')}
          <span class="enc-lbl">Total Number of Borrowers</span>${encBox(b2?'2':'1','50px')}
        </div>
        ${encRow([['List Name(s) of Other Borrower(s)', esc(b2)]])}
        <div class="enc-row" style="gap:14px">
          <span class="enc-lbl">Marital Status</span>
          ${encChk(false,'Married')}${encChk(false,'Separated')}${encChk(false,'Unmarried')}
          <span class="enc-lbl">Dependents &mdash; Number</span>${encBox('','50px')}
          <span class="enc-lbl">Ages</span>${encBox('','90px')}
        </div>
        ${encRow([['Home Phone',''],['Cell Phone',''],['Work Phone',''],['Email','']])}
        ${encRow([['Current Address &mdash; Street', esc(S.loan && S.loan.address ? S.loan.address : '')],['Unit #','','80px']])}
        ${encRow([['City',''],['State','','70px'],['ZIP','','80px'],['Country','','90px'],
                  ['How Long at Current Address?','','130px']])}
        <div class="enc-row" style="gap:14px">
          <span class="enc-lbl">Housing</span>${encChk(false,'No primary housing expense')}${encChk(false,'Own')}${encChk(false,'Rent ($______/month)')}
        </div>
      </div>
    </div>
    ${blocks.length ? blocks[0] : `<div class="enc-block"><div class="enc-band">1b. Current Employment/Self-Employment and Income</div>
      <div class="enc-body"><div class="small" style="padding:8px 2px">No employment income selected for this report.</div></div></div>`}
    ${blocks.length > 1 ? `<div class="small" style="margin-top:6px"><b>${blocks.length-1}</b> additional employment
      record${blocks.length>2?'s':''} continue on the next page.</div>` : ''}`;
}

function encPage2(){
  const blocks = encEmploymentBlocks().slice(1);
  const t = reportTotals();
  const rows = encOtherRows();
  const empTotal = (()=>{ let x=0;
    const selW2 = S.w2.filter(j=>rptOn('w2:'+j.id) && ON(j));
    if (combineActive() && selW2.length>1) x += calcCombined(selW2).total;
    else selW2.forEach(j=> x += calcW2(j).total);
    S.schc.forEach(b=>{ if(rptOn('schc:'+b.id)&&ON(b)) x += calcSchC(b).monthly; });
    S.corp.forEach(e=>{ if(rptOn('corp:'+e.id)&&ON(e)) x += calcCorp(e).monthly; });
    return x; })();
  const otherTotal = rows.reduce((s,r)=>s+r[2],0);
  return `${rptHead('Uniform Residential Loan Application &mdash; Encompass View',
      'Section 1 continued &mdash; additional employment and income from other sources')}
    ${blocks.join('')}
    <div class="enc-block">
      <div class="enc-band">1d. Previous Employment/Self-Employment and Income</div>
      <div class="enc-body">
        <div class="enc-row" style="gap:14px">${encChk(false,'Does not apply')}</div>
        ${encRow([['Employer or Business Name',''],['Previous Gross Monthly Income','$ ________ /month','200px']])}
        ${encRow([['Start Date','','110px'],['End Date','','110px'],['Position or Title','']])}
        <div class="small" style="padding:2px">Complete for any current position held under two years. Not calculated in this worksheet.</div>
      </div>
    </div>
    ${encOtherBlock()}
    <div class="enc-block">
      <div class="enc-band dark">Encompass Income Recap</div>
      <div class="enc-body">
        <table class="enc-gmi wide">
          <tbody>
            <tr><td style="width:60%">Total Employment &amp; Self-Employment Income (Section 1b)</td>
              <td class="n">$ ${rMoney(empTotal).replace('$','')} /month</td></tr>
            <tr><td>Total Income from Other Sources (Section 1e)</td>
              <td class="n">$ ${rMoney(otherTotal).replace('$','')} /month</td></tr>
            <tr class="tot"><td><b>Total Qualifying Monthly Income</b></td>
              <td class="n"><b>$ ${rMoney(t.income).replace('$','')} /month</b></td></tr>
          </tbody></table>
        <div class="small" style="margin-top:6px">
          Rental losses and any negative cash flow are carried as a liability in Section 2c rather than reducing
          income here &mdash; this file shows ${rMoney(t.rentNeg)} of negative rental carried to liabilities.
          Housing expense ${rMoney(t.pitia)} &middot; front-end ${(t.front*100).toFixed(2)}% &middot;
          back-end ${(t.back*100).toFixed(2)}% under ${S.agency}.
        </div>
      </div>
    </div>`;
}
