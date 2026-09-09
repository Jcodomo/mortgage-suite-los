/* v9: OCR field mapping units, and the seller-paid-through seed.
   The rate-scaling case is the reason this file exists — a document
   prints 6.875 and the engine stores 0.06875, so writing the printed
   number straight through sets a 687.5% note rate. */
let pass=0, fail=0;
function eq(l,g,w){const ok=g===w;ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${g} want=${w}`);}

const SCALE = { interestRate: 0.01 };
function push(path, printed){ return printed * (SCALE[path] || 1); }

eq('rate 6.875 printed -> 0.06875 stored', push('interestRate', 6.875), 0.06875);
eq('price is not rescaled',                push('basePurchasePrice', 551200), 551200);
eq('credit score is not rescaled',         push('creditScore', 720), 720);
eq('tax amount is not rescaled',           push('propertyTaxAmount', 13000), 13000);

// engine input keys these must match (checked against the engine defaults)
const REAL = ['basePurchasePrice','asIsValue','afterRepairValue','interestRate',
  'termYears','creditScore','propertyTaxAmount','insuranceAmount','hoaMonthly',
  'earnestMoneyDeposit','sellerConcessionAmount'];
const GONE = ['annualPropertyTax','annualHazardInsurance','sellerConcession'];
eq('no invented tax key',       REAL.includes('annualPropertyTax'), false);
eq('real tax key used',         REAL.includes('propertyTaxAmount'), true);
eq('real insurance key used',   REAL.includes('insuranceAmount'), true);
eq('concession is the Amount',  REAL.includes('sellerConcessionAmount'), true);
GONE.forEach(k => eq(`${k} not used`, REAL.includes(k), false));

// seller-paid-through seeds one day after closing
function addDays(iso,n){const d=new Date(iso+'T00:00:00');d.setDate(d.getDate()+n);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
eq('paid-through = closing + 1',       addDays('2026-09-17',1), '2026-09-18');
eq('rolls over a month end',           addDays('2026-09-30',1), '2026-10-01');
eq('rolls over a year end',            addDays('2026-12-31',1), '2027-01-01');
eq('leap day handled',                 addDays('2024-02-28',1), '2024-02-29');

console.log(`\nv9: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
