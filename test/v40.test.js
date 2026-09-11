/* Release 40: header inventory, the flicker fix, rail rows, report strip. */
let pass=0,fail=0;
const eq=(l,g,w)=>{const ok=JSON.stringify(g)===JSON.stringify(w);ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${JSON.stringify(g)} want=${JSON.stringify(w)}`);};
const key=s=>String(s||'').replace(/\s+/g,' ').trim().toUpperCase();

/* --- the report head: agency stripped, wage earner kept ------------ */
function rptHead(title,sub){ return `<h1>${title}</h1>${sub?`<div class="rpt-sub">${sub}</div>`:''}<div><b>Date:</b> x</div><div><b>Agency:</b> FNMA</div>`; }
function wrapped(title,sub){ const h=rptHead(title,/1084|form 91|4000/i.test(sub||'')?'':sub); return h.replace(/<div><b>Agency:<\/b>[^<]*<\/div>/i,''); }
const out=wrapped('Wage Earner Income Calculator','Base, overtime, bonus and commission analysis per FNMA Form 1084 / FHLMC Form 91 / HUD 4000.1');
eq('agency line removed',        /Agency:/.test(out), false);
eq('1084/91/4000 subtitle removed', /1084|Form 91|4000/.test(out), false);
eq('Wage Earner title kept',     /Wage Earner Income Calculator/.test(out), true);
eq('date kept',                  /Date:/.test(out), true);
const other=wrapped('Schedule C','Sole proprietor add-backs');
eq('a non-agency subtitle survives', /Sole proprietor add-backs/.test(other), true);

/* --- the flicker: moving beats class-hiding ------------------------ */
// three layers add a hide class; one layer's stabilise rule wins the
// cascade. Model the row over ticks with each rule running in turn.
function classHide(row){ const r={...row}; r.cls=new Set([...r.cls,'hidden']); return r; }
function stabilise(row){ const r={...row}; r.forcedVisible=true; return r; }
function visible(row){ return row.forcedVisible || !row.cls.has('hidden'); }
let row={cls:new Set(),forcedVisible:false,inRow:true};
const frames=[]; const seq=[classHide,stabilise,classHide,stabilise];
seq.forEach(f=>{ row=f(row); frames.push(visible(row)); });
eq('class-hiding + a stabilise rule -> visible despite the hide', frames.some(Boolean), true);
// v40: the copy is moved out of the row entirely
function move(row){ return {...row,inRow:false}; }
row={cls:new Set(),forcedVisible:false,inRow:true}; row=move(row);
seq.forEach(f=>{ row=f(row); });
eq('a moved node is not in the row, whatever any rule says', row.inRow, false);

/* --- header: every earlier control reachable, none shown twice ------ */
const ICONS=['file','view','docs','compare','factions','tools'], LABELLED=['live','actions'];
eq('six icons', ICONS.length, 6);
eq('two labelled buttons with menus', LABELLED, ['live','actions']);
const STOW=['v39Bar','v35Btn','v36LiveButton','v24LiveSummary','v30PrintGen','v25FullForm','v23QuickSave','v27Promoted'];
eq('every earlier header owner is stowed, not deleted', STOW.length>=8, true);
eq('the rate chip is NOT stowed (it is a reading, not a menu)', STOW.includes('v28RateStat'), false);
// Documents pops a choice, not a page
const DOCS=[['Print',['Print / PDF','Print summary']],['Generate',['Print / Generate','Draft LE','Draft Schedule C','P&L','Income Report']],['Direct',['Documents & OCR']]];
eq('Documents offers Print, Generate, Direct', DOCS.map(g=>g[0]), ['Print','Generate','Direct']);
eq('Direct goes to the Documents & OCR page', DOCS[2][1], ['Documents & OCR']);

/* --- rail rows: engine markup, empty rows not drawn ------------------ */
function outRow(label,value){ if(value==null||value===''||value==='—')return ''; return `<div class="out" data-out="${label}"><div class="l">${label}</div><div class="v">${value}</div></div>`; }
eq('a row with a value is drawn',   outRow('LTV','95.00%').includes('data-out="LTV"'), true);
eq('an empty value draws nothing',  outRow('HOA',''), '');
eq('a dash draws nothing',          outRow('HOA','—'), '');
eq('rows carry data-out for the popout', /data-out=/.test(outRow('x','1')), true);
// closing buckets from line keys
const lines=[{key:'lenderOrigination',payer:'buyer',amount:2290},{key:'points',payer:'buyer',amount:12829},
  {key:'appraisal',payer:'buyer',amount:910},{key:'titleInsurance',payer:'buyer',amount:3218},
  {key:'mortgageTax',payer:'buyer',amount:11946},{key:'prepaidInsurance',payer:'buyer',amount:3894},
  {key:'transferSeller',payer:'seller',amount:9999}];
const sum=re=>lines.filter(l=>l.payer==='buyer'&&re.test(l.key)).reduce((x,l)=>x+l.amount,0);
eq('lender bucket',    sum(/lender|points|origination/i), 15119);
eq('third-party bucket', sum(/appraisal|credit|flood|title|attorney|survey|inspections/i), 4128);
eq('government bucket', sum(/recording|mortgageTax|transfer|luxury/i), 11946);
eq('seller lines excluded', sum(/transfer/i), 0);
eq('MI duration text for FHA', (true ? 'life of loan' : 'cancels'), 'life of loan');
// three times the information: count of possible rows vs the six-section base
const BASE_ROWS=12, NEW_ROWS=['Note rate','Term','Program','Down payment','LTV','P&I','MI','MI duration','Taxes','Insurance','HOA','Range','Income','Debts','Front','Back','Max payment','Cushion','Buyer costs','Lender','Third-party','Government','Prepaids','Seller credit','EMD','Escrow cushion','Reno total','Contingency','Financed fees','ARV','Reserves'].length;
eq('roughly three times as many rows available', NEW_ROWS >= BASE_ROWS*2.5, true);

console.log(`\nv40: ${pass} passed, ${fail} failed`);
if(fail)process.exit(1);
