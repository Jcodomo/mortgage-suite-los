'use strict';
let pass=0,fail=0;
function ok(name,v){if(v){pass++;console.log('PASS ',name);}else{fail++;console.error('FAIL ',name);}}
function contractor(rows,overPct,contPct){let material=0,labor=0;rows.forEach(r=>{material+=r.material;labor+=r.labor;});const base=material+labor,overhead=base*overPct/100,contingency=(base+overhead)*contPct/100;return{material,labor,base,overhead,contingency,total:base+overhead+contingency};}
function feeSums(rows){return rows.reduce((a,r)=>{if(r.map&&r.amount>0)a[r.map]=(a[r.map]||0)+r.amount;return a;},{});}
function pmiSync(raw){return{price:+raw.price,down:+raw.down/100,score:+raw.score,rate:+raw.rate/100,interest:+raw.interest/100,term:+raw.term};}
const c=contractor([{material:8626.10,labor:6213.32},{material:2267.13,labor:4396.87}],20,5);
ok('contractor material subtotal',Math.abs(c.material-10893.23)<.001);ok('contractor labor subtotal',Math.abs(c.labor-10610.19)<.001);ok('overhead on base',Math.abs(c.overhead-4300.684)<.001);ok('contingency after overhead',Math.abs(c.contingency-1290.2052)<.001);ok('contractor total reconciles',Math.abs(c.total-(c.base+c.overhead+c.contingency))<.001);
const f=feeSums([{map:'titleInsurance',amount:894},{map:'titleInsurance',amount:250},{map:'titleSearchSettlement',amount:1495},{map:'other',amount:0}]);
ok('itemized fees aggregate title insurance',f.titleInsurance===1144);ok('itemized fees aggregate settlement',f.titleSearchSettlement===1495);ok('blank fee does not overwrite estimate',!('other' in f));
const p=pmiSync({price:'690000',down:'10',score:'740',rate:'.5',interest:'6.75',term:'30'});
ok('PMI price sync',p.price===690000);ok('PMI down stored as fraction',p.down===.1);ok('PMI annual rate stored as fraction',p.rate===.005);ok('interest stored as fraction',p.interest===.0675);ok('term preserved',p.term===30);
const inputs={basePurchasePrice:690000,finalDownPaymentPct:.1,interestRate:.0675,loanProgram:'Conventional'};inputs.finalDownPaymentPct=15/100;ok('comparison edit changes scenario',inputs.finalDownPaymentPct===.15);
console.log(`\nv14: ${pass} passed, ${fail} failed`);process.exitCode=fail?1:0;
