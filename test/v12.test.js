/* v12: credit report rules and the rate solver.
   These produce numbers and eligibility calls a processor would act on,
   so they are tested against known-good arithmetic and the actual
   agency thresholds rather than eyeballed. */
let pass=0, fail=0;
const eq=(l,g,w)=>{const ok=g===w;ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${JSON.stringify(g)} want=${JSON.stringify(w)}`);};
const near=(l,g,w,t)=>{const ok=(g!==null&&g!==undefined&&isFinite(g))&&Math.abs(g-w)<=(t||0.01);ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${g} want=${w}`);};

const N = v => { const n = parseFloat(String(v==null?'':v).replace(/[$,\s%]/g,'')); return isFinite(n)?n:0; };
const pvFactor=(i,n)=> i<=0 ? n : (1-Math.pow(1+i,-n))/i;
function solveApr(balance,payment,months){
  balance=N(balance);payment=N(payment);months=Math.round(N(months));
  if(balance<=0||payment<=0||months<=0)return null;
  const total=payment*months;
  if(total<balance)return{apr:null,reason:'payments do not repay the balance'};
  if(Math.abs(total-balance)<0.01)return{apr:0,reason:'interest-free'};
  let lo=0,hi=2/12;
  for(let k=0;k<200;k++){const mid=(lo+hi)/2;
    if(payment*pvFactor(mid,months)>balance)lo=mid;else hi=mid;}
  const apr=((lo+hi)/2)*12*100;
  if(apr<0.05)return{apr:0,reason:'interest-free or nearly so'};
  if(apr>190)return{apr:null,reason:'implausible'};
  return{apr:apr,reason:''};
}
// --- round-trip against a known amortisation ---
function pmt(P,annual,n){const i=annual/12;return i<=0?P/n:P*i/(1-Math.pow(1+i,-n));}
[[20000,0.079,60],[8500,0.1499,36],[35000,0.0449,72],[1200,0.2999,12]].forEach(([P,r,n])=>{
  const payment=pmt(P,r,n);
  const got=solveApr(P,payment,n);
  near(`solve ${(r*100).toFixed(2)}% over ${n}mo`, got.apr, r*100, 0.02);
});
// --- zero-interest loan ---
const z=solveApr(6000,500,12);          // 500*12 === 6000 exactly
near('true 0% loan solves to 0', z.apr, 0, 0.01);
eq('0% loan is not rejected', z.apr !== null, true);
const shortfall=solveApr(6000,400,12);  // 4800 < 6000
eq('a real shortfall is still refused', shortfall.apr, null);
// --- payments that never repay: must refuse, not return a number ---
const bad=solveApr(10000,100,60);   // 100*60 = 6000 < 10000
eq('negative amortisation refused', bad.apr, null);
eq('and says why', /do not repay/.test(bad.reason), true);
// --- missing inputs ---
eq('no months -> null', solveApr(5000,200,0), null);
eq('no payment -> null', solveApr(5000,0,36), null);

// --- exclusion thresholds, per agency ---
const RULES={FNMA:{maxMonths:10},FHLMC:{maxMonths:10},FHA:{maxMonths:9},VA:{maxMonths:10}};
const elig=(agency,months)=> months>0 && months<=RULES[agency].maxMonths;
eq('FNMA 10 months qualifies',  elig('FNMA',10), true);
eq('FNMA 11 months does not',   elig('FNMA',11), false);
// FHA says "fewer than 10", so 10 must FAIL where Fannie passes
eq('FHA 10 months does NOT qualify', elig('FHA',10), false);
eq('FHA 9 months qualifies',         elig('FHA',9),  true);
eq('FHA differs from FNMA at 10',    elig('FHA',10) !== elig('FNMA',10), true);

// --- leases are never excluded, however few payments remain ---
const TYPES={lease:{installment:true,neverExclude:true},auto:{installment:true,neverExclude:false},
             revolving:{installment:false,neverExclude:false}};
function testExcl(type,months,agency){
  if(TYPES[type].neverExclude)return false;
  if(!TYPES[type].installment)return false;
  return elig(agency,months);
}
eq('lease with 3 payments left still counts', testExcl('lease',3,'FNMA'), false);
eq('auto with 3 payments left may be omitted', testExcl('auto',3,'FNMA'), true);
eq('revolving never uses the months test', testExcl('revolving',2,'FNMA'), false);

// --- FHA 5% cap across the file ---
function fhaCap(excludedPayments, gross){
  const sum=excludedPayments.reduce((a,b)=>a+b,0);
  return { ok: sum <= gross*0.05, sum, cap: gross*0.05 };
}
const c1=fhaCap([300,200],10000);       // 500 vs 500 cap
eq('FHA cap met exactly passes', c1.ok, true);
const c2=fhaCap([400,200],10000);       // 600 vs 500 cap
eq('FHA cap exceeded fails', c2.ok, false);
near('cap is 5% of gross', c2.cap, 500, 0.01);

// --- payoff ranking: DTI relief vs rate give different orders ---
const lines=[
  {name:'0% furniture', balance:3000, payment:250, apr:0},      // relief .0833
  {name:'Card 24%',     balance:6000, payment:120, apr:24},     // relief .02
  {name:'Auto 6%',      balance:18000,payment:420, apr:6}       // relief .0233
];
const byRelief=[...lines].sort((a,b)=>(b.payment/b.balance)-(a.payment/a.balance)).map(x=>x.name);
const byRate=[...lines].sort((a,b)=>b.apr-a.apr).map(x=>x.name);
eq('relief ranks the 0% loan first', byRelief[0], '0% furniture');
eq('rate ranks the 24% card first',  byRate[0],   'Card 24%');
eq('the two rankings genuinely differ', byRelief[0]!==byRate[0], true);
near('relief of furniture loan', 250/3000, 0.0833, 0.0001);

console.log(`\nv12: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
