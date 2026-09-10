const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(root,'src','patch-v23.js'),'utf8');
const css=fs.readFileSync(path.join(root,'src','patch-v23.css'),'utf8');
const scheduler=fs.readFileSync(path.join(root,'src','patch-scheduler.js'),'utf8');
const inject=fs.readFileSync(path.join(root,'build','inject.py'),'utf8');
const suiteTabs=['SETUP','PROPERTY','QUOTE','RENOVATION','MAX MORTGAGE','MORTGAGE RATES','CLOSING','ESCROW','QUALIFY','RENTAL','ADVANCED','SCENARIOS','SUMMARY','DOCUMENTS & OCR'];
const calcTabs=['w2','selfemp','sche','va','other','dti','aus','summary','docs'];
const suiteBlock=(js.match(/var SUITE_GROUPS=\[([\s\S]*?)\];/)||[])[1]||'';
const calcBlock=(js.match(/var CALC_GROUPS=\[([\s\S]*?)\];/)||[])[1]||'';
const checks=[
  ['five loan workspace groups',(suiteBlock.match(/\{key:/g)||[]).length===5],
  ['three income workspace groups',(calcBlock.match(/\{key:/g)||[]).length===3],
  ['every loan destination retained',suiteTabs.every(x=>suiteBlock.includes("'"+x+"'"))],
  ['every income destination retained',calcTabs.every(x=>calcBlock.includes("'"+x+"'"))],
  ['separate theme and input controls',/id="v23ThemeButton"/.test(js)&&/id="v23InputButton"/.test(js)&&/cycleTheme/.test(js)&&/cycleInput/.test(js)],
  ['five retained page themes',/THEMES=\['ledger','slate','bank','graphite','terminal'\]/.test(js)],
  ['five input tones',/INPUTS=\['paper','mist','mint','sand','ink'\]/.test(js)],
  ['scenario quick edit is progressive',/v23ScenarioQuickEdit/.test(js)&&/v23-scenario-edit/.test(css)],
  ['suite actions remain reachable',/Export scenario JSON/.test(js)&&/Import scenario JSON/.test(js)&&/Live comparison/.test(js)&&/Documents & OCR/.test(js)],
  ['legacy theme controls are retired',/retireLegacyThemes/.test(js)&&/\.v23-legacy-theme/.test(css)],
  ['pay statement wrapper growth is stopped',/stabilizePayStatement/.test(js)&&/fn\.__v13=true/.test(js)&&/fn\.__v20=true/.test(js)],
  ['duplicate scenario actions are hidden',/v23-superseded-action/.test(js)&&/\.v23-superseded-action/.test(css)],
  ['universal freeform enhancement retained',/V19\.enhanceFreeform\(document\)/.test(js)],
  ['offscreen rendering optimized',/content-visibility:auto/.test(css)&&/contain-intrinsic-size/.test(css)],
  ['print restores contained content',/@media print[\s\S]*content-visibility:visible/.test(css)],
  ['live summary uses document scrolling',/cols-main>div:last-child\{max-height:none!important;overflow:visible!important\}/.test(css)],
  ['coordinated scheduler captures enhancement timers',/wait>=300&&wait<=1500/.test(scheduler)&&/Math\.max\(1200,wait\)/.test(scheduler)],
  ['scheduler pauses when page is hidden',/document\.hidden/.test(scheduler)&&/visibilitychange/.test(scheduler)],
  ['scheduler restored after registration',/LOS_SCHEDULER\.seal\(\)/.test(js)],
  ['build includes scheduler before base patch',inject.indexOf('/ "patch-scheduler.js"')<inject.indexOf('/ "patch.js"')],
  ['build includes v23 files',/patch-v23\.css/.test(inject)&&/patch-v23\.js/.test(inject)]
];
let failed=0;for(const [name,ok] of checks){console.log((ok?'PASS  ':'FAIL  ')+name);if(!ok)failed++;}
assert.equal(failed,0);console.log(`\nv23 UI/performance: ${checks.length} passed, 0 failed`);
