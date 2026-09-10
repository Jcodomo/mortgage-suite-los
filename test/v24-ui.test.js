const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const root=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(root,'src','patch-v24.js'),'utf8');
const css=fs.readFileSync(path.join(root,'src','patch-v24.css'),'utf8');
const inject=fs.readFileSync(path.join(root,'build','inject.py'),'utf8');
const checks=[
  ['release 24 stamp',/dataset\.losRelease='24'/.test(js)],
  ['ten curated themes',/THEMES=\['ledger','slate','bank','graphite','terminal','federal','clay','violet','evergreen','steel'\]/.test(js)],
  ['five independent input presets',/INPUTS=\['paper','mist','mint','sand','ink'\]/.test(js)],
  ['Midnight terminal seeds first',/theme='terminal';tone='ink'/.test(js)],
  ['exact Midnight page surface',/--v24-page:#111A2B/.test(css)],
  ['exact Midnight card surface',/--v24-card:#182338/.test(css)],
  ['exact Midnight border',/--v24-border:#24314A/.test(css)],
  ['exact Midnight input surface',/--v23-field:#0F1829;--v23-field-line:#33425F/.test(css)],
  ['Midnight-only purple program badge',/data-v24-theme="terminal"\] #suite-root \.prog\{background:#26215C!important;color:#CECBF6!important/.test(css)],
  ['scenario bar is in header and at least 320px',/v24ScenarioBar/.test(js)&&/\.v24-scenario-bar\{min-width:320px/.test(css)],
  ['scenario context is placed in tab row',/v24ContextSummary/.test(js)&&/tabs\.appendChild\(el\)/.test(js)],
  ['separate scenario band retired',/v24-retired-toolbar\{display:none!important\}/.test(css)],
  ['quick edit is always-expanded worksheet row',/createElement\('section'\)/.test(js)&&/row\.id='v24WorksheetQuick'/.test(js)&&/row\.className='v24-worksheet-row v24-quick-row'/.test(js)&&/\.v24-quick-grid/.test(css)&&!/<summary><span><b>Quick edit/.test(js)],
  ['all requested quick fields retained',['borrowerName','propertyAddress','zipCode','nyCounty','basePurchasePrice','asIsValue','afterRepairValue','finalDownPaymentPct','reno.baseCost'].every(x=>js.includes("'"+x+"'"))],
  ['all requested preset chips retained',['FHA 3.5%','5% down','Fill city/state/county from ZIP','Sync to Property'].every(x=>js.includes(x))],
  ['missing ARV gets linked amber field state',/afterRepairValue/.test(js)&&/v24-missing/.test(css)&&/aria-invalid/.test(js)],
  ['transaction, property, borrower and terms share worksheet',/rowShell\('transaction'/.test(js)&&/rowShell\('property'/.test(js)&&/rowShell\('borrower'/.test(js)&&/rowShell\('terms'/.test(js)],
  ['setup description moved to title tooltip',/Everything that defines the file/.test(js)&&/ttl\.title=/.test(js)],
  ['File actions and Loan tools are separate',/File actions/.test(js)&&/id='v24LoanTools'/.test(js)],
  ['closing cost explainer uses live itemized lines',/outputs\.closing\.lines/.test(js)&&/nothing new was added/.test(js)],
  ['PMI profiles are explicit and standard remains default',/Aggressive/.test(js)&&/Standard/.test(js)&&/Conservative/.test(js)&&/v24MiProfile\|\|'standard'/.test(js)],
  ['FHA conservative fallback is 0.55 percent',/\.0055/.test(js)],
  ['income-needed cards are calculation-only views',/FHA front-end/.test(js)&&/Conventional back-end/.test(js)&&/Rental income needed for self-sufficiency/.test(js)],
  ['default formulas stay in engine (no engine source edit)',!js.includes('calculateClosingCosts')&&!js.includes('calculateAus')],
  ['build includes v24 files',/patch-v24\.css/.test(inject)&&/patch-v24\.js/.test(inject)]
];
let failed=0;for(const [name,ok] of checks){console.log((ok?'PASS  ':'FAIL  ')+name);if(!ok)failed++;}
assert.equal(failed,0);console.log(`\nv24 UI/reference integration: ${checks.length} passed, 0 failed`);
