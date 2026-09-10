/* v23 - web-ready information architecture, appearance controls and density pass. */
(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
var $$=function(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));};
var V=window.V23={version:'23.0'};
var SUITE_GROUPS=[
  {key:'file',label:'File',icon:'file',tabs:['SETUP','PROPERTY','QUOTE']},
  {key:'loan',label:'Loan',icon:'home',tabs:['RENOVATION','MAX MORTGAGE','MORTGAGE RATES']},
  {key:'costs',label:'Costs',icon:'coins',tabs:['CLOSING','ESCROW']},
  {key:'underwriting',label:'Underwriting',icon:'check',tabs:['QUALIFY','RENTAL','ADVANCED']},
  {key:'results',label:'Results',icon:'chart',tabs:['SCENARIOS','SUMMARY','DOCUMENTS & OCR']}
];
var CALC_GROUPS=[
  {key:'income',label:'Income',icon:'income',tabs:['w2','selfemp','sche','va','other']},
  {key:'qualification',label:'Qualification',icon:'check',tabs:['dti','aus','summary']},
  {key:'documents',label:'Documents',icon:'file',tabs:['docs']}
];
var THEMES=['ledger','slate','bank','graphite','terminal','federal','clay','violet','evergreen','steel'],THEME_LABEL={ledger:'Navy ledger',slate:'Slate and teal',bank:'Bank paper',graphite:'Graphite mono',terminal:'Midnight terminal',federal:'Federal blue',clay:'Clay and sand',violet:'Violet fintech',evergreen:'Evergreen ledger',steel:'Steel and amber'};
var INPUTS=['paper','mist','mint','sand','ink'],INPUT_LABEL={paper:'Paper fields',mist:'Mist fields',mint:'Mint fields',sand:'Sand fields',ink:'Ink fields'};
function norm(s){return String(s||'').trim().replace(/\s+/g,' ').toUpperCase();}
function safeGet(key,fallback){try{return localStorage.getItem(key)||fallback;}catch(e){return fallback;}}
function safeSet(key,value){try{localStorage.setItem(key,value);}catch(e){}}
function icon(name){return '<span class="v23-nav-icon i-'+name+'" aria-hidden="true"><i></i></span>';}
function makePrimary(id,groups,onPick){
  var nav=document.createElement('nav');nav.id=id;nav.className='v23-primary-nav no-print';nav.setAttribute('aria-label',id.indexOf('Calc')>=0?'Income workspace groups':'Loan workspace groups');
  groups.forEach(function(group){var b=document.createElement('button');b.type='button';b.dataset.group=group.key;b.innerHTML=icon(group.icon)+'<span>'+group.label+'</span>';b.setAttribute('aria-label',group.label+' workspace');b.onclick=function(){onPick(group,true);};nav.appendChild(b);});
  return nav;
}
function groupForTab(groups,key){for(var i=0;i<groups.length;i++)if(groups[i].tabs.indexOf(key)>=0)return groups[i];return groups[0];}
function selectGroup(nav,groups,group,tabs,clickDefault){
  if(!nav||!group)return;
  $$('button[data-group]',nav).forEach(function(b){var on=b.dataset.group===group.key;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'page':'false');});
  tabs.forEach(function(tab){var visible=group.tabs.indexOf(tab.dataset.v23Key)>=0;tab.dataset.v23Visible=visible?'1':'0';});
  if(clickDefault){var active=tabs.filter(function(t){return t.classList.contains('active')&&t.dataset.v23Visible==='1';})[0];if(!active){var target=tabs.filter(function(t){return t.dataset.v23Key===group.tabs[0];})[0];if(target)target.click();}}
}
function installSuiteNav(){
  var strip=document.querySelector('#suite-root .tabs');if(!strip)return false;
  var tabs=$$('.tab',strip);if(!tabs.length)return false;
  tabs.forEach(function(t){t.dataset.v23Key=norm(t.textContent);t.setAttribute('aria-label',norm(t.textContent).replace('& OCR','and OCR'));});
  var nav=$('v23SuitePrimaryNav');
  if(!nav){nav=makePrimary('v23SuitePrimaryNav',SUITE_GROUPS,function(group,clicked){safeSet('los.v23.suiteGroup',group.key);selectGroup(nav,SUITE_GROUPS,group,tabs,clicked);});strip.parentNode.insertBefore(nav,strip);strip.classList.add('v23-context-tabs');}
  var active=tabs.filter(function(t){return t.classList.contains('active');})[0],activeGroup=groupForTab(SUITE_GROUPS,active?active.dataset.v23Key:'SETUP');
  var saved=safeGet('los.v23.suiteGroup',activeGroup.key),group=SUITE_GROUPS.filter(function(g){return g.key===(active?activeGroup.key:saved);})[0]||activeGroup;
  selectGroup(nav,SUITE_GROUPS,group,tabs,false);return true;
}
function installCalcNav(){
  var strip=document.querySelector('#calc-root nav.tabbar');if(!strip)return false;
  var tabs=$$('.tab[data-tab]',strip);if(!tabs.length)return false;
  tabs.forEach(function(t){t.dataset.v23Key=t.dataset.tab;});
  var nav=$('v23CalcPrimaryNav');
  if(!nav){nav=makePrimary('v23CalcPrimaryNav',CALC_GROUPS,function(group,clicked){safeSet('los.v23.calcGroup',group.key);selectGroup(nav,CALC_GROUPS,group,tabs,clicked);});strip.parentNode.insertBefore(nav,strip);strip.classList.add('v23-context-tabs');}
  var active=tabs.filter(function(t){return t.classList.contains('active');})[0],activeGroup=groupForTab(CALC_GROUPS,active?active.dataset.v23Key:'w2');
  selectGroup(nav,CALC_GROUPS,activeGroup,tabs,false);return true;
}
function sourceButton(root,label){return $$('button',root).filter(function(b){return norm(b.textContent)===norm(label);})[0]||null;}
function closeDetails(details){if(details)details.open=false;}
function proxyButton(label,source,details,kind){if(!source)return null;var b=document.createElement('button');b.type='button';b.className='v23-action '+(kind||'');b.textContent=label;b.onclick=function(){source.click();closeDetails(details);};return b;}
function installSuiteActions(){
  var toolbar=document.querySelector('#suite-root .toolbar');if(!toolbar)return false;
  var details=$('v23SuiteActions');
  if(!details){
    details=document.createElement('details');details.id='v23SuiteActions';details.className='v23-action-menu no-print';details.innerHTML='<summary>'+icon('dots')+'<span>Actions</span></summary><div class="v23-actions-panel"><div class="v23-actions-grid"></div></div>';
    var quick=document.createElement('button');quick.id='v23QuickSave';quick.type='button';quick.className='btn primary v23-quick-save';quick.textContent='Save';quick.onclick=function(){var target=sourceButton(details,'Save a version')||sourceButton(details,'Save scenario');if(target)target.click();};
    toolbar.appendChild(quick);toolbar.appendChild(details);
  }
  var grid=details.querySelector('.v23-actions-grid');
  Array.prototype.slice.call(toolbar.children).forEach(function(node){
    if(node===details||node.id==='v23QuickSave'||/^(tlabel|f pick|f namebox|spacer)$/.test(node.className||''))return;
    if(node.id==='v9SuiteTheme'||node.id==='v14ThemeMenu'||(node.id==='v15ActionMenus'&&/Light \/ Dark/i.test(node.textContent||''))){node.classList.add('v23-retired-control');return;}
    node.classList.add('v23-action-source');grid.appendChild(node);
  });
  function add(id,label,fn,primary){if($(id))return;var b=document.createElement('button');b.id=id;b.type='button';b.className='v23-action'+(primary?' primary':'');b.textContent=label;b.onclick=function(){fn();closeDetails(details);};grid.insertBefore(b,grid.firstChild);}
  add('v23OpenDocs','Documents & OCR',function(){var tab=$$('#suite-root .tabs .tab').filter(function(t){return norm(t.textContent)==='DOCUMENTS & OCR';})[0];if(tab)tab.click();},true);
  add('v23LiveCompare','Live comparison',function(){if(window.V14)V14.open('v14CompareModal');if(window.V15)V15.renderCompare();});
  add('v23ImportScenario','Import scenario JSON',function(){if(window.V13)V13.pickScenario();});
  add('v23ExportScenario','Export scenario JSON',function(){if(window.V13)V13.exportScenario();});
  $$('button',grid).forEach(function(b){
    if(/^v23/.test(b.id||''))return;
    if(/^(EXPORT SCENARIO JSON|IMPORT SCENARIO JSON|COMPARE)$/.test(norm(b.textContent)))b.classList.add('v23-superseded-action');
  });
  return true;
}
function installCalcActions(){
  var bar=document.querySelector('#calc-root .toolbar-inner');if(!bar)return false;
  var details=$('v23CalcActions');
  if(!details){details=document.createElement('details');details.id='v23CalcActions';details.className='v23-action-menu no-print';details.innerHTML='<summary>'+icon('dots')+'<span>File actions</span></summary><div class="v23-actions-panel"><div class="v23-actions-grid"></div></div>';bar.appendChild(details);}
  var grid=details.querySelector('.v23-actions-grid');
  Array.prototype.slice.call(bar.children).forEach(function(node){if(node===details||node.classList.contains('spacer'))return;var txt=norm(node.textContent);if(txt==='INCOME REPORT')return;if(node.matches('button,.menu-wrap')){node.classList.add('v23-action-source');grid.appendChild(node);}});
  var top=document.querySelector('#calc-root .appbar .topbar');if(top){$$('button',top).forEach(function(b){if(/LOAN SUITE/.test(norm(b.textContent)))b.classList.add('v23-duplicate-route');});}
  return true;
}
function appearanceArt(kind){return kind==='theme'?'<span class="v23-palette-art" aria-hidden="true"><i></i><i></i><i></i></span>':'<span class="v23-input-art" aria-hidden="true"><i></i></span>';}
function paintAppearance(){
  var theme=document.documentElement.dataset.v24Theme||safeGet('los.v24.theme','terminal');if(THEMES.indexOf(theme)<0)theme='terminal';
  var tone=document.documentElement.dataset.inputTone||safeGet('los.v24.inputTone','ink');if(INPUTS.indexOf(tone)<0)tone='ink';document.documentElement.dataset.inputTone=tone;
  var tb=$('v23ThemeButton'),ib=$('v23InputButton');
  if(tb){var next=THEMES[(THEMES.indexOf(theme)+1)%THEMES.length];tb.dataset.value=theme;tb.title='Color theme: '+THEME_LABEL[theme]+'. Next: '+THEME_LABEL[next];tb.setAttribute('aria-label',tb.title);}
  if(ib){var nextTone=INPUTS[(INPUTS.indexOf(tone)+1)%INPUTS.length];ib.dataset.value=tone;ib.title='Input color: '+INPUT_LABEL[tone]+'. Next: '+INPUT_LABEL[nextTone];ib.setAttribute('aria-label',ib.title);}
}
V.cycleTheme=function(){if(window.V24&&V24.cycleTheme)return V24.cycleTheme();var cur=document.documentElement.dataset.v24Theme||'terminal',idx=THEMES.indexOf(cur),next=THEMES[(idx<0?0:idx+1)%THEMES.length];document.documentElement.dataset.v24Theme=next;safeSet('los.v24.theme',next);paintAppearance();};
V.cycleInput=function(){if(window.V24&&V24.cycleInput)return V24.cycleInput();var cur=document.documentElement.dataset.inputTone||'ink',idx=INPUTS.indexOf(cur),next=INPUTS[(idx<0?0:idx+1)%INPUTS.length];document.documentElement.dataset.inputTone=next;safeSet('los.v24.inputTone',next);paintAppearance();};
function installAppearance(){
  var shell=$('shellbar');if(!shell)return false;
  var hand=shell.querySelector('.hand');if(!hand)return false;
  var app=$('v23Appearance');
  if(!app){app=document.createElement('div');app.id='v23Appearance';app.className='v23-appearance';app.innerHTML='<button id="v23ThemeButton" type="button">'+appearanceArt('theme')+'</button><button id="v23InputButton" type="button">'+appearanceArt('input')+'</button>';app.querySelector('#v23ThemeButton').onclick=V.cycleTheme;app.querySelector('#v23InputButton').onclick=V.cycleInput;hand.insertBefore(app,hand.firstChild);}
  var old=$('v9ShellTheme');if(old)old.classList.add('v23-retired-control');
  var sync=$('v23SyncMenu');
  if(!sync){sync=document.createElement('details');sync.id='v23SyncMenu';sync.className='v23-sync-menu';sync.innerHTML='<summary>'+icon('sync')+'<span>Sync</span></summary><div class="v23-sync-panel"></div>';hand.appendChild(sync);}
  var panel=sync.querySelector('.v23-sync-panel');Array.prototype.slice.call(hand.children).forEach(function(node){if(node===app||node===sync||node===old)return;if(node.tagName==='BUTTON')panel.appendChild(node);});
  paintAppearance();return true;
}
function retireLegacyThemes(){
  $$('button').forEach(function(b){
    var label=b.getAttribute('aria-label')||b.title||'';
    if(b.id==='themeBtn'||b.classList.contains('theme-dot')||/^Theme:\s/i.test(label)){
      b.classList.add('v23-legacy-theme');b.hidden=true;b.setAttribute('aria-hidden','true');b.style.setProperty('display','none','important');
    }
  });
}
/* v13 and v20 both decorate the same pay-statement renderer. Their old
   polling installers could alternately re-wrap it forever, creating deeply
   nested previews. Mark the composed renderer as complete and flatten any
   already-created preview without changing its calculations or document. */
function stabilizePayStatement(){
  var fn=window.psStubHTML;
  if(fn){fn.__v13=true;fn.__v20=true;fn.__v23Stable=true;}
  var sheet=$('psSheet'),wrappers=sheet&&$$('.v13-paystub',sheet);
  if(!wrappers||wrappers.length<2)return;
  var outer=wrappers[0],inner=wrappers[wrappers.length-1];
  outer.className=inner.className;
  outer.innerHTML=inner.innerHTML;
}
function enableLazyLayout(){
  $$('#screen-body > .card,#calc-root main .panel > .card,#calc-root main .panel > section').forEach(function(card){card.classList.add('v23-lazy');});
  $$('[class*="editable"],.editable-note').forEach(function(el){if(/^all fields editable$/i.test((el.textContent||'').trim()))el.classList.add('v23-redundant-note');});
}
function compactScenarioCenter(){
  var root=$('v20Setup'),body=root&&root.querySelector('.body');if(!body)return false;
  var grid=body.querySelector(':scope > .v20-grid'),quick=body.querySelector(':scope > .v20-quick'),details=$('v23ScenarioQuickEdit');
  if(!details&&grid){
    details=document.createElement('details');details.id='v23ScenarioQuickEdit';details.className='v23-scenario-edit';details.innerHTML='<summary><span><b>Quick edit</b><small id="v23ScenarioLine"></small></span><span class="v23-disclosure">Open</span></summary><div class="v23-scenario-edit-body"></div>';
    details.open=safeGet('los.v23.quickEdit','closed')==='open';details.addEventListener('toggle',function(){safeSet('los.v23.quickEdit',details.open?'open':'closed');var x=details.querySelector('.v23-disclosure');if(x)x.textContent=details.open?'Close':'Open';});
    body.insertBefore(details,grid);details.querySelector('.v23-scenario-edit-body').appendChild(grid);if(quick)details.querySelector('.v23-scenario-edit-body').appendChild(quick);
  }
  if(details){var s=window.mortgageSuite&&mortgageSuite.store,i=s&&s.activeInputs||{},line=$('v23ScenarioLine');if(line)line.textContent=[i.borrowerName||'Borrower not entered',i.zipCode?('ZIP '+i.zipCode):'ZIP needed',i.basePurchasePrice?('$'+Number(i.basePurchasePrice).toLocaleString('en-US')):'Price needed'].join(' · ');var d=details.querySelector('.v23-disclosure');if(d)d.textContent=details.open?'Close':'Open';}
  return true;
}
function closePeerMenus(e){var d=e.target&&e.target.closest&&e.target.closest('details');$$('.v23-action-menu[open],.v23-sync-menu[open]').forEach(function(x){if(x!==d)x.open=false;});}
function boot(){try{document.documentElement.dataset.losRelease='23';installAppearance();installSuiteNav();installCalcNav();installSuiteActions();installCalcActions();compactScenarioCenter();enableLazyLayout();retireLegacyThemes();stabilizePayStatement();paintAppearance();if(window.V19)V19.enhanceFreeform(document);}catch(e){if(console&&console.warn)console.warn('v23 enhancement',e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('summary'))closePeerMenus(e);});
if(window.LOS_SCHEDULER){LOS_SCHEDULER.add(boot,1400);LOS_SCHEDULER.seal();}else setInterval(boot,1400);
})();
