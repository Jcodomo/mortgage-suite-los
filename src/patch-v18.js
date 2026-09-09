/* v18 - NY Loan Estimate reference fees and theme/input-tone presets. */
(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
function N(v){v=parseFloat(String(v==null?'':v).replace(/[$,%\s]/g,''));return isFinite(v)?v:0;}
function suite(){try{return window.mortgageSuite&&window.mortgageSuite.store;}catch(e){return null;}}
function say(a,b,k){if(window.LOS&&LOS.say)LOS.say(a,b,k||'good',6500);else if(window.toast)toast(a+(b?' - '+b:''));}
var V=window.V18={version:'18.0',activeId:''};
V.REFERENCE={
  homestyle:{label:'NY HomeStyle LE reference',loan:725016,price:690000,sectionC:3841,ownerTitle:3172,lenderTitle:894,b:[640,0,117,6,450,225,90,399],c:[['Title - Bankruptcy Search',240],['Title - Endorsements',250],['Title - Escrow Fee',50],["Title - Lender's Title Insurance",null],['Title - Municipal Lien Search',825],['Title - Sales Tax',87],['Title - Settlement Fee',1495],['Title - Attorney Fee',0],['Title - Survey Inspection',0]]},
  fha203k:{label:'NY FHA 203(k) LE reference',loan:615580,price:551200,sectionC:4159,ownerTitle:2200,lenderTitle:1018,b:[910,250,117,6,1125,225,90,399],c:[['Title - Courier/Shipping',100],['Title - Endorsements',200],['Title - Title Update Fee',350],["Title - Lender's Title Insurance",null],['Title - Title Search/Abstract',991],['Title - Sales Tax',0],['Title - Settlement Fee',1500],['Title - Attorney Fee',0],['Title - Survey Inspection',0]]}
};
function referenceFor(i){return i.loanProgram==='FHA'?V.REFERENCE.fha203k:V.REFERENCE.homestyle;}
function rounded(v){return Math.round(N(v));}
function feeRows(sec){return window.V14&&V14.FEES?V14.FEES.filter(function(f){return f.sec===sec;}):[];}
function model(){var st=suite(),i=st&&st.activeInputs,o=st&&st.outputs;if(!st)return null;var ref=referenceFor(i),loan=N(o.loan&&o.loan.totalLoan)||N(o.loan&&o.loan.baseLoan),price=N(i.basePurchasePrice),lender=rounded((loan/ref.loan)*ref.lenderTitle),owner=rounded((price/ref.price)*ref.ownerTitle);return{st:st,i:i,ref:ref,loan:loan,price:price,lenderTitle:lender,ownerTitle:owner};}
function setReferenceRows(m){var a=feeRows('A'),b=feeRows('B'),c=feeRows('C'),h=feeRows('H');if(a[0]){a[0].name='Origination / Processing / Underwriting';a[0].amount=2250;a[0].fixed=true;}m.ref.b.forEach(function(v,j){if(b[j])b[j].amount=v;});m.ref.c.forEach(function(row,j){if(c[j]){c[j].name=row[0];c[j].amount=row[1]===null?m.lenderTitle:row[1];}});var owner=h.filter(function(f){return /Owner's Title Insurance/i.test(f.name);})[0];if(owner)owner.amount=m.ownerTitle;}
function sumMap(map){return (window.V14&&V14.FEES||[]).filter(function(f){return f.map===map;}).reduce(function(a,f){return a+N(f.amount);},0);}
V.applyNYEstimate=function(quiet){var m=model();if(!m)return;if(m.i.state!=='New York')return say('New York reference not applied','Select New York to use the two attached Loan Estimate profiles.','warn');setReferenceRows(m);var ov=m.i.closing.overrides;ov.lenderOrigination=2250;ov.lenderProcessing=0;ov.appraisal=sumMap('appraisal');ov.creditReport=sumMap('creditReport');ov.floodTaxService=sumMap('floodTaxService');ov.inspections=sumMap('inspections');ov.titleInsurance=sumMap('titleInsurance');ov.titleSearchSettlement=sumMap('titleSearchSettlement');ov.attorney=0;ov.survey=0;ov.other=sumMap('other');var renoInspect=(window.V14&&V14.FEES||[]).filter(function(f){return f.reno==='inspectionFees';})[0],renoTitle=(window.V14&&V14.FEES||[]).filter(function(f){return f.reno==='titleUpdateFees';})[0];if(renoInspect)m.i.reno.inspectionFees=N(renoInspect.amount);if(renoTitle)m.i.reno.titleUpdateFees=N(renoTitle.amount);m.i.v18NyLeFeeEstimate={version:1,profile:m.ref.label,referenceSectionC:m.ref.sectionC,referenceLoan:m.ref.loan,referencePrice:m.ref.price,appliedAt:new Date().toISOString()};m.st.emit();if(window.V14&&V14.renderFees)V14.renderFees();decorateFeeCards();if(!quiet)say('NY reference estimate applied',m.ref.label+' now fills the supported itemized and Closing fields.');};
function autoEstimate(){var st=suite();if(!st||!st.activeInputs||st.activeInputs.state!=='New York')return;var id=st.snapshot.activeScenarioId||'';if(V.activeId!==id){V.activeId=id;var marker=st.activeInputs.v18NyLeFeeEstimate;if(!marker)V.applyNYEstimate(true);else{var m=model();if(m){setReferenceRows(m);if(window.V14&&V14.renderFees)V14.renderFees();}}}}

function decorateFeeCards(){
  $$('[onclick*="searchClosingFees"]').forEach(function(x){x.remove();});
  var fs=$('v17FeeSources');if(fs){$$('a',fs).forEach(function(x){x.remove();});var span=fs.querySelector('span');if(span)span.textContent='New York estimates use the matching attached HomeStyle or FHA 203(k) Loan Estimate profile. Lender and optional owner title premiums scale with the active loan and price; the remaining reference charges use the sample amounts.';if(!$('v18FeeApply')){var b=document.createElement('button');b.id='v18FeeApply';b.className='btn btn-primary';b.textContent='Apply NY LE best estimate';b.onclick=function(){V.applyNYEstimate(false);};fs.appendChild(b);}}
  var cs=$('v17ClosingFeeSource');if(cs){var cspan=cs.querySelector('span');if(cspan)cspan.textContent='New York title and settlement estimates use the matching attached HomeStyle or FHA 203(k) Loan Estimate. Use the itemized sheet to review or change every amount.';if(!$('v18ClosingApply')){var cb=document.createElement('button');cb.id='v18ClosingApply';cb.className='btn btn-primary';cb.textContent='Refresh NY LE estimate';cb.onclick=function(){V.applyNYEstimate(false);};cs.appendChild(cb);}}
}

/* Theme presets include their field tone: light, light-on-dark, blue-on-navy,
   and dark-on-black. Both application buttons continue to control one skin. */
var TONE=V.TONE={light:'Light fields',dark:'Light fields',navy:'Blue fields',oled:'Dark fields'};
function paintThemeTone(){if(window.V17&&V17.paintThemeButtons)V17.paintThemeButtons();}
function boot(){if(!window.V14||!window.V17)return false;autoEstimate();decorateFeeCards();paintThemeTone();return true;}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();setInterval(boot,450);
})();
