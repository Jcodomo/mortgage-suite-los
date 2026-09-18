const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'src','release-50','release-50.js'),'utf8');

function functionSource(name){
  const start=src.indexOf('function '+name+'(');
  assert(start>=0,'missing function '+name);
  const brace=src.indexOf('{',start);let depth=0,quote='',escape=false;
  for(let i=brace;i<src.length;i++){
    const c=src[i];
    if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue;}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c==='{')depth++;else if(c==='}'&&--depth===0)return src.slice(start,i+1);
  }
  throw new Error('unterminated function '+name);
}

const stateCodes=src.match(/var STATE_CODES=\{[^;]+\};/)[0];
const parseAddress=new Function(
  functionSource('norm')+'\n'+stateCodes+'\n'+functionSource('stateCode')+'\n'+
  functionSource('streetOnly')+'\n'+functionSource('stateName')+'\n'+functionSource('parseAddressParts')+'\nreturn parseAddressParts;'
)();
assert.deepEqual(parseAddress('123 Main St, Garden City, NY 11530'),{
  street:'123 Main St',city:'Garden City',state:'New York',zip:'11530'
});
assert.deepEqual(parseAddress('11530, Village of Garden City, Town of Hempstead'),{
  street:'',city:'Village of Garden City',state:'',zip:'11530'
});

const taxMonths=new Function(functionSource('taxMonthsForCycle')+'\nreturn taxMonthsForCycle;')();
assert.deepEqual(taxMonths('Nassau County, NY — Jan 10 / Jul 10'),[1,7]);
assert.deepEqual(taxMonths('Quarterly — Feb / May / Aug / Nov'),[2,5,8,11]);

const checks=[
  ['ZIP lookup is tracked independently for every saved scenario',/var propertySyncBusy=false,lastAutoZip=\{\}/.test(src)&&/lastAutoZip\[activeId\]!==zip/.test(src)],
  ['Changing ZIP clears only the locality values supplied by the prior ZIP lookup',/var priorLocation=i\.v503ZipLocation\|\|\{\}[\s\S]*?sameValue\(i\.city,priorLocation\.city\)[\s\S]*?sameValue\(priorCounty,priorLocation\.county\)/.test(src)],
  ['Retained Quote and Setup proxy fields have a stable delegated commit path',/function wireScenarioFieldsTwoWay\(\)[\s\S]*?data-v44-field[\s\S]*?data-v35-quote[\s\S]*?focusout[\s\S]*?syncScenarioProperty/.test(src)],
  ['ZIP and address changes refresh area value, closing, and aggregate estimates',/refreshAreaEstimate\(s,propertyKey\)[\s\S]*?refreshClosingEstimate\(s,propertyKey\)[\s\S]*?refreshAggregateSetup\(i,propertyKey\)/.test(src)],
  ['Automatic ARV refresh preserves a manually changed as-is value or ARV',/replaceAsIs[\s\S]*?replaceArv[\s\S]*?if\(!replaceAsIs\)i\.asIsValue=beforeAsIs[\s\S]*?if\(!replaceArv\)i\.afterRepairValue=beforeArv/.test(src)],
  ['Automatic NY closing estimates retain overrides that differ from the prior automatic estimate',/var manual=before\[k\]!=null&&!sameValue\(before\[k\],previous\?previous\[k\]:estimated\[k\]\)/.test(src)],
  ['Aggregate closing uses the county-aware cushion and automatic first-payment calculation',/closing\.useAggregateEscrowForPrepaids[\s\S]*?escrow\.autoFirstPaymentDate[\s\S]*?cushionMonthsOverride/.test(functionSource('refreshAggregateSetup'))],
  ['Property workspace updates borrower, address, ZIP, values, renovation and annual tax back to the scenario',/function wirePropertyTwoWay\(\)[\s\S]*?borrower:'borrowerName'[\s\S]*?zip:'zipCode'[\s\S]*?currentValue:'asIsValue'[\s\S]*?annualTax:'propertyTaxAmount'/.test(src)],
  ['Tax/proration changes update tax, closing, first-payment and cushion scenario fields',/function wireTaxTwoWay\(\)[\s\S]*?propertyTaxAmount[\s\S]*?closingDate[\s\S]*?escrow\.firstPaymentDate[\s\S]*?escrow\.cushionMonthsOverride/.test(src)],
  ['A proration billing-cycle edit feeds the mortgage aggregate disbursement schedule',/taxMonthsForCycle\(v\)[\s\S]*?escrow\.customDisbursements[\s\S]*?escrow\.useCustomDisbursements/.test(src)]
];
let failed=0;for(const [name,ok] of checks){console.log((ok?'PASS  ':'FAIL  ')+name);if(!ok)failed++;}
assert.equal(failed,0);console.log(`\nv50 synchronization: ${checks.length+4} passed, 0 failed`);
