const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const root=path.join(__dirname,'..'),js=fs.readFileSync(path.join(root,'src','patch-v21.js'),'utf8'),css=fs.readFileSync(path.join(root,'src','patch-v21.css'),'utf8');
const document={readyState:'loading',addEventListener(){},querySelectorAll(){return[]},documentElement:{dataset:{}}};
const context={window:{},document,setInterval(){},localStorage:{getItem(){return null},setItem(){}},console};vm.createContext(context);vm.runInContext(js,context);const V=context.window.V21;
const base={basePurchasePrice:500000,asIsValue:500000,afterRepairValue:500000,finalDownPaymentPct:.035,renovation:true};
const out={isFha:true,renovationActive:true,purchase:{finalPurchasePrice:500000},renovationOut:{finalRenovationAmount:100000},loan:{maximumBaseLoan:579000}};
const fail=V.valueFit({...base,afterRepairValue:500000},{...out,renovationOut:{finalRenovationAmount:100000}});
const pass=V.valueFit({...base,afterRepairValue:650000},{...out,renovationOut:{finalRenovationAmount:115963.75}});
const rent=V.parseRentResponse([['NAME','B25031_001E','B25031_002E','B25031_003E','B25031_004E','B25031_005E','B25031_006E'],['ZCTA5 10001','2500','2200','2400','2800','3200','3600']]);
const checks=[
 ['low ARV fails before loan cap',fail.status==='fail'],
 ['fail ratio is 120 percent',Math.abs(fail.ratio-120)<.001],
 ['fail shows 10 points above threshold',Math.abs(fail.points-10)<.001],
 ['required ARV is basis divided by 110 percent',Math.abs(fail.requiredArv-545454.545)<.01],
 ['renovation master case passes',pass.status==='pass'],
 ['rent parser studio',rent.studio===2200],
 ['rent parser one bedroom',rent.one===2400],
 ['rent parser two bedrooms',rent.two===2800],
 ['rent lookup stays in suite',/api\.census\.gov/.test(js)&&!/google\.com\/search/.test(js)],
 ['renovation intent persists',/v21RenoIntent/.test(js)&&/Renovation tab stays available/.test(js)],
 ['summary includes amortization',/v21SummaryAmort/.test(js)&&/Open full annual schedule/.test(js)],
 ['four distinct pay styles',/compact/.test(js)&&/classic/.test(js)&&/modern/.test(js)&&/voucher/.test(js)],
 ['pay preview has four strong CSS variants',/v21-pay-compact/.test(css)&&/v21-pay-classic/.test(css)&&/v21-pay-modern/.test(css)&&/v21-pay-voucher/.test(css)],
 ['draft watermark is lighter',/\.028/.test(css)],
 ['previous session control styled',/#v20Sessions:before/.test(css)&&/Previous session/.test(css)],
 ['icons use currentColor line style',/stroke:currentColor/.test(css)]
];
let bad=0;for(const [name,ok] of checks){console.log((ok?'PASS  ':'FAIL  ')+name);if(!ok)bad++;}assert.equal(bad,0);console.log(`\nv21: ${checks.length} passed, 0 failed`);
