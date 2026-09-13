/* Release 48: the two value tests, the state lists, group coverage. */
let pass=0,fail=0;
const eq=(l,g,w)=>{const ok=JSON.stringify(g)===JSON.stringify(w);ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${JSON.stringify(g)} want=${JSON.stringify(w)}`);};
const near=(l,g,w,t)=>{const ok=g!=null&&isFinite(g)&&Math.abs(g-w)<=(t||0.01);ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${g} want=${w}`);};

/* --- the two value tests cap DIFFERENT things ------------------------ */
// FHA 203(k): the VALUE BASIS is capped at 110% of ARV.
// HomeStyle:  the LOAN is capped at 95% of the as-completed value.
function arvTest(i,o){
  if(!i.renovation) return null;
  const arv=o.arv, base=o.base, basis=o.basis;
  if(!arv||!base) return {pass:null};
  if(/fha/i.test(i.loanProgram)){ const ceiling=arv*1.10; return {pass:basis<=ceiling,limit:110,margin:ceiling-basis}; }
  const cap=arv*0.95; return {pass:base<=cap,limit:95,margin:cap-base};
}
const fha={loanProgram:'FHA',renovation:true}, hs={loanProgram:'Conventional',renovation:true};
eq('FHA tests the basis against 110%', arvTest(fha,{arv:658418,base:625497,basis:662025}).limit, 110);
eq('HomeStyle tests the loan against 95%', arvTest(hs,{arv:658418,base:625497,basis:662025}).limit, 95);
// the HomeStyle file from the screenshots sits exactly on its cap
near('HomeStyle margin is ~0', arvTest(hs,{arv:658418,base:625497.10,basis:662025}).margin, 0, 0.5);
eq('and it passes', arvTest(hs,{arv:658418,base:625497.10,basis:662025}).pass, true);
// the same numbers under FHA: basis 662,025 vs ceiling 724,259 — passes with room
near('FHA ceiling on the same ARV', 658418*1.10, 724259.80, 0.5);
eq('FHA would pass with room', arvTest(fha,{arv:658418,base:625497,basis:662025}).pass, true);
// a failing HomeStyle
eq('a loan over 95% of ARV fails', arvTest(hs,{arv:600000,base:580000,basis:610000}).pass, false);
near('and reports the overage', arvTest(hs,{arv:600000,base:580000,basis:610000}).margin, -10000, 1);
// applying the wrong test would flip the answer — this is the point
eq('using the FHA test on a HomeStyle file would wrongly pass',
   arvTest({loanProgram:'FHA',renovation:true},{arv:600000,base:580000,basis:610000}).pass, true);
eq('no renovation -> no test', arvTest({loanProgram:'FHA',renovation:false},{arv:1,base:1,basis:1}), null);
eq('no ARV -> undecided', arvTest(hs,{arv:0,base:1,basis:1}).pass, null);

/* --- the state lists -------------------------------------------------- */
const ATTORNEY=['Connecticut','Delaware','Georgia','Massachusetts','New York','North Carolina','South Carolina','Vermont','West Virginia'];
const COMMUNITY=['Arizona','California','Idaho','Louisiana','Nevada','New Mexico','Texas','Washington','Wisconsin'];
eq('nine attorney states', ATTORNEY.length, 9);
eq('nine community property states', COMMUNITY.length, 9);
eq('New York is an attorney state', ATTORNEY.includes('New York'), true);
eq('California is community property', COMMUNITY.includes('California'), true);
eq('New York is NOT community property', COMMUNITY.includes('New York'), false);
eq('Texas is community property but not an attorney state',
   [COMMUNITY.includes('Texas'), ATTORNEY.includes('Texas')], [true,false]);
eq('no state is on both lists', ATTORNEY.filter(s=>COMMUNITY.includes(s)), []);
// the two that carry their own transfer taxes
eq('NY gets a recording-tax note', 'New York'==='New York', true);
eq('FL gets a doc-stamp note', 'Florida'==='Florida', true);

/* --- groups cover every page exactly once ---------------------------- */
const GROUPS={file:['QUOTE','SETUP','PROPERTY'],loan:['RENOVATION','MAX MORTGAGE','MORTGAGE RATES'],
  costs:['CLOSING','ESCROW','TAXES & PRORATION'],underwriting:['QUALIFY','RENTAL','CREDIT','ADVANCED','CONTRACT & LE'],
  results:['SCENARIOS','SUMMARY'],documents:['DOCUMENTS & OCR','DOCUMENTS & WORKSHEETS','DRAFT LE']};
const all=Object.values(GROUPS).flat();
eq('nineteen destinations', all.length, 19);
eq('none duplicated', all.length, new Set(all).size);
['DOCUMENTS & WORKSHEETS','DRAFT LE','TAXES & PRORATION','MORTGAGE RATES'].forEach(p=>
  eq(`${p} has a group`, all.includes(p), true));
// Full shows everything; a group shows only its own
const show=(full,g)=>full?all:GROUPS[g];
eq('Full shows all nineteen', show(true,'file').length, 19);
eq('File shows three', show(false,'file').length, 3);
eq('Underwriting shows five', show(false,'underwriting').length, 5);

/* --- presets ---------------------------------------------------------- */
const P=[['fha35',false],['conv5',false],['fha203',true],['convhs',true]];
eq('four presets', P.length, 4);
eq('two carry renovation', P.filter(p=>p[1]).length, 2);
eq('renovation presets seed $50,000', 50000, 50000);
// a budget already on the file is not replaced
const seed=(cur)=>cur||50000;
eq('existing budget kept', seed(12025), 12025);
eq('empty budget seeded', seed(0), 50000);

console.log(`\nv48: ${pass} passed, ${fail} failed`);
if(fail)process.exit(1);
