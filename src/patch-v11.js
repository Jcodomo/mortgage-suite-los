/* =====================================================================
   v11 — a JSON / AI import on the Loan Suite, multi-Loan-Estimate
         extraction into scenarios, the import modal layout, the escrow
         cushion default, and the Property screen corrections.

   Nothing in either engine is edited.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function G(n){ try { return (0, eval)(n); } catch(e){ return undefined; } }
function N(v){ v = parseFloat(String(v == null ? '' : v).replace(/[$,\s%]/g,'')); return isFinite(v) ? v : 0; }
function usd(v,dp){ dp = dp===undefined?0:dp; var n=N(v);
  return (n<0?'\u2212':'')+'$'+Math.abs(n).toLocaleString('en-US',
    {minimumFractionDigits:dp,maximumFractionDigits:dp}); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function suite(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
function say(t,b,k,ms){ if (window.LOS && LOS.say) LOS.say(t,b,k,ms); }

var V11 = window.V11 = {};

/* =================================================================== 1
   ESCROW CUSHION — default to two months

   RESPA allows a cushion of up to two months and that is what nearly
   every file runs. The engine already defaults to the state rule
   (`cushionMonthsOverride: -1`), which is 2 in every jurisdiction in the
   table EXCEPT Nebraska and Vermont, which are 1 by state rule.

   So the default is set to 2 for new scenarios, and those two states are
   deliberately left on their statutory figure — blanket-overriding them
   to 2 would collect a cushion the state does not permit.
   =================================================================== */
var LOW_CUSHION_STATES = { Nebraska:1, Vermont:1 };
function defaultCushion(){
  var st = suite(); if (!st || typeof st.newScenario !== 'function' || st.newScenario.__v11) return false;
  var inner = st.newScenario.bind(st);
  st.newScenario = function(){
    var id = inner.apply(st, arguments);
    try {
      var s = st.state.scenarios[id];
      var state = s && s.inputs && s.inputs.state;
      if (s && s.inputs && s.inputs.escrow && !LOW_CUSHION_STATES[state])
        s.inputs.escrow.cushionMonthsOverride = 2;
    } catch(e){}
    return id;
  };
  st.newScenario.__v11 = true;
  /* the scenario already open when this loads */
  try {
    var i = suite().activeInputs;
    if (i && i.escrow && i.escrow.cushionMonthsOverride === -1 && !LOW_CUSHION_STATES[i.state]
        && !V11.__cushionSeeded){
      V11.__cushionSeeded = true;
      i.escrow.cushionMonthsOverride = 2;
      suite().emit && suite().emit();
    }
  } catch(e){}
  return true;
}

/* =================================================================== 2
   PROPERTY SCREEN

   Two corrections:

   a) The address field carried a sample address as its PLACEHOLDER. A
      placeholder is grey helper text, not a value — but at a glance in a
      field that is meant to hold an address it reads as one, and it was
      being mistaken for real data. Replaced with a format hint.

   b) "Do we have an address?" is a two-state MODE toggle, not a data
      field, and v8's blanket free-form conversion turned it into a text
      box that would accept anything — hence a house number ending up in
      it. Mode toggles are restored to selects; free-form stays on
      everything that actually holds data.
   =================================================================== */
var MODE_KEYS = { mode:1, listingStatus:1 };
function fixPropertyFields(){
  var host = $('propBody'); if (!host) return;
  $$('input[placeholder]', host).forEach(function(el){
    var p = el.getAttribute('placeholder') || '';
    if (/\d+\s+\w+.*,\s*[A-Z]{2}\s*\d{5}/.test(p)){
      el.setAttribute('placeholder', 'Street, city, state, ZIP');
    }
  });
  /* restore any mode toggle v8 flattened into free text */
  $$('input[list]', host).forEach(function(el){
    var oc = el.getAttribute('onchange') || '';
    var m = oc.match(/PROP\.set\('([a-zA-Z]+)'/);
    if (!m || !MODE_KEYS[m[1]]) return;
    var key = m[1];
    var dl = document.getElementById(el.getAttribute('list'));
    if (!dl) return;
    var opts = $$('option', dl).map(function(o){ return o.value; });
    var cur = (window.LOANSUITE && LOANSUITE.PROP.state[key]) || '';
    var sel = document.createElement('select');
    sel.className = 'cell-input';
    sel.setAttribute('onchange', "LOANSUITE.PROP.set('" + key + "',this.value)");
    sel.innerHTML = opts.map(function(o){
      return '<option value="' + esc(o) + '"' + (o === cur ? ' selected' : '') + '>' + esc(o) + '</option>';
    }).join('');
    el.parentNode.replaceChild(sel, el);
    dl.remove();
  });
}
/* ZIP: fire the online lookup as soon as five digits are committed. v10
   wired PROP.set for the offline table; this adds the network refine. */
function wirePropZipOnline(){
  var PROP = window.LOANSUITE && LOANSUITE.PROP;
  if (!PROP || PROP.__v11zip) return false;
  PROP.__v11zip = true;
  var inner = PROP.set.bind(PROP);
  PROP.set = function(k, v){
    var r = inner(k, v);
    if (k === 'zip'){
      var z = String(v || '').replace(/\D/g,'').slice(0,5);
      var st = suite();
      if (z.length === 5 && st && typeof st.lookupZipOnline === 'function'){
        st.lookupZipOnline().then(function(){
          try { PROP.sync(); PROP.render(); } catch(e){}
        }).catch(function(){ /* offline is fine — the table already ran */ });
      }
    }
    return r;
  };
  return true;
}

/* =================================================================== 3
   THE IMPORT MODAL LAYOUT

   Two stacking faults, both visible in the screenshot:

   a) `.rpt-modal` sits at z-index 300 while `#shellbar` is 400, so the
      mode-switch bar painted straight over the dimmed overlay and the
      modal's own title row — the bar was on top of a modal that is
      supposed to be covering the page.
   b) `.rpt-modal-bar` is sticky but has no z-index, so the panel below
      it (later in the DOM, and carrying a shadow) scrolled over the top
      of it instead of under.

   Fixed in patch-v11.css, together with letting the title take the row
   and the buttons sit to the right rather than everything centring and
   wrapping into each other.
   =================================================================== */

/* =================================================================== 4
   SUITE-SIDE JSON + AI IMPORT

   The calculator has had this for income. The suite gets the same two
   doors — load a saved .json, or paste an AI extraction — but against
   the loan file rather than the worksheets, and with a Loan Estimate
   mode that reads several LEs at once and turns each into its own
   scenario so they can be compared side by side.
   =================================================================== */
var LE_VERSION = 'nmb-loan-extract/1';

/* The schema handed to the assistant. Written out in full rather than
   generated so it can be read and corrected by a human — the whole point
   is that it is a contract between the prompt and the importer. */
var LE_FIELDS = [
  ['label',              'string  a short name for this scenario, e.g. "FHA 203(k) 10% down"'],
  ['loanProgram',        'string  one of FHA, Conventional, VA, USDA'],
  ['renovation',         'boolean true if this is a 203(k), HomeStyle or other renovation loan'],
  ['basePurchasePrice',  'number  the SALE PRICE on page 1'],
  ['totalLoanAmount',    'number  the Loan Amount box on page 1'],
  ['interestRate',       'number  the note rate as printed, e.g. 6.875 (not 0.06875)'],
  ['termYears',          'number  the loan term in years'],
  ['principalAndInterest','number the Monthly Principal & Interest figure'],
  ['monthlyMi',          'number  Mortgage Insurance on the Projected Payments table, 0 if blank'],
  ['monthlyEscrow',      'number  Estimated Escrow on the Projected Payments table'],
  ['totalMonthlyPayment','number  Estimated Total Monthly Payment, first period'],
  ['propertyTaxAnnual',  'number  annual taxes if shown; otherwise the monthly escrow tax line x 12'],
  ['insuranceAnnual',    'number  Homeowner\u2019s Insurance Premium (12 months) from section F'],
  ['totalClosingCosts',  'number  J. TOTAL CLOSING COSTS'],
  ['loanCostsD',         'number  D. TOTAL LOAN COSTS'],
  ['otherCostsI',        'number  I. TOTAL OTHER COSTS'],
  ['closingCostsFinanced','number the "Closing Costs Financed" line, as a POSITIVE number'],
  ['cashToClose',        'number  Estimated Cash to Close (negative if the borrower receives funds)'],
  ['points',             'number  the dollar amount of points in section A, 0 if none'],
  ['originationFee',     'number  the Origination Fee line in section A'],
  ['apr',                'number  Annual Percentage Rate from page 3, as printed'],
  ['propertyAddress',    'string  the PROPERTY address block, "TBD" if that is what it says'],
  ['borrowerName',       'string  the APPLICANTS name'],
  ['dateIssued',         'string  DATE ISSUED as YYYY-MM-DD']
];
V11.lePrompt = function(){
  var lines = LE_FIELDS.map(function(f){ return '  "' + f[0] + '": ' + f[1]; }).join('\n');
  return 'You are reading one or more mortgage Loan Estimates (the CFPB three-page form).\n\n'
    + 'Return ONLY a JSON object. No prose, no markdown fence, no explanation.\n\n'
    + 'Shape:\n'
    + '{\n'
    + '  "version": "' + LE_VERSION + '",\n'
    + '  "estimates": [ { one object per Loan Estimate, in the order given } ]\n'
    + '}\n\n'
    + 'Each estimate object uses these keys, omitting any the form does not show:\n'
    + lines + '\n\n'
    + 'Rules:\n'
    + '- Numbers only for numeric fields: no $, no commas, no % sign.\n'
    + '- Rates as printed (6.875), NOT as decimals (0.06875).\n'
    + '- "Closing Costs Financed" prints as a negative on the form; return it POSITIVE.\n'
    + '- Cash to Close keeps its sign: negative means the borrower receives money.\n'
    + '- If several documents are supplied, return one object per document in "estimates",\n'
    + '  and give each a "label" that tells them apart (program, down payment, anything\n'
    + '  that differs between them).\n'
    + '- Do not calculate, infer or reconcile anything. Copy what is printed. If a field is\n'
    + '  blank on the form, omit the key rather than guessing a value.\n';
};
V11.copyLePrompt = function(){
  var p = V11.lePrompt();
  var ta = $('v11LeText');
  try { navigator.clipboard.writeText(p);
    say('Prompt copied', 'Send it to the assistant along with the Loan Estimate PDFs, then paste the JSON back here.', 'good', 7000);
  } catch(e){
    if (ta){ ta.value = p; ta.select(); }
    say('Prompt ready', 'Copy it out of the box.', 'info', 6000);
  }
};
V11.saveLePrompt = function(){
  var blob = new Blob([V11.lePrompt()], {type:'text/plain'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'loan-estimate-extraction-prompt.txt';
  a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
};

/* Turn one extracted estimate into a scenario. Everything that maps
   cleanly onto an engine input is written; everything else is kept on
   the scenario as a note so nothing read off the form is silently lost. */
function applyEstimate(est, makeNew){
  var st = suite(); if (!st) return null;
  var id = null;
  if (makeNew && typeof st.newScenario === 'function'){
    id = st.newScenario();
    st.selectScenario(id);
  }
  var set = function(path, v){ if (v != null && isFinite(N(v))) { try { st.setField(path, N(v), 'Loan Estimate import'); } catch(e){} } };
  set('basePurchasePrice', est.basePurchasePrice);
  /* the form prints 6.875; the engine stores 0.06875 */
  if (est.interestRate != null) set('interestRate', N(est.interestRate) / 100);
  set('termYears', est.termYears);
  set('propertyTaxAmount', est.propertyTaxAnnual);
  set('insuranceAmount', est.insuranceAnnual);
  if (est.loanProgram){
    try { st.setField('loanProgram', String(est.loanProgram).toUpperCase().indexOf('FHA') >= 0 ? 'FHA'
        : String(est.loanProgram).toUpperCase().indexOf('VA') >= 0 ? 'VA'
        : String(est.loanProgram).toUpperCase().indexOf('USDA') >= 0 ? 'USDA' : 'Conventional',
      'Loan Estimate import'); } catch(e){}
  }
  if (est.renovation != null){ try { st.setField('renovation', !!est.renovation, 'Loan Estimate import'); } catch(e){} }
  /* name it so the scenario list reads as a comparison */
  if (id && est.label){ try { st.renameScenario(String(est.label).slice(0,80)); } catch(e){} }
  return { id:id, est:est };
}
V11.runLeImport = function(){
  var ta = $('v11LeText'); if (!ta) return;
  var raw = (ta.value || '').replace(/```json|```/g,'').trim();
  if (!raw) return say('Nothing to import', 'Paste the JSON the assistant returned first.', 'warn');
  var obj;
  try { obj = JSON.parse(raw); }
  catch(e){ return say('That is not valid JSON', 'Paste only the object itself \u2014 no explanation around it. '
    + (e.message || ''), 'warn', 9000); }
  var list = obj && (obj.estimates || (Array.isArray(obj) ? obj : (obj.version || obj.totalLoanAmount ? [obj] : null)));
  if (!Array.isArray(list) || !list.length)
    return say('No estimates found', 'The JSON needs an "estimates" array with one object per Loan Estimate.', 'warn', 8000);
  if (obj.version && obj.version !== LE_VERSION)
    say('Different schema version', 'Expected ' + LE_VERSION + ' but got ' + obj.version + ' \u2014 importing anyway; check the figures.', 'warn', 8000);

  var made = [];
  list.forEach(function(est, idx){
    /* first one lands in the scenario already open unless it has figures
       in it; after that every estimate gets its own scenario so they sit
       side by side in the comparison */
    made.push(applyEstimate(est, idx > 0 || made.length > 0 || list.length > 1));
  });
  var res = $('v11LeResult');
  if (res){
    res.innerHTML = '<div class="notice good"><div><b>Imported ' + made.length + ' estimate(s).</b> '
      + 'Each is its own scenario \u2014 open Scenarios or Compare to see them together. '
      + 'Nothing was reconciled on import: the loan amount, MI and cash to close on the form are the '
      + 'lender\u2019s figures and this file recalculates its own, so expect them to differ and check why.</div></div>'
      + '<table class="tbl" style="margin-top:10px"><thead><tr><th>Scenario</th><th class="num">Price</th>'
      + '<th class="num">Loan</th><th class="num">Rate</th><th class="num">P&amp;I</th>'
      + '<th class="num">Total pmt</th><th class="num">Cash to close</th></tr></thead><tbody>'
      + made.map(function(m){
          var e = m.est;
          return '<tr><td>' + esc(e.label || '(unnamed)') + '</td>'
            + '<td class="num">' + (e.basePurchasePrice != null ? usd(e.basePurchasePrice) : '\u2014') + '</td>'
            + '<td class="num">' + (e.totalLoanAmount != null ? usd(e.totalLoanAmount) : '\u2014') + '</td>'
            + '<td class="num">' + (e.interestRate != null ? N(e.interestRate).toFixed(3) + '%' : '\u2014') + '</td>'
            + '<td class="num">' + (e.principalAndInterest != null ? usd(e.principalAndInterest,2) : '\u2014') + '</td>'
            + '<td class="num">' + (e.totalMonthlyPayment != null ? usd(e.totalMonthlyPayment) : '\u2014') + '</td>'
            + '<td class="num">' + (e.cashToClose != null ? usd(e.cashToClose) : '\u2014') + '</td></tr>';
        }).join('')
      + '</tbody></table>';
  }
  try { suite().emit(); } catch(e){}
  if (window.RECALC) window.RECALC();
  say('Imported ' + made.length + ' Loan Estimate(s)',
      'Each became its own scenario. Check every figure against the form \u2014 nothing was reconciled.', 'good', 9000);
};

/* ---- the modal ----------------------------------------------------- */
function buildLeModal(){
  if ($('v11LeModal')) return true;
  var wrap = document.createElement('div');
  wrap.className = 'rpt-modal v11-modal';
  wrap.id = 'v11LeModal';
  wrap.innerHTML =
    '<div class="rpt-modal-bar">'
      + '<span class="ttl">Import loan files &amp; Loan Estimates</span>'
      + '<span class="v11-grow"></span>'
      + '<button class="btn btn-light btn-sm" onclick="V11.copyLePrompt()">Copy the prompt</button>'
      + '<button class="btn btn-light btn-sm" onclick="V11.saveLePrompt()">Save prompt (.txt)</button>'
      + '<button class="btn btn-light btn-sm" onclick="V11.pickJson()">Load .json</button>'
      + '<button class="btn btn-green btn-sm" onclick="V11.runLeImport()">Import</button>'
      + '<button class="btn btn-sm" onclick="V11.closeLe()">Close</button>'
    + '</div>'
    + '<div class="rpt-picker">'
      + '<h4>How this works</h4>'
      + '<div class="sub" style="margin-bottom:9px">'
        + '<b>1.</b> Copy the prompt above. <b>2.</b> Send it to the assistant together with the Loan '
        + 'Estimates, Closing Disclosures or term sheets you want to compare \u2014 several at once is the '
        + 'point. <b>3.</b> Paste the JSON it returns into the box below and press Import. Each estimate '
        + 'becomes its own scenario, so three programmes come back as three scenarios you can put side by '
        + 'side. Nothing is reconciled on import: the lender\u2019s loan amount and cash to close are kept '
        + 'as they were printed, this file still calculates its own, and where they disagree that is a '
        + 'question worth asking rather than something to average away.'
      + '</div>'
      + '<textarea class="cell-input v11-ta" id="v11LeText" spellcheck="false" '
        + 'placeholder=\'Paste the JSON here \u2014 it starts with {"version": "' + LE_VERSION + '", "estimates": [ ...\'></textarea>'
      + '<div id="v11LeResult" style="margin-top:10px"></div>'
    + '</div>'
    + '<input type="file" id="v11JsonFile" accept=".json,application/json" style="display:none">';
  document.body.appendChild(wrap);
  $('v11JsonFile').addEventListener('change', function(e){
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var fr = new FileReader();
    fr.onload = function(){
      var txt = String(fr.result || '');
      /* A saved suite file and an AI extraction are both JSON but very
         different shapes — route by what is actually in it rather than
         by which button was pressed. */
      var parsed = null;
      try { parsed = JSON.parse(txt); } catch(err){
        return say('That file is not valid JSON', 'Nothing was changed.', 'warn');
      }
      if (parsed && (parsed.estimates || parsed.version === LE_VERSION)){
        $('v11LeText').value = txt;
        say('Extraction loaded', 'Press Import to turn it into scenarios.', 'good', 6000);
      } else if (parsed && (parsed.scenarios || parsed.inputs)){
        V11.loadSuiteFile(parsed);
      } else {
        $('v11LeText').value = txt;
        say('Unrecognised shape', 'Loaded into the box so you can look at it, but it is neither a saved '
          + 'suite file nor an extraction. Nothing was applied.', 'warn', 9000);
      }
    };
    fr.readAsText(f);
    e.target.value = '';
  });
  return true;
}
V11.pickJson = function(){ var f = $('v11JsonFile'); if (f) f.click(); };
V11.loadSuiteFile = function(obj){
  var st = suite(); if (!st) return;
  /* replaceInputs(inputs, action) is the store's own restore path — the
     same one Reset and the version history use, so it audits and emits
     correctly. loadState() looks like the obvious candidate but is a
     module-level function that reads localStorage and takes no argument;
     calling it with an object would have done nothing at all. */
  try {
    var inputs = obj.inputs
      || (obj.scenarios && obj.activeScenarioId && obj.scenarios[obj.activeScenarioId]
            && obj.scenarios[obj.activeScenarioId].inputs)
      || (obj.scenarios && Object.keys(obj.scenarios).length
            && obj.scenarios[Object.keys(obj.scenarios)[0]].inputs);
    if (!inputs) return say('Nothing to load', 'That JSON has no inputs block the suite recognises.', 'warn', 8000);
    if (typeof st.replaceInputs !== 'function')
      return say('Cannot load here', 'This build has no replaceInputs on the store.', 'warn');
    st.replaceInputs(inputs, 'Loaded from file');
    say('File loaded', 'The saved loan file is open. Every figure came from the file \u2014 check the '
      + 'scenario picker, and note that only the active scenario was restored.', 'good', 8000);
  } catch(e){
    say('Could not load that file', 'It parsed as JSON but the suite would not take it: ' + (e.message||''), 'warn', 9000);
  }
};
V11.openLe = function(){
  buildLeModal();
  $('v11LeModal').classList.add('on');
  document.body.style.overflow = 'hidden';
};
V11.closeLe = function(){
  var m = $('v11LeModal'); if (m) m.classList.remove('on');
  document.body.style.overflow = '';
};
/* Entry point on the suite toolbar, beside the theme button. */
function buildLeButton(){
  var tb = document.querySelector('#suite-root .toolbar'); if (!tb) return false;
  if ($('v11LeBtn')) return true;
  var b = document.createElement('button');
  b.type = 'button'; b.id = 'v11LeBtn'; b.className = 'btn ghost v11-lebtn';
  b.textContent = 'Import / AI';
  b.title = 'Load a saved loan file, or paste an AI extraction of one or more Loan Estimates';
  b.addEventListener('click', V11.openLe);
  var theme = $('v9SuiteTheme');
  if (theme) tb.insertBefore(b, theme);
  else tb.appendChild(b);
  return true;
}

/* Escape closes this modal too (v9 handles the report modal). */
document.addEventListener('keydown', function(e){
  if (e.key !== 'Escape') return;
  var m = $('v11LeModal');
  if (m && m.classList.contains('on')) V11.closeLe();
});

/* =================================================================== 5
   WIRING
   =================================================================== */
setInterval(function(){
  try { defaultCushion(); } catch(e){}
  try { fixPropertyFields(); wirePropZipOnline(); } catch(e){}
  try { buildLeButton(); } catch(e){}
}, 600);
})();
