/* =====================================================================
   Release 39 — the reference look, with everything the build now does.

   A compact live summary where every line goes somewhere; one button
   system; the header cut to five controls; a GitHub colourway; one
   appearance panel instead of three cycle buttons; every destination
   its own page; address search on every address field.
   Additive over 38.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function G(n){ try { return (0, eval)(n); } catch(e){ return undefined; } }
function norm(s){ return String(s||'').replace(/\s+/g,' ').trim(); }
function key(s){ return norm(s).toUpperCase(); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function get(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
function set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function setClass(el,c,on){ if (el && el.classList.contains(c)!==!!on) el.classList.toggle(c,!!on); }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }
function store(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
var V39 = window.V39 = { version:'39.0' };

/* =================================================================== 1
   LIVE SUMMARY — the reference layout, every line live

   The reference shows six sections and nothing else. Release 36 already
   trims the engine's rail to that set; what made it busy afterwards was
   the planning block release 35 added below it and the extras release
   38 folded in. Both are useful and neither belongs in view by default.

   They collapse into one "More detail" disclosure under the checks,
   closed until opened, and the choice is remembered. The six sections
   above are untouched; every one of their rows already opens the edit
   popout through release 35's delegation, and the rows in the
   disclosure do the same.

   The scenario line release 5 inserted under the title is retired: it
   repeated the header badge and the scenario picker, and its trailing
   "Conventional – Conventional" was the program label being appended
   to a name that already ended with it.
   =================================================================== */
var MORE_KEY = 'los.v39.railMore';
function compactRail(){
  var rail = document.querySelector('#suite-root .cols-main > .rail'); if (!rail) return false;
  var card = rail.querySelector(':scope > .card'), body = card && card.querySelector(':scope > .body');
  if (!card || !body) return false;
  var stale = card.querySelector('.v5-scenline'); if (stale) stale.remove();
  var live = $('v35LiveDetails'); if (!live) return true;
  var wrap = $('v39More');
  if (!wrap){
    wrap = document.createElement('details');
    wrap.id = 'v39More'; wrap.className = 'v39-more';
    wrap.innerHTML = '<summary><span>More detail</span><small>planning, ratios, insurance, reserves</small></summary>';
    wrap.open = get(MORE_KEY,'0') === '1';
    wrap.addEventListener('toggle', function(){ set(MORE_KEY, wrap.open ? '1' : '0'); });
    body.appendChild(wrap);
  }
  if (live.parentNode !== wrap) wrap.appendChild(live);
  if (wrap.parentNode !== body || body.lastElementChild !== wrap) body.appendChild(wrap);
  setClass(card, 'v39-rail', true);
  return true;
}

/* =================================================================== 2
   THE HEADER — five controls

     Actions · File & view · Documents · Loan tools · Live

   Release 35 collected everything behind one Actions button. That was
   the right call against the flicker, and a 20-entry menu is the wrong
   size for daily use. The list is split by what people are doing:
   file-level work, the document generators, the underwriting tools, and
   the comparison. Each is a small panel; each entry still clicks the
   real control, which stays in the DOM stowed.
   =================================================================== */
var PANELS = [
  { id:'fileview', label:'File & view', icon:'folder',
    pick:['SAVE','NEW','RESET','SAVE SCENARIO','COMPARE','EXPORT SCENARIO JSON','IMPORT SCENARIO JSON',
          'IMPORT / AI','FULL FORM','ALL PAGES','PRINT / PDF','COPY BORROWER QUOTE','THEME & INPUTS'] },
  { id:'docs',     label:'Documents',   icon:'doc',
    pick:['DOCUMENTS & OCR','PRINT / GENERATE','DRAFT LE','PRINT SUMMARY','INCOME REPORT','P&L',
          'PMI WORKSHEET','RENO FEES','DRAFT SCHEDULE C'] },
  { id:'tools',    label:'Loan tools',  icon:'tool',
    pick:['CREDIT','CREDIT REVIEW','RECALCULATE','PMI / FHA MIP','RENOVATION FEES','PROFIT & LOSS','LIVE COMPARISON'] }
];
var ICONS = {
  folder:'<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"/></svg>',
  doc:'<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914Z"/></svg>',
  tool:'<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M5.433 2.304A4.494 4.494 0 0 0 3.5 6c0 1.598.832 3.002 2.09 3.802.518.328.929.923.902 1.64v.008l-.164 3.337a.75.75 0 0 1-1.498-.073l.163-3.33c.002-.085-.05-.216-.207-.316A5.996 5.996 0 0 1 2 6a5.993 5.993 0 0 1 2.567-4.92 .75.75 0 0 1 .866 1.224Zm5.134 0a.75.75 0 0 1 .866-1.224A5.993 5.993 0 0 1 14 6a5.996 5.996 0 0 1-2.786 5.068c-.157.1-.209.231-.207.316l.163 3.33a.75.75 0 1 1-1.498.073l-.164-3.337v-.008c-.027-.717.384-1.312.902-1.64A4.496 4.496 0 0 0 12.5 6a4.494 4.494 0 0 0-1.933-3.696Z"/></svg>',
  live:'<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"/></svg>',
  actions:'<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/></svg>'
};
/* every real control the earlier layers left in the DOM, by label */
function inventory(){
  var pools = ['#v23SuiteActions','#v24LoanTools','#v25HeaderActions','#v34Bar','#suite-root .toolbar','#suite-root .topbar'];
  var out = {}, seen = {};
  pools.forEach(function(sel){
    $$(sel + ' button, ' + sel + ' a').forEach(function(b){
      if (b.closest('#v39Bar') || b.closest('.v39-panel')) return;
      if (b.id && /^v39/.test(b.id)) return;
      var label = key(b.textContent).replace(/\s*\u25BE\s*$/,'');
      if (!label || label.length > 40 || seen[label]) return;
      seen[label] = true; out[label] = { el:b, label:norm(b.textContent).replace(/\s*\u25BE\s*$/,'') };
    });
  });
  return out;
}
V39.run = function(pid, label){
  var inv = inventory(), hit = inv[label];
  V39.closeAll();
  if (!hit) return say('Not available', label + ' is not on this build.', 'warn', 5000);
  setTimeout(function(){ try { hit.el.click(); } catch(e){} }, 40);
};
V39.closeAll = function(){ $$('.v39-panel.on').forEach(function(p){ p.classList.remove('on'); });
  $$('#v39Bar [aria-expanded="true"]').forEach(function(b){ b.setAttribute('aria-expanded','false'); }); };
V39.toggle = function(pid){
  var p = $('v39Panel-' + pid); if (!p) return;
  var open = p.classList.contains('on');
  V39.closeAll();
  if (open) return;
  var inv = inventory(), spec = PANELS.filter(function(x){ return x.id === pid; })[0];
  var items = spec.pick.filter(function(k){ return inv[k]; });
  /* anything real that no panel claims lands under the first panel so a
     feature cannot go missing */
  if (pid === 'fileview'){
    var claimed = {}; PANELS.forEach(function(x){ x.pick.forEach(function(k){ claimed[k] = 1; }); });
    Object.keys(inv).forEach(function(k){ if (!claimed[k] && !/^(ACTIONS|LIVE|LIVE SUMMARY)$/.test(k)) items.push(k); });
  }
  p.innerHTML = '<div class="v39-panel-hd">' + esc(spec.label) + '</div>'
    + (items.length ? '<div class="v39-panel-items">' + items.map(function(k){
        return '<button type="button" class="v39-item" onclick="V39.run(\'' + pid + '\',\'' + esc(k) + '\')">' + esc(inv[k].label) + '</button>';
      }).join('') + '</div>' : '<div class="v39-empty">Nothing here on this build.</div>');
  p.classList.add('on');
  var b = $('v39Btn-' + pid); if (b) b.setAttribute('aria-expanded','true');
};
V39.live = function(){
  var inv = inventory(), t = inv['LIVE COMPARISON'] || inv['COMPARE'];
  if (t) return t.el.click();
  if (window.V14 && V14.open) { try { return V14.open('v14CompareModal'); } catch(e){} }
  say('Comparison is not loaded yet', '', 'warn', 4000);
};
function buildBar(){
  var host = document.querySelector('#suite-root .v34-right') || $('v25HeaderActions'); if (!host) return false;
  if ($('v39Bar')) return true;
  var bar = document.createElement('div'); bar.id = 'v39Bar'; bar.className = 'v39-bar no-print';
  var html = '';
  html += '<button type="button" class="v39-btn primary" id="v39Btn-actions" onclick="V35.toggle&&V35.toggle()">' + ICONS.actions + '<span>Actions</span></button>';
  PANELS.forEach(function(p){
    html += '<div class="v39-wrap"><button type="button" class="v39-btn" id="v39Btn-' + p.id + '" aria-haspopup="true" aria-expanded="false" '
      + 'onclick="V39.toggle(\'' + p.id + '\')">' + ICONS[p.icon] + '<span>' + esc(p.label) + '</span></button>'
      + '<div class="v39-panel" id="v39Panel-' + p.id + '"></div></div>';
  });
  html += '<button type="button" class="v39-btn" id="v39Btn-live" onclick="V39.live()">' + ICONS.live + '<span>Live</span></button>';
  bar.innerHTML = html;
  host.appendChild(bar);
  /* v35's button is superseded by the first slot here */
  var old = $('v35Btn'); if (old) old.classList.add('v39-stowed');
  return true;
}
document.addEventListener('mousedown', function(e){
  if (e.target.closest('.v39-panel') || e.target.closest('#v39Bar')) return;
  V39.closeAll();
});
document.addEventListener('keydown', function(e){ if (e.key === 'Escape') V39.closeAll(); });

/* =================================================================== 3
   APPEARANCE — one panel

   Three cycle buttons (theme, surface, input tone) meant nine clicks to
   see the options and no way to know which you were on. One popover
   lists all of them as buttons, the current one marked. Adds the GitHub
   pair: `github` is GitHub's light palette, `github-dark` its dark one,
   both registered with release 24's theme list so the timer that
   re-applies the stored theme accepts them.
   =================================================================== */
var THEME_META = {
  ledger:['Ledger','#0F2A4A','#EEF2F7'], slate:['Slate','#1E293B','#F1F5F9'], bank:['Bank','#14532D','#F0FDF4'],
  graphite:['Graphite','#111111','#F5F5F5'], terminal:['Terminal','#0B1220','#111A2B'],
  github:['GitHub','#24292f','#ffffff'], 'github-dark':['GitHub dark','#0d1117','#161b22']
};
V39.applyLook = function(theme, surface, tone){
  try { if (theme && window.V24 && V24.setTheme) V24.setTheme(theme); } catch(e){}
  try { if (surface){ document.documentElement.dataset.v25Surface = surface; set('los.v25.surface', surface);
        if (window.LOS && LOS.setSkin) LOS.setSkin(surface === 'light' ? 'light' : (surface === 'oled' ? 'oled' : 'dark')); } } catch(e){}
  try { if (tone && window.V24 && V24.setInput) V24.setInput(tone); } catch(e){}
  paintLook();
};
function paintLook(){
  var p = $('v39Look'); if (!p) return;
  var root = document.documentElement;
  var theme = root.dataset.v24Theme || get('los.v24.theme','terminal');
  var surf  = root.dataset.v25Surface || get('los.v25.surface','dark');
  var tone  = root.dataset.inputTone  || get('los.v24.inputTone','ink');
  var html = '<div class="v39-look-hd">Appearance</div>'
    + '<div class="v39-look-sec">Surface</div><div class="v39-look-row">'
    + [['light','Light'],['dark','Dark'],['oled','OLED']].map(function(s){
        return '<button type="button" class="v39-chip' + (surf===s[0]?' on':'') + '" onclick="V39.applyLook(null,\'' + s[0] + '\',null)">' + s[1] + '</button>'; }).join('')
    + '</div><div class="v39-look-sec">Theme</div><div class="v39-look-grid">'
    + Object.keys(THEME_META).map(function(k){ var m = THEME_META[k];
        return '<button type="button" class="v39-swatch' + (theme===k?' on':'') + '" title="' + esc(m[0]) + '" onclick="V39.applyLook(\'' + k + '\',null,null)">'
          + '<i style="background:' + m[1] + '"></i><i style="background:' + m[2] + '"></i><span>' + esc(m[0]) + '</span></button>'; }).join('')
    + '</div><div class="v39-look-sec">Input fields</div><div class="v39-look-row">'
    + [['paper','Paper'],['mist','Mist'],['mint','Mint'],['sand','Sand'],['ink','Ink']].map(function(t){
        return '<button type="button" class="v39-chip' + (tone===t[0]?' on':'') + '" onclick="V39.applyLook(null,null,\'' + t[0] + '\')">' + t[1] + '</button>'; }).join('')
    + '</div>';
  if (p.__sig !== html){ p.__sig = html; p.innerHTML = html; }
}
V39.toggleLook = function(){
  var p = $('v39Look'); if (!p) return;
  var open = p.classList.contains('on'); V39.closeAll(); if (open) return;
  paintLook(); p.classList.add('on');
};
function buildLook(){
  var app = $('v23Appearance'); if (!app) return false;
  if ($('v39LookBtn')) return true;
  var b = document.createElement('button');
  b.type = 'button'; b.id = 'v39LookBtn'; b.className = 'v39-btn v39-lookbtn';
  b.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 0a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 14.5V1.5a6.5 6.5 0 0 1 0 13Z"/></svg><span>Look</span>';
  b.setAttribute('aria-haspopup','true');
  b.onclick = function(e){ e.stopPropagation(); V39.toggleLook(); };
  app.appendChild(b);
  var p = document.createElement('div'); p.id = 'v39Look'; p.className = 'v39-panel v39-look';
  p.addEventListener('click', function(e){ e.stopPropagation(); });
  app.appendChild(p);
  /* the three cycle buttons are stowed, not removed */
  $$(':scope > button', app).forEach(function(x){ if (x !== b) setClass(x, 'v39-stowed', true); });
  return true;
}

/* =================================================================== 4
   EVERY DESTINATION IS ITS OWN PAGE

   Release 8 appended Taxes & Escrow under the Escrow screen; release 34
   kept it there. That is the "brings the page to the bottom of an
   already established page" case. Taxes is now a page of its own in the
   parked-panel stage, reached from the linked subnav beside Closing and
   Escrow, and every parked page scrolls to the top when it opens.
   =================================================================== */
function showParked(panelId){
  var sr = $('suite-root'); if (!sr) return;
  var cm = sr.querySelector('.cols-main'), stage = $('v8Stage');
  if (!stage){ stage = document.createElement('div'); stage.id = 'v8Stage'; if (cm) cm.parentNode.insertBefore(stage, cm.nextSibling); }
  var panel = $(panelId); if (!panel) return;
  if (panel.parentNode !== stage) stage.appendChild(panel);
  $$('#v8Stage .panel').forEach(function(p){ p.classList.toggle('active', p.id === panelId); });
  stage.style.display = ''; if (cm) cm.style.display = 'none';
  if (window.V8) V8.active = panelId;
  try { window.scrollTo({ top:0, behavior:'auto' }); } catch(e){ window.scrollTo(0,0); }
}
V39.goTaxes = function(){
  var host = $('v8TaxHost'); if (host) host.remove();
  var panel = $('panel-taxes');
  if (!panel){
    panel = document.createElement('div'); panel.id = 'panel-taxes'; panel.className = 'panel';
    panel.innerHTML = '<div id="taxBody"></div>';
  } else if (!$('taxBody')) panel.innerHTML = '<div id="taxBody"></div>';
  showParked('panel-taxes');
  try { if (window.TAXPRO) TAXPRO.render(); } catch(e){}
};
function taxesInSubnav(){
  var nav = $('v35LinkedSubnav'); if (!nav || nav.__v39) return;
  if (!/closing|escrow/i.test(nav.textContent)) return;
  nav.__v39 = true;
  var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Taxes & proration';
  b.onclick = V39.goTaxes; nav.appendChild(b);
}
/* the direct-nav buttons and Quote also land at the top of their page */
function scrollTopOnNav(){
  var nav = $('v23SuitePrimaryNav'); if (!nav || nav.__v39scroll) return;
  nav.__v39scroll = true;
  nav.addEventListener('click', function(e){
    if (e.target.closest('button')) setTimeout(function(){ try { window.scrollTo({top:0}); } catch(x){ window.scrollTo(0,0); } }, 60);
  }, true);
}

/* =================================================================== 5
   ADDRESS SEARCH ON EVERY ADDRESS FIELD

   Type into any address field and a suggestion list appears from
   OpenStreetMap's Nominatim — free, keyless, and answers cross-origin,
   which is what a local file can actually reach. USPS has no public
   address API without a registered account, so it is not pretended to.
   Picking a suggestion fills the address and, where they sit beside it
   and are empty, the city, state, ZIP and county. ZIP alone still runs
   the ZIP path from release 38.

   The full address is optional: three characters of a street is enough
   to start, and nothing is written until a suggestion is chosen.
   =================================================================== */
var NOMINATIM = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=us&limit=6&q=';
var addrTimer = null, addrSeq = 0;
function isAddressField(el){
  if (!el || el.tagName !== 'INPUT') return false;
  var k = ((el.id||'')+' '+(el.name||'')+' '+(el.placeholder||'')+' '+(el.dataset.path||'')+' '+(el.getAttribute('aria-label')||'')).toLowerCase();
  if (/zip|postal|email|phone|name$/.test(k)) return false;
  if (/address|street/.test(k)) return true;
  var lab = el.closest('label') || (el.id && document.querySelector('label[for="' + el.id + '"]'));
  return !!(lab && /address|street/i.test(lab.textContent) && !/email/i.test(lab.textContent));
}
function sib(el, re){
  var scope = el.closest('.card, .grid, form, fieldset, .card-body, section, .v35-quote-grid') || el.parentNode.parentNode;
  return $$('input, select', scope).filter(function(x){
    if (x === el) return false;
    var k = ((x.id||'')+' '+(x.name||'')+' '+(x.placeholder||'')+' '+(x.dataset.path||'')).toLowerCase();
    var lab = x.closest('label'); var lt = lab ? lab.textContent.toLowerCase() : '';
    return re.test(k) || re.test(lt);
  })[0];
}
function fillEmpty(el, v){
  if (!el || v == null || v === '') return;
  if (el.tagName === 'SELECT'){
    var opt = Array.prototype.filter.call(el.options, function(o){ return key(o.value) === key(v) || key(o.textContent) === key(v); })[0];
    if (!opt || el.value === opt.value) return; el.value = opt.value;
  } else { if (String(el.value||'').trim()) return; el.value = v; }
  el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
}
function closeAddr(){ var d = $('v39Addr'); if (d) d.remove(); }
function showAddr(el, results){
  closeAddr();
  if (!results.length) return;
  var d = document.createElement('div'); d.id = 'v39Addr'; d.className = 'v39-addr no-print';
  d.innerHTML = results.map(function(r,i){
    var a = r.address || {};
    var line = [a.house_number, a.road].filter(Boolean).join(' ');
    var rest = [a.city || a.town || a.village || a.hamlet, a.state, a.postcode].filter(Boolean).join(', ');
    return '<button type="button" data-i="' + i + '"><b>' + esc(line || r.display_name.split(',')[0]) + '</b><small>' + esc(rest) + '</small></button>';
  }).join('') + '<div class="v39-addr-src">OpenStreetMap \u00b7 pick one to fill the blanks</div>';
  document.body.appendChild(d);
  var r = el.getBoundingClientRect();
  d.style.left = Math.max(8, Math.min(innerWidth - 380, r.left + scrollX)) + 'px';
  d.style.top = (r.bottom + scrollY + 4) + 'px';
  d.style.minWidth = Math.max(280, r.width) + 'px';
  d.addEventListener('mousedown', function(e){ e.preventDefault(); });
  d.addEventListener('click', function(e){
    var b = e.target.closest('button[data-i]'); if (!b) return;
    var pick = results[+b.dataset.i], a = pick.address || {};
    var line = [a.house_number, a.road].filter(Boolean).join(' ') || pick.display_name.split(',')[0];
    var city = a.city || a.town || a.village || a.hamlet || '', st = a.state || '', zip = (a.postcode||'').slice(0,5), county = (a.county||'').replace(/ county$/i,'');
    el.value = line; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
    fillEmpty(sib(el, /\bcity\b|town/), city);
    fillEmpty(sib(el, /\bstate\b/), st);
    fillEmpty(sib(el, /zip|postal/), zip);
    fillEmpty(sib(el, /county/), county);
    var s = store();
    if (s && (el.dataset.path === 'propertyAddress' || /property address/i.test(el.placeholder||''))){
      try { if (zip && !s.activeInputs.zipCode) s.setField('zipCode', zip, 'Address search'); } catch(x){}
      try { if (st && !s.activeInputs.state) s.setField('state', st, 'Address search'); } catch(x){}
      try { if (county && st === 'New York' && !s.activeInputs.nyCounty) s.setField('nyCounty', county, 'Address search'); } catch(x){}
    }
    closeAddr();
    say('Address set', [line, city, st, zip].filter(Boolean).join(', ') + ' \u2014 blanks filled, typed values kept.', 'good', 5000);
  });
}
document.addEventListener('input', function(e){
  var el = e.target; if (!isAddressField(el)) return;
  var q = norm(el.value); clearTimeout(addrTimer);
  if (q.length < 4 || /^\d{5}$/.test(q)) { closeAddr(); return; }
  var mine = ++addrSeq;
  addrTimer = setTimeout(function(){
    fetch(NOMINATIM + encodeURIComponent(q), { headers:{ 'Accept':'application/json' } })
      .then(function(r){ return r.ok ? r.json() : []; })
      .then(function(list){ if (mine !== addrSeq || document.activeElement !== el) return; showAddr(el, (list||[]).filter(function(x){ return x.address; })); })
      .catch(function(){});
  }, 380);
}, true);
document.addEventListener('focusout', function(e){ if (isAddressField(e.target)) setTimeout(closeAddr, 150); }, true);
document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeAddr(); });

/* =================================================================== 6
   FREEFORM — one more sweep, for anything rendered since
   =================================================================== */
function freeform(){
  $$('input[type=number], input[type=date]').forEach(function(el){
    if (el.__v39) return; el.__v39 = true;
    if (el.type === 'date'){ var v = el.value; el.type = 'text'; el.placeholder = el.placeholder || 'mm/dd/yyyy'; if (v && window.V7 && V7.pretty) el.value = V7.pretty(v); }
    else { el.type = 'text'; el.inputMode = 'decimal'; }
  });
}

/* =================================================================== 7
   WIRING — through the shared scheduler
   =================================================================== */
function tick(){
  try { compactRail(); } catch(e){}
  try { buildBar(); buildLook(); paintLook(); } catch(e){}
  try { taxesInSubnav(); scrollTopOnNav(); } catch(e){}
  try { freeform(); } catch(e){}
}
if (window.LOS_SCHEDULER && LOS_SCHEDULER.add) LOS_SCHEDULER.add(tick, 1200); else setInterval(tick, 900);
setTimeout(tick, 240);
})();
