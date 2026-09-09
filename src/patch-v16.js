/* v16 - template-matched lease, document PDFs, and workflow polish. */
(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
function N(v){v=parseFloat(String(v==null?'':v).replace(/[$,%\s]/g,''));return isFinite(v)?v:0;}
function esc(s){return String(s==null?'':s).replace(/[&<>\"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}
function money(v){var n=N(v);return(n<0?'-':'')+'$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
function suite(){try{return window.mortgageSuite&&window.mortgageSuite.store;}catch(e){return null;}}
function calcState(){try{return(0,eval)('S');}catch(e){return null;}}
function say(a,b,k){if(window.LOS&&LOS.say)LOS.say(a,b,k||'good',6500);else if(window.toast)toast(a+(b?' - '+b:''));}
function pretty(v){return window.V15&&V15.prettyDate?V15.prettyDate(v):String(v||'');}
function parseDate(v){return window.V15&&V15.parseDate?V15.parseDate(v):String(v||'');}
var V=window.V16={version:'16.0'};

V.printDoc=function(id,title){if(window.V15&&V15.printNode)V15.printNode(id,title);};
V.downloadPdf=async function(id,title,fileName){
  var node=$(id);if(!node)return;
  var ctor=(window.jspdf&&window.jspdf.jsPDF)||window.jsPDF;
  if(typeof html2canvas==='undefined'||!ctor){V.printDoc(id,title);say('PDF renderer unavailable','The document-only print dialog opened instead.','warn');return;}
  var stage=document.createElement('div');stage.className='v16-pdf-stage';var clone=node.cloneNode(true);$$('.no-print,.v16-analysis-only',clone).forEach(function(x){x.remove();});stage.appendChild(clone);document.body.appendChild(stage);
  try{
    say('Building PDF',title+' is being prepared.');
    var canvas=await html2canvas(clone,{scale:2,backgroundColor:'#ffffff',logging:false,useCORS:true});
    var pdf=new ctor({unit:'pt',format:'letter',orientation:'portrait'}),renderH=612*canvas.height/canvas.width,pages=Math.max(1,Math.ceil(renderH/792));
    for(var i=0;i<pages;i++){if(i)pdf.addPage();pdf.addImage(canvas.toDataURL('image/jpeg',.95),'JPEG',0,-i*792,612,renderH,undefined,'FAST');}
    pdf.save((fileName||title||'document').replace(/[\\/:*?\"<>|]/g,'').replace(/\s+/g,' ').trim()+'.pdf');say('PDF downloaded',title+' only was exported.');
  }catch(e){V.printDoc(id,title);say('PDF fallback','The document-only print dialog opened.','warn');}
  finally{stage.remove();}
};

function actionButton(text,cls,fn){var b=document.createElement('button');b.type='button';b.className='btn '+(cls||'btn-light')+' btn-sm';b.textContent=text;b.onclick=fn;return b;}
function headerActions(modalId,nodeId,label,fileName){
  var m=$(modalId),head=m&&m.querySelector('.v13-head');if(!head)return;
  var id='v16Actions'+modalId;if($(id))return;
  $$('button',head).forEach(function(b){if(/^Print(?: statement only)?$/i.test((b.textContent||'').trim()))b.style.display='none';});
  var w=document.createElement('span');w.id=id;w.className='v16-head-actions';w.appendChild(actionButton('Print '+label,'btn-light',function(){V.printDoc(nodeId,label);}));w.appendChild(actionButton('Download '+label+' PDF','btn-primary',function(){V.downloadPdf(nodeId,label,fileName);}));var close=$$('button',head).filter(function(b){return/^Close$/i.test((b.textContent||'').trim());})[0];head.insertBefore(w,close||null);
}

function freeformInputs(root){
  if(!root)return;$$('input[type="number"]',root).forEach(function(el){el.type='text';el.inputMode='decimal';el.autocomplete='off';});
  $$('input[type="date"]',root).forEach(function(el){if(window.V15){el.dataset.v15Key=el.dataset.v15Key||'';}el.type='text';el.placeholder='MM/DD/YYYY';el.autocomplete='off';});
}

/* Match the supplied fillable one-page lease: its 15 fields and six sections. */
function leaseDefaults(){var x=V14.LEASE,d={agreementDate:'',landlordAddress:'',propertyType:'Single-family',otherPropertyType:'',paymentInstructions:'',securityRequired:'yes',returnDays:'',landlordPrinted:'',tenantPrinted:'',landlordSignDate:'',tenantSignDate:''};Object.keys(d).forEach(function(k){if(x[k]==null)x[k]=d[k];});return x;}
function lfield(label,key,val,cls,kind){var v=kind==='date'?pretty(val):val;return '<div class="field '+(cls||'')+'"><label>'+label+'</label><input class="cell-input" type="text" '+(kind==='money'||kind==='number'?'inputmode="decimal" ':'')+'value="'+esc(v||'')+'" placeholder="'+(kind==='date'?'MM/DD/YYYY':'')+'" onchange="V16.leaseSet(\''+key+'\',this.value,\''+(kind||'text')+'\')"></div>';}
V.leaseSet=function(key,value,kind){var x=leaseDefaults();if(kind==='date'){var d=parseDate(value);if(value.trim()&&!d){say('Check the date','Use a date such as 9/30/2026.','warn');V.renderLease();return;}x[key]=d;}else if(kind==='money'||kind==='number')x[key]=value;else x[key]=value;V.renderLease();};
function line(v,cls){return '<span class="line '+(cls||'')+'">'+(esc(v)||'&nbsp;')+'</span>';}
function box(on){return '<span class="box">'+(on?'X':'&nbsp;')+'</span>';}
V.renderLease=function(){
  if(!window.V14||!V14.LEASE)return;var x=leaseDefaults(),h=$('v14LeaseBody');if(!h)return;
  var inputs='<div class="v14-doc-inputs no-print"><div class="v14-formgrid">'+
    lfield('Agreement date','agreementDate',x.agreementDate,'','date')+lfield('Landlord name','landlord',x.landlord,'span2')+lfield('Landlord mailing address','landlordAddress',x.landlordAddress,'span2')+lfield('Tenant name(s)','tenant',x.tenant,'span2')+lfield('Rental property address','property',x.property,'span4')+
    '<div class="field"><label>Residence type</label><select class="cell-input" onchange="V16.leaseSet(\'propertyType\',this.value,\'text\')"><option'+(x.propertyType==='Single-family'?' selected':'')+'>Single-family</option><option'+(x.propertyType==='Apartment'?' selected':'')+'>Apartment</option><option'+(x.propertyType==='Condominium'?' selected':'')+'>Condominium</option><option'+(x.propertyType==='Other'?' selected':'')+'>Other</option></select></div>'+lfield('Other residence type','otherPropertyType',x.otherPropertyType)+lfield('Lease start','start',x.start,'','date')+lfield('Lease end','end',x.end,'','date')+lfield('Monthly rent','rent',x.rent,'','money')+lfield('Rent due day','dueDay',x.dueDay,'','text')+
    '<div class="field span2"><label>Rent payment instructions</label><textarea class="cell-input" rows="2" onchange="V16.leaseSet(\'paymentInstructions\',this.value,\'text\')">'+esc(x.paymentInstructions)+'</textarea></div><div class="field"><label>Security deposit required?</label><select class="cell-input" onchange="V16.leaseSet(\'securityRequired\',this.value,\'text\')"><option value="yes"'+(x.securityRequired!=='no'?' selected':'')+'>Yes</option><option value="no"'+(x.securityRequired==='no'?' selected':'')+'>No</option></select></div>'+lfield('Security deposit','deposit',x.deposit,'','money')+lfield('Deposit return days','returnDays',x.returnDays,'','number')+lfield('Landlord printed name','landlordPrinted',x.landlordPrinted)+lfield('Tenant printed name','tenantPrinted',x.tenantPrinted)+lfield('Landlord signature date','landlordSignDate',x.landlordSignDate,'','date')+lfield('Tenant signature date','tenantSignDate',x.tenantSignDate,'','date')+
    '</div><div class="v14-bar" style="margin-top:10px"><button class="btn btn-light" onclick="V14.pickDocOCR(\'LEASE\')">OCR lease fields</button></div></div>';
  var typ=x.propertyType||'Other',deposit=x.securityRequired!=='no';
  var doc='<div class="v16-lease-sheet" id="v16LeaseStatement"><h1>RESIDENTIAL LEASE AGREEMENT</h1><div class="lease-section"><p><span class="secnum">1. &nbsp;PARTIES.</span> This Residential Lease Agreement ("Agreement") made this '+line(pretty(x.agreementDate))+' is between:</p><p>Landlord Name: '+line(x.landlord,'long')+' with a mailing address</p><p>of: '+line(x.landlordAddress,'long')+' ("Landlord"), AND</p><p>Tenant Name(s): '+line(x.tenant,'long')+' ("Tenant(s)"). Landlord and Tenant are each collectively referred to as the "Parties."</p></div><div class="lease-section"><p><span class="secnum">2. &nbsp;PROPERTY.</span> The Landlord agrees to lease the described property to the Tenant:</p><p>Address: '+line(x.property,'long')+' ("Premises").</p><p>Residence Type: '+box(typ==='Single-family')+'Single-family '+box(typ==='Apartment')+'Apartment '+box(typ==='Condominium')+'Condominium '+box(typ==='Other')+'Other: '+line(x.otherPropertyType)+'</p></div><div class="lease-section"><p><span class="secnum">3. &nbsp;TERM.</span></p><p>The Agreement shall begin on '+line(pretty(x.start),'med')+' and end on '+line(pretty(x.end),'med')+' ("Term").</p></div><div class="lease-section"><p><span class="secnum">4. &nbsp;RENT.</span></p><p>The Tenant shall pay the Landlord in equal monthly installments of $'+line(x.rent?N(x.rent).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):'')+' ("Rent"). The Rent shall be due on the '+line(x.dueDay)+' of every month and paid under the following instructions:</p><p>'+line(x.paymentInstructions,'long')+'.</p></div><div class="lease-section"><p><span class="secnum">5. &nbsp;SECURITY DEPOSIT.</span> The Tenant (check one):</p><p>'+box(deposit)+'Shall deposit with the Landlord the sum of $'+line(deposit&&x.deposit?N(x.deposit).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):'')+' as security for any damage caused to the Premises during the Term. Such deposit shall be returned to the Tenant, less any itemized deductions, within '+line(deposit?x.returnDays:'')+' days after the end of the Term.</p><p>'+box(!deposit)+'Shall NOT be required to pay a security deposit.</p></div><div class="lease-section"><p><span class="secnum">6. &nbsp;SIGNATURES.</span></p><div class="sigrow"><b>Landlord Signature:</b><div class="sigline"></div><span>Date:</span><div class="sigline">'+esc(pretty(x.landlordSignDate))+'</div></div><p>Printed Name: '+line(x.landlordPrinted||x.landlord,'med')+'</p><div class="sigrow"><b>Tenant Signature:</b><div class="sigline"></div><span>Date:</span><div class="sigline">'+esc(pretty(x.tenantSignDate))+'</div></div><p>Printed Name: '+line(x.tenantPrinted||x.tenant,'med')+'</p></div><div class="page-foot"><b>Residential Lease Agreement</b><span>Page 1 of 1</span></div></div>';
  h.innerHTML=inputs+doc;freeformInputs(h);headerActions('v14LeaseModal','v16LeaseStatement','lease','Residential Lease Agreement');
};

function wrapDocumentRenderer(name,bodyId,nodeId,label,fileName){if(!window.V14||!V14[name]||V14[name].__v16)return;var old=V14[name];var fn=function(){old();var h=$(bodyId),doc=h&&h.querySelector('.v14-doc');if(doc)doc.id=nodeId;freeformInputs(h);headerActions(bodyId==='v14AddBody'?'v14AddModal':'v14ConModal',nodeId,label,fileName);};fn.__v16=true;fn.__v15=true;V14[name]=fn;fn();}
function postPL(){var body=$('v13PlBody'),doc=body&&body.querySelector('.v14-doc');if(!doc)return;doc.id='v16PlStatement';var analyses=$$('.v15-analysis',body),analysis=analyses.pop();analyses.forEach(function(x){x.remove();});if(analysis){analysis.classList.add('no-print','v16-analysis-only');if(doc.contains(analysis))doc.parentNode.insertBefore(analysis,doc.nextSibling);}freeformInputs(body);var b=$('v15PlActions')&&$('v15PlActions').querySelector('.v15-pl-print-only');if(b){b.textContent='Print profit & loss';b.onclick=function(){V.printDoc('v16PlStatement','profit & loss');};}headerActions('v13PlModal','v16PlStatement','profit & loss','Profit and Loss Statement');}
function wrapPL(){if(!window.V14||!V14.renderPL)return;if(!V14.renderPL.__v16){var old=V14.renderPL;var fn=function(){old();postPL();};fn.__v16=true;fn.__v15=true;V14.renderPL=fn;}postPL();}

V.setPayStyle=function(style){if(window.V13)V13._payStyle=style;try{if(typeof paintPaystub==='function')paintPaystub();else if(window.paintPaystub)window.paintPaystub();}catch(e){}};
function payStyles(){
  /* The pay statement rerenders live.  Reuse one toolbar instead of appending
     a fresh v16 toolbar on every 700ms enhancement pass. */
  var bars=$$('#v16PayStyles');bars.slice(1).forEach(function(x){x.remove();});
  var h=$('v13PayStyles')||bars[0];
  if(!h){var stage=$('psStage');if(!stage)return;h=document.createElement('div');h.id='v16PayStyles';h.className='v13-actions no-print';h.innerHTML='<b>Statement layout:</b> <button class="btn btn-light btn-sm" onclick="V16.setPayStyle(\'compact\')">Compact corporate</button><button class="btn btn-light btn-sm" onclick="V16.setPayStyle(\'classic\')">Classic earnings</button><button class="btn btn-light btn-sm" onclick="V16.setPayStyle(\'modern\')">Modern payroll</button><button class="btn btn-light btn-sm" id="v16PayVoucher" onclick="V16.setPayStyle(\'voucher\')">Payroll voucher</button><span class="muted small">Four payroll statement layouts</span>';stage.parentNode.insertBefore(h,stage);return;}
  if(h.id==='v13PayStyles'&&!$('v16PayVoucher')){var b=actionButton('Payroll voucher','btn-light',function(){V.setPayStyle('voucher');});b.id='v16PayVoucher';h.appendChild(b);}var note=h.querySelector('.muted.small');if(note)note.textContent='Four payroll statement layouts';
}

V.openCalculatorDoc=function(which){if(window.SHELL)SHELL.go('calc');if(window.switchTab)switchTab('docs');if(window.subTab)subTab('docs',which==='paystub'?'paystub':'import');};
function loanDocsHub(){var p=$('panel-v9docs');if(!p||$('v16LoanDocs'))return;var d=document.createElement('div');d.id='v16LoanDocs';d.className='card v16-loan-docs';d.innerHTML='<div class="card-top"><span class="tag">Generate</span><span class="doc-name">Documents and worksheets</span></div><div class="card-body"><div class="v16-loan-docs-grid"><button class="btn btn-primary" onclick="V14.open(\'v13PlModal\')">Profit &amp; Loss</button><button class="btn btn-light" onclick="V16.openCalculatorDoc(\'paystub\')">Pay Statement</button><button class="btn btn-light" onclick="V13.open(\'v13PmiModal\')">PMI / FHA MIP</button><button class="btn btn-light" onclick="V13.open(\'v13RenoModal\')">Renovation Fees</button><button class="btn btn-light" onclick="V14.open(\'v14FeesModal\')">Itemized Fees</button><button class="btn btn-light" onclick="V14.open(\'v14ConModal\')">Contractor Estimate</button><button class="btn btn-light" onclick="V14.open(\'v14LeaseModal\')">Lease Agreement</button><button class="btn btn-light" onclick="V14.open(\'v14AddModal\')">Addendum</button></div></div>';p.insertBefore(d,p.firstChild);}

function rentalGuideline(){var st=suite(),el=$('v15Fannie');if(!st||!el)return;var show=st.snapshot.mode==='rental'&&!!(st.activeInputs.rental&&st.activeInputs.rental.includeVacatingRental);el.classList.toggle('v16-show',show);}
V.pullEstimatedFees=function(){var st=suite(),lines=st&&st.outputs.closing.lines.filter(function(f){return f.payer==='buyer';})||[];if(!lines.length)return say('No buyer fee lines','Load or enter estimated fees first.','warn');V14.syncFees();say('Estimated fees imported',lines.length+' buyer lines now feed the supported Closing and draft LE fields.');};
function feePull(){var st=suite(),body=$('screen-body');if(!st||st.snapshot.mode!=='closing'||!body||$('v16FeePull'))return;var count=st.outputs.closing.lines.filter(function(f){return f.payer==='buyer';}).length,d=document.createElement('div');d.id='v16FeePull';d.className='v16-fee-pull';d.innerHTML='<div><b>Itemized fee estimate</b><div class="muted small">'+(count?count+' buyer lines available':'No buyer lines loaded')+'</div></div><button class="btn btn-primary" onclick="V16.pullEstimatedFees()">Pull estimated fees into Closing</button>';var first=body.firstChild;body.insertBefore(d,first);var old=$('v15ClosingPull');if(old)old.style.display='none';}

function navTarget(text){text=String(text||'');if(/mortgage insurance|\bpmi\b|\bmip\b/i.test(text))return'pmi';if(/rental|lease|schedule e|vacat/i.test(text))return'rental';if(/credit|dti|income|asset|reserve|debt|qualif/i.test(text))return'qualify';if(/property|address|value|apprais/i.test(text))return'property';if(/closing|cash|fee|cost/i.test(text))return'closing';if(/renov|rehab|contractor/i.test(text))return'renovation';if(/escrow|tax|insurance/i.test(text))return'escrow';return'advanced';}
function bindAdvancedLinks(){var st=suite();if(!st)return;var candidates=$$('#suite-root .warning,#suite-root .warn');if(st.snapshot.mode==='advanced')candidates=candidates.concat($$('#screen-body .v15-score-link,#screen-body [data-risk]'));candidates.forEach(function(el){if(el.__v16nav||el.closest('input,select,textarea'))return;var text=el.textContent||'',target=navTarget(text),isWarning=el.classList.contains('warning')||el.classList.contains('warn');if(target==='advanced'&&!isWarning)return;if(el.tagName==='BUTTON'&&el.getAttribute('onclick'))return;el.__v16nav=true;el.classList.add('v16-nav-warning');el.addEventListener('click',function(){if(target==='pmi'){V13.open('v13PmiModal');if(window.V15)V15.renderMI();return;}st.navigate({tab:target,section:target});});});}

function scheduleEGross(){var S=calcState();if(!S||!S.sche)return;S.sche.forEach(function(p){var net=$('sche-'+p.id+'-bar');if(!net)return;var id='sche-'+p.id+'-gross',g=$(id),r=window.calcSchE?calcSchE(p):null;if(!g){g=document.createElement('div');g.id=id;g.className='result-bar v16-gross-rent';g.innerHTML='<div><div class="big"></div><div class="sub">Before the full monthly PITIA is deducted</div></div>';net.parentNode.insertBefore(g,net);}var big=g.querySelector('.big');if(big&&r)big.textContent='Gross Rental Cash Flow: '+money(r.gross)+' / month';});}

function install(){
  if(!window.V14||!window.V15)return false;
  if(!V14.renderLease.__v16){V14.renderLease=V.renderLease;V14.renderLease.__v16=true;V14.renderLease.__v15=true;V.renderLease();}
  wrapDocumentRenderer('renderAddendum','v14AddBody','v16AddendumStatement','addendum','Purchase Agreement Addendum');
  wrapDocumentRenderer('renderContractor','v14ConBody','v16ContractorStatement','contractor estimate','Contractor Estimate');
  wrapPL();payStyles();loanDocsHub();rentalGuideline();feePull();bindAdvancedLinks();scheduleEGross();
  freeformInputs($('v14AddModal'));freeformInputs($('v14ConModal'));freeformInputs($('v13PmiModal'));
  return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();setInterval(install,700);
})();
