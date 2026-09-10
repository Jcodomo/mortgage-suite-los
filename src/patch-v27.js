/* =====================================================================
   v27 — live summary locked open, direct nav for the four workspaces,
         promoted actions, a two-state light/dark switch, and a working
         per-bedroom rent lookup.

   Additive. Nothing in any earlier layer is edited; everything here
   either sets a stored default, adds a control, or delegates a click to
   a control that already exists.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function norm(s){ return String(s||'').replace(/\s+/g,' ').trim().toUpperCase(); }
function get(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
function set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }
var V27 = window.V27 = { version:'27.0' };

/* =================================================================== 1
   LIVE SUMMARY — open and stays open

   v24 stored the state under los.v24.summaryOpen but defaulted it to
   '0', so every fresh browser opened with the rail closed and it had to
   be switched on again. The default is flipped to open; the stored
   value still wins, so switching it off is remembered exactly as before.
   =================================================================== */
var SUM_KEY = 'los.v24.summaryOpen';
function lockSummary(){
  /* Release 31 made the rail a permanent grid column with its own
     collapse state, so it owns this class outright. Leaving this
     function writing to it too meant one of them added the class and the
     other removed it on the next tick — which is what the rail popping
     in and out actually was. */
  if (window.V31) return true;
  var root = $('suite-root'); if (!root) return false;
  if (!V27.__sumInit){
    V27.__sumInit = true;
    if (get(SUM_KEY, null) === null) set(SUM_KEY, '1');   /* default: open */
  }
  var want = get(SUM_KEY,'1') === '1';
  if (root.classList.contains('v24-summary-open') !== want)
    root.classList.toggle('v24-summary-open', want);
  var b = $('v24LiveSummary');
  if (b){
    b.classList.toggle('v27-on', want);
    b.setAttribute('aria-pressed', want ? 'true' : 'false');
    b.title = want ? 'Live summary is pinned open \u2014 click to hide it'
                   : 'Live summary is hidden \u2014 click to pin it open';
  }
  return true;
}

/* =================================================================== 2
   DIRECT NAV for the four workspaces

   Documents & OCR, Mortgage Rates, Property and Advanced were each
   buried one level down inside a group, which meant two clicks to reach
   the four screens that get opened most often out of sequence. They now
   sit as their own buttons to the right of Full.

   The tabs themselves are untouched — these buttons click the real tab,
   so every binding, every render path and the group nav's own state all
   keep working. The duplicate inside the group's context row is hidden
   rather than removed, so nothing is lost if a later layer looks for it.
   =================================================================== */
/* Direct nav moved to release 28.

   It lived here first, and release 28 tried to retire these buttons by
   id — but the ids did not match. This layer built
   "v27nav-DOCUMENTSOCR" and "v27nav-MORTGAGERATES" (stripping non-caps
   from the full tab label) while 28 looked for "v27nav-DOCUMENTS" and
   "v27nav-RATES" (from its own short keys). Two of the four matched, so
   Documents and Rates survived in duplicate — which is the doubled tab
   row in the screenshot. Removed here entirely; 28 owns it. */

/* =================================================================== 3
   PROMOTED ACTIONS

   The row under the scenario and the two dates had two buttons in it and
   a lot of empty space, while the things people reach for most sat two
   clicks deep inside File actions and Loan tools. The most-used are
   surfaced there.

   Each promoted button DELEGATES to the original rather than
   reimplementing it — it finds the real control by label and clicks it.
   Nothing is moved out of the menus, so every existing route still
   works and a layer that looks for those buttons still finds them.
   =================================================================== */
var PROMOTE = [
  ['Compare',    ['Compare','Live comparison']],
  ['Draft LE',   ['Draft LE']],
  ['Credit',     ['Credit','Credit review']],
  ['Import / AI',['Import / AI']],
  ['Print / PDF',['Print / PDF','Print summary']]
];
function findAction(names){
  var pools = ['v23SuiteActions','v24LoanTools'];
  for (var p=0;p<pools.length;p++){
    var pool = $(pools[p]); if (!pool) continue;
    for (var n=0;n<names.length;n++){
      var hit = $$('button,a', pool).filter(function(b){
        return norm(b.textContent) === norm(names[n]) && !b.classList.contains('v27-promoted');
      })[0];
      if (hit) return hit;
    }
  }
  return null;
}
function installPromoted(){
  var actions = $('v25HeaderActions'); if (!actions) return false;
  var host = $('v27Promoted');
  if (!host){
    host = document.createElement('div');
    host.id = 'v27Promoted'; host.className = 'v27-promoted-row no-print';
    actions.appendChild(host);
  }
  var n = 0;
  PROMOTE.forEach(function(spec){
    var id = 'v27p-' + spec[0].replace(/[^A-Za-z]/g,'');
    if ($(id)) { n++; return; }
    if (!findAction(spec[1])) return;                  /* menu not built yet */
    var b = document.createElement('button');
    b.id = id; b.type = 'button';
    b.className = 'btn ghost v27-promoted';
    b.textContent = spec[0];
    b.title = spec[0] + ' \u2014 same action as in the menus';
    b.onclick = function(){
      var target = findAction(spec[1]);
      if (target) target.click();
      else say('That action is not available yet', 'The menu it lives in has not finished building.', 'warn', 5000);
    };
    host.appendChild(b);
    n++;
  });
  return n === PROMOTE.length;
}

/* =================================================================== 4
   LIGHT / DARK SWITCH

   v25 cycles three surfaces (light, dark, OLED) through one button. A
   three-way cycle is the wrong control for the thing people actually do,
   which is flip between day and night. This adds a two-state switch to
   the LEFT of the theme control: light, or the blue-toned dark.

   The existing cycle button is left in place and still reaches OLED, so
   nothing is taken away — this is the fast path, not a replacement.
   =================================================================== */
function surface(){ return document.documentElement.dataset.v25Surface || get('los.v25.surface','dark'); }
V27.setSurface = function(name){
  if (window.V25 && V25.setSurface) V25.setSurface(name);
  else { document.documentElement.dataset.v25Surface = name; set('los.v25.surface', name); }
  paintSwitch();
};
V27.toggleSurface = function(){
  V27.setSurface(surface() === 'light' ? 'dark' : 'light');
};
function installSwitch(){
  var app = $('v23Appearance'); if (!app) return false;
  if ($('v27DayNight')) { paintSwitch(); return true; }
  var w = document.createElement('button');
  w.id = 'v27DayNight'; w.type = 'button'; w.className = 'v27-daynight';
  w.innerHTML = '<span class="v27-dn-track"><span class="v27-dn-knob"></span></span>';
  w.onclick = V27.toggleSurface;
  /* to the LEFT of the theme control */
  app.insertBefore(w, app.firstChild);
  paintSwitch();
  return true;
}
function paintSwitch(){
  var w = $('v27DayNight'); if (!w) return;
  var s = surface();
  var dark = s !== 'light';
  w.classList.toggle('on', dark);
  w.setAttribute('aria-pressed', dark ? 'true' : 'false');
  w.title = dark ? 'Dark' + (s === 'oled' ? ' (OLED)' : '') + ' \u2014 click for light'
                 : 'Light \u2014 click for dark';
}

/* =================================================================== 5
   RENT BY BEDROOM COUNT

   HUD's Fair Market Rent API is the only source on this subject with a
   real public endpoint, and it is the right one: FMR is published per
   bedroom count (0 through 4) for every metro and non-metro county in
   the country, which is exactly the shape asked for.

   Two things are worth being straight about rather than papering over:

   1. It needs a free token from huduser.gov. There is no way around
      that from a local file, and no other rent source publishes an open
      cross-origin API — the listing portals all block it. Where a token
      is missing this says so and opens the registration page.
   2. FMR is a HUD administrative figure (roughly the 40th percentile of
      standard-quality units, by area), not a market average scraped from
      listings. It is the correct benchmark for programme work and it is
      NOT the same thing as what a unit would list for today. That is
      stated on the panel rather than left for someone to assume.

   Where more than one area is returned for a zip, the per-bedroom
   figures are averaged across them and the count of areas is shown, so
   an average over three counties never looks like a single hard number.
   =================================================================== */
var BR = ['Studio','1 bedroom','2 bedroom','3 bedroom','4 bedroom'];
var RENT = V27.RENT = { zip:'', rows:null, areas:[], busy:false, note:'' };

function hudToken(){
  try { return (window.LOANSUITE && LOANSUITE.PROP && LOANSUITE.PROP.state.hudToken) || ''; }
  catch(e){ return ''; }
}
/* The FMR endpoint is keyed by FMR AREA, not by zip — a bare five-digit
   zip is rejected. HUD publishes a USPS crosswalk API for exactly this,
   so the lookup is two steps:

     1. zip  -> county FIPS   via /public/usps?type=2&query=ZIP
     2. FIPS + "99999"        -> /public/fmr/data/{entityid}

   A zip can straddle several counties, which is the honest reason to
   average: each county is a separate FMR area with its own schedule.
   Where HUD classifies the area as a "small area" it answers with
   per-zip figures instead, and those are used directly in preference to
   the county average because they are the finer measure. */
function hudFetch(url, tok){
  return fetch(url, { headers: { Authorization: 'Bearer ' + tok } }).then(function(r){
    if (r.status === 401 || r.status === 403) throw new Error('token rejected \u2014 check it is active');
    if (!r.ok) throw new Error('HUD returned ' + r.status);
    return r.json();
  });
}
function pickRow(o){
  var keys = ['Efficiency','One-Bedroom','Two-Bedroom','Three-Bedroom','Four-Bedroom'];
  var out = keys.map(function(k){ var v = parseFloat(o && o[k]); return isFinite(v) && v > 0 ? v : null; });
  return out.some(function(v){ return v != null; }) ? out : null;
}
V27.lookupRent = function(zip){
  zip = String(zip || (window.LOANSUITE && LOANSUITE.PROP && LOANSUITE.PROP.state.zip) || '').replace(/\D/g,'').slice(0,5);
  if (zip.length !== 5) return say('Need a five-digit zip', 'Fair Market Rent is published by area, so the zip has to be complete.', 'warn');
  var tok = hudToken();
  if (!tok){
    say('A free HUD token is needed',
        'Fair Market Rent comes from huduser.gov and needs a free API token. The registration page is '
        + 'opening now \u2014 paste the token into the HUD field on the Property tab and press this again.',
        'info', 9000);
    try { window.open('https://www.huduser.gov/portal/dataset/fmr-api.html','_blank','noopener'); } catch(e){}
    return;
  }
  RENT.zip = zip; RENT.busy = true; RENT.note = ''; RENT.rows = null; RENT.areas = [];
  V27.renderRent();

  hudFetch('https://www.huduser.gov/hudapi/public/usps?type=2&query=' + zip, tok)
    .then(function(j){
      var res = (j && j.data && j.data.results) || [];
      var fips = res.map(function(r){ return String(r.geoid || '').slice(0,5); })
                    .filter(function(f){ return /^\d{5}$/.test(f); });
      fips = fips.filter(function(f,i){ return fips.indexOf(f) === i; });
      if (!fips.length) throw new Error('no county found for that zip');
      return Promise.all(fips.slice(0,6).map(function(f){
        return hudFetch('https://www.huduser.gov/hudapi/public/fmr/data/' + f + '99999', tok)
          .then(function(x){ return x; })
          .catch(function(){ return null; });
      }));
    })
    .then(function(list){
      var sums = [0,0,0,0,0], counts = [0,0,0,0,0], areas = [], year = '', small = null;
      (list || []).filter(Boolean).forEach(function(j){
        var d = j.data; if (!d) return;
        if (d.year) year = d.year;
        /* small-area answers carry per-zip rows; prefer the one for THIS zip */
        var zipRows = d.zip_code_rents || d.smallarea || null;
        if (Array.isArray(zipRows)){
          var hit = zipRows.filter(function(z){ return String(z.zip_code || z.zip) === RENT.zip; })[0];
          var r = hit && pickRow(hit);
          if (r) { small = r; areas.push('zip ' + RENT.zip + ' (small area)'); return; }
        }
        var row = pickRow(d.basicdata || d);
        if (!row) return;
        areas.push(d.county_name || d.town_name || d.metro_name || 'area');
        row.forEach(function(v,i){ if (v != null){ sums[i] += v; counts[i]++; } });
      });
      if (small){
        RENT.rows = small.map(function(v){ return v == null ? null : Math.round(v); });
        RENT.areas = areas;
        RENT.note = (year ? 'FY' + year + ' ' : '') + 'HUD Small Area Fair Market Rent';
      } else {
        if (!counts.some(Boolean)) throw new Error('no rent schedule returned for that area');
        RENT.rows = sums.map(function(s,i){ return counts[i] ? Math.round(s / counts[i]) : null; });
        RENT.areas = areas;
        RENT.note = (year ? 'FY' + year + ' ' : '') + 'HUD Fair Market Rent'
                  + (areas.length > 1 ? ' \u2014 averaged across ' + areas.length + ' FMR areas this zip touches' : '');
      }
      RENT.busy = false; V27.renderRent();
    })
    .catch(function(e){
      RENT.busy = false; RENT.rows = null;
      RENT.note = (e && e.message) || 'lookup failed';
      V27.renderRent();
      say('Rent lookup failed', RENT.note + '. A newly created token can take a few minutes to activate.', 'warn', 9000);
    });
};
V27.useRent = function(idx){
  var v = RENT.rows && RENT.rows[idx]; if (!v) return;
  try {
    var st = window.mortgageSuite.store;
    st.setField('rental.marketRent', v, 'HUD FMR ' + BR[idx]);
    if (window.RECALC) window.RECALC();
    say('Applied ' + BR[idx], '$' + v + '/mo written to market rent. This is the HUD area figure, not a '
      + 'listing comparable \u2014 an appraiser\u2019s 1007 still governs.', 'good', 8000);
  } catch(e){ say('Could not apply it', 'The rental field was not reachable.', 'warn'); }
};
V27.renderRent = function(){
  var host = $('v27RentBody'); if (!host) return;
  if (RENT.busy) { host.innerHTML = '<div class="v27-dim">Looking up ' + RENT.zip + '\u2026</div>'; return; }
  if (!RENT.rows){
    host.innerHTML = '<div class="v27-dim">' + (RENT.note ? 'Last attempt: ' + RENT.note + '. ' : '')
      + 'Enter a zip and press Look up.</div>';
    return;
  }
  host.innerHTML = '<table class="tbl v27-rent-tbl"><thead><tr><th>Unit</th>'
      + '<th class="num">Fair Market Rent</th><th></th></tr></thead><tbody>'
    + RENT.rows.map(function(v,i){
        return '<tr><td>' + BR[i] + '</td><td class="num">' + (v ? '$' + v.toLocaleString() : '\u2014') + '</td>'
          + '<td>' + (v ? '<button class="btn btn-light btn-sm" onclick="V27.useRent(' + i + ')">Use</button>' : '') + '</td></tr>';
      }).join('')
    + '</tbody></table>'
    + '<div class="v27-src">' + RENT.note + (RENT.areas.length ? ' \u00b7 ' + RENT.areas.join(', ') : '') + '</div>'
    + '<div class="v27-caveat">Fair Market Rent is a HUD administrative figure \u2014 roughly the 40th '
      + 'percentile of standard-quality units for the area \u2014 not a market average of current listings. '
      + 'It is the right benchmark for programme work and the wrong one to quote as achievable rent. '
      + 'A 1007 or lease still governs what can be used as income.</div>';
};
function installRent(){
  if ($('v27RentCard')) return true;
  var host = document.querySelector('#panel-property .card .card-body')
          || document.querySelector('#propBody');
  if (!host) return false;
  var card = document.createElement('div');
  card.id = 'v27RentCard'; card.className = 'v27-rent';
  card.innerHTML = '<div class="v27-rent-hd">Rent by bedroom count</div>'
    + '<div class="v27-rent-row">'
      + '<input class="cell-input" id="v27RentZip" placeholder="zip" maxlength="5" style="width:92px">'
      + '<button class="btn btn-light btn-sm" onclick="V27.lookupRent(document.getElementById(\'v27RentZip\').value)">Look up</button>'
    + '</div><div id="v27RentBody"></div>';
  host.appendChild(card);
  try {
    var z = window.LOANSUITE && LOANSUITE.PROP && LOANSUITE.PROP.state.zip;
    if (z) $('v27RentZip').value = z;
  } catch(e){}
  V27.renderRent();
  return true;
}

/* =================================================================== 6
   WIRING
   =================================================================== */
setInterval(function(){
  try { lockSummary(); } catch(e){}
  try { installPromoted(); } catch(e){}
  try { installSwitch(); paintSwitch(); } catch(e){}
  try { installRent(); } catch(e){}
}, 700);
})();
