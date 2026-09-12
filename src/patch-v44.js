/* =====================================================================
   Release 44 — Version 21-inspired final Loan Suite shell and the one
   requested Income Calculator change: Agency starts in Auto mode.
   ===================================================================== */
(function(){
'use strict';
var $ = function(id){ return document.getElementById(id); };
var $$ = function(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
var V = window.V44 = { version:'44.0', menuOpen:'' };
var ICON = {
  save:'<svg viewBox="0 0 16 16"><path d="M2 1h10l3 3v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Zm2 1v4h7V2H4Zm4 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/></svg>',
  file:'<svg viewBox="0 0 16 16"><path d="M1 3a2 2 0 0 1 2-2h3l1.5 2H13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3Z"/></svg>',
  tool:'<svg viewBox="0 0 16 16"><path d="M10.7 1.2a4 4 0 0 0-4.8 5L1.4 10.7a2.1 2.1 0 1 0 3 3l4.5-4.5a4 4 0 0 0 5-4.8l-2.4 2.4-2.3-.7-.7-2.3 2.2-2.6Z"/></svg>',
  live:'<svg viewBox="0 0 16 16"><path d="M1 14V2h1.5v10.5H15V14H1Zm3-3.5 3-3 2 2 4-5 1.2 1-5.1 6.3-2.1-2.1-2 2-1-1.2Z"/></svg>',
  full:'<svg viewBox="0 0 16 16"><path d="M1 1h5v1.5H2.5V6H1V1Zm9 0h5v5h-1.5V2.5H10V1ZM1 10h1.5v3.5H6V15H1v-5Zm12.5 0H15v5h-5v-1.5h3.5V10Z"/></svg>',
  view:'<svg viewBox="0 0 16 16"><path d="M1 8s2.5-4 7-4 7 4 7 4-2.5 4-7 4-7-4-7-4Zm7 2.25A2.25 2.25 0 1 0 8 5.75a2.25 2.25 0 0 0 0 4.5Z"/></svg>',
  docs:'<svg viewBox="0 0 16 16"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1H7a2 2 0 0 1 1.4.58L9 2.2l.6-.62A2 2 0 0 1 11 1h2.5A1.5 1.5 0 0 1 15 2.5V14a.5.5 0 0 1-.7.46A8.7 8.7 0 0 0 9 14a8.7 8.7 0 0 0-5.3.46A.5.5 0 0 1 3 14V2.5Z"/></svg>',
  compare:'<svg viewBox="0 0 16 16"><path d="M1 14V2h1.5v10.5H15V14H1Zm3-3.5 3-3 2 2 4-5 1.2 1-5.1 6.3-2.1-2.1-2 2-1-1.2Z"/></svg>',
  more:'<svg viewBox="0 0 16 16"><path d="M3 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/></svg>'
};

function store(){ try { return window.mortgageSuite && window.mortgageSuite.store; } catch(e){ return null; } }
function norm(value){ return String(value == null ? '' : value).replace(/\s+/g,' ').trim(); }
function key(value){ return norm(value).replace(/\s*▾\s*$/,'').toUpperCase(); }
function esc(value){ return String(value == null ? '' : value).replace(/[&<>\"]/g,function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'})[c]; }); }
function safeGet(name, fallback){ try { var value=localStorage.getItem(name); return value == null ? fallback : value; } catch(e){ return fallback; } }
function safeSet(name, value){ try { localStorage.setItem(name,value); } catch(e){} }
function say(title, message, kind){ if (window.LOS && LOS.say) LOS.say(title,message,kind || 'good',5200); }

/* --------------------- preserve every existing control ------------------ */
function controlLabel(el){
  var strong = el.querySelector && el.querySelector('.v25-action-copy b, b');
  return key(strong ? strong.textContent : el.textContent);
}
function findControl(labels){
  labels = labels.map(key);
  var pool = $$('#suite-root button, #suite-root summary, #suite-root a');
  for (var i=0;i<pool.length;i++){
    var el=pool[i];
    if (el.closest('#v44Header') || el.closest('#v44Menu')) continue;
    if (labels.indexOf(controlLabel(el)) >= 0) return el;
  }
  return null;
}
function fire(labels){
  var el=findControl(labels);
  if (!el){ say('Tool not ready',labels[0]+' is still loading.','warn'); return false; }
  try { el.click(); return true; } catch(e){ say('Could not open tool',e.message,'warn'); return false; }
}

var PAGE_GROUP = {
  'QUOTE':'file','SETUP':'file','PROPERTY':'file',
  'RENOVATION':'loan','MAX MORTGAGE':'loan','MORTGAGE RATES':'loan',
  'CLOSING':'costs','ESCROW':'costs','TAXES & PRORATION':'costs',
  'QUALIFY':'underwriting','RENTAL':'underwriting','CREDIT':'underwriting','ADVANCED':'underwriting','CONTRACT & LE':'underwriting',
  'SCENARIOS':'results','SUMMARY':'results','DOCUMENTS & OCR':'documents'
};
V.goPage=function(label){
  var target=key(label), s=store(),root=$('suite-root');
  V.closeMenu();
  if (root && target!=='CONTRACT & LE' && target!=='TAXES & PRORATION') root.classList.remove('v44-moved-active');
  if (target==='FULL'){
    var full=$('#v23SuitePrimaryNav [data-group="full"]') || $('v25FullForm');
    if (full) full.click();
    return;
  }
  if (target==='DOCUMENTS & OCR'){
    var docTab=$$('#suite-root .tabs .tab').filter(function(t){ return key(t.dataset.v23Key||t.textContent)==='DOCUMENTS & OCR' && t.dataset.v8==='v9docs'; })[0]
      || $$('#suite-root .tabs .tab').filter(function(t){ return key(t.dataset.v23Key||t.textContent)==='DOCUMENTS & OCR'; })[0];
    if (docTab) docTab.click();
    try { if (window.V9 && V9.renderDocs) V9.renderDocs(); } catch(e){}
    if (window.V35) V35.documentsActive=true;
    document.querySelector('#suite-root')?.classList.add('v35-documents-active');
    setTimeout(function(){
      var panel=$('panel-v9docs') || document.querySelector('#suite-root .panel.active[data-panel="v9docs"], #suite-root .panel.active');
      if (panel && panel.scrollIntoView) panel.scrollIntoView({behavior:'smooth',block:'start'});
    },90);
    return;
  }
  if (target==='CONTRACT & LE' || target==='TAXES & PRORATION' || target==='ADVANCED'){
    var specialGroup=PAGE_GROUP[target],specialButton=specialGroup&&document.querySelector('#v23SuitePrimaryNav [data-group="'+specialGroup+'"]');
    if (specialButton) specialButton.click();
    setTimeout(function(){
      $$('#suite-root .tabs .tab').forEach(function(t){ t.classList.toggle('active',key(t.dataset.v23Key||t.textContent)===target); });
      if (target==='CONTRACT & LE' && window.LOANSUITE && LOANSUITE.goMoved) { LOANSUITE.goMoved('docparse'); if (root) root.classList.add('v44-moved-active'); }
      else if (target==='TAXES & PRORATION' && window.LOANSUITE && LOANSUITE.goMoved) { LOANSUITE.goMoved('taxes'); if (root) root.classList.add('v44-moved-active'); }
      else if (target==='ADVANCED' && window.V251 && V251.openSource) V251.openSource('advanced');
    },30);
    return;
  }
  var group=PAGE_GROUP[target];
  var groupButton=group && document.querySelector('#v23SuitePrimaryNav [data-group="'+group+'"]');
  if (groupButton) groupButton.click();
  setTimeout(function(){
    var tabs=$$('#suite-root .tabs .tab');
    var tab=tabs.filter(function(el){ return key(el.dataset.v23Key || el.textContent)===target; })[0];
    if (tab) tab.click();
    else if (s) s.navigate({tab:target.toLowerCase().replace(/\s+/g,''),section:target.toLowerCase().replace(/\s+/g,'')});
    var root=$('suite-root'); if (root) root.classList.remove('v35-documents-active');
  },25);
};

/* Correct the three synthetic Version 43 tabs at the click boundary too,
   so direct tab clicks and menu navigation share the same working routes. */
function bindSyntheticRoutes(){
  var routes={'CONTRACT & LE':'docparse','TAXES & PRORATION':'taxes','ADVANCED':'advanced'};
  var row=document.querySelector('#suite-root .tabs');
  if (row && !row.__v44MovedReset){ row.__v44MovedReset=true; row.addEventListener('click',function(e){ var t=e.target.closest('.tab'),label=t&&key(t.dataset.v23Key||t.textContent); if (t && label!=='CONTRACT & LE' && label!=='TAXES & PRORATION') $('suite-root').classList.remove('v44-moved-active'); },true); }
  $$('#suite-root .tabs .tab').forEach(function(tab){
    var label=key(tab.dataset.v23Key||tab.textContent),route=routes[label];
    if (!route || tab.__v44Route) return;
    tab.__v44Route=true;
    tab.addEventListener('click',function(e){
      e.preventDefault();e.stopImmediatePropagation();
      $$('#suite-root .tabs .tab').forEach(function(t){ t.classList.toggle('active',t===tab); });
      if (route==='advanced' && window.V251 && V251.openSource) V251.openSource('advanced');
      else if (window.LOANSUITE && LOANSUITE.goMoved) { LOANSUITE.goMoved(route); $('suite-root').classList.add('v44-moved-active'); }
    },true);
  });
}

/* -------------------------- compact action menu ------------------------- */
var MENUS={
  file:{title:'File actions',subtitle:'Save, restore, import and export',sections:[
    ['Scenario',[
      ['New scenario','＋','Start a clean loan scenario','action','New'],
      ['Save version','✓','Preserve the current scenario','save',''],
      ['Save scenario as…','✓','Name and preserve a separate scenario','action','Save scenario'],
      ['Duplicate scenario','⧉','Create an editable copy','action','Duplicate this scenario'],
      ['Reset scenario','↺','Restore scenario defaults','action','Reset']]],
    ['Transfer',[
      ['Export JSON','↓','Download the active scenario','id','v23ExportScenario'],
      ['Import JSON / AI','↑','Review and load a scenario','id','v23ImportScenario']]]
  ]},
  view:{title:'View',subtitle:'Workspace and appearance',sections:[
    ['Workspace',[
      ['Full form','□','Show every editable section','page','FULL'],
      ['Live summary rail','↗','Show or hide the in-page summary','rail',''],
      ['Look & theme','◐','Change surface, theme and input fields','appearance',''],
      ['Return to Quote','⌂','Open the quick quote page','page','QUOTE']]]
  ]},
  docs:{title:'Documents',subtitle:'Generate, print and open',sections:[
    ['Print',[
      ['Print / PDF','P','Open focused print options','action','Print / PDF'],
      ['Print summary','Σ','Print the scenario summary','action','Print summary']]],
    ['Generate',[
      ['Print / Generate','P','Open the document generator','action','Print / Generate'],
      ['Draft Loan Estimate','LE','Generate the draft Loan Estimate','action','Draft LE'],
      ['Draft Schedule C','C','Open the Schedule C worksheet','action','Draft Schedule C'],
      ['Profit & Loss','P&L','Open the P&L generator','action','P&L'],
      ['Income Report','I','Open the income report','action','Income Report']]],
    ['Open',[
      ['Documents & OCR','D','Open extraction and worksheets','page','DOCUMENTS & OCR'],
      ['Contract & LE','LE','Open contract and LE review','page','CONTRACT & LE']]]
  ]},
  tools:{title:'Loan tools',subtitle:'Pricing, costs and underwriting',sections:[
    ['Loan',[
      ['Mortgage rates','%','Open note-rate assumptions','page','MORTGAGE RATES'],
      ['PMI / FHA MIP','MI','Open mortgage insurance worksheet','action','PMI Worksheet'],
      ['Renovation fees','R','Open renovation fee worksheet','action','Reno Fees'],
      ['Lock extension','L','Open lock-extension pricing','action','Lock extension'],
      ['Taxes & proration','T','Open tax and proration worksheet','page','TAXES & PRORATION']]],
    ['Underwriting',[
      ['Credit review','C','Open credit summary and review','page','CREDIT'],
      ['Rules & warnings','!','Open advanced underwriting','page','ADVANCED'],
      ['Contract & LE','LE','Open contract and Loan Estimate tools','page','CONTRACT & LE'],
      ['Recalculate','↻','Refresh all linked calculations','action','Recalculate']]]
  ]},
  actions:{title:'All actions',subtitle:'Every retained workspace and output',sections:[
    ['View',[
      ['Quote','Q','Open quick quote','page','QUOTE'],
      ['Full form','□','Show every editable section','page','FULL'],
      ['Scenarios','S','Compare saved scenarios','page','SCENARIOS'],
      ['Live comparison','↗','Open the live comparison','id','v23LiveCompare']]],
    ['Documents',[
      ['Documents & OCR','D','Open document extraction and generators','page','DOCUMENTS & OCR'],
      ['Draft Loan Estimate','LE','Generate the draft LE','action','Draft LE'],
      ['Profit & Loss','P&L','Open the P&L generator','action','P&L'],
      ['Draft Schedule C','C','Open the Schedule C worksheet','action','Draft Schedule C']]],
    ['Share',[
      ['Copy borrower quote','⧉','Copy the borrower-facing quote','action','Copy borrower quote'],
      ['Print / PDF','P','Open focused print options','action','Print / PDF'],
      ['Print summary','Σ','Print the scenario summary','action','Print summary'],
      ['Income report','I','Open the Income Calculator report','action','Income Report']]]
  ]}
};
function menuGlyph(item){
  var label=key(item[0]),kind=item[3];
  var paths={
    save:'<path d="M3 2h8l2 2v10H3V2Zm2 0v4h5V2M5 10h6v4H5z"/>',
    import:'<path d="M8 2v8m0 0 3-3m-3 3L5 7M3 12v2h10v-2"/>',
    export:'<path d="M8 11V3m0 0 3 3M8 3 5 6M3 12v2h10v-2"/>',
    doc:'<path d="M4 2h5l3 3v9H4V2Zm5 0v3h3M6 8h4M6 11h4"/>',
    view:'<path d="M1.5 8S4 4.5 8 4.5 14.5 8 14.5 8 12 11.5 8 11.5 1.5 8 1.5 8Zm6.5 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>',
    chart:'<path d="M2 14V2m0 12h12M5 11l3-3 2 2 4-5"/>',
    tool:'<path d="M10.5 2.2a3.5 3.5 0 0 0-4.3 4.3L2 10.7a2 2 0 1 0 2.8 2.8L9 9.3a3.5 3.5 0 0 0 4.3-4.3l-2 2-2-.5-.5-2 1.7-2.3Z"/>',
    refresh:'<path d="M13 5V2l-1.4 1.4A5.5 5.5 0 1 0 13.2 9M13 2H9.5"/>',
    add:'<path d="M8 2v12M2 8h12"/>',
    copy:'<path d="M5 5h8v9H5V5ZM3 11H2V2h8v1"/>'
  };
  var which=kind==='save'?'save':kind==='id'&&/EXPORT/.test(label)?'export':kind==='id'&&/IMPORT/.test(label)?'import':/NEW|DUPLICATE/.test(label)?'add':/COPY/.test(label)?'copy':/RECALCULATE|RESET/.test(label)?'refresh':/FULL|LOOK|RETURN|QUOTE/.test(label)?'view':/COMPARE|SCENARIO|SUMMARY/.test(label)?'chart':/RATE|PMI|MIP|RENO|TAX|CREDIT|RULE/.test(label)?'tool':'doc';
  return '<svg viewBox="0 0 16 16" aria-hidden="true">'+paths[which]+'</svg>';
}
function menuItems(spec){
  return spec.sections.map(function(section){
    return '<div class="v44-menu-section">'+esc(section[0])+'</div><div class="v44-menu-grid">'+section[1].map(function(item){
      return '<button type="button" class="v44-menu-item" data-kind="'+esc(item[3])+'" data-value="'+esc(item[4])+'"><i>'+menuGlyph(item)+'</i><span><b>'+esc(item[0])+'</b><small>'+esc(item[2])+'</small></span></button>';
    }).join('')+'</div>';
  }).join('');
}
function sessionHtml(){
  var list=[];
  try { if (window.LOS && LOS.AUTO && LOS.AUTO.list) list=LOS.AUTO.list().slice(0,3); } catch(e){}
  if (!list.length) return '';
  return '<div class="v44-menu-section">Previous sessions</div><div class="v44-session"><select id="v44SessionSelect" aria-label="Previous sessions"><option value="">Choose one of the last three sessions</option>'+list.map(function(x,i){ return '<option value="'+i+'">'+esc(new Date(x.ts).toLocaleString()+' · '+(x.name||'Scenario'))+'</option>'; }).join('')+'</select><button type="button" data-v44-restore="1">Restore</button></div>';
}
var APPEARANCE={
  themes:[['ledger','Ledger'],['slate','Slate'],['bank','Bank'],['graphite','Graphite'],['terminal','Terminal'],['github','GitHub'],['github-dark','GitHub dark'],['lightgray','Light gray'],['cloudgrey','Cloud grey'],['nord','Nord'],['dracula','Dracula'],['solarized','Solarized'],['linear','Linear']],
  tones:[['paper','Paper'],['mist','Mist'],['mint','Mint'],['sand','Sand'],['ink','Ink']],
  surfaces:[['light','Light'],['dark','Dark'],['oled','OLED']]
};
function appearanceHtml(){
  var root=document.documentElement,theme=root.dataset.v24Theme||'ledger',tone=root.dataset.inputTone||'paper',surface=root.dataset.v25Surface||root.dataset.theme||'light';
  function row(items,kind,current){ return '<div class="v44-appearance-row">'+items.map(function(x){ return '<button type="button" class="v44-appearance-chip'+(x[0]===current?' on':'')+'" data-'+kind+'="'+esc(x[0])+'">'+esc(x[1])+'</button>'; }).join('')+'</div>'; }
  return '<div class="v44-menu-title"><span>Appearance</span><small>Loan Suite and Income Calculator</small></div><div class="v44-appearance-label">Surface</div>'+row(APPEARANCE.surfaces,'surface',surface)+'<div class="v44-appearance-label">Theme</div><div class="v44-appearance-grid">'+APPEARANCE.themes.map(function(x){ return '<button type="button" class="v44-theme-chip'+(x[0]===theme?' on':'')+'" data-theme="'+esc(x[0])+'"><i></i><span>'+esc(x[1])+'</span></button>'; }).join('')+'</div><div class="v44-appearance-label">Input fields</div>'+row(APPEARANCE.tones,'tone',tone);
}
V.openMenu=function(kind){
  var menu=$('v44Menu'), spec=MENUS[kind]; if (!menu || !spec) return;
  if (V.menuOpen===kind && !menu.hidden){ V.closeMenu(); return; }
  V.menuOpen=kind;
  menu.innerHTML='<div class="v44-menu-title"><span>'+esc(spec.title)+'</span><small>'+esc(spec.subtitle)+'</small></div>'+menuItems(spec)+(kind==='file'?sessionHtml():'');
  menu.hidden=false;
  $$('#v44Header [aria-expanded]').forEach(function(b){ b.setAttribute('aria-expanded',b.dataset.menu===kind?'true':'false'); });
};
V.closeMenu=function(){
  var menu=$('v44Menu'); if (menu) menu.hidden=true;
  V.menuOpen='';
  $$('#v44Header [aria-expanded]').forEach(function(b){ b.setAttribute('aria-expanded','false'); });
};
V.openAppearance=function(){
  var menu=$('v44Menu'); if (!menu) return;
  V.menuOpen='appearance';
  menu.innerHTML=appearanceHtml();
  menu.hidden=false;
  $$('#v44Header [aria-expanded]').forEach(function(b){ b.setAttribute('aria-expanded','false'); });
};
function runMenuItem(button){
  var kind=button.dataset.kind,value=button.dataset.value;
  V.closeMenu();
  if (kind==='page') return V.goPage(value);
  if (kind==='rail') return V.toggleRail();
  if (kind==='appearance'){
    return V.openAppearance();
  }
  if (kind==='id') { var byId=$(value); return byId ? byId.click() : say('Tool not ready',value+' is still loading.','warn'); }
  if (kind==='save') { var save=$('v23QuickSave') || findControl(['Save a version','Save scenario']); return save ? save.click() : say('Save not ready','Please try again.','warn'); }
  return fire([value]);
}

V.toggleRail=function(){
  var root=$('suite-root'); if (!root) return;
  var hidden=!root.classList.contains('v44-rail-hidden');
  root.classList.toggle('v44-rail-hidden',hidden);
  safeSet('los.v44.railHidden',hidden?'1':'0');
  var button=$('v44Live'); if (button) button.setAttribute('aria-pressed',hidden?'false':'true');
};
function headerButton(id,label,icon,handler,extra){
  return '<button type="button" id="'+id+'" class="v44-action'+(extra||'')+'" '+handler+'>'+icon+'<span>'+label+'</span></button>';
}
function buildHeader(){
  var root=$('suite-root'), main=$('v25HeaderMain'), bar=$('v34Bar');
  if (!root || !main || !bar) return false;
  root.classList.add('v44-final');
  if (safeGet('los.v44.railHidden','0')==='1') root.classList.add('v44-rail-hidden');
  var brand=$('v251SuiteBrand'), scenario=$('v24ScenarioBar'), firstDate=main.querySelector('.v251-datefield');
  if (scenario && brand && scenario.previousElementSibling!==brand) main.insertBefore(scenario,firstDate || brand.nextSibling);
  if (!$('v44Header')){
    var wrap=document.createElement('div'); wrap.id='v44Header'; wrap.className='no-print';
    wrap.innerHTML=headerButton('v44File','File',ICON.file,'data-menu="file" aria-haspopup="true" aria-expanded="false"','')
      +headerButton('v44View','View',ICON.view,'data-menu="view" aria-haspopup="true" aria-expanded="false"','')
      +headerButton('v44Docs','Documents',ICON.docs,'data-direct="documents"','')
      +headerButton('v44Compare','Compare',ICON.compare,'data-direct="compare"','')
      +headerButton('v44Tools','Loan tools',ICON.tool,'data-menu="tools" aria-haspopup="true" aria-expanded="false"','')
      +headerButton('v44Live','Live',ICON.live,'data-direct="live" aria-pressed="true"','')
      +headerButton('v44Actions','Actions',ICON.more,'data-menu="actions" aria-haspopup="true" aria-expanded="false"',' primary');
    bar.appendChild(wrap);
    wrap.addEventListener('click',function(e){
      var b=e.target.closest('button'); if (!b) return;
      if (b.dataset.menu) return V.openMenu(b.dataset.menu);
      if (b.dataset.direct==='live') {
        V.closeMenu();
        if (window.V14 && V14.open) try { V14.open('v14CompareModal'); if (V14.renderCompare) V14.renderCompare(); } catch(x){}
        return;
      }
      if (b.dataset.direct==='documents') return V.goPage('DOCUMENTS & OCR');
      if (b.dataset.direct==='compare') V.goPage('SCENARIOS');
    });
  }
  if (!$('v44Menu')){
    var menu=document.createElement('div');menu.id='v44Menu';menu.className='no-print';menu.hidden=true;
    menu.addEventListener('click',function(e){
      var appearance=e.target.closest('.v44-theme-chip[data-theme],.v44-appearance-chip[data-tone],.v44-appearance-chip[data-surface]');
      if (appearance){
        var theme=appearance.dataset.theme||null,tone=appearance.dataset.tone||null,surface=appearance.dataset.surface||null;
        if (window.V39 && V39.applyLook) V39.applyLook(theme,surface,tone);
        menu.innerHTML=appearanceHtml();
        return;
      }
      var restore=e.target.closest('[data-v44-restore]');
      if (restore){ var select=$('v44SessionSelect'); if (select && select.value!=='' && window.LOS && LOS.AUTO) LOS.AUTO.restore(Number(select.value)); V.closeMenu(); return; }
      var item=e.target.closest('.v44-menu-item'); if (item) runMenuItem(item);
    });
    root.appendChild(menu);
  }
  return true;
}

/* Reuse the organized Appearance panel from the shared Look control instead
   of opening an older theme-only popover. */
function bindSharedLook(){
  var shell=$('shellbar'); if (!shell) return false;
  var look=$$('button',shell).filter(function(button){ return key(button.textContent)==='LOOK'; })[0];
  if (!look || look.__v44Appearance) return !!look;
  look.__v44Appearance=true;
  look.addEventListener('click',function(e){
    if (!$('suite-root') || !$('suite-root').classList.contains('on')) return;
    e.preventDefault();e.stopImmediatePropagation();V.openAppearance();
  },true);
  return true;
}

/* Documents is a proper top-level tab after Full, not a hidden duplicate. */
function bindDocumentsTab(){
  var button=$('v28nav-documents'); if (!button) return false;
  if (!button.__v44){
    button.__v44=true;
    button.setAttribute('aria-label','Documents workspace');
    button.addEventListener('click',function(e){ e.preventDefault(); V.goPage('DOCUMENTS & OCR'); });
  }
  return true;
}

/* Every generated numeric/date field remains typeable as plain text. */
function freeformSuite(){
  var root=$('suite-root'); if (!root) return;
  $$('input[type="number"],input[type="date"]',root).forEach(function(input){
    var was=input.type;
    try { input.type='text'; } catch(e){}
    input.dataset.v44Freeform='1';
    if (!input.inputMode) input.inputMode=was==='number'?'decimal':'text';
    if (was==='date' && !input.placeholder) input.placeholder='MM/DD/YYYY';
  });
  try { if (window.V19 && V19.enhanceFreeform) V19.enhanceFreeform(root); } catch(e){}
}

/* The compact Quote rail was introduced after the original form engine. Keep
   it genuinely live: shorthand such as 600k is normalized by V19 during the
   capture phase, then this bubble-phase listener writes the parsed value into
   the same scenario store used by every full-form field. */
function bindQuoteInputs(){
  var s=store(); if (!s) return;
  $$('[data-v35-quote]',$('suite-root')).forEach(function(input){
    if (input.__v44LiveQuote) return;
    input.__v44LiveQuote=true;
    var apply=function(){
      var path=input.dataset.v35Quote,kind=input.dataset.kind||'text',raw=input.value;
      if (kind!=='text' && window.V20 && V20.parseNumber){
        var parsed=V20.parseNumber(raw); if (!parsed.ok && !parsed.blank) return;
      }
      if (window.V20 && V20.setScenario) V20.setScenario(path,raw,kind==='percent'?'pct':kind==='currency'?'num':'text');
      else s.setField(path,raw,'Quick quote live edit');
    };
    input.addEventListener('input',function(){ clearTimeout(input.__v44QuoteTimer); input.__v44QuoteTimer=setTimeout(apply,70); });
    input.addEventListener('change',apply);
  });
}

/* Fold the former standalone scenario-control band and the v35 Quick Quote
   controls into one v21-style worksheet card. The original controls are moved,
   not copied, so every existing event handler and calculation stays intact. */
function mergeScenarioWorksheet(){
  var root=$('suite-root'),control=root&&root.querySelector('[data-section="control"]'),quick=$('v35QuoteControls');
  if (!control) return;
  control.classList.add('v44-worksheet');
  var title=control.querySelector('h3 .ttl');
  if (title){ title.textContent='Property & loan setup'; title.parentElement.title='Everything that defines the file; changes flow to every linked worksheet.'; }
  var body=control.querySelector(':scope > .body');
  if (body && quick && quick.parentElement!==body) body.insertBefore(quick,body.firstChild);
}

/* ------------------- quote/setup punch-in workspace --------------------
   These are live proxy inputs, not a second scenario.  They write to the
   same paths as the full form so Quote and Setup share one calculation. */
var PUNCH_FIELDS=[
  ['Borrower name','borrowerName','text'],['Property address','propertyAddress','text'],
  ['ZIP code','zipCode','text'],['State','state','text'],['County / area','nyCounty','text'],
  ['Purchase price','basePurchasePrice','num'],['As-is value','asIsValue','num'],
  ['After-repair value','afterRepairValue','num'],['Down payment %','finalDownPaymentPct','pct'],
  ['Renovation budget','reno.baseCost','num']
];
function getPath(obj,path){return String(path).split('.').reduce(function(value,part){return value==null?undefined:value[part];},obj);}
function cleanNumber(value){var n=parseFloat(String(value==null?'':value).replace(/[$,%\s,]/g,''));return isFinite(n)?n:0;}
function inputPercent(value){var n=cleanNumber(value);return String(Math.round(n*1000000)/10000).replace(/\.0+$/,'');}
function inputValue(value,kind){if(value==null)return'';if(kind==='pct')return inputPercent(value);return String(value);}
function applyPunch(input){
  var s=store(),path=input.dataset.v44Field,kind=input.dataset.kind||'text',raw=input.value;if(!s||!path)return;
  if(kind!=='text'&&window.V20&&V20.parseNumber){var parsed=V20.parseNumber(raw);if(!parsed.ok&&!parsed.blank)return;}
  if(window.V20&&V20.setScenario)V20.setScenario(path,raw,kind==='pct'?'pct':kind==='num'?'num':'text');
  else s.setField(path,raw,'Quote / setup quick edit');
  if(kind==='pct')input.value=inputPercent(getPath(s.activeInputs,path));
}
function punchField(field){var label=field[0],path=field[1],kind=field[2];return'<label><span>'+esc(label)+'</span><input type="text" autocomplete="off" inputmode="'+(kind==='text'?'text':'decimal')+'" data-v44-field="'+esc(path)+'" data-kind="'+esc(kind)+'" aria-label="'+esc(label)+'"></label>';}
function punchMarkup(){return'<section id="v44PunchIn" class="v44-punch no-print"><div class="v44-punch-head"><div><b>Scenario control center</b><small>Freeform changes update every linked worksheet.</small></div><button type="button" data-v44-address-search>Search address</button></div><div class="v44-punch-grid">'+PUNCH_FIELDS.map(punchField).join('')+'</div><div class="v44-punch-actions"><button type="button" data-v44-preset="fha35">FHA 3.5%</button><button type="button" data-v44-preset="conv5">5% down</button><button type="button" data-v44-zip>Fill city/state/county from ZIP</button><button type="button" data-v44-sync>Sync to Property</button></div><div id="v44AddressResults" class="v44-address-results" hidden></div><div id="v44MetricStrip" class="v44-metric-strip"></div></section>';}
function setupPunchIn(){
  var root=$('suite-root'),s=store(),control=root&&root.querySelector('[data-section="control"]'),body=control&&control.querySelector(':scope > .body');if(!s||!body)return;
  var panel=$('v44PunchIn');if(!panel){body.insertAdjacentHTML('afterbegin',punchMarkup());panel=$('v44PunchIn');
    $$('[data-v44-field]',panel).forEach(function(input){var apply=function(){applyPunch(input);};input.addEventListener('input',function(){clearTimeout(input.__v44Timer);input.__v44Timer=setTimeout(apply,90);});input.addEventListener('change',apply);});
    $$('[data-v44-preset]',panel).forEach(function(button){button.onclick=function(){if(window.V35&&V35.applyQuotePreset)V35.applyQuotePreset(button.dataset.v44Preset);};});
    panel.querySelector('[data-v44-zip]').onclick=function(){try{s.applyZipLookup();}catch(e){say('ZIP lookup','Enter a five-digit ZIP and try again.','warn');}};
    panel.querySelector('[data-v44-sync]').onclick=function(){try{if(s.saveCurrentBorrowerAndProperty)s.saveCurrentBorrowerAndProperty();say('Property synced','The current borrower and property were saved.');}catch(e){V.goPage('PROPERTY');}};
    panel.querySelector('[data-v44-address-search]').onclick=V.searchAddress;
  }
  if(panel.parentElement!==body)body.insertBefore(panel,body.firstChild);
  $$('[data-v44-field]',panel).forEach(function(input){if(document.activeElement!==input)input.value=inputValue(getPath(s.activeInputs,input.dataset.v44Field),input.dataset.kind);input.classList.toggle('v44-missing',input.dataset.v44Field==='afterRepairValue'&&!!s.outputs.renovationActive&&!cleanNumber(getPath(s.activeInputs,'afterRepairValue')));});
  paintMetricStrip();
}

/* Nominatim's public service forbids client-side autocomplete.  The lookup is
   therefore an explicit, user-triggered search, limited to one request and
   cached locally.  Manual entry remains available before and after lookup. */
V.osmResults=[];V.osmLastRequest=0;
V.searchAddress=function(){
  var s=store(),host=$('v44AddressResults');if(!s||!host)return;var i=s.activeInputs||{},query=[i.propertyAddress,i.zipCode,i.state].filter(Boolean).join(', ');
  if(query.length<4){say('Address search','Enter an address or ZIP first.','warn');return;}
  var cacheKey='los.v44.osm.'+query.toLowerCase(),cached=safeGet(cacheKey,'');if(cached){try{return showAddressResults(JSON.parse(cached));}catch(e){}}
  var wait=1000-(Date.now()-V.osmLastRequest);if(wait>0){say('Address search','Please wait a moment before another lookup.','warn');return;}
  V.osmLastRequest=Date.now();host.hidden=false;host.innerHTML='<span class="v44-address-loading">Searching OpenStreetMap…</span>';
  var endpoint=window.MORTGAGE_GEOCODER_URL||'https://nominatim.openstreetmap.org/search';
  fetch(endpoint+'?format=jsonv2&addressdetails=1&countrycodes=us&limit=5&q='+encodeURIComponent(query),{headers:{Accept:'application/json'}}).then(function(response){if(!response.ok)throw new Error('Lookup unavailable');return response.json();}).then(function(rows){safeSet(cacheKey,JSON.stringify(rows.slice(0,5)));showAddressResults(rows);}).catch(function(){host.innerHTML='<span>Address lookup is unavailable. Keep typing manually or try again later.</span>';});
};
function showAddressResults(rows){
  var host=$('v44AddressResults');if(!host)return;V.osmResults=(rows||[]).slice(0,5);host.hidden=false;
  host.innerHTML=V.osmResults.length?'<div>'+V.osmResults.map(function(row,index){return'<button type="button" data-v44-address-choice="'+index+'">'+esc(row.display_name||'Address result')+'</button>';}).join('')+'</div><small>Address data © OpenStreetMap contributors · selection never locks manual fields.</small>':'<span>No matching address found. Manual entry is still available.</span>';
  $$('[data-v44-address-choice]',host).forEach(function(button){button.onclick=function(){applyAddressResult(V.osmResults[Number(button.dataset.v44AddressChoice)]);};});
}
function applyAddressResult(row){
  var s=store(),a=row&&row.address||{};if(!s||!row)return;var street=[a.house_number,a.road||a.pedestrian||a.residential].filter(Boolean).join(' '),city=a.city||a.town||a.village||a.hamlet||a.municipality||'',county=String(a.county||'').replace(/\s+County$/i,''),zip=a.postcode||'',state=a.state||'';
  [['propertyAddress',street||row.display_name],['zipCode',zip],['state',state],['nyCounty',county]].forEach(function(pair){if(pair[1])s.setField(pair[0],pair[1],'OpenStreetMap address selection');});
  var host=$('v44AddressResults');if(host){host.hidden=true;host.innerHTML='';}setupPunchIn();
}
function paintMetricStrip(){
  var s=store(),host=$('v44MetricStrip');if(!s||!host)return;var o=s.outputs||{},items=[
    ['MMW value basis',o.value&&o.value.valueBasis,'maxmortgage','valueBasis','HUD-92700 value basis'],
    ['Maximum base mortgage',o.loan&&o.loan.maximumBaseLoan,'maxmortgage','maximumBaseLoan','Before financed mortgage insurance'],
    ['Total loan',o.loan&&o.loan.totalLoan,'maxmortgage','totalLoan','Financed balance at closing'],
    ['Amortization','Open schedule','summary','','Payment and balance schedule']
  ];var sig=items.map(function(x){return x[1];}).join('|');if(host.dataset.sig===sig)return;host.dataset.sig=sig;
  host.innerHTML=items.map(function(x){var val=typeof x[1]==='number'?'$'+x[1].toLocaleString('en-US',{maximumFractionDigits:2}):x[1];return'<button type="button" class="v35-live-row" data-v35-label="'+esc(x[0])+'" data-v35-mode="'+esc(x[2])+'"'+(x[3]?' data-v44-trace="'+esc(x[3])+'"':' data-v44-amortization="1"')+'><i>'+ICON.live+'</i><span><small>'+esc(x[0])+'</small><b>'+esc(val)+'</b><em>'+esc(x[4])+'</em></span></button>';}).join('');
  var amort=host.querySelector('[data-v44-amortization]');if(amort)amort.onclick=function(e){e.stopPropagation();if(window.V20&&V20.openAmortization)V20.openAmortization();else V.goPage('SUMMARY');};
}

/* ---------------- concise, editable right-side live summary ------------ */
function dollars(value,digits){var n=cleanNumber(value);return(n<0?'-':'')+'$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:digits||0,maximumFractionDigits:digits==null?0:digits});}
function liveRow(label,value,mode,trace,cls,sub){return'<button type="button" class="v35-live-row v44-live-row '+(cls||'')+'" data-v35-label="'+esc(label)+'" data-v35-mode="'+esc(mode)+'"'+(trace?' data-v44-trace="'+esc(trace)+'"':'')+'><span>'+esc(label)+(sub?'<small>'+esc(sub)+'</small>':'')+'</span><b>'+esc(value)+'</b></button>';}
function paintLiveSummary(){
  var s=store(),rail=document.querySelector('#suite-root .cols-main > .rail'),card=rail&&rail.querySelector(':scope > .card'),body=card&&card.querySelector(':scope > .body');if(!s||!body)return;var i=s.activeInputs||{},o=s.outputs||{},loan=o.loan||{},p=o.payment||{},c=o.closing||{},cash=o.cash||{},value=o.value||{},reno=o.renovationOut||{},aus=o.aus||{},isReno=!!o.renovationActive,mi=o.isFha?p.monthlyFhaMip:p.monthlyPmi,warnings=(o.warnings||[]).filter(function(w){if(!isReno&&(w.code==='MISSING_APPRAISAL_VALUE'||w.code==='ARV_SHORTFALL'))return false;if(w.code==='MISSING_TAX_SOURCE'&&i.taxSourceType==='MLS / Zillow / Redfin Estimate')return false;return w.severity==='error'||w.severity==='warning'||w.level==='error'||w.level==='fail'||w.blocking;}),arvFit=window.V21&&V21.valueFit?V21.valueFit(i,o):null;
  var host=$('v44LiveSummary');if(!host){host=document.createElement('section');host.id='v44LiveSummary';host.className='v44-live-summary';body.appendChild(host);}var sig=[o.programLabel,i.finalDownPaymentPct,i.interestRate,loan.totalLoan,p.totalMonthlyPayment,c.buyerClosingCosts,cash.cashToClose,value.afterRepairValue,warnings.length,arvFit&&arvFit.status].join('|');if(host.dataset.sig===sig)return;host.dataset.sig=sig;
  var html='<div class="v44-live-title"><div><b>Live summary</b><small>'+esc(o.programLabel||i.loanProgram||'Loan')+' · '+inputPercent(i.finalDownPaymentPct)+'% down · '+inputPercent(i.interestRate)+'%</small></div><span>'+esc(o.programLabel||i.loanProgram||'Loan')+'</span></div>';
  html+='<h4>Acquisition</h4>'+liveRow('Purchase price',dollars(o.purchase&&o.purchase.finalPurchasePrice||i.basePurchasePrice),'setup','finalPurchasePrice')+(isReno?liveRow('Renovation',dollars(reno.finalRenovationAmount),'renovation','','','Program budget'):'' )+(isReno?liveRow('After-repair value',value.afterRepairValue>0?dollars(value.afterRepairValue):'Pending appraisal','maxmortgage','','','ARV'):'' )+liveRow('Required investment',dollars(loan.requiredInvestment,2),'setup','requiredInvestment');
  html+='<h4>Loan</h4>'+liveRow('Maximum base loan',dollars(loan.maximumBaseLoan,2),'maxmortgage','maximumBaseLoan')+(o.isFha?liveRow('UFMIP',dollars(loan.ufmip,2),'maxmortgage','ufmip'):'' )+liveRow('Total loan',dollars(loan.totalLoan,2),'maxmortgage','totalLoan','total')+liveRow('Interest rate',inputPercent(i.interestRate)+'%','rates','','','Note rate · '+cleanNumber(i.termYears)+' years');
  html+='<h4>Monthly payment</h4>'+liveRow('Principal & interest',dollars(p.principalAndInterest,2),'rates','principalAndInterest')+liveRow('Mortgage insurance',dollars(mi,2),o.isFha?'maxmortgage':'qualify',o.isFha?'monthlyFhaMip':'monthlyPmi','',o.isFha?'FHA MIP':'PMI estimate')+liveRow('Taxes & insurance',dollars(p.monthlyTaxesAndInsuranceUsed,2),'escrow','totalMonthlyPayment')+liveRow('Total payment',dollars(p.totalMonthlyPayment,2),'qualify','totalMonthlyPayment','total');
  html+='<h4>Cash to close</h4>'+liveRow('Closing costs',dollars(c.buyerClosingCosts,2),'closing','buyerClosingCosts')+liveRow('Cash to close',dollars(cash.cashToClose,2),'closing','cashToClose','total');
  html+='<h4>Checks</h4>'+liveRow('DTI',aus.totalQualifyingIncome>0?inputPercent(aus.backEndDti)+'%':'Enter income','income','')+liveRow('Reserves',aus.reserveShortfall>0?'Short '+dollars(aus.reserveShortfall):'PASS by '+dollars(aus.reserveSurplus||0),'qualify','',aus.reserveShortfall>0?'bad':'pass')+liveRow('Blocking warnings',String(warnings.length),'advanced','',''+(warnings.length?'bad':'pass'));
  if(isReno&&arvFit){var fit=arvFit.status==='na'?'Enter an after-repair value':(arvFit.status==='pass'?'ARV test passes':'ARV test fails');var detail=arvFit.status==='na'?'Required before the program value test can run.':(arvFit.status==='pass'?arvFit.ratio.toFixed(2)+'% of ARV · threshold '+arvFit.threshold+'%':arvFit.ratio.toFixed(2)+'% of ARV · over by '+dollars(arvFit.shortfall||arvFit.gap));html+='<button type="button" class="v35-live-row v44-arv-check '+(arvFit.status==='fail'?'bad':arvFit.status==='pass'?'pass':'na')+'" data-v35-label="After-repair value" data-v35-mode="maxmortgage"><span><b>'+esc(fit)+'</b><small>'+esc(detail)+'</small></span><i>›</i></button>';}
  html+='<small class="v44-live-note">Click any line to review its formula, edit a driver, or open the source worksheet.</small>';host.innerHTML=html;
}

function enhanceRailEditor(){
  if(!window.V35||!V35.openRailEditor||V35.openRailEditor.__v44Formula)return;var original=V35.openRailEditor;
  V35.openRailEditor=function(row,label,mode){original.call(V35,row,label,mode);var panel=$('v35RailEditor'),s=store(),traceKey=row&&row.dataset&&(row.dataset.v44Trace||row.dataset.out),trace=s&&s.outputs&&s.outputs.traces&&traceKey?s.outputs.traces[traceKey]:null;if(!panel)return;var current=panel.querySelector('.v44-formula');if(current)current.remove();var formula=trace&&trace.formula;if(!formula){var formulas={'After-repair value':'ARV = the entered as-completed appraisal value.','Interest rate':'Note rate = the annual interest rate entered for this scenario.','Taxes & insurance':'Monthly escrow = annual property taxes ÷ 12 + annual insurance ÷ 12.','DTI':'Back-end DTI = total housing payment and monthly liabilities ÷ qualifying monthly income.','Reserves':'Available reserves − required reserves.','Blocking warnings':'Count of current underwriting warnings that require review.'};formula=formulas[norm(label||row.dataset.v35Label||'')]||'This result updates from the linked scenario inputs.';}var block=document.createElement('div');block.className='v44-formula';block.innerHTML='<span>Formula</span><code>'+esc(formula)+'</code>'+(trace&&trace.inputs&&trace.inputs.length?'<div>'+trace.inputs.slice(0,5).map(function(x){return'<small><span>'+esc(x.label)+'</span><b>'+esc(x.format==='percent'?inputPercent(x.value)+'%':x.format==='currency'?dollars(x.value,2):String(x.value))+'</b></small>';}).join('')+'</div>':'');var anchor=panel.querySelector('.v35-rail-current')||panel.querySelector('header');anchor.insertAdjacentElement('afterend',block);return panel;};V35.openRailEditor.__v44Formula=true;
}

/* ---------------- Income Calculator: requested Auto agency only ---------- */
var autoAgencyBusy=false;
function applyAutoAgency(){
  if (safeGet('los.v44.agencyMode2','auto')!=='auto' || autoAgencyBusy) return;
  var select=$('agency'); if (!select || typeof window.agencyBest!=='function' || typeof window.S==='undefined') return;
  autoAgencyBusy=true;
  try {
    var best=window.agencyBest();
    if (best && best.ag && best.ag!==S.agency){
      S.agency=best.ag;
      if (typeof window.renderAll==='function') window.renderAll();
      else if (typeof window.RECALC==='function') window.RECALC();
    }
    select.value='AUTO';
    select.title='Auto selected · '+(window.AG_NAME && AG_NAME[S.agency] ? AG_NAME[S.agency] : S.agency)+' currently produces the strongest result';
  } catch(e){} finally { autoAgencyBusy=false; }
}
function installAutoAgency(){
  var select=$('agency'); if (!select) return false;
  if (!select.querySelector('option[value="AUTO"]')){
    var option=document.createElement('option'); option.value='AUTO'; option.textContent='Auto (best fit)';
    select.insertBefore(option,select.firstChild);
  }
  if (!safeGet('los.v44.agencyInitialized2','')){
    safeSet('los.v44.agencyInitialized2','1'); safeSet('los.v44.agencyMode2','auto');
  }
  if (!select.__v44){
    select.__v44=true;
    select.addEventListener('change',function(e){
      if (select.value==='AUTO'){
        e.preventDefault();e.stopImmediatePropagation();safeSet('los.v44.agencyMode2','auto');applyAutoAgency();
      } else if (e.isTrusted) safeSet('los.v44.agencyMode2','manual');
    },true);
  }
  if (safeGet('los.v44.agencyMode2','auto')==='auto') applyAutoAgency();
  return true;
}

/* Explicit entry links win over the saved shell position. Release 38 restores
   the last shell after boot, so this later layer reasserts only the app half
   of the URL; it never keeps forcing the tab after the user navigates. */
function enforceEntryShell(){
  var app=''; try { app=new URLSearchParams(location.search).get('app') || ''; } catch(e){}
  if (!app) return;
  var shell=null; try { shell=(typeof SHELL!=='undefined' ? SHELL : window.SHELL); } catch(e){}
  if (!shell || typeof shell.go!=='function') return;
  var target=app==='income'?'calc':'suite';
  if (shell.mode!==target) shell.go(target);
  document.body.dataset.shellMode=target;
}

/* The persistence layer restores the last focused page after the first paint.
   Re-apply an explicit entry-page URL once, then leave all user navigation alone. */
var entryPageApplied=false;
function enforceEntryPage(){
  if (entryPageApplied) return;
  var app='',tab=''; try { var q=new URLSearchParams(location.search);app=q.get('app')||'';tab=q.get('tab')||''; } catch(e){}
  if (app!=='suite' || !tab) { entryPageApplied=true; return; }
  var map={quote:'QUOTE',setup:'SETUP',property:'PROPERTY',renovation:'RENOVATION',maxmortgage:'MAX MORTGAGE',mortgagerates:'MORTGAGE RATES',closing:'CLOSING',escrow:'ESCROW',taxesproration:'TAXES & PRORATION',qualify:'QUALIFY',rental:'RENTAL',credit:'CREDIT',advanced:'ADVANCED',contractle:'CONTRACT & LE',scenarios:'SCENARIOS',summary:'SUMMARY',documents:'DOCUMENTS & OCR'};
  var page=map[String(tab).toLowerCase().replace(/[^a-z]/g,'')];
  entryPageApplied=true;
  if (page) V.goPage(page);
}

function tick(){
  try { document.documentElement.dataset.losRelease='44'; } catch(e){}
  try { buildHeader(); } catch(e){ if (console && console.warn) console.warn('v44 header',e); }
  try { bindDocumentsTab(); } catch(e){}
  try { bindSyntheticRoutes(); } catch(e){}
  try { freeformSuite(); } catch(e){}
  try { bindQuoteInputs(); } catch(e){}
  try { mergeScenarioWorksheet(); } catch(e){}
  try { setupPunchIn(); } catch(e){}
  try { enhanceRailEditor(); } catch(e){}
  try { paintLiveSummary(); } catch(e){}
  try { bindSharedLook(); } catch(e){}
  try { installAutoAgency(); } catch(e){}
  try { enforceEntryShell(); } catch(e){}
}
document.addEventListener('mousedown',function(e){ if (!e.target.closest('#v44Menu') && !e.target.closest('#v44Header')) V.closeMenu(); });
document.addEventListener('keydown',function(e){ if (e.key==='Escape') V.closeMenu(); });
if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',tick); else tick();
setTimeout(enforceEntryShell,80);
setTimeout(enforceEntryShell,360);
setTimeout(function(){ enforceEntryShell(); enforceEntryPage(); },1450);
if (window.LOS_SCHEDULER && LOS_SCHEDULER.add) LOS_SCHEDULER.add(tick,1250); else setInterval(tick,1000);
})();
