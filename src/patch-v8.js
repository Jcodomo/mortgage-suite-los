/* =====================================================================
   v8 — tab restructure, Taxes folded into Escrow, a free-form Property
        screen, the HUD key flow, and a Documents/OCR entry point.

   Nothing in either engine is edited.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function G(n){ try { return (0, eval)(n); } catch(e){ return undefined; } }
function N(v){ v = parseFloat(v); return isFinite(v) ? v : 0; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function suite(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }

var V8 = window.V8 = { active: null };

/* =================================================================== 1
   TOP-LEVEL TABS for Mortgage Rates and Property, plus a Documents
   button, all sitting to the right of SUMMARY.

   The engine's buildTabs() creates its buttons once and then only
   toggles display/className on them, so extra buttons appended to the
   same row survive. What it will not do is un-highlight its own tab
   when one of ours is showing, so that is done here.
   =================================================================== */
var EXTRA_TABS = [
  { id:'rates',    label:'MORTGAGE RATES', panel:'panel-rates',    render:function(){ if (window.RATES) RATES.render(); } },
  { id:'property', label:'PROPERTY',       panel:'panel-property', render:function(){ if (window.LOANSUITE) LOANSUITE.PROP.render(); } }
];
function tabsRow(){
  var sr = $('suite-root'); if (!sr) return null;
  return sr.querySelector('.tabs');
}
function buildExtraTabs(){
  var row = tabsRow(); if (!row) return false;
  if (row.querySelector('.v8-tab')) return true;
  EXTRA_TABS.forEach(function(t){
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'tab v8-tab'; b.dataset.v8 = t.id;
    b.textContent = t.label;
    b.addEventListener('click', function(){ V8.go(t.id); });
    row.appendChild(b);
  });
  /* Documents & OCR — same feature set as the calculator's own tab, so
     this hands over rather than duplicating it. */
  var d = document.createElement('button');
  d.type = 'button'; d.className = 'tab v8-tab v8-docs';
  d.textContent = 'DOCUMENTS & OCR';
  d.addEventListener('click', function(){
    V8.leave();
    /* LOS.go('c:docs') is the layer's own cross-shell jump: it swaps the
       shell to the calculator, un-parks it and switches the tab. Calling
       switchTab alone would change a tab nobody can see. */
    if (window.LOS && LOS.go) { try { LOS.go('c:docs'); return; } catch(e){} }
    try { window.switchTab('docs'); } catch(e){}
  });
  row.appendChild(d);
  return true;
}
V8.go = function(id){
  var t = EXTRA_TABS.filter(function(x){ return x.id === id; })[0];
  if (!t) return;
  var sr = $('suite-root'); if (!sr) return;
  var cm = sr.querySelector('.cols-main');
  var host = $('v8Stage');
  if (!host){
    host = document.createElement('div');
    host.id = 'v8Stage';
    if (cm && cm.parentNode) cm.parentNode.insertBefore(host, cm.nextSibling);
  }
  var panel = $(t.panel);
  if (panel && panel.parentNode !== host) host.appendChild(panel);
  $$('#v8Stage .panel').forEach(function(p){ p.classList.toggle('active', p.id === t.panel); });
  host.style.display = '';
  if (cm) cm.style.display = 'none';
  var adv = $('advBar'); if (adv) adv.style.display = 'none';
  var moved = $('suiteMoved'); if (moved) moved.style.display = 'none';
  V8.active = id;
  try { t.render(); } catch(e){}
  paintExtraTabs();
};
V8.leave = function(){
  if (!V8.active) return;
  V8.active = null;
  var host = $('v8Stage'); if (host) host.style.display = 'none';
  var sr = $('suite-root');
  var cm = sr && sr.querySelector('.cols-main');
  if (cm) cm.style.display = '';
  paintExtraTabs();
};
function paintExtraTabs(){
  var row = tabsRow(); if (!row) return;
  $$('.v8-tab', row).forEach(function(b){
    b.className = 'tab v8-tab' + (b.dataset.v8 && b.dataset.v8 === V8.active ? ' active' : '')
                + (b.classList.contains('v8-docs') ? ' v8-docs' : '');
  });
  /* While one of ours is showing, the engine's own highlighted tab has to
     stand down — otherwise two tabs read as active at once. */
  if (V8.active){
    $$('.tab', row).forEach(function(b){
      if (!b.classList.contains('v8-tab')) b.classList.remove('active');
    });
  }
}
/* Any click on an engine tab returns the stage to the engine. */
function watchEngineTabs(){
  var row = tabsRow(); if (!row || row.__v8watch) return;
  row.__v8watch = true;
  row.addEventListener('click', function(e){
    var b = e.target.closest('button');
    if (b && !b.classList.contains('v8-tab')) V8.leave();
  }, true);
}

/* =================================================================== 2
   TAXES & ESCROW folded into the Escrow tab

   The panel is appended after the aggregate escrow analysis section so
   the two read as one page: the aggregate first, the proration and the
   twelve-month projection under it.
   =================================================================== */
function mountTaxesInEscrow(){
  if (window.V39) return;   /* release 39: Taxes is its own page, not appended under Escrow */
  var st = suite(); if (!st || !window.TAXPRO) return;
  if (V8.active) return;
  if (st.snapshot.mode !== 'escrow') return;
  var body = $('screen-body'); if (!body) return;
  var existing = $('v8TaxHost');
  if (existing && existing.isConnected && body.contains(existing)) return;
  if (existing) existing.remove();
  var wrap = document.createElement('div');
  wrap.id = 'v8TaxHost';
  wrap.innerHTML = '<div id="taxBody"></div>';
  /* after the aggregate section if it can be found, otherwise at the end */
  /* sections carry data-section, not an id */
  var agg = body.querySelector('[data-section="closing-escrow"]');
  var anchor = agg && agg.parentNode === body ? agg : null;
  if (anchor && anchor.nextSibling) body.insertBefore(wrap, anchor.nextSibling);
  else body.appendChild(wrap);
  try { TAXPRO.render(); } catch(e){}
}

/* =================================================================== 3
   PROPERTY — every input free-form

   The three selects (address mode, property type, listing status) and
   the date field became text inputs backed by <datalist>, so the usual
   values are still one click away but anything can be typed. "Every
   input free-form except the billing cycle and closing date" is applied
   to the tax panel too: seller-paid-through is now typed, and parsed
   with the same tolerant parser v7 uses for the lock dates.
   =================================================================== */
function listFor(id, opts){
  return '<datalist id="' + id + '">'
    + opts.map(function(o){ return '<option value="' + esc(o) + '">'; }).join('')
    + '</datalist>';
}
function freeformProperty(){
  var host = $('propBody'); if (!host || !window.LOANSUITE) return;
  if (host.__v8ff === host.innerHTML.length) return;   /* already converted */
  var PROP = LOANSUITE.PROP; if (!PROP) return;
  var s = PROP.state;
  var changed = false;

  $$('select', host).forEach(function(sel){
    var oc = sel.getAttribute('onchange') || '';
    var m = oc.match(/PROP\.set\('([a-zA-Z]+)'/);
    if (!m) return;
    var key = m[1];
    var opts = Array.prototype.map.call(sel.options, function(o){ return o.value || o.text; })
                 .filter(function(x){ return x && x !== '—'; });
    var listId = 'v8dl-' + key;
    var box = document.createElement('span');
    box.innerHTML = '<input class="cell-input" list="' + listId + '" value="' + esc(s[key] == null ? '' : s[key]) + '" '
      + 'onchange="LOANSUITE.PROP.set(\'' + key + '\',this.value)" placeholder="type anything">'
      + listFor(listId, opts);
    sel.parentNode.replaceChild(box, sel);
    changed = true;
  });
  $$('input[type="date"]', host).forEach(function(el){
    el.type = 'text';
    el.placeholder = 'mm/dd/yyyy';
    changed = true;
  });
  if (changed) host.__v8ff = host.innerHTML.length;
}
/* Zillow / listing URL. There is no public Zillow API — the old one was
   retired — and Zillow actively blocks automated reads, so this stores
   the link, pulls what it can through the same relay the other lookups
   use, and says plainly when it cannot rather than silently filling
   nothing. Anything it does read lands in empty fields only. */
V8.setListingUrl = function(v){
  var PROP = window.LOANSUITE && LOANSUITE.PROP; if (!PROP) return;
  PROP.state.listingUrl = String(v || '').trim();
  PROP.save();
};
V8.pullListing = function(){
  var PROP = window.LOANSUITE && LOANSUITE.PROP; if (!PROP) return;
  var url = (PROP.state.listingUrl || '').trim();
  if (!/^https?:\/\//i.test(url))
    return say('Need a listing link', 'Paste the full https:// address of the listing page first.', 'warn');
  var btn = $('v8ListingBtn'); if (btn){ btn.disabled = true; btn.textContent = 'Reading\u2026'; }
  var relay = 'https://r.jina.ai/' + url;
  fetch(relay).then(function(r){ return r.text(); }).then(function(txt){
    var got = {}, s = PROP.state;
    var grab = function(re){ var m = txt.match(re); return m ? m[1].replace(/,/g,'') : null; };
    var price = grab(/\$\s?([\d,]{6,12})\b/);
    var beds  = grab(/(\d{1,2})\s*(?:bd|beds?|bedrooms?)\b/i);
    var sqft  = grab(/([\d,]{3,7})\s*(?:sqft|sq\.?\s?ft)/i);
    var yr    = grab(/[Bb]uilt in\s*(\d{4})/);
    if (price && !N(s.currentValue)) { PROP.state.currentValue = N(price); got.currentValue = price; }
    if (beds  && !N(s.beds))         { PROP.state.beds = N(beds);          got.beds = beds; }
    if (sqft  && !N(s.sqFt))         { PROP.state.sqFt = N(sqft);          got.sqFt = sqft; }
    if (yr    && !s.yearBuilt)       { PROP.state.yearBuilt = yr;          got.yearBuilt = yr; }
    PROP.save(); PROP.sync(); PROP.render();
    var n = Object.keys(got).length;
    if (n) say('Read ' + n + ' field(s)', 'Filled only the fields that were empty. Check every figure against the '
      + 'listing itself \u2014 this is scraped text, not a data feed.', 'good', 8000);
    else say('Nothing usable came back', 'Zillow and most portals block automated reads, and the retired Zillow API '
      + 'has no replacement. Enter the figures by hand \u2014 the link stays saved on the file.', 'warn', 9000);
  }).catch(function(){
    say('Could not read the listing', 'The request was refused, which is the normal result for Zillow. '
      + 'The link is saved; enter the figures by hand.', 'warn', 9000);
  }).then(function(){
    if (btn){ btn.disabled = false; btn.textContent = 'Pull from listing'; }
  });
};
function injectListingField(){
  var host = $('propBody'); if (!host) return;
  if ($('v8ListingRow')) return;
  var PROP = window.LOANSUITE && LOANSUITE.PROP; if (!PROP) return;
  var firstCard = host.querySelector('.card .card-body'); if (!firstCard) return;
  var row = document.createElement('div');
  row.id = 'v8ListingRow'; row.className = 'v8-listing';
  row.innerHTML = '<div class="field" style="flex:1;min-width:0"><label>Listing link (Zillow, Redfin, MLS\u2026)</label>'
    + '<input class="cell-input" style="text-align:left" placeholder="https://www.zillow.com/homedetails/\u2026" '
    + 'value="' + esc(PROP.state.listingUrl || '') + '" onchange="V8.setListingUrl(this.value)"></div>'
    + '<button class="btn btn-light" id="v8ListingBtn" onclick="V8.pullListing()">Pull from listing</button>';
  firstCard.appendChild(row);
}
/* HUD: no token means send them to get one rather than telling them to. */
function wrapHudLookup(){
  var PROP = window.LOANSUITE && LOANSUITE.PROP;
  if (!PROP || typeof PROP.hudLookup !== 'function' || PROP.hudLookup.__v8) return false;
  var inner = PROP.hudLookup;
  var wrapped = function(){
    if (!PROP.state.hudToken){
      say('Opening the HUD sign-up',
          'Fair Market Rent needs a free huduser.gov API token. The registration page is opening now \u2014 '
          + 'paste the token into the field below and press the button again.', 'info', 9000);
      try { window.open('https://www.huduser.gov/portal/dataset/fmr-api.html', '_blank', 'noopener'); } catch(e){}
      var f = document.querySelector('#propBody input[type="password"]');
      if (f) { f.focus(); f.scrollIntoView({block:'center', behavior:'smooth'}); }
      return;
    }
    return inner.apply(this, arguments);
  };
  wrapped.__v8 = true;
  PROP.hudLookup = wrapped;
  return true;
}

/* =================================================================== 4
   TAX PANEL — seller-paid-through becomes a typed date

   Everything on the panel is free-form except the two the brief keeps
   as pickers: the billing cycle and the closing date.
   =================================================================== */
V8.setPaidThrough = function(raw){
  var isoStr = (window.V7 && V7.parseDate) ? V7.parseDate(raw) : String(raw||'').trim();
  if (!isoStr && String(raw||'').trim()) return;   /* mid-typing, leave it */
  try { TAXPRO.set('sellerPaidThrough', isoStr); } catch(e){}
};
function freeformTaxPanel(){
  var body = $('taxBody'); if (!body || !window.TAXPRO) return;
  $$('input[type="date"]', body).forEach(function(el){
    var oc = el.getAttribute('onchange') || '';
    if (oc.indexOf('sellerPaidThrough') === -1) return;   /* closing date stays a picker */
    var cur = el.value;
    el.type = 'text';
    el.placeholder = 'mm/dd/yyyy \u2014 blank means nothing paid';
    el.value = (window.V7 && V7.pretty) ? V7.pretty(cur) : cur;
    el.setAttribute('onchange', 'V8.setPaidThrough(this.value)');
  });
}

/* =================================================================== 5
   IMPORT MENU — drop the duplicate entries

   "Load from Renovation Suite" (Load menu) and "Import from Renovation
   Suite" (overflow menu) call the same importReno(); the overflow menu
   also repeats the saved-file loader that is already the Load menu's
   first item. The duplicates are removed from the overflow menu, which
   is the one people reach for second.
   =================================================================== */
function dedupeMenus(){
  var more = $('moreMenu'); if (!more || more.__v8dedupe) return;
  var seen = {};
  var dupes = ['importReno()', "document.getElementById('loadFile').click()"];
  $$('button', more).forEach(function(b){
    var oc = b.getAttribute('onclick') || '';
    dupes.forEach(function(sig){
      if (oc.indexOf(sig) >= 0){
        if (seen[sig]) return;
        seen[sig] = true;
        b.remove();
      }
    });
  });
  more.__v8dedupe = true;
}

/* =================================================================== 6
   WIRING
   =================================================================== */
setInterval(function(){
  try { buildExtraTabs(); watchEngineTabs(); paintExtraTabs(); } catch(e){}
  try { mountTaxesInEscrow(); } catch(e){}
  try { freeformProperty(); injectListingField(); wrapHudLookup(); } catch(e){}
  try { freeformTaxPanel(); } catch(e){}
  try { dedupeMenus(); } catch(e){}
}, 500);
})();
