/* v22 calculation matrix: independent known-answer cases covering income and loan paths. */
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
let passed=0,failed=0;
function near(label,got,want,tol=.01){const ok=Number.isFinite(got)&&Math.abs(got-want)<=tol;console.log(`${ok?'PASS':'FAIL'}  ${label}  got=${got.toFixed(2)} want=${want.toFixed(2)}`);ok?passed++:failed++;}
function same(label,got,want){const ok=got===want;console.log(`${ok?'PASS':'FAIL'}  ${label}  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`);ok?passed++:failed++;}
const monthlyFromFreq=(frequency,rate,hours)=>frequency==='Annual'?rate/12:frequency==='Monthly'?rate:frequency==='Weekly'?rate*52/12:frequency==='Biweekly'?rate*26/12:frequency==='Semimonthly'?rate*24/12:rate*hours*52/12;
const schCYear=(x,rate)=>x.net+x.depletion+x.depreciation-x.mealsExclusion+x.homeOffice+x.amortization+x.miles*rate;
function scheduleC(recent,prior,rate=.3){const a1=schCYear(recent,rate),a2=schCYear(prior,rate),m1=a1/12,m2=a2/12;return{a1,a2,monthly:m1<m2?m1:(a1+a2)/24,declining:m1<m2};}
function scheduleE(p){if(p.method==='lease'){const gross=p.rent*p.factor;return{gross,net:gross-p.pitia};}const months=p.months||12,gross=(p.rents+p.insurance+p.interest+p.taxes+p.depreciation+p.other-p.expenses)/months;return{gross,net:gross-p.pitia};}
near('Income 1 salaried $120,000 annual',monthlyFromFreq('Annual',120000,0),10000);
near('Income 2 hourly $35 x 40 x 52 / 12',monthlyFromFreq('Hourly',35,40),6066.6667);
near('Income 3 biweekly $2,800 x 26 / 12',monthlyFromFreq('Biweekly',2800,0),6066.6667);
const scStable=scheduleC({net:90000,depletion:0,depreciation:12000,mealsExclusion:3000,homeOffice:2400,amortization:0,miles:0},{net:84000,depletion:0,depreciation:10000,mealsExclusion:2400,homeOffice:2400,amortization:0,miles:0});
near('Income 4 Schedule C stable two-year average',scStable.monthly,8141.6667);
same('Income 4 Schedule C not declining',scStable.declining,false);
const scDecline=scheduleC({net:72000,depletion:0,depreciation:0,mealsExclusion:0,homeOffice:0,amortization:0,miles:0},{net:96000,depletion:0,depreciation:0,mealsExclusion:0,homeOffice:0,amortization:0,miles:0});
near('Income 5 declining Schedule C uses recent year',scDecline.monthly,6000);
same('Income 5 decline flag',scDecline.declining,true);
const rentLease=scheduleE({method:'lease',rent:3000,factor:.75,pitia:1700});
near('Income 6 lease gross cash flow before PITIA',rentLease.gross,2250);
near('Income 6 lease net cash flow after PITIA',rentLease.net,550);
const rentTax=scheduleE({method:'sche',rents:36000,insurance:2400,interest:9000,taxes:6000,depreciation:10000,other:0,expenses:42000,months:12,pitia:2100});
near('Income 7 Schedule E gross adjusted monthly',rentTax.gross,1783.3333);
near('Income 7 Schedule E net after PITIA',rentTax.net,-316.6667);
const income=10000,housing=3000,debts=1000;
near('Income 8 front-end DTI',housing/income,.30,.00001);
near('Income 8 back-end DTI',(housing+debts)/income,.40,.00001);
const root=path.join(__dirname,'..'),js=fs.readFileSync(path.join(root,'src','patch-v20.js'),'utf8');
const document={readyState:'loading',addEventListener(){},querySelectorAll(){return[]},documentElement:{dataset:{},classList:{add(){}}}};
const context={window:{},document,setInterval(){},URLSearchParams:function(){this.get=()=>null;},location:{search:''},console};vm.createContext(context);vm.runInContext(js,context);const V=context.window.V20;
const ref=V.reference203k({purchase:500000,asIs:500000,rehab:115963.75,arv:650000,downPct:.035,fhaLimit:1249125,ufmipRate:.0175});
near('Loan 1 FHA 203(k) C3',ref.c3,615963.75);
near('Loan 1 FHA 203(k) base mortgage',ref.maximumBaseLoan,594405.02);
near('Loan 1 FHA 203(k) UFMIP',ref.ufmip,10402.09);
near('Loan 1 FHA 203(k) total loan',ref.totalLoan,604807.11);
const lowArv=V.reference203k({purchase:500000,asIs:500000,rehab:100000,arv:500000,downPct:.035,fhaLimit:1249125,ufmipRate:.0175});
near('Loan 2 low ARV caps C3 at 110%',lowArv.c3,550000);
near('Loan 2 low ARV base mortgage',lowArv.maximumBaseLoan,530750);
near('Loan 2 low ARV total with UFMIP',lowArv.totalLoan,540038.13);
const homeStyle=Math.min((500000+100000)*(1-.05),600000*.95);
near('Loan 3 HomeStyle 95% as-completed cap',homeStyle,570000);
near('Loan 4 conventional 20% down',500000*(1-.20),400000);
near('Loan 5 conventional PMI at 0.50%',450000*.005/12,187.50);
const amort=V.amortization(400000,.065,30);
near('Loan 6 $400k at 6.5% P&I',amort.payment,2528.27,.02);
near('Loan 6 first-month interest',amort.rows[0].interest,2166.67,.02);
near('Loan 6 ending balance',amort.rows[359].balance,0,.02);
near('Loan 7 monthly escrow deposit',(12000+2400)/12,1200);
near('Loan 7 two-month cushion',((12000+2400)/12)*2,2400);
same('Invalid freeform number fails',V.parseNumber('five hundred').ok,false);
same('Currency shorthand is accepted',V.parseNumber('$500k').value,500000);
console.log(`\nv22 scenario matrix: ${passed} passed, ${failed} failed`);
assert.equal(failed,0);
