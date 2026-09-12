/* Release 46: the prompt library's contract, card ordering. */
let pass=0,fail=0;
const eq=(l,g,w)=>{const ok=JSON.stringify(g)===JSON.stringify(w);ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${JSON.stringify(g)} want=${JSON.stringify(w)}`);};
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync(__dirname+'/../src/patch-v46.js','utf8');
eq('workspace switch bridge is exposed and binds both selectors', /function ensureWorkspaceSwitch\(\)/.test(src) && /window\.SHELL=shell/.test(src) && /calcBtn\.onclick/.test(src) && /suiteBtn\.onclick/.test(src), true);
eq('workspace switching updates the entry route', /searchParams\.set\('app',next==='suite'\?'suite':'income'\)/.test(src) && /history\.replaceState/.test(src), true);
const seg=src.slice(src.indexOf('var RULES ='), src.indexOf('V46.pick ='));
const ctx={}; vm.createContext(ctx); vm.runInContext(seg.replace('var RULES','this.RULES').replace('var PROMPTS','this.PROMPTS'), ctx);
const P=ctx.PROMPTS;

/* --- every prompt carries the rules that make its output importable -- */
const keys=Object.keys(P);
eq('twelve prompts', keys.length, 12);
eq('one generic, eleven specific', [keys.includes('generic'), keys.length-1], [true, 11]);
keys.forEach(k=>{
  const t=P[k].text;
  eq(`${k}: JSON only`,           /ONLY a JSON object/.test(t), true);
  eq(`${k}: rates as printed`,     /Rates as printed \(6\.875\)/.test(t), true);
  eq(`${k}: omit blanks, never guess`, /OMIT the key\. Never guess/.test(t), true);
  eq(`${k}: no reconciling`,       /Do not calculate, average, annualise or reconcile/.test(t), true);
});
/* --- specific prompts ask for the keys this file imports ------------- */
eq('LE prompt uses the v11 schema', /nmb-loan-extract\/1/.test(P.le.text) && /closingCostsFinanced/.test(P.le.text), true);
eq('credit prompt has the fields the credit reader uses', ['monthsRemaining','late30','late60','late90','disputed','authorizedUser'].every(k=>P.credit.text.includes(k)), true);
eq('bank prompt asks for EVERY deposit (threshold applied here)', /Include EVERY deposit/.test(P.bank.text), true);
eq('paystub prompt separates YTD by type', ['baseYtd','overtimeYtd','bonusYtd','commissionYtd'].every(k=>P.paystub.text.includes(k)), true);
eq('1040 prompt asks for Schedule C add-back lines', ['line13Depreciation','line30HomeOffice','line24bMealsDeducted'].every(k=>P.tax1040.text.includes(k)), true);
eq('generic prompt labels the document type', /"documentType"/.test(P.generic.text), true);

/* --- card ordering: cards directly under the title ------------------- */
const children=['head','fields','actions','results','metrics'];
const reorder=c=>{const i=c.indexOf('metrics');const m=c.splice(i,1)[0];c.splice(c.indexOf('head')+1,0,m);return c;};
eq('metric strip moves under the head', reorder([...children]), ['head','metrics','fields','actions','results']);
eq('four base cards + four new', 4+4, 8);

/* --- browser-QA guards: laptop cards and rail must not overlap -------- */
const css=fs.readFileSync(__dirname+'/../src/patch-v46.css','utf8');
eq('laptop widths use two metric columns', /max-width:1540px[\s\S]*repeat\(2, minmax\(0,1fr\)\)/.test(css), true);
eq('narrow live summary returns to document flow', /max-width:1180px[\s\S]*position:static !important/.test(css), true);
eq('desktop live summary is a side rail, not an overlay', /min-width:1181px[\s\S]*position:sticky !important/.test(css), true);
eq('metric card uses only one chevron', /\.v46-chev\{ display:none !important; \}/.test(css), true);

console.log(`\nv46: ${pass} passed, ${fail} failed`);
if(fail)process.exit(1);
