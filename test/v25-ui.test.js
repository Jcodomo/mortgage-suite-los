const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(root,'src','patch-v25.js'),'utf8');
const css=fs.readFileSync(path.join(root,'src','patch-v25.css'),'utf8');
const inject=fs.readFileSync(path.join(root,'build','inject.py'),'utf8');
const checks=[
 ['release 25 stamp',/dataset\.losRelease='25'/.test(js)],
 ['third appearance control',/id='v25SurfaceButton'/.test(js)&&/SURFACES=\['light','dark','oled'\]/.test(js)],
 ['dark surface remains default',/los\.v25\.surface','dark'/.test(js)],
 ['OLED surface available',/data-v25-surface="oled"/.test(css)&&/--v24-page:#020406/.test(css)],
 ['palette accent is preserved by surface modes',!/data-v25-surface="(?:dark|oled)"[^}]*--v24-accent\s*:/.test(css)],
 ['modern combined scenario control',/v25-scenario-control/.test(css)&&/Name this scenario/.test(js)],
 ['two-level reference header',/v25HeaderMain/.test(js)&&/v25HeaderActions/.test(js)],
 ['reference summary strip has six metrics',/\['price','Price'/.test(js)&&/\['cash','Cash to close'/.test(js)&&/repeat\(6,minmax\(0,1fr\)\)/.test(css)],
 ['workspace nav uses line icon language',/i-full:before/.test(css)&&/v23-nav-icon/.test(css)],
 ['full file view follows Results',/dataset\.group='full'/.test(js)&&/Complete file view/.test(js)],
 ['full file view retains five information groups',['File & property','Loan & renovation','Costs & escrow','Underwriting','Results'].every(x=>js.includes(x))],
 ['dark action menu redesign',/v25-menu-head/.test(js)&&/background:#08111E!important/.test(css)],
 ['worksheet has hard vertical stack guard',/v25-worksheet-stack/.test(js)&&/grid-template-columns:none!important/.test(css)],
 ['narrow screens move live summary to drawer',/@media\(max-width:1360px\)/.test(css)&&/v24-summary-open/.test(css)],
 ['freeform enhancer remains active',/V19\.enhanceFreeform/.test(js)],
 ['build includes v25 files',/patch-v25\.css/.test(inject)&&/patch-v25\.js/.test(inject)]
];
let failed=0;for(const [name,ok] of checks){console.log((ok?'PASS  ':'FAIL  ')+name);if(!ok)failed++;}assert.equal(failed,0);console.log(`\nv25 UI: ${checks.length} passed, 0 failed`);
