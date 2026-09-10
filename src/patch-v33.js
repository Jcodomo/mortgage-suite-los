/* =====================================================================
   v33 — the action row rebuilt as one responsive component, and the
         duplicate nav buttons cleared.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function norm(s){ return String(s||'').replace(/\s+/g,' ').trim().toUpperCase(); }
function setClass(el,c,on){ if (el && el.classList.contains(c) !== !!on) el.classList.toggle(c,!!on); }
var V33 = window.V33 = { version:'33.0' };

/* =================================================================== 1
   NO DUPLICATE NAV BUTTONS

   Release 27 and release 28 both added direct-nav buttons, and 28's
   clean-up matched only two of the four ids, so Documents and Rates
   appeared twice. 27's copy is removed at source; this is the backstop,
   matched on the visible label rather than on an id, because an id is
   exactly what went wrong the first time.
   =================================================================== */
function dedupeNav(){
  var nav = $('v23SuitePrimaryNav'); if (!nav) return false;
  var seen = {};
  $$(':scope > button', nav).forEach(function(b){
    var k = norm(b.textContent);
    if (!k) return;
    if (seen[k]) { b.remove(); return; }
    seen[k] = true;
  });
  return true;
}

/* =================================================================== 2
   THE ACTION ROW

   Rebuilt as one component with a single measured layout rather than a
   pile of buttons each styled by whichever layer added it.

   The row has two halves that behave differently as the window narrows:
   the stat chips are readings and may drop to their values alone, then
   scroll; the action buttons are targets and must stay hittable, so they
   drop their labels to icons before anything scrolls. Nothing is ever
   removed, so the row cannot change what it can do at different widths.

   Sizing is by container width rather than viewport, because the row
   lives inside a padded shell — measuring the window told us the wrong
   number on an ultrawide display with a narrow content column.
   =================================================================== */
var BANDS = [
  { max: 640,  cls:'v33-xs' },   /* phone: icons only, row scrolls        */
  { max: 900,  cls:'v33-sm' },   /* small: short labels                   */
  { max: 1280, cls:'v33-md' },   /* laptop: full labels, tight            */
  { max: 2200, cls:'v33-lg' },   /* 1080p-1440p: comfortable              */
  { max: 1e9,  cls:'v33-xl' }    /* 4K / ultrawide: roomier, capped       */
];
function band(w){
  for (var i=0;i<BANDS.length;i++) if (w <= BANDS[i].max) return BANDS[i].cls;
  return 'v33-lg';
}
function sizeRow(){
  var row = $('v25HeaderActions'); if (!row) return false;
  var host = row.parentNode || row;
  var w = host.clientWidth || row.clientWidth || 0;
  if (!w) return false;
  var want = band(w);
  if (row.__v33band !== want){
    row.__v33band = want;
    BANDS.forEach(function(b){ setClass(row, b.cls, b.cls === want); });
  }
  setClass(row, 'v33-row', true);
  /* Overflow is a real state, not something to discover on scroll: the
     row is told when it is scrolling so the edge can be faded rather
     than a button being clipped mid-word. */
  setClass(row, 'v33-overflow', row.scrollWidth > row.clientWidth + 2);
  return true;
}
/* Measured on a resize observer, not a timer, so it settles in one frame
   and does not jitter while the window is being dragged. */
function watch(){
  var row = $('v25HeaderActions'); if (!row || row.__v33obs) return false;
  row.__v33obs = true;
  if (window.ResizeObserver){
    var ro = new ResizeObserver(function(){ sizeRow(); });
    ro.observe(row.parentNode || row);
  }
  window.addEventListener('resize', sizeRow, { passive:true });
  return true;
}

/* =================================================================== 3
   STABLE WIDTHS

   A number that changes width changes the position of everything to its
   right. The stat values are given tabular figures and a floor width in
   CSS; this tags the row so that applies, and marks the chips so the
   label can be dropped without the value moving.
   =================================================================== */
function tagStats(){
  var stats = $('v251HeaderStats'); if (!stats) return false;
  setClass(stats, 'v33-stats', true);
  $$(':scope > button', stats).forEach(function(b){ setClass(b, 'v33-chip', true); });
  var rate = $('v28RateStat'); setClass(rate, 'v33-chip', true);
  return true;
}

setInterval(function(){
  try { dedupeNav(); } catch(e){}
  try { tagStats(); watch(); sizeRow(); } catch(e){}
}, 800);
setTimeout(function(){ try { tagStats(); watch(); sizeRow(); } catch(e){} }, 300);
})();
