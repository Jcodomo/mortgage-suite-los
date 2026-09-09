const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),js=fs.readFileSync(path.join(root,'src','patch-v18.js'),'utf8'),css=fs.readFileSync(path.join(root,'src','patch-v18.css'),'utf8');
const checks=[
 ['HomeStyle reference total',/sectionC:3841/.test(js)],
 ['203k reference total',/sectionC:4159/.test(js)],
 ['HomeStyle lender title basis',/loan:725016/.test(js)&&/lenderTitle:894/.test(js)],
 ['203k lender title basis',/loan:615580/.test(js)&&/lenderTitle:1018/.test(js)],
 ['owner title scales by purchase price',/owner=rounded\(\(price\/ref\.price\)\*ref\.ownerTitle\)/.test(js)],
 ['program-specific reference',/i\.loanProgram==='FHA'/.test(js)],
 ['reference estimate writes Closing',/ov\.titleInsurance=sumMap/.test(js)&&/ov\.titleSearchSettlement=sumMap/.test(js)],
 ['combined lender charge stays 2250',/ov\.lenderOrigination=2250/.test(js)&&/ov\.lenderProcessing=0/.test(js)],
 ['search buttons removed',/searchClosingFees/.test(js)&&/\.remove\(\)/.test(js)],
 ['NY estimate action',/Apply NY LE best estimate/.test(js)&&/Refresh NY LE estimate/.test(js)],
 ['four input tones',/Light fields/.test(js)&&/Blue fields/.test(js)&&/Dark fields/.test(js)],
 ['navy blue fields',/data-skin="navy"/.test(css)&&/#174a78/.test(css)],
 ['oled dark fields',/data-skin="oled"/.test(css)&&/#121820/.test(css)]
];
let fail=0;for(const [name,ok] of checks){console.log((ok?'PASS  ':'FAIL  ')+name);if(!ok)fail++;}assert.equal(fail,0);console.log(`\nv18: ${checks.length} passed, 0 failed`);
