/* =====================================================================
   v26 — suite chrome cleanup: menu dedupe, group-nav reliability,
         free-form sweep over newly rendered controls.
   Additive. No engine or earlier layer is edited.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function norm(s){ return String(s||'').replace(/\s+/g,' ').trim().toUpperCase(); }
var V26 = window.V26 = { version:'26.0' };

/* =================================================================== 1
   ACTION MENU DEDUPE

   Every layer from v11 on appended its own control to the suite toolbar,
   and v23's menu then swept the whole toolbar into one grid. Anything
   that was BOTH added by a later layer AND still present inside an older
   "More" menu-wrap therefore appeared twice — Export Scenario JSON,
   Import Scenario JSON, PMI Worksheet, P&L, Reno Fees and Documents &
   OCR were all duplicated in the screenshot.

   Rather than deleting anything (every entry still works and some are
   the only route to their feature), the later copy is kept and earlier
   duplicates are hidden, matched on the normalised label.
   =================================================================== */
function dedupeGrid(grid){
  if (!grid) return 0;
  var seen = {}, hidden = 0;
  /* Walk backwards so the LAST occurrence wins: later layers added the
     better-labelled, better-wired copy. */
  var items = $$(':scope > *', grid).reverse();
  items.forEach(function(node){
    if (node.classList.contains('v26-dupe')) { hidden++; return; }
    var label = norm(node.textContent).replace(/\s*\u25be\s*$/,'');
    if (!label) return;
    /* a nested menu contributes its own children's labels; take the
       first line as its identity instead of the whole blob */
    if (node.querySelector && node.querySelector('.menu')) label = norm((node.textContent||'').split('\n')[0]);
    if (label.length > 40) label = label.slice(0,40);
    if (seen[label]) { node.classList.add('v26-dupe'); hidden++; return; }
    seen[label] = true;
  });
  return hidden;
}
function sweepMenus(){
  var n = 0;
  $$('.v23-actions-grid').forEach(function(g){ n += dedupeGrid(g); });
  return n;
}
/* The nested "More" wrap renders its whole menu inline. Make it a real
   disclosure instead of a wall of entries. */
function tameNestedMenus(){
  $$('.v23-actions-grid .menu-wrap').forEach(function(w){
    if (w.__v26) return;
    w.__v26 = true;
    var head = w.querySelector('button, summary');
    if (!head) return;
    head.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      w.classList.toggle('v26-open');
    }, true);
  });
}

/* =================================================================== 2
   GROUP NAV RELIABILITY

   The flat fourteen-pill row in the screenshots is what shows when the
   grouped nav has not installed — the context-tab filter never runs, so
   every tab stays visible at once. The installer is re-driven until the
   nav is actually in the document, and the filter re-applied whenever
   the tab row is rebuilt underneath it.
   =================================================================== */
function navReady(){
  return !!document.querySelector('#v23SuitePrimaryNav')
      && !!document.querySelector('#suite-root .tabs.v23-context-tabs');
}
function nudgeNav(){
  if (navReady()) return true;
  var tabs = document.querySelector('#suite-root .tabs');
  if (!tabs) return false;
  /* v23 installs from its own poll; give it the class it keys off so a
     rebuilt row is recognised on the next pass rather than staying flat */
  if (!tabs.classList.contains('v23-context-tabs') && document.querySelector('#v23SuitePrimaryNav'))
    tabs.classList.add('v23-context-tabs');
  return navReady();
}

/* =================================================================== 3
   FREE-FORM SWEEP

   Numeric inputs reject "$550,000" at the browser level, so free-form
   means converting the type. Earlier layers do this, but chrome rendered
   after they ran — the rebuilt scenario bar, anything inside the new
   menus — arrives as type=number again. This re-converts on a mutation
   observer so newly rendered controls are covered too.

   Mode toggles stay as selects on purpose: a two-state control is not a
   data field, and making it free text is how a house number ended up in
   "Do we have an address?".
   =================================================================== */
function freeform(root){
  $$('input[type=number]', root || document).forEach(function(el){
    if (el.__v26ff) return;
    el.__v26ff = true;
    var step = el.getAttribute('step');
    el.type = 'text';
    el.inputMode = 'decimal';
    if (step) el.dataset.step = step;
    el.addEventListener('input', function(){
      if (/[$,\s]/.test(el.value)) {
        var p = el.selectionStart, before = el.value.length;
        el.value = el.value.replace(/[$,\s]/g,'');
        try { el.setSelectionRange(Math.max(0, p - (before - el.value.length)), Math.max(0, p - (before - el.value.length))); } catch(e){}
      }
    }, true);
  });
}
function watchForNewFields(){
  if (document.__v26obs) return;
  document.__v26obs = true;
  var pending = null;
  new MutationObserver(function(muts){
    for (var i=0;i<muts.length;i++){
      if (muts[i].addedNodes && muts[i].addedNodes.length){
        clearTimeout(pending);
        pending = setTimeout(function(){ try { freeform(document); } catch(e){} }, 60);
        return;
      }
    }
  }).observe(document.documentElement, { childList:true, subtree:true });
}

/* =================================================================== 4
   WIRING
   =================================================================== */
freeform(document);
watchForNewFields();
setInterval(function(){
  try { sweepMenus(); tameNestedMenus(); } catch(e){}
  try { nudgeNav(); } catch(e){}
}, 700);
})();
