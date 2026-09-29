
/* =====================================================================
   ALL-IN-ONE SHELL AND BRIDGE

   Both applications are live in this one document at the same time. The
   shell only switches which one is on screen and carries figures between
   them; neither engine has been altered.

   The division of authority follows what each file is actually good at:
     - the income calculator owns qualifying income, liabilities and the
       averaging methods behind them;
     - the renovation suite owns the subject loan, the renovation budget,
       maximum mortgage, closing and escrows.
   So income travels one way and the loan setup travels the other.
   ===================================================================== */
const SHELL = (function(){
  const paneCalc  = document.getElementById('calc-root');
  const paneSuite = document.getElementById('suite-root');
  const btnCalc   = document.getElementById('mode-calc');
  const btnSuite  = document.getElementById('mode-suite');
  let mode = 'calc';

  const suite = () => (window.mortgageSuite || null);

  function say(msg, stale){
    const s = document.getElementById('shellStatus');
    const d = document.getElementById('shellDot');
    if (s) s.textContent = msg;
    if (d) d.classList.toggle('stale', !!stale);
  }

  function go(m){
    if (m === mode) return;
    mode = m;
    paneCalc.classList.toggle('on',  m === 'calc');
    paneSuite.classList.toggle('on', m === 'suite');
    btnCalc.classList.toggle('on',  m === 'calc');
    btnSuite.classList.toggle('on', m === 'suite');
    document.body.dataset.shellMode = m;
    /* The suite measures its own layout as it renders. It has just come back
       from display:none, so ask the store to re-emit and lay out for real. */
    if (m === 'suite'){
      const S = suite();
      if (S && S.store) { try { S.store.setMode(S.store.snapshot.mode); } catch(e){} }
    }
    window.scrollTo({top:0, behavior:'smooth'});
  }

  /* ---- income calculator  ->  renovation suite ----------------------
     renoPatch() is the calculator's own handoff shape, the one the suite's
     importer treats as best fidelity because the averaging and method
     selection have already been done. */
  function toSuite(){
    const S = suite();
    if (!S || !S.store){ alert('The Renovation Suite has not finished loading yet.'); return; }
    let patch;
    try { patch = renoPatch(); }
    catch(e){ alert('Could not read the income figures: ' + e.message); return; }
    const t = calcTotals();
    const msg = "Send this file's qualifying income to the Renovation Suite?\n\n"
      + patch.borrowers[0].name + ': ' + money(t.b1) + ' / mo\n'
      + patch.borrowers[1].name + ': ' + money(t.b2) + ' / mo\n'
      + 'Monthly debts: ' + money(patch.borrowers[0].monthlyDebts) + '\n\n'
      + 'It is written straight into the active Suite scenario — no file, no reload.';
    if (!confirm(msg)) return;
    try {
      const res = S.store.importIncomeText(
        JSON.stringify(patch), 'RenovationSuite_Income_live.json');
      say('Income sent ' + new Date().toLocaleTimeString(), false);
      toast('Sent to the Renovation Suite — ' + (res.applied.length || 0) + ' field(s) applied');
      go('suite');
    } catch(e){
      alert('The Suite would not take that: ' + e.message);
    }
  }

  /* ---- renovation suite  ->  income calculator ----------------------
     applyReno() is the calculator's own importer. It reads the same scenario
     shape whether it came from localStorage or straight from the live store,
     so the in-memory handoff needs no new mapping code. */
  function toCalc(){
    const S = suite();
    if (!S || !S.store){ alert('The Renovation Suite has not finished loading yet.'); return; }
    let inp;
    try { inp = S.store.activeInputs; }
    catch(e){ alert('Could not read the Suite scenario: ' + e.message); return; }
    if (!inp){ alert('The Renovation Suite has no active scenario.'); return; }
    const nm = inp.name || 'active scenario';
    if (!confirm('Bring "' + nm + '" across from the Renovation Suite?\n\n'
      + 'Borrower names, subject property, loan terms, escrows and monthly debts\n'
      + 'will overwrite the loan setup on the PITIA & DTI tab.\n\n'
      + 'Income worksheets are not touched.')) return;
    try {
      applyReno(JSON.parse(JSON.stringify(inp)));
      say('Loan setup pulled ' + new Date().toLocaleTimeString(), false);
      go('calc');
      switchTab('dti');
      toast('Loan setup imported from the Renovation Suite');
    } catch(e){
      alert('Could not apply that scenario: ' + e.message);
    }
  }

  return { go, toSuite, toCalc, say, get mode(){ return mode; } };
})();

/* Anything in the calculator that switches tab — including a document dropped
   anywhere on the page, which routes to Documents — should bring the
   calculator to the front first. One hook covers every call site. */
(function(){
  const inner = window.switchTab;
  window.switchTab = function(t){
    if (SHELL.mode !== 'calc') SHELL.go('calc');
    return inner.apply(this, arguments);
  };
})();

/* ---- one theme, not two -------------------------------------------------
   Both applications independently own data-theme on <html>: the calculator
   writes it from applyTheme() and remembers it under uwTheme, and the suite
   rewrites it from its own store on every render. Left alone they fight, and
   switching to the suite silently reverted the calculator's theme.

   The calculator's setting is treated as the one that counts, because it is
   the one that persists. The suite's store is kept in step so that when its
   renderer writes the attribute it writes the same value, and its own moon
   button still works by reporting back the other way. */
function initThemeSync(){
  const S = window.mortgageSuite;
  if (!S || !S.store) return false;

  const suiteTheme = () => { try { return S.store.snapshot.theme; } catch(e){ return null; } };
  const mirror = () => {                     // calculator -> suite store, silently
    try { if (S.store.snapshot.theme !== THEME) S.store.snapshot.theme = THEME; } catch(e){}
  };

  mirror();
  document.documentElement.setAttribute('data-theme', THEME);

  const origApply = window.applyTheme;
  window.applyTheme = function(t){
    origApply.apply(this, arguments);
    mirror();
    /* Repaint the suite so its moon glyph follows, but only when it is on
       screen - a render against a display:none pane measures nothing. */
    if (SHELL.mode === 'suite'){
      try { S.store.setMode(S.store.snapshot.mode); } catch(e){}
    }
  };

  /* The suite's own toggle changes its store and re-renders. Catch that and
     hand it to the calculator, which owns persistence. */
  S.store.subscribe(function(){
    const st = suiteTheme();
    if (st && st !== THEME) window.applyTheme(st);
    else document.documentElement.setAttribute('data-theme', THEME);
  });
  return true;
}

/* The suite boots on DOMContentLoaded, which is after these inline scripts have
   run, so anything that reaches into its store has to wait for it. */
(function whenSuiteReady(tries){
  if (initThemeSync()) return;
  if (tries > 200) return;                       // ~10s, then give up quietly
  setTimeout(function(){ whenSuiteReady(tries + 1); }, 50);
})(0);

document.body.dataset.shellMode = 'calc';
