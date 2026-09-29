
/* =====================================================================
   Release 52 — one owner for the navigation icons.

   The icons are drawn two incompatible ways at once. Release 23 draws
   them as CSS pseudo-elements at fixed pixel coordinates for a 17px
   box. Release 40 replaces the span's contents with an SVG and release
   48 suppresses the pseudo-art wherever its nav class is present.

   Two faults follow:

   1. Release 40's GROUP_ICON map covers six groups — file, loan, costs,
      underwriting, results, full. The nav now builds eight: documents,
      income and qualification were added later and are not in the map.
      Those buttons get no SVG, and the pseudo-art that would have drawn
      them is suppressed, so they render as EMPTY BOXES.

   2. Seven layers size the same span, from 15px to 29px, several with
      !important. The last one standing is 15px — but the pseudo-art is
      laid out with absolute insets for 17px, so where it does draw it
      is cropped.

   This layer owns the icons: every group gets an SVG from one set, the
   legacy art is off everywhere in the primary nav, and the box is sized
   once with box-sizing so no padding rule can squeeze the glyph.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function setClass(el,c,on){ if (el && el.classList.contains(c)!==!!on) el.classList.toggle(c,!!on); }
var V52 = window.V52 = { version:'52.0' };

/* One set, GitHub octicons on the 16 grid, every group covered. */
var ICONS = {
  file:        '<svg viewBox="0 0 16 16"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1Z"/></svg>',
  loan:        '<svg viewBox="0 0 16 16"><path d="M6.906.664a1.749 1.749 0 0 1 2.187 0l5.25 4.2c.415.332.657.835.657 1.367v7.019A1.75 1.75 0 0 1 13.25 15h-3.5a.75.75 0 0 1-.75-.75V9H7v5.25a.75.75 0 0 1-.75.75h-3.5A1.75 1.75 0 0 1 1 13.25V6.23c0-.531.242-1.034.657-1.366Z"/></svg>',
  costs:       '<svg viewBox="0 0 16 16"><path d="M8 0c4.42 0 8 1.343 8 3v10c0 1.657-3.58 3-8 3s-8-1.343-8-3V3c0-1.657 3.58-3 8-3ZM1.5 3c0 .29.363.905 1.756 1.4C4.507 4.85 6.15 5.15 8 5.15s3.493-.3 4.744-.75C14.137 3.905 14.5 3.29 14.5 3s-.363-.905-1.756-1.4C11.493 1.15 9.85.85 8 .85s-3.493.3-4.744.75C1.863 2.095 1.5 2.71 1.5 3Zm0 3v2c0 .29.363.905 1.756 1.4 1.251.45 2.894.75 4.744.75s3.493-.3 4.744-.75C14.137 8.905 14.5 8.29 14.5 8V6c-1.457.905-3.913 1.5-6.5 1.5S2.957 6.905 1.5 6Zm0 5v2c0 .29.363.905 1.756 1.4 1.251.45 2.894.75 4.744.75s3.493-.3 4.744-.75c1.393-.495 1.756-1.11 1.756-1.4v-2c-1.457.905-3.913 1.5-6.5 1.5s-5.043-.595-6.5-1.5Z"/></svg>',
  underwriting:'<svg viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.751.751 0 0 0-.018-1.042.751.751 0 0 0-1.042-.018L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z"/></svg>',
  results:     '<svg viewBox="0 0 16 16"><path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"/></svg>',
  full:        '<svg viewBox="0 0 16 16"><path d="M1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0ZM1.5 1.75v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25ZM4 5h8v1.5H4Zm0 3h8v1.5H4Zm0 3h5v1.5H4Z"/></svg>',
  /* the three that had none */
  documents:   '<svg viewBox="0 0 16 16"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z"/></svg>',
  income:      '<svg viewBox="0 0 16 16"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm.75 2.5a.75.75 0 0 0-1.5 0V3c-1.53.164-2.5 1.113-2.5 2.5 0 1.6 1.35 2.115 2.5 2.4v2.55c-.55-.108-1-.35-1-.95a.75.75 0 0 0-1.5 0c0 1.387.97 2.336 2.5 2.5v.5a.75.75 0 0 0 1.5 0V13c1.53-.164 2.5-1.113 2.5-2.5 0-1.6-1.35-2.115-2.5-2.4V5.55c.55.108 1 .35 1 .95a.75.75 0 0 0 1.5 0c0-1.387-.97-2.336-2.5-2.5Z"/></svg>',
  qualification:'<svg viewBox="0 0 16 16"><path d="M4.75 0h6.5c.966 0 1.75.784 1.75 1.75v12.5a.75.75 0 0 1-1.2.6L8 12.4l-3.8 2.45a.75.75 0 0 1-1.2-.6V1.75C3 .784 3.784 0 4.75 0Zm6.5 1.5h-6.5a.25.25 0 0 0-.25.25v11.13l3.05-1.97a.75.75 0 0 1 .9 0l3.05 1.97V1.75a.25.25 0 0 0-.25-.25Z"/></svg>'
};
/* labels, for a group whose key this layer has never seen */
var BY_LABEL = [
  [/document|worksheet|ocr/i,'documents'], [/income|w-?2|salary/i,'income'],
  [/qualif|underwrit/i,'underwriting'], [/cost|closing|escrow/i,'costs'],
  [/loan|renovation|mortgage/i,'loan'], [/result|scenario|summary/i,'results'],
  [/full|all pages/i,'full'], [/file|quote|setup|propert/i,'file']
];
V52.iconFor = function(group, label){
  if (group && ICONS[group]) return ICONS[group];
  var t = String(label||'');
  for (var i=0;i<BY_LABEL.length;i++) if (BY_LABEL[i][0].test(t)) return ICONS[BY_LABEL[i][1]];
  return ICONS.file;
};
V52.missing = function(mapped, built){
  return built.filter(function(g){ return mapped.indexOf(g) < 0; });
};

function paint(){
  var navs = $$('#v23SuitePrimaryNav, #v23CalcPrimaryNav, .v23-primary-nav');
  if (!navs.length) return false;
  navs.forEach(function(nav){
    setClass(nav, 'v52-nav', true);
    $$('button', nav).forEach(function(b){
      var span = b.querySelector('.v23-nav-icon');
      if (!span){
        span = document.createElement('span'); span.className = 'v23-nav-icon';
        b.insertBefore(span, b.firstChild);
      }
      var group = b.dataset.group || '';
      var label = (b.textContent || '').trim();
      var want = V52.iconFor(group, label);
      /* write only when it differs: this runs on a poll */
      if (span.__v52 !== want){ span.__v52 = want; span.innerHTML = want; }
      setClass(span, 'v52-ic', true);
    });
  });
  return true;
}
function tick(){ try { paint(); } catch(e){} }
if (window.LOS_SCHEDULER && LOS_SCHEDULER.add) LOS_SCHEDULER.add(tick, 1200); else setInterval(tick, 900);
setTimeout(tick, 200); tick();
})();

/* =====================================================================
   Release 53.1.1 — Loan Suite workspace recovery.

   The retained Full-form layers intentionally hide the normal screen while
   their continuous worksheet is open. A stale class left behind during a
   browser restore could leave that rule active after the worksheet itself
   had been removed, producing a correctly rendered shell with an empty
   workspace. Recover only from that impossible state; a visible Full
   worksheet is never touched.
   ===================================================================== */
(function(){
"use strict";
function suiteRequested(){
  try { return (new URLSearchParams(location.search)).get('app') === 'suite'; }
  catch(e) { return false; }
}
function restoreWorkspace(){
  if (!suiteRequested()) return false;
  var root = document.getElementById('suite-root');
  var body = document.getElementById('screen-body');
  if (!root || !body) return false;
  var full = document.getElementById('v25FullSheet');
  var staleFull = root.classList.contains('v25-full-active') || root.classList.contains('v251-full-active');
  var fullVisible = !!(full && full.offsetParent !== null);
  if (staleFull && !fullVisible) {
    root.classList.remove('v25-full-active','v251-full-active');
    if (window.V25) V25.fullActive = false;
    if (window.V251) V251.fullActive = false;
  }
  var visible = Array.prototype.some.call(body.children, function(node){
    return node.id !== 'v12Modal' && node.offsetParent !== null;
  });
  if (visible || fullVisible) return false;
  var suite = window.mortgageSuite;
  if (!suite || !suite.store) return false;
  try {
    suite.store.setMode('quote');
    if (suite.app && suite.app.renderScreen) suite.app.renderScreen();
    root.dataset.v531WorkspaceRecovered = '1';
    return true;
  } catch(e) { return false; }
}
/* Let the base suite and retained add-on layers mount first. The duplicate
   timeout covers delayed browser-session restoration without a repaint loop. */
setTimeout(restoreWorkspace, 700);
setTimeout(restoreWorkspace, 1800);
window.V53 = window.V53 || {};
window.V53.restoreWorkspace = restoreWorkspace;
})();

