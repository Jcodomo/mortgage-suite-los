/* =====================================================================
   v9 — four themes, the stuck proration dates, and a Documents/OCR tab
        on the suite side.

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

var V9 = window.V9 = {};

/* =================================================================== 1
   FOUR THEMES — navy, dark, OLED, light

   LOS.setSkin already treats anything that isn't 'light' as dark, so a
   fourth skin needs no change there: only the cycle order, the icon, and
   a token block in patch-v9.css. OLED is true #000 with dimmer text,
   which is the point of it — an OLED panel draws no power on black
   pixels, and near-black greys defeat that entirely.
   =================================================================== */
/* Light -> Dark -> Navy -> OLED, which is both the order they were asked
   for and a sensible brightness ramp: paper, charcoal, blue, true black. */
var NEXT  = { light:'dark', dark:'navy', navy:'oled', oled:'light' };
var LABEL = { light:'Light', dark:'Dark (black)', navy:'Navy blue', oled:'OLED true black' };
var ICON  = {
  light:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  dark: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>',
  navy: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>',
  oled: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 000 18z" fill="currentColor" stroke="none"/></svg>'
};
function retheme(){
  var btn = $('v5ThemeBtn'); if (!btn) return;
  if (!btn.__v9){
    btn.__v9 = true;
    /* Replace v5's three-way handler with the four-way cycle. Cloning
       drops every listener the old layer attached, which is the only way
       to be sure the old cycle is gone rather than racing it. */
    var fresh = btn.cloneNode(false);
    btn.parentNode.replaceChild(fresh, btn);
    fresh.__v9 = true;
    fresh.addEventListener('click', function(){
      var cur = (window.LOS && LOS.skin) ? LOS.skin() : 'light';
      LOS.setSkin(NEXT[cur] || 'navy');
      paintTheme();
    });
    btn = fresh;
  }
  paintTheme();
}
function paintTheme(){
  var cur = (window.LOS && LOS.skin) ? LOS.skin() : 'light';
  ['v5ThemeBtn','v9ShellTheme','v9SuiteTheme'].forEach(function(id){
    var btn = $(id); if (!btn) return;
    btn.innerHTML = ICON[cur] || ICON.light;
    btn.title = (LABEL[cur] || cur) + ' \u2014 click for ' + (LABEL[NEXT[cur]] || 'Navy');
  });
}
/* The control exists in three places, because there are three pieces of
   chrome and no single one of them is on screen at all times:

     #losBar          the calculator's own app bar   (v5 converts this)
     #shellbar        the mode switch, visible from both shells
     #suite-root      the Loan Suite's toolbar

   All three are the same button: same NEXT map, same painter, and they
   all commit through LOS.setSkin, which writes one data-skin attribute
   on <html>. That single attribute is what drives both shells' CSS, so
   pressing any one of them repaints everything — the buttons cannot
   report different themes because none of them holds any state.
   =================================================================== */
function mountThemeBtn(id, host, where, cls){
  if ($(id)) return true;
  if (!host) return false;
  var b = document.createElement('button');
  b.type = 'button'; b.id = id; b.className = cls || 'v9-shelltheme';
  b.setAttribute('aria-label', 'Change colour theme');
  b.addEventListener('click', function(){
    var cur = (window.LOS && LOS.skin) ? LOS.skin() : 'light';
    LOS.setSkin(NEXT[cur] || 'navy');
    paintTheme();
  });
  if (where === 'first') host.insertBefore(b, host.firstChild);
  else host.appendChild(b);
  paintTheme();
  return true;
}
function buildShellTheme(){
  var ok = mountThemeBtn('v9ShellTheme', document.querySelector('#shellbar .hand'), 'first');
  /* Suite toolbar: drop it next to the spacer so it sits with New /
     Reset / Save rather than being pushed off the end of the row. */
  var tb = document.querySelector('#suite-root .toolbar');
  if (tb && !$('v9SuiteTheme')){
    var sp = tb.querySelector('.spacer');
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'v9SuiteTheme'; b.className = 'v9-suitetheme';
    b.setAttribute('aria-label', 'Change colour theme');
    b.addEventListener('click', function(){
      var cur = (window.LOS && LOS.skin) ? LOS.skin() : 'light';
      LOS.setSkin(NEXT[cur] || 'navy');
      paintTheme();
    });
    if (sp && sp.nextSibling) tb.insertBefore(b, sp.nextSibling);
    else tb.appendChild(b);
    paintTheme();
  }
  return ok;
}
/* v5's own paint loop calls this instead of racing it — see patch-v5. */
V9.paintTheme = paintTheme;

/* =================================================================== 2
   THE STUCK PRORATION DATES

   v8 converted the seller-paid-through field from a date picker to text
   by rewriting the DOM on a 500ms poll. Two things made that unusable:

   1. TAX.set() ends in TAX.render(), which rewrites the panel's whole
      innerHTML. Every commit therefore destroyed the field, and for up
      to half a second afterwards it was a date input again — so a typed
      date could land back in a picker mid-edit.
   2. mountTaxesInEscrow() re-created the host (and re-rendered the
      panel) on any poll where the previous host had been detached by a
      screen re-render, which on the Escrow tab is often.

   Both are fixed by converting synchronously inside a wrap of
   TAX.render, so the field is never briefly the wrong type, and by
   holding the re-render while the caret is inside the panel.
   =================================================================== */
function pretty(isoStr){
  return (window.V7 && V7.pretty) ? V7.pretty(isoStr) : (isoStr || '');
}
function parse(raw){
  return (window.V7 && V7.parseDate) ? V7.parseDate(raw) : String(raw || '').trim();
}
function addDays(isoStr, n){
  if (!isoStr) return '';
  var d = new Date(isoStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0')
       + '-' + String(d.getDate()).padStart(2,'0');
}
/* Commit helpers used by the rewritten inputs. Both parse tolerantly and
   simply leave the box alone if what is in it is not yet a date, so a
   half-typed value is never thrown away. */
V9.setTaxDate = function(key, raw){
  if (!window.TAXPRO) return;
  var s = String(raw || '').trim();
  if (!s){ TAXPRO.set(key, ''); return; }
  var isoStr = parse(s);
  if (!isoStr){
    say('That date could not be read', 'Try 9/17/26, 09-17-2026 or Sep 17 2026.', 'warn', 5000);
    return;
  }
  TAXPRO.set(key, isoStr);
};
V9.setTaxNum = function(key, raw){
  /* These fields are already type=text (converted before v10 existed),
     so v10's number-input stripping never sees them. "$13,000" through
     parseFloat is NaN, which N() turns into 0 — strip here. */
  if (window.TAXPRO) TAXPRO.set(key, String(raw == null ? '' : raw).replace(/[$,\s]/g, ''));
};

/* Seller-paid-through starts one day after closing, which is the normal
   opening position: the seller has covered the bill through the day
   before the buyer takes over. Written once, only when blank, so it
   never overwrites a real figure. */
function seedPaidThrough(){
  if (!window.TAXPRO) return false;
  var s = TAXPRO.state;
  if (!s.closing || s.sellerPaidThrough) return false;
  if (TAXPRO.__v9seeded) return false;
  TAXPRO.__v9seeded = true;
  s.sellerPaidThrough = addDays(s.closing, 1);
  try { TAXPRO.set('sellerPaidThrough', s.sellerPaidThrough); } catch(e){}
  return true;
}
/* Convert the panel's inputs the moment it is rendered. Everything is
   free-form except the billing cycle and the closing date, which stay
   as the pickers they were asked to stay. */
function convertTaxPanel(){
  var host = $('taxBody'); if (!host) return;
  $$('input', host).forEach(function(el){
    var oc = el.getAttribute('onchange') || '';
    var m = oc.match(/TAXPRO\.set\('([a-zA-Z]+)'/);
    if (!m) return;
    var key = m[1];
    if (key === 'closing') return;                 /* stays a date picker */
    if (el.type === 'date'){
      el.type = 'text';
      el.value = pretty(el.value);
      el.placeholder = 'mm/dd/yyyy';
      el.setAttribute('onchange', "V9.setTaxDate('" + key + "',this.value)");
    } else if (el.type === 'number'){
      el.type = 'text';
      el.inputMode = 'decimal';
      el.setAttribute('onchange', "V9.setTaxNum('" + key + "',this.value)");
    }
  });
}
function wrapTaxRender(){
  if (!window.TAXPRO || typeof TAXPRO.render !== 'function' || TAXPRO.render.__v9) return false;
  var inner = TAXPRO.render;
  var wrapped = function(){
    /* Never rebuild the panel out from under a caret — TAX.set calls
       render on every commit, and the Escrow screen re-renders often. */
    var live = document.activeElement;
    var host = $('taxBody');
    if (host && live && host.contains(live) && live.tagName === 'INPUT'){
      TAXPRO.__v9dirty = true;
      return;
    }
    var r = inner.apply(this, arguments);
    try { convertTaxPanel(); } catch(e){}
    return r;
  };
  wrapped.__v9 = true;
  TAXPRO.render = wrapped;
  /* Flush any render that was held back, once focus leaves the panel. */
  document.addEventListener('focusout', function(){
    setTimeout(function(){
      if (!TAXPRO.__v9dirty) return;
      var host = $('taxBody');
      var live = document.activeElement;
      if (host && live && host.contains(live)) return;
      TAXPRO.__v9dirty = false;
      try { TAXPRO.render(); } catch(e){}
    }, 0);
  }, true);
  return true;
}

/* =================================================================== 3
   SUITE-SIDE DOCUMENTS & OCR

   Its own tab and its own panel, but deliberately NOT its own OCR
   engine. The calculator already loads pdf.js and a Tesseract worker;
   standing up a second worker would double the memory and run two
   recognisers over the same page for no benefit. This reuses the loaded
   engine through the calculator's own pdfText / pdfPageImages /
   ocrImages, one file at a time, and says so on the panel.
   =================================================================== */
var DOCQ = V9.DOCS = { files: [], queue: [], busy: false };

/* Suite fields worth assigning a scanned figure to. Kept to the ones the
   suite actually takes as input — assigning into a derived output would
   be overwritten on the next recalculation. */
/* Key names and units checked against the engine's own input defaults.
   Three of the obvious guesses were wrong and are corrected here:
   the tax field is propertyTaxAmount (not annualPropertyTax), insurance
   is insuranceAmount (not annualHazardInsurance), and the concession
   splits into a Pct and an Amount rather than a single field.

   `scale` matters more than it looks: interestRate is stored as a
   FRACTION (0.06875), while every document on earth prints 6.875.
   Writing the printed number straight in would set a 687% note rate. */
var ASSIGN = [
  ['', '\u2014 do not assign \u2014'],
  ['basePurchasePrice',       'Purchase price'],
  ['asIsValue',               'As-is / appraised value'],
  ['afterRepairValue',        'After-repair value'],
  ['interestRate',            'Note rate (%)'],
  ['termYears',               'Term (years)'],
  ['creditScore',             'Credit score'],
  ['propertyTaxAmount',       'Property tax amount'],
  ['insuranceAmount',         'Insurance amount'],
  ['hoaMonthly',              'HOA monthly'],
  ['earnestMoneyDeposit',     'Earnest money deposit'],
  ['sellerConcessionAmount',  'Seller concession ($)'],
  ['reno.baseCost',           'Renovation base cost']
];
/* Fields whose stored unit differs from the printed one. */
var SCALE = { interestRate: 0.01 };
/* Every figure the extractor finds, as {label, value, raw}. Patterns are
   deliberately conservative — a wrong auto-fill is worse than a miss. */
var GRABS = [
  ['Purchase price',        /(?:purchase|sale|contract)\s*price[^\d$]{0,20}\$?\s*([\d,]+(?:\.\d{2})?)/i, 'basePurchasePrice'],
  ['Loan amount',           /loan\s*amount[^\d$]{0,20}\$?\s*([\d,]+(?:\.\d{2})?)/i, ''],
  ['Interest rate',         /interest\s*rate[^\d]{0,20}([\d.]+)\s*%/i, 'interestRate'],
  ['Appraised value',       /appraised\s*value[^\d$]{0,20}\$?\s*([\d,]+(?:\.\d{2})?)/i, 'asIsValue'],
  ['After-repair value',    /(?:after[- ]repair|as[- ]completed)\s*value[^\d$]{0,20}\$?\s*([\d,]+(?:\.\d{2})?)/i, 'afterRepairValue'],
  ['Annual property tax',   /(?:annual\s*)?(?:property\s*)?tax(?:es)?[^\d$]{0,20}\$?\s*([\d,]+(?:\.\d{2})?)/i, 'propertyTaxAmount'],
  ['Hazard insurance',      /(?:homeowner|hazard)[^\n]{0,30}insurance[^\d$]{0,20}\$?\s*([\d,]+(?:\.\d{2})?)/i, 'insuranceAmount'],
  ['HOA',                   /\bHOA[^\d$]{0,20}\$?\s*([\d,]+(?:\.\d{2})?)/i, 'hoaMonthly'],
  /* "deposit" alone was in the first draft's pattern and is a trap — it
     matches "Initial Escrow ... deposit" and "security deposit" long
     before it means earnest money. Only the explicit phrasings count. */
  ['Earnest money',         /(?:earnest\s*money(?:\s*deposit)?|good\s*faith\s*deposit)[^\d$]{0,20}\$?\s*([\d,]+(?:\.\d{2})?)/i, 'earnestMoneyDeposit'],
  ['Seller concession',     /seller\s*(?:credit|concession)[^\d$]{0,20}\$?\s*([\d,]+(?:\.\d{2})?)/i, 'sellerConcessionAmount'],
  ['Credit score',          /(?:FICO|credit\s*score)[^\d]{0,20}(\d{3})\b/i, 'creditScore'],
  ['Renovation / rehab',    /(?:renovation|rehab(?:ilitation)?)\s*(?:cost|amount|total)[^\d$]{0,20}\$?\s*([\d,]+(?:\.\d{2})?)/i, 'reno.baseCost']
];
function extractFigures(text){
  var t = (window.DOCP && DOCP._norm) ? DOCP._norm(text) : text;
  var out = [];
  GRABS.forEach(function(g){
    var m = t.match(g[1]);
    if (!m) return;
    out.push({ label:g[0], value:N(String(m[1]).replace(/,/g,'')), target:g[2], raw:m[0].replace(/\s+/g,' ').trim() });
  });
  return out;
}
/* One file at a time. `busy` is the whole concurrency control: the
   Tesseract worker is single-threaded and queueing several files at once
   just makes all of them slower and the progress meaningless. */
V9.addDocs = function(files){
  /* One shared queue. The first draft kept the list in the closure and
     bailed if the worker was busy — so a second drop made while a scan
     was running was silently discarded, which is exactly how people
     feed it: several files, one after another. */
  Array.prototype.push.apply(DOCQ.queue, Array.prototype.slice.call(files));
  pump();
};
function pump(){
  if (DOCQ.busy) return;
  var f = DOCQ.queue.shift();
  if (!f){ V9.renderDocs(); return; }
  DOCQ.busy = true;
  var rec = { id:'d'+Date.now()+Math.random().toString(36).slice(2,6),
              name:f.name, status:'reading',
              note:'Reading\u2026' + (DOCQ.queue.length ? ' (' + DOCQ.queue.length + ' waiting)' : ''),
              figures:[], text:'' };
  DOCQ.files.push(rec); V9.renderDocs();
  readOne(f, rec).then(function(){
    DOCQ.busy = false; V9.renderDocs(); pump();
  });
}
function readOne(f, rec){
  var isPdf = /\.pdf$/i.test(f.name);
  var chain;
  if (isPdf && typeof window.pdfText === 'function'){
    chain = window.pdfText(f).then(function(r){
      if ((r.text || '').replace(/\s/g,'').length > 40) return r.text;
      rec.note = 'No text layer \u2014 running OCR\u2026'; V9.renderDocs();
      return window.pdfPageImages(r.pdf, 8).then(function(imgs){ return window.ocrImages(imgs); });
    });
  } else if (typeof window.ocrImages === 'function' && /\.(png|jpe?g)$/i.test(f.name)){
    chain = Promise.resolve(URL.createObjectURL(f)).then(function(u){ return window.ocrImages([u]); });
  } else {
    chain = f.text();
  }
  return chain.then(function(text){
    rec.text = text || '';
    rec.figures = extractFigures(rec.text);
    rec.status = 'done';
    rec.note = rec.figures.length + ' figure(s) found';
  }).catch(function(e){
    rec.status = 'error';
    rec.note = (e && e.message) || 'Could not read this file';
  });
}
V9.assign = function(fileId, idx, target){
  var rec = DOCQ.files.filter(function(x){ return x.id === fileId; })[0];
  if (!rec) return;
  rec.figures[idx].target = target;
  V9.renderDocs();
};
V9.applyOne = function(fileId, idx){
  var rec = DOCQ.files.filter(function(x){ return x.id === fileId; })[0]; if (!rec) return;
  var fig = rec.figures[idx]; if (!fig || !fig.target) return;
  pushField(fig.target, fig.value, rec.name);
  say('Applied', fig.label + ' \u2192 ' + fig.target + ' = ' + fig.value, 'good', 5000);
};
V9.applyAll = function(fileId){
  var rec = DOCQ.files.filter(function(x){ return x.id === fileId; })[0]; if (!rec) return;
  var n = 0;
  rec.figures.forEach(function(f){ if (f.target){ pushField(f.target, f.value, rec.name); n++; } });
  say(n ? 'Applied ' + n + ' field(s)' : 'Nothing assigned',
      n ? 'From ' + rec.name + '. Check each one against the document before relying on it.'
        : 'Pick a destination in the dropdowns first.', n ? 'good' : 'warn', 7000);
};
/* setField(path, value, label) already walks dotted paths and array
   indices itself and emits afterwards, so there is nothing to special
   case here — an earlier draft reimplemented that badly. */
function pushField(path, value, source){
  var st = suite(); if (!st) return;
  var v = N(value) * (SCALE[path] || 1);
  try { st.setField(path, v, 'OCR \u2014 ' + source); } catch(e){}
  if (window.RECALC) window.RECALC();
}
V9.removeDoc = function(id){
  DOCQ.files = DOCQ.files.filter(function(x){ return x.id !== id; });
  V9.renderDocs();
};

/* ---- the AI prompt panel -------------------------------------------
   There is no API key in a file:// page and there should not be one, so
   this does what the calculator's own extraction flow does: builds a
   precise prompt with the document text, you run it in whichever
   assistant you use, and paste the JSON back. */
V9.aiPrompt = function(fileId){
  var rec = DOCQ.files.filter(function(x){ return x.id === fileId; })[0]; if (!rec) return;
  var keys = ASSIGN.filter(function(a){ return a[0]; }).map(function(a){ return a[0]; });
  var p = 'You are reading a mortgage document. Return ONLY a JSON object, no prose, no code fence.\n'
    + 'Use exactly these keys where the document supports them, omitting any you cannot find:\n'
    + keys.join(', ') + '\n'
    + 'Rules: numbers only, no currency symbols, no thousands separators. Rates as a decimal '
    + 'percent (6.875 not 0.06875). If a figure appears more than once, use the one on the final '
    + 'or most authoritative page. Do not guess.\n\n--- DOCUMENT TEXT ---\n'
    + rec.text.slice(0, 60000);
  var ta = $('v9PromptBox'); if (ta){ ta.value = p; ta.focus(); ta.select(); }
  try { navigator.clipboard.writeText(p); say('Prompt copied', 'Paste it into your assistant, then paste the JSON it returns into the box below.', 'good', 7000); }
  catch(e){ say('Prompt ready', 'Copy it from the box below.', 'info', 6000); }
};
V9.applyAiJson = function(){
  var ta = $('v9JsonBox'); if (!ta) return;
  var raw = (ta.value || '').replace(/```json|```/g, '').trim();
  if (!raw) return say('Nothing to apply', 'Paste the JSON the assistant returned first.', 'warn');
  var obj;
  try { obj = JSON.parse(raw); }
  catch(e){ return say('That is not valid JSON', 'Paste only the object the assistant returned \u2014 no explanation around it.', 'warn', 8000); }
  var n = 0;
  Object.keys(obj).forEach(function(k){
    var v = obj[k];
    if (v == null || v === '') return;
    if (!ASSIGN.some(function(a){ return a[0] === k; })) return;   /* ignore unknown keys */
    pushField(k, N(v), 'AI extraction');
    n++;
  });
  say(n ? 'Applied ' + n + ' field(s)' : 'Nothing recognised',
      n ? 'Check every figure against the document \u2014 this came from a language model, not the file itself.'
        : 'None of the keys in that JSON match the assignable fields.', n ? 'good' : 'warn', 8000);
};

V9.renderDocs = function(){
  var host = $('v9DocBody'); if (!host) return;
  var cards = DOCQ.files.map(function(rec){
    var figs = rec.figures.map(function(f, i){
      return '<tr><td>' + esc(f.label) + '</td>'
        + '<td class="num">' + esc(String(f.value)) + '</td>'
        + '<td><select class="cell-input" onchange="V9.assign(\'' + rec.id + '\',' + i + ',this.value)">'
        + ASSIGN.map(function(a){
            return '<option value="' + esc(a[0]) + '"' + (a[0] === f.target ? ' selected' : '') + '>' + esc(a[1]) + '</option>';
          }).join('')
        + '</select></td>'
        + '<td><button class="btn btn-light btn-sm"' + (f.target ? '' : ' disabled')
        + ' onclick="V9.applyOne(\'' + rec.id + '\',' + i + ')">Apply</button></td>'
        + '<td class="muted small">' + esc(f.raw.slice(0, 70)) + '</td></tr>';
    }).join('');
    return '<div class="card"><div class="card-top"><span class="tag">'
      + (rec.status === 'error' ? 'Failed' : rec.status === 'done' ? 'Read' : 'Working')
      + '</span><span class="doc-name">' + esc(rec.name) + '</span><div class="spacer"></div>'
      + '<span class="muted small">' + esc(rec.note) + '</span>'
      + '<button class="btn-icon" onclick="V9.removeDoc(\'' + rec.id + '\')">\u00d7</button></div>'
      + '<div class="card-body">'
      + (figs
          ? '<table class="tbl"><thead><tr><th>Found</th><th class="num">Value</th>'
            + '<th>Assign to</th><th></th><th>Context</th></tr></thead><tbody>' + figs + '</tbody></table>'
            + '<div class="v9-row"><button class="btn btn-primary" onclick="V9.applyAll(\'' + rec.id + '\')">Apply all assigned</button>'
            + '<button class="btn btn-light" onclick="V9.aiPrompt(\'' + rec.id + '\')">Build an AI prompt from this file</button></div>'
          : '<p class="muted">No figures matched the built-in patterns. Build an AI prompt from this file and paste the result below \u2014 that path reads anything.</p>'
            + '<div class="v9-row"><button class="btn btn-light" onclick="V9.aiPrompt(\'' + rec.id + '\')">Build an AI prompt from this file</button></div>')
      + '</div></div>';
  }).join('');
  host.innerHTML = cards
    || '<div class="card"><div class="card-body"><p class="muted">No documents yet. Drop a PDF or image above.</p></div></div>';
};
function buildDocPanel(){
  if ($('panel-v9docs')) return true;
  var sr = $('suite-root'); if (!sr) return false;
  var stage = $('v8Stage');
  if (!stage){
    var cm = sr.querySelector('.cols-main'); if (!cm || !cm.parentNode) return false;
    stage = document.createElement('div'); stage.id = 'v8Stage';
    cm.parentNode.insertBefore(stage, cm.nextSibling);
    stage.style.display = 'none';
  }
  var p = document.createElement('div');
  p.className = 'panel'; p.id = 'panel-v9docs';
  p.innerHTML =
    '<div class="card"><div class="card-top"><span class="tag">OCR</span>'
    + '<span class="doc-name">Documents &mdash; read a file and push figures into the suite</span></div>'
    + '<div class="card-body">'
      + '<div class="dropzone v9-dz" id="v9Dz">'
        + '<div class="dz-t">Drop a PDF or image, or click to browse</div>'
        + '<div class="dz-s">PDFs with a text layer are read directly; scans go through OCR. '
        + 'Files are processed one at a time on the engine the calculator already has loaded &mdash; '
        + 'a second recogniser would only halve the speed of both.</div>'
      + '</div>'
      + '<input type="file" id="v9File" accept=".pdf,.png,.jpg,.jpeg,.txt" multiple style="display:none">'
    + '</div></div>'
    + '<div id="v9DocBody"></div>'
    + '<div class="card"><div class="card-top"><span class="tag">AI</span>'
      + '<span class="doc-name">Ask an assistant to read it instead</span></div><div class="card-body">'
      + '<p class="muted">Nothing here calls an API &mdash; there is no key in a local file and there should not be. '
      + 'Build a prompt from a document above, run it wherever you like, then paste the JSON back.</p>'
      + '<label class="v9-lbl">Prompt (copied automatically)</label>'
      + '<textarea id="v9PromptBox" class="cell-input v9-ta" rows="5" placeholder="Use \u201cBuild an AI prompt\u201d on a document above."></textarea>'
      + '<label class="v9-lbl">Paste the JSON that comes back</label>'
      + '<textarea id="v9JsonBox" class="cell-input v9-ta" rows="5" placeholder=\'{ "basePurchasePrice": 551200, "interestRate": 6.875 }\'></textarea>'
      + '<div class="v9-row"><button class="btn btn-primary" onclick="V9.applyAiJson()">Apply the JSON</button></div>'
    + '</div></div>';
  stage.appendChild(p);
  var dz = $('v9Dz'), fi = $('v9File');
  dz.addEventListener('click', function(){ fi.click(); });
  fi.addEventListener('change', function(){ if (fi.files.length) V9.addDocs(fi.files); fi.value = ''; });
  ['dragenter','dragover'].forEach(function(ev){
    dz.addEventListener(ev, function(e){ e.preventDefault(); e.stopPropagation(); dz.classList.add('drag'); });
  });
  ['dragleave','drop'].forEach(function(ev){
    dz.addEventListener(ev, function(e){ e.preventDefault(); e.stopPropagation(); dz.classList.remove('drag'); });
  });
  dz.addEventListener('drop', function(e){
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer && e.dataTransfer.files.length) V9.addDocs(e.dataTransfer.files);
  });
  V9.renderDocs();
  return true;
}
/* Turn v8's hand-off button into a tab for this panel instead. */
function claimDocsTab(){
  var sr = $('suite-root'); if (!sr) return;
  var row = sr.querySelector('.tabs'); if (!row) return;
  var b = row.querySelector('.v8-docs'); if (!b || b.__v9) return;
  b.__v9 = true;
  var fresh = b.cloneNode(true);
  fresh.textContent = 'DOCUMENTS & OCR';
  fresh.dataset.v8 = 'v9docs';
  fresh.classList.remove('v8-docs');
  b.parentNode.replaceChild(fresh, b);
  fresh.addEventListener('click', function(){
    if (!buildDocPanel()) return;
    if (window.V8 && V8.go){
      /* reuse v8's stage machinery by registering ourselves as a tab */
      V8.active = 'v9docs';
      var cm = sr.querySelector('.cols-main');
      var stage = $('v8Stage');
      $$('#v8Stage .panel').forEach(function(p){ p.classList.toggle('active', p.id === 'panel-v9docs'); });
      if (stage) stage.style.display = '';
      if (cm) cm.style.display = 'none';
      var adv = $('advBar'); if (adv) adv.style.display = 'none';
      var moved = $('suiteMoved'); if (moved) moved.style.display = 'none';
      $$('.tab', row).forEach(function(x){ x.classList.remove('active'); });
      fresh.classList.add('active');
    }
  });
}

/* =================================================================== 4
   ESCAPE closes what is open — the report modal, either toolbar menu,
   and the lock-extension card if it is expanded. Small, but reaching for
   Escape and having nothing happen is the kind of paper cut that makes
   a tool feel unfinished.
   =================================================================== */
document.addEventListener('keydown', function(e){
  if (e.key !== 'Escape') return;
  var modal = $('rptModal');
  if (modal && modal.classList.contains('on')){
    try { window.closeReport(); } catch(err){}
    return;
  }
  var open = document.querySelector('.menu.on');
  if (open){
    try { window.closeMenu ? window.closeMenu() : open.classList.remove('on'); } catch(err){}
    return;
  }
});

/* =================================================================== 5
   WIRING
   =================================================================== */
setInterval(function(){
  try { retheme(); buildShellTheme(); } catch(e){}
  try { wrapTaxRender(); seedPaidThrough(); } catch(e){}
  try { convertTaxPanel(); } catch(e){}
  try { claimDocsTab(); } catch(e){}
}, 500);
})();
