const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const root=path.join(__dirname,'..'),js=fs.readFileSync(path.join(root,'src','patch-v20.js'),'utf8'),css=fs.readFileSync(path.join(root,'src','patch-v20.css'),'utf8');
const document={readyState:'loading',addEventListener(){},querySelectorAll(){return[]},documentElement:{dataset:{},classList:{add(){}}}};
const context={window:{},document,setInterval(){},URLSearchParams:function(){this.get=()=>null;},location:{search:''},console};vm.createContext(context);vm.runInContext(js,context);const V=context.window.V20;
function near(a,b){return Math.abs(a-b)<.01;}
const ref=V.reference203k({purchase:500000,asIs:500000,rehab:115963.75,arv:650000,downPct:.035,fhaLimit:1249125,ufmipRate:.0175});
const checks=[
 ['valid currency parser',V.parseNumber('$500,000').ok&&V.parseNumber('$500,000').value===500000],
 ['invalid number fails visibly',V.parseNumber('five hundred').ok===false],
 ['k shorthand works',V.parseNumber('500k').value===500000],
 ['workbook C1 lesser price/value',near(ref.c1,500000)],
 ['workbook C3 value basis',near(ref.c3,615963.75)],
 ['workbook minimum investment',near(ref.minimumInvestment,21558.73125)],
 ['workbook maximum base mortgage',near(ref.maximumBaseLoan,594405.01875)],
 ['workbook UFMIP',near(ref.ufmip,10402.087828125)],
 ['workbook total loan',near(ref.totalLoan,604807.106578125)],
 ['amortization schedule implemented',/V\.amortization=function/.test(js)&&/Ending balance/.test(js)],
 ['scenario ZIP purchase down controls',/Scenario control center/.test(js)&&/ZIP code/.test(js)&&/Purchase price/.test(js)&&/Down payment %/.test(js)],
 ['as-is auto-fill and change warning',/v20ValueAuto/.test(js)&&/As-is value changed/.test(js)],
 ['renovation default and clear behavior',/reno\.baseCost=50000/.test(js)&&/i\.renovation=false/.test(js)],
 ['two month escrow default',/cushionMonthsOverride=2/.test(js)],
 ['last three autosaves',/slice\(0,3\)/.test(js)&&/Last 3 sessions/.test(js)],
 ['new OCR document types',/Contract/.test(js)&&/Lead expiration/.test(js)&&/Closing Disclosure/.test(js)],
 ['pay statement uses faint draft watermark',/content:'DRAFT'/.test(css)&&/rgba\(120,20,20,\.075\)/.test(css)],
 ['training banner removed',!/TRAINING DRAFT|NOT FOR SUBMISSION/.test(css)],
 ['comparison includes ARV and as-is',/As-is value/.test(js)&&/MMW base loan/.test(js)],
 ['property editable badge removed',/stripEditable/.test(js)]
];
let fail=0;for(const [name,ok] of checks){console.log((ok?'PASS  ':'FAIL  ')+name);if(!ok)fail++;}assert.equal(fail,0);console.log(`\nv20: ${checks.length} passed, 0 failed`);
