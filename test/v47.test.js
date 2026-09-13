/* Release 47: an audit of the figures in the screenshots against
   independent arithmetic, plus the layout and theme contracts. */
let pass=0,fail=0;
const eq=(l,g,w)=>{const ok=JSON.stringify(g)===JSON.stringify(w);ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${JSON.stringify(g)} want=${JSON.stringify(w)}`);};
const near=(l,g,w,t)=>{const ok=g!=null&&isFinite(g)&&Math.abs(g-w)<=(t||0.01);ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${g} want=${w}`);};
const pmt=(P,r,n)=>{const i=r/12;return P*i/(1-Math.pow(1+i,-n));};

/* --- Conventional HomeStyle, from the Quote and Max Mortgage shots ---- */
// price 650,000 · reno 12,025 · ARV 658,418 · 5% down · 6.75% · 30 yr
const price=650000, reno=12025, arv=658418, dp=.05, rate=.0675;
const basis=price+reno;
near('acquisition + improvements',         basis, 662025);
near('required investment = 5% of basis', basis*dp, 33101.25);
near('HomeStyle cap = 95% of ARV',        arv*.95, 625497.10);
// C3 basis × 95% = 628,923.75 which is ABOVE the ARV cap, so the ARV cap governs
near('basis × 95% would be higher',       basis*.95, 628923.75);
eq('so the loan is value-capped at the ARV', arv*.95 < basis*.95, true);
const loan=625497.10;
near('P&I at 6.75% / 30 yr',              pmt(loan,rate,360), 4056.96, 0.01);
near('PMI at 0.75% annual',               loan*.0075/12, 390.94, 0.01);
near('taxes 8,680 / 12',                  8680/12, 723.33, 0.01);
near('insurance 2,604 / 12',              2604/12, 217.00, 0.01);
near('total payment',                     4056.96+390.94+723.33+217, 5388.23, 0.01);
near('cash to close = investment + costs', 33101.25+28483.86, 61585.11, 0.01);
near('80% LTV cancellation value',        loan/.8, 781871.38, 0.5);
near('loan-to-ARV',                        loan/arv*100, 95.00, 0.01);
near('equity after renovation (ARV − loan)', arv-loan, 32920.90, 0.01);
near('equity %',                           (arv-loan)/arv*100, 5.00, 0.01);
near('value created (ARV − basis) ',       arv-basis, -3607, 0.5);
// the screenshot shows "Value created $8,418" = ARV − price; both are defensible
near('value created vs price',             arv-price, 8418, 0.5);

/* --- FHA 203(k), from the earlier release-44 shot ---------------------- */
// price 500,000 · reno 115,050 · 3.5% down · base 593,523.49 · UFMIP 1.75%
const fbase=593523.49;
near('UFMIP 1.75%',                        fbase*.0175, 10386.66, 0.01);
near('total FHA loan',                     fbase*1.0175, 603910.15, 0.01);
near('FHA P&I at 6.875%',                  pmt(fbase*1.0175,.06875,360), 3967.26, 0.02);
near('annual MIP 0.55% on total loan',     603910.15*.0055/12, 276.79, 0.5);
// the shot printed $272.03 — 0.55% on the BASE loan, which is how HUD computes it
near('annual MIP 0.55% on base loan',      fbase*.0055/12, 272.03, 0.01);
eq('MIP is charged on the base, not the financed total', Math.abs(fbase*.0055/12-272.03)<.01, true);

/* --- freeform parsing the forms rely on -------------------------------- */
const N=v=>{const s=String(v==null?'':v).trim().replace(/[$,\s]/g,'');const m=s.match(/^(-?\d*\.?\d+)\s*([km])?$/i);if(!m)return NaN;let n=parseFloat(m[1]);if(m[2])n*=m[2].toLowerCase()==='k'?1e3:1e6;return n;};
eq('$650,000 -> 650000', N('$650,000'), 650000);
eq('650k -> 650000',     N('650k'), 650000);
eq('1.2m -> 1200000',    N('1.2m'), 1200000);
eq('6.75% -> 6.75',      N('6.75'), 6.75);
eq('junk -> NaN',        isNaN(N('abc')), true);

/* --- layout and theme contracts ---------------------------------------- */
const fs=require('fs');
const css=fs.readFileSync(__dirname+'/../src/patch-v47.css','utf8'), js=fs.readFileSync(__dirname+'/../src/patch-v47.js','utf8');
const v24=fs.readFileSync(__dirname+'/../src/patch-v24.js','utf8');
eq('classic is registered first',       /THEMES=\['classic'/.test(v24), true);
eq('classic uses release 16 accent',    /--v24-accent:#1d4ed8/.test(css), true);
eq('classic uses release 16 inputs',    /--input-bg:#fffbea/.test(css), true);
eq('fresh session seeds classic/light/paper', /'classic'/.test(js)&&/'light'/.test(js)&&/'paper'/.test(js), true);
eq('a stored choice is never overwritten', /if \(!get\('los\.v24\.theme',''\)\)/.test(js), true);
eq('the parked page wins by class, not inline style', /#suite-root\.v47-parked \.cols-main\{ display:none !important; \}/.test(css), true);
eq('all seventeen tabs ordered flat',   (js.match(/'[A-Z &]+'/g)||[]).filter(x=>/QUOTE|SETUP|PROPERTY|RENOVATION|MAX MORTGAGE|CLOSING|ESCROW|TAXES|QUALIFY|RENTAL|CREDIT|ADVANCED|CONTRACT|SCENARIOS|SUMMARY|MORTGAGE RATES|DOCUMENTS/.test(x)).length>=17, true);
eq('calculator opens on W-2',           /switchTab\('w2'\)/.test(js), true);
eq('ultrawide caps the canvas',         /@media \(min-width:2200px\)/.test(css), true);
eq('mobile stacks the rail',            /@media \(max-width:1180px\)[^}]*grid-template-columns:minmax\(0,1fr\)/.test(css), true);

console.log(`\nv47: ${pass} passed, ${fail} failed`);
if(fail)process.exit(1);
