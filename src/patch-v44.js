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
function runMenuItem(button){
  var kind=button.dataset.kind,value=button.dataset.value;
  V.closeMenu();
  if (kind==='page') return V.goPage(value);
  if (kind==='rail') return V.toggleRail();
  if (kind==='appearance'){
    var menu=$('v44Menu'); if (menu){ V.menuOpen='appearance'; menu.innerHTML=appearanceHtml(); menu.hidden=false; }
    return;
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
      +headerButton('v44Docs','Documents',ICON.docs,'data-menu="docs" aria-haspopup="true" aria-expanded="false"','')
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
      if (b.dataset.direct==='compare') V.goPage('SCENARIOS');
    });
  }
  if (!$('v44Menu')){
    var menu=document.createElement('div');menu.id='v44Menu';menu.className='no-print';menu.hidden=true;
    menu.addEventListener('click',function(e){
      var appearance=e.target.closest('[data-theme],[data-tone],[data-surface]');
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
  if (title){ title.textContent='Quote worksheet'; title.parentElement.title='Everything that defines the file; changes flow to every linked worksheet.'; }
  var body=control.querySelector(':scope > .body');
  if (body && quick && quick.parentElement!==body) body.insertBefore(quick,body.firstChild);
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
