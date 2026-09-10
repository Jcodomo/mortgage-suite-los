/* =====================================================================
   v31 — the live summary as a permanent right column with its own
         collapse control, and no more layers fighting over the header.
   Additive. Nothing in an earlier layer is edited at runtime.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function get(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
function set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
var V31 = window.V31 = { version:'31.0' };

/* =================================================================== 1
   THE RAIL IS A COLUMN, NOT A POPOVER

   It was being shown and hidden by a class on #suite-root, which is why
   it appeared to pop up and down: every layer that re-rendered the
   screen, and every stray toggle, could flip it. Three separate things
   were also writing to it — v24's toggle, v27's lock, v30's re-assert —
   so it could change state twice in one second.

   It is now a real grid column that is always in the layout. Collapsing
   narrows the column to a 30px strip with a chevron instead of removing
   it, so the main content never reflows from full width to two columns
   and back. One key owns the state and one control writes to it.
   =================================================================== */
var KEY = 'los.v31.railCollapsed';
V31.collapsed = function(){ return false; };   /* never collapsed now */
V31.toggle = function(){ /* retired in release 33 — the rail is permanent */ };
V31.apply = function(){
  var root = $('suite-root'); if (!root) return false;
  var c = V31.collapsed();
  root.classList.toggle('v31-rail-collapsed', c);
  /* v24's own open/closed class is forced on and left alone, so nothing
     downstream that reads it changes behaviour. The column's width is
     what actually moves now. */
  root.classList.add('v24-summary-open');
  var rail = root.querySelector('.rail');
  if (rail){
    if (!rail.classList.contains('v31-rail')) rail.classList.add('v31-rail');
    /* The collapse control is gone. It rendered as a second "Live
       summary" header stacked on the card's own, and in the vertical
       collapsed state it overlapped it — two labels for one panel. The
       rail is simply always there now, which is what it was being
       collapsed back to anyway. */
    var stale = $('v31RailToggle');
    if (stale) stale.remove();
  }
  return true;
};

/* =================================================================== 2
   HEADER STABILITY

   The reported flicker in the button row was two polls fighting: release
   28 installed a Print / Generate button and release 30 installed its
   own, each removing the other's on its own timer. Release 28's copy has
   been taken out at source, so only one remains.

   This is the belt to that braces: if a second generator button ever
   appears again, the older one is removed once and the fact is logged
   rather than left to oscillate.
   =================================================================== */
function oneGenerator(){
  var all = $$('#v25HeaderActions button').filter(function(b){
    return /print\s*\/\s*generate/i.test((b.textContent||'').trim()); });
  if (all.length < 2) return;
  /* keep the last one added; remove the rest */
  all.slice(0, -1).forEach(function(b){ b.remove(); });
  if (!V31.__warned){
    V31.__warned = true;
    if (window.console) console.warn('[v31] removed ' + (all.length-1)
      + ' duplicate Print / Generate button(s) — a layer is still installing one.');
  }
}
/* Same guard for the other controls that more than one layer has
   touched. Cheap, and it converts a visible oscillation into a
   one-time cleanup. */
var SINGLETONS = ['v30PrintGen','v24LiveSummary','v25FullForm','v23SuiteActions','v24LoanTools','v23QuickSave'];
function noDuplicates(){
  SINGLETONS.forEach(function(id){
    var nodes = $$('[id="' + id + '"]');
    if (nodes.length > 1) nodes.slice(0, -1).forEach(function(n){ n.remove(); });
  });
}

/* =================================================================== 3
   WIDTH

   With the rail permanently in the grid, the main column has to be told
   it may shrink. Without min-width:0 a grid child sizes to its widest
   unbreakable content — a long scenario name or a wide table — and
   pushes the rail off the edge instead of scrolling itself. That was the
   "everything gets messed up on the width" case.
   =================================================================== */
function guardWidth(){
  var root = $('suite-root'); if (!root) return;
  var main = root.querySelector('.cols-main'); if (!main) return;
  var first = main.firstElementChild;
  if (first && !first.classList.contains('v31-main')) first.classList.add('v31-main');
}

setInterval(function(){
  try { V31.apply(); } catch(e){}
  try { oneGenerator(); noDuplicates(); } catch(e){}
  try { guardWidth(); } catch(e){}
}, 800);
V31.apply();
})();
