/* v22 - stable scenario controls and polished calculation metric controls. */
(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
function store(){try{return window.mortgageSuite&&window.mortgageSuite.store;}catch(e){return null;}}
var V=window.V22={version:'22.0'};
var ICONS=[
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9 20v-5h6v5"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9l8-5 8 5v10"/><path d="M8 13h8M8 16h8M8 19h8"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 14h4"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M4 19h16"/><path d="m7 15 4-4 3 2 5-6"/></svg>'
];
V.polishMetrics=function(){var root=$('v20Setup');if(!root)return;var buttons=root.querySelectorAll('.v20-kpis>button');Array.prototype.forEach.call(buttons,function(button,index){if(!button.querySelector('.v22-metric-icon')){var icon=document.createElement('span');icon.className='v22-metric-icon';icon.innerHTML=ICONS[index]||ICONS[2];button.insertBefore(icon,button.firstChild);var note=document.createElement('span');note.className='v22-metric-note';note.setAttribute('aria-hidden','true');button.appendChild(note);}var label=button.querySelector('span:not(.v22-metric-icon):not(.v22-metric-note)');button.setAttribute('aria-label',(label?label.textContent:'Calculation')+'. Open details');});};
function signature(){var s=store();if(!s)return'';var i=s.activeInputs||{},o=s.outputs||{};return JSON.stringify([s.snapshot&&s.snapshot.mode,i.borrowerName,i.propertyAddress,i.zipCode,i.state,i.nyCounty,i.basePurchasePrice,i.asIsValue,i.afterRepairValue,i.finalDownPaymentPct,i.reno&&i.reno.baseCost,o.value&&o.value.valueBasis,o.loan&&o.loan.maximumBaseLoan,o.loan&&o.loan.totalLoan]);}
function installStableSetup(){if(!window.V20||!V20.renderSetup||V20.renderSetup.__v22)return;var original=V20.renderSetup,last='';V20.renderSetup=function(force){var active=document.activeElement,editing=active&&/^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName)&&active.closest&&active.closest('#v20Setup');var next=signature(),existing=$('v20Setup');if(!force&&existing&&(editing||next===last)){V.polishMetrics();return;}original();last=signature();V.polishMetrics();};V20.renderSetup.__v22=true;V20.renderSetup(true);}
V.enforceDirectRoute=function(){
  if(V.routeApplied)return true;
  var query=new URLSearchParams(location.search),app=query.get('app'),tab=query.get('tab');
  if(!app&&!tab){V.routeApplied=true;return true;}
  var target=app==='income'?'calc':'suite',shell=null;
  try{
    if(!window.SHELL&&typeof SHELL!=='undefined')window.SHELL=SHELL;
    shell=window.SHELL||null;
  }catch(e){}
  if(shell&&typeof shell.go==='function')shell.go(target);
  else{
    var fallback=$(target==='calc'?'mode-calc':'mode-suite');
    if(fallback)fallback.click();else return false;
  }
  if(target==='suite'){
    var s=store();if(!s)return false;
    var destination=tab||'setup';
    if(s.snapshot&&s.snapshot.mode!==destination)s.navigate({tab:destination,section:destination});
  }
  document.body.dataset.shellMode=target;
  V.routeApplied=true;
  return true;
};
function boot(){try{var release=parseFloat(document.documentElement.dataset.losRelease||'0');if(!isFinite(release)||release<22)document.documentElement.dataset.losRelease='22';V.enforceDirectRoute();installStableSetup();V.polishMetrics();}catch(e){if(console&&console.warn)console.warn('v22 enhancement',e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();setInterval(boot,1200);
})();
