const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(root,'src','patch-v36.js'),'utf8');
const css=fs.readFileSync(path.join(root,'src','patch-v36.css'),'utf8');
const inject=fs.readFileSync(path.join(root,'build','inject.py'),'utf8');
let pass=0,fail=0;
function ok(name,value){if(value){console.log('PASS ',name);pass++;}else{console.error('FAIL ',name);fail++;}}

ok('release 36 marker',/dataset\.losRelease='36'/.test(js));
ok('live control sits beside Actions',/v36LiveButton/.test(js)&&/insertBefore\(b,anchor\)/.test(js));
ok('live planning is moved ahead of retired summary groups',/body\.insertBefore\(live,cut\|\|null\)/.test(js));
ok('verbose summary groups are hidden',/monthly payment\|leverage\|cash and costs/.test(js)&&/data-v36-rail-hidden/.test(css));
ok('Property animation is stabilized',/v36-stable-property/.test(js)&&/animation:none!important/.test(css));
ok('Full page index moves below primary nav',/v36FullNavHost/.test(js)&&/primary\.nextSibling/.test(js));
ok('Full page index wraps without horizontal scroll',/grid-template-columns:repeat\(7/.test(css)&&/overflow:visible!important/.test(css));
ok('Loan chrome is full bleed with centered content',/width:100vw!important/.test(css)&&/--v36-measure:1320px/.test(css));
ok('footer mirrors compact app status',/v36SuiteFooter/.test(js)&&/browser autosave/.test(js));
ok('Assets is restored to the Qualification subgroup',/exposeAssetsTab/.test(js)&&/v36-qualification-active/.test(css));
ok('agency guideline selector includes Fannie Freddie FHA',/Fannie Mae/.test(js)&&/Freddie Mac/.test(js)&&/FHA/.test(js));
ok('account summaries separate income and reserve use',/Closing \/ reserves/.test(js)&&/<strong>Income:<\/strong>/.test(js));
ok('asset statement OCR accepts PDF image and text',/accept="\.pdf,image\/\*,\.txt"/.test(js)&&/pdfPageImages/.test(js)&&/ocrImages/.test(js));
ok('large deposits use an editable threshold',/v36DepositThreshold/.test(js)&&/largeDeposit:amount>=threshold/.test(js));
ok('asset import is reviewed before it is appended',/Add reviewed account/.test(js)&&/s\.assets\.rows\.push\(row\)/.test(js));
ok('asset JSON has a versioned schema',/mortgage-suite\.asset-statement\.v1/.test(js)&&/Unsupported schema version/.test(js));
ok('AI prompt requires JSON-only and no invented values',/Return JSON only/.test(js)&&/Do not infer missing values/.test(js));
ok('v36 CSS and JS are last injected layers',/patch-v35\.css[\s\S]+patch-v36\.css/.test(inject)&&/patch-v35\.js[\s\S]+patch-v36\.js/.test(inject));

console.log(`\nv36 UI: ${pass} passed, ${fail} failed`);
if(fail)process.exit(1);
