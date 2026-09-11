/* =====================================================================
   Release 40 — one header row of icons, the nav icons redrawn, the
   context-row flicker ended, a rail with three times the information in
   the engine's own style, and the agency stripped from the report
   worksheets.
   Additive over 39.
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
function setClass(el,c,on){ if (el && el.classList.contains(c)!==!!on) el.classList.toggle(c,!!on); }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }
function store(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
var V40 = window.V40 = { version:'40.0' };

/* =================================================================== 0
   ICONS — one set, GitHub's octicons, 16-grid, 1.5 stroke feel.
   Used for the header, the group nav and the rail so nothing in the
   chrome draws its pictures a different way.
   =================================================================== */
var I = {
  file:     '<svg viewBox="0 0 16 16"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914Z"/></svg>',
  view:     '<svg viewBox="0 0 16 16"><path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z"/></svg>',
  docs:     '<svg viewBox="0 0 16 16"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z"/></svg>',
  compare:  '<svg viewBox="0 0 16 16"><path d="M9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM6 12.5a2.5 2.5 0 0 1-2.5 2.5h-1v1.646a.25.25 0 0 1-.427.177L-.323 14.427a.25.25 0 0 1 0-.354l2.396-2.396a.25.25 0 0 1 .427.177V13.5h1a1 1 0 0 0 1-1V5.372a2.25 2.25 0 1 1 1.5 0Zm-.75-8.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm7.5 8.25a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" transform="translate(1.5 0)"/></svg>',
  actions:  '<svg viewBox="0 0 16 16"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/></svg>',
  tools:    '<svg viewBox="0 0 16 16"><path d="M5.433 2.304A4.494 4.494 0 0 0 3.5 6c0 1.598.832 3.002 2.09 3.802.518.328.929.923.902 1.64v.008l-.164 3.337a.75.75 0 0 1-1.498-.073l.163-3.33c.002-.085-.05-.216-.207-.316A5.996 5.996 0 0 1 2 6a5.993 5.993 0 0 1 2.567-4.92.75.75 0 0 1 .866 1.224Zm5.134 0a.75.75 0 0 1 .866-1.224A5.993 5.993 0 0 1 14 6a5.996 5.996 0 0 1-2.786 5.068c-.157.1-.209.231-.207.316l.163 3.33a.75.75 0 1 1-1.498.073l-.164-3.337v-.008c-.027-.717.384-1.312.902-1.64A4.496 4.496 0 0 0 12.5 6a4.494 4.494 0 0 0-1.933-3.696Z"/></svg>',
  live:     '<svg viewBox="0 0 16 16"><path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"/></svg>',
  /* group nav */
  gfile:    '<svg viewBox="0 0 16 16"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"/></svg>',
  gloan:    '<svg viewBox="0 0 16 16"><path d="M6.906.664a1.749 1.749 0 0 1 2.187 0l5.25 4.2c.415.332.657.835.657 1.367v7.019A1.75 1.75 0 0 1 13.25 15h-3.5a.75.75 0 0 1-.75-.75V9H7v5.25a.75.75 0 0 1-.75.75h-3.5A1.75 1.75 0 0 1 1 13.25V6.23c0-.531.242-1.034.657-1.366l5.25-4.2Zm1.25 1.171a.25.25 0 0 0-.312 0l-5.25 4.2a.25.25 0 0 0-.094.196v7.019c0 .138.112.25.25.25H5.5V8.25a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v5.25h2.75a.25.25 0 0 0 .25-.25V6.23a.25.25 0 0 0-.094-.195Z"/></svg>',
  gcosts:   '<svg viewBox="0 0 16 16"><path d="M8 0c4.42 0 8 1.343 8 3v10c0 1.657-3.58 3-8 3s-8-1.343-8-3V3c0-1.657 3.58-3 8-3ZM1.5 3c0 .29.363.905 1.756 1.4C4.507 4.85 6.15 5.15 8 5.15s3.493-.3 4.744-.75C14.137 3.905 14.5 3.29 14.5 3s-.363-.905-1.756-1.4C11.493 1.15 9.85.85 8 .85s-3.493.3-4.744.75C1.863 2.095 1.5 2.71 1.5 3Zm0 3v2c0 .29.363.905 1.756 1.4C4.507 9.85 6.15 10.15 8 10.15s3.493-.3 4.744-.75C14.137 8.905 14.5 8.29 14.5 8V6c-1.457.905-3.913 1.5-6.5 1.5S2.957 6.905 1.5 6Zm0 5v2c0 .29.363.905 1.756 1.4 1.251.45 2.894.75 4.744.75s3.493-.3 4.744-.75c1.393-.495 1.756-1.11 1.756-1.4v-2c-1.457.905-3.913 1.5-6.5 1.5s-5.043-.595-6.5-1.5Z"/></svg>',
  guw:      '<svg viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.751.751 0 0 0-.018-1.042.751.751 0 0 0-1.042-.018L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z"/></svg>',
  gresults: '<svg viewBox="0 0 16 16"><path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"/></svg>',
  gfull:    '<svg viewBox="0 0 16 16"><path d="M1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0ZM1.5 1.75v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25ZM4 5h8v1.5H4Zm0 3h8v1.5H4Zm0 3h5v1.5H4Z"/></svg>'
};

/* =================================================================== 1
   THE HEADER — icons, then Live and Actions

     [file] [view] [documents] [compare] [file actions] [loan tools]   Live   Actions

   The screenshot showed two rows: release 39's labelled row and the
   older Live and Actions still underneath it. Every earlier copy is
   stowed here — not removed, so each keeps its wiring — and one row
   owns the header. Six icons open their thing directly or as a small
   popout; Live and Actions are the two with menus, as asked.

   Documents is the one that pops a choice rather than going somewhere:
   Print, Generate, or Direct to the Documents & OCR page.
   =================================================================== */
function inventory(){
  var out = {}, seen = {};
  ['#v23SuiteActions','#v24LoanTools','#v25HeaderActions','#v34Bar','#suite-root .toolbar','#suite-root .topbar','#v39Bar','#v35Panel']
  .forEach(function(sel){
    $$(sel + ' button, ' + sel + ' a').forEach(function(b){
      if (b.closest('#v40Bar') || b.closest('.v40-pop')) return;
      var label = key(b.textContent).replace(/\s*\u25BE\s*$/,'');
      if (!label || label.length > 40 || seen[label]) return;
      seen[label] = true; out[label] = b;
    });
  });
  return out;
}
function click(labels){
  var inv = inventory();
  for (var i=0;i<labels.length;i++){ var b = inv[key(labels[i])]; if (b){ setTimeout(function(){ try { b.click(); } catch(e){} }, 30); return true; } }
  return false;
}
var ICON_BTNS = [
  { id:'file',    icon:'file',    tip:'File — save, new, reset, import & export',
    go:function(){ V40.pop('file', 'File', ['Save','New','Reset','Save scenario','Export scenario JSON','Import scenario JSON','Import / AI']); } },
  { id:'view',    icon:'view',    tip:'View — full form and every page',
    go:function(){ V40.pop('view', 'View', ['Full form','All pages','Print / PDF','Copy borrower quote']); } },
  { id:'docs',    icon:'docs',    tip:'Documents — print, generate, or open',
    go:function(){ V40.pop('docs', 'Documents', [
      ['Print',    ['Print / PDF','Print summary']],
      ['Generate', ['Print / Generate','Draft LE','Draft Schedule C','P&L','Income Report']],
      ['Direct',   ['Documents & OCR']]]); } },
  { id:'compare', icon:'compare', tip:'Compare scenarios',
    go:function(){ if (!click(['Live comparison','Compare'])) say('Comparison not loaded','','warn',4000); } },
  { id:'factions',icon:'actions', tip:'File actions',
    go:function(){ var d = $('v23SuiteActions'); if (d && d.tagName === 'DETAILS'){ d.open = !d.open; return; } V40.pop('factions','File actions', null, '#v23SuiteActions'); } },
  { id:'tools',   icon:'tools',   tip:'Loan tools',
    go:function(){ var d = $('v24LoanTools'); if (d && d.tagName === 'DETAILS'){ d.open = !d.open; return; } V40.pop('tools','Loan tools', null, '#v24LoanTools'); } }
];
V40.closeAll = function(){ $$('.v40-pop.on').forEach(function(p){ p.classList.remove('on'); });
  $$('#v40Bar [aria-expanded="true"]').forEach(function(b){ b.setAttribute('aria-expanded','false'); }); };
/* items: a flat label list, or [[group, [labels]], ...], or null + a
   source selector whose buttons are listed as they are */
V40.pop = function(pid, title, items, sourceSel){
  var p = $('v40Pop'); if (!p) return;
  if (p.dataset.pid === pid && p.classList.contains('on')) { V40.closeAll(); return; }
  V40.closeAll();
  var inv = inventory(), groups = [];
  if (sourceSel){
    var src = document.querySelector(sourceSel), labels = [];
    if (src) $$('button, a', src).forEach(function(b){ if (b.closest('summary')) return; var l = norm(b.textContent).replace(/\s*\u25BE\s*$/,''); if (l && l.length <= 40 && inv[key(l)]) labels.push(l); });
    groups = [[title, labels]];
  } else if (items && Array.isArray(items[0])) groups = items;
  else groups = [[title, items]];
  var html = '<div class="v40-pop-hd">' + esc(title) + '</div>';
  groups.forEach(function(g){
    var have = g[1].filter(function(l){ return inv[key(l)]; });
    if (!have.length) return;
    if (groups.length > 1) html += '<div class="v40-pop-sec">' + esc(g[0]) + '</div>';
    html += '<div class="v40-pop-items">' + have.map(function(l){
      return '<button type="button" class="v40-pop-item" data-l="' + esc(l) + '">' + esc(norm(inv[key(l)].textContent).replace(/\s*\u25BE\s*$/,'')) + '</button>'; }).join('') + '</div>';
  });
  p.innerHTML = html;
  p.dataset.pid = pid;
  p.onclick = function(e){ var b = e.target.closest('.v40-pop-item'); if (!b) return; V40.closeAll(); click([b.dataset.l]); };
  var anchor = $('v40Btn-' + pid);
  if (anchor){ var r = anchor.getBoundingClientRect(), host = anchor.closest('#v40Bar').getBoundingClientRect();
    p.style.left = Math.max(0, r.left - host.left) + 'px'; }
  p.classList.add('on');
  if (anchor) anchor.setAttribute('aria-expanded','true');
};
V40.live = function(){ if (!click(['Live comparison','Compare'])) say('Comparison not loaded','','warn',4000); };
V40.actions = function(){ if (window.V35 && V35.toggle) return V35.toggle(); click(['Actions']); };
function buildBar(){
  var host = document.querySelector('#suite-root .v34-right') || $('v25HeaderActions'); if (!host) return false;
  if ($('v40Bar')) return true;
  var bar = document.createElement('div'); bar.id = 'v40Bar'; bar.className = 'v40-bar no-print';
  bar.innerHTML = '<div class="v40-icons">'
    + ICON_BTNS.map(function(b){ return '<button type="button" class="v40-ic" id="v40Btn-' + b.id + '" title="' + esc(b.tip) + '" aria-label="' + esc(b.tip.split(' — ')[0]) + '" aria-haspopup="true" aria-expanded="false">' + I[b.icon] + '</button>'; }).join('')
    + '</div><div class="v40-pop" id="v40Pop"></div>'
    + '<button type="button" class="v40-lb" id="v40Btn-live">' + I.live + '<span>Live</span></button>'
    + '<button type="button" class="v40-lb primary" id="v40Btn-actions">' + I.actions + '<span>Actions</span></button>';
  host.appendChild(bar);
  ICON_BTNS.forEach(function(b){ $('v40Btn-' + b.id).onclick = function(e){ e.stopPropagation(); b.go(); }; });
  $('v40Btn-live').onclick = function(e){ e.stopPropagation(); V40.live(); };
  $('v40Btn-actions').onclick = function(e){ e.stopPropagation(); V40.actions(); };
  return true;
}
/* every earlier header control, stowed — wired, off screen */
var STOW = ['v39Bar','v35Btn','v36LiveButton','v24LiveSummary','v30PrintGen','v25FullForm','v23QuickSave','v27Promoted','v28RateStat'];
function stowOld(){
  STOW.forEach(function(id){ var el = $(id); if (el && id !== 'v28RateStat') setClass(el, 'v40-stowed', true); });
  /* the <details> menus stay reachable through their icons; hide only
     their summary so the bar does not show them twice */
  ['v23SuiteActions','v24LoanTools'].forEach(function(id){ var d = $(id); if (d){ var s = d.querySelector(':scope > summary'); if (s) setClass(s, 'v40-stowed', true); } });
}
document.addEventListener('mousedown', function(e){ if (!e.target.closest('#v40Bar')) V40.closeAll(); });
document.addEventListener('keydown', function(e){ if (e.key === 'Escape') V40.closeAll(); });

/* =================================================================== 2
   GROUP NAV ICONS — redrawn in the same set
   =================================================================== */
var GROUP_ICON = { file:'gfile', loan:'gloan', costs:'gcosts', underwriting:'guw', results:'gresults', full:'gfull' };
function redrawNav(){
  var nav = $('v23SuitePrimaryNav'); if (!nav) return false;
  $$('button', nav).forEach(function(b){
    var g = b.dataset.group; if (!g || !GROUP_ICON[g]) return;
    var span = b.querySelector('.v23-nav-icon'); if (!span) return;
    var want = I[GROUP_ICON[g]];
    if (span.innerHTML !== want){ span.innerHTML = want; setClass(span, 'v40-nav-ic', true); }
  });
  return true;
}

/* =================================================================== 3
   THE CONTEXT-ROW FLICKER

   Three releases hid the promoted copies of Mortgage Rates, Property,
   Advanced and Documents by adding a class; a fourth "stabilised" the
   Property control with a rule that out-specifies a display:none. The
   result was a tab that appeared and vanished depending on which rule
   had run last — the MORTGAGE RATES chip in the screenshot.

   The copies are MOVED out of the row into a hidden holder. They stay
   in the DOM with their handlers, so anything that clicks them by
   reference still works, and no stylesheet can bring them back into
   the row because they are no longer in it.
   =================================================================== */
var PROMOTED = ['MORTGAGE RATES','PROPERTY','ADVANCED','DOCUMENTS & OCR'];
function holdCopies(){
  if (window.V43) return true;   /* release 43: these pages live in their groups again */
  var row = document.querySelector('#suite-root .tabs'); if (!row) return false;
  var hold = $('v40Hold');
  if (!hold){ hold = document.createElement('div'); hold.id = 'v40Hold'; hold.className = 'v40-hold'; hold.setAttribute('aria-hidden','true'); row.parentNode.insertBefore(hold, row.nextSibling); }
  $$(':scope > .tab', row).forEach(function(t){
    if (t.dataset.group || t.classList.contains('v25-full-nav')) return;
    if (PROMOTED.indexOf(key(t.textContent)) >= 0) hold.appendChild(t);
  });
  return true;
}

/* =================================================================== 4
   THE RAIL — three times the information, in the engine's own rows

   Same markup the engine uses for its six sections: a .sec-head, then
   .out rows with a label and a value, each carrying data-out so release
   35's delegation opens the edit popout with its "open the workspace"
   button. Nothing is a new component; a reader cannot tell which rows
   the engine drew and which came from here.

   Every figure is read from the engine's outputs. Rows whose figure is
   empty are not drawn — an empty line is not information.
   =================================================================== */
function outRow(label, value, mode, note){
  if (value == null || value === '' || value === '—') return '';
  return '<div class="out v40-out" data-out="' + esc(label) + '" data-v35-label="' + esc(label) + '" data-v35-mode="' + esc(mode||'') + '">'
    + '<div class="l">' + esc(label) + (note ? '<small>' + esc(note) + '</small>' : '') + '</div><div class="v">' + value + '</div></div>';
}
function sec(t){ return '<div class="sec-head v40-sec">' + esc(t) + '</div>'; }
function bar(used, cap){ if (!cap || used == null) return ''; var p = Math.max(0, Math.min(100, used/cap*100)), st = used>cap?'over':p>92?'tight':'ok';
  return '<i class="v40-bar ' + st + '" style="--w:' + p.toFixed(1) + '%"></i>'; }
V40.railHtml = function(){
  var s = store(); if (!s) return '';
  var o = s.outputs || {}, i = s.activeInputs || {};
  var p = o.payment || {}, a = o.aus || {}, loan = o.loan || {}, cash = o.cash || {}, closing = o.closing || {},
      value = o.value || {}, reno = o.renovationOut || {}, esc_ = o.escrow || {};
  var isFha = !!o.isFha, h = '';
  var income = N(a.monthlyIncome || a.qualifyingIncome); try { if (!income && window.calcTotals) income = N(window.calcTotals().income); } catch(e){}

  h += sec('Terms');
  h += outRow('Note rate', pct(i.interestRate,3), 'rates');
  h += outRow('Term', N(i.termYears) ? N(i.termYears) + ' years' : '', 'setup');
  h += outRow('Program', esc(o.programLabel || i.loanProgram || ''), 'setup');
  if (N(i.finalDownPaymentPct)) h += outRow('Down payment', pct(i.finalDownPaymentPct,2) + ' \u00b7 ' + usd(loan.requiredInvestment), 'maxmortgage');
  if (N(p.currentLtv)) h += outRow('LTV', pct(p.currentLtv,2), 'maxmortgage', N(value.valueBasis) ? 'on ' + usd(value.valueBasis) + ' value basis' : '');

  h += sec('Payment detail');
  h += outRow('Principal & interest', usd(p.principalAndInterest,2), 'setup');
  var mi = isFha ? N(p.monthlyFhaMip) : N(p.monthlyPmi), miRate = isFha ? N(p.fhaMipRateUsed) : N(p.pmiRateUsed);
  if (mi) h += outRow(isFha ? 'FHA MIP' : 'PMI', usd(mi,2), 'setup', (miRate ? pct(miRate,2) + ' annual' : '') + (p.creditTier ? ' \u00b7 ' + p.creditTier : ''));
  if (isFha && mi) h += outRow('MIP duration', 'life of loan', 'setup', 'FHA at this LTV \u2014 does not cancel');
  else if (!isFha && N(p.pmiCancelValue)) h += outRow('PMI cancels at', usd(p.pmiCancelValue), 'setup', '78% LTV on the original value');
  if (N(p.monthlyTaxes)) h += outRow('Property taxes', usd(p.monthlyTaxes,2), 'escrow', N(i.propertyTaxAmount) ? usd(i.propertyTaxAmount) + '/yr' : '');
  if (N(p.monthlyInsurance)) h += outRow('Insurance', usd(p.monthlyInsurance,2), 'escrow', N(i.insuranceAmount) ? usd(i.insuranceAmount) + '/yr' : '');
  if (N(p.hoaMonthly)) h += outRow('HOA', usd(p.hoaMonthly,2), 'setup');
  if (N(p.paymentLow) && N(p.paymentHigh) && p.paymentLow !== p.paymentHigh) h += outRow('Rounded range', usd(p.paymentLow) + ' \u2013 ' + usd(p.paymentHigh), 'setup');

  if (income > 0){
    h += sec('Qualifying');
    h += outRow('Qualifying income', usd(income) + '/mo', 'income');
    if (N(a.totalMonthlyLiabilities)) h += outRow('Other monthly debts', usd(a.totalMonthlyLiabilities), 'income');
    var f = N(a.frontEndDti), b = N(a.backEndDti), fc = N(a.frontEndLimit), bc = N(a.backEndLimit);
    if (f) h += outRow('Front-end DTI', pct(f,1) + bar(f,fc), 'income', fc ? 'cap ' + pct(fc,1) : '');
    if (b) h += outRow('Back-end DTI', pct(b,1) + bar(b,bc), 'income', bc ? 'cap ' + pct(bc,1) : '');
    if (N(a.maxSupportedHousingPayment)) h += outRow('Maximum payment', usd(a.maxSupportedHousingPayment), 'income', 'lower of the two caps, after debts');
    if (N(a.paymentCushion)) h += outRow('Payment cushion', usd(a.paymentCushion), 'income');
  }

  h += sec('Closing detail');
  if (N(closing.buyerClosingCosts)) h += outRow('Buyer closing costs', usd(closing.buyerClosingCosts), 'closing');
  var lines = closing.lines || [];
  var sum = function(re){ return lines.filter(function(l){ return l.payer === 'buyer' && re.test(l.key||''); }).reduce(function(x,l){ return x + N(l.amount); }, 0); };
  var lender = sum(/lender|points|origination/i), third = sum(/appraisal|credit|flood|title|attorney|survey|inspections/i), gov = sum(/recording|mortgageTax|transfer|luxury/i), prepaid = sum(/prepaid|perDiem|initialEscrow/i);
  if (lender) h += outRow('Lender charges', usd(lender), 'closing');
  if (third) h += outRow('Third-party fees', usd(third), 'closing');
  if (gov) h += outRow('Government & taxes', usd(gov), 'closing');
  if (prepaid) h += outRow('Prepaids & escrows', usd(prepaid), 'escrow');
  if (N(cash.sellerConcessionApplied)) h += outRow('Seller credit', usd(cash.sellerConcessionApplied), 'closing', N(cash.sellerConcessionCeiling) ? 'ceiling ' + usd(cash.sellerConcessionCeiling) : '');
  if (N(i.closing && i.closing.earnestMoneyDeposit)) h += outRow('Earnest money', usd(i.closing.earnestMoneyDeposit), 'closing');
  if (N(esc_.cushionMonths)) h += outRow('Escrow cushion', N(esc_.cushionMonths) + ' months', 'escrow');

  if (N(reno.finalRenovationAmount)){
    h += sec('Renovation');
    h += outRow('Renovation total', usd(reno.finalRenovationAmount), 'renovation');
    if (N(reno.contingency)) h += outRow('Contingency', usd(reno.contingency), 'renovation');
    if (N(reno.financedFees)) h += outRow('Financed fees', usd(reno.financedFees), 'renovation');
    if (N(value.afterRepairValue)) h += outRow('After-repair value', usd(value.afterRepairValue), 'maxmortgage');
  }

  var avail = N(a.reserveMonthsAvailable), need = N(a.reserveMonths);
  if (avail || need){
    h += sec('Reserves');
    h += outRow('Months available', avail.toFixed(1) + (need ? ' of ' + need.toFixed(1) + ' needed' : ''), 'qualify', avail >= need ? 'meets the requirement' : 'short ' + (need-avail).toFixed(1) + ' months');
  }
  return h;
};
function paintRail(){
  var rail = document.querySelector('#suite-root .cols-main > .rail'); if (!rail) return false;
  var card = rail.querySelector(':scope > .card'), body = card && card.querySelector(':scope > .body'); if (!body) return false;
  var old = $('v38Extras'); if (old) old.remove();
  var host = $('v40Rail');
  var html = V40.railHtml();
  if (!host || !host.isConnected){ if (host) host.remove(); host = document.createElement('div'); host.id = 'v40Rail'; host.className = 'v40-rail';
    var more = $('v39More'); if (more && more.parentNode === body) body.insertBefore(host, more); else body.appendChild(host); }
  if (host.__sig !== html){ host.__sig = html; host.innerHTML = html; }
  return true;
}

/* =================================================================== 5
   REPORT WORKSHEETS — no agency, no 1084/91/4000 subtitle

   The worksheet page header printed "Agency: FNMA" and the subtitle
   "Base, overtime, bonus and commission analysis per FNMA Form 1084 /
   FHLMC Form 91 / HUD 4000.1". Both go. The Wage Earner title, the
   employment record, the hire date and months on the job stay.
   rptHead is a top-level function declaration, so it can be wrapped.
   =================================================================== */
function wrapReport(){
  if (typeof window.rptHead !== 'function' || window.rptHead.__v40) return false;
  var inner = window.rptHead;
  var wrapped = function(title, sub){
    var html = inner.call(this, title, /1084|form 91|4000/i.test(sub||'') ? '' : sub);
    return html.replace(/<div><b>Agency:<\/b>[^<]*<\/div>/i, '');
  };
  wrapped.__v40 = true; window.rptHead = wrapped;
  return true;
}

/* =================================================================== 6
   WIRING
   =================================================================== */
function tick(){
  try { buildBar(); stowOld(); } catch(e){}
  try { redrawNav(); } catch(e){}
  try { holdCopies(); } catch(e){}
  try { paintRail(); } catch(e){}
  /* Release 44 keeps the Release 37 Income Calculator and its report
     worksheets intact. The Release 40 report rewrite is intentionally not
     installed; the remaining Release 40 work is Loan Suite-only. */
}
if (window.LOS_SCHEDULER && LOS_SCHEDULER.add) LOS_SCHEDULER.add(tick, 1200); else setInterval(tick, 900);
setTimeout(tick, 220);
})();
