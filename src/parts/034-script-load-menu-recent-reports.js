
/* ================== LOAD MENU + RECENT REPORTS ================== */
const RPT_BLOBS = {};                       /* generated this session, kept for a one-click re-download */
function noteReport(name, kind, blob){
  if (blob) RPT_BLOBS[name] = blob;
  S.reports = (S.reports || []).filter(r=>r.name !== name);
  S.reports.unshift({name, kind, at:new Date().toISOString()});
  S.reports = S.reports.slice(0,5);
  scheduleAutosave();
}
function toggleLoadMenu(ev){
  ev.stopPropagation(); closeMenu();
  const m = $('loadMenu');
  setH('loadMenuBody', loadMenuHTML());
  m.classList.toggle('on');
}
function closeLoadMenu(){ const m=$('loadMenu'); if(m) m.classList.remove('on'); }
function loadMenuHTML(){
  const list = S.reports || [];
  return `
    <button onclick="closeLoadMenu();document.getElementById('loadFile').click()">
      <svg class="icon"><use href="#i-doc"/></svg>Load income file (.json)</button>
    <button onclick="closeLoadMenu();switchTab('docs');document.getElementById('docFile').click()">
      <svg class="icon"><use href="#i-scan"/></svg>Load document for OCR…</button>
    <button onclick="closeLoadMenu();openExtract()">
      <svg class="icon"><use href="#i-magic"/></svg>Paste an AI document extraction…</button>
    <button onclick="closeLoadMenu();importReno()">
      <svg class="icon"><use href="#i-up"/></svg>Load from Renovation Suite</button>
    <div class="sep"></div>
    <div class="ck-grp" style="padding:0 10px">Recent income reports</div>
    ${list.length ? list.map((r,i)=>`
      <button onclick="closeLoadMenu();openRecent(${i})" title="${esc(r.name)}">
        <svg class="icon"><use href="#i-${r.kind==='jpg'?'sheet':'doc'}"/></svg>
        <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.name)}</span>
        <span class="muted small">${new Date(r.at).toLocaleDateString()}${RPT_BLOBS[r.name]?'':' · rebuild'}</span>
      </button>`).join('')
      : '<div class="muted small" style="padding:4px 10px 8px">None yet — build one from the Income Report button.</div>'}`;
}
function openRecent(i){
  const r = (S.reports||[])[i]; if(!r) return;
  const b = RPT_BLOBS[r.name];
  if (b){ dl(b, r.name); toast('Re-downloaded ' + r.name); return; }
  if (confirm(`"${r.name}" was built in an earlier session, so the file itself is not held in the browser.\n\nOpen the report builder and rebuild it now?`)) openReport();
}
document.addEventListener('click', closeLoadMenu);

/* ================== AGENCY COMPARISON ================== */
const AG_LIST = ['FNMA','FHLMC','FHA','VA'];
const GROSSUP_CAP = {FNMA:25, FHLMC:25, FHA:15, VA:25};
function agencySnapshot(ag){
  const prev = S.agency;
  S.agency = ag;                       /* calcCorp reads S.agency for the government rule */
  const notes = [];
  const useW2 = S.w2.filter(ON);
  const w2 = (combineActive() && useW2.length>1) ? calcCombined(useW2).total
                                                 : useW2.reduce((n,j)=>n+calcW2(j).total,0);
  const sc = S.schc.filter(ON).reduce((n,b)=>n+calcSchC(b).monthly,0);
  const co = S.corp.filter(ON).reduce((n,e)=>n+calcCorp(e).monthly,0);
  let rentPos=0, rentNeg=0;
  S.sche.filter(ON).forEach(p=>{ const m=calcSchE(p).monthly; if(m>=0) rentPos+=m; else rentNeg+=Math.abs(m); });
  const cap = GROSSUP_CAP[ag];
  let ot = 0, capped = false;
  S.other.filter(ON).forEach(o=>{
    const g = o.nonTax ? Math.min(N(o.grossUp), cap) : 0;
    if (o.nonTax && N(o.grossUp) > cap) capped = true;
    ot += N(o.amt) * (1 + g/100);
  });
  if (capped) notes.push(`Non-taxable gross-up limited to ${cap}%`);
  let ad = calcAssets().monthly;
  if ((ag==='FHA' || ag==='VA') && ad > 0){ notes.push('Asset depletion not permitted — excluded'); ad = 0; }
  if ((ag==='FHA' || ag==='VA') && S.corp.filter(ON).length) notes.push('K-1 ordinary income used without the distribution cap');
  const income = w2+sc+co+rentPos+ot+ad;
  const pitia = N(S.dti.pi)+N(S.dti.taxes)+N(S.dti.ins)+N(S.dti.hoa)+N(S.dti.mi)+N(S.dti.otherHousing);
  const debts = S.dti.debts.reduce((n,d)=>n+N(d.amt),0) + rentNeg;
  const front = income ? pitia/income : 0, back = income ? (pitia+debts)/income : 0;
  const mx = DTI_MAX[ag];
  S.agency = prev;
  return {ag, income, pitia, debts, front, back, mx, notes,
          passes: !income ? null : (back <= mx.b && (!mx.f || front <= mx.f))};
}
function agencyBest(){
  const rows = AG_LIST.map(agencySnapshot);
  const ok = rows.filter(r=>r.passes !== false);
  const pool = ok.length ? ok : rows;
  return pool.reduce((a,b)=> b.income > a.income + 0.01 ? b : a, pool[0]);
}
function useAgency(ag){ S.agency = ag; $('agency').value = ag; renderAll(); toast(`Switched to ${AG_NAME[ag]}`); }
function autoAgency(){
  const best = agencyBest();
  if (best.ag === S.agency){ toast(`${AG_NAME[S.agency]} already gives the strongest result`); return; }
  useAgency(best.ag);
}
function agencyCompareHTML(){
  const rows = AG_LIST.map(agencySnapshot), best = agencyBest();
  const cur = rows.find(r=>r.ag===S.agency) || rows[0];
  const gain = best.income - cur.income;
  return `
    <div class="tbl-scroll"><table class="cmp">
      <thead><tr><th>Agency</th><th class="num">Qualifying income</th><th class="num">Front</th><th class="num">Back</th>
        <th>Benchmark</th><th>Treatment differences</th><th></th></tr></thead>
      <tbody>${rows.map(r=>`<tr ${r.ag===S.agency?'style="background:var(--accent-soft)"':''}>
        <td><b>${AG_NAME[r.ag]}</b>${r.ag===S.agency?' <span class="chip-st info">in use</span>':''}
            ${r.ag===best.ag&&best.ag!==S.agency?' <span class="chip-st ok">best</span>':''}</td>
        <td class="num"><b>${money(r.income)}</b></td>
        <td class="num">${(r.front*100).toFixed(2)}%</td>
        <td class="num ${r.passes===false?'':''}">${(r.back*100).toFixed(2)}%
          ${r.passes===null?'':r.passes?' <span class="chip-st ok">ok</span>':' <span class="chip-st bad">over</span>'}</td>
        <td class="small">${r.mx.label}</td>
        <td class="small">${r.notes.length?r.notes.join('; '):'No change from the figures on screen'}</td>
        <td>${r.ag===S.agency?'':`<button class="btn-link no-print" onclick="useAgency('${r.ag}')">Use</button>`}</td>
      </tr>`).join('')}</tbody></table></div>
    <div class="notice ${gain>1?'good':'info'}" style="margin-top:9px"><svg class="icon"><use href="#i-alert"/></svg>
      <span>${gain > 1
        ? `<b>${AG_NAME[best.ag]}</b> produces <b>${money(gain)}/mo</b> more qualifying income than ${AG_NAME[S.agency]} on this file${best.passes===false?' — but the back-end ratio still exceeds its benchmark':''}.
           <button class="btn-link no-print" style="margin-left:6px" onclick="useAgency('${best.ag}')">Switch to ${AG_NAME[best.ag]}</button>`
        : `<b>${AG_NAME[S.agency]}</b> is the strongest fit for this income — no other agency treats it materially better.`}
      </span></div>`;
}
