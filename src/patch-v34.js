/* =====================================================================
   v34 — a dedicated wide row for the readings and the primary actions,
         the group-row duplicates hidden again, and a measured sticky
         offset instead of hard-coded pixels.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function norm(s){ return String(s||'').replace(/\s+/g,' ').trim().toUpperCase(); }
function setClass(el,c,on){ if (el && el.classList.contains(c) !== !!on) el.classList.toggle(c,!!on); }
var V34 = window.V34 = { version:'34.0' };

/* =================================================================== 1
   HIDE THE GROUP-ROW COPIES — a regression I caused

   Release 27 added the four direct-nav buttons AND hid the copies that
   still sat inside each group's context row. Release 33 removed 27's
   nav because its ids clashed with 28's — and took the hiding with it,
   because 28 never had its own and relied on 27's running. That is why
   DOCUMENTS & OCR reappeared in the context row underneath its own
   direct button.

   Owned here now, matched on the visible label so it cannot drift out of
   step with whatever ids a layer happens to use.
   =================================================================== */
var PROMOTED = ['DOCUMENTS & OCR','MORTGAGE RATES','PROPERTY','ADVANCED'];
function hideGroupCopies(){
  var tabs = document.querySelector('#suite-root .tabs'); if (!tabs) return false;
  $$('.tab', tabs).forEach(function(t){
    if (t.classList.contains('v25-full-nav') || t.dataset.group) return;   /* the nav's own */
    setClass(t, 'v27-hidden-tab', PROMOTED.indexOf(norm(t.textContent)) >= 0);
  });
  return true;
}
/* And the same dedupe on the primary nav, by label. */
function dedupeNav(){
  var nav = $('v23SuitePrimaryNav'); if (!nav) return false;
  var seen = {};
  $$(':scope > button', nav).forEach(function(b){
    var k = norm(b.textContent); if (!k) return;
    if (seen[k]) { b.remove(); return; }
    seen[k] = true;
  });
  return true;
}

/* =================================================================== 2
   THE WIDE READINGS ROW

   The readings and the two actions people press most were sharing a row
   with the scenario name, two dates and three menus, which is why it
   never fitted. They get their own full-width band directly under the
   masthead:

     TOTAL LOAN · PAYMENT · CASH TO CLOSE · BACK DTI · RATE      … Print / Generate · Live comparison · Save

   The masthead keeps the scenario, the dates and the three secondary
   controls, which now fit on one line comfortably.

   The move is idempotent: a node is only re-parented when it is in the
   wrong place, so a settled header does no DOM work.
   =================================================================== */
var MOVE = ['v251HeaderStats','v30PrintGen','v24LiveSummary','v23QuickSave'];
function buildBar(){
  var top = document.querySelector('#suite-root .topbar'); if (!top) return false;
  var bar = $('v34Bar');
  if (!bar || !bar.isConnected){
    if (bar) bar.remove();
    bar = document.createElement('div');
    bar.id = 'v34Bar'; bar.className = 'v34-bar no-print';
    bar.innerHTML = '<div class="v34-left"></div><div class="v34-right"></div>';
    if (top.nextSibling) top.parentNode.insertBefore(bar, top.nextSibling);
    else top.parentNode.appendChild(bar);
  }
  var left = bar.querySelector('.v34-left'), right = bar.querySelector('.v34-right');
  var stats = $('v251HeaderStats');
  if (stats && stats.parentNode !== left) left.appendChild(stats);
  ['v30PrintGen','v24LiveSummary','v23QuickSave'].forEach(function(id){
    var n = $(id);
    if (n && n.parentNode !== right) right.appendChild(n);
  });
  /* order inside the right half, only when wrong */
  var want = ['v30PrintGen','v24LiveSummary','v23QuickSave']
    .map(function(id){ return $(id); })
    .filter(function(n){ return n && n.parentNode === right; });
  /* Compare only against the nodes this layer owns. Counting every child
     means anything a later layer adds to this half — release 35's menu
     button, for one — makes the lengths differ forever, so the reorder
     fires on every tick and never settles. */
  var have = Array.prototype.filter.call(right.children, function(n){ return want.indexOf(n) >= 0; });
  var same = have.length === want.length && have.every(function(n,i){ return n === want[i]; });
  /* Reverse iteration. Inserting each node at the front in forward order
     lands them BACKWARDS, so `have` never matches `want` and the reorder
     re-runs on every tick forever — stable to look at, but a DOM write
     80 times a minute. Reversed, it produces the intended order and then
     settles to a genuine no-op. */
  if (!same) want.slice().reverse().forEach(function(n){ right.insertBefore(n, right.firstChild); });
  return true;
}

/* =================================================================== 3
   MEASURED STICKY OFFSET

   Every release so far has hard-coded the offset for the context tabs —
   142, then 124 — and each time a band changed height the number was
   wrong again and the strip either floated or slid under the bar. The
   chrome is measured instead and published as a custom property, so the
   offset is correct by construction and stays correct when a band
   changes or wraps.
   =================================================================== */
function measureChrome(){
  var root = $('suite-root'); if (!root) return false;
  var top  = root.querySelector('.topbar');
  var bar  = $('v34Bar');
  var nav  = root.querySelector('.v23-primary-nav');
  var strip= root.querySelector('.v24-stat-strip');
  var h = 0;
  [top, bar, strip, nav].forEach(function(n){
    if (n && n.offsetParent !== null) h += n.offsetHeight;
  });
  if (!h) return false;
  var cur = parseFloat(root.style.getPropertyValue('--v34-chrome')) || 0;
  if (Math.abs(cur - h) > 1) root.style.setProperty('--v34-chrome', h + 'px');
  return true;
}
function watch(){
  if (V34.__obs) return;
  V34.__obs = true;
  if (window.ResizeObserver){
    var ro = new ResizeObserver(function(){ measureChrome(); });
    ['.topbar','.v23-primary-nav','.v24-stat-strip'].forEach(function(sel){
      var n = document.querySelector('#suite-root ' + sel); if (n) ro.observe(n);
    });
    var bar = $('v34Bar'); if (bar) ro.observe(bar);
    V34.__ro = ro;
  }
  window.addEventListener('resize', measureChrome, { passive:true });
}

setInterval(function(){
  try { buildBar(); } catch(e){}
  try { hideGroupCopies(); dedupeNav(); } catch(e){}
  try { measureChrome(); watch(); } catch(e){}
}, 800);
setTimeout(function(){ try { buildBar(); measureChrome(); watch(); } catch(e){} }, 250);
})();
