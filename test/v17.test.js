const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),js=fs.readFileSync(path.join(root,'src','patch-v17.js'),'utf8'),css=fs.readFileSync(path.join(root,'src','patch-v17.css'),'utf8'),v16=fs.readFileSync(path.join(root,'src','patch-v16.js'),'utf8');
const checks=[
 ['pay toolbar reuses existing v16 bar',/\$\('v13PayStyles'\)\|\|bars\[0\]/.test(v16)],
 ['pay toolbar duplicate cleanup',/bars\.slice\(1\)/.test(v16)&&/cleanupPayStyles/.test(js)],
 ['four theme cycle',/light:'dark',dark:'navy',navy:'oled',oled:'light'/.test(js)],
 ['one app theme button css',/#v5ThemeBtn,#v9ShellTheme,#v9SuiteTheme,#v15ThemeMenu/.test(css)],
 ['combined lender fee fixed',/Origination \/ Processing \/ Underwriting/.test(js)&&/lenderOrigination=2250/.test(js)&&/lenderProcessing=0/.test(js)],
 ['official fee search',/official county recording fees title insurance/.test(js)&&/consumerfinance\.gov/.test(js)],
 ['closing screen fee source button',/Search official\/local fees online/.test(js)&&/fixed lender charge \$2,250/.test(js)],
 ['aggregate escrow auto mode',/useAggregateEscrowForPrepaids=true/.test(js)&&/autoFirstPaymentDate=true/.test(js)],
 ['escrow dates visible',/First tax due/.test(js)&&/First payment/.test(js)],
 ['contractor freeform action',/Add freeform scope line/.test(js)&&/Optional category search/.test(js)],
 ['scenario rename',/Scenario name/.test(js)&&/\'name\',i\.name/.test(js)],
 ['scenario address and zip',/Property address/.test(js)&&/\'zipCode\'/.test(js)],
 ['scenario additional controls',/Seller concession %/.test(js)&&/Annual taxes/.test(js)&&/HOA \/ mo/.test(js)],
 ['full comparison viewport',/width:calc\(100vw - 22px\)/.test(css)&&/min-width:3220px/.test(css)],
 ['comparison horizontal scrolling',/\.v17-compare-scroll\{overflow:auto/.test(css)]
];
let fail=0;for(const [name,ok] of checks){console.log((ok?'PASS  ':'FAIL  ')+name);if(!ok)fail++;}assert.equal(fail,0);console.log(`\nv17: ${checks.length} passed, 0 failed`);
