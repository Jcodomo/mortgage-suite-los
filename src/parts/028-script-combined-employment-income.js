
/* ==================================================================
   COMBINED EMPLOYMENT INCOME
   Aggregates every W-2 job into one set of year columns. Each job's
   own elapsed YTD period is respected: the monthly averages are
   computed per job and then summed, rather than pooling raw dollars
   against a single divisor.
   ================================================================== */
const CBASE_ONLY = ['base'];
const CVARIABLE  = ['ot','comm','bonus','other'];
function calcCombined(jobs){
  const J = (jobs && jobs.length ? jobs : S.w2);
  const K = ['base','ot','comm','bonus','other'];
  const comp = {}; K.forEach(k=> comp[k] = {y1:0,y2:0,y3:0,ytd:0,a12:0,a24:0} );
  let currentBase = 0, perJob = 0, maxYr = 0, moMax = 0, hasVar = false;
  J.forEach(j=>{
    const r = calcW2(j);
    currentBase += r.monthlyBase; perJob += r.total;
    maxYr = Math.max(maxYr, r.yr1); moMax = Math.max(moMax, r.mo);
    if (r.hasVariable) hasVar = true;
    K.forEach(k=>{
      comp[k].y1 += N(j.y1[k]); comp[k].y2 += N(j.y2[k]); comp[k].y3 += N(j.y3[k]);
      comp[k].ytd += r.comp[k].ytd; comp[k].a12 += r.comp[k].a12; comp[k].a24 += r.comp[k].a24;
    });
  });
  K.forEach(k=>{
    const c = comp[k], m1 = c.ytd, m2 = c.y2/12, m3 = c.y3/12;
    c.rec = (m1<=m2 || !c.y2) ? 'ytd' : (m2<=m3 ? 'ytd12' : 'ytd24');
    if (k==='base') c.rec = (c.ytd >= currentBase) ? 'current' : c.rec;
    if (k!=='base' && !c.y1 && !c.y2 && !c.y3) c.rec = 'none';
  });
  const t1 = comp.base.y1+comp.ot.y1+comp.comm.y1+comp.bonus.y1+comp.other.y1;
  const t2 = comp.base.y2+comp.ot.y2+comp.comm.y2+comp.bonus.y2+comp.other.y2;
  const t3 = comp.base.y3+comp.ot.y3+comp.comm.y3+comp.bonus.y3+comp.other.y3;
  const val = k => { const m = S.combine.m[k], c = comp[k];
    if (m==='none') return 0;
    if (m==='current') return k==='base' ? currentBase : 0;
    if (m==='ytd')   return c.ytd;
    if (m==='ytd12') return c.a12;
    if (m==='ytd24') return c.a24;
    if (m==='custom')return N(S.combine.c[k]);
    return 0; };
  const parts = {}; K.forEach(k=> parts[k] = val(k) );
  const total = parts.base+parts.ot+parts.comm+parts.bonus+parts.other;
  return {comp, currentBase, parts, total, perJob, t1, t2, t3, yr:maxYr||new Date().getFullYear(),
          mo:moMax, jobs:J, hasVar};
}
const combineActive = () => S.combine.on && S.w2.filter(r=>r.use!==false).length > 1;

function renderCombine(){
  const n = S.w2.length;
  if (!n){ $('combineBox').innerHTML = ''; return; }
  const on = S.combine.on;
  const CN = [{k:'base',label:'Base Pay',first:'Current Base (sum of each job)'},
              {k:'ot',label:'Overtime Pay',first:'Not used'},
              {k:'comm',label:'Commissions',first:'Not used'},
              {k:'bonus',label:'Bonuses',first:'Not used'},
              {k:'other',label:'Other Income',first:'Not used'}];
  const box = c => {
    const canOverride = CVARIABLE.includes(c.k);
    const opts = [['first',c.first],['ytd','YTD avg'],['ytd12','+ Prev yr'],['ytd24','+ 2 yrs']];
    return `<div class="method-box">
      <div class="method-top">
        <span class="method-name">${c.label}<span class="tag slate" id="cmb-${c.k}-recchip" style="font-size:9px">—</span>
        ${canOverride?'':'<span class="tag" style="font-size:9px">Calculated — no override</span>'}</span>
        <span class="method-amt" id="cmb-${c.k}-amt">$0.00 / month</span>
      </div>
      <div class="opts">
        ${opts.map(([v,lbl])=>{ const val = v==='first' ? (c.k==='base'?'current':'none') : v;
          return `<label class="opt" id="cmb-${c.k}-opt-${val}">
            <input type="radio" name="cmb-${c.k}" value="${val}" ${S.combine.m[c.k]===val?'checked':''}
              onchange="S.combine.m['${c.k}']='${val}';RECALC()">
            <span><span class="ol">${lbl}<span class="rec" id="cmb-${c.k}-rec-${val}" style="display:none">REC</span></span>
            <span class="ov" id="cmb-${c.k}-v-${val}">$0.00</span></span></label>`;}).join('')}
        <label class="opt ${canOverride?'':'muted'}" id="cmb-${c.k}-opt-custom" ${canOverride?'':'style="opacity:.5;cursor:not-allowed"'}>
          <input type="radio" name="cmb-${c.k}" value="custom" ${canOverride?'':'disabled'}
            ${S.combine.m[c.k]==='custom'?'checked':''} onchange="S.combine.m['${c.k}']='custom';RECALC()">
          <span style="flex:1"><span class="ol">Custom Override${canOverride?'':' (variable income only)'}</span>
          <input class="cell-input" style="margin-top:3px;padding:3px 6px;font-size:11px" type="number" step="0.01"
            ${canOverride?'':'disabled'} value="${N(S.combine.c[c.k])}"
            oninput="S.combine.c['${c.k}']=N(this.value);RECALC()"
            onfocus="S.combine.m['${c.k}']='custom';RECALC()"></span></label>
      </div>
    </div>`;
  };
  const row = (k,label)=>`<tr>
      <td class="rowlabel">${label}</td>
      <td class="num"><span class="calc-cell" id="cmb-${k}-y1">$0.00</span></td>
      <td class="num"><span class="calc-cell" id="cmb-${k}-y2">$0.00</span></td>
      <td class="num"><span class="calc-cell" id="cmb-${k}-y3">$0.00</span></td>
      <td class="num"><span class="calc-cell" id="cmb-${k}-a12">$0.00</span></td>
      <td class="num"><span class="calc-cell" id="cmb-${k}-a24">$0.00</span></td></tr>`;

  $('combineBox').innerHTML = `
  <div class="card">
    <div class="card-top">
      <span class="tag ${on?'green':'slate'}">${on?'Combined — in use':'Combined'}</span>
      <span class="doc-name">Combined Employment Income &mdash; All Jobs</span>
      <span class="muted small" id="cmb-headline">—</span>
      <div class="spacer"></div>
      <button class="btn ${on?'':'btn-add'} ${on?'btn-light':''} no-print" ${n<2?'disabled style="opacity:.5;cursor:not-allowed"':''}
        onclick="toggleCombine()" title="${n<2?'Add a second employment to combine':'Aggregate every job into one calculation'}">
        <svg class="icon"><use href="#i-magic"/></svg>${on?'Use each job separately':'Combine jobs & expand'}</button>
    </div>
    <div class="block ${on?'':'collapsed'}" style="margin:0;border:none;border-radius:0" id="cmbBlock">
      <div class="block-head" onclick="this.parentNode.classList.toggle('collapsed')">
        <h3><svg class="icon"><use href="#i-grid"/></svg>Aggregated Earnings &mdash; Current Year, Prior Year, Two Years Prior</h3>
        <span class="hint"><span id="cmb-hint"></span>&nbsp;<svg class="icon chev" style="vertical-align:-3px"><use href="#i-chev"/></svg></span>
      </div>
      <div class="block-body">
        ${n<2 ? '<div class="notice info"><svg class="icon"><use href="#i-alert"/></svg><span>Only one employment is on file — the combined view mirrors that job. Add a second job to aggregate.</span></div>' : ''}
        <div class="notice info"><svg class="icon"><use href="#i-alert"/></svg>
          <span>Each job keeps its own year-to-date period. Monthly averages are worked out job by job and then added
          together, so employments with different paystub dates still aggregate correctly. Only variable income &mdash;
          overtime, commission, bonus and other &mdash; can be overridden here; base pay comes from
          each job's own base calculation.</span></div>
        <div class="tbl-scroll"><table class="matrix">
          <thead><tr><th>Income Category</th>
            <th class="num" id="cmb-h1">YTD (Year 1)</th><th class="num" id="cmb-h2">Prior Year</th>
            <th class="num" id="cmb-h3">2 Years Prior</th>
            <th class="num">YTD + Prev Yr Avg</th><th class="num">YTD + Last 2 Yrs Avg</th></tr></thead>
          <tbody>
            ${row('base','Base Earnings')}${row('ot','Overtime Pay')}${row('comm','Commissions')}
            ${row('bonus','Bonuses')}${row('other','Other Income')}
            <tr class="total-row"><td class="rowlabel">Total Earnings — All Jobs</td>
              <td class="num" id="cmb-t1">$0.00</td><td class="num" id="cmb-t2">$0.00</td>
              <td class="num" id="cmb-t3">$0.00</td><td class="num" id="cmb-ta12">$0.00</td>
              <td class="num" id="cmb-ta24">$0.00</td></tr>
            <tr class="meta-row"><td class="rowlabel">Jobs included</td>
              <td colspan="5" id="cmb-jobs">—</td></tr>
          </tbody></table></div>

        <div style="margin-top:14px">${CN.map(box).join('')}</div>
        <div class="total-bar">
          <span class="lbl">Total Combined Qualifying Monthly W-2 Income:</span>
          <span class="amt" id="cmb-total">$0.00 / month</span>
        </div>
        <div class="small muted" style="text-align:right;margin-top:4px" id="cmb-compare">—</div>
      </div>
    </div>
  </div>`;
}
function toggleCombine(){
  S.combine.on = !S.combine.on;
  if (S.combine.on){
    const r = calcCombined();
    Object.keys(S.combine.m).forEach(k=> S.combine.m[k] = r.comp[k].rec );
  }
  renderCombine(); RECALC();
  toast(S.combine.on ? 'Jobs combined — the summary now uses the aggregated calculation'
                     : 'Back to per-job calculations');
}
function paintCombine(){
  if (!S.w2.length || !$('cmb-total')) return;
  const r = calcCombined();
  setT('cmb-h1', `YTD ${r.yr} (Year 1)`); setT('cmb-h2', `Prior Year ${r.yr-1}`); setT('cmb-h3', `2 Years Prior ${r.yr-2}`);
  ['base','ot','comm','bonus','other'].forEach(k=>{
    const c = r.comp[k];
    setT(`cmb-${k}-y1`, money(c.y1)); setT(`cmb-${k}-y2`, money(c.y2)); setT(`cmb-${k}-y3`, money(c.y3));
    setT(`cmb-${k}-a12`, money(c.a12)); setT(`cmb-${k}-a24`, money(c.a24));
    const vals = {current:(k==='base'?r.currentBase:0), none:0, ytd:c.ytd, ytd12:c.a12, ytd24:c.a24,
                  custom:N(S.combine.c[k])};
    Object.keys(vals).forEach(v=> setT(`cmb-${k}-v-${v}`, money(vals[v])) );
    ['current','none','ytd','ytd12','ytd24','custom'].forEach(v=>{
      const o=$(`cmb-${k}-opt-${v}`); if(o) o.classList.toggle('sel', S.combine.m[k]===v);
      const rc=$(`cmb-${k}-rec-${v}`); if(rc) rc.style.display = (c.rec===v?'inline-block':'none');
    });
    const chip=$(`cmb-${k}-recchip`);
    if(chip){ const lbl={current:'Current base',none:'Not used',ytd:'YTD avg',ytd12:'+ Prev yr',ytd24:'+ 2 yrs'}[c.rec]||'—';
      chip.textContent='Rec: '+lbl; chip.className='tag '+(S.combine.m[k]===c.rec?'green':'amber'); }
    setT(`cmb-${k}-amt`, money(r.parts[k]) + ' / month');
  });
  setT('cmb-t1', money(r.t1)); setT('cmb-t2', money(r.t2)); setT('cmb-t3', money(r.t3));
  setT('cmb-ta12', money(r.comp.base.a12+r.comp.ot.a12+r.comp.comm.a12+r.comp.bonus.a12+r.comp.other.a12));
  setT('cmb-ta24', money(r.comp.base.a24+r.comp.ot.a24+r.comp.comm.a24+r.comp.bonus.a24+r.comp.other.a24));
  setT('cmb-jobs', S.w2.map((j,i)=> (j.employer||`Job #${i+1}`)).join('  ·  ') || '—');
  setT('cmb-total', money(r.total) + ' / month');
  setT('cmb-headline', `${S.w2.length} job${S.w2.length===1?'':'s'} · combined ${money(r.total)}/mo`);
  setT('cmb-compare', `Sum of the individual job calculations: ${money(r.perJob)} / month`
       + (combineActive() ? '  —  the combined figure above is the one being used.' : '  —  the per-job figures are the ones being used.'));
  setH('cmb-hint', combineActive()
    ? '<span style="color:var(--n-good-tx);background:var(--n-good-bg);border:1px solid var(--n-good-bd);padding:2px 7px;border-radius:5px">In use for qualifying</span>'
    : '<span class="muted">Reference only until you press Combine</span>');
}
