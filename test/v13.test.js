'use strict';
let pass=0,fail=0;
function ok(name,cond){if(cond){pass++;console.log('PASS ',name);}else{fail++;console.error('FAIL ',name);}}
function pmi(home,down,annual,interest,term){const loan=home*(1-down/100),monthly=loan*annual/100/12,r=interest/100/12,pay=r?loan*r*Math.pow(1+r,term*12)/(Math.pow(1+r,term*12)-1):loan/(term*12);let bal=loan,m=0;while(home&&bal/home>.8&&m<term*12){bal=bal*(1+r)-pay;m++;}return{loan,monthly,m,total:monthly*m};}
function projection(value,rate){let out=[];for(let y=1;y<=5;y++){value*=1+rate/100;out.push(value);}return out;}
function pl(income,expenses){const inc=income.reduce((a,x)=>a+x,0),exp=expenses.reduce((a,x)=>a+x,0),net=inc-exp;return{inc,exp,net,margin:inc?net/inc*100:0,ratio:inc?exp/inc*100:0,risk:net<0||net/inc*100<5?'High':(net/inc*100<15||exp/inc*100>75?'Moderate':'Low')};}
const m=pmi(400000,10,.5,6.5,30);
ok('PMI loan amount',m.loan===360000);ok('PMI monthly estimate',Math.abs(m.monthly-150)<.001);ok('PMI removal month is bounded',m.m>0&&m.m<360);ok('PMI total uses removal month',m.total===m.monthly*m.m);
const up=projection(400000,3.5),down=projection(400000,-2);
ok('five projection rows',up.length===5);ok('appreciation compounds',up[4]>up[0]);ok('depreciation is allowed',down[4]<down[0]);
const a=pl([100000],[60000,10000]),b=pl([50000],[52000]);
ok('P&L totals',a.net===30000);ok('P&L margin',a.margin===30);ok('expense ratio',a.ratio===70);ok('positive file low risk',a.risk==='Low');ok('loss is high risk',b.risk==='High');
ok('scenario package schema rejects arbitrary JSON',({}).schema!=='mortgage-suite-scenario');
console.log(`\nv13: ${pass} passed, ${fail} failed`);process.exitCode=fail?1:0;
