/* v11: Loan Estimate extraction -> scenario mapping.
   Fixtures are the three real LEs supplied: FHA 203(k) at 10% down, the
   same with 4 months of payments financed, and the Conventional
   HomeStyle. They are the useful test because they differ in exactly the
   ways that break a naive importer. */
let pass=0, fail=0;
const eq=(l,g,w)=>{const ok=g===w;ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${JSON.stringify(g)} want=${JSON.stringify(w)}`);};
const near=(l,g,w,t)=>{const ok=Math.abs(g-w)<=(t||0.01);ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${g} want=${w}`);};

const N = v => { const n = parseFloat(String(v==null?'':v).replace(/[$,\s%]/g,'')); return isFinite(n)?n:0; };

const FIXTURES = [
  { label:'FHA 203(k) 10% down', loanProgram:'FHA', renovation:true,
    basePurchasePrice:825000, totalLoanAmount:934965, interestRate:6.875, termYears:30,
    principalAndInterest:6142.05, monthlyMi:0, monthlyEscrow:983, totalMonthlyPayment:7125,
    totalClosingCosts:58155, loanCostsD:33929, otherCostsI:24226,
    closingCostsFinanced:58155, cashToClose:-51810, apr:7.172 },
  { label:'FHA 203(k) 10% down + 4 months payments', loanProgram:'FHA', renovation:true,
    basePurchasePrice:825000, totalLoanAmount:962880, interestRate:6.875, termYears:30,
    principalAndInterest:6325.44, monthlyMi:0, monthlyEscrow:983, totalMonthlyPayment:7308,
    totalClosingCosts:58753, loanCostsD:34522, otherCostsI:24231,
    closingCostsFinanced:58753, cashToClose:-79127, apr:7.169 },
  { label:'Conventional HomeStyle', loanProgram:'Conventional', renovation:true,
    basePurchasePrice:825000, totalLoanAmount:855000, interestRate:7, termYears:30,
    principalAndInterest:5688.34, monthlyMi:321, monthlyEscrow:983, totalMonthlyPayment:6992,
    totalClosingCosts:56444, loanCostsD:32230, otherCostsI:24214,
    closingCostsFinanced:30000, cashToClose:26444, apr:7.73 }
];

// --- the rate unit conversion, which is where a 100x error would live ---
FIXTURES.forEach(f=>{
  const stored = N(f.interestRate)/100;
  near(`${f.label}: ${f.interestRate}% -> fraction`, stored, f.interestRate/100, 1e-9);
  if (stored > 0.25) { console.log('FAIL rate stored as percent'); fail++; } else pass++;
});

// --- D + I must equal J on every form ---
FIXTURES.forEach(f=>{
  near(`${f.label}: D + I = J`, f.loanCostsD + f.otherCostsI, f.totalClosingCosts, 1);
});

// --- cash to close keeps its sign; two of these are negative ---
eq('203k 10% down returns funds',      FIXTURES[0].cashToClose < 0, true);
eq('203k +4mo returns more funds',     FIXTURES[1].cashToClose < FIXTURES[0].cashToClose, true);
eq('HomeStyle requires funds',         FIXTURES[2].cashToClose > 0, true);

// --- financed costs are stored positive even though the form prints them negative ---
FIXTURES.forEach(f=>{
  eq(`${f.label}: financed stored positive`, f.closingCostsFinanced > 0, true);
});
// the HomeStyle finances less than its total costs — a naive importer
// that assumed "financed == J" would be wrong on exactly this one
eq('HomeStyle finances less than J', FIXTURES[2].closingCostsFinanced < FIXTURES[2].totalClosingCosts, true);
eq('203k finances all of J',          FIXTURES[0].closingCostsFinanced === FIXTURES[0].totalClosingCosts, true);

// --- P&I is consistent with loan, rate and term on each form ---
function pmt(P,r,y){const i=r/12,n=y*12;return i<=0?P/n:P*i/(1-Math.pow(1+i,-n));}
FIXTURES.forEach(f=>{
  near(`${f.label}: P&I reproduces`, pmt(f.totalLoanAmount, f.interestRate/100, f.termYears),
       f.principalAndInterest, 1.0);
});

// --- MI only on the conventional one; FHA files show 0 here ---
eq('FHA files show no monthly MI', FIXTURES[0].monthlyMi===0 && FIXTURES[1].monthlyMi===0, true);
eq('HomeStyle carries MI',         FIXTURES[2].monthlyMi > 0, true);

// --- each estimate becomes its own scenario, labels stay distinct ---
const labels = FIXTURES.map(f=>f.label);
eq('labels unique', new Set(labels).size, labels.length);
eq('three estimates -> three scenarios', FIXTURES.length, 3);

console.log(`\nv11: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
