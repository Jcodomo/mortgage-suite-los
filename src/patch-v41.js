/* =====================================================================
   Release 41 — the suite at the calculator's dimensions, two rows of
   navigation, icons that stay, a rail three times as long, six more
   colourways, and the small breakages the screenshots showed.
   Additive over 40.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function N(v){ v = parseFloat(String(v==null?'':v).replace(/[$,%\s]/g,'')); return isFinite(v)?v:0; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function usd(v,dp){ dp=dp===undefined?0:dp; var n=N(v);
  return (n<0?'\u2212':'')+'$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp}); }
function pct(v,dp){ dp=dp===undefined?2:dp; var n=N(v); if (Math.abs(n)<=1) n*=100; return n.toFixed(dp)+'%'; }
function get(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
function set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function setClass(el,c,on){ if (el && el.classList.contains(c)!==!!on) el.classList.toggle(c,!!on); }
function store(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
var V41 = window.V41 = { version:'41.0' };

/* =================================================================== 1
   THE ICON BAR — its own home, its own size

   The screenshot showed the header icons crushed to slivers. Release 40
   appended its bar into whichever of two earlier containers existed,
   and both are governed by other layers' flex and band rules. The bar
   now lives as the last child of the masthead with every dimension
   stated on its own elements, so no ancestor rule can size it.

   The appearance panel is closed with the `hidden` attribute as well as
   a class, so an unloaded stylesheet cannot leave its swatches painted
   inline.
   =================================================================== */
function homeBar(){
  var bar = $('v40Bar'), top = document.querySelector('#suite-root .topbar'); if (!bar || !top) return false;
  if (bar.parentNode !== top) top.appendChild(bar);
  else if (top.lastElementChild !== bar) top.appendChild(bar);
  setClass(bar, 'v41-bar', true);
  var look = $('v39Look'); if (look) look.hidden = !look.classList.contains('on');
  var pop  = $('v40Pop');  if (pop)  pop.hidden  = !pop.classList.contains('on');
  return true;
}

/* =================================================================== 2
   TWO ROWS OF NAVIGATION

   The washed-out "All sections · Quote · EXPAND ALL" strip is release
   3's section sub-strip. Release 4 removes it on a poll while release 3
   re-renders it, so it flickers in unthemed. It duplicates the context
   tabs above it. Removed on sight here and hidden in CSS as well, so the
   suite is the group nav and the context tabs, nothing under them.
   =================================================================== */
function twoRows(){ $$('.los-strip').forEach(function(s){ s.remove(); }); }

/* =================================================================== 3
   THE RAIL — the "More detail" disclosure opens by default now, and the
   rows added in release 40 get company: value fit, warnings, the lock,
   the appraisal state, and the income the file would need.
   =================================================================== */
function outRow(label, value, mode, note){
  if (value == null || value === '' || value === '\u2014') return '';
  return '<div class="out v40-out" data-out="' + esc(label) + '" data-v35-label="' + esc(label) + '" data-v35-mode="' + esc(mode||'') + '">'
    + '<div class="l">' + esc(label) + (note ? '<small>' + esc(note) + '</small>' : '') + '</div><div class="v">' + value + '</div></div>';
}
function sec(t){ return '<div class="sec-head v40-sec">' + esc(t) + '</div>'; }
V41.railHtml = function(){
  var s = store(); if (!s) return '';
  var o = s.outputs || {}, i = s.activeInputs || {}, a = o.aus || {}, p = o.payment || {}, value = o.value || {}, mmw = o.mmw || {};
  var h = '';
  var warn = (o.warnings || []).filter(function(w){ return w.severity === 'error' || w.severity === 'warning' || w.blocking; });
  h += sec('Status');
  h += outRow('Blocking warnings', String(warn.filter(function(w){ return w.blocking || w.severity === 'error'; }).length), 'advanced');
  if (warn.length) h += outRow('All warnings', String(warn.length), 'advanced', warn[0] && warn[0].message ? String(warn[0].message).slice(0,60) : '');
  h += outRow('Appraisal', N(value.afterRepairValue) || N(i.asIsValue) ? 'on file' : 'pending', 'maxmortgage');
  if (N(mmw.valueFitPct)) h += outRow('Value fit', pct(mmw.valueFitPct,2), 'maxmortgage', mmw.valueFitPass ? 'within the cap' : 'over the cap');
  var lockExp = get('v5LockExt.v1', ''); try { var lx = JSON.parse(lockExp||'null'); if (lx && lx.expire) h += outRow('Rate lock expires', esc(lx.expire), 'closing'); } catch(e){}
  var hp = N(a.housingPayment || p.totalMonthlyPayment), debts = N(a.totalMonthlyLiabilities);
  if (hp){
    h += sec('Income needed');
    h += outRow('FHA (31 / 43)', usd(Math.max(hp/.31, (hp+debts)/.43)) + '/mo', 'income');
    h += outRow('Conventional (36 / 50)', usd(Math.max(hp/.36, (hp+debts)/.50)) + '/mo', 'income');
    h += outRow('VA (41)', usd((hp+debts)/.41) + '/mo', 'income', 'residual income also applies');
  }
  return h;
};
function paintRail(){
  var rail = document.querySelector('#suite-root .cols-main > .rail'); if (!rail) return false;
  var card = rail.querySelector(':scope > .card'), body = card && card.querySelector(':scope > .body'); if (!body) return false;
  var html = V41.railHtml(), host = $('v41Rail');
  if (!host || !host.isConnected){ if (host) host.remove(); host = document.createElement('div'); host.id = 'v41Rail'; host.className = 'v40-rail';
    var after = $('v40Rail'); if (after && after.parentNode === body && after.nextSibling) body.insertBefore(host, after.nextSibling); else body.appendChild(host); }
  if (host.__sig !== html){ host.__sig = html; host.innerHTML = html; }
  var more = $('v39More'); if (more && !more.__v41){ more.__v41 = true; if (get('los.v39.railMore', null) === null){ more.open = true; set('los.v39.railMore','1'); } }
  return true;
}

/* =================================================================== 4
   APPEARANCE — six more colourways in the panel
   =================================================================== */
function extendLook(){
  if (!window.V39 || V39.__v41) return;
  V39.__v41 = true;
  /* the panel reads THEME_META in v39's closure; re-render its swatch
     grid here with the fuller set */
  var META = {
    ledger:['Ledger','#0F2A4A','#EEF2F7'], slate:['Slate','#1E293B','#F1F5F9'], bank:['Bank','#14532D','#F0FDF4'],
    graphite:['Graphite','#111111','#F5F5F5'], terminal:['Terminal','#0B1220','#111A2B'],
    github:['GitHub','#24292f','#ffffff'], 'github-dark':['GitHub dark','#0d1117','#161b22'],
    lightgray:['Light gray','#1f2328','#e9ecef'], cloudgrey:['Cloud grey','#2b3440','#dfe4ea'],
    nord:['Nord','#2e3440','#3b4252'], dracula:['Dracula','#282a36','#44475a'],
    solarized:['Solarized','#586e75','#fdf6e3'], linear:['Linear','#0f1116','#1a1d24']
  };
  var orig = V39.toggleLook;
  V39.toggleLook = function(){
    orig.apply(this, arguments);
    var p = $('v39Look'); if (!p || !p.classList.contains('on')) return;
    var grid = p.querySelector('.v39-look-grid'); if (!grid) return;
    var theme = document.documentElement.dataset.v24Theme || get('los.v24.theme','terminal');
    grid.innerHTML = Object.keys(META).map(function(k){ var m = META[k];
      return '<button type="button" class="v39-swatch' + (theme===k?' on':'') + '" title="' + esc(m[0]) + '" onclick="V39.applyLook(\'' + k + '\',null,null)">'
        + '<i style="background:' + m[1] + '"></i><i style="background:' + m[2] + '"></i><span>' + esc(m[0]) + '</span></button>'; }).join('');
  };
}

/* =================================================================== 5
   WIRING
   =================================================================== */
function tick(){
  try { homeBar(); } catch(e){}
  try { twoRows(); } catch(e){}
  try { paintRail(); } catch(e){}
  try { extendLook(); } catch(e){}
}
if (window.LOS_SCHEDULER && LOS_SCHEDULER.add) LOS_SCHEDULER.add(tick, 1200); else setInterval(tick, 900);
setTimeout(tick, 200);
})();
