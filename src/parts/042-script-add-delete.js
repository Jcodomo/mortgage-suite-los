
/* ================== ADD / DELETE ================== */
function addW2(){ S.w2.push(newW2()); renderW2(); RECALC(); }
function addSchC(){ S.schc.push(newSchC()); renderSchC(); RECALC(); }
function addCorp(){ S.corp.push(newCorp()); renderCorp(); RECALC(); }
function addSchE(){ S.sche.push(newSchE()); renderSchE(); RECALC(); }
function addOther(){ S.other.push(newOther()); renderOther(); RECALC(); }
function del(list,id){
  S[list] = S[list].filter(r=>r.id!==id);
  ({w2:renderW2, schc:renderSchC, corp:renderCorp, sche:renderSchE, other:renderOther})[list]();
  RECALC();
}

/* ================== TABS ================== */
/* Tabs that were folded into another page keep working as aliases, so every
   existing switchTab('guide') / switchTab('paystub') call still lands somewhere. */
const TAB_ALIAS = {guide:'summary', paystub:'docs'};
function switchTab(t){
  const sub = t==='paystub' ? 'paystub' : null;
  t = TAB_ALIAS[t] || t;
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===t));
  const p=$('panel-'+t); if(p) p.classList.add('active');
  if (t==='summary'){ renderSummary(); renderGuides(); }
  if (t==='aus') renderAUS();
  if (t==='docs') subTab('docs', sub || currentSub('docs') || 'import');
  window.scrollTo({top:0,behavior:'smooth'});
}
const SUB = {docs:'import'};
const currentSub = tab => SUB[tab];
function subTab(tab, name){
  SUB[tab] = name;
  document.querySelectorAll(`#panel-${tab} .subpanel`).forEach(el=>
    el.classList.toggle('on', el.id === `subpanel-${tab}-${name}`));
  document.querySelectorAll(`#panel-${tab} .subtab`).forEach(el=>
    el.classList.toggle('on', el.id === `sub-${tab}-${name}`));
  if (tab==='docs' && name==='paystub') psResetDates();
}

/* ================== MASTER RECALC ================== */
let guideSig='';
function RECALC(){
  S.b1 = $('b1Name').value; S.b2 = $('b2Name').value; S.borrower = S.b1;
  S.file     = $('fileNumber').value;
  const requestedAgency = $('agency').value;
  if (requestedAgency === 'AUTO'){
    if (!S.agency || S.agency === 'AUTO') S.agency = 'FNMA';
    try { const best = agencyBest(); if (best && best.ag) S.agency = best.ag; } catch(e){}
  } else S.agency = requestedAgency;
  syncLoanToDTI();
  paintLoan(); paintW2(); paintCombine(); paintSchC(); paintCorp(); paintSchE(); paintOther(); paintAssets(); paintDTI();
  const t=calcTotals();
  setT('hdrIncome', money(t.income));
  setT('hdrFront', (t.front*100).toFixed(2)+'%');
  setT('hdrBack',  (t.back*100).toFixed(2)+'%');
  setT('progChip', ({FNMA:'FNMA 1084',FHLMC:'FHLMC 91',FHA:'FHA 4000.1',VA:'VA M26-7'})[S.agency]||S.agency);
  setT('hdrB1k', (S.b1 || 'Borrower 1').split(' ')[0].slice(0,12) || 'B1'); setT('hdrB1', money(t.b1));
  setT('hdrB2k', (S.b2 || 'Borrower 2').split(' ')[0].slice(0,12) || 'B2'); setT('hdrB2', money(t.b2));
  const showB2 = !!S.b2 || t.b2 > 0;
  if ($('hdrB2box')) $('hdrB2box').style.display = showB2 ? '' : 'none';
  document.querySelectorAll('.tab').forEach(b=>{
    const c = b.querySelector('.cnt');
    b.classList.toggle('empty-tab', !!c && c.textContent === '0');
  });
  scheduleAutosave();
  const sig = S.agency + '|' + [...activeGuideKeys()].sort().join(',');
  if (sig!==guideSig){ guideSig=sig; renderGuides(); }
  if ($('panel-summary').classList.contains('active')
      && document.activeElement && document.activeElement.id!=='uwNotes'
      && !document.querySelector('#summaryBody .gl-card.open')
      && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('.ck'))) renderSummary();
}

/* ================== SAVE / LOAD ================== */
function saveJSON(){
  const blob = new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  dl(blob, reportName('json'));
  toast('Loan file saved');
}
function loadJSON(ev){
  const f=ev.target.files[0]; if(!f) return;
  const rd=new FileReader();
  rd.onload = e => {
    try{
      const d=JSON.parse(e.target.result);
      Object.keys(S).forEach(k=>{ if(d[k]!==undefined) S[k]=d[k]; });
      normalise();
      $('b1Name').value=S.b1||''; $('b2Name').value=S.b2||'';
      $('fileNumber').value=S.file; $('agency').value=S.agency;
      if ($('autosaveTgl')) $('autosaveTgl').checked = !!(S.settings && S.settings.autosave);
      renderAll(); toast('Loan file loaded');
    }catch(err){ alert('Could not read that file: '+err.message); }
  };
  rd.readAsText(f); ev.target.value='';
}
function dl(blob,name){
  const a=document.createElement('a'); const u=URL.createObjectURL(blob);
  a.href=u; a.download=name; document.body.appendChild(a); a.click();
  setTimeout(()=>{URL.revokeObjectURL(u);a.remove();},400);
}

/* ================== EXPORTS ================== */
const round2 = v => Math.round((v||0)*100)/100;
const stripTags = s => String(s||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&frac12;/g,'.5').replace(/&divide;/g,'/').replace(/&nbsp;/g,' ');

