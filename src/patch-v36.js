/* =====================================================================
   v36 — quieter loan workspace and reviewed asset-statement intake.
   This layer changes presentation and review workflow only. Mortgage and
   income calculations continue to run through the existing engines.
   ===================================================================== */
(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
var $$=function(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));};
var V=window.V36=window.V36||{version:'36.0',assetAgency:'AUTO',assetReview:null};
function text(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
function esc(v){return String(v==null?'':v).replace(/[&<>\"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}
function num(v){var n=parseFloat(String(v==null?'':v).replace(/[$,%\s,]/g,''));return isFinite(n)?n:0;}
function money(v){var n=num(v);return(n<0?'-':'')+'$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});}
function suite(){try{return window.mortgageSuite&&mortgageSuite.store;}catch(e){return null;}}
function incomeState(){try{return window.S||eval('S');}catch(e){return null;}}
function lexical(name){try{return eval(name);}catch(e){return null;}}
function incomeAgency(){var s=incomeState();return V.assetAgency==='AUTO'?(s&&s.agency||'FNMA'):V.assetAgency;}
function announce(title,detail){if(window.LOS&&LOS.say)LOS.say(title,detail||'', 'good',4200);}

/* The summary keeps acquisition and loan results. Live planning moves next,
   while the verbose ratio/payment/cash/reserve/term blocks remain available
   in their focused workspaces and Full form. */
function simplifyRail(){
  var rail=document.querySelector('#suite-root .cols-main>.rail'),card=rail&&rail.querySelector(':scope>.card'),body=card&&card.querySelector(':scope>.body'),live=$('v35LiveDetails');
  if(!rail||!card||!body)return;
  var hiding=false,cut=null;
  Array.prototype.slice.call(body.children).forEach(function(node){
    var label=node.classList.contains('sec-head')?text(node.textContent).toLowerCase():'';
    if(/^(ratios?|monthly payment|leverage|cash and costs|cash to close|reserves?|terms|checks)$/.test(label)){hiding=true;if(!cut)cut=node;}
    if(hiding)node.dataset.v36RailHidden='1';else node.removeAttribute('data-v36-rail-hidden');
  });
  if(live){
    live.removeAttribute('data-v36-rail-hidden');
    if(live.parentNode!==body||live.nextSibling!==cut)body.insertBefore(live,cut||null);
  }
  card.dataset.v36Simplified='1';
}

/* A compact Live control sits beside the one Actions control. Reusing the
   existing summary action preserves all established click/edit behavior. */
function installLiveButton(){
  var actions=document.querySelector('#suite-root .v34-right'),anchor=$('v35Btn');if(!actions||!anchor)return;
  var b=$('v36LiveButton');
  if(!b){b=document.createElement('button');b.id='v36LiveButton';b.type='button';b.className='v36-live-button';b.innerHTML='<span aria-hidden="true" class="v36-pulse-icon"><i></i><i></i><i></i></span><span>Live</span>';b.title='Open the live planning summary';b.onclick=function(){if(window.V35&&V35.focusSummary)V35.focusSummary();};actions.insertBefore(b,anchor);}
  if(b.nextSibling!==anchor)actions.insertBefore(b,anchor);
}

/* Full form gets an anchored page index directly beneath the primary File →
   Documents navigation. It wraps into real rows instead of horizontal scroll. */
function organizeFullNav(){
  var root=$('suite-root'),index=document.querySelector('.v251-full-index'),primary=$('v23SuitePrimaryNav'),host=$('v36FullNavHost');
  if(root&&root.classList.contains('v251-full-active')&&index&&primary){
    if(!host){host=document.createElement('div');host.id='v36FullNavHost';host.className='v36-full-nav-host no-print';primary.parentNode.insertBefore(host,primary.nextSibling);}
    if(index.parentNode!==host)host.appendChild(index);
    host.classList.add('on');
  }else if(host&&!(root&&root.classList.contains('v251-full-active'))){host.remove();}
}

/* The contextual Property control used to inherit several pulse/transition
   rules. Mark it once and let CSS keep its geometry stable. */
function stabilizeProperty(){
  $$('#suite-root button,#suite-root .tab').forEach(function(node){if(text(node.textContent).toUpperCase()==='PROPERTY')node.classList.add('v36-stable-property');});
}

function installFooter(){
  var root=$('suite-root');if(!root)return;var foot=$('v36SuiteFooter');
  if(!foot){foot=document.createElement('footer');foot.id='v36SuiteFooter';foot.className='v36-suite-footer no-print';foot.innerHTML='<div><b>Mortgage Suite</b><span>Live calculations · browser autosave</span></div><button type="button" onclick="if(window.V35)V35.go(\'quote\')">Return to Quote</button>';root.appendChild(foot);}
}

/* Assets remains part of Qualification. Earlier compact navigation omitted
   it from the visible subgroup even though the worksheet still existed. */
function exposeAssetsTab(){
  var root=$('calc-root'),primary=$('v23CalcPrimaryNav'),group=primary&&primary.querySelector('[data-group="qualification"]'),bar=$('tabbar');if(!root||!group||!bar)return;var tab=$('v36AssetsTab');
  if(!tab){tab=document.createElement('button');tab.id='v36AssetsTab';tab.type='button';tab.className='tab v36-assets-tab';tab.dataset.tab='v36assets';tab.innerHTML='<span aria-hidden="true" class="v23-nav-icon i-coins"><i></i></span><span>Assets</span>';tab.onclick=function(){var switcher=lexical('switchTab');if(switcher)switcher('other');if(window.V3&&V3.sub)V3.sub('other','assets',[['other','Other income'],['assets','Assets']]);var other=$('panel-other'),assets=$('panel-assets');if(other){other.classList.remove('active');other.classList.add('los-hidden');}if(assets){assets.classList.add('active');assets.classList.remove('los-hidden');}$$('#tabbar .tab').forEach(function(x){x.classList.toggle('active',x===tab);});};bar.appendChild(tab);}
  var active=group.getAttribute('aria-current')==='page'||group.classList.contains('active');root.classList.toggle('v36-qualification-active',active);if(active)tab.dataset.v23Visible='1';
  var dti=document.querySelector('#calc-root nav.tabbar .tab[data-tab="dti"]');if(active&&dti&&tab.previousElementSibling!==dti)dti.parentNode.insertBefore(tab,dti.nextSibling);
}

/* ----------------------- asset guideline summary -------------------- */
var ACCOUNT_NAMES={checking:'Checking / savings',mm:'Money market / CD',stocks:'Stocks / bonds / mutual funds',ret59:'Retirement — accessible',ret:'Retirement — early withdrawal',trust:'Trust / vested assets',other:'Other asset'};
var GUIDES={
 FNMA:{name:'Fannie Mae',divisor:'360 months or the note term used by the file',income:'Potential asset-depletion income only when the product permits it and ownership, access, funds-to-close, reserves and any penalties are documented.',reserve:'Verified liquid funds may support closing and reserves after required deductions.'},
 FHLMC:{name:'Freddie Mac',divisor:'240 months in this worksheet',income:'Potential asset-depletion income only when the product permits it and eligible net assets are documented.',reserve:'Verified accessible funds may support closing and reserves after required deductions.'},
 FHA:{name:'FHA',divisor:'Not used for effective income',income:'This worksheet does not use asset depletion as FHA effective income.',reserve:'Verified acceptable assets may still support closing funds and required reserves.'}
};
function accountUse(type,agency){
  var liquid=type==='checking'||type==='mm',market=type==='stocks',ret=type==='ret59'||type==='ret',trust=type==='trust';
  if(agency==='FHA')return{income:'No — not asset-depletion income',assets:(liquid?'Usually liquid; verify source and access':market?'Use verified current value and required haircut':ret?'Use vested accessible amount, net of restrictions':'Review ownership, access and program eligibility')};
  return{income:liquid?'Review — product-specific depletion eligibility':market?'Potentially, after the worksheet haircut':ret?'Potentially, using vested accessible value':trust?'Review trust access and distribution terms':'Manual underwriting review',assets:liquid?'Generally usable when verified':market?'Usable after market-value haircut':ret?'Use vested accessible amount, net of penalties':'Verify ownership, access and restrictions'};
}
function assetRows(){var s=incomeState();return s&&s.assets&&Array.isArray(s.assets.rows)?s.assets.rows:[];}
function assetSummaryHtml(){
  var agency=incomeAgency(),g=GUIDES[agency]||GUIDES.FNMA,rows=assetRows();
  return '<div class="v36-agency-tabs">'+[['AUTO','Auto'],['FNMA','Fannie Mae'],['FHLMC','Freddie Mac'],['FHA','FHA']].map(function(x){return'<button type="button" class="'+(V.assetAgency===x[0]?'active':'')+'" onclick="V36.setAssetAgency(\''+x[0]+'\')">'+x[1]+'</button>';}).join('')+'</div><div class="v36-guide-lead"><b>'+esc(g.name)+' planning summary</b><span>Divisor: '+esc(g.divisor)+'</span><p><strong>Income:</strong> '+esc(g.income)+'</p><p><strong>Assets:</strong> '+esc(g.reserve)+'</p></div><div class="v36-account-summary">'+(rows.length?rows.map(function(r){var u=accountUse(r.type,agency);return'<article><div><b>'+esc(r.name||ACCOUNT_NAMES[r.type]||'Asset account')+'</b><span>'+esc(ACCOUNT_NAMES[r.type]||r.type||'Other')+' · '+money(r.bal)+'</span></div><p><strong>Income:</strong> '+esc(u.income)+'</p><p><strong>Closing / reserves:</strong> '+esc(u.assets)+'</p></article>';}).join(''):'<p class="v36-empty">Add an asset account to see an account-specific use summary.</p>')+'</div><small class="v36-guide-note">Planning summary only. Confirm eligibility and documentation against the selected program and current agency guide before underwriting.</small>';
}
V.setAssetAgency=function(value){V.assetAgency=value;var body=$('v36AssetGuideBody');if(body)body.innerHTML=assetSummaryHtml();paintInlineAssetSummary();};
V.openAssetGuidelines=function(){var modal=$('v36AssetGuideModal');if(!modal)return;modal.classList.add('open');$('v36AssetGuideBody').innerHTML=assetSummaryHtml();};
V.closeAssetGuidelines=function(){var modal=$('v36AssetGuideModal');if(modal)modal.classList.remove('open');};
function paintInlineAssetSummary(){var box=$('v36AssetUseSummary');if(box)box.innerHTML=assetSummaryHtml();}

function assetShell(){
  var panel=$('panel-assets');if(!panel)return;
  var head=panel.querySelector('.section-head'),old=head&&head.querySelector('[onclick="openGuide(\'assets\')"]');
  if(old){old.textContent='Agency asset guidelines';old.setAttribute('onclick','V36.openAssetGuidelines()');old.classList.add('v36-guideline-button');}
  if(!$('v36AssetUseSummary')){var summary=document.createElement('section');summary.id='v36AssetUseSummary';summary.className='v36-asset-use';panel.appendChild(summary);}
  if(!$('v36AssetOcr')){var ocr=document.createElement('section');ocr.id='v36AssetOcr';ocr.className='v36-asset-ocr no-print';ocr.innerHTML='<div class="v36-asset-title"><div><span>Reviewed import</span><h3>Asset statement OCR & large-deposit review</h3><p>Read a PDF or image, review the matched values, then choose whether to add the account.</p></div><label class="v36-upload"><input id="v36AssetFile" type="file" accept=".pdf,image/*,.txt" onchange="V36.readAssetFiles(this.files)"><span>Scan statement</span></label></div><div class="v36-asset-controls"><label>Large-deposit threshold <input id="v36DepositThreshold" type="text" inputmode="decimal" value="" placeholder="Auto"></label><button type="button" onclick="V36.buildLargeDepositPrompt()">Build AI prompt</button></div><div id="v36AssetReview" class="v36-asset-review"><p>No statement reviewed yet.</p></div>';panel.appendChild(ocr);}
  paintInlineAssetSummary();
  installAssetModals();
}
function installAssetModals(){
  if(!$('v36AssetGuideModal')){var g=document.createElement('div');g.id='v36AssetGuideModal';g.className='v36-modal no-print';g.innerHTML='<button class="v36-modal-backdrop" aria-label="Close" onclick="V36.closeAssetGuidelines()"></button><section role="dialog" aria-modal="true" aria-labelledby="v36AssetGuideTitle"><header><div><span>Income & asset use</span><h2 id="v36AssetGuideTitle">Agency asset guidelines</h2></div><button type="button" onclick="V36.closeAssetGuidelines()">×</button></header><div id="v36AssetGuideBody" class="v36-modal-body"></div></section>';document.body.appendChild(g);}
}
function defaultThreshold(){try{var calc=lexical('calcTotals'),total=calc&&calc(),mo=total&&num(total.total);if(mo>0)return mo*.5;}catch(e){}var s=suite();return Math.max(1000,num(s&&s.activeInputs&&s.activeInputs.basePurchasePrice)*.01);}
function amountTokens(line){var out=[],re=/\(?\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.\d{2})|[0-9]+\.\d{2})\)?/g,m;while((m=re.exec(line)))out.push(num(m[1]));return out;}
function parseAssetText(raw,name){
  var lines=String(raw||'').split(/\r?\n/).map(text).filter(Boolean),threshold=num(($('v36DepositThreshold')||{}).value)||defaultThreshold(),balance=0,institution='',owner='',account='',start='',end='',deposits=[];
  lines.forEach(function(line,idx){var amounts=amountTokens(line),lower=line.toLowerCase();
    if(!institution&&idx<18&&/bank|credit union|financial|securities|investments/.test(lower))institution=line.slice(0,80);
    if(!owner&&/account holder|primary owner|customer name/.test(lower))owner=text(line.split(/:|-/).slice(1).join(' '));
    if(!account&&/account (number|no\.?|ending)/.test(lower)){var m=line.match(/(?:ending|number|no\.?)[^0-9]*([x*\d-]{4,})/i);if(m)account=m[1];}
    if(/ending balance|closing balance|current balance|available balance/.test(lower)&&amounts.length)balance=amounts[amounts.length-1];
    var dates=line.match(/\b(?:0?[1-9]|1[0-2])[\/-](?:0?[1-9]|[12]\d|3[01])[\/-](?:\d{2}|\d{4})\b/g);if(/statement period|period beginning|from/.test(lower)&&dates&&dates.length){start=dates[0];end=dates[1]||end;}if(/period ending|statement date|through/.test(lower)&&dates&&dates.length)end=dates[dates.length-1];
    if(/deposit|credit|ach credit|direct dep|mobile dep|transfer in/.test(lower)&&amounts.length){var amount=amounts[amounts.length-1];if(amount>0)deposits.push({date:dates&&dates[0]||'',description:line.slice(0,120),amount:amount,largeDeposit:amount>=threshold,sourceHint:'',confidence:/deposit|direct dep|ach credit/.test(lower)?'High':'Review'});}
  });
  if(!balance){for(var j=lines.length-1;j>=0;j--){var a=amountTokens(lines[j]);if(a.length){balance=a[a.length-1];break;}}}
  return{schemaVersion:'mortgage-suite.asset-statement.v1',fileName:name||'',institution:institution,accountName:account,accountType:'checking',owner:owner,statementStart:start,statementEnd:end,beginningBalance:0,endingBalance:balance,threshold:threshold,deposits:deposits,notes:[],reviewState:balance?'Auto-matched':'Needs Review'};
}
async function readOne(file){
  var pdfReader=lexical('pdfText'),pageImages=lexical('pdfPageImages'),ocrReader=lexical('ocrImages');
  if(/\.pdf$/i.test(file.name)){if(!pdfReader)throw new Error('PDF reader is unavailable.');var r=await pdfReader(file);var t=r.text||'';if(t.replace(/\s/g,'').length<40&&pageImages&&ocrReader)t=await ocrReader(await pageImages(r.pdf,6));return t;}
  if(/^image\//.test(file.type)){if(!ocrReader)throw new Error('OCR engine is unavailable.');var img=await new Promise(function(resolve,reject){var i=new Image();i.onload=function(){resolve(i);};i.onerror=reject;i.src=URL.createObjectURL(file);});return ocrReader([img]);}
  return file.text();
}
V.readAssetFiles=async function(files){var file=files&&files[0],box=$('v36AssetReview');if(!file||!box)return;box.innerHTML='<p class="v36-working">Reading '+esc(file.name)+'…</p>';try{var raw=await readOne(file);V.assetReview=parseAssetText(raw,file.name);V.assetReview.rawText=raw.slice(0,16000);renderAssetReview();}catch(e){box.innerHTML='<p class="v36-error">Could not read this statement: '+esc(e.message||e)+'</p>';}};
function renderAssetReview(){
  var r=V.assetReview,box=$('v36AssetReview');if(!r||!box)return;var large=(r.deposits||[]).filter(function(d){return d.largeDeposit;});
  box.innerHTML='<div class="v36-review-badges"><span class="'+(r.reviewState==='Auto-matched'?'matched':'review')+'">'+esc(r.reviewState)+'</span><span>'+esc(r.fileName||'Imported JSON')+'</span></div><div class="v36-review-grid">'+[['Institution','institution'],['Account / last four','accountName'],['Owner','owner'],['Statement start','statementStart'],['Statement end','statementEnd'],['Ending balance','endingBalance']].map(function(x){return'<label><span>'+x[0]+'</span><input type="text" '+(x[1]==='endingBalance'?'inputmode="decimal"':'')+' data-v36-review="'+x[1]+'" value="'+esc(r[x[1]])+'"></label>';}).join('')+'<label><span>Account type</span><select data-v36-review="accountType">'+Object.keys(ACCOUNT_NAMES).map(function(k){return'<option value="'+k+'" '+(r.accountType===k?'selected':'')+'>'+esc(ACCOUNT_NAMES[k])+'</option>';}).join('')+'</select></label></div><div class="v36-deposits"><header><div><b>Large-deposit scan</b><span>'+large.length+' at or above '+money(r.threshold)+'</span></div><button type="button" onclick="V36.buildLargeDepositPrompt()">AI review JSON prompt</button></header>'+(large.length?'<table><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Review</th></tr></thead><tbody>'+large.map(function(d){return'<tr><td>'+esc(d.date||'—')+'</td><td>'+esc(d.description)+'</td><td>'+money(d.amount)+'</td><td>'+esc(d.confidence||'Review')+'</td></tr>';}).join('')+'</tbody></table>':'<p>No deposits met the current threshold. Review the transaction text before relying on this result.</p>')+'</div><div class="v36-review-actions"><button type="button" onclick="V36.applyAssetReview()">Add reviewed account</button><button type="button" onclick="V36.buildLargeDepositPrompt()">Open AI prompt</button></div>';
  $$('[data-v36-review]',box).forEach(function(input){input.addEventListener('change',function(){r[input.dataset.v36Review]=input.dataset.v36Review==='endingBalance'?num(input.value):input.value;r.reviewState='Manual Override';renderAssetReview();});});if(window.V19)V19.enhanceFreeform(box);
}
V.applyAssetReview=function(){var r=V.assetReview,s=incomeState();if(!r||!s||!s.assets)return;var makeId=lexical('uid'),render=lexical('renderAssets'),recalc=lexical('RECALC'),row={id:(makeId?makeId():String(Date.now())),name:text((r.institution||'Asset account')+(r.accountName?' · '+r.accountName:'')),type:r.accountType||'checking',bal:num(r.endingBalance),elig:(r.accountType==='stocks'||r.accountType==='ret59'?70:r.accountType==='ret'?60:100)};s.assets.rows.push(row);if(render)render();if(recalc)recalc();setTimeout(function(){assetShell();paintInlineAssetSummary();},40);announce('Asset added','The reviewed ending balance was added without overwriting existing accounts.');};
function promptText(){var r=V.assetReview||{threshold:num(($('v36DepositThreshold')||{}).value)||defaultThreshold(),rawText:''};return 'Review this asset statement for mortgage underwriting support. Return JSON only. Do not infer missing values. A large deposit means a positive deposit at or above the supplied editable threshold.\n\nJSON schema:\n{\n  "schemaVersion":"mortgage-suite.asset-statement.v1",\n  "institution":"",\n  "accountName":"",\n  "accountType":"checking|mm|stocks|ret59|ret|trust|other",\n  "owner":"",\n  "statementStart":"YYYY-MM-DD or blank",\n  "statementEnd":"YYYY-MM-DD or blank",\n  "beginningBalance":0,\n  "endingBalance":0,\n  "threshold":'+num(r.threshold)+',\n  "deposits":[{"date":"","description":"","amount":0,"largeDeposit":false,"sourceHint":"","confidence":"High|Review"}],\n  "notes":[]\n}\n\nStatement text:\n'+String(r.rawText||'Paste or OCR the statement text here.').slice(0,14000);}
V.buildLargeDepositPrompt=function(){var modal=$('v36AssetAiModal');if(!modal){modal=document.createElement('div');modal.id='v36AssetAiModal';modal.className='v36-modal no-print';modal.innerHTML='<button class="v36-modal-backdrop" aria-label="Close" onclick="V36.closeAssetAI()"></button><section role="dialog" aria-modal="true"><header><div><span>Structured review</span><h2>Large-deposit AI prompt</h2></div><button type="button" onclick="V36.closeAssetAI()">×</button></header><div class="v36-modal-body"><label class="v36-ai-field"><span>Copy this prompt</span><textarea id="v36AssetPrompt"></textarea></label><div class="v36-ai-buttons"><button type="button" onclick="V36.copyAssetPrompt()">Copy prompt</button></div><label class="v36-ai-field"><span>Paste returned JSON for review</span><textarea id="v36AssetJson" placeholder="{ &quot;schemaVersion&quot;: &quot;mortgage-suite.asset-statement.v1&quot;, ... }"></textarea></label><button type="button" class="v36-primary" onclick="V36.reviewAssetJson()">Review JSON</button><p id="v36AssetJsonStatus"></p></div></section>';document.body.appendChild(modal);}modal.classList.add('open');$('v36AssetPrompt').value=promptText();};
V.closeAssetAI=function(){var m=$('v36AssetAiModal');if(m)m.classList.remove('open');};
V.copyAssetPrompt=function(){var t=$('v36AssetPrompt');if(!t)return;t.select();try{navigator.clipboard.writeText(t.value);}catch(e){document.execCommand('copy');}announce('Prompt copied','Paste it into your preferred assistant, then return the JSON here.');};
V.reviewAssetJson=function(){var status=$('v36AssetJsonStatus');try{var data=JSON.parse($('v36AssetJson').value);if(data.schemaVersion!=='mortgage-suite.asset-statement.v1')throw new Error('Unsupported schema version.');if(!Array.isArray(data.deposits))throw new Error('Deposits must be an array.');V.assetReview=data;V.assetReview.fileName='AI-reviewed JSON';V.assetReview.reviewState='Needs Review';V.closeAssetAI();renderAssetReview();}catch(e){if(status)status.textContent='JSON not applied: '+(e.message||e);}};

function documentsAssetPrompt(){
  var bar=document.querySelector('#v14Prompts .v14-bar');if(!bar||$('v36AssetPromptButton'))return;var b=document.createElement('button');b.id='v36AssetPromptButton';b.type='button';b.className='btn btn-light btn-sm';b.textContent='Asset statement / large deposits';b.onclick=function(){if(window.SHELL&&SHELL.go)SHELL.go('calc');var switcher=lexical('switchTab');if(switcher)switcher('assets');setTimeout(function(){var assets=$('panel-assets');if(assets)assets.scrollIntoView({behavior:'smooth',block:'start'});V.buildLargeDepositPrompt();},120);};bar.appendChild(b);
}

function mark(){document.documentElement.dataset.losRelease='36';}
function enhance(){try{mark();installLiveButton();simplifyRail();organizeFullNav();stabilizeProperty();installFooter();exposeAssetsTab();assetShell();documentsAssetPrompt();}catch(e){if(window.console&&console.warn)console.warn('v36 enhancement',e);}}
document.addEventListener('keydown',function(e){if(e.key==='Escape'){V.closeAssetGuidelines();V.closeAssetAI();}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
if(window.LOS_SCHEDULER)LOS_SCHEDULER.add(enhance,950);else setInterval(enhance,950);
})();
