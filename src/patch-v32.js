/* =====================================================================
   v32 — one owner for the header row, uniform controls, snug layout.

   Releases 27 through 31 each painted part of the header. Even with the
   worst races removed, several of them still wrote a class or a label on
   their own timer, and any two writers that disagree produce exactly the
   flicker being reported. Rather than keep chasing them one at a time,
   this takes the row: it is the only thing that decides what those
   controls say and how they look, and it writes ONLY when the current
   value differs, so a stable header does no DOM work at all.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
var V32 = window.V32 = { version:'32.0' };

/* Write-only-on-change. Every glitch in this header came from something
   assigning a value 80 times a minute that was already correct. */
function setText(el, t){ if (el && el.textContent !== t) el.textContent = t; }
function setClass(el, c, on){ if (el && el.classList.contains(c) !== !!on) el.classList.toggle(c, !!on); }
function setAttr(el, k, v){ if (el && el.getAttribute(k) !== v) el.setAttribute(k, v); }

/* =================================================================== 1
   THE ROW

   Order and labels are declared here once. Nothing else is permitted to
   relabel these; the earlier layers' painters are neutralised below.
   =================================================================== */
var ROW = [
  { id:'v251HeaderStats' },
  { id:'v30PrintGen',    label:'Print / Generate', kind:'primary' },
  { id:'v24LiveSummary', label:'Live comparison',  kind:'plain' },
  { id:'v25FullForm',    label:'Full form',        kind:'plain' },
  { id:'v23SuiteActions', kind:'menu' },
  { id:'v24LoanTools',    kind:'menu' },
  { id:'v23QuickSave',   label:'Save',             kind:'primary' }
];
function paintRow(){
  var actions = $('v25HeaderActions'); if (!actions) return false;
  setClass(actions, 'v32-row', true);

  ROW.forEach(function(spec){
    var el = $(spec.id); if (!el) return;
    setClass(el, 'v32-btn', spec.kind !== undefined && spec.id !== 'v251HeaderStats');
    if (spec.kind) setClass(el, 'v32-' + spec.kind, true);
    /* strip the state classes earlier layers used to tint this one */
    setClass(el, 'v27-on', false);
    if (spec.label){
      /* a menu keeps its own summary markup; only plain buttons get a
         label written, and only when it is actually wrong */
      if (spec.kind !== 'menu'){
        var target = el.querySelector('span:not(.v23-nav-icon)') || el;
        if (target === el && el.children.length === 0) setText(el, spec.label);
        else if (target !== el) setText(target, spec.label);
        setAttr(el, 'title', spec.label);
      }
    }
  });

  /* order, only if wrong — same guard as release 28 */
  var want = ROW.map(function(s){ return $(s.id); })
               .filter(function(n){ return n && n.parentNode === actions; });
  var have = Array.prototype.filter.call(actions.children, function(n){ return want.indexOf(n) >= 0; });
  var same = have.length === want.length && have.every(function(n,i){ return n === want[i]; });
  if (!same) want.forEach(function(n){ actions.appendChild(n); });
  return true;
}

/* =================================================================== 2
   NEUTRALISE THE OTHER PAINTERS

   These are the functions that were still writing to the same controls.
   They are replaced with no-ops rather than deleted, so anything that
   calls them still finds a function and nothing throws.
   =================================================================== */
function standDown(){
  if (V32.__down) return;
  V32.__down = true;
  /* v27 tinted the live button from its own stored state */
  try { if (window.V27 && V27.paintLive) V27.paintLive = function(){}; } catch(e){}
  /* v28 relabelled it on its own pass */
  try { if (window.V28 && V28.repurposeLive) V28.repurposeLive = function(){}; } catch(e){}
}

/* =================================================================== 3
   UNIFORM CONTROLS ABOVE THE TABS

   The scenario row and the header row were styled by different layers
   and ended up with three button treatments in the same 90 pixels — a
   filled one, an outlined one and a bare text one. Everything above the
   tab strip gets the same shape here; the CSS does the work, this just
   tags the scenario row's buttons so it can reach them.
   =================================================================== */
function tagScenarioRow(){
  var top = document.querySelector('#suite-root .topbar'); if (!top) return false;
  var bar = document.querySelector('#suite-root .v24-retired-toolbar, #suite-root .toolbar');
  [top, bar].forEach(function(scope){
    if (!scope) return;
    $$('button, .v23-action-menu > summary', scope).forEach(function(b){
      if (b.closest('#v25HeaderActions')) return;      /* the row owns those */
      setClass(b, 'v32-ctl', true);
    });
  });
  return true;
}

setInterval(function(){
  try { standDown(); paintRow(); tagScenarioRow(); } catch(e){}
}, 800);
standDown();
})();
