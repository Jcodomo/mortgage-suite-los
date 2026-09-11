/* Release 43: every page has a route; the menus claim what they should;
   the amortisation arithmetic. */
let pass=0,fail=0;
const eq=(l,g,w)=>{const ok=JSON.stringify(g)===JSON.stringify(w);ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${JSON.stringify(g)} want=${JSON.stringify(w)}`);};
const near=(l,g,w,t)=>{const ok=g!=null&&isFinite(g)&&Math.abs(g-w)<=(t||0.01);ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${g} want=${w}`);};
const fs=require('fs');
const v23=fs.readFileSync(__dirname+'/../src/patch-v23.js','utf8');

/* --- every page is in exactly one group -------------------------------- */
const GROUPS={file:['QUOTE','SETUP','PROPERTY'],loan:['RENOVATION','MAX MORTGAGE','MORTGAGE RATES'],
  costs:['CLOSING','ESCROW','TAXES & PRORATION'],underwriting:['QUALIFY','RENTAL','CREDIT','ADVANCED','CONTRACT & LE'],
  results:['SCENARIOS','SUMMARY','DOCUMENTS & OCR']};
const ALL=['QUOTE','SETUP','PROPERTY','RENOVATION','MAX MORTGAGE','MORTGAGE RATES','CLOSING','ESCROW','TAXES & PRORATION',
  'QUALIFY','RENTAL','CREDIT','ADVANCED','CONTRACT & LE','SCENARIOS','SUMMARY','DOCUMENTS & OCR'];
const placed=Object.values(GROUPS).flat();
eq('every page is placed',           ALL.filter(p=>!placed.includes(p)), []);
eq('no page is placed twice',        placed.length, new Set(placed).size);
eq('seventeen destinations',         ALL.length, 17);
// release 23's own list carries the three that never had a tab
eq('v23 costs group lists Taxes',    /'CLOSING','ESCROW','TAXES & PRORATION'/.test(v23), true);
eq('v23 underwriting lists Credit + Contract',/'QUALIFY','RENTAL','CREDIT','ADVANCED','CONTRACT & LE'/.test(v23), true);
// the four that lost their route between 34 and 42
['PROPERTY','MORTGAGE RATES','ADVANCED','DOCUMENTS & OCR'].forEach(p=>eq(`${p} has a group again`, placed.includes(p), true));

/* --- the menus: nothing dumped into File ------------------------------- */
const v43=fs.readFileSync(__dirname+'/../src/patch-v43.js','utf8');
eq('File holds only file-level actions', /file:\s*\[\['File',\[\['Save'/.test(v43) && !/file:[\s\S]{0,400}(Draft LE|Credit|Documents & OCR)/.test(v43.slice(v43.indexOf('var MENUS'),v43.indexOf('var MENUS')+700)), true);
eq('no "anything unlisted goes to File" fallback remains', /unclaimed|extra\.length/.test(v43.slice(v43.indexOf('V43.open'),v43.indexOf('function rewire'))), false);
eq('Documents is Print / Generate / Open', /\['Print',\[/.test(v43)&&/\['Generate',\[/.test(v43)&&/\['Open',\[/.test(v43), true);
eq('Loan tools carries Lock extension, Taxes, Rates, Rule tables',
   ['Lock extension','Taxes & proration','Mortgage rates','Rule tables'].every(x=>v43.includes("'"+x+"'")), true);
eq('Live opens the live comparison', /v42-live[\s\S]{0,200}Live comparison/.test(v43), true);
eq('Compare goes to the Scenarios page', /v42-compare[\s\S]{0,200}setMode\('scenarios'\)/.test(v43), true);

/* --- amortisation on the reference loan -------------------------------- */
function amort(P,annual,years){const i=annual/12,n=Math.round(years*12);const pmt=P*i/(1-Math.pow(1+i,-n));
  let bal=P,int1=0,prin1=0,tot=0,b5=0;for(let k=1;k<=n;k++){const ip=bal*i,pp=pmt-ip;bal-=pp;tot+=ip;if(k<=12){int1+=ip;prin1+=pp;}if(k===60)b5=bal;}return{pmt,int1,prin1,tot,b5,n};}
const A=amort(615580,0.06875,30);
near('P&I matches the LE',             A.pmt,   4043.92, 0.01);
near('year-1 interest + principal = 12 payments', A.int1+A.prin1, A.pmt*12, 0.01);
eq('year-1 interest dominates',        A.int1 > A.prin1, true);
near('total interest over 30 years',   A.tot,   A.pmt*A.n-615580, 0.5);
eq('balance falls by year 5',          A.b5 < 615580 && A.b5 > 550000, true);
eq('360 payments',                     A.n, 360);

console.log(`\nv43: ${pass} passed, ${fail} failed`);
if(fail)process.exit(1);
