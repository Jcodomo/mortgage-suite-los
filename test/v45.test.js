/* Release 45: draw tiers at their edges, naming, the float fix, address
   cleanup, tax due dates, seller-credit basis switching. */
let pass=0,fail=0;
const eq=(l,g,w)=>{const ok=JSON.stringify(g)===JSON.stringify(w);ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${JSON.stringify(g)} want=${JSON.stringify(w)}`);};
const N=v=>{const n=parseFloat(String(v==null?'':v).replace(/[$,%\s]/g,''));return isFinite(n)?n:0;};
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();

/* --- draw tiers: the boundaries are where mistakes live -------------- */
const tier=r=>{r=N(r);if(r<=0)return 0;if(r<25000)return 2;if(r<60000)return 3;if(r<100000)return 4;return 5;};
eq('$24,999 -> 2 draws',  tier(24999), 2);
eq('$25,000 -> 3 draws',  tier(25000), 3);
eq('$59,999 -> 3 draws',  tier(59999), 3);
eq('$60,000 -> 4 draws',  tier(60000), 4);
eq('$99,999 -> 4 draws',  tier(99999), 4);
eq('$100,000 -> 5 draws', tier(100000), 5);
eq('$114,365 -> 5 draws', tier(114365), 5);
eq('no renovation -> 0',  tier(0), 0);
// the engine's own table differs at 35k and 75k — this is why override is needed
const engine=r=>r<35000?2:r<=75000?3:5;
eq('engine and requested tiers disagree at $30,000', engine(30000)!==tier(30000), true);
eq('and at $80,000', engine(80000)!==tier(80000), true);
// a count the user typed is never overwritten
function apply(inputs,want){ const last=inputs.v45Last; const untouched=!inputs.manualOverride||last==null||N(inputs.manualDrawCount)===N(last);
  if(untouched&&(N(inputs.manualDrawCount)!==want||!inputs.manualOverride)){ return {...inputs,manualOverride:true,manualDrawCount:want,v45Last:want}; } return inputs; }
let d={manualOverride:false,manualDrawCount:0};
d=apply(d,3); eq('first pass sets 3', d.manualDrawCount, 3);
d={...d,manualDrawCount:6};           // the user typed 6
d=apply(d,4); eq('a typed count survives a new tier', d.manualDrawCount, 6);
// conventional per-draw fee only replaces the default
const fee=(program,cur)=>(/conventional/i.test(program)&&cur===375)?150:cur;
eq('conventional default 375 -> 150', fee('Conventional',375), 150);
eq('conventional typed 200 stays',    fee('Conventional',200), 200);
eq('FHA keeps 375',                   fee('FHA',375), 375);

/* --- scenario names --------------------------------------------------- */
const nameFor=(i,o)=>{ let who=norm(i.borrowerName||''); if(!who){ const street=norm(i.propertyAddress||'').split(',')[0];
  who=street&&!/^\d{5}$/.test(street)?street:(norm(i.city||'')?norm(i.city):'File '+new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})); }
  let dp=N(i.finalDownPaymentPct); if(dp<=1)dp*=100; const prog=o.programLabel||((i.loanProgram||'')+(i.renovation?(i.loanProgram==='FHA'?' 203(k)':' HomeStyle'):''));
  let rate=N(i.interestRate); if(rate<=1)rate*=100; return [who,prog,(dp?parseFloat(dp.toFixed(2))+'% down':''),(rate?parseFloat(rate.toFixed(3))+'%':'')].filter(Boolean).join(' · '); };
eq('borrower named', nameFor({borrowerName:'Fischetti',loanProgram:'FHA',renovation:true,finalDownPaymentPct:.035,interestRate:.06875},{}), 'Fischetti · FHA 203(k) · 3.5% down · 6.875%');
eq('no borrower -> street', nameFor({propertyAddress:'209 N Oak St, Garden City, NY',loanProgram:'Conventional',finalDownPaymentPct:.05,interestRate:.07},{}), '209 N Oak St · Conventional · 5% down · 7%');
eq('a bare zip is not a street', nameFor({propertyAddress:'11530',city:'Garden City',loanProgram:'FHA',finalDownPaymentPct:.035},{}), 'Garden City · FHA · 3.5% down');
eq('never starts with Unnamed', /^Unnamed/.test(nameFor({},{})), false);
eq('program appears once', (nameFor({borrowerName:'X',loanProgram:'Conventional',renovation:true},{programLabel:'Conventional HomeStyle'}).match(/Conventional/g)||[]).length, 1);

/* --- the float --------------------------------------------------------- */
const clean=v=>String(parseFloat(N(v).toFixed(6)));
eq('6.875000000000001 -> 6.875', clean(0.06875*100), '6.875');
eq('7.25 stays', clean(7.25), '7.25');
eq('6 stays 6', clean(6), '6');

/* --- address cleanup --------------------------------------------------- */
const cleanAddr=l=>norm(l).replace(/,\s*(United States( of America)?|USA|US)\s*$/i,'').replace(/\s*,\s*,/g,',').replace(/,\s*$/,'');
eq('United States stripped', cleanAddr('11530, Village of Garden City, Nassau County, New York, United States'), '11530, Village of Garden City, Nassau County, New York');
eq('USA stripped', cleanAddr('1 Main St, Hicksville, NY 11801, USA'), '1 Main St, Hicksville, NY 11801');
eq('Canada kept', cleanAddr('1 Front St, Toronto, ON, Canada'), '1 Front St, Toronto, ON, Canada');
const parse=r=>{const a=r.address||{};return {city:a.city||a.town||a.village||a.hamlet||a.municipality||'',county:String(a.county||'').replace(/ county$/i,''),zip:String(a.postcode||'').slice(0,5),line:[a.house_number,a.road].filter(Boolean).join(' ')};};
eq('nominatim parts', parse({address:{house_number:'209',road:'North Oak Street',village:'Garden City',county:'Nassau County',postcode:'11530-1234',state:'New York'}}), {city:'Garden City',county:'Nassau',zip:'11530',line:'209 North Oak Street'});

/* --- tax due dates ------------------------------------------------------ */
const CYCLES={'Nassau County, NY — Jan 10 / Jul 10':[{due:'01-10',covers:'01-01',pct:.5},{due:'07-10',covers:'07-01',pct:.5}],
  'Quarterly — Feb / May / Aug / Nov':[{due:'02-01',pct:.25},{due:'05-01',pct:.25},{due:'08-01',pct:.25},{due:'11-01',pct:.25}]};
const due=(name,year)=>(CYCLES[name]||[]).map(c=>{const m=c.due.split('-');const d=new Date(year,+m[0]-1,+m[1]);return {label:d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),pct:c.pct};});
eq('Nassau 2026', due('Nassau County, NY — Jan 10 / Jul 10',2026).map(x=>x.label), ['January 10, 2026','July 10, 2026']);
eq('quarterly has four', due('Quarterly — Feb / May / Aug / Nov',2026).length, 4);
eq('percentages sum to 100', due('Quarterly — Feb / May / Aug / Nov',2026).reduce((a,x)=>a+x.pct,0), 1);
eq('unknown cycle -> empty', due('nope',2026), []);

/* --- seller credit basis follows the field typed in -------------------- */
const basis=path=>path==='sellerConcessionAmount'?'dollar':'percent';
eq('typing dollars -> dollar basis', basis('sellerConcessionAmount'), 'dollar');
eq('typing percent -> percent basis', basis('sellerConcessionPct'), 'percent');

console.log(`\nv45: ${pass} passed, ${fail} failed`);
if(fail)process.exit(1);
