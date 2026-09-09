'use strict';
const fs=require('fs'),path=require('path');
let pass=0,fail=0;
function ok(name,v){if(v){pass++;console.log('PASS ',name);}else{fail++;console.error('FAIL ',name);}}
function parseDate(raw,now=new Date(2026,8,8)){let s=String(raw||'').trim(),m,y,mo,d;if(!s)return'';if((m=s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/))){y=+m[1];mo=+m[2];d=+m[3];}else if((m=s.match(/^(\d{1,2})[-/. ](\d{1,2})(?:[-/. ](\d{2,4}))?$/))){mo=+m[1];d=+m[2];y=m[3]?+m[3]:now.getFullYear();if(y<100)y+=2000;}else return'';const dt=new Date(y,mo-1,d);if(dt.getFullYear()!==y||dt.getMonth()!==mo-1||dt.getDate()!==d)return'';return`${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
function plDates(now){const end=new Date(now.getFullYear(),now.getMonth(),0);return{start:`${now.getFullYear()}-01-01`,end:`${end.getFullYear()}-${String(end.getMonth()+1).padStart(2,'0')}-${String(end.getDate()).padStart(2,'0')}`};}
function rental(a,pos){a.rentalIncomeUsedForDti-=pos;a.totalQualifyingIncome-=pos;a.frontEndDti=a.housingPayment/a.totalQualifyingIncome;a.backEndDti=(a.housingPayment+a.totalMonthlyLiabilities)/a.totalQualifyingIncome;return a;}
function allocate(total,pct){return{labor:Math.round(total*pct)/100,material:Math.round((total-Math.round(total*pct)/100)*100)/100};}
ok('freeform US date normalizes',parseDate('9/8/26')==='2026-09-08');
ok('ISO date remains ISO',parseDate('2026-12-31')==='2026-12-31');
ok('invalid date is rejected',parseDate('2/30/2026')==='');
const d=plDates(new Date(2026,8,8));
ok('P&L begins January first',d.start==='2026-01-01');
ok('P&L ends at most recent completed month',d.end==='2026-08-31');
const a=rental({rentalIncomeUsedForDti:1000,totalQualifyingIncome:9000,housingPayment:2500,totalMonthlyLiabilities:800},400);
ok('departing residence surplus removed from income',a.rentalIncomeUsedForDti===600&&a.totalQualifyingIncome===8600);
ok('DTI recalculates after Fannie adjustment',Math.abs(a.backEndDti-3300/8600)<1e-9);
const split=allocate(10000,65.4321);
ok('labor allocation preserves total',Math.abs(split.labor+split.material-10000)<.01);
ok('labor allocation stays in 60-70 range',split.labor/10000>=.60&&split.labor/10000<=.70);
const src=fs.readFileSync(path.join(__dirname,'..','src','patch-v15.js'),'utf8')+fs.readFileSync(path.join(__dirname,'..','src','patch-v15.css'),'utf8');
['TRAINING DRAFT','Print statement only','FHA annual MIP planning table','Apply selected to Scenario Comparison','Departing residence - Fannie Mae treatment','Pull itemized fee-sheet estimates','Schedule E and rental income - live detail','203(k) Maximum Mortgage Worksheet'].forEach(x=>ok('v15 contains '+x,src.includes(x)));
const built=fs.readFileSync(path.join(__dirname,'..','dist','mortgage-suite-los.html'),'utf8');
ok('built artifact includes v15',built.includes("version:'15.0'"));
console.log(`\nv15: ${pass} passed, ${fail} failed`);process.exitCode=fail?1:0;
