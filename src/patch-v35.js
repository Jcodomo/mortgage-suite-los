/* =====================================================================
   v35 — every action behind one button.

   The flicker across releases 32-34 was never one bug. Four layers each
   believed they owned the action row: 28 ordered it, 32 relabelled and
   re-ordered it, 33 re-banded it on resize, 34 moved three of its
   children into a new bar. Any two of those disagreeing for one frame
   is a visible jump, and the screenshots caught three different orders.

   Rather than keep arbitrating, the row stops existing as a row. Every
   control is collected behind a single menu. The originals stay in the
   DOM, hidden, and every menu entry clicks the real one — so nothing
   loses its wiring, and there is nothing left on screen for the other
   layers to reorder.
   ===================================================================== */
(function(){
"use strict";
var $  = function(id){ return document.getElementById(id); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function norm(s){ return String(s||'').replace(/\s+/g,' ').trim(); }
function key(s){ return norm(s).toUpperCase(); }
function actionKey(s){
  var k=key(s).replace(/&/g,'AND');
  if (/^(LIVE COMPARE|LIVE COMPARISON|COMPARE)$/.test(k)) return 'LIVE COMPARISON';
  if (/^DOCUMENTS? (AND|&) OCR$/.test(k)) return 'DOCUMENTS OCR';
  if (/^(PANDL|PROFIT AND LOSS)$/.test(k)) return 'PROFIT LOSS';
  if (/^(RENO|RENOVATION) FEES?$/.test(k)) return 'RENOVATION FEES';
  return k;
}
function actionGroup(label,fallback){var k=key(label);if(/COMPARE|COMPARISON/.test(k))return'Compare';if(/DOCUMENT|OCR|PRINT|PDF|PAY STATEMENT|PROFIT|P&L|LEASE|ADDENDUM|CONTRACTOR|DRAFT LE|ITEMIZED FEE/.test(k))return'Documents';if(/FULL FORM|ALL PAGES|EXPAND|COLLAPSE|SUMMARY/.test(k))return'View';if(/PMI|MIP|RENOVATION FEE|RENO FEE|CREDIT|RECALCULATE|THEME|RATE/.test(k))return'Loan tools';if(/SAVE|IMPORT|EXPORT|NEW|RESET|DUPLICATE|CLEAR|RESTORE|CSV|COPY BORROWER/.test(k))return'File';return fallback;}
var V35 = window.V35 = { version:'35.0', open:false };

/* The controls being collected, in the order they should read. Anything
   found that is not on this list still appears, under "More", so a
   feature added by a later layer cannot go missing. */
var ITEMS = [
  { id:'v23QuickSave',   label:'Save',             group:'File',      primary:true },
  { id:'v30PrintGen',    label:'Print / Generate', group:'Documents', primary:true },
  { id:'v24LiveSummary', label:'Live summary',     group:'View', action:'summary' },
  { id:'v25FullForm',    label:'Full form',        group:'View' }
];
/* The two <details> menus are unpacked rather than nested — a menu
   inside a menu is where people lose things. */
var MENUS = [
  { id:'v23SuiteActions', group:'File actions' },
  { id:'v24LoanTools',    group:'Loan tools' }
];

function collect(){
  var out = [];
  ITEMS.forEach(function(it){
    var el = $(it.id); if (!el) return;
    out.push({ label: it.label, group: it.group, primary: it.primary, action:it.action, el: el });
  });
  MENUS.forEach(function(m){
    var host = $(m.id); if (!host) return;
    var grid = host.querySelector('.v23-actions-grid') || host;
    $$('button, a', grid).forEach(function(b){
      if (b.closest('summary')) return;                 /* the opener itself */
      if (b.closest('.v20-session')) return;            /* rendered once in the compact session rail */
      if (b.classList.contains('v26-dupe') || b.classList.contains('v23-superseded-action')) return;
      var title = b.querySelector('.v25-action-copy b, [data-v35-title], .label');
      var label = norm(title ? title.textContent : b.textContent).replace(/\s*\u25be\s*$/,'');
      if (!label || label.length > 46) return;
      out.push({ label: label, group: actionGroup(label,m.group), el: b });
    });
  });
  /* de-duplicate on label, keeping the first, so an entry that exists in
     both menus does not appear twice in the one list */
  var seen = {}, uniq = [];
  out.forEach(function(o){
    var k = actionKey(o.label); if (seen[k]) return; seen[k] = true; uniq.push(o);
  });
  return uniq;
}

V35.run = function(i){
  var item = V35.__items && V35.__items[i], el = item && item.el;
  V35.close();
  if (!el) return;
  if (item.action === 'summary') return V35.focusSummary();
  /* let the panel finish closing before the target opens its own modal */
  setTimeout(function(){ try { el.click(); } catch(e){} }, 40);
};
V35.focusSummary = function(){
  var root=$('suite-root'),rail=root&&root.querySelector('.rail');if(!root||!rail)return;
  root.classList.add('v24-summary-open');if(window.V31&&V31.apply)V31.apply();
  rail.classList.remove('v35-summary-pulse');void rail.offsetWidth;rail.classList.add('v35-summary-pulse');
  try{rail.scrollIntoView({behavior:'smooth',block:'nearest'});}catch(e){}
  setTimeout(function(){rail.classList.remove('v35-summary-pulse');},700);
};
V35.toggle = function(){ V35.open ? V35.close() : V35.show(); };
V35.go = function(mode){ var s=window.mortgageSuite&&mortgageSuite.store;V35.close();V35.closeRailEditor();if(mode==='income'){if(window.SHELL&&SHELL.go)SHELL.go('calc');return;}if(!s)return;if(mode==='rates'&&window.V251&&V251.openPage)V251.openPage('MORTGAGE RATES');else s.setMode(mode);setTimeout(function(){var body=$('screen-body');if(body)body.scrollIntoView({behavior:'smooth',block:'start'});},80); };
V35.restoreSession = function(index){try{var list=window.LOS&&LOS.AUTO?LOS.AUTO.list().slice(0,3):[];if(list[index])LOS.AUTO.restore(index);}catch(e){}V35.close();};
V35.position = function(){
  var p=$('v35Panel'),b=$('v35Btn');if(!p||!b||!V35.open)return;if(innerWidth<=640){['left','right','top','bottom'].forEach(function(k){p.style.removeProperty(k);});return;}
  var r=b.getBoundingClientRect(),w=Math.min(520,innerWidth-24),left=Math.max(12,Math.min(innerWidth-w-12,r.right-w));
  p.style.left=left+'px';p.style.right='auto';p.style.top=Math.min(innerHeight-90,r.bottom+8)+'px';p.style.bottom='auto';
};
V35.show = function(){
  var p = $('v35Panel'); if (!p) return;
  V35.__items = collect();
  var groups = {};
  V35.__items.forEach(function(o,i){ (groups[o.group] = groups[o.group] || []).push({o:o,i:i}); });
  var order = ['File','View','Documents','Compare','File actions','Loan tools'];
  Object.keys(groups).forEach(function(g){ if (order.indexOf(g) < 0) order.push(g); });
  var sessions=[];try{sessions=window.LOS&&LOS.AUTO?LOS.AUTO.list().slice(0,3):[];}catch(e){}
  var sessionBar='<div class="v35-sessionbar"><label><span>Previous session</span><select id="v35SessionPick"'+(sessions.length?'':' disabled')+'><option value="">'+(sessions.length?'Choose one of the last 3':'No saved sessions yet')+'</option>'+sessions.map(function(x,i){var when='';try{when=new Date(x.ts).toLocaleString();}catch(e){}return'<option value="'+i+'">'+norm(x.name||'Scenario')+' - '+norm(when)+'</option>';}).join('')+'</select></label><button type="button" onclick="var p=document.getElementById(\'v35SessionPick\');if(p&&p.value!==\'\')V35.restoreSession(Number(p.value))"'+(sessions.length?'':' disabled')+'>Restore</button></div>';
  p.innerHTML = '<div class="v35-head"><div><b>File actions</b><small>Save, compare, generate, and open every loan tool</small></div><button type="button" onclick="V35.close()" aria-label="Close actions">Esc</button></div>'+sessionBar+'<div class="v35-scroll">' + order.filter(function(g){ return groups[g]; }).map(function(g){
    return '<div class="v35-grp">' + g + '</div><div class="v35-items">'
      + groups[g].map(function(x){
          return '<button type="button" class="v35-item' + (x.o.primary?' primary':'') + '" '
            + 'onclick="V35.run(' + x.i + ')"><span>' + norm(x.o.label) + '</span><i aria-hidden="true">&rarr;</i></button>';
        }).join('')
      + '</div>';
  }).join('') + '</div>';
  p.classList.add('on');
  V35.open = true;
  var b = $('v35Btn'); if (b) b.setAttribute('aria-expanded','true');
  V35.position();
};
V35.close = function(){
  var p = $('v35Panel'); if (p) p.classList.remove('on');
  V35.open = false;
  var b = $('v35Btn'); if (b) b.setAttribute('aria-expanded','false');
};

function install(){
  /* the button lives on the readings bar, which release 34 already owns
     and which nothing else reorders */
  var host = document.querySelector('#suite-root .v34-right')
          || $('v25HeaderActions');
  if (!host) return false;
  if (!$('v35Btn')){
    var b = document.createElement('button');
    b.id = 'v35Btn'; b.type = 'button'; b.className = 'v35-btn';
    b.setAttribute('aria-haspopup','true');
    b.setAttribute('aria-expanded','false');
    b.setAttribute('aria-controls','v35Panel');
    b.innerHTML = '<span class="v35-dots"></span><span>Actions</span>';
    b.title = 'Everything this file can do';
    b.onclick = function(e){ e.preventDefault(); e.stopPropagation(); V35.toggle(); };
    host.appendChild(b);
  }
  if (!$('v35Panel')){
    var p = document.createElement('div');
    p.id = 'v35Panel'; p.className = 'v35-panel no-print';
    p.setAttribute('role','dialog');p.setAttribute('aria-label','Loan Suite actions');
    p.addEventListener('click', function(e){ e.stopPropagation(); });
    document.body.appendChild(p);
  }
  var panel=$('v35Panel');if(panel&&panel.parentNode!==document.body)document.body.appendChild(panel);
  /* Deliberately no re-positioning here. The button is appended once on
     creation and left alone; release 34 now inserts its own nodes at the
     front of this half rather than the end, so the two cannot trade
     places. Two layers each trying to be last is precisely the loop this
     release exists to end. */
  return true;
}

/* Nothing is removed — the originals keep their wiring and their ids, so
   every earlier layer's delegation still resolves. They are only taken
   off screen, which is what stops the reordering being visible. */
function hideOriginals(){
  var ids = ITEMS.map(function(i){ return i.id; }).concat(MENUS.map(function(m){ return m.id; }));
  ids.forEach(function(id){
    var el = $(id); if (!el) return;
    if (!el.classList.contains('v35-stowed')) el.classList.add('v35-stowed');
  });
}

function store(){try{return window.mortgageSuite&&mortgageSuite.store;}catch(e){return null;}}
function esc(s){return String(s==null?'':s).replace(/[&<>\"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}
function num(v){var n=parseFloat(String(v==null?'':v).replace(/[$,%\s,]/g,''));return isFinite(n)?n:0;}
function money(v){var n=num(v);return(n<0?'-':'')+'$'+Math.abs(n).toLocaleString('en-US',{maximumFractionDigits:0});}
function percent(v,d){var n=num(v);if(Math.abs(n)<=1)n*=100;return n.toFixed(d==null?2:d).replace(/\.00$/,'')+'%';}
function pathGet(obj,path){return String(path).split('.').reduce(function(a,k){return a==null?undefined:a[k];},obj);}

/* Every reading in the right summary opens the same small decision surface:
   change the input that drives it here, or jump to the full workspace. The
   calculation engine remains the only writer of calculated outputs. */
function railSpec(label,modeHint){
  var t=norm(label).toLowerCase(),s=store(),o=s&&s.outputs||{},isFha=Boolean(o.isFha),spec={title:norm(label)||'Live summary detail',mode:modeHint||'advanced',fields:[]};
  function f(label,path,kind,help,options){spec.fields.push({label:label,path:path,kind:kind||'num',help:help||'',options:options||null});}
  if(/purchase price/.test(t)){spec.mode='setup';f('Purchase price','basePurchasePrice','num');}
  else if(/^program/.test(t)){spec.mode='setup';f('Loan program','loanProgram','select','', ['FHA','Conventional']);}
  else if(/^interest rate|principal & interest|payment range/.test(t)){spec.mode='rates';f('Interest rate %','interestRate','pct');f('Term (years)','termYears','num');}
  else if(/^renovation/.test(t)){spec.mode='renovation';f('Renovation included','renovation','select','',['true','false']);f('Renovation base cost','reno.baseCost','num');}
  else if(/after-repair|arv/.test(t)){spec.mode='maxmortgage';f('After-repair value','afterRepairValue','num');}
  else if(/required investment/.test(t)){spec.mode='setup';f('Down payment %','finalDownPaymentPct','pct');}
  else if(/maximum base loan/.test(t)){spec.mode='maxmortgage';f('After-repair value','afterRepairValue','num');f('Down payment %','finalDownPaymentPct','pct');}
  else if(/ufmip/.test(t)){spec.mode='maxmortgage';f('UFMIP rate %','ufmipRate','pct');}
  else if(/mortgage insurance|\bpmi\b|\bmip\b/.test(t)){spec.mode='qualify';f(isFha?'Annual FHA MIP rate %':'Annual PMI rate %',isFha?'fhaAnnualMipRate':'pmiOverrideRate','pct');}
  else if(/taxes & insurance|total payment/.test(t)){spec.mode='escrow';f('Annual property taxes','propertyTaxAmount','num');f('Annual homeowners insurance','insuranceAmount','num');}
  else if(/closing costs/.test(t)){spec.mode='closing';f('Title insurance override','closing.overrides.titleInsurance','num','Leave blank to keep the suite estimate.');f('Other buyer costs','closing.overrides.other','num');}
  else if(/seller credit/.test(t)){spec.mode='closing';f('Seller credit $','sellerConcessionAmount','num');}
  else if(/earnest money/.test(t)){spec.mode='closing';f('Earnest money deposit','closing.earnestMoneyDeposit','num');}
  else if(/cash to close/.test(t)){spec.mode='closing';f('Down payment %','finalDownPaymentPct','pct');f('Closing-cost cushion %','closing.cushionPct','pct');}
  else if(/total loan/.test(t)){spec.mode='maxmortgage';f('Purchase price','basePurchasePrice','num');f('Down payment %','finalDownPaymentPct','pct');}
  else if(/^dti|income needed|front \/ back|back-end/.test(t)){spec.mode='income';spec.note='Income and liabilities are maintained in the Income Calculator so both workspaces use the same underwriting figures.';}
  else if(/reserve/.test(t)){spec.mode='qualify';f('Liquid assets','assets.liquidAssets','num');f('Gift funds','assets.giftFunds','num');}
  else if(/blocking warning/.test(t)){spec.mode='advanced';spec.note='Open Advanced to review every warning and its source calculation.';}
  else if(modeHint==='maxmortgage'){f('After-repair value','afterRepairValue','num');}
  else if(modeHint==='closing'){f('Closing-cost cushion %','closing.cushionPct','pct');}
  else if(modeHint==='escrow'){f('Annual property taxes','propertyTaxAmount','num');f('Annual homeowners insurance','insuranceAmount','num');}
  return spec;
}
function railValue(field,inputs){
  var v=pathGet(inputs,field.path);if(field.kind==='pct'&&v!==''&&v!=null)return String(num(v)*100);if(field.kind==='select'&&field.path==='renovation')return String(Boolean(v));return v==null?'':String(v);
}
V35.closeRailEditor=function(){var p=$('v35RailEditor');if(p)p.remove();};
V35.openRailEditor=function(row,forcedLabel,forcedMode){
  var s=store();if(!s||!row)return;var label=forcedLabel||row.dataset.v35Label||row.dataset.out||((row.querySelector&&row.querySelector('.l,span,b'))||{}).textContent||norm(row.textContent),mode=forcedMode||row.dataset.v35Mode||'',spec=railSpec(label,mode),p=$('v35RailEditor');if(p)p.remove();
  p=document.createElement('aside');p.id='v35RailEditor';p.className='v35-rail-editor no-print';p.setAttribute('role','dialog');p.setAttribute('aria-label',spec.title+' options');
  var fields=spec.fields.map(function(x,index){var options=x.options?'<select data-v35-rail-path="'+esc(x.path)+'" data-kind="'+esc(x.kind)+'">'+x.options.map(function(v){var current=railValue(x,s.activeInputs),label=x.path==='renovation'?(v==='true'?'Yes':'No'):v;return'<option value="'+esc(v)+'"'+(String(current)===String(v)?' selected':'')+'>'+esc(label)+'</option>';}).join('')+'</select>':'<input type="text" inputmode="'+(x.kind==='pct'||x.kind==='num'?'decimal':'text')+'" autocomplete="off" data-v35-rail-path="'+esc(x.path)+'" data-kind="'+esc(x.kind)+'" value="'+esc(railValue(x,s.activeInputs))+'">';return'<label><span>'+esc(x.label)+'</span>'+options+(x.help?'<small>'+esc(x.help)+'</small>':'')+'</label>';}).join('');
  var valueNode=row.querySelector&&row.querySelector('.v,.value,b:last-child'),shown=valueNode?norm(valueNode.textContent):'';
  p.innerHTML='<header><div><small>Live summary</small><b>'+esc(spec.title)+'</b></div><button type="button" data-v35-rail-close aria-label="Close">×</button></header>'+(shown?'<div class="v35-rail-current"><span>Current result</span><b>'+esc(shown)+'</b></div>':'')+(spec.note?'<p>'+esc(spec.note)+'</p>':'')+(fields?'<div class="v35-rail-fields">'+fields+'</div>':'')+'<footer>'+(fields?'<button type="button" class="primary" data-v35-rail-apply>Apply change</button>':'')+'<button type="button" data-v35-rail-go>Open '+esc(spec.mode==='income'?'Income Calculator':spec.mode==='rates'?'Mortgage Rates':spec.mode==='maxmortgage'?'Max Mortgage':spec.mode==='escrow'?'Taxes & Escrow':spec.mode.charAt(0).toUpperCase()+spec.mode.slice(1))+'</button></footer>';
  document.body.appendChild(p);var r=row.getBoundingClientRect(),w=Math.min(390,innerWidth-24),left=Math.max(12,Math.min(innerWidth-w-12,r.left-w-12));if(left<12||r.left<420)left=Math.max(12,Math.min(innerWidth-w-12,r.right-w));p.style.width=w+'px';p.style.left=left+'px';p.style.top=Math.max(12,Math.min(innerHeight-p.offsetHeight-12,r.top))+'px';
  var close=p.querySelector('[data-v35-rail-close]'),go=p.querySelector('[data-v35-rail-go]'),apply=p.querySelector('[data-v35-rail-apply]');close.onclick=V35.closeRailEditor;go.onclick=function(){V35.go(spec.mode);};if(apply)apply.onclick=function(){
    $$('[data-v35-rail-path]',p).forEach(function(input){var path=input.dataset.v35RailPath,kind=input.dataset.kind,raw=input.value;if(kind==='select'&&path==='renovation')s.setField(path,raw==='true','Live summary edit');else if(window.V20&&V20.setScenario)V20.setScenario(path,raw,kind==='pct'?'pct':kind==='num'?'num':'text');else s.setField(path,raw,'Live summary edit');if(path==='propertyTaxAmount')s.setField('propertyTaxBasis','Annual','Live summary edit');if(path==='insuranceAmount')s.setField('insuranceBasis','Annual','Live summary edit');if(path==='sellerConcessionAmount')s.setField('concessionInputMode','dollar','Live summary edit');});V35.closeRailEditor();
  };if(window.V19)V19.enhanceFreeform(p);
};
function wireRail(){
  var rail=document.querySelector('#suite-root .cols-main>.rail');if(!rail||rail.dataset.v35Editor)return;rail.dataset.v35Editor='1';rail.addEventListener('click',function(e){var row=e.target.closest('.v35-live-row,.v35-live-block,.v35-live-warnings button,[data-out],[title="Open ARV inputs"]');if(!row||!rail.contains(row)||e.target.closest('.v24-explain-costs'))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();V35.openRailEditor(row);},true);
}

function nestedTabs(){
  var s=store(),tabs=document.querySelector('#suite-root .tabs');if(!s||!tabs)return;
  $$('.tab',tabs).forEach(function(tab){var label=norm(tab.dataset.v23Key||tab.textContent).toUpperCase();tab.classList.toggle('v35-nested-source',label==='MAX MORTGAGE'||label==='ESCROW'||label==='DOCUMENTS & OCR');});
  var mode=s.snapshot.mode,groups={renovation:[['renovation','Renovation'],['maxmortgage','Max mortgage']],maxmortgage:[['renovation','Renovation'],['maxmortgage','Max mortgage']],closing:[['closing','Closing costs'],['escrow','Taxes & escrow']],escrow:[['closing','Closing costs'],['escrow','Taxes & escrow']]};
  var items=groups[mode],body=$('screen-body'),old=$('v35LinkedSubnav');if(!items){if(old)old.remove();return;}if(!body)return;
  var sig=mode;if(old&&old.dataset.sig===sig)return;if(old)old.remove();var nav=document.createElement('nav');nav.id='v35LinkedSubnav';nav.dataset.sig=sig;nav.className='v35-linked-subtabs no-print';nav.setAttribute('aria-label',mode==='closing'||mode==='escrow'?'Closing workspaces':'Renovation workspaces');nav.innerHTML=items.map(function(x){return'<button type="button" class="'+(x[0]===mode?'active':'')+'" onclick="V35.go(\''+x[0]+'\')">'+x[1]+'</button>';}).join('');body.insertBefore(nav,body.firstChild);
}

function quoteControls(){
  var s=store(),body=$('screen-body');if(!s||s.snapshot.mode!=='quote'||!body)return;var card=body.querySelector('[data-section="quote"]'),old=$('v35QuoteControls');if(!card)return;var host=card.querySelector(':scope > .body')||card;if(!old){old=document.createElement('section');old.id='v35QuoteControls';old.className='v35-quote-controls no-print';old.innerHTML='<div class="v35-quote-title"><div><b>Quick quote inputs</b><small>Freeform values update the quote and every linked worksheet.</small></div><button type="button" onclick="mortgageSuite.store.applyZipLookup()">Fill from ZIP</button></div><div class="v35-quote-grid">'+[['Purchase price','basePurchasePrice','currency'],['ZIP code','zipCode','text'],['Down payment %','finalDownPaymentPct','percent'],['Loan amount override','bps.loanAmountOverride','currency']].map(function(x){return'<label><span>'+x[0]+'</span><input type="text" inputmode="'+(x[2]==='text'?'text':'decimal')+'" data-v35-quote="'+x[1]+'" data-kind="'+x[2]+'" autocomplete="off"></label>';}).join('')+'</div><p>The loan amount override is used for quote/pricing tools; the maximum mortgage and total loan remain the engine-calculated amounts.</p>';host.insertBefore(old,host.firstChild);$$('[data-v35-quote]',old).forEach(function(input){input.addEventListener('change',function(){var path=input.dataset.v35Quote,kind=input.dataset.kind,raw=input.value;if(window.V20&&V20.setScenario)V20.setScenario(path,raw,kind==='percent'?'pct':kind==='currency'?'num':'text');else s.setField(path,raw,'Quick quote');});});if(window.V19)V19.enhanceFreeform(old);}
  $$('[data-v35-quote]',old).forEach(function(input){if(document.activeElement===input)return;var v=pathGet(s.activeInputs,input.dataset.v35Quote);input.value=input.dataset.kind==='percent'&&v!==''&&v!=null?String(num(v)*100):(v==null?'':String(v));});
}

function liveDetails(){
  var s=store(),rail=document.querySelector('#suite-root .cols-main>.rail');if(!s||!rail)return;var i=s.activeInputs,o=s.outputs||{},a=o.aus||{},p=o.payment||{},c=o.closing||{},cash=o.cash||{},reno=o.renovationOut||{},warnings=(o.warnings||[]).filter(function(w){if(!o.renovationActive&&(w.code==='MISSING_APPRAISAL_VALUE'||w.code==='ARV_SHORTFALL'))return false;if(w.code==='MISSING_TAX_SOURCE'&&i.taxSourceType==='MLS / Zillow / Redfin Estimate')return false;return w.severity==='error'||w.severity==='warning'||w.level==='error'||w.level==='fail'||w.blocking;});
  var h=num(a.housingPayment||p.totalMonthlyPayment),debts=num(a.totalMonthlyLiabilities),fhaFront=h/.31,fhaBack=Math.max(fhaFront,(h+debts)/.43),convFront=h/.36,convBack=Math.max(convFront,(h+debts)/.50),sig=[o.programLabel,i.interestRate,reno.finalRenovationAmount,h,debts,warnings.map(function(w){return w.code;}).join('|')].join('|'),box=$('v35LiveDetails');if(box&&box.dataset.sig===sig)return;if(!box){box=document.createElement('section');box.id='v35LiveDetails';box.className='v35-live-details';rail.appendChild(box);}box.dataset.sig=sig;
  function row(label,value,mode,cls){return'<button type="button" class="v35-live-row '+(cls||'')+'" data-v35-label="'+esc(label)+'" data-v35-mode="'+esc(mode)+'"><span>'+label+'</span><b>'+value+'</b></button>';}
  box.innerHTML='<h3>Live planning</h3>'+row('Program',esc(o.programLabel||i.loanProgram||'Loan'),'setup')+row('Interest rate',percent(i.interestRate,3),'rates')+row('Renovation',o.renovationActive?money(reno.finalRenovationAmount):'Not included','renovation')+'<button type="button" class="v35-live-block" data-v35-label="Blocking warnings" data-v35-mode="advanced"><span>Blocking warnings</span><b class="'+(warnings.length?'bad':'pass')+'">'+warnings.length+'</b></button>'+(warnings.length?'<div class="v35-live-warnings">'+warnings.slice(0,4).map(function(w){var go=(w.goto&&w.goto.tab)||w.section||w.target||'advanced';return'<button type="button" data-v35-label="'+esc(w.title||'Review item')+'" data-v35-mode="'+esc(go)+'"><b>'+esc(w.title||'Review item')+'</b><small>'+esc(w.detail||'Open the related workspace to review.')+'</small></button>';}).join('')+'</div>':'')+'<h4>Income needed - live planning</h4><div class="v35-income-needed">'+row('FHA front / back',money(fhaFront)+' / '+money(fhaBack),'income')+row('Conventional front / back',money(convFront)+' / '+money(convBack),'income')+'</div><h4>Advanced snapshot</h4>'+row('Back-end DTI',a.totalQualifyingIncome>0?percent(a.backEndDti,1):'Enter income','income')+row('Cash to close range',money(cash.cashToCloseLow)+' - '+money(cash.cashToCloseHigh),'closing')+row('Payment range',money(p.paymentLow)+' - '+money(p.paymentHigh),'rates');
}

function borrowerRange(){
  var s=store(),body=$('screen-body');if(!s||s.snapshot.mode!=='advanced'||!body)return;var o=s.outputs||{},p=o.payment||{},c=o.closing||{},cash=o.cash||{},old=$('v35BorrowerRange'),sig=[p.paymentLow,p.paymentHigh,c.buyerClosingCostsLow,c.buyerClosingCostsHigh,cash.cashToCloseLow,cash.cashToCloseHigh].join('|');if(old&&old.dataset.sig===sig)return;if(old)old.remove();old=document.createElement('section');old.id='v35BorrowerRange';old.dataset.sig=sig;old.className='card v35-borrower-range';old.innerHTML='<h3>Borrower planning range</h3><div class="body"><p>Compact ranges for a borrower conversation; open the linked workspace before sending final figures.</p><div>'+[['Monthly payment',money(p.paymentLow)+' - '+money(p.paymentHigh),'qualify'],['Closing costs',money(c.buyerClosingCostsLow)+' - '+money(c.buyerClosingCostsHigh),'closing'],['Cash to close',money(cash.cashToCloseLow)+' - '+money(cash.cashToCloseHigh),'closing']].map(function(x){return'<button type="button" onclick="V35.go(\''+x[2]+'\')"><span>'+x[0]+'</span><b>'+x[1]+'</b></button>';}).join('')+'</div></div>';body.insertBefore(old,body.firstChild);
}

function enhanceAdvancedLinks(){var s=store();if(!s||s.snapshot.mode!=='advanced')return;$$('#screen-body [data-out],#screen-body .out').forEach(function(row){if(row.dataset.v35Linked||row.onclick)return;var text=norm(row.textContent).toLowerCase(),mode=/closing|cash to close/.test(text)?'closing':/payment/.test(text)?'qualify':/rate/.test(text)?'rates':/arv|value/.test(text)?'maxmortgage':/income|dti|reserve|risk|warning/.test(text)?'advanced':'';if(!mode)return;row.dataset.v35Linked=mode;row.tabIndex=0;row.setAttribute('role','button');row.addEventListener('click',function(){V35.go(mode);});row.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();V35.go(mode);}});});}

function seedLight(){try{if(localStorage.getItem('los.v35.appearanceSeeded')==='1')return;localStorage.setItem('los.v35.appearanceSeeded','1');if(window.V24){V24.setTheme('ledger',true);V24.setInput('paper');}if(window.V25)V25.setSurface('light');}catch(e){}}
function documentsNav(){var nav=$('v23SuitePrimaryNav'),docs=$('v28nav-documents'),full=nav&&nav.querySelector('[data-group="full"]');if(!nav||!docs||!full)return;docs.classList.remove('v28-direct');docs.classList.add('v35-documents-nav');docs.innerHTML='<span class="v23-nav-icon i-file" aria-hidden="true"><i></i></span><span>Documents</span>';docs.onclick=function(){V35.close();if(window.V251&&V251.openPage)V251.openPage('DOCUMENTS & OCR');else{var s=store();if(s)s.setMode('documents');}};if(docs.previousElementSibling!==full)nav.insertBefore(docs,full.nextSibling);}
function watchScreen(){var body=$('screen-body');if(!body||V35.__screenObserver)return;V35.__screenObserver=new MutationObserver(function(){if(V35.__enhanceQueued)return;V35.__enhanceQueued=true;setTimeout(function(){V35.__enhanceQueued=false;enhance();},20);});V35.__screenObserver.observe(body,{childList:true,subtree:false});}
function enhance(){seedLight();documentsNav();nestedTabs();quoteControls();liveDetails();wireRail();borrowerRange();enhanceAdvancedLinks();watchScreen();}

function markRelease(){var current=parseFloat(document.documentElement.dataset.losRelease||'0');if(!isFinite(current)||current<35)document.documentElement.dataset.losRelease='35';}

document.addEventListener('mousedown', function(e){
  if (!V35.open) return;
  if (e.target.closest('#v35Panel') || e.target.closest('#v35Btn')) return;
  V35.close();
});
document.addEventListener('keydown', function(e){ if (e.key === 'Escape'){V35.close();V35.closeRailEditor();} });
window.addEventListener('resize',V35.position,{passive:true});window.addEventListener('scroll',V35.position,{passive:true});

setInterval(function(){
  try { markRelease(); install(); hideOriginals(); enhance(); } catch(e){}
}, 800);
setTimeout(function(){ try { markRelease(); install(); hideOriginals(); enhance(); } catch(e){} }, 250);
})();
