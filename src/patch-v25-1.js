/* v25.1 - Income-calculator-aligned loan header and editable full-file view. */
(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
var $$=function(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));};
var V=window.V251={version:'25.1',fullActive:false};
var THEMES=[['ledger','Navy'],['slate','Slate'],['bank','Bank'],['graphite','Graphite'],['terminal','Terminal']];
var SURFACES=[['light','Light'],['dark','Dark'],['oled','Black OLED']];
var INPUTS=[['paper','Paper'],['mist','Mist'],['mint','Mint'],['sand','Sand'],['ink','Ink']];
var PAGE_GROUPS=[
  {key:'file',label:'File',icon:'file',pages:['QUOTE','SETUP','PROPERTY']},
  {key:'loan',label:'Loan',icon:'home',pages:['RENOVATION','MAX MORTGAGE','MORTGAGE RATES']},
  {key:'costs',label:'Costs',icon:'coins',pages:['CLOSING','ESCROW']},
  {key:'underwriting',label:'Underwriting',icon:'check',pages:['QUALIFY','RENTAL','ADVANCED']},
  {key:'results',label:'Results',icon:'chart',pages:['SCENARIOS','SUMMARY','DOCUMENTS & OCR']}
];
function store(){try{return window.mortgageSuite&&mortgageSuite.store;}catch(e){return null;}}
function app(){try{return window.mortgageSuite&&mortgageSuite.app;}catch(e){return null;}}
function safeSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function safeGet(k,d){try{var v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}}
function esc(v){return String(v==null?'':v).replace(/[&<>\"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}
function N(v){var n=parseFloat(String(v==null?'':v).replace(/[$,%\s,]/g,''));return isFinite(n)?n:0;}
function money(v){var n=N(v);return(n<0?'-':'')+'$'+Math.abs(n).toLocaleString('en-US',{maximumFractionDigits:0});}
function pct(v){var n=N(v);if(Math.abs(n)<=1)n*=100;return n.toFixed(2).replace(/\.00$/,'')+'%';}
function icon(kind){return'<span class="v23-nav-icon i-'+kind+'" aria-hidden="true"><i></i></span>';}

function headerStat(key,label,target,kind){
  var b=document.createElement('button');b.type='button';b.dataset.v251Stat=key;b.dataset.v251Target=target;
  b.innerHTML='<span>'+esc(label)+'</span><b>—</b>';b.onclick=function(){V.openSource(target);};
  b.dataset.v251Kind=kind||'money';return b;
}
function buildHeader(){
  var main=$('v25HeaderMain'),actions=$('v25HeaderActions');if(!main||!actions)return;
  var brand=$('v251SuiteBrand');
  if(!brand){
    brand=document.createElement('div');brand.id='v251SuiteBrand';brand.className='v251-suite-brand';
    var mark=main.querySelector(':scope > .mark'),title=main.querySelector(':scope > h1'),program=main.querySelector(':scope > .prog');
    [mark,title,program].forEach(function(node){if(node)brand.appendChild(node);});main.insertBefore(brand,main.firstChild);
  }
  var scenario=$('v24ScenarioBar');if(scenario&&scenario.parentNode!==main)main.appendChild(scenario);
  var dates=$$('.datefield',main);dates.forEach(function(d){d.classList.add('v251-datefield');});
  var spacer=main.querySelector(':scope > .spacer');if(spacer)spacer.classList.add('v251-retired-spacer');
  var stats=$('v251HeaderStats');
  if(!stats){
    stats=document.createElement('div');stats.id='v251HeaderStats';stats.className='v251-header-stats';
    stats.appendChild(headerStat('loan','Total loan','maxmortgage'));
    stats.appendChild(headerStat('payment','Payment','qualify'));
    stats.appendChild(headerStat('cash','Cash to close','closing'));
    stats.appendChild(headerStat('dti','Back DTI','advanced','percent'));
    actions.insertBefore(stats,actions.firstChild);
  }
  ['v23QuickSave','v23SuiteActions','v24LoanTools','v24LiveSummary','v25FullForm'].forEach(function(id){var node=$(id);if(node&&!node.classList.contains('v35-stowed'))actions.appendChild(node);});
  var live=$('v24LiveSummary'),full=$('v25FullForm');
  if(live&&!window.V35){live.innerHTML=icon('chart')+'<span>Live summary</span>';live.onclick=V.toggleSummary;live.setAttribute('aria-controls','suite-root');}
  if(full&&!window.V35){full.innerHTML=icon('full')+'<span>Full form</span>';full.onclick=V.openFull;}
  var rail=document.querySelector('#suite-root .cols-main>.rail'),close=$('v251SummaryClose');
  if(rail&&!close){close=document.createElement('button');close.id='v251SummaryClose';close.type='button';close.className='v251-summary-close no-print';close.textContent='Close live summary';close.onclick=V.toggleSummary;rail.insertBefore(close,rail.firstChild);}
  updateHeader();
}
function updateHeader(){
  var s=store(),stats=$('v251HeaderStats');if(!s||!stats)return;var o=s.outputs||{},aus=o.aus||{},pay=o.payment||{},cash=o.cash||{},loan=o.loan||{};
  var values={loan:money(loan.totalLoan),payment:money(pay.totalMonthlyPayment),cash:money(cash.cashToClose),dti:pct(aus.backEndDti)};
  Object.keys(values).forEach(function(k){var b=stats.querySelector('[data-v251-stat="'+k+'"] b');if(b)b.textContent=values[k];});
  var live=$('v24LiveSummary'),open=$('suite-root')&&$('suite-root').classList.contains('v24-summary-open');if(live){live.classList.toggle('active',!!open);live.setAttribute('aria-pressed',open?'true':'false');}
}
V.toggleSummary=function(){
  var root=$('suite-root');if(!root)return;var open=!root.classList.contains('v24-summary-open');root.classList.toggle('v24-summary-open',open);safeSet('los.v24.summaryOpen',open?'1':'0');updateHeader();
};

function screens(){try{return window.__amdGet&&window.__amdGet('src/ui/sections');}catch(e){return null;}}
function fullNav(screensList){
  var nav=document.createElement('nav');nav.className='v251-full-index no-print';nav.setAttribute('aria-label','Full form sections');
  screensList.forEach(function(screen){var b=document.createElement('button');b.type='button';b.textContent=screen.label;b.onclick=function(){var target=$('v251Screen-'+screen.id);if(target)target.scrollIntoView({behavior:'smooth',block:'start'});};nav.appendChild(b);});return nav;
}
function fullHeader(s){
  var h=document.createElement('header');h.className='v251-full-head';var i=s.activeInputs||{};
  h.innerHTML='<div><span>Editable full file</span><h2>'+esc(i.borrowerName||i.name||'Unnamed scenario')+'</h2><p>Every Loan Suite section is available below. Typed currency, percentages, dates, commas, k and m shorthand remain freeform.</p></div><div><b>'+esc(s.outputs&&s.outputs.programLabel||i.loanProgram||'Loan')+'</b><small>Changes recalculate and autosave immediately</small></div>';return h;
}
var EXTRA_FULL={
  property:{id:'property',label:'PROPERTY',page:'PROPERTY',panel:'panel-property',render:function(){if(window.LOANSUITE&&LOANSUITE.PROP)LOANSUITE.PROP.render();}},
  rates:{id:'rates',label:'MORTGAGE RATES',page:'MORTGAGE RATES',panel:'panel-rates',render:function(){if(window.RATES)RATES.render();}},
  documents:{id:'documents',label:'DOCUMENTS & OCR',page:'DOCUMENTS & OCR',panel:'panel-docparse',render:function(){if(window.DOCP)DOCP.render();}}
};
function restoreLegacyPanels(){
  ['panel-property','panel-rates','panel-docparse'].forEach(function(id){var panel=$(id),placeholder=panel&&panel.__v251Placeholder;if(!panel||!placeholder||!placeholder.parentNode)return;placeholder.parentNode.insertBefore(panel,placeholder);placeholder.parentNode.removeChild(placeholder);panel.__v251Placeholder=null;panel.classList.remove('v251-legacy-panel');panel.style.removeProperty('display');});
}
function mountLegacyPanel(screen,section){
  try{screen.render();}catch(e){}var panel=$(screen.panel);if(!panel)return;
  if(!panel.__v251Placeholder&&panel.parentNode){var placeholder=document.createComment('v25.1 '+screen.id+' panel');panel.parentNode.insertBefore(placeholder,panel);panel.__v251Placeholder=placeholder;}
  panel.classList.add('v251-legacy-panel');panel.style.setProperty('display','block','important');section.appendChild(panel);
}
function quoteCard(s){var i=s.activeInputs||{},o=s.outputs||{},loan=o.loan||{},pay=o.payment||{},cash=o.cash||{};var card=document.createElement('div');card.className='card v251-quote-card';card.innerHTML='<div class="body"><div><span>Purchase price</span><b>'+money(i.basePurchasePrice)+'</b></div><div><span>Total loan</span><b>'+money(loan.totalLoan)+'</b></div><div><span>Interest rate</span><b>'+pct(i.interestRate)+'</b></div><div><span>Total payment</span><b>'+money(pay.totalMonthlyPayment)+'</b></div><div><span>Closing costs</span><b>'+money(o.closing&&o.closing.buyerClosingCosts)+'</b></div><div><span>Cash to close</span><b>'+money(cash.cashToClose)+'</b></div></div>';return card;}
function fullScreens(mod){
  var base={};(mod.SCREENS||[]).forEach(function(screen){base[screen.id]=screen;});
  return [{id:'quote',label:'QUOTE',virtual:'quote'},base.setup,EXTRA_FULL.property,base.renovation,base.maxmortgage,EXTRA_FULL.rates,base.closing,base.escrow,base.qualify,base.rental,base.advanced,base.scenarios,base.summary,EXTRA_FULL.documents].filter(Boolean);
}
function buildEditableFull(){
  var s=store(),a=app(),mod=screens(),body=$('screen-body');if(!s||!a||!mod||!body)return false;
  restoreLegacyPanels();a.refreshers=a.refreshers.slice(0,a.railCount||a.shellCount);while(body.firstChild)body.removeChild(body.firstChild);
  var list=fullScreens(mod);
  var sheet=document.createElement('section');sheet.id='v25FullSheet';sheet.className='v25-full-sheet v251-editable-full';sheet.appendChild(fullHeader(s));sheet.appendChild(fullNav(list));
  list.forEach(function(screen){
    var section=document.createElement('section');section.id='v251Screen-'+screen.id;section.className='v251-full-screen';section.dataset.v251Screen=screen.id;
    var head=document.createElement('header'),focused=screen.page?' data-v251-page="'+esc(screen.page)+'"':' data-v251-open="'+esc(screen.id)+'"';head.className='v251-screen-head';head.innerHTML='<div><span>'+esc(screen.label)+'</span><p>'+esc(screen.blurb||(screen.virtual?'Live scenario outcome; its editable source fields follow below.':'Live loan-file controls and results.'))+'</p></div><button type="button"'+focused+'>Open focused tab</button>';section.appendChild(head);
    if(screen.panel)mountLegacyPanel(screen,section);else{var grid=document.createElement('div');grid.className='v251-screen-grid';if(screen.virtual)grid.appendChild(quoteCard(s));else{(screen.columns||[]).forEach(function(column){(column||[]).forEach(function(card){grid.appendChild(a.renderCard(card));});});(screen.bottom||[]).forEach(function(card){grid.appendChild(a.renderCard(card));});}section.appendChild(grid);}sheet.appendChild(section);
  });
  body.appendChild(sheet);a.renderedMode=s.snapshot.mode;a.refresh();
  $$('[data-v251-open]',sheet).forEach(function(b){b.onclick=function(){V.openSource(b.dataset.v251Open);};});
  $$('[data-v251-page]',sheet).forEach(function(b){b.onclick=function(){V.openPage(b.dataset.v251Page);};});
  if(window.V19)V19.enhanceFreeform(sheet);return true;
}
function paintFullNav(){var nav=$('v23SuitePrimaryNav');if(!nav)return;$$('button[data-group]',nav).forEach(function(b){var on=V.fullActive&&b.dataset.group==='full';b.classList.toggle('active',on);b.setAttribute('aria-current',on?'page':'false');});}
V.openFull=function(){
  var root=$('suite-root');if(!root)return;V.fullActive=true;if(window.V25)V25.fullActive=false;root.classList.add('v25-full-active','v251-full-active');if(buildEditableFull()){paintFullNav();window.scrollTo({top:0,behavior:'smooth'});}
};
V.openSource=function(mode){
  var s=store(),a=app(),root=$('suite-root');V.fullActive=false;if(window.V25)V25.fullActive=false;if(root)root.classList.remove('v25-full-active','v251-full-active');
  restoreLegacyPanels();if(!s||!a)return;if(s.snapshot.mode===mode)a.renderScreen();else s.setMode(mode);window.scrollTo({top:0,behavior:'smooth'});
};
function bindFull(){
  var nav=$('v23SuitePrimaryNav'),full=nav&&nav.querySelector('[data-group="full"]'),top=$('v25FullForm');if(full)full.onclick=V.openFull;if(top)top.onclick=V.openFull;
  if(nav&&!nav.dataset.v251Bound){nav.dataset.v251Bound='1';nav.addEventListener('click',function(e){var b=e.target.closest('button[data-group]');if(b&&b.dataset.group!=='full'&&V.fullActive){V.openSource(store().snapshot.mode);}},true);}
  var tabs=document.querySelector('#suite-root .tabs');if(tabs&&!tabs.dataset.v251Bound){tabs.dataset.v251Bound='1';tabs.addEventListener('click',function(e){if(e.target.closest('.tab')&&V.fullActive)V.openSource(store().snapshot.mode);},true);}
}
function pageKey(value){return String(value||'').trim().replace(/\s+/g,' ').toUpperCase();}
function pageTab(label){var key=pageKey(label);return $$('#suite-root .tabs .tab').filter(function(tab){return pageKey(tab.dataset.v23Key||tab.textContent)===key;})[0]||null;}
function pageGroup(label){var key=pageKey(label);return PAGE_GROUPS.filter(function(group){return group.pages.indexOf(key)>=0;})[0]||PAGE_GROUPS[0];}
function keepRenovationAvailable(){
  var mod=screens();if(!mod||!mod.SCREENS)return;
  var renovation=mod.SCREENS.filter(function(screen){return screen.id==='renovation';})[0];if(!renovation)return;
  renovation.visible=null;
  (renovation.columns||[]).forEach(function(column){(column||[]).forEach(function(card){if(card&&card.id==='renovation')card.visible=null;});});
}
function organizePageTabs(){
  var tabs=$$('#suite-root .tabs .tab');if(!tabs.length)return;
  tabs.forEach(function(tab){var key=pageKey(tab.textContent);tab.dataset.v23Key=key;tab.setAttribute('aria-label',key.replace('& OCR','and OCR'));});
  var nav=$('v23SuitePrimaryNav'),active=nav&&nav.querySelector('button[data-group].active'),group=PAGE_GROUPS.filter(function(item){return item.key===(active&&active.dataset.group||'file');})[0]||PAGE_GROUPS[0];
  tabs.forEach(function(tab){tab.dataset.v23Visible=group.pages.indexOf(pageKey(tab.dataset.v23Key))>=0?'1':'0';});
}
V.closePageDirectory=function(){var directory=$('v251PageDirectory');if(directory)directory.classList.remove('open');};
V.openPage=function(label){
  if(V.fullActive){V.fullActive=false;if($('suite-root'))$('suite-root').classList.remove('v25-full-active','v251-full-active');restoreLegacyPanels();}
  V.closePageDirectory();$$('.v23-action-menu[open],.v23-sync-menu[open]').forEach(function(menu){menu.open=false;});
  var group=pageGroup(label),groupButton=document.querySelector('#v23SuitePrimaryNav button[data-group="'+group.key+'"]');if(groupButton)groupButton.click();
  setTimeout(function(){organizePageTabs();var tab=pageTab(label);if(tab){tab.dataset.v23Visible='1';tab.click();window.scrollTo({top:0,behavior:'smooth'});}},20);
};
function pageDirectoryMarkup(){return '<div class="v251-page-backdrop" onclick="V251.closePageDirectory()"></div><section role="dialog" aria-modal="true" aria-labelledby="v251PageDirectoryTitle"><header><div><b id="v251PageDirectoryTitle">All Loan Suite pages</b><small>Every original and added workspace, organized by workflow</small></div><button type="button" onclick="V251.closePageDirectory()">Close</button></header><div class="v251-page-groups">'+PAGE_GROUPS.map(function(group){return '<section><h3>'+icon(group.icon)+esc(group.label)+'</h3><div>'+group.pages.map(function(page){return '<button type="button" data-v251-page="'+esc(page)+'"><span>'+esc(page.replace('DOCUMENTS & OCR','DOCUMENTS AND OCR'))+'</span><i aria-hidden="true">&rarr;</i></button>';}).join('')+'</div></section>';}).join('')+'</div></section>';}
function installPageDirectory(){
  var tools=$('v24LoanTools'),grid=tools&&tools.querySelector('.v23-actions-grid');if(!grid)return;
  var button=$('v251PageDirectoryButton');if(!button){button=document.createElement('button');button.id='v251PageDirectoryButton';button.type='button';button.className='v23-action v251-page-directory-button';button.dataset.v25Decorated='1';button.innerHTML=icon('full')+'<span class="v25-action-copy"><b>All pages</b><small>Open the complete workspace directory</small></span>';button.onclick=function(){tools.open=false;var directory=$('v251PageDirectory');if(directory)directory.classList.add('open');};grid.insertBefore(button,grid.firstChild);}
  var directory=$('v251PageDirectory');if(!directory){directory=document.createElement('div');directory.id='v251PageDirectory';directory.className='v251-page-directory no-print';directory.innerHTML=pageDirectoryMarkup();document.body.appendChild(directory);$$('[data-v251-page]',directory).forEach(function(item){item.onclick=function(){V.openPage(item.dataset.v251Page);};});}
}
function simplifyMenus(){
  [['v23SuiteActions','File actions'],['v24LoanTools','Loan tools'],['v23CalcActions','Income file actions']].forEach(function(pair){
    var details=$(pair[0]);if(!details)return;details.classList.add('v251-simple-menu');var panel=details.querySelector('.v23-actions-panel');if(panel)panel.setAttribute('aria-label',pair[1]);
  });
}
function appearanceButtons(title,items,handler,current){return'<div class="v251-appearance-group"><span>'+title+'</span><div>'+items.map(function(item){return'<button type="button" data-value="'+item[0]+'" class="'+(current===item[0]?'selected':'')+'"><i data-swatch="'+item[0]+'"></i>'+item[1]+'</button>';}).join('')+'</div></div>';}
function paintAppearanceMenu(){
  var panel=$('v251AppearancePanel');if(!panel)return;var theme=document.documentElement.dataset.v24Theme||'terminal',surface=document.documentElement.dataset.v25Surface||'oled',tone=document.documentElement.dataset.inputTone||'paper';
  panel.innerHTML='<header><div><b>Appearance</b><small>Theme, surface and field color</small></div><kbd>Esc</kbd></header>'+appearanceButtons('Color theme',THEMES,'theme',theme)+appearanceButtons('Surface',SURFACES,'surface',surface)+appearanceButtons('Input fields',INPUTS,'input',tone);
  $$('.v251-appearance-group',panel).forEach(function(group,idx){$$('button',group).forEach(function(button){button.onclick=function(e){e.stopPropagation();var value=button.dataset.value;if(idx===0&&window.V24)V24.setTheme(value);if(idx===1&&window.V25)V25.setSurface(value);if(idx===2&&window.V24)V24.setInput(value);paintAppearanceMenu();};});});
}
function installAppearanceMenu(){
  var wrap=$('v23Appearance'),button=$('v23ThemeButton');if(!wrap||!button)return;
  if(safeGet('los.v251.appearanceSeeded','')!=='1'){safeSet('los.v251.appearanceSeeded','1');if(window.V24){V24.setTheme('terminal',true);V24.setInput('paper');}if(window.V25)V25.setSurface('oled');}
  var surface=$('v25SurfaceButton'),input=$('v23InputButton');[surface,input].forEach(function(node){if(node){node.classList.add('v251-retired-appearance');node.setAttribute('aria-hidden','true');node.tabIndex=-1;}});
  function setOpen(open){wrap.classList.toggle('open',open);button.setAttribute('aria-expanded',open?'true':'false');if(open){button.style.setProperty('background','#fff','important');button.style.setProperty('color','#0A1422','important');}else{button.style.removeProperty('background');button.style.removeProperty('color');}}
  wrap.classList.add('v251-appearance-menu');button.onclick=function(e){e.stopPropagation();setOpen(!wrap.classList.contains('open'));paintAppearanceMenu();};button.setAttribute('aria-haspopup','true');button.title='Appearance options';button.setAttribute('aria-label','Appearance options');
  var panel=$('v251AppearancePanel');if(!panel){panel=document.createElement('div');panel.id='v251AppearancePanel';panel.className='v251-appearance-panel';wrap.appendChild(panel);}paintAppearanceMenu();
  if(!V.appearanceBound){V.appearanceBound=true;document.addEventListener('click',function(e){if(!e.target.closest('#v23Appearance'))setOpen(false);});document.addEventListener('keydown',function(e){if(e.key==='Escape')setOpen(false);});}
}
function separateNavBands(){var nav=$('v23SuitePrimaryNav'),tabs=document.querySelector('#suite-root .tabs'),chrome=tabs&&tabs.parentNode;if(nav&&tabs&&chrome&&nav.parentNode!==chrome)chrome.insertBefore(nav,tabs);}
function enhanceDate(el){
  if(!el||el.type!=='date'||el.__v251Date||!window.V15)return;el.__v251Date=true;
  var inputHandler=el.oninput,changeHandler=el.onchange,inputInline=el.getAttribute('oninput')||'',changeInline=el.getAttribute('onchange')||'',iso=V15.parseDate(el.value)||'';
  el.dataset.v251Iso=iso;el.type='text';el.placeholder='MM/DD/YYYY';el.autocomplete='off';el.value=V15.prettyDate(iso);el.removeAttribute('oninput');el.removeAttribute('onchange');el.oninput=null;el.onchange=null;
  el.addEventListener('blur',function(){var parsed=V15.parseDate(el.value);if(!parsed&&el.value.trim()){el.classList.add('v15-date-bad');el.value=V15.prettyDate(el.dataset.v251Iso);setTimeout(function(){el.classList.remove('v15-date-bad');},850);return;}el.dataset.v251Iso=parsed;el.value=parsed;try{if(inputHandler)inputHandler.call(el,new Event('input',{bubbles:false}));else if(changeHandler)changeHandler.call(el,new Event('change',{bubbles:false}));else if(inputInline)Function(inputInline).call(el);else if(changeInline)Function(changeInline).call(el);}catch(e){}el.value=V15.prettyDate(parsed);});
  el.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();el.blur();}if(e.key==='Escape'){el.value=V15.prettyDate(el.dataset.v251Iso);el.blur();}});
}
function enhanceDates(root){if(root&&root.matches&&root.matches('input[type="date"]'))enhanceDate(root);$$('input[type="date"]',root||document).forEach(enhanceDate);}
function observeFreeform(){
  if(V.observer||!window.MutationObserver)return;V.observer=new MutationObserver(function(records){records.forEach(function(record){Array.prototype.forEach.call(record.addedNodes||[],function(node){if(node.nodeType===1){if(window.V19)V19.enhanceFreeform(node);enhanceDates(node);}});});});V.observer.observe(document.body,{childList:true,subtree:true});
}
function boot(){try{var release=parseFloat(document.documentElement.dataset.losRelease||'0');if(!isFinite(release)||release<25.1)document.documentElement.dataset.losRelease='25.1';keepRenovationAvailable();installAppearanceMenu();buildHeader();bindFull();installPageDirectory();simplifyMenus();separateNavBands();organizePageTabs();observeFreeform();if(window.V19)V19.enhanceFreeform(document);enhanceDates(document);if(V.fullActive&&!$('v25FullSheet'))buildEditableFull();updateHeader();}catch(e){if(console&&console.warn)console.warn('v25.1 enhancement',e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();if(window.LOS_SCHEDULER)LOS_SCHEDULER.add(boot,900);else setInterval(boot,900);
})();
