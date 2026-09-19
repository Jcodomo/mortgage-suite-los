const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'src','release-50','release-50.js'),'utf8');
const css=fs.readFileSync(path.join(root,'src','release-50','release-50.css'),'utf8');
const dist=fs.readFileSync(path.join(root,'dist','mortgage-suite-los.html'),'utf8');
const landing=fs.readFileSync(path.join(root,'index.html'),'utf8');
const base=fs.readFileSync(path.join(root,'archive','mortgage-suite-los-v48.html'),'utf8');

function functionSource(name){
  const start=src.indexOf('function '+name+'(');assert(start>=0,'missing function '+name);
  const brace=src.indexOf('{',start);let depth=0,quote='',escape=false;
  for(let i=brace;i<src.length;i++){
    const c=src[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue;}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}if(c==='{')depth++;else if(c==='}'&&--depth===0)return src.slice(start,i+1);
  }
  throw new Error('unterminated function '+name);
}

const jsonHelpers=new Function(functionSource('parseAnyJson')+'\n'+functionSource('detectJsonTarget')+'\nreturn {parseAnyJson,detectJsonTarget};')();
assert.deepEqual(jsonHelpers.parseAnyJson('```json\n{"w2":[]}\n```'),{w2:[]});
assert.equal(jsonHelpers.detectJsonTarget({w2:[{employer:'Acme'}]}),'income');
assert.equal(jsonHelpers.detectJsonTarget({schema:'mortgage-suite-scenario',version:1,inputs:{basePurchasePrice:500000}}),'loan');
assert.equal(jsonHelpers.detectJsonTarget({propertyAddress:'12 Main St',zipCode:'11530'}),'loan');
assert.throws(()=>jsonHelpers.parseAnyJson('[{},{}]'),/one JSON object/i);

const checks=[
  ['Release is versioned as 50.4',/version:'50\.4'/.test(src)&&/"version": "50\.4\.0"/.test(fs.readFileSync(path.join(root,'package.json'),'utf8'))],
  ['Income starts with automatic agency selection',/function installIncomeAutoAgency\(\)[\s\S]*?globalValue\('agencyBest'\)[\s\S]*?option\.value='AUTO'/.test(src)],
  ['Auto agency safely resolves to a real underwriting method before DTI rendering',/AUTO:\{f:0,b:0\.50,label:'Auto selection pending'\}/.test(base)&&/requestedAgency === 'AUTO'[\s\S]*?agencyBest\(\)[\s\S]*?S\.agency = best\.ag/.test(base)],
  ['Variable income uses the lexical Income Calculator factory and redraws its worksheet',/function addVariableIncome\(\)[\s\S]*?globalValue\('newW2'\)[\s\S]*?autoIncomeRecord\(factory\(\),'variable'\)[\s\S]*?decorateIncomeSources/.test(src)],
  ['Income report and loan document generation autosave named scenarios',/function installIncomeReportAutosave\(\)[\s\S]*?saveIncomeScenario\('Income report'\)/.test(src)&&/function installLoanDocumentAutosave\(\)[\s\S]*?autoSaveLoanScenario/.test(src)],
  ['Five newest income and loan scenarios share one recent menu',/loan\.concat\(income\)[\s\S]*?slice\(0,5\)/.test(src)&&/5 most recent scenarios/.test(src)],
  ['Loan and income scenario names use compact borrower-centric conventions',/function loanScenarioName\(i\)[\s\S]*?CONV[\s\S]*?% down/.test(src)&&/function incomeScenarioName\(\)[\s\S]*?employer[\s\S]*?jobTitle/.test(src)],
  ['Nationwide county lookup uses ZIP coordinates and the official FCC area service',/api\.zippopotam\.us[\s\S]*?geo\.fcc\.gov\/api\/census\/area/.test(src)&&['Kings','Queens','Richmond'].every(x=>src.includes("return'"+x+"'"))],
  ['Shared Documents page offers review-first JSON import with automatic destination detection',/id="v50AnyJson"[\s\S]*?Auto-detect[\s\S]*?Review JSON[\s\S]*?Apply reviewed JSON/.test(dist)&&/function reviewAnyJson\(hub\)[\s\S]*?Nothing has been changed yet/.test(src)],
  ['Any-JSON import supports income, scenario-shaped loan data and recognized OCR fields',/function applyAnyJson\(hub\)[\s\S]*?importExtract[\s\S]*?flattenJson[\s\S]*?V9\.applyAiJson/.test(src)],
  ['Prompt collections stay available but collapsed for a calmer first view',/id="v50SharedPromptLibrary"[\s\S]*?\+\'<details><summary>Universal document prompts/.test(src)],
  ['Contract and LE retains its dedicated moved workspace',/var MOVED_STAGE = \{ \'CONTRACT & LE\':\'docparse\' \}/.test(src)&&/function showMovedStage\(id\)[\s\S]*?LOANSUITE\.goMoved\(id\)/.test(src)],
  ['Draft LE launches the generated estimate instead of the import dialog',/if\(k===\'DRAFT LE\'\)[\s\S]*?autoSaveLoanScenario\(\'Draft LE\'\)[\s\S]*?LOANSUITE\.printLE\(\)/.test(src)],
  ['Direct-suite startup protection is one-shot and never blocks a later workspace switch',/suiteEntryInitialized = false[\s\S]*?if\(suiteEntryInitialized\)return false;[\s\S]*?suiteEntryInitialized=true/.test(src)&&/closest\(\'#mode-calc,#mode-suite\'\)\) suiteEntryPinned=false/.test(src)],
  ['JSON import styling is responsive and consistent with the workbench',/\.v50-any-json[\s\S]*?\.v50-any-json-actions[\s\S]*?output\.good[\s\S]*?output\.bad/.test(css)],
  ['Landing page keeps direct Income Calculator and Loan Suite routes',/income-calculator\.html/.test(landing)&&/loan-suite\.html/.test(landing)]
];
let failed=0;for(const [name,ok] of checks){console.log((ok?'PASS  ':'FAIL  ')+name);if(!ok)failed++;}
assert.equal(failed,0);console.log(`\nv50 workflow: ${checks.length+5} passed, 0 failed`);
