/* =====================================================================
   Release 45 — theme reaches every popup, the rail styled to the
   reference, seller credit in dollars, draw tiers and the conventional
   per-draw fee, due dates on the tax schedule, an address that fills
   the file, Full as a toggle, movable sections saved with the scenario,
   and every menu closing on an outside click.
   Additive over 44. Two source edits noted in the changelog.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function G(n){ try { return (0, eval)(n); } catch(e){ return undefined; } }
function N(v){ v = parseFloat(String(v==null?'':v).replace(/[$,%\s]/g,'')); return isFinite(v)?v:0; }
function norm(s){ return String(s||'').replace(/\s+/g,' ').trim(); }
function key(s){ return norm(s).toUpperCase(); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function usd(v,dp){ dp=dp===undefined?0:dp; var n=N(v);
  return (n<0?'\u2212':'')+'$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp}); }
function get(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
function set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function setClass(el,c,on){ if (el && el.classList.contains(c)!==!!on) el.classList.toggle(c,!!on); }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }
function store(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
var V45 = window.V45 = { version:'45.0' };

/* =================================================================== 1
   NUMBERS THAT PRINT AS THEIR TRUE VALUE

   The rate editor showed 6.875000000000001. That is 0.06875 × 100 in
   binary floating point. Every percent shown for editing is rounded to
   the precision it was entered at.
   =================================================================== */
V45.cleanPct = function(v){ var n = N(v); return String(parseFloat(n.toFixed(6))); };
function cleanEditors(){
  $$('.v35-rail-editor input, .v45-editor input').forEach(function(inp){
    var v = inp.value; if (/\d\.\d{7,}/.test(v)){ var c = V45.cleanPct(v); if (c !== v) inp.value = c; }
  });
}

/* =================================================================== 2
   SELLER CREDIT IN DOLLARS

   The dollar field was disabled unless a separate "entered as" select
   said dollars, and the percent field the reverse — so a typed amount
   went nowhere. Both fields take input now; typing in one switches the
   basis to it. The select stays and still works.
   =================================================================== */
function sellerCredit(){
  var s = store(); if (!s) return;
  $$('#suite-root [data-path="sellerConcessionAmount"], #suite-root [data-path="sellerConcessionPct"]').forEach(function(inp){
    if (inp.disabled) inp.disabled = false;
    if (inp.__v45) return; inp.__v45 = true;
    inp.addEventListener('input', function(){
      var want = inp.dataset.path === 'sellerConcessionAmount' ? 'dollar' : 'percent';
      try { if (s.activeInputs.concessionInputMode !== want) s.setField('concessionInputMode', want, 'Seller credit typed as ' + want); } catch(e){}
    }, true);
  });
}

/* =================================================================== 3
   DRAW TIERS AND THE CONVENTIONAL PER-DRAW FEE

   The engine's draw table is a sealed module constant with three bands.
   The bands asked for are four:

     under $25,000          2 draws
     $25,000 – $59,999      3 draws
     $60,000 – $99,999      4 draws
     $100,000 and up        5 draws

   They are applied through the engine's own manual-override path, and
   only while the count still equals what this rule last set — a count
   the user typed is never overwritten. Conventional renovation files
   (HomeStyle) get a $150 inspection fee per draw where the field still
   holds the engine default of $375; a fee someone entered is kept.
   =================================================================== */
V45.tierDraws = function(repair){
  repair = N(repair);
  if (repair <= 0) return 0;
  if (repair < 25000) return 2;
  if (repair < 60000) return 3;
  if (repair < 100000) return 4;
  return 5;
};
function draws(){
  var s = store(); if (!s) return;
  var i = s.activeInputs; if (!i || !i.reno || !i.draws) return;
  var want = V45.tierDraws(i.reno.baseCost);
  if (!i.renovation || !want) return;
  var last = i.draws.v45Last;
  var untouched = !i.draws.manualOverride || last == null || N(i.draws.manualDrawCount) === N(last);
  if (untouched && (N(i.draws.manualDrawCount) !== want || !i.draws.manualOverride)){
    try { s.setField('draws.manualOverride', true, 'Draw tier'); s.setField('draws.manualDrawCount', want, 'Draw tier'); i.draws.v45Last = want; } catch(e){}
  }
  if (/conventional/i.test(i.loanProgram||'') && N(i.draws.inspectionFeePerDraw) === 375){
    try { s.setField('draws.inspectionFeePerDraw', 150, 'Conventional draw fee'); } catch(e){}
  }
}

/* =================================================================== 4
   SCENARIO NAMES

   "Unnamed · FHA 203(k) · 3.50% down · 6.875% · 09-08 – Conventional":
   the placeholder where a name should be, and the programme appended
   to a label that already carried it. A file with no borrower yet is
   named from the property, then the city, then the date it was
   started — never "Unnamed" — and the programme appears once.
   =================================================================== */
V45.nameFor = function(i, o){
  i = i || {}; o = o || {};
  var who = norm(i.borrowerName || '');
  if (!who){
    var street = norm(i.propertyAddress || '').split(',')[0];
    who = street && !/^\d{5}$/.test(street) ? street : (norm(i.city||'') ? norm(i.city) : 'File ' + new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'}));
  }
  var dp = N(i.finalDownPaymentPct); if (dp <= 1) dp *= 100;
  var prog = o.programLabel || ((i.loanProgram||'') + (i.renovation ? (i.loanProgram==='FHA' ? ' 203(k)' : ' HomeStyle') : ''));
  var rate = N(i.interestRate); if (rate <= 1) rate *= 100;
  return [who, prog, (dp ? parseFloat(dp.toFixed(2)) + '% down' : ''), (rate ? parseFloat(rate.toFixed(3)) + '%' : '')].filter(Boolean).join(' · ');
};
function wrapNaming(){
  if (window.V13 && V13.scenarioName && !V13.scenarioName.__v45){
    var f = function(){ var s = store(); return V45.nameFor(s && s.activeInputs, s && s.outputs); };
    f.__v45 = true; V13.scenarioName = f;
  }
  $$('#suite-root input, #suite-root option, #suite-root .v24-scenario-bar *').forEach(function(el){
    var t = el.value !== undefined && el.tagName === 'INPUT' ? el.value : el.textContent;
    if (/^Unnamed\b/.test(t||'')){ var s = store(); var nm = V45.nameFor(s && s.activeInputs, s && s.outputs);
      if (el.tagName === 'INPUT'){ if (el.value !== nm) el.value = nm; } else if (el.childNodes.length === 1 && el.textContent !== nm) el.textContent = nm; }
  });
}

/* =================================================================== 5
   THE VALUE TEST BANNER — red when it fails
   =================================================================== */
function arvBanner(){
  var s = store(); var o = s && s.outputs || {}; var mmw = o.mmw || {};
  $$('#suite-root .rail .notice, #suite-root .rail .v44-banner, #suite-root .rail [class*="fit"]').forEach(function(b){
    var t = (b.textContent||'').toLowerCase();
    var fail = /over the|exceeds|does not fit|fails/.test(t) || (mmw.valueFitPass === false && /fit|after-repair/.test(t));
    setClass(b, 'v45-fail', !!fail);
  });
}

/* =================================================================== 6
   TAX SCHEDULE — click the rule or the structure to see the dates

   The proration worksheet stores a cycle name like "Nassau County, NY —
   Jan 10 / Jul 10" and the engine a disbursement month list. Clicking
   either label opens a small list of the actual due dates for the
   closing year, with what each instalment covers.
   =================================================================== */
V45.dueDates = function(cycleName, year){
  var T = window.TAX || window.TAXPRO; var cyc = T && T.CYCLES && T.CYCLES[cycleName];
  year = year || new Date().getFullYear();
  if (!cyc) return [];
  return cyc.map(function(c){ var m = c.due.split('-'); var d = new Date(year, +m[0]-1, +m[1]);
    return { date:d, label:d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}), pct:c.pct, covers:c.covers }; });
};
function showDates(anchor){
  var T = window.TAX || window.TAXPRO; var st = T && T.state; if (!st) return;
  var yr = st.closing ? new Date(st.closing).getFullYear() : new Date().getFullYear();
  var list = V45.dueDates(st.cycle, yr).concat(V45.dueDates(st.cycle, yr+1));
  var pop = $('v45Dates'); if (!pop){ pop = document.createElement('div'); pop.id='v45Dates'; pop.className='v45-pop no-print'; document.body.appendChild(pop); }
  pop.innerHTML = '<div class="v45-pop-hd">' + esc(st.cycle || 'Tax schedule') + '</div>'
    + (list.length ? list.map(function(x){ return '<div class="v45-date"><b>' + esc(x.label) + '</b><span>' + Math.round(x.pct*100) + '% of the annual bill' + (x.covers ? ' · covers from ' + esc(x.covers) : '') + '</span></div>'; }).join('')
                  : '<div class="v45-date">No dated cycle on this jurisdiction yet.</div>')
    + '<div class="v45-pop-ft">Instalments after closing are the ones the escrow account must have funds for.</div>';
  var r = anchor.getBoundingClientRect();
  pop.style.left = Math.max(8, Math.min(innerWidth-340, r.left + scrollX)) + 'px'; pop.style.top = (r.bottom + scrollY + 6) + 'px';
  pop.hidden = false;
}
document.addEventListener('click', function(e){
  var lab = e.target.closest('label, .field > label, th, .sec-head, .l, b, span');
  if (!lab) return;
  var t = norm(lab.textContent).toLowerCase();
  if (/^(disbursement rule|tax structure|tax cycle|payment cycle)/.test(t)){ e.preventDefault(); showDates(lab); }
}, true);

/* =================================================================== 7
   THE INTEREST-RATE EDITOR — a rate board under it, and a real page

   Same editor, plus a small survey table beneath the inputs with a Use
   button on each row when the board has been pulled. "Open Mortgage
   Rates" leaves the full form and opens the rates workspace as its own
   page.
   =================================================================== */
function rateBoardHtml(){
  var R = window.RATES, rows = R && R.state && R.state.rows; if (!rows) return '<div class="v45-board-empty">Pull the survey from the rates page and the board appears here.</div>';
  var keys = [['fixed30','30-yr fixed'],['fixed15','15-yr fixed'],['jumbo30','30-yr jumbo'],['fha30','30-yr FHA'],['va30','30-yr VA']];
  var have = keys.filter(function(k){ return rows[k[0]] && N(rows[k[0]].rate); });
  if (!have.length) return '<div class="v45-board-empty">No survey figures yet.</div>';
  return '<table class="v45-board"><tbody>' + have.map(function(k){ var r = N(rows[k[0]].rate);
    return '<tr><td>' + esc(k[1]) + '</td><td class="n">' + r.toFixed(3).replace(/0+$/,'').replace(/\.$/,'') + '%</td><td><button type="button" class="v45-use" data-rate="' + r + '">Use</button></td></tr>'; }).join('')
    + '</tbody></table><div class="v45-board-ft">' + (R.state.fetchedAt ? 'Survey as of ' + esc(new Date(R.state.fetchedAt).toLocaleDateString()) : '') + ' · national averages, not a lock quote</div>';
}
function rateEditor(){
  var ed = document.querySelector('.v35-rail-editor'); if (!ed) return;
  var title = ed.querySelector('h3, .v35-ed-title, [class*="title"]'); if (!title || !/interest rate|note rate|^rate/i.test(title.textContent||'')) return;
  var host = ed.querySelector('#v45Board');
  if (!host){ host = document.createElement('div'); host.id='v45Board'; host.className='v45-board-host';
    var actions = ed.querySelector('.v35-ed-actions, .actions, [class*="actions"]'); if (actions) ed.insertBefore(host, actions); else ed.appendChild(host);
    host.addEventListener('click', function(e){ var b = e.target.closest('.v45-use'); if (!b) return;
      var inp = ed.querySelector('input'); if (inp){ inp.value = V45.cleanPct(b.dataset.rate); inp.dispatchEvent(new Event('input',{bubbles:true})); } });
  }
  var html = rateBoardHtml(); if (host.__sig !== html){ host.__sig = html; host.innerHTML = html; }
  $$('button', ed).forEach(function(b){ if (/open mortgage rates/i.test(b.textContent||'') && !b.__v45){ b.__v45 = true;
    b.addEventListener('click', function(ev){ ev.stopPropagation(); ev.preventDefault();
      try { if (window.V35 && V35.closeRailEditor) V35.closeRailEditor(); } catch(e){}
      var root = $('suite-root'); if (root) root.classList.remove('v25-full-active','v251-full-active');
      if (window.V8 && V8.go) V8.go('rates'); try { if (window.RATES) RATES.render(); } catch(e){}
      try { window.scrollTo(0,0); } catch(e){}
    }, true); } });
}

/* =================================================================== 8
   MORTGAGE RATES — the page, and the tier lookup on open
   =================================================================== */
function ratesOpen(){
  var p = $('panel-rates'); if (!p || !p.classList.contains('active') || p.__v45open) return;
  p.__v45open = true; setTimeout(function(){ p.__v45open = false; }, 4000);
  var s = store(); try { if (s && s.activeInputs.zipCode && s.applyZipLookup) s.applyZipLookup(); } catch(e){}
  try { if (window.LOANSUITE && LOANSUITE.PROP && LOANSUITE.PROP.state.zip && LOANSUITE.PROP.lookupZip) LOANSUITE.PROP.lookupZip(); } catch(e){}
  /* the header art: an oversized <use> that painted as a black disc */
  $$('#panel-rates svg.icon-lg, #panel-rates .hero svg, #panel-rates h1 svg, #panel-rates h2 svg').forEach(function(sv){ setClass(sv,'v45-icon',true); });
}

/* =================================================================== 9
   ADDRESS → THE FILE

   Release 44's search fills after a match is chosen. This makes the
   fill complete and clean: the street line without the country, the
   city, ZIP and county into their own fields wherever they sit, and
   an "Open in Google Maps" plus listing-site searches beside every
   address field — links, because there is no keyless address API from
   Google and no public one from USPS, and a link is what can be
   promised honestly.
   =================================================================== */
V45.cleanAddress = function(line){
  return norm(line).replace(/,\s*(United States( of America)?|USA|US)\s*$/i,'').replace(/\s*,\s*,/g,',').replace(/,\s*$/,'');
};
V45.parseNominatim = function(r){
  var a = r && r.address || {};
  var city = a.city || a.town || a.village || a.hamlet || a.municipality || '';
  var county = String(a.county||'').replace(/ county$/i,'');
  var street = [a.house_number, a.road].filter(Boolean).join(' ');
  var line = street || V45.cleanAddress((r && r.display_name || '').split(',').slice(0,2).join(','));
  return { line:line, city:city, state:a.state||'', zip:String(a.postcode||'').slice(0,5), county:county };
};
function fillEmpty(el, v){ if (!el || !v) return false; if (el.tagName === 'SELECT'){ var o = Array.prototype.filter.call(el.options, function(x){ return key(x.value)===key(v)||key(x.textContent)===key(v); })[0]; if (!o || el.value===o.value) return false; el.value = o.value; }
  else { if (norm(el.value)) return false; el.value = v; } el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return true; }
function sib(el, re){ var scope = el.closest('.card, .grid, form, fieldset, .card-body, section') || el.parentNode.parentNode;
  return $$('input, select', scope).filter(function(x){ if (x===el) return false; var k=((x.id||'')+' '+(x.name||'')+' '+(x.placeholder||'')+' '+(x.dataset.path||'')).toLowerCase(); var lab=x.closest('label'); var lt=lab?lab.textContent.toLowerCase():''; return re.test(k)||re.test(lt); })[0]; }
/* when release 44's result list applies a choice, clean and complete it */
document.addEventListener('change', function(e){
  var el = e.target; if (!el || el.tagName !== 'INPUT') return;
  var k = ((el.id||'')+' '+(el.name||'')+' '+(el.dataset.path||'')+' '+(el.placeholder||'')).toLowerCase();
  if (!/address|street/.test(k) || /email/.test(k)) return;
  var cleaned = V45.cleanAddress(el.value);
  if (cleaned !== el.value){ el.value = cleaned; }
  /* a full "street, city, state zip" line in one field: split what is missing beside it */
  var m = el.value.match(/^(.*?),\s*([^,]+?),\s*([A-Za-z .]+?)\s*(\d{5})?\s*$/);
  if (m){ fillEmpty(sib(el,/\bcity\b|town/), norm(m[2])); fillEmpty(sib(el,/\bstate\b/), norm(m[3])); if (m[4]) fillEmpty(sib(el,/zip|postal/), m[4]); }
}, true);
function addressLinks(){
  $$('#suite-root input, #calc-root input').forEach(function(el){
    var k = ((el.id||'')+' '+(el.name||'')+' '+(el.dataset.path||'')+' '+(el.placeholder||'')).toLowerCase();
    if (!/address|street/.test(k) || /email/.test(k)) return;
    var host = el.parentNode; if (!host || host.querySelector('.v45-links')) return;
    var box = document.createElement('div'); box.className='v45-links no-print';
    box.innerHTML = '<a target="_blank" rel="noopener" data-k="maps">Maps</a><a target="_blank" rel="noopener" data-k="zillow">Zillow</a><a target="_blank" rel="noopener" data-k="redfin">Redfin</a><a target="_blank" rel="noopener" data-k="realtor">Realtor</a>';
    host.appendChild(box);
    var paint = function(){ var q = encodeURIComponent(V45.cleanAddress(el.value)); if (!q){ box.style.display='none'; return; } box.style.display='';
      var m = { maps:'https://www.google.com/maps/search/?api=1&query='+q, zillow:'https://www.zillow.com/homes/'+q+'_rb/', redfin:'https://www.redfin.com/search/results?query='+q, realtor:'https://www.realtor.com/realestateandhomes-search/'+q };
      $$('a', box).forEach(function(a){ a.href = m[a.dataset.k]; }); };
    el.addEventListener('input', paint); el.addEventListener('change', paint); paint();
  });
}

/* =================================================================== 10
   FULL IS A TOGGLE — click it again to return to the last group
   =================================================================== */
function fullToggle(){
  var b = document.querySelector('#v23SuitePrimaryNav [data-group="full"]'); if (!b || b.__v45) return; b.__v45 = true;
  b.addEventListener('click', function(e){
    var root = $('suite-root'); var on = root && (root.classList.contains('v25-full-active') || root.classList.contains('v251-full-active'));
    if (!on) return;                                  /* the layer that owns Full opens it */
    e.stopImmediatePropagation(); e.preventDefault();
    root.classList.remove('v25-full-active','v251-full-active'); if (window.V25) V25.fullActive=false; if (window.V251) V251.fullActive=false;
    var last = get('los.v23.suiteGroup','file'); var g = document.querySelector('#v23SuitePrimaryNav [data-group="'+last+'"]'); if (g && g !== b) g.click();
  }, true);
}

/* =================================================================== 11
   MOVABLE SECTIONS, SAVED WITH THE SCENARIO

   Drag a section header to reorder the cards on a workspace. The order
   is stored on the scenario's inputs under `v45Layout[mode]`, so it
   travels with the file, saves with it, and is gone when the file is
   reset or a new one started. "Reset layout" puts the default back.
   =================================================================== */
function sectionsHost(){ return document.querySelector('#suite-root #screen-body, #suite-root .screen-body'); }
function cards(host){ return $$(':scope > .card, :scope > section, :scope > .v35-quote-card', host); }
function cardKey(c){ var h = c.querySelector('h2, h3, .card-head, .sec-head'); return key(h ? h.textContent : c.id || c.className).slice(0,60); }
function layoutApply(){
  var s = store(), host = sectionsHost(); if (!s || !host) return;
  var mode = s.snapshot && s.snapshot.mode; var lay = s.activeInputs && s.activeInputs.v45Layout; var order = lay && lay[mode];
  if (!order){ if (host.__v45order){ host.__v45order = null; cards(host).forEach(function(c){ c.style.order=''; }); } return; }
  var sig = order.join('|'); if (host.__v45order === sig) return; host.__v45order = sig;
  host.classList.add('v45-flex');
  cards(host).forEach(function(c){ var k = cardKey(c), i = order.indexOf(k); c.style.order = i >= 0 ? String(i) : '999'; });
}
function layoutSave(host){
  var s = store(); if (!s) return; var mode = s.snapshot && s.snapshot.mode;
  var order = cards(host).slice().sort(function(a,b){ return (N(a.style.order)||0) - (N(b.style.order)||0); }).map(cardKey);
  var lay = Object.assign({}, s.activeInputs.v45Layout||{}); lay[mode] = order;
  try { s.setField('v45Layout', lay, 'Section layout'); } catch(e){ s.activeInputs.v45Layout = lay; }
  host.__v45order = order.join('|');
}
V45.resetLayout = function(){ var s = store(); if (!s) return; var lay = Object.assign({}, s.activeInputs.v45Layout||{}); delete lay[s.snapshot.mode];
  try { s.setField('v45Layout', lay, 'Layout reset'); } catch(e){ s.activeInputs.v45Layout = lay; } var host = sectionsHost(); if (host){ host.__v45order = null; cards(host).forEach(function(c){ c.style.order=''; }); } say('Layout reset','Default arrangement restored for this page.','info',4000); };
function dragWire(){
  var host = sectionsHost(); if (!host) return;
  cards(host).forEach(function(c, idx){
    if (c.__v45drag) return; c.__v45drag = true;
    var h = c.querySelector('h2, h3, .card-head'); if (!h) return;
    h.setAttribute('draggable','true'); h.classList.add('v45-grip'); h.title = 'Drag to move this section';
    h.addEventListener('dragstart', function(e){ host.__v45from = c; e.dataTransfer.effectAllowed='move'; try { e.dataTransfer.setData('text/plain', cardKey(c)); } catch(x){} c.classList.add('v45-dragging'); });
    h.addEventListener('dragend', function(){ c.classList.remove('v45-dragging'); });
    c.addEventListener('dragover', function(e){ if (host.__v45from && host.__v45from !== c){ e.preventDefault(); c.classList.add('v45-over'); } });
    c.addEventListener('dragleave', function(){ c.classList.remove('v45-over'); });
    c.addEventListener('drop', function(e){ e.preventDefault(); c.classList.remove('v45-over'); var from = host.__v45from; if (!from || from === c) return;
      host.classList.add('v45-flex');
      var list = cards(host); list.forEach(function(x,i){ if (!x.style.order) x.style.order = String(i); });
      var fo = N(from.style.order), to = N(c.style.order); list.forEach(function(x){ var o = N(x.style.order); if (fo < to){ if (o > fo && o <= to) x.style.order = String(o-1); } else { if (o >= to && o < fo) x.style.order = String(o+1); } }); from.style.order = String(to);
      layoutSave(host); });
  });
  if (!host.querySelector('#v45LayoutReset') && cards(host).length > 1){ var b = document.createElement('button'); b.type='button'; b.id='v45LayoutReset'; b.className='v45-reset no-print'; b.textContent='Reset layout'; b.onclick = V45.resetLayout; host.appendChild(b); }
}

/* =================================================================== 12
   THE CALCULATOR'S FILE ACTIONS CARRY THE SUITE'S ACTIONS TOO
   =================================================================== */
function calcActions(){
  var grid = document.querySelector('#v23CalcActions .v23-actions-grid'); if (!grid || grid.__v45) return;
  var inv = {}; $$('#v23SuiteActions button, #v24LoanTools button, #v35Panel button').forEach(function(b){ var l = norm(b.textContent).replace(/\s*\u25BE\s*$/,''); if (l && l.length <= 40 && !inv[key(l)]) inv[key(l)] = b; });
  var labels = Object.keys(inv); if (!labels.length) return; grid.__v45 = true;
  var head = document.createElement('div'); head.className='v30-mhead'; head.textContent='Loan Suite'; grid.appendChild(head);
  labels.sort().forEach(function(k){ var b = document.createElement('button'); b.type='button'; b.className='btn v23-action v45-calc-action'; b.textContent = norm(inv[k].textContent).replace(/\s*\u25BE\s*$/,'');
    b.onclick = function(){ try { if (window.LOS && LOS.go) LOS.go('s'); } catch(e){} setTimeout(function(){ try { inv[k].click(); } catch(e){} }, 120); }; grid.appendChild(b); });
}

/* =================================================================== 13
   EVERY ROW ON THE SCENARIO SUMMARY OPENS ITS SOURCE
   =================================================================== */
document.addEventListener('click', function(e){
  var s = store(); if (!s || !s.snapshot || s.snapshot.mode !== 'summary') return;
  var row = e.target.closest('#suite-root #screen-body tr, #suite-root #screen-body .out, #suite-root #screen-body li, #suite-root #screen-body .row'); if (!row || e.target.closest('button, a, input, select')) return;
  var label = norm((row.querySelector('td, .l, b, span') || row).textContent).slice(0,60); if (!label) return;
  if (window.V35 && V35.openRailEditor){ try { V35.openRailEditor(row, label, ''); } catch(x){} }
}, true);

/* =================================================================== 14
   OUTSIDE CLICK CLOSES EVERYTHING THAT FLOATS
   =================================================================== */
document.addEventListener('mousedown', function(e){
  var t = e.target;
  if (!t.closest('.v35-rail-editor') && !t.closest('.rail') && window.V35 && V35.closeRailEditor && document.querySelector('.v35-rail-editor')){ try { V35.closeRailEditor(); } catch(x){} }
  if (!t.closest('#v39Look') && !t.closest('#v39LookBtn')){ var l = $('v39Look'); if (l && l.classList.contains('on')){ l.classList.remove('on'); l.hidden = true; } }
  var d = $('v45Dates'); if (d && !t.closest('#v45Dates')) d.hidden = true;
  ['v11LeModal','v12Modal','v30GenModal','v36AssetAiModal','v36AssetGuideModal'].forEach(function(id){ var m = $(id); if (m && m.classList.contains('on') && t === m) m.classList.remove('on'); });
});

/* =================================================================== 15
   WIRING
   =================================================================== */
function tick(){
  try { cleanEditors(); } catch(e){}
  try { sellerCredit(); } catch(e){}
  try { draws(); } catch(e){}
  try { wrapNaming(); } catch(e){}
  try { arvBanner(); } catch(e){}
  try { rateEditor(); } catch(e){}
  try { ratesOpen(); } catch(e){}
  try { addressLinks(); } catch(e){}
  try { fullToggle(); } catch(e){}
  try { layoutApply(); dragWire(); } catch(e){}
  try { calcActions(); } catch(e){}
}
if (window.LOS_SCHEDULER && LOS_SCHEDULER.add) LOS_SCHEDULER.add(tick, 1200); else setInterval(tick, 900);
setTimeout(tick, 240);
})();
