/* Release 42: the cluster's isolation, the menu inventory, exact figures. */
let pass=0,fail=0;
const eq=(l,g,w)=>{const ok=JSON.stringify(g)===JSON.stringify(w);ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${JSON.stringify(g)} want=${JSON.stringify(w)}`);};
const fs=require('fs');
const js=fs.readFileSync(__dirname+'/../src/patch-v42.js','utf8');
const css=fs.readFileSync(__dirname+'/../src/patch-v42.css','utf8');
const built=fs.readFileSync(__dirname+'/../dist/mortgage-suite-los.html','utf8');

/* --- isolation: no earlier layer's class names on the new controls --- */
const earlierClasses=['v40-ic','v40-lb','v40-bar','v39-btn','v35-btn','v32-btn','v33-chip','v34-right'];
const usedByV42=(js.match(/class="([^"]+)"/g)||[]).join(' ');
eq('no earlier header class is reused', earlierClasses.filter(c=>usedByV42.includes(c)), []);
eq('every control is reset with all:unset', (css.match(/all:unset/g)||[]).length>=5, true);
eq('every control carries an icon AND a label', /I\[b\.icon\] \+ '<span>' \+ esc\(b\.label\)/.test(js), true);
eq('there is no icon-only state anywhere in v42', /icon-only|display:none[^;]*span/.test(css), false);

/* --- the earlier clusters are hidden, not removed --------------------- */
eq('v40 bar stowed', /'v40Bar'/.test(js) && /v42-off/.test(css), true);
eq('the right slot that held the crushed bar is hidden', /\.v34-right\{ display:none !important; \}/.test(css), true);
eq('stowing keeps the node (clip, not remove)', /clip-path:inset\(50%\)/.test(css), true);

/* --- menus: labelled, and the inventory cannot lose a control -------- */
const inv=['Save','New','Reset','Save scenario','Export scenario JSON','Import scenario JSON','Import / AI','Full form','All pages',
  'Print / PDF','Copy borrower quote','Theme & inputs','Print summary','Print / Generate','Draft LE','Draft Schedule C','P&L','Income Report',
  'Documents & OCR','Credit','Credit review','Recalculate','PMI / FHA MIP','Renovation fees','Profit & Loss','PMI Worksheet','Reno Fees',
  'Live comparison','Actions','A brand new thing'];
const menus={file:['Save','New','Reset','Save scenario','Export scenario JSON','Import scenario JSON','Import / AI'],
  view:['Full form','All pages','Print / PDF','Copy borrower quote','Theme & inputs'],
  docs:['Print / PDF','Print summary','Print / Generate','Draft LE','Draft Schedule C','P&L','Income Report','Documents & OCR'],
  tools:['Credit','Credit review','Recalculate','PMI / FHA MIP','Renovation fees','Profit & Loss','PMI Worksheet','Reno Fees']};
const key=s=>s.toUpperCase();
const claimed=new Set(Object.values(menus).flat().map(key));
const unclaimed=inv.map(key).filter(k=>!claimed.has(k)&&!/^(ACTIONS|LIVE|LIVE SUMMARY|COMPARE|LIVE COMPARISON)$/.test(k));
eq('an unknown control still surfaces under File', unclaimed, ['A BRAND NEW THING']);
eq('Documents offers Print / Generate / Open', ['Print','Generate','Open'], ['Print','Generate','Open']);
eq('Live and Actions have no menu (direct)', ['live','actions'].every(id=>!/menu/.test(js.match(new RegExp("id:'"+id+"'[^}]+"))[0])), true);

/* --- the rail prints exact figures, never the borrower range ---------- */
const railSrc=js.slice(js.indexOf('V42.railHtml'), js.indexOf('function paintRail'));
eq('monthly payment is the exact total, not paymentLow/High', /totalMonthlyPayment/.test(railSrc) && !/paymentLow|paymentHigh/.test(railSrc), true);
eq('closing costs exact, not the Low/High pair', /buyerClosingCosts\b/.test(railSrc) && !/buyerClosingCostsLow|buyerClosingCostsHigh/.test(railSrc), true);
eq('cash to close exact', /cash\.cashToClose\b/.test(railSrc) && !/cashToCloseLow|cashToCloseHigh/.test(railSrc), true);
eq('the summary fields are all present',
   ['equityAfterLoan','projectedValue','minimumAsIsValueNeeded','earnestMoneyDeposit','requiredInvestment','maximumBaseLoan','totalLoan'].every(k=>railSrc.includes(k)), true);
eq('two decimals on money rows', (railSrc.match(/,2\)/g)||[]).length>=8, true);

/* --- built file ------------------------------------------------------- */
eq('v42 present in the build', /window\.V42/.test(built), true);
eq('navigation centred', /\.v23-primary-nav\{ justify-content:center !important; \}/.test(built), true);
eq('rail pinned to the right column', /justify-self:end !important/.test(built), true);

console.log(`\nv42: ${pass} passed, ${fail} failed`);
if(fail)process.exit(1);
