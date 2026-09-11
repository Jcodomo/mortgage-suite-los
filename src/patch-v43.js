/* =====================================================================
   Release 43 — every page back in its group, the menus reorganised in
   the File-actions card style, Live wired to the live comparison, and
   a rail twice as long.
   Additive over 42.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function G(n){ try { return (0, eval)(n); } catch(e){ return undefined; } }
function N(v){ v = parseFloat(String(v==null?'':v).replace(/[$,%\s]/g,'')); return isFinite(v)?v:0; }
function norm(s){ return String(s||'').replace(/\s+/g,' ').trim(); }
function key(s){ return norm(s).toUpperCase(); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function usd(v,dp){ dp=dp===undefined?0:dp; var n=N(v);
  return (n<0?'\u2212':'')+'$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp}); }
function pct(v,dp){ dp=dp===undefined?2:dp; var n=N(v); if (Math.abs(n)<=1) n*=100; return n.toFixed(dp)+'%'; }
function get(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
function setClass(el,c,on){ if (el && el.classList.contains(c)!==!!on) el.classList.toggle(c,!!on); }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }
function store(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
var V43 = window.V43 = { version:'43.0' };

/* =================================================================== 1
   EVERY PAGE HAS A HOME

     File          Quote · Setup · Property
     Loan          Renovation · Max mortgage · Mortgage rates
     Costs         Closing · Escrow · Taxes & proration
     Underwriting  Qualify · Rental · Credit · Advanced · Contract & LE
     Results       Scenarios · Summary · Documents & OCR

   Releases 34, 37 and 40 each took Property, Mortgage Rates, Advanced
   and Documents out of the context row to avoid duplicating the direct
   buttons — and then the direct buttons went, so those four pages had
   no route at all. Taxes & proration, Credit and Contract & LE never
   had a tab. All are back in the row under the group they belong to,
   the direct buttons are stowed, and release 23's group list is
   extended so its own filter shows them.
   =================================================================== */
var SYNTH = [
  { label:'TAXES & PRORATION', go:function(){ if (window.V39 && V39.goTaxes) V39.goTaxes(); } },
  { label:'CREDIT',            go:function(){ if (window.V12 && V12.open) V12.open(); } },
  { label:'CONTRACT & LE',     go:function(){ if (window.V8 && V8.go) V8.go('docparse'); else if (window.V4 && V4.goAdv) V4.goAdv('docparse'); } }
];
var GROUP_TABS = { file:['QUOTE','SETUP','PROPERTY'], loan:['RENOVATION','MAX MORTGAGE','MORTGAGE RATES'],
  costs:['CLOSING','ESCROW','TAXES & PRORATION'], underwriting:['QUALIFY','RENTAL','CREDIT','ADVANCED','CONTRACT & LE'],
  results:['SCENARIOS','SUMMARY','DOCUMENTS & OCR'] };
function restoreTabs(){
  var row = document.querySelector('#suite-root .tabs'); if (!row) return false;
  /* bring back what release 40 held */
  var hold = $('v40Hold'); if (hold) $$('.tab', hold).forEach(function(t){ row.appendChild(t); });
  $$('.tab', row).forEach(function(t){ setClass(t,'v27-hidden-tab',false); setClass(t,'v37-promoted-copy',false); });
  /* synthetic tabs for the three pages that never had one */
  SYNTH.forEach(function(s){
    var have = $$('.tab', row).filter(function(t){ return key(t.textContent) === s.label; })[0];
    if (have) return;
    var b = document.createElement('button'); b.type='button'; b.className='tab v43-tab'; b.textContent = s.label;
    b.dataset.v23Key = s.label;
    b.addEventListener('click', function(){ $$('.tab', row).forEach(function(t){ t.classList.remove('active'); }); b.classList.add('active'); s.go(); });
    row.appendChild(b);
  });
  /* order the row by group, and set visibility for the current group on
     the synthetic tabs (release 23 manages the rest) */
  var cur = get('los.v23.suiteGroup','file');
  var wanted = [].concat.apply([], Object.keys(GROUP_TABS).map(function(g){ return GROUP_TABS[g]; }));
  var byKey = {}; $$('.tab', row).forEach(function(t){ byKey[key(t.textContent)] = t; });
  wanted.forEach(function(k){ var t = byKey[k]; if (t && row.lastElementChild !== t) row.appendChild(t); });
  $$('.v43-tab', row).forEach(function(t){ t.dataset.v23Visible = (GROUP_TABS[cur]||[]).indexOf(key(t.textContent)) >= 0 ? '1' : '0'; });
  /* the direct buttons duplicate all of this now */
  ['rates','property','documents','advanced'].forEach(function(k){ var b = $('v28nav-' + k); if (b) setClass(b,'v42-off',true); });
  return true;
}

/* =================================================================== 2
   THE MENUS — the File-actions design, reorganised

   Release 23's File actions panel is the design that reads well: a
   grid of cards, an icon and a label each. The header menus use it,
   one size smaller so a whole group fits without scrolling. Groups are
   by what the person is doing; nothing is dumped into File any more —
   anything unlisted lives under Actions, where the full inventory
   belongs.
   =================================================================== */
var IC = {
  save:'<svg viewBox="0 0 16 16"><path d="M2.75 1h9.586c.464 0 .909.184 1.237.513l1.914 1.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25V2.75C0 1.784.784 1 1.75 1h1Zm.5 1.5v3h5.5v-3h-5.5Zm4 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/></svg>',
  new:'<svg viewBox="0 0 16 16"><path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"/></svg>',
  reset:'<svg viewBox="0 0 16 16"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"/></svg>',
  export:'<svg viewBox="0 0 16 16"><path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14ZM7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06Z"/></svg>',
  import:'<svg viewBox="0 0 16 16"><path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14ZM7.25 2.311V8a.75.75 0 0 0 1.5 0V2.311l1.97 1.969a.749.749 0 1 0 1.06-1.06L8.53.97a.749.749 0 0 0-1.06 0L4.22 4.22a.749.749 0 1 0 1.06 1.06Z"/></svg>',
  page:'<svg viewBox="0 0 16 16"><path d="M1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0ZM4 5h8v1.5H4Zm0 3h8v1.5H4Zm0 3h5v1.5H4Z"/></svg>',
  print:'<svg viewBox="0 0 16 16"><path d="M4 1.75C4 .784 4.784 0 5.75 0h4.5C11.216 0 12 .784 12 1.75V3h1.25A1.75 1.75 0 0 1 15 4.75v5.5A1.75 1.75 0 0 1 13.25 12H12v2.25A1.75 1.75 0 0 1 10.25 16h-4.5A1.75 1.75 0 0 1 4 14.25V12H2.75A1.75 1.75 0 0 1 1 10.25v-5.5A1.75 1.75 0 0 1 2.75 3H4Zm1.5 0V3h5V1.75a.25.25 0 0 0-.25-.25h-4.5a.25.25 0 0 0-.25.25ZM5.5 9v5.25c0 .138.112.25.25.25h4.5a.25.25 0 0 0 .25-.25V9Z"/></svg>',
  doc:'<svg viewBox="0 0 16 16"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Z"/></svg>',
  look:'<svg viewBox="0 0 16 16"><path d="M8 0a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 14.5V1.5a6.5 6.5 0 0 1 0 13Z"/></svg>',
  home:'<svg viewBox="0 0 16 16"><path d="M6.906.664a1.749 1.749 0 0 1 2.187 0l5.25 4.2c.415.332.657.835.657 1.367v7.019A1.75 1.75 0 0 1 13.25 15h-3.5a.75.75 0 0 1-.75-.75V9H7v5.25a.75.75 0 0 1-.75.75h-3.5A1.75 1.75 0 0 1 1 13.25V6.23c0-.531.242-1.034.657-1.366Z"/></svg>',
  check:'<svg viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.751.751 0 0 0-.018-1.042.751.751 0 0 0-1.042-.018L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z"/></svg>',
  tool:'<svg viewBox="0 0 16 16"><path d="M5.433 2.304A4.494 4.494 0 0 0 3.5 6c0 1.598.832 3.002 2.09 3.802.518.328.929.923.902 1.64v.008l-.164 3.337a.75.75 0 0 1-1.498-.073l.163-3.33c.002-.085-.05-.216-.207-.316A5.996 5.996 0 0 1 2 6a5.993 5.993 0 0 1 2.567-4.92.75.75 0 0 1 .866 1.224Zm5.134 0a.75.75 0 0 1 .866-1.224A5.993 5.993 0 0 1 14 6a5.996 5.996 0 0 1-2.786 5.068c-.157.1-.209.231-.207.316l.163 3.33a.75.75 0 1 1-1.498.073l-.164-3.337v-.008c-.027-.717.384-1.312.902-1.64A4.496 4.496 0 0 0 12.5 6a4.494 4.494 0 0 0-1.933-3.696Z"/></svg>',
  chart:'<svg viewBox="0 0 16 16"><path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"/></svg>',
  lock:'<svg viewBox="0 0 16 16"><path d="M4 4a4 4 0 0 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm8.25 3.5h-8.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25ZM10.5 6V4a2.5 2.5 0 1 0-5 0v2Z"/></svg>',
  pct:'<svg viewBox="0 0 16 16"><path d="M13.78 2.22a.75.75 0 0 1 0 1.06l-10.5 10.5a.75.75 0 1 1-1.06-1.06l10.5-10.5a.75.75 0 0 1 1.06 0ZM4.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm7 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/></svg>',
  pl:'<svg viewBox="0 0 16 16"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm.75 2.5a.75.75 0 0 0-1.5 0V3c-1.53.164-2.5 1.113-2.5 2.5 0 1.6 1.35 2.115 2.5 2.4v2.55c-.55-.108-1-.35-1-.95a.75.75 0 0 0-1.5 0c0 1.387.97 2.336 2.5 2.5v.5a.75.75 0 0 0 1.5 0V13c1.53-.164 2.5-1.113 2.5-2.5 0-1.6-1.35-2.115-2.5-2.4V5.55c.55.108 1 .35 1 .95a.75.75 0 0 0 1.5 0c0-1.387-.97-2.336-2.5-2.5Z"/></svg>',
  tax:'<svg viewBox="0 0 16 16"><path d="M1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5C0 2.784.784 2 1.75 2ZM3 5.5v1.5h10V5.5Zm0 3v1.5h6V8.5Z"/></svg>',
  rules:'<svg viewBox="0 0 16 16"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Z"/></svg>',
  recalc:'<svg viewBox="0 0 16 16"><path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1Z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466Z"/></svg>'
};
/* [menu id] -> groups of [label shown, icon, labels to click in order] */
var MENUS = {
  file:  [['File',[['Save','save',['Save']],['Save scenario as\u2026','save',['Save scenario']],['New scenario','new',['New']],['Reset scenario','reset',['Reset']],['Export JSON','export',['Export scenario JSON']],['Import JSON / AI','import',['Import / AI','Import scenario JSON']]]]],
  view:  [['View',[['Full form','page',['Full form']],['All pages','page',['All pages']],['Look & theme','look',['Look','Theme & inputs']],['Return to Quote','home',['Return to Quote','Quote']]]]],
  docs:  [['Print',[['Print / PDF','print',['Print / PDF']],['Print summary','print',['Print summary']]]],
          ['Generate',[['Print / Generate','doc',['Print / Generate']],['Draft Loan Estimate','doc',['Draft LE']],['Draft Schedule C','doc',['Draft Schedule C']],['Profit & Loss','pl',['P&L','Profit & Loss']],['Income Report','doc',['Income Report']]]],
          ['Open',[['Documents & OCR','doc',['Documents & OCR']],['Contract & LE','doc',['Contract & LE']]]]],
  tools: [['Underwriting',[['Credit review','check',['Credit','Credit review']],['Rule tables','rules',['Advanced']],['Recalculate','recalc',['Recalculate']]]],
          ['Pricing & costs',[['PMI / FHA MIP','pct',['PMI / FHA MIP','PMI Worksheet']],['Renovation fees','tool',['Renovation fees','Reno Fees']],['Lock extension','lock',['Lock extension']],['Taxes & proration','tax',['Taxes & proration']],['Mortgage rates','chart',['Mortgage rates']]]]]
};
function inventory(){
  var out = {}, seen = {};
  ['#v23SuiteActions','#v24LoanTools','#v25HeaderActions','#v34Bar','#v39Bar','#v40Bar','#v35Panel','#suite-root .toolbar','#suite-root .topbar','#suite-root .tabs','#v23SuitePrimaryNav','#v36SuiteFooter','#v23Appearance']
  .forEach(function(sel){ $$(sel + ' button, ' + sel + ' a').forEach(function(b){
    if (b.closest('#v42Row') || b.closest('#v43Menu')) return;
    var l = key(b.textContent).replace(/\s*\u25BE\s*$/,''); if (!l || l.length > 40 || seen[l]) return; seen[l] = true; out[l] = b; }); });
  /* the synthetic destinations, by function rather than by button */
  out['TAXES & PRORATION'] = out['TAXES & PRORATION'] || { click:function(){ SYNTH[0].go(); } };
  out['CONTRACT & LE']     = out['CONTRACT & LE']     || { click:function(){ SYNTH[2].go(); } };
  out['LOCK EXTENSION']    = out['LOCK EXTENSION']    || { click:function(){ var s = store(); if (s) s.setMode('closing'); if (window.V5 && V5.LOCKEXT){ V5.LOCKEXT.state.open = true; V5.LOCKEXT.save(); V5.LOCKEXT.render(); } } };
  out['MORTGAGE RATES']    = out['MORTGAGE RATES']    || { click:function(){ if (window.V8 && V8.go) V8.go('rates'); } };
  out['LOOK']              = out['LOOK']              || { click:function(){ if (window.V39 && V39.toggleLook) V39.toggleLook(); } };
  return out;
}
function fire(labels){ var inv = inventory(); for (var i=0;i<labels.length;i++){ var b = inv[key(labels[i])]; if (b){ setTimeout(function(){ try{ b.click(); }catch(e){} }, 30); return true; } } return false; }
V43.close = function(){ var m = $('v43Menu'); if (m){ m.hidden = true; m.classList.remove('on'); } $$('#v42Row [aria-expanded="true"]').forEach(function(b){ b.setAttribute('aria-expanded','false'); }); };
V43.open = function(id){
  var m = $('v43Menu'); if (!m) return;
  if (m.dataset.for === id && !m.hidden) return V43.close();
  V43.close();
  var inv = inventory(), html = '';
  (MENUS[id]||[]).forEach(function(g){
    var have = g[1].filter(function(it){ return it[2].some(function(l){ return inv[key(l)]; }); });
    if (!have.length) return;
    html += '<div class="v43-sec">' + esc(g[0]) + '</div><div class="v43-grid">' + have.map(function(it){
      return '<button type="button" class="v43-card" data-l="' + esc(it[2].join('|')) + '">' + IC[it[1]] + '<span>' + esc(it[0]) + '</span></button>'; }).join('') + '</div>';
  });
  m.innerHTML = html || '<div class="v43-sec">Nothing here on this build.</div>';
  m.dataset.for = id;
  var b = $('v42-' + id), row = $('v42Row');
  if (b && row){ var r = b.getBoundingClientRect(), rr = row.getBoundingClientRect(); m.style.right = Math.max(0, rr.right - r.right) + 'px'; }
  m.hidden = false; m.classList.add('on');
  if (b) b.setAttribute('aria-expanded','true');
};
function rewire(){
  var row = $('v42Row'); if (!row || row.__v43) return false;
  row.__v43 = true;
  var old = $('v42Menu'); if (old) old.hidden = true;
  var m = document.createElement('div'); m.id = 'v43Menu'; m.className = 'v43-menu no-print'; m.hidden = true;
  m.onclick = function(e){ var c = e.target.closest('.v43-card'); if (!c) return; V43.close(); fire(c.dataset.l.split('|')); };
  row.appendChild(m);
  ['file','view','docs','tools'].forEach(function(id){ var b = $('v42-' + id); if (b) b.onclick = function(e){ e.stopPropagation(); V43.open(id); }; });
  /* Compare goes to the Scenarios page; Live opens the live comparison */
  var cmp = $('v42-compare'); if (cmp) cmp.onclick = function(e){ e.stopPropagation(); V43.close(); var s = store(); if (s) s.setMode('scenarios'); fire(['Compare']); };
  var live = $('v42-live'); if (live) live.onclick = function(e){ e.stopPropagation(); V43.close(); if (!fire(['Live comparison'])) { if (window.V14 && V14.open) try { V14.open('v14CompareModal'); } catch(x){} } };
  return true;
}
document.addEventListener('mousedown', function(e){ if (!e.target.closest('#v42Row')) V43.close(); });
document.addEventListener('keydown', function(e){ if (e.key === 'Escape') V43.close(); });

/* =================================================================== 3
   THE RAIL — twice as long

   Derived from the engine's outputs and plain arithmetic on them:
   amortisation over the term, what the mortgage insurance costs over
   its life, the escrow account at closing, the warnings themselves,
   income by borrower where the calculator has it, and the scenario's
   own record. Every row opens the popout or the workspace.
   =================================================================== */
function outRow(label, value, mode, note){
  if (value == null || value === '') return '';
  return '<div class="out v40-out" data-out="' + esc(label) + '" data-v35-label="' + esc(label) + '" data-v35-mode="' + esc(mode||'') + '">'
    + '<div class="l">' + esc(label) + (note ? '<small>' + esc(note) + '</small>' : '') + '</div><div class="v">' + value + '</div></div>';
}
function sec(t){ return '<div class="sec-head v40-sec">' + esc(t) + '</div>'; }
function amort(P, annual, years){
  var i = annual/12, n = Math.round(years*12); if (!P || !n) return null;
  var pmt = i > 0 ? P*i/(1-Math.pow(1+i,-n)) : P/n;
  var bal = P, int1 = 0, prin1 = 0, totalInt = 0, bal5 = 0, bal10 = 0;
  for (var k=1;k<=n;k++){ var ip = bal*i, pp = pmt-ip; bal -= pp; totalInt += ip; if (k<=12){ int1+=ip; prin1+=pp; } if (k===60) bal5=bal; if (k===120) bal10=bal; }
  return { pmt:pmt, int1:int1, prin1:prin1, totalInt:totalInt, bal5:bal5, bal10:bal10, n:n };
}
V43.railHtml = function(){
  var s = store(); if (!s) return '';
  var o = s.outputs || {}, i = s.activeInputs || {}, loan = o.loan || {}, p = o.payment || {}, esc_ = o.escrow || {}, a = o.aus || {};
  var h = '';
  var A = amort(N(loan.totalLoan), N(i.interestRate) > 1 ? N(i.interestRate)/100 : N(i.interestRate), N(i.termYears)||30);
  if (A){
    h += sec('Amortization');
    h += outRow('Year-1 interest', usd(A.int1,2), 'setup');
    h += outRow('Year-1 principal', usd(A.prin1,2), 'setup');
    h += outRow('Total interest over term', usd(A.totalInt,2), 'setup', A.n + ' payments');
    if (A.bal5) h += outRow('Balance after 5 years', usd(A.bal5,2), 'setup');
    if (A.bal10) h += outRow('Balance after 10 years', usd(A.bal10,2), 'setup');
    var close = i.closingDate || i.asOfDate; if (close){ var d = new Date(close); if (!isNaN(d)){ d.setMonth(d.getMonth()+A.n); h += outRow('Paid off', d.toLocaleDateString('en-US',{month:'short',year:'numeric'}), 'setup'); } }
  }
  var isFha = !!o.isFha, mi = isFha ? N(p.monthlyFhaMip) : N(p.monthlyPmi);
  if (mi){
    h += sec('Mortgage insurance, over its life');
    if (isFha) h += outRow('MIP over the term', usd(mi*12*(N(i.termYears)||30)), 'setup', 'plus upfront ' + usd(loan.ufmip));
    else if (A){ var months = 0, bal = N(loan.totalLoan), pv = N(p.pmiCancelValue) || N(o.value && o.value.valueBasis)*0.78, ii = (N(i.interestRate)>1?N(i.interestRate)/100:N(i.interestRate))/12;
      while (months < A.n && bal > pv){ bal -= (A.pmt - bal*ii); months++; }
      h += outRow('PMI until 78% LTV', usd(mi*months), 'setup', 'about ' + Math.round(months/12*10)/10 + ' years'); }
  }
  h += sec('Escrow account');
  if (N(esc_.initialDeposit)) h += outRow('Initial deposit at closing', usd(esc_.initialDeposit,2), 'escrow');
  if (N(esc_.monthlyEscrow || (N(p.monthlyTaxes)+N(p.monthlyInsurance)))) h += outRow('Monthly escrow', usd(esc_.monthlyEscrow || (N(p.monthlyTaxes)+N(p.monthlyInsurance)),2), 'escrow');
  if (N(esc_.cushionMonths)) h += outRow('Cushion', N(esc_.cushionMonths) + ' months', 'escrow');
  if (esc_.shortage != null && N(esc_.shortage) !== 0) h += outRow('Projected 12-month shortage', usd(esc_.shortage,2), 'escrow');
  var warns = (o.warnings||[]).slice(0,4);
  if (warns.length){ h += sec('Warnings'); warns.forEach(function(w){ h += outRow(String(w.title||w.code||'Warning').slice(0,40), esc(String(w.severity||'')), 'advanced', String(w.message||'').slice(0,90)); }); }
  try { var S = G('S'), T = window.calcTotals ? window.calcTotals() : null;
    if (T && (N(T.b1)||N(T.b2))){ h += sec('Income by borrower'); if (N(T.b1)) h += outRow(esc(S.b1||'Borrower 1'), usd(T.b1,2)+'/mo', 'income'); if (N(T.b2)) h += outRow(esc(S.b2||'Borrower 2'), usd(T.b2,2)+'/mo', 'income'); if (N(T.debts)) h += outRow('Monthly liabilities', usd(T.debts,2), 'income'); } } catch(e){}
  h += sec('Scenario');
  h += outRow('Name', esc(i.name || (s.active && s.active.name) || 'Unnamed'), 'scenarios');
  if (i.asOfDate) h += outRow('As of', esc(String(i.asOfDate)), 'setup');
  if (i.closingDate) h += outRow('Closing date', esc(String(i.closingDate)), 'closing');
  if (s.active && s.active.updatedAt) h += outRow('Last change', esc(new Date(s.active.updatedAt).toLocaleString()), 'scenarios');
  return h;
};
function paintRail(){
  var rail = document.querySelector('#suite-root .cols-main > .rail'); if (!rail) return false;
  var card = rail.querySelector(':scope > .card'), body = card && card.querySelector(':scope > .body'); if (!body) return false;
  var html = V43.railHtml(), host = $('v43Rail');
  if (!host || !host.isConnected){ if (host) host.remove(); host = document.createElement('div'); host.id = 'v43Rail'; host.className = 'v40-rail';
    var more = $('v39More'); if (more && more.parentNode === body) body.insertBefore(host, more); else body.appendChild(host); }
  if (host.__sig !== html){ host.__sig = html; host.innerHTML = html; }
  return true;
}

function tick(){ try { restoreTabs(); } catch(e){} try { rewire(); } catch(e){} try { paintRail(); } catch(e){} }
if (window.LOS_SCHEDULER && LOS_SCHEDULER.add) LOS_SCHEDULER.add(tick, 1200); else setInterval(tick, 900);
setTimeout(tick, 220);
})();
