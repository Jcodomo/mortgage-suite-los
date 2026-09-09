/* v10: the free-form number pipeline — strip and shorthand expansion.
   Exists because parseFloat("$550,000") is NaN, N() turns NaN into 0,
   and a stray "$" typed into a price field would have zeroed the loan. */
let pass=0, fail=0;
const eq=(l,g,w)=>{const ok=g===w;ok?pass++:fail++;console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${JSON.stringify(g)} want=${JSON.stringify(w)}`);};

function N(v){ v=parseFloat(v); return isFinite(v)?v:0; }
const stripLoose = v => String(v).replace(/[$,\s]/g,'');
function expandShorthand(v){
  const s=stripLoose(v); let m;
  if((m=s.match(/^(-?\d*\.?\d+)[kK]$/))) return String(N(m[1])*1e3);
  if((m=s.match(/^(-?\d*\.?\d+)[mM]$/))) return String(N(m[1])*1e6);
  if((m=s.match(/^(-?\d*\.?\d+)%$/)))    return m[1];
  return s;
}
// the motivating case
eq('N("$550,000") without stripping is 0', N("$550,000"), 0);
eq('strip makes it parseable',             N(stripLoose("$550,000")), 550000);
eq('spaces stripped',                      stripLoose("550 000"), "550000");
// shorthand at commit
eq('550k -> 550000',    expandShorthand('550k'),  '550000');
eq('1.2m -> 1200000',   expandShorthand('1.2m'),  '1200000');
eq('6.875% -> 6.875',   expandShorthand('6.875%'),'6.875');
eq('$1.2M with junk',   expandShorthand('$1.2M'), '1200000');
eq('-25k negatives ok', expandShorthand('-25k'),  '-25000');
eq('plain number untouched', expandShorthand('550000'), '550000');
eq('k mid-word not expanded', expandShorthand('401k-ish'), '401k-ish');
// stip gift detection shape
const rows=[{type:'checking',bal:5000},{type:'Gift funds',bal:20000}];
eq('gift row detected', rows.some(r=>/gift/i.test(r.type||'')&&N(r.bal)>0), true);
eq('no gift when zero', [{type:'gift',bal:0}].some(r=>/gift/i.test(r.type||'')&&N(r.bal)>0), false);

console.log(`\nv10: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
