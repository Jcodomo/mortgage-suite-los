const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const root=path.join(__dirname,'..'),v17=fs.readFileSync(path.join(root,'src','patch-v17.js'),'utf8'),v18=fs.readFileSync(path.join(root,'src','patch-v18.js'),'utf8'),v19=fs.readFileSync(path.join(root,'src','patch-v19.js'),'utf8'),css=fs.readFileSync(path.join(root,'src','patch-v18.css'),'utf8')+fs.readFileSync(path.join(root,'src','patch-v19.css'),'utf8');
const context={window:{},document:{readyState:'loading',addEventListener(){},querySelectorAll(){return[]},documentElement:{dataset:{}}},setInterval(){}};vm.createContext(context);vm.runInContext(v19,context);const normalize=context.window.V19.normalizeNumber;
const checks=[
 ['four distinct theme icons',/ICONS=\{/.test(v17)&&/light:'<svg/.test(v17)&&/dark:'<svg/.test(v17)&&/navy:'<svg/.test(v17)&&/oled:'<svg/.test(v17)],
 ['active theme chooses its matching icon',/dataset\.currentSkin!==cur\)b\.innerHTML=ICONS\[cur\]\|\|ICONS\.light/.test(v17)],
 ['shared four-theme cycle retained',/light:'dark',dark:'navy',navy:'oled',oled:'light'/.test(v17)],
 ['theme icon exposes current and next state',/click for/.test(v17)&&/aria-label/.test(v17)],
 ['both applications repaint together',/V\.paintThemeButtons=paintThemeButtons/.test(v17)&&/V17\.paintThemeButtons/.test(v18)],
 ['icon control is compact',/width:36px!important/.test(css)&&/min-width:36px!important/.test(css)],
 ['all numeric inputs become text entry',/input\[type="number"\]/.test(v19)&&/el\.type='text'/.test(v19)],
 ['decimal keyboard retained',/inputMode='decimal'/.test(v19)],
 ['currency and comma normalization',/replace\(\/\[\(\)\$,\%\\s\]/.test(v19)],
 ['k and m shorthand normalization',/toLowerCase\(\)==='k'\?1000:1000000/.test(v19)],
 ['normalizes before original handlers',/addEventListener\('input'.*true\)/.test(v19)],
 ['existing handlers are preserved',!/cloneNode|replaceChild/.test(v19)],
 ['release stamp',/losRelease='19'/.test(v19)],
 ['focus-visible theme control',/focus-visible/.test(css)]
 ,['550k normalizes to 550000',normalize('550k')==='550000']
 ,['currency normalizes',normalize('$525,000.00')==='525000']
 ,['percentage preserves entered scale',normalize('6.875%')==='6.875']
 ,['1.2m normalizes to 1200000',normalize('1.2m')==='1200000']
];
let fail=0;for(const [name,ok] of checks){console.log((ok?'PASS  ':'FAIL  ')+name);if(!ok)fail++;}assert.equal(fail,0);console.log(`\nv19: ${checks.length} passed, 0 failed`);
