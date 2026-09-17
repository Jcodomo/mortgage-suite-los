/* =====================================================================
   Release 50 — the Workbench layout.
   Puts the Loan Suite inside the Income Calculator's frame and adds the
   pieces the layout needs: stat cards and quote presets above every
   page, calculator-style page tabs with counts and warning dots, a Loan
   Report button, Sync / Scenarios buttons in the header, an income menu
   in the top bar and a verdict at the head of the live summary.
   Additive over 48. Neither engine and no earlier layer is edited.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function N(v){ v = parseFloat(String(v==null?'':v).replace(/[$,%\s]/g,'')); return isFinite(v)?v:0; }
function norm(s){ return String(s||'').replace(/\s+/g,' ').trim(); }
function key(s){ return norm(s).toUpperCase(); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function usd(v){ var n=N(v); return (n<0?'\u2212':'')+'$'+Math.round(Math.abs(n)).toLocaleString('en-US'); }
function pct(v,dp){ var n=N(v); if (Math.abs(n)<=1.5) n*=100; return n.toFixed(dp==null?1:dp)+'%'; }
function say(t,b,k,ms){ try { if (window.LOS && LOS.say) LOS.say(t,b,k,ms); } catch(e){} }
function store(){ try { return window.mortgageSuite.store; } catch(e){ return null; } }
function outputs(){ var s=store(); if (!s) return null; try { var o=s.outputs; return typeof o==='function'?o.call(s):o; } catch(e){ return null; } }
function inputs(){ var s=store(); try { return s ? s.activeInputs : null; } catch(e){ return null; } }

/* The scenario engine already persists the full file in localStorage.  Keep a
   small cookie plus a browser-storage resume marker for the active workspace
   and scenario, so a refresh or a return visit restores the same workbench
   without attempting to squeeze the full loan file into a browser cookie. */
var RESUME_KEY='los.v50.resume', WORKSPACE_COOKIE='los.v50.workspace', REQUESTED_WORKSPACE_KEY='los.v50.requestedWorkspace';
function readCookie(name){
  try { var hit=document.cookie.match(new RegExp('(?:^|; )'+name.replace(/[.$?*|{}()\[\]\\/+^]/g,'\\$&')+'=([^;]*)')); return hit?decodeURIComponent(hit[1]):''; } catch(e){ return ''; }
}
function workspaceName(value){
  var v=String(value||'').toLowerCase();
  if(v==='suite'||v==='loan'||v==='loansuite')return 'suite';
  if(v==='calc'||v==='income'||v==='calculator')return 'calc';
  return '';
}
function explicitWorkspace(){
  try { return workspaceName((new URLSearchParams(location.search)).get('app')); } catch(e){ return ''; }
}
function requestedWorkspace(){
  try { return workspaceName(sessionStorage.getItem(REQUESTED_WORKSPACE_KEY)); } catch(e){ return ''; }
}
function savedWorkspace(){
  var saved='';
  try { saved=workspaceName((JSON.parse(localStorage.getItem(RESUME_KEY)||'{}')||{}).workspace); } catch(e){}
  return saved||workspaceName(readCookie(WORKSPACE_COOKIE));
}
/* The tiny head bootstrap records the requested app before the legacy
   calculator startup can rewrite the URL.  Prefer that marker so a refresh
   from Loan Suite cannot drift into Income while the old startup settles. */
function preferredWorkspace(){ return requestedWorkspace()||explicitWorkspace()||savedWorkspace(); }
function persistWorkspace(next){
  var workspace=workspaceName(next)||explicitWorkspace();
  if(!workspace){ try { workspace=workspaceName(window.SHELL&&SHELL.mode); } catch(e){} }
  if(!workspace)return false;
  try {
    var s=store(), snap=s&&s.snapshot||{};
    localStorage.setItem(RESUME_KEY,JSON.stringify({workspace:workspace,scenarioId:snap.activeScenarioId||'',savedAt:Date.now()}));
  } catch(e){}
  try { sessionStorage.setItem(REQUESTED_WORKSPACE_KEY,workspace); } catch(e){}
  try { document.cookie=WORKSPACE_COOKIE+'='+encodeURIComponent(workspace)+'; Path=/; Max-Age=31536000; SameSite=Lax'; } catch(e){}
  return true;
}
function wireWorkspacePersistence(){
  var shell=window.SHELL;
  if(!shell||shell.__v50WorkspacePersistence)return false;
  var go=shell.go;
  if(typeof go==='function'){
    shell.go=function(next){ var result=go.apply(this,arguments); persistWorkspace(next); return result; };
  }
  shell.__v50WorkspacePersistence=true;
  window.addEventListener('pagehide',function(){persistWorkspace();},{passive:true});
  window.addEventListener('beforeunload',function(){persistWorkspace();},{passive:true});
  return true;
}

var V50 = window.V50 = { version:'50.0' };
document.documentElement.setAttribute('data-v50','1');
document.documentElement.setAttribute('data-los-release','50');

var ICON = {
  loan:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  dollar:'<path d="M12 3v18M17 7H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6"/>',
  coins:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/>',
  check:'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  sheet:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/>'
};
function svg(k){ return '<svg viewBox="0 0 24 24" aria-hidden="true">'+ICON[k]+'</svg>'; }

/* ------------------------------------------------------------------ actions
   Same lookup the earlier layers use: an action is a button inside the
   File actions or Loan tools menus, found by its label. */
function findAction(names){
  var pools = ['v23SuiteActions','v24LoanTools','v35Panel','v43Menu'];
  for (var p=0;p<pools.length;p++){
    var pool = $(pools[p]); if (!pool) continue;
    var btns = $$('button,a', pool);
    for (var n=0;n<names.length;n++){
      var want = key(names[n]);
      for (var b=0;b<btns.length;b++){ if (key(btns[b].textContent).indexOf(want) === 0) return btns[b]; }
    }
  }
  return null;
}
V50.run = function(names, fallback){
  var b = findAction(names);
  if (b){ b.click(); return true; }
  if (fallback){ try { fallback(); return true; } catch(e){} }
  say('Not available yet', 'The '+names[0]+' action has not finished loading. Try again in a moment.', 'warn', 4000);
  return false;
};
V50.go = function(label){
  try { if (V50.choose) V50.choose(key(label)); } catch(e){}
  try { if (window.V44 && V44.goPage){ V44.goPage(label); return; } } catch(e){}
  var t = $$('#suite-root .tabs .tab').filter(function(x){ return key(x.textContent) === key(label); })[0];
  if (t) t.click();
};

/* ------------------------------------------------------------------ 1
   PAGE TABS: calculator labels, icons, counts and warning dots.
   The tab text is left alone (other layers match on it); the visible
   label is drawn from a data attribute. */
var LABEL = {
  'QUOTE':['Quote','dollar'],'SETUP':['Setup','file'],'PROPERTY':['Property','home'],
  'RENOVATION':['Renovation','tool'],'MAX MORTGAGE':['Max mortgage','home'],'MORTGAGE RATES':['Mortgage rates','pulse'],
  'CLOSING':['Closing costs','coins'],'ESCROW':['Escrow','coins'],'TAXES & PRORATION':['Taxes & proration','sheet'],
  'QUALIFY':['Qualify','check'],'RENTAL':['Rental','home'],'CREDIT':['Credit','check'],'ADVANCED':['Advanced','tool'],
  'CONTRACT & LE':['Contract & LE','book'],'SCENARIOS':['Scenarios','chart'],'SUMMARY':['Summary','chart'],
  'DOCUMENTS & OCR':['Documents & OCR','book'],'DOCUMENTS & WORKSHEETS':['Worksheets','sheet'],'DRAFT LE':['Draft LE','book']
};
var MODULE_TAB = { purchase:'SETUP', loan:'MAX MORTGAGE', value:'PROPERTY', renovation:'RENOVATION', draws:'RENOVATION',
  payment:'QUOTE', closing:'CLOSING', escrow:'ESCROW', tax:'TAXES & PRORATION', aus:'QUALIFY', qualify:'QUALIFY',
  rental:'RENTAL', credit:'CREDIT', bps:'ADVANCED', mmw:'MAX MORTGAGE' };
function warningTabs(o){
  var out = {};
  ((o && o.warnings) || []).forEach(function(w){
    if (!w || /info/i.test(w.severity||'')) return;
    var t = MODULE_TAB[String(w.module||'').toLowerCase()];
    if (t) (out[t] = out[t] || []).push(w.title || w.code);
  });
  return out;
}
function paintTabs(){
  var row = document.querySelector('#suite-root .tabs'); if (!row) return false;
  var s = store(), o = outputs(), warn = warningTabs(o);
  var counts = {};
  try { counts['SCENARIOS'] = (s.scenarioList || []).length || 0; } catch(e){}
  try { var bad = $$('#v44LiveSummary .v44-live-row.bad b')[0]; if (bad && N(bad.textContent)) counts['ADVANCED'] = N(bad.textContent); } catch(e){}
  $$('.tab', row).forEach(function(t){
    var k = key(t.childNodes.length ? Array.prototype.map.call(t.childNodes,function(n){ return n.nodeType===3 ? n.textContent : ''; }).join('') : t.textContent);
    if (!k) k = key(t.textContent);
    var L = LABEL[k] || [norm(t.textContent).toLowerCase().replace(/^./,function(c){return c.toUpperCase();}), 'file'];
    if (t.getAttribute('data-v50-label') !== L[0]) t.setAttribute('data-v50-label', L[0]);
    if (t.getAttribute('data-v50-ic') !== L[1]) t.setAttribute('data-v50-ic', L[1]);
    if (!t.getAttribute('aria-label')) t.setAttribute('aria-label', L[0]);
    /* count badge (no text node, so textContent is unchanged) */
    var ct = t.querySelector('.v50-ct'), n = counts[k];
    if (n){ if (!ct){ ct = document.createElement('span'); ct.className='v50-ct'; t.appendChild(ct); } if (ct.getAttribute('data-n') !== String(n)) ct.setAttribute('data-n', n); }
    else if (ct) ct.remove();
    var dot = t.querySelector('.v50-dot'), w = warn[k];
    if (w && w.length){ if (!dot){ dot = document.createElement('span'); dot.className='v50-dot'; t.appendChild(dot); } dot.title = w.join('\n'); }
    else if (dot) dot.remove();
  });
  var nav = $('v23SuitePrimaryNav'), cs = $('v24ContextSummary');
  /* Full is the last group tab */
  if (nav){ var full = nav.querySelector('button[data-group="full"]'); var lastBtn = $$('button', nav).pop(); if (full && lastBtn !== full) nav.appendChild(full); }
  if (nav && cs){ var txt = norm(cs.textContent).replace(/\s·\s/g, ', '); if (nav.getAttribute('data-v50-context') !== txt) nav.setAttribute('data-v50-context', txt); }
  /* Setup is the first working page inside File, immediately before Quote. */
  var setup=$$('.tab',row).filter(function(t){return key(t.textContent)==='SETUP';})[0];
  var quote=$$('.tab',row).filter(function(t){return key(t.textContent)==='QUOTE';})[0];
  if(setup&&quote&&setup.nextElementSibling!==quote) row.insertBefore(setup,quote);
  dedupeDocumentsNavigation();
  return true;
}

/* Release 48 owns the Documents page twice: once as the direct document
   launcher and once as a cloned primary-nav group.  The direct launcher is
   the one with the working first-click menu / second-click OCR behavior, so
   keep that control and suppress only the redundant clone. */
function dedupeDocumentsNavigation(){
  var nav=$('v23SuitePrimaryNav'); if(!nav)return false;
  var buttons=$$('button',nav).filter(function(b){return key(b.textContent)==='DOCUMENTS';});
  if(buttons.length<2)return false;
  var direct=$('v28nav-documents'), keep=buttons.indexOf(direct)>=0?direct:buttons[0];
  buttons.forEach(function(button){
    var duplicate=button!==keep;
    button.classList.toggle('v50-documents-duplicate',duplicate);
    if(duplicate){
      button.setAttribute('aria-hidden','true'); button.tabIndex=-1;
      button.style.setProperty('display','none','important');
    }else{
      button.removeAttribute('aria-hidden'); button.style.removeProperty('display');
    }
  });
  if(!nav.__v50DocsObserver){
    nav.__v50DocsObserver=true;
    new MutationObserver(function(){ dedupeDocumentsNavigation(); }).observe(nav,{childList:true,subtree:true});
  }
  return true;
}

/* ------------------------------------------------------------------ 2
   STAT CARDS AND QUOTE PRESETS above every page */
var PRESETS = [
  ['fha35','FHA 3.5%','No renovation'],
  ['conv5','Conventional 5%','No renovation'],
  ['fha203','FHA 203(k)','Renovation'],
  ['convhs','HomeStyle','Renovation']
];
function activePreset(i){
  if (!i) return '';
  var fha = /fha/i.test(i.loanProgram||''), reno = !!i.renovation;
  if (fha && !reno) return 'fha35';
  if (!fha && !reno) return 'conv5';
  if (fha && reno) return 'fha203';
  return 'convhs';
}
function ensureTop(){
  var main = document.querySelector('#suite-root .cols-main .v31-main'); if (!main) return null;
  var top = $('v50Top');
  if (!top){
    top = document.createElement('div'); top.id = 'v50Top'; top.className = 'no-print';
    top.innerHTML =
      '<div class="v50-stats">'+
        '<button type="button" class="v50-card" data-v50-go="MAX MORTGAGE"><i>'+svg('loan')+'</i><span><em>Total loan</em><b data-v50="loan">—</b><small data-v50="loanSub"></small></span></button>'+
        '<button type="button" class="v50-card" data-v50-go="QUOTE"><i>'+svg('dollar')+'</i><span><em>Monthly payment</em><b data-v50="pay">—</b><small data-v50="paySub"></small></span></button>'+
        '<button type="button" class="v50-card" data-v50-go="CLOSING"><i>'+svg('coins')+'</i><span><em>Cash to close</em><b data-v50="cash">—</b><small data-v50="cashSub"></small></span></button>'+
        '<button type="button" class="v50-card" data-v50-go="QUALIFY" data-v50-card="dti"><i>'+svg('check')+'</i><span><em>Back-end DTI</em><b data-v50="dti">—</b><small data-v50="dtiSub"></small></span></button>'+
      '</div>'+
      '<div class="v50-presets" role="group" aria-label="Quote presets"><em>Quote preset</em>'+
        PRESETS.map(function(p){ return '<button type="button" class="v50-pill" data-v50-preset="'+p[0]+'" title="'+esc(p[2])+'">'+esc(p[1])+'</button>'; }).join('')+
        '<button type="button" class="v50-pill v50-switch" data-v50-switch>Switch program</button>'+
        '<button type="button" class="v50-pill v50-compare" data-v50-compare>Compare both</button>'+
      '</div>';
    top.addEventListener('click', function(e){
      var g = e.target.closest('[data-v50-go]'), p = e.target.closest('[data-v50-preset]');
      if (g){ V50.go(g.getAttribute('data-v50-go')); return; }
      if (p){ if (window.V48 && V48.preset){ V48.preset(p.getAttribute('data-v50-preset')); setTimeout(paintTop, 60); } return; }
      if (e.target.closest('[data-v50-switch]')){
        var s = store(), i = inputs(); if (!s || !i) return;
        var to = /fha/i.test(i.loanProgram||'') ? 'Conventional' : 'FHA';
        try { s.switchProgram(to); say('Switched to '+to, to==='Conventional' ? 'Rate +0.375%.' : 'Rate \u22120.375%.', 'good', 3500); } catch(err){}
        setTimeout(paintTop, 60); return;
      }
      if (e.target.closest('[data-v50-compare]')){
        var st = store();
        try { if (st && st.compareProgramScenario){ st.compareProgramScenario(); V50.go('SCENARIOS'); return; } } catch(err){}
        V50.run(['Compare FHA vs Conventional','Compare','Live comparison']);
      }
    });
  }
  if (main.firstElementChild !== top) main.insertBefore(top, main.firstChild);
  return top;
}
function set(top, k, v){ var el = top.querySelector('[data-v50="'+k+'"]'); if (el && el.textContent !== v) el.textContent = v; }
function paintTop(){
  var top = ensureTop(); if (!top) return false;
  var o = outputs(), i = inputs(); if (!o || !i) return true;
  var loan = o.loan||{}, pay = o.payment||{}, cash = o.cash||{}, aus = o.aus||{};
  var fha = /fha/i.test(i.loanProgram||'');
  set(top,'loan', usd(loan.totalLoan));
  set(top,'loanSub', fha ? 'Base '+usd(loan.maximumBaseLoan)+' + UFMIP '+usd(loan.ufmip) : 'Base loan, no upfront fee');
  set(top,'pay', usd(pay.totalMonthlyPayment));
  var mi = fha ? 'MIP '+usd(pay.monthlyFhaMip) : (N(pay.monthlyPmi) ? 'PMI '+usd(pay.monthlyPmi) : 'no MI');
  set(top,'paySub', 'P&I '+usd(pay.principalAndInterest)+', '+mi+', T&I '+usd(pay.monthlyTaxesAndInsuranceUsed));
  set(top,'cash', usd(cash.cashToClose));
  set(top,'cashSub', N(cash.emdCreditApplied) ? 'After '+usd(cash.emdCreditApplied)+' EMD' : 'After credits and deposits');
  var hasIncome = N(aus.totalQualifyingIncome) > 0;
  var card = top.querySelector('[data-v50-card="dti"]');
  set(top,'dti', hasIncome ? pct(aus.backEndDti) : 'Enter income');
  set(top,'dtiSub', hasIncome ? 'Front '+pct(aus.frontEndDti)+', cap '+pct(aus.backEndLimit) : 'Pull it from the Income Calculator');
  if (card){ var over = hasIncome && N(aus.backEndDti) > N(aus.backEndLimit) && N(aus.backEndLimit) > 0; card.classList.toggle('warn', !hasIncome || over); }
  var ap = activePreset(i);
  $$('[data-v50-preset]', top).forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-v50-preset') === ap); });
  var sw = top.querySelector('[data-v50-switch]');
  var lab = fha ? 'Switch to Conventional (+0.375%)' : 'Switch to FHA (\u22120.375%)';
  if (sw && sw.textContent !== lab) sw.textContent = lab;
  return true;
}

/* ------------------------------------------------------------------ 3
   HEADER: Sync + Scenarios buttons, Loan Report button */
function paintHeader(){
  var main = $('v25HeaderMain'), bar = $('v24ScenarioBar');
  if (main && bar){
    var box = $('v50AppBtns');
    if (!box){
      box = document.createElement('div'); box.id = 'v50AppBtns'; box.className = 'v50-appbtns no-print';
      box.innerHTML = '<button type="button" class="v50-sync" data-v50-sync>Sync on</button><button type="button" data-v50-scen>Scenarios</button>';
      box.addEventListener('click', function(e){
        if (e.target.closest('[data-v50-sync]')){
          try { var on = LOS.syncOn(); LOS.setSync(!on); } catch(err){}
          paintSync(); return;
        }
        if (e.target.closest('[data-v50-scen]')) V50.go('SCENARIOS');
      });
    }
    if (box.nextElementSibling !== bar) main.insertBefore(box, bar);
    paintSync();
  }
  var hdr = $('v44Header');
  if (hdr && !$('v50Report')){
    var r = document.createElement('button');
    r.type = 'button'; r.id = 'v50Report'; r.className = 'v50-report';
    r.title = 'Print the scenario summary';
    r.innerHTML = svg('sheet') + '<span>Loan Report</span>';
    r.addEventListener('click', function(){ V50.run(['Print summary','Print / PDF'], function(){ V50.go('SUMMARY'); }); });
    hdr.appendChild(r);
  }
  var live=$('v44Live');
  if(live){ live.setAttribute('aria-label','Toggle live summary'); live.title='Toggle live summary'; }
  return !!main;
}
function paintSync(){
  var b = document.querySelector('[data-v50-sync]'); if (!b) return;
  var on = true; try { on = LOS.syncOn(); } catch(e){}
  var t = on ? 'Sync on' : 'Sync off';
  if (b.textContent !== t) b.textContent = t;
  b.classList.toggle('off', !on);
}

/* ------------------------------------------------------------------ 4
   INCOME MENU in the top bar. The Income Calculator itself is untouched. */
function paintIncome(){
  var lnk = document.querySelector('#shellbar .lnk'); if (!lnk) return false;
  if (!lnk.__v50){
    lnk.__v50 = true;
    lnk.classList.add('v50-inc');
    lnk.setAttribute('role','button'); lnk.setAttribute('tabindex','0');
    lnk.setAttribute('aria-haspopup','true'); lnk.setAttribute('title','Income Calculator link');
    var m = document.createElement('div'); m.id = 'v50IncMenu'; m.setAttribute('role','menu');
    m.innerHTML = '<h6>Income Calculator</h6>'+
      '<button type="button" role="menuitem" data-a="pull">Pull income into this loan</button>'+
      '<button type="button" role="menuitem" data-a="send">Send loan figures to the calculator</button>'+
      '<button type="button" role="menuitem" data-a="open">Open the Income Calculator</button>'+
      '<button type="button" role="menuitem" data-a="suite">Open the Loan Suite</button>'+
      '<button type="button" role="menuitem" data-a="report">Open income report</button>';
    document.body.appendChild(m);
    var toggle = function(e){
      if (e) e.stopPropagation();
      var open = !m.classList.contains('open');
      if (open){ var r = lnk.getBoundingClientRect(); m.style.top = (r.bottom + 6)+'px'; m.style.left = Math.max(8, Math.min(innerWidth - 270, r.right - 260))+'px'; }
      m.classList.toggle('open', open); lnk.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    lnk.addEventListener('click', toggle);
    lnk.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(e); } });
    /* The launcher is outside of the portaled menu; keep it in the inside
       boundary so its own click can open the menu instead of immediately
       closing it again. */
    document.addEventListener('click', function(e){ if (!e.target.closest('#v50IncMenu, #shellbar .lnk.v50-inc')) m.classList.remove('open'); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') m.classList.remove('open'); });
    m.addEventListener('click', function(e){
      var b = e.target.closest('[data-a]'); if (!b) return;
      m.classList.remove('open');
      var a = b.getAttribute('data-a');
      try {
        if (a === 'pull'){ SHELL.toSuite(); }
        else if (a === 'send'){ SHELL.toCalc(); }
        else if (a === 'open'){ SHELL.go('calc'); }
        else if (a === 'suite'){ SHELL.go('suite'); }
        else if (a === 'report'){ SHELL.go('calc'); setTimeout(function(){ if (typeof window.openReport === 'function') window.openReport(); }, 120); }
      } catch(err){ say('Could not reach the Income Calculator', String(err && err.message || err), 'warn', 4000); }
    });
  }
  return true;
}

/* ------------------------------------------------------------------ 5
   VERDICT at the head of the live summary */
function paintVerdict(){
  var sec = $('v44LiveSummary'); if (!sec) return false;
  var o = outputs(), i = inputs(); if (!o || !i) return true;
  var v = sec.querySelector('.v50-verdict');
  if (!v){ v = document.createElement('div'); v.className = 'v50-verdict'; }
  var loan = o.loan || {}, cash = o.cash || {};
  var bind = loan.limitBinding && loan.limitBinding !== 'none';
  var deficit = N(cash.deficit) > 0;
  var t = null; try { t = window.V48 && V48.arvTest ? V48.arvTest(i, o) : null; } catch(e){}
  var valueOpen = !!(t && t.pass !== true);
  var head = bind ? 'Loan limit is binding' : deficit ? 'Borrower funds are short'
           : (t && t.pass === false) ? 'Value test does not pass' : (t && t.pass == null) ? 'Waiting on the after-repair value' : 'Structured within limits';
  var body = 'Maximum base loan ' + usd(loan.maximumBaseLoan) + '.';
  if (t && t.text) body += ' ' + t.text;
  if (deficit) body += ' Short by ' + usd(cash.deficit) + '.';
  var html = '<b>'+esc(head)+'</b>'+esc(body);
  if (v.__sig !== html){ v.__sig = html; v.innerHTML = html; }
  v.classList.toggle('warn', bind || deficit || valueOpen);
  var title = sec.querySelector('.v44-live-title');
  var anchor = title ? title.nextSibling : sec.firstChild;
  if (v.parentNode !== sec || v.previousSibling !== title) sec.insertBefore(v, anchor);
  return true;
}

/* ------------------------------------------------------------------ 5b
   EXPANDED LIVE SUMMARY
   These are views of existing engine outputs only.  Each line stays linked
   to its source workspace through the same row handler as the base summary. */
function usd2(v){ var n=N(v); return (n<0?'\u2212':'')+'$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function liveExtraRow(label,value,mode,cls,sub,attrs){
  return '<button type="button" class="v35-live-row v44-live-row v50-live-extra-row '+(cls||'')+'" data-v35-label="'+esc(label)+'" data-v35-mode="'+esc(mode)+'" '+(attrs||'')+'><span>'+esc(label)+(sub?'<small>'+esc(sub)+'</small>':'')+'</span><b>'+esc(value)+'</b></button>';
}
function paintLiveExtras(){
  var host=$('v44LiveSummary'),o=outputs(),i=inputs(); if(!host||!o||!i)return false;
  var cash=o.cash||{},closing=o.closing||{},aus=o.aus||{},rules=o.stateRules||{};
  var arv=null; try{arv=window.V48&&V48.arvTest?V48.arvTest(i,o):null;}catch(e){}
  var risk=''; try{risk=((aus.riskFactors||[]).filter(function(x){return x.factor==='Credit';})[0]||{}).result||'';}catch(e){}
  var credit=N(i.creditScore)>0 ? String(Math.round(N(i.creditScore)))+(aus.creditTier?' · '+aus.creditTier:'') : 'Enter score';
  var arvText='',arvClass='na',arvSub='';
  if(o.renovationActive&&arv){
    arvClass=arv.status==='pass'?'pass':arv.status==='fail'?'bad':'na';
    arvText=arv.status==='pass'?'Passes by '+usd2(Math.abs(N(arv.shortfall||arv.gap))):arv.status==='fail'?'Fails by '+usd2(Math.abs(N(arv.shortfall||arv.gap))):'Pending appraisal';
    arvSub=arv.status==='na'?'Enter an after-repair value to run the program value test.':('Value ratio '+N(arv.ratio).toFixed(2)+'% · threshold '+N(arv.threshold).toFixed(0)+'%');
  }
  var stateName=rules.state||i.state||'State rules',closeMethod=rules.closingMethod||'';
  var stateText=/attorney/i.test(closeMethod)?'Attorney state':(closeMethod||'State rules applied');
  var limitText=o.isFha?usd2(o.loan&&o.loan.fhaLimitApplied)+' · '+((o.loan&&o.loan.fhaTier)||'Auto'):'Not applicable';
  var limitClass=o.isFha&&N(o.loan&&o.loan.amountOverFhaLimit)>0?'bad':'pass';
  var sig=[cash.requiredInvestment,closing.buyerClosingCosts,cash.sellerConcessionApplied,cash.earnestMoneyDeposit,cash.cashToClose,cash.cashToCloseLow,cash.cashToCloseHigh,credit,risk,o.renovationActive,arvText,stateText,limitText].join('|');
  var box=host.querySelector('.v50-live-extras'); if(box&&box.dataset.sig===sig)return true;
  if(!box){box=document.createElement('section');box.className='v50-live-extras';}
  var html='<h4>Borrower funds</h4>'+
    liveExtraRow('Minimum investment',usd2(cash.requiredInvestment),'setup','','Down payment / required investment')+
    liveExtraRow('Plus closing costs',usd2(closing.buyerClosingCosts),'closing','','Buyer fees and prepaids')+
    liveExtraRow('Remaining cash to close',usd2(cash.cashToClose),'closing','total')+
    '<button type="button" class="v50-funds-toggle" data-v50-funds-toggle>Show credits & deposits</button>'+
    '<div class="v50-funds-detail">'+liveExtraRow('Less seller credit','\u2212 '+usd2(cash.sellerConcessionApplied),'closing','','Applied credit only')+liveExtraRow('Less earnest money','\u2212 '+usd2(cash.earnestMoneyDeposit),'closing','','Already paid and credited')+liveExtraRow('With the cushion',usd2(cash.cashToCloseLow)+' \u2013 '+usd2(cash.cashToCloseHigh),'closing','pass','Planning range')+'</div>';
  html+='<h4>Credit & status</h4>'+liveExtraRow('Representative score',credit,'credit',risk==='PASS'?'pass':'na',risk||'Credit review','data-v50-edit-score');
  if(o.renovationActive&&arv)html+=liveExtraRow('ARV test',arvText,'maxmortgage',arvClass,arvSub);
  html+=liveExtraRow(stateName,stateText,'closing',/attorney/i.test(stateText)?'pass':'','Closing rules');
  html+='<h4>ZIP & limits</h4>'+liveExtraRow('ZIP '+(i.zipCode||'11530'),limitText,'maxmortgage',limitClass,o.isFha?((o.loan&&o.loan.fhaLimitStatus)||'County-limit planning check'):'Conventional county limit does not apply');
  box.dataset.sig=sig;box.innerHTML=html;
  var toggle=box.querySelector('[data-v50-funds-toggle]'); if(toggle)toggle.onclick=function(e){e.preventDefault();e.stopPropagation();box.classList.toggle('expanded');toggle.textContent=box.classList.contains('expanded')?'Hide credits & deposits':'Show credits & deposits';};
  var checks=Array.prototype.filter.call(host.querySelectorAll(':scope > h4'),function(h){return key(h.textContent)==='CHECKS';})[0];
  if(checks)host.insertBefore(box,checks);else host.appendChild(box);
  return true;
}

/* Credit retains its reader and gains a compact planning panel above it. */
function paintCreditOverview(){
  var o=outputs(),i=inputs(),body=$('screen-body'); if(!o||!i||!body||engineMode()!=='credit')return false;
  var cash=o.cash||{},pay=o.payment||{},loan=o.loan||{},aus=o.aus||{},old=$('v50CreditOverview');
  var sig=[loan.totalLoan,pay.totalMonthlyPayment,cash.cashToClose,aus.backEndDti,cash.cashToCloseLow,cash.cashToCloseHigh].join('|');
  if(old&&old.dataset.sig===sig)return true; if(!old){old=document.createElement('section');old.id='v50CreditOverview';old.className='v50-credit-overview no-print';}
  old.dataset.sig=sig;old.innerHTML='<header><div><small>Borrower planning range</small><h3>Credit overview</h3></div><button type="button" data-v50-open-mi>Mortgage insurance worksheet</button></header><div class="v50-credit-metrics">'+
    '<button data-v35-label="Total loan" data-v35-mode="maxmortgage"><span>Total loan</span><b>'+usd2(loan.totalLoan)+'</b></button><button data-v35-label="Monthly payment" data-v35-mode="quote"><span>Monthly payment</span><b>'+usd2(pay.totalMonthlyPayment)+'</b></button><button data-v35-label="Cash to close" data-v35-mode="closing"><span>Cash to close</span><b>'+usd2(cash.cashToClose)+'</b></button><button data-v35-label="Back-end DTI" data-v35-mode="income"><span>Back-end DTI</span><b>'+(N(aus.totalQualifyingIncome)?pct(aus.backEndDti):'Enter income')+'</b></button></div><div class="v50-planning-range"><span>FHA planning: 46% front / 56% back</span><span>Conventional planning: 50% front / 50% back</span><span>Cash: '+usd2(cash.cashToCloseLow)+' – '+usd2(cash.cashToCloseHigh)+'</span></div>';
  old.querySelector('[data-v50-open-mi]').onclick=function(){V50.run(['PMI Worksheet','PMI / FHA MIP'],function(){V50.go('QUALIFY');});};
  old.querySelectorAll('.v50-credit-metrics button').forEach(function(b){b.onclick=function(){if(window.V35&&V35.openRailEditor)V35.openRailEditor(b,b.dataset.v35Label,b.dataset.v35Mode);};});
  body.insertBefore(old,body.firstChild);return true;
}

/* Keep freeform percentage fields readable without changing the stored fraction. */
function paintFreeformValues(){
  var s=store();if(!s)return;
  $$('[data-v35-quote][data-kind="percent"]').forEach(function(input){
    if(document.activeElement===input)return;
    var v=N(s.activeInputs.finalDownPaymentPct)*100;
    var pretty=(Math.round(v*1000)/1000).toFixed(3).replace(/\.?0+$/,'');
    if(input.value!==pretty)input.value=pretty;
  });
}

/* Loan Suite figures commit on change/blur.  Earlier retained modules render
   a few inline oninput handlers, so move those handlers to change once their
   field is in the Loan Suite.  The Income Calculator is deliberately outside
   this function and continues to update while the user types. */
function deferSuiteInputCommit(){
  var root=$('suite-root'); if(!root||inCalculator())return false;
  $$('input[oninput],textarea[oninput]',root).forEach(function(el){
    if(el.__v50DeferredCommit)return;
    var type=String(el.type||'text').toLowerCase();
    if(/^(button|submit|reset|file|hidden|checkbox|radio|range)$/.test(type))return;
    var commit=el.oninput;
    if(typeof commit!=='function')return;
    el.__v50DeferredCommit=true;
    el.__v50InlineCommit=commit;
    el.oninput=null;
    el.removeAttribute('oninput');
    el.addEventListener('change',function(event){
      try { commit.call(el,event); } catch(e){}
    });
    el.addEventListener('keydown',function(event){
      if(event.key==='Enter'&&el.tagName==='INPUT'&&!event.shiftKey){ event.preventDefault(); el.blur(); }
    });
  });
  return true;
}

/* ------------------------------------------------------------------ 5c
   DEFAULT INCOME HANDOFF
   The manual "Send income" action remains available, but entering the Loan
   Suite now brings across the current Income Calculator result by default.
   It deliberately uses the Suite's public importer (rather than touching
   scenario state directly), so the existing borrower/liability mapping,
   recalculation, audit trail and no-overwrite rules stay in one place.

   A signature and a value comparison prevent a scheduler tick from writing
   the same figures repeatedly. A Loan Suite-only edit remains in place until
   the Income Calculator result itself changes.
   ------------------------------------------------------------------ */
var incomeSignature = '';
function sameIncomeInputs(i, borrowers){
  var rows=(i&&i.borrowers)||[];
  return borrowers.every(function(src,index){
    var current=rows[index]||{};
    var sourceName=norm(src.name), currentName=norm(current.name);
    var nameMatches=/^Borrower\s+\d+$/i.test(sourceName) || sourceName===currentName;
    return nameMatches &&
      Math.abs(N(current.grossMonthlyIncome)-N(src.grossMonthlyIncome))<0.005 &&
      Math.abs(N(current.otherMonthlyIncome)-N(src.otherMonthlyIncome))<0.005 &&
      Math.abs(N(current.monthlyDebts)-N(src.monthlyDebts))<0.005;
  });
}
function syncCalculatorIncome(force){
  var shell=window.SHELL, s=store();
  if(!s || !shell || (!force && shell.mode!=='suite')) return false;
  var totals, patch;
  try {
    if(typeof window.calcTotals!=='function' || typeof window.renoPatch!=='function') return false;
    totals=window.calcTotals(); patch=window.renoPatch();
  } catch(e){ return false; }
  if(!patch || !Array.isArray(patch.borrowers) || !(N(totals.income)>0 || N(totals.debts)>0)) return false;
  var signature=JSON.stringify(patch.borrowers.map(function(b){ return [norm(b.name),N(b.grossMonthlyIncome),N(b.otherMonthlyIncome),N(b.monthlyDebts)]; }));
  if(signature===incomeSignature) return false;
  /* A fresh page may already contain the same imported figures. Remember
     that state without producing a redundant audit entry. */
  if(sameIncomeInputs(s.activeInputs,patch.borrowers)){
    incomeSignature=signature;
    return false;
  }
  try {
    s.importIncomeText(JSON.stringify(patch),'Income Calculator default handoff');
    incomeSignature=signature;
    return true;
  } catch(e){ return false; }
}
function installIncomeHandoff(){
  var shell=window.SHELL;
  if(!shell || typeof shell.go!=='function' || shell.__v50IncomeHandoff) return false;
  var originalGo=shell.go;
  shell.go=function(next){
    if(next==='suite') syncCalculatorIncome(true);
    var result=originalGo.apply(this,arguments);
    /* The Loan Suite is no longer painted while the calculator is active.
       Refresh it immediately on the way back instead of waiting for the
       scheduler's next idle pass. */
    if(next==='suite') setTimeout(function(){ soon(true); },0);
    return result;
  };
  shell.__v50IncomeHandoff=true;
  return true;
}
V50.syncCalculatorIncome=syncCalculatorIncome;

/* ------------------------------------------------------------------ 5d
   POPUP DISMISSAL
   Every menu remains keyboard accessible, but a click/tap in the page
   background now closes the action popovers consistently in both products.
   Native <details> menus use their existing markup; this only closes an
   already-open surface and never removes its controls or handlers.
   ------------------------------------------------------------------ */
function installPopupDismissal(){
  if(document.__v50PopupDismiss) return;
  document.__v50PopupDismiss=true;
  document.addEventListener('pointerdown',function(e){
    var target=e.target;
    if(target&&target.closest&&target.closest('#v50IncMenu, #shellbar .lnk.v50-inc, #v44Menu, #v44Header, .v23-action-menu, .v23-sync-menu')) return;
    $$('#calc-root .v23-action-menu[open], #calc-root .v23-sync-menu[open], #suite-root .v23-action-menu[open], #suite-root .v23-sync-menu[open]').forEach(function(menu){ menu.open=false; });
    try { if(window.V44&&V44.closeMenu) V44.closeMenu(); } catch(err){}
    var incomeMenu=$('v50IncMenu'); if(incomeMenu) incomeMenu.classList.remove('open');
  },true);
}

/* ------------------------------------------------------------------ 5e
   UNIVERSAL DOCUMENT PROMPT
   A shared, browser-only prompt builder for both applications.  The
   existing file-specific OCR prompts remain where they are; this is an
   additional freeform way to create one consistent prompt for any
   document.  It never calls an external service, and it deliberately
   leaves document import/review in the existing Documents & OCR flow. */
var UNIVERSAL_PROMPT_TYPES = {
  general:{label:'Any mortgage document',focus:'Identify the document and extract only figures, dates, names, identifiers and terms printed on it.',fields:'documentType, sourceName, borrowerName, propertyAddress, dates, amounts, rates, identifiers'},
  paystub:{label:'Income - paystub / earnings statement',focus:'Extract employee, employer, pay frequency, pay-period dates, hourly or salary rate, hours, current earnings, YTD earnings, taxes, deductions and net pay.',fields:'documentType:"paystub", employeeName, employer, payDate, periodStart, periodEnd, payFrequency, hourlyRate, salaryRate, regularHours, overtimeHours, grossThisPeriod, grossYtd, baseYtd, overtimeYtd, bonusYtd, commissionYtd, taxes, deductions, netPay'},
  w2:{label:'Income - W-2',focus:'Extract employee, employer, EIN, tax year, wages, Social Security wages, Medicare wages, withholding and all printed Box 12 codes.',fields:'documentType:"w2", employeeName, employer, employerEin, taxYear, box1Wages, box2FederalWithheld, box3SocialSecurityWages, box5MedicareWages, box12Codes:[{code,amount}]'},
  voe:{label:'Income - written VOE / Work Number',focus:'Extract employee, employer, position, employment status, hire date, base pay, pay frequency, current and prior-year overtime, bonus, commission and other income.',fields:'documentType:"voe", employeeName, employer, position, employmentStatus, hireDate, payFrequency, baseRate, currentYearBase, currentYearOvertime, currentYearBonus, currentYearCommission, priorYearTotal, twoYearsPriorTotal, verifiedOn'},
  tax1040:{label:'Income - 1040 / tax return',focus:'Extract the tax year, filers, wages, interest, dividends, capital gains, other income, adjusted gross income, taxable income and all attached schedules that are present.',fields:'documentType:"1040", taxYear, filers, line1Wages, taxableInterest, ordinaryDividends, capitalGainOrLoss, otherIncome, adjustedGrossIncome, taxableIncome, schedulesPresent'},
  scheduleC:{label:'Income - Schedule C / sole proprietor',focus:'Extract business name, owner, tax year, gross receipts, cost of goods sold, total expenses, net profit or loss, depreciation, business use of home, meals and vehicle expenses.',fields:'documentType:"scheduleC", businessName, ownerName, taxYear, grossReceipts, costOfGoodsSold, totalExpenses, line31NetProfit, depreciation, homeOffice, mealsDeducted, carExpenses'},
  scheduleE:{label:'Income - Schedule E / rental',focus:'Extract each property, rents received, royalties, mortgage interest, taxes, insurance, repairs, HOA, depreciation, total expenses and net rental income or loss.',fields:'documentType:"scheduleE", taxYear, properties:[{propertyAddress,rentsReceived,royalties,mortgageInterest,taxes,insurance,repairs,hoa,depreciation,totalExpenses,netRentalIncome}]'},
  k1:{label:'Income - K-1 / 1065 / 1120-S',focus:'Extract entity name, EIN, taxpayer, ownership percentage, ordinary business income or loss, rental income, guaranteed payments, distributions, depreciation and tax year.',fields:'documentType:"k1", entityName, entityEin, taxpayerName, taxYear, ownershipPct, ordinaryBusinessIncome, rentalIncome, guaranteedPayments, distributions, depreciation'},
  business:{label:'Income - business return / P&L',focus:'Extract business name, ownership, tax year or period, revenue, cost of goods sold, operating expenses, depreciation, officer compensation, net income and recurring versus one-time items.',fields:'documentType:"businessReturn", businessName, entityType, taxYear, periodStart, periodEnd, grossRevenue, costOfGoodsSold, operatingExpenses, depreciation, officerCompensation, netIncome, oneTimeItems'},
  income1099:{label:'Income - 1099 / independent contractor',focus:'Extract recipient, payer, tax year, 1099 form type, nonemployee compensation, interest, dividends, retirement distributions or other printed income.',fields:'documentType:"1099", formType, recipientName, payerName, payerTin, taxYear, nonemployeeCompensation, interestIncome, dividends, retirementDistribution, otherIncome'},
  benefits:{label:'Income - retirement, pension, Social Security or VA',focus:'Extract beneficiary, agency or payer, benefit type, monthly or periodic gross benefit, effective date, continuation evidence, withholding and any Medicare deduction.',fields:'documentType:"benefitAward", beneficiary, agencyOrPayer, benefitType, grossMonthlyBenefit, grossPeriodicBenefit, payFrequency, effectiveDate, continuationDate, federalWithholding, medicareDeduction'},
  support:{label:'Income - support, maintenance or other award',focus:'Extract recipient, payer, court or agency, award type, monthly amount, start and end dates, received-payment history and continuance terms when printed.',fields:'documentType:"supportAward", recipient, payer, awardType, monthlyAmount, startDate, endDate, paymentHistory, continuanceTerms'},
  assets:{label:'Assets - bank or investment statement',focus:'Extract institution, account, owners, statement dates, balances, transaction rows and every deposit or withdrawal exactly as printed.',fields:'documentType:"assetStatement", institution, accountLast4, accountType, owners, statementStart, statementEnd, beginningBalance, endingBalance, deposits:[{date,amount,description}], withdrawals:[{date,amount,description}]'},
  credit:{label:'Credit report',focus:'Extract scores, tradelines, balances, payments, months remaining, status, responsibility, inquiries and real-estate-owned details.',fields:'documentType:"creditReport", scores, tradelines:[{creditor,type,balance,monthlyPayment,monthsRemaining,status,responsibility}], inquiries, reo'},
  property:{label:'Property / appraisal / rent',focus:'Extract address, property facts, dates, as-is value, after-repair value, appraisal facts, taxes, insurance and market or contract rent when printed.',fields:'documentType:"property", propertyAddress, effectiveDate, asIsValue, afterRepairValue, propertyType, units, yearBuilt, annualTaxes, annualInsurance, marketRent'},
  contract:{label:'Contract / Loan Estimate / Closing Disclosure',focus:'Extract parties, property, transaction dates, price, loan terms, credits, deposits, fees, cash to close and all material conditions.',fields:'documentType:"contract|loanEstimate|closingDisclosure", buyer, seller, propertyAddress, purchasePrice, loanAmount, interestRate, closingDate, earnestMoney, sellerCredits, fees, cashToClose'},
  legal:{label:'Lease / addendum / agreement',focus:'Extract parties, property, dates, rent or financial terms, deposits, obligations, amendments and signature information.',fields:'documentType:"lease|addendum", landlord, tenants, propertyAddress, leaseStart, leaseEnd, monthlyRent, securityDeposit, amendments, signatureDates'},
  renovation:{label:'Contractor estimate / renovation',focus:'Extract contractor details, property, dates, scope, line items, labor, materials, permits, contingencies, draws and totals.',fields:'documentType:"contractorEstimate", contractor, licenseNumber, propertyAddress, estimateDate, lineItems:[{item,description,labor,materials,total}], permits, contingency, drawSchedule, total'}
};
function universalContext(){
  var i=inputs()||{}, o=outputs()||{}, loan=o.loan||{};
  var borrower=norm(i.borrowerName || ((i.borrowers||[])[0]||{}).name);
  var address=[i.propertyAddress,i.city,i.state,i.zipCode].filter(Boolean).join(', ');
  var rows=[];
  if(borrower) rows.push('Borrower: '+borrower);
  if(address) rows.push('Property: '+address);
  if(i.loanProgram) rows.push('Program: '+i.loanProgram);
  if(N(i.basePurchasePrice)) rows.push('Purchase price: '+usd2(i.basePurchasePrice));
  if(N(loan.totalLoan)) rows.push('Current total loan: '+usd2(loan.totalLoan));
  return rows.length ? '\n\nCurrent file context (reference only; never use it to fill a missing document value):\n- '+rows.join('\n- ') : '';
}
function universalPromptText(type, extra, useContext){
  var spec=UNIVERSAL_PROMPT_TYPES[type]||UNIVERSAL_PROMPT_TYPES.general;
  return 'You are reviewing a mortgage-loan document for a human reviewer. '+spec.focus+'\n\n'
    + 'Requirements:\n'
    + '- Return ONLY one valid JSON object. Do not add prose or markdown fences.\n'
    + '- Include "documentType" and "sourceName" when they are printed or known.\n'
    + '- Use descriptive camelCase keys that match the printed labels.\n'
    + '- Numbers must be plain numbers without currency symbols, commas or percent signs.\n'
    + '- Keep rates as printed, for example 6.875, never 0.06875.\n'
    + '- Use YYYY-MM-DD for complete dates; preserve partial or ambiguous dates as sourceText.\n'
    + '- Never guess, calculate, annualize, reconcile or replace a missing value. Omit an uncertain field instead.\n'
    + '- Add "review": [{"field":"","value":"","status":"Auto-matched|Needs Review","sourceText":""}] only for fields that need human review.\n'
    + '- Add "notes": [] for relevant caveats found in the document.\n'
    + (spec.fields ? '\nPreferred JSON keys when printed:\n'+spec.fields+'\n' : '')
    + (useContext ? universalContext() : '')
    + (norm(extra) ? '\n\nAdditional reviewer instructions:\n'+norm(extra) : '')
    + '\n\nDocument text or file follows:';
}
function copyText(value,done){
  if(!value) return;
  var fallback=function(){
    var ta=document.createElement('textarea'); ta.value=value; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch(x){} ta.remove(); if(done)done();
  };
  try { if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(value).then(done,fallback);return;} } catch(e){}
  fallback();
}
function universalModal(){
  var modal=$('v50UniversalPrompt');
  if(modal) return modal;
  modal=document.createElement('div'); modal.id='v50UniversalPrompt'; modal.className='v50-universal-modal no-print';
  modal.innerHTML='<button type="button" class="v50-universal-backdrop" aria-label="Close Universal Prompt"></button>'
    + '<section class="v50-universal-dialog" role="dialog" aria-modal="true" aria-labelledby="v50UniversalTitle">'
    + '<header><div><span>Documentation workspace</span><h2 id="v50UniversalTitle">Universal Prompt</h2><p>Build a reusable extraction prompt without changing the current file.</p></div><button type="button" class="v50-universal-close" aria-label="Close">&#215;</button></header>'
    + '<div class="v50-universal-controls"><label><span>Document focus</span><select id="v50UniversalType">'+Object.keys(UNIVERSAL_PROMPT_TYPES).map(function(k){return '<option value="'+k+'">'+esc(UNIVERSAL_PROMPT_TYPES[k].label)+'</option>';}).join('')+'</select></label>'
    + '<label class="v50-universal-context"><input id="v50UniversalContext" type="checkbox" checked> Include current file context as reference only</label>'
    + '<label class="v50-universal-extra"><span>Additional instructions <em>Optional and freeform</em></span><textarea id="v50UniversalExtra" rows="2" placeholder="For example: prioritize rental income, flag handwritten edits, or preserve payer names."></textarea></label></div>'
    + '<label class="v50-universal-output"><span>Prompt <em>Editable before copying</em></span><textarea id="v50UniversalOutput" rows="15"></textarea></label>'
    + '<footer><div><button type="button" class="primary" data-v50-up-copy>Copy prompt</button><button type="button" data-v50-up-download>Download .txt</button></div><div><button type="button" data-v50-up-docs>Open Documents & OCR</button><button type="button" data-v50-up-review>Send returned JSON to review</button></div></footer>'
    + '<label class="v50-universal-return"><span>Returned JSON <em>Optional; it is placed into the existing review box, never auto-applied</em></span><textarea id="v50UniversalJson" rows="4" placeholder="Paste the assistant JSON here when ready."></textarea></label>'
    + '</section>';
  document.body.appendChild(modal);
  var update=function(){ $('v50UniversalOutput').value=universalPromptText($('v50UniversalType').value,$('v50UniversalExtra').value,$('v50UniversalContext').checked); };
  $('v50UniversalType').addEventListener('change',update); $('v50UniversalContext').addEventListener('change',update); $('v50UniversalExtra').addEventListener('input',update);
  modal.querySelector('.v50-universal-backdrop').onclick=V50.closeUniversalPrompt;
  modal.querySelector('.v50-universal-close').onclick=V50.closeUniversalPrompt;
  modal.querySelector('[data-v50-up-copy]').onclick=function(){ copyText($('v50UniversalOutput').value,function(){say('Prompt copied','Paste it into your assistant with the document, then return the JSON for review.','good',4500);}); };
  modal.querySelector('[data-v50-up-download]').onclick=function(){ var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([$('v50UniversalOutput').value],{type:'text/plain'})); a.download='mortgage-suite-universal-prompt.txt'; a.click(); setTimeout(function(){URL.revokeObjectURL(a.href);},0); };
  modal.querySelector('[data-v50-up-docs]').onclick=function(){ V50.closeUniversalPrompt(); V50.go('DOCUMENTS & OCR'); setTimeout(function(){window.scrollTo({top:0,behavior:'smooth'});},80); };
  modal.querySelector('[data-v50-up-review]').onclick=function(){
    var value=$('v50UniversalJson').value.trim(); if(!value){say('No JSON entered','Paste the returned JSON before sending it to the document review box.','warn',4000);return;}
    V50.go('DOCUMENTS & OCR'); setTimeout(function(){var target=$('v9JsonBox');if(target){target.value=value;target.dispatchEvent(new Event('input',{bubbles:true}));target.focus();say('JSON ready for review','Review it in Documents & OCR, then choose Apply the JSON if appropriate.','good',5000);}else say('Document review is loading','Open Documents & OCR and paste the JSON into its review field.','info',4000);},180);
  };
  return modal;
}
V50.closeUniversalPrompt=function(){var modal=$('v50UniversalPrompt');if(modal)modal.classList.remove('open');};
V50.openUniversalPrompt=function(type){var modal=universalModal();var pick=$('v50UniversalType');if(type&&UNIVERSAL_PROMPT_TYPES[type])pick.value=type;modal.classList.add('open');$('v50UniversalOutput').value=universalPromptText(pick.value,$('v50UniversalExtra').value,$('v50UniversalContext').checked);setTimeout(function(){$('v50UniversalOutput').focus();},0);};
document.addEventListener('keydown',function(e){if(e.key==='Escape')V50.closeUniversalPrompt();});
function universalEntry(type){
  var b=document.createElement('button');b.type='button';b.className='v50-universal-entry';b.dataset.v50UniversalPrompt=type||'general';
  b.setAttribute('aria-label','Open Universal Prompt');b.title='Universal documentation prompt';b.textContent='AI';
  b.onclick=function(){V50.openUniversalPrompt(b.dataset.v50UniversalPrompt);};return b;
}
function placeUniversalEntry(host,id,type,position){
  if(!host||$(id))return false;var b=universalEntry(type);b.id=id;
  if(position==='first')host.insertBefore(b,host.firstChild);else host.appendChild(b);return true;
}
function installUniversalPromptLaunchers(){
  /* Keep the launcher in each existing document header instead of adding a new card. */
  var hub=$('v15DocsHub');if(hub)placeUniversalEntry(hub.querySelector('.v15-hub-head'),'v50UniversalCalcHub','general');
  var loanDocs=$('v16LoanDocs');if(loanDocs)placeUniversalEntry(loanDocs.querySelector('.card-top'),'v50UniversalLoanHub','general');
  /* Remove the first-pass standalone cards if this build was open during an update. */
  ['v50UniversalCalcDocs','v50UniversalLoanDocs'].forEach(function(id){var old=$(id);if(old)old.remove();});
  /* Contract & LE is a separate routed stage, so it retains its own compact AI action. */
  var stage=$('v8Stage');if(stage&&(window.V8&&V8.active==='docparse'||/contract\s*&\s*le/i.test(stage.textContent||'')))placeUniversalEntry(stage,'v50UniversalContract','contract','first');
}
function installUniversalMenu(){
  if(!window.V44||!V44.openMenu||V44.__v50UniversalMenu)return false;
  var open=V44.openMenu;V44.openMenu=function(kind){var result=open.apply(this,arguments);if(kind==='docs'||kind==='actions')setTimeout(function(){var menu=$('v44Menu');if(!menu||menu.querySelector('[data-v50-universal-menu]'))return;var section=document.createElement('section');section.className='v44-menu-section v50-universal-menu';section.innerHTML='<span>Document AI</span><div class="v44-menu-grid"></div>';var b=universalEntry('general');b.classList.add('v44-menu-item');b.dataset.v50UniversalMenu='1';b.innerHTML='<i aria-hidden="true">AI</i><span><b>AI</b><small>Universal documentation prompt</small></span>';section.querySelector('.v44-menu-grid').appendChild(b);menu.appendChild(section);},0);return result;};V44.__v50UniversalMenu=true;return true;
}

/* ------------------------------------------------------------------ 6
   RAIL: when the live summary is hidden, the page takes the full width */
function paintCols(){
  var cols = document.querySelector('#suite-root .cols-main'); if (!cols) return;
  var rail = cols.querySelector('.rail');
  var hidden = !rail || getComputedStyle(rail).display === 'none';
  cols.classList.toggle('v50-norail', hidden);
}


/* ------------------------------------------------------------------ 7
   ROUTING GUARD
   Two faults carried from 48: the engine re-highlights its own last page
   after a click on a page it does not own, so the highlight lags one
   click behind; and release 47 reads that stale highlight as "the user
   left", which closes Mortgage rates and Documents & OCR under the
   previous page. The guard remembers the tab the user chose, keeps the
   highlight on it, and keeps those two pages on screen until the user
   goes somewhere else. */
var STAGE = { 'MORTGAGE RATES':'rates', 'DOCUMENTS & OCR':'docs', 'DOCUMENTS & WORKSHEETS':'docs' };
var intended = null, lastTrusted = 0, lastMode = null, guarding = false;
/* The retained tab renderer keeps an accessible original label and our
   visible label in the same button. Prefer the stable data label so routing
   does not see strings such as "SETUP Setup" as a new, unknown page. */
function tabKey(t){ return key(t && (t.getAttribute('data-v50-label') || t.getAttribute('data-v23-key') || t.textContent)); }
function row(){ return document.querySelector('#suite-root .tabs'); }
function tabFor(k){ var r = row(); return r ? $$('.tab', r).filter(function(t){ return tabKey(t) === k; })[0] : null; }
function isEngineTab(t){ return t && !t.classList.contains('v8-tab') && !t.classList.contains('v43-tab') && !t.dataset.v8 && !STAGE[tabKey(t)]; }
function engineMode(){ try { var s = store(); return s && s.snapshot ? s.snapshot.mode : null; } catch(e){ return null; } }
function modeKey(m){ return key(m).replace('MAXMORTGAGE','MAX MORTGAGE'); }
function showStage(id){
  var sr = $('suite-root'); if (!sr) return;
  var host = $('v8Stage'), cm = sr.querySelector('.cols-main');
  var need = !window.V8 || V8.active !== id || !host || host.style.display === 'none';
  if (need && window.V8 && V8.go){
    var y = window.scrollY; V8.go(id);
    if (V8.active === id && y && intended && intended.at && Date.now() - intended.at > 900) window.scrollTo(0, y);
    host = $('v8Stage');
  }
  if (host && host.style.display === 'none') host.style.display = '';
  if (cm && cm.style.display !== 'none') cm.style.display = 'none';
  var moved = $('suiteMoved'); if (moved && moved.style.display !== 'none') moved.style.display = 'none';
  sr.classList.add('v47-parked'); sr.dataset.v47Parked = id;
}
function enforce(){
  if (guarding || !intended) return;
  var r = row(); if (!r) return;
  var t = tabFor(intended.key);
  if (!t){ intended = null; return; }
  guarding = true;
  try {
    $$('.tab', r).forEach(function(x){ var on = x === t; if (x.classList.contains('active') !== on) x.classList.toggle('active', on); });
    var st = STAGE[intended.key];
    if (st) showStage(st);
    else if (isEngineTab(t) && window.V8 && V8.active && V8.active !== 'property'){ V8.leave(); }
  } finally { guarding = false; }
}
function V48full(){ try { return window.V48 && V48.fullOpen && V48.fullOpen(); } catch(e){ return false; } }
var GROUP_OF = { 'QUOTE':'file','SETUP':'file','PROPERTY':'file','RENOVATION':'loan','MAX MORTGAGE':'loan','MORTGAGE RATES':'loan',
  'CLOSING':'costs','ESCROW':'costs','TAXES & PRORATION':'costs','QUALIFY':'underwriting','RENTAL':'underwriting','CREDIT':'underwriting',
  'ADVANCED':'underwriting','CONTRACT & LE':'underwriting','SCENARIOS':'results','SUMMARY':'results',
  'DOCUMENTS & OCR':'documents','DOCUMENTS & WORKSHEETS':'documents','DRAFT LE':'documents' };
function syncGroup(k){
  var g = GROUP_OF[k]; if (!g || V48full()) return;
  try { if (localStorage.getItem('los.v23.suiteGroup') !== g) localStorage.setItem('los.v23.suiteGroup', g); } catch(e){}
  var nav = $('v23SuitePrimaryNav');
  if (nav) $$('button[data-group]', nav).forEach(function(b){ var on = b.dataset.group === g; if (b.classList.contains('active') !== on) b.classList.toggle('active', on); });
  /* The visible Documents button is the direct launcher, not the hidden
     compatibility group clone. Preserve its active state for orientation. */
  var docsDirect=$('v28nav-documents');
  if(docsDirect) docsDirect.classList.toggle('active',g==='documents');
  var r = row();
  if (r) $$('.tab', r).forEach(function(t){ var on = GROUP_OF[tabKey(t)] === g; if (t.classList.contains('v48-hide') === on) t.classList.toggle('v48-hide', !on); });
  try { if (window.LOS_SCHEDULER) LOS_SCHEDULER.request(0); } catch(e){}
}
function choose(k){
  var mine = intended = { key:k, at:Date.now() }; lastMode = engineMode();
  syncGroup(k);
  [60, 350, 900, 1700].forEach(function(ms){ setTimeout(function(){ if (intended !== mine) return; syncGroup(k); enforce(); }, ms); });
}
V50.choose = choose;

/* File is a workspace entry point, not a second quote shortcut.  Sending it
   to Setup keeps the first editable file page predictable after every use. */
function wireFileToSetup(){
  var nav=$('v23SuitePrimaryNav'),button=nav&&nav.querySelector('button[data-group="file"]');
  if(!button||button.__v50FileToSetup)return false;
  button.__v50FileToSetup=true;
  button.addEventListener('click',function(event){
    if(!event.isTrusted)return;
    event.preventDefault();event.stopImmediatePropagation();
    var setup=tabFor('SETUP');
    if(setup){
      choose('SETUP');
      setup.click();
      /* Legacy group handling runs a short asynchronous selection after
         its click. Re-assert Setup after that settles, without touching a
         subsequent user navigation to a different primary group. */
      [40,180,520].forEach(function(delay){setTimeout(function(){
        if(!button.classList.contains('active')) return;
        var current=tabFor('SETUP');
        if(current && !current.classList.contains('active')) current.click();
        choose('SETUP');
      },delay);});
    }else V50.go('SETUP');
  },true);
  return true;
}
/* The legacy workspace strip may replace its File button after our first
   enhancement pass. A single delegated capture handler covers that replacement
   without polling or retaining duplicate listeners. */
var fileSetupDelegated=false;
function installFileSetupDelegation(){
  if(fileSetupDelegated)return;
  fileSetupDelegated=true;
  document.addEventListener('click',function(event){
    if(!event.isTrusted||!event.target.closest)return;
    var button=event.target.closest('#v23SuitePrimaryNav button[data-group="file"]');
    if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();
    var setup=tabFor('SETUP');
    if(!setup){V50.go('SETUP');return;}
    choose('SETUP');setup.click();
    [40,180,520,1200].forEach(function(delay){setTimeout(function(){
      if(!button.classList.contains('active'))return;
      var current=tabFor('SETUP');if(current&&!current.classList.contains('active'))current.click();
      choose('SETUP');
    },delay);});
  },true);
}
/* live summary rows open the page that holds their figure */
var MODE_TAB = { quote:'QUOTE', setup:'SETUP', renovation:'RENOVATION', maxmortgage:'MAX MORTGAGE', rates:'MORTGAGE RATES', closing:'CLOSING',
  escrow:'ESCROW', qualify:'QUALIFY', income:'QUALIFY', rental:'RENTAL', credit:'CREDIT', advanced:'ADVANCED', summary:'SUMMARY', compare:'SCENARIOS' };
document.addEventListener('click', function(e){
  var r = e.target.closest && e.target.closest('#v44LiveSummary .v44-live-row, #v44LiveSummary .v44-arv-check');
  if (!r) return;
  if (r.hasAttribute('data-v50-edit-score')) return;
  var k = MODE_TAB[String(r.getAttribute('data-v35-mode')||'').toLowerCase()]; if (!k) return;
  var cur = (row() && row().querySelector('.tab.active')) || null;
  if (cur && tabKey(cur) === k) return;              /* already there: let the row focus its field */
  var t = tabFor(k); if (!t) return;
  e.stopImmediatePropagation(); e.preventDefault();
  lastTrusted = 0; t.click();
  setTimeout(function(){ window.scrollTo({ top:0, behavior:'smooth' }); }, 120);
}, true);
document.addEventListener('click', function(e){
  var r=e.target.closest&&e.target.closest('#v44LiveSummary [data-v50-edit-score]'); if(!r)return;
  e.preventDefault();e.stopImmediatePropagation();
  var s=store();if(!s)return; var old=$('v50ScoreEditor');if(old)old.remove();
  var p=document.createElement('aside');p.id='v50ScoreEditor';p.className='v35-rail-editor no-print';
  p.innerHTML='<header><div><small>Live summary</small><b>Representative credit score</b></div><button type="button" data-x aria-label="Close">×</button></header><p>Enter a score to refresh mortgage-insurance and credit-tier estimates.</p><div class="v35-rail-fields"><label><span>Credit score</span><input type="text" inputmode="decimal" autocomplete="off" value="'+esc(iNum(s.activeInputs.creditScore))+'"></label></div><footer><button type="button" class="primary" data-save>Apply change</button><button type="button" data-go>Open Credit</button></footer>';
  document.body.appendChild(p);var b=r.getBoundingClientRect(),w=Math.min(390,innerWidth-24);p.style.width=w+'px';p.style.left=Math.max(12,Math.min(innerWidth-w-12,b.left-w-12))+'px';p.style.top=Math.max(12,Math.min(innerHeight-p.offsetHeight-12,b.top))+'px';
  p.querySelector('[data-x]').onclick=function(){p.remove();};p.querySelector('[data-go]').onclick=function(){p.remove();V50.go('CREDIT');};p.querySelector('[data-save]').onclick=function(){var v=p.querySelector('input').value;if(window.V20&&V20.setScenario)V20.setScenario('creditScore',v,'num');else s.setField('creditScore',v,'Live summary edit');p.remove();};if(window.V19)V19.enhanceFreeform(p);
}, true);
function iNum(v){return N(v)>0?String(Math.round(N(v))):'';}
/* First Documents click opens its document menu; a quick second click opens OCR. */
var docsClickedAt=0;
document.addEventListener('click', function(e){
  if (!(e.target.closest && e.target.closest('#v44Docs'))) return;
  var now=Date.now();
  e.stopImmediatePropagation(); e.preventDefault();
  if(now-docsClickedAt>700){ docsClickedAt=now; try{if(window.V44&&V44.openMenu)V44.openMenu('docs');}catch(x){} return; }
  docsClickedAt=0;
  var t = tabFor('DOCUMENTS & OCR'); if (!t) return;
  lastTrusted = 0; t.click();
  setTimeout(function(){ window.scrollTo(0, 0); }, 150);
}, true);
document.addEventListener('click', function(e){
  var t = e.target.closest && e.target.closest('#suite-root .tabs .tab'); if (!t) return;
  var now = Date.now();
  if (e.isTrusted){ lastTrusted = now; choose(tabKey(t)); if (STAGE[tabKey(t)]) setTimeout(function(){ window.scrollTo(0,0); }, 150); }
  else if (now - lastTrusted > 1500){ choose(tabKey(t)); }
}, true);
/* the group buttons pick a page themselves; follow whatever they pick */
document.addEventListener('click', function(e){
  if (e.isTrusted && e.target.closest && e.target.closest('#v23SuitePrimaryNav button')){ intended = null; lastTrusted = 0; }
}, true);
function watchRow(){
  var r = row(); if (!r || r.__v50obs) return;
  r.__v50obs = true;
  new MutationObserver(function(){
    if (guarding || !intended) return;
    /* the engine moved on by itself (a link inside a page): follow it */
    var m = engineMode();
    if (m && lastMode && m !== lastMode){
      lastMode = m;
      var et = tabFor(modeKey(m));
      if (et && Date.now() - intended.at > 500){ intended = { key:modeKey(m), at:Date.now() }; }
    }
    enforce();
  }).observe(r, { subtree:true, attributes:true, attributeFilter:['class'] });
}

/* ------------------------------------------------------------------ loop
   The engines calculate synchronously through their own input handlers.
   This layer only decorates those engine results, so it is intentionally
   split in two: the right-side Live Summary (and its matching top figures)
   paint on the next frame, while navigation chrome and DOM discovery wait
   for a short idle window.  That keeps typing, tab changes and scrolling
   responsive without delaying any lending calculation. */
var livePending = false, decorPending = false, lastDecorated = 0, lastIncomeSync = 0;
var DECORATE_EVERY = 2200, INCOME_SYNC_EVERY = 3000;
function inCalculator(){ try { return !!(window.SHELL && SHELL.mode==='calc'); } catch(e){ return false; } }
function paintLiveNow(){
  if(document.hidden || inCalculator()) return;
  /* These figures are deliberately not debounced: they are the visible
     feedback for a freeform scenario edit. */
  try { paintTop(); } catch(e){}
  try { paintVerdict(); } catch(e){}
  try { paintLiveExtras(); } catch(e){}
  try { paintCreditOverview(); } catch(e){}
}
function refreshLive(){
  if(livePending) return;
  livePending = true;
  (window.requestAnimationFrame || setTimeout)(function(){ livePending=false; paintLiveNow(); });
}
function decorate(){
  decorPending=false;
  if(document.hidden) return;
  lastDecorated=Date.now();
  try { installIncomeHandoff(); } catch(e){}
  /* The Income Calculator has its own renderer. Only keep the shared shell
     menu and document launchers current while its workspace is visible. */
  try { paintIncome(); } catch(e){}
  try { installUniversalPromptLaunchers(); } catch(e){}
  if(inCalculator()) return;
  /* Calculator-to-suite handoff is useful, but it used to recompute the
     entire income workbook every renderer pass. Poll it sparingly; switching
     back to the suite still forces an immediate handoff through shell.go. */
  if(Date.now()-lastIncomeSync>=INCOME_SYNC_EVERY){
    lastIncomeSync=Date.now();
    try { syncCalculatorIncome(false); } catch(e){}
  }
  try { deferSuiteInputCommit(); } catch(e){}
  try { installUniversalMenu(); } catch(e){}
  try { paintHeader(); } catch(e){}
  try { paintTabs(); } catch(e){}
  try { wireFileToSetup(); } catch(e){}
  try { paintCols(); } catch(e){}
  try { watchRow(); enforce(); } catch(e){}
}
function scheduleDecor(delay, force){
  if(document.hidden || decorPending) return;
  if(!force && Date.now()-lastDecorated<DECORATE_EVERY) return;
  decorPending=true;
  var run=function(){ decorate(); };
  if(typeof window.requestIdleCallback==='function') window.requestIdleCallback(run,{timeout:Math.max(90,delay||0)});
  else setTimeout(run,Math.max(0,delay||0));
}
function tick(){
  /* The shared scheduler calls this periodically as a fallback for late
     mounted content. Its noncritical half is throttled above. */
  if(document.hidden) return;
  refreshLive();
  scheduleDecor(160,false);
}
function soon(force){
  refreshLive();
  scheduleDecor(force ? 0 : 90,!!force);
}
V50.refresh=function(){ refreshLive(); scheduleDecor(0,true); };
var subscribed = false;
/* A direct Loan Suite URL must win over the calculator's delayed W-2 startup
   routine.  That routine is useful when the calculator is the requested
   workspace, but it used to pull a fresh /loan-suite.html visit back to
   Income a couple seconds after first paint.  Keep the explicit suite entry
   pinned only through startup; a real workspace-button click cancels it. */
var suiteEntryPinned = false, suiteEntryWired = false;
function pinSuiteEntry(){
  var app=preferredWorkspace();
  if(app!=='suite') return false;
  /* A bare return URL is promoted to the direct Loan Suite route before the
     calculator's delayed start logic can choose its W-2 screen. */
  try {
    if(!explicitWorkspace()){
      var url=new URL(location.href);url.searchParams.set('app','suite');history.replaceState(null,'',url.toString());
    }
  } catch(e){}
  suiteEntryPinned=true;
  function apply(){
    if(!suiteEntryPinned) return;
    var shell=window.SHELL;
    try { if(shell&&shell.mode!=='suite'&&shell.go) shell.go('suite'); } catch(e){}
  }
  [0,520,1450,2600,4300].forEach(function(ms){ setTimeout(apply,ms); });
  if(!suiteEntryWired){
    suiteEntryWired=true;
    document.addEventListener('click',function(e){
      if(e.isTrusted&&e.target.closest&&e.target.closest('#mode-calc,#mode-suite')) suiteEntryPinned=false;
    },true);
  }
  return true;
}
function hook(){
  var s = store();
  /* Start a new file with the suite's Nassau planning ZIP and local lookup. */
  if(s&&!document.documentElement.dataset.v50ZipStarted){
    document.documentElement.dataset.v50ZipStarted='1';
    try{if(!norm(s.activeInputs.zipCode)){s.setField('zipCode','11530','Release 50 default ZIP');s.applyZipLookup();}}catch(e){}
  }
  if (s && !subscribed && s.subscribe){ subscribed = true; try { s.subscribe(function(){ persistWorkspace(); setTimeout(function(){ soon(false); }, 30); }); } catch(e){} }
  wireWorkspacePersistence();
  installIncomeHandoff();
  installPopupDismissal();
  installUniversalMenu();
  deferSuiteInputCommit();
  wireFileToSetup();
  installFileSetupDelegation();
  /* The primary workspace strip is mounted by a retained legacy layer and
     can appear after this first hook on a cold load. Retry only the small
     File-to-Setup binding so File is consistently the setup entry point
     without adding a continuous listener or repaint loop. */
  [420,1300,2600].forEach(function(ms){ setTimeout(wireFileToSetup,ms); });
  pinSuiteEntry();
  setTimeout(persistWorkspace,0);
  syncCalculatorIncome(false);
  document.addEventListener('click', function(e){ if (e.target.closest('#suite-root .tab, #v23SuitePrimaryNav button')) setTimeout(function(){ soon(true); }, 40); }, true);
}
if (window.LOS_SCHEDULER && LOS_SCHEDULER.add) LOS_SCHEDULER.add(tick, 1000); else setInterval(tick, 1000);
/* V35 repaints quote controls every 800ms. Keep the display layer last so
   fractional percentages never flash as binary floating-point artifacts.
   This is presentation only, so a gentler cadence avoids needless layout
   reads while an input is not active. */
setInterval(function(){ if(!document.hidden) paintFreeformValues(); }, 600);
document.addEventListener('visibilitychange',function(){ if(!document.hidden){ refreshLive(); scheduleDecor(0,true); } },false);
setTimeout(function(){ hook(); tick(); }, 260);
setTimeout(tick, 1200);
})();
