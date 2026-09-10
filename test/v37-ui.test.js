const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const css=fs.readFileSync(path.join(root,'src','patch-v37.css'),'utf8');
const js=fs.readFileSync(path.join(root,'src','patch-v37.js'),'utf8');
const build=fs.readFileSync(path.join(root,'build','inject.py'),'utf8');
const dist=fs.readFileSync(path.join(root,'dist','mortgage-suite-los.html'),'utf8');
const checks=[
  ['release 37 marker',/version:'37\.0'/.test(js)],
  ['shared shell height is measured',/--v37-shell-h/.test(js)&&/shellbar/.test(js)],
  ['income app header scrolls normally',/#calc-root \.appbar[\s\S]*?position:static!important/.test(css)],
  ['income primary navigation clears shell',/#calc-root #v23CalcPrimaryNav[\s\S]*?top:var\(--v37-shell-h\)/.test(css)],
  ['income subnavigation clears primary navigation',/top:calc\(var\(--v37-shell-h\) \+ var\(--v37-calc-nav-h\)\)/.test(css)],
  ['suite readings scroll normally',/#suite-root \.v34-bar[\s\S]*?position:static!important/.test(css)],
  ['suite chrome clears shell',/#suite-root \.chrome[\s\S]*?top:var\(--v37-shell-h\)/.test(css)],
  ['suite child nav rows no longer overlap',/chrome>#v23SuitePrimaryNav[\s\S]*?position:static!important/.test(css)],
  ['full navigation remains inside sticky chrome',/\.v36-full-nav-host[\s\S]*?position:static!important/.test(css)],
  ['rail offset follows measured chrome',/--v37-suite-chrome-h/.test(css)&&/max-height:calc\(100vh/.test(css)],
  ['scroll targets clear sticky navigation',/scroll-margin-top/.test(css)],
  ['promoted context duplicates remain hidden',/hidePromotedCopies/.test(js)&&/v37-promoted-copy/.test(css)],
  ['minimal scroll progress is installed',/v37ScrollProgress/.test(js)&&/--v37-scroll-progress/.test(css)],
  ['responsive mode releases sticky rows',/@media\(max-width:640px\)/.test(css)&&/position:static!important/.test(css)],
  ['v37 is last injected layer',build.lastIndexOf('patch-v37.css')>build.lastIndexOf('patch-v36.css')&&build.lastIndexOf('patch-v37.js')>build.lastIndexOf('patch-v36.js')],
  ['distribution includes v37',dist.includes("version:'37.0'")]
];
let failed=0;for(const [name,ok] of checks){console.log((ok?'PASS  ':'FAIL  ')+name);if(!ok)failed++;}
assert.equal(failed,0);console.log(`\nv37 UI: ${checks.length} passed, 0 failed`);
