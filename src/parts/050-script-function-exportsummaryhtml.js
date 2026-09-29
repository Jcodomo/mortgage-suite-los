
function exportSummaryHTML(){
  renderSummary();
  const css = document.querySelector('style').textContent;
  const body = $('summaryBody').innerHTML.replace(/<textarea[^>]*>([\s\S]*?)<\/textarea>/,
    (m,c)=>`<div class="rule" style="white-space:pre-wrap;border-left:3px solid #0284c7;background:#f8fafc;padding:10px 14px">${c||'<i>No underwriter comments entered.</i>'}</div>`);
  const svg = document.querySelector('svg[style*="display:none"]').outerHTML;
  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>UW Income Summary — ${esc(S.borrower)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>${css}</style></head><body style="padding:26px;display:block">${svg}<div class="wrap">${body}</div></body></html>`;
  dl(new Blob([doc],{type:'text/html'}), reportName('html'));
  toast('Summary page exported');
}
function printSummary(){
  switchTab('summary');
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('print-me'));
  $('panel-summary').classList.add('print-me');
  setTimeout(()=>window.print(), 250);
}

/* ================== THEME ================== */
let THEME = 'light';
function applyTheme(t){
  THEME = (t==='dark') ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', THEME);

  const ic=$('themeIcon'); if(ic) ic.setAttribute('href', THEME==='dark' ? '#i-sun' : '#i-moon');

  try{ localStorage.setItem('uwTheme', THEME); }catch(e){}
}
function toggleTheme(){ applyTheme(THEME==='dark' ? 'light' : 'dark'); }
function initTheme(){
  let t=null;
  try{ t = localStorage.getItem('uwTheme'); }catch(e){}
  if(!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) t='dark';
  applyTheme(t||'light');
}

/* ================== CLEAR / RESET ================== */
function blankW2(){ return newW2(); }
function clearAll(){
  if (!confirm('Clear the entire file?\n\nEvery worksheet entry, figure, liability and note will be removed and reset to zero. This cannot be undone — save the file first if you need it.')) return;
  S.w2=[]; S.schc=[]; S.corp=[]; S.sche=[]; S.other=[];
  S.assets={ rows:[], fundsToClose:0, reserves:0, divisor:360, use:false };
  S.combine={ on:false, m:{base:'current',ot:'none',comm:'none',bonus:'none',other:'none',unre:'none'},
              c:{base:0,ot:0,comm:0,bonus:0,other:0,unre:0} };
  S.loan={ address:'', program:S.loan.program||'FHA', txn:'Purchase', occ:'Primary Residence', units:1, fico:680,
    price:0, value:0, dpMode:'pct', dpPct:0, dpAmt:0, baseOverride:0, rate:0, term:30,
    ufmipRate:1.75, financeUfmip:true, miOverride:0, vaFirstUse:true, vaExempt:false, limit:726200,
    taxAnnual:0, insAnnual:0, floodAnnual:0, hoaMonthly:0, sync:true };
  S.dti={ pi:0, taxes:0, ins:0, hoa:0, mi:0, otherHousing:0, debts:[] };
  S.notes='';
  S.borrower=''; S.file='';
  S.b1=''; S.b2=''; S.checklist={};
  $('b1Name').value=''; $('b2Name').value=''; $('fileNumber').value='';
  S.w2.push(blankW2());
  guideSig='';
  renderAll();
  switchTab('w2');
  toast('File cleared — all fields reset to zero');
}

/* ================== MORE MENU ================== */
function toggleMenu(ev){ ev.stopPropagation(); $('moreMenu').classList.toggle('on'); }
function closeMenu(){ const m=$('moreMenu'); if(m) m.classList.remove('on'); }
document.addEventListener('click', closeMenu);

/* ================== AUTOSAVE (opt-in, this browser only) ================== */
const AS_KEY = 'uwIncomeCalcAutosave';
let asTimer = null;
function setAutosave(on){
  S.settings.autosave = !!on;
  if (on){ writeAutosave(); toast('Autosave on — this file is kept in this browser'); }
  else { try{ localStorage.removeItem(AS_KEY); }catch(e){} toast('Autosave off — nothing kept in this browser'); }
}
function writeAutosave(){
  if (!S.settings || !S.settings.autosave) return;
  try{ localStorage.setItem(AS_KEY, JSON.stringify({at:new Date().toISOString(), data:S})); }catch(e){}
}
function scheduleAutosave(){
  if (!S.settings || !S.settings.autosave) return;
  clearTimeout(asTimer); asTimer = setTimeout(writeAutosave, 1200);
}
function restoreAutosave(){
  let raw=null; try{ raw = localStorage.getItem(AS_KEY); }catch(e){}
  if (!raw){ toast('No autosaved file found in this browser'); return; }
  try{
    const p = JSON.parse(raw);
    if (!confirm(`Restore the file autosaved on ${new Date(p.at).toLocaleString()}?\n\nAnything on screen now will be replaced.`)) return;
    Object.keys(S).forEach(k=>{ if(p.data[k]!==undefined) S[k]=p.data[k]; });
    normalise();
    $('b1Name').value=S.b1||''; $('b2Name').value=S.b2||'';
    $('fileNumber').value=S.file||''; $('agency').value=S.agency||'FNMA';
    if ($('autosaveTgl')) $('autosaveTgl').checked = !!S.settings.autosave;
    renderAll(); toast('Autosaved file restored');
  }catch(e){ toast('Could not read the autosaved file'); }
}
function initAutosave(){
  let raw=null; try{ raw = localStorage.getItem(AS_KEY); }catch(e){}
  if (!raw) return;
  try{
    const p = JSON.parse(raw);
    if (p && p.data && p.data.settings && p.data.settings.autosave){
      Object.keys(S).forEach(k=>{ if(p.data[k]!==undefined) S[k]=p.data[k]; });
      normalise();
      $('b1Name').value=S.b1||''; $('b2Name').value=S.b2||'';
      $('fileNumber').value=S.file||''; $('agency').value=S.agency||'FNMA';
      if ($('autosaveTgl')) $('autosaveTgl').checked = true;
      return true;
    }
  }catch(e){}
  return false;
}

/* ================== INIT ================== */
function renderAll(){
  renderAUS(); psResetDates(); renderW2(); renderSchC(); renderCorp(); renderSchE(); renderOther(); renderAssets(); renderDTI();
  RECALC(); renderGuides(); renderSummary();
}
/* The file opens empty: one blank W-2 worksheet, every dollar field at zero.
   Add rows on each tab as the loan requires. */
function seed(){
  S.w2.push(newW2());
}
initTheme();
const restored = initAutosave();
if (!restored) seed();
normalise();
renderAll();
if (restored) toast('Autosaved file restored from this browser');
