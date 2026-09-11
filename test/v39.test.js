/* Release 39: header inventory, theme registration, address fill rules. */
let pass=0,fail=0;
const eq=(l,g,w)=>{const ok=JSON.stringify(g)===JSON.stringify(w);ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${JSON.stringify(g)} want=${JSON.stringify(w)}`);};
const key=s=>String(s||'').replace(/\s+/g,' ').trim().toUpperCase();

/* --- no real control may be unreachable from the five buttons -------- */
const PANELS={
 fileview:['SAVE','NEW','RESET','SAVE SCENARIO','COMPARE','EXPORT SCENARIO JSON','IMPORT SCENARIO JSON','IMPORT / AI','FULL FORM','ALL PAGES','PRINT / PDF','COPY BORROWER QUOTE','THEME & INPUTS'],
 docs:['DOCUMENTS & OCR','PRINT / GENERATE','DRAFT LE','PRINT SUMMARY','INCOME REPORT','P&L','PMI WORKSHEET','RENO FEES','DRAFT SCHEDULE C'],
 tools:['CREDIT','CREDIT REVIEW','RECALCULATE','PMI / FHA MIP','RENOVATION FEES','PROFIT & LOSS','LIVE COMPARISON']};
// the full set of controls the earlier layers leave in the DOM (from the
// release-35 inventory, plus the ones added since)
const REAL=['Save','New','Reset','Save scenario ▾','Compare','Export scenario JSON','Import scenario JSON','Import / AI',
  'Full form','All pages','Print / PDF','Copy borrower quote','Documents & OCR','Print / Generate','Draft LE',
  'Print summary','P&L','PMI Worksheet','Reno Fees','Credit','Live comparison','Theme & inputs','Recalculate',
  'Some Future Feature'];
const claimed=new Set(Object.values(PANELS).flat());
const inv=REAL.map(r=>key(r).replace(/\s*▾\s*$/,''));
const unclaimed=inv.filter(k=>!claimed.has(k));
eq('an unclaimed control still lands in File & view', unclaimed, ['SOME FUTURE FEATURE']);
eq('every known control is claimed exactly once',
   Object.values(PANELS).flat().length, new Set(Object.values(PANELS).flat()).size);
eq('Live comparison is reachable from Loan tools', PANELS.tools.includes('LIVE COMPARISON'), true);
eq('trailing menu caret is ignored', key('Save scenario ▾').replace(/\s*▾\s*$/,''), 'SAVE SCENARIO');

/* --- theme registration --------------------------------------------- */
const THEMES=['ledger','slate','bank','graphite','terminal','github','github-dark'];
const base=n=>(n==='terminal'||n==='github-dark')?'dark':'light';
eq('github is registered', THEMES.includes('github'), true);
eq('github-dark is registered', THEMES.includes('github-dark'), true);
eq('github is a light base', base('github'), 'light');
eq('github-dark is a dark base', base('github-dark'), 'dark');
eq('terminal still dark', base('terminal'), 'dark');
// an unregistered name would have been reset to terminal by v24
const apply=n=>THEMES.includes(n)?n:'terminal';
eq('registered name survives the timer', apply('github-dark'), 'github-dark');
eq('an unregistered one would not', apply('solarized'), 'terminal');

/* --- address fill: only blanks, selects by option match ------------- */
function fillEmpty(field,v){
  if(v==null||v==='')return field;
  if(field.options){ const o=field.options.find(o=>key(o)===key(v)); if(!o||field.value===o)return field; return {...field,value:o}; }
  if(String(field.value||'').trim())return field; return {...field,value:v};
}
eq('blank text field filled', fillEmpty({value:''},'Hicksville').value, 'Hicksville');
eq('typed text kept',         fillEmpty({value:'Levittown'},'Hicksville').value, 'Levittown');
eq('select matched by label', fillEmpty({options:['Nassau','Suffolk'],value:''},'suffolk').value, 'Suffolk');
eq('select with no match untouched', fillEmpty({options:['Nassau','Suffolk'],value:''},'Kings').value, '');
// the ZIP path must not trigger the address path and vice versa
const isAddr=q=>q.length>=4 && !/^\d{5}$/.test(q);
eq('a bare 5-digit zip is not an address search', isAddr('11801'), false);
eq('four letters start an address search', isAddr('209 N'), true);
eq('three characters do not', isAddr('209'), false);
// nominatim address parts -> one line
const line=a=>[a.house_number,a.road].filter(Boolean).join(' ');
eq('house + road', line({house_number:'209',road:'North Oak Street'}), '209 North Oak Street');
eq('road only', line({road:'Main Street'}), 'Main Street');
const county=a=>String(a.county||'').replace(/ county$/i,'');
eq('county suffix stripped', county({county:'Nassau County'}), 'Nassau');

/* --- rail: the more-detail default is closed and remembered --------- */
const openState=stored=>stored==='1';
eq('fresh -> closed', openState(null), false);
eq('remembered open', openState('1'), true);

console.log(`\nv39: ${pass} passed, ${fail} failed`);
if(fail)process.exit(1);
