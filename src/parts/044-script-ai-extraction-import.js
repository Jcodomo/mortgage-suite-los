
/* ==================================================================
   AI EXTRACTION IMPORT
   A stable JSON contract an assistant can fill in from tax returns,
   paystubs, VOEs and K-1s, and that this file can load without
   guessing. The prompt that produces it lives here too, so the
   template and the parser can never drift apart.
   ================================================================== */

const EXTRACT_VERSION = 'nmb-income-extract/1';

const EXTRACT_PROMPT = `You are extracting mortgage income data from borrower documents.
Return ONE JSON object and nothing else — no commentary, no markdown fences.

RULES
1. Transcribe, do not calculate. Copy the figure printed on the document. Never
   annualise, average, gross up, or convert to monthly — the calculator does that.
2. Never infer a number that is not printed. If a field is absent, use null.
   Do not use 0 to mean "not found"; 0 means the document printed zero.
3. Every dollar figure needs a "src" entry naming the document, page and line it
   came from, so it can be checked against the file.
4. If two documents disagree, keep the figure from the most recent one and record
   the conflict in "flags".
5. YTD figures go in y1 with "ytdThru" set to the paystub or VOE through-date.
   Full prior years go in y2 (last year) and y3 (two years ago), with "yr" set.
6. One object per employer, per business, per property, per income source.
   A borrower with two jobs produces two entries in "w2".
7. Assign every entry to a borrower with "b": 1 or 2.

SCHEMA — omit any array you have no documents for.

{
  "version": "${EXTRACT_VERSION}",
  "borrowers": { "b1": "Full Name", "b2": "Full Name or null" },
  "file": "loan number or null",
  "agency": "FNMA | FHLMC | FHA | VA | null",

  "w2": [{
    "b": 1,
    "employer": "Employer legal name",
    "incomeType": "consistent | irregular",
    "freq": "Hourly | Weekly | Bi-Weekly | Semi-Monthly | Monthly | Annually",
    "rate": 0,                  // pay rate at that frequency, as printed
    "hours": 0,                 // scheduled hours per week
    "hireDate": "YYYY-MM-DD",
    "ytdThru": "YYYY-MM-DD",    // paystub / VOE period end date
    "y1": {"base":0,"ot":0,"comm":0,"bonus":0,"other":0},   // YTD, as printed
    "y2": {"yr":2025,"base":0,"ot":0,"comm":0,"bonus":0,"other":0},  // prior year W-2 / VOE
    "y3": {"yr":2024,"base":0,"ot":0,"comm":0,"bonus":0,"other":0},
    "src": {"base":"2026 paystub p1 'Regular' YTD", "y2.base":"2025 W-2 Box 5"}
  }],

  "schc": [{                    // Schedule C sole proprietorship — one per business
    "b": 1,
    "name": "Business name (Sch C line C)",
    "y1": {"yr":2025,"net31":0,"depl12":0,"depr13":0,"meals":0,"home30":0,"amort":0,"miles":0},
    "y2": {"yr":2024,"net31":0,"depl12":0,"depr13":0,"meals":0,"home30":0,"amort":0,"miles":0},
    "src": {"y1.net31":"2025 1040 Sch C line 31"}
  }],

  "corp": [{                    // 1065 / 1120-S / 1120 — one per entity
    "b": 1,
    "name": "Entity name",
    "form": "1065 | 1120S | 1120",
    "own": 0,                   // ownership percent from the K-1
    "y1": {"yr":2025,"ordinary":0,"netRental":0,"othRental":0,"guar":0,"dist":0,
           "w2biz":0,"depr":0,"depl":0,"amort":0,"nonrec":0,"notes":0,"travel":0,
           "taxable":0,"tax":0,"gains":0,"othinc":0,"nol":0},
    "y2": {"yr":2024,"ordinary":0},
    "curAssets": 0, "curLiab": 0,          // Schedule L, for the liquidity test
    "src": {"y1.ordinary":"2025 K-1 Part III line 1"}
  }],

  "sche": [{                    // Schedule E rentals — one per property
    "b": 1,
    "addr": "Property address",
    "method": "sche | lease",
    "rents": 0, "ins": 0, "mortInt": 0, "taxes": 0, "depr": 0,
    "otherAdd": 0,              // documented repairs / HOA only
    "totalExp": 0,              // Sch E line 20
    "fairDays": 0, "personalDays": 0,      // Sch E line 2
    "leaseRent": 0,             // only when method = lease
    "pitia": 0,                 // full monthly PITIA on this property
    "src": {"rents":"2025 Sch E line 3 col A"}
  }],

  "other": [{                   // one per non-employment source
    "b": 1,
    "type": "ssa | ssdi | pension | ira | annuity | disab | va | military | alimony | support | foster | trust | notes | royalty | intdiv | capgain | unemp | boarder | autoallow | 1099 | pubassist | tip | other",
    "desc": "what the document calls it",
    "amt": 0,                   // MONTHLY amount as printed on the award letter
    "nonTax": true,
    "continuance": 36,          // months of documented continuance, or null
    "src": {"amt":"2026 SSA award letter"}
  }],

  "assets": [{                  // only for asset depletion / employment-related assets
    "b": 1,
    "name": "Institution and account",
    "type": "checking | mm | stocks | ret59 | ret | trust | other",
    "bal": 0,
    "src": "Q2 2026 statement, ending balance"
  }],

  "flags": [
    "Anything the underwriter must resolve: conflicting figures, a missing year, an unsigned return, a K-1 without distributions, income that may not continue."
  ]
}

WHAT GOES WHERE — read this before mapping anything
- Base pay is regular earnings only. Overtime, commission, bonus and shift
  differential are separate columns, never folded into base.
- Prior-year W-2: use Box 5 (Medicare wages) for total earnings; if the W-2 does
  not break out overtime or bonus, put the total in y2.base and add a flag saying
  the split is not documented.
- Schedule C line 31 is the net profit or loss. Enter losses as negative numbers.
- Meals (line 24b) is the exclusion — enter the printed amount as a positive
  number; the calculator subtracts it.
- Business miles is a count, not a dollar figure.
- K-1 ordinary income is Part III line 1. Distributions are 1120-S line 16d or
  1065 line 19. If distributions are absent, use null, not 0 — the conventional
  rule caps income at distributions and 0 would zero the income out.
- Rental: use the Schedule E column for that property only, never a total column.
- Social Security, disability, child support and VA benefits are usually
  non-taxable ("nonTax": true). Pensions, IRA distributions and alimony are not.
- If a document is unreadable, say so in flags rather than guessing.

DOCUMENTS I AM GIVING YOU: [list them here — e.g. 2025 and 2024 1040 with all
schedules, 2026 YTD paystub through 08/15, 2025 and 2024 W-2s, SSA award letter]`;

/* ---------- import ---------- */
const EX_NUM = v => (v === null || v === undefined || v === '') ? null : N(v);
const EX_SET = (target, src, keys) => keys.forEach(k=>{
  const v = EX_NUM(src[k]); if (v !== null) target[k] = v; });

function importExtract(text){
  let data;
  try { data = JSON.parse(String(text).replace(/^\s*```(?:json)?/i,'').replace(/```\s*$/,'')); }
  catch(e){ return {error:'That is not valid JSON — ' + e.message}; }
  if (Array.isArray(data)) return {error:'Expected one object, got an array.'};
  if (!data || typeof data !== 'object') return {error:'Expected a JSON object.'};

  const made = {w2:0, schc:0, corp:0, sche:0, other:0, assets:0}, notes = [];

  if (data.borrowers){
    if (data.borrowers.b1){ S.b1 = data.borrowers.b1; S.borrower = S.b1; const e=$('b1Name'); if(e) e.value=S.b1; }
    if (data.borrowers.b2){ S.b2 = data.borrowers.b2; const e=$('b2Name'); if(e) e.value=S.b2; }
  }
  if (data.file){ S.file = data.file; const e=$('fileNumber'); if(e) e.value=S.file; }
  if (data.agency && ['FNMA','FHLMC','FHA','VA'].includes(data.agency)){
    S.agency = data.agency; const e=$('agency'); if(e) e.value=S.agency; }

  const srcNote = (rec, src) => { if (!src) return;
    const lines = typeof src === 'string' ? [src]
      : Object.keys(src).map(k=>`${k}: ${src[k]}`);
    rec.notes = (rec.notes ? rec.notes + '\n' : '') + 'Source — ' + lines.join('; '); };

  /* --- employment --- */
  (data.w2||[]).forEach(x=>{
    const j = newW2();
    if (x.employer) j.employer = String(x.employer);
    if (x.b === 2) j.b = 2;
    if (x.incomeType === 'irregular') j.incomeType = 'irregular';
    if (x.freq){                                  /* accept "Annual" for "Annually" */
      const f = String(x.freq).replace(/^annual$/i, 'Annually');
      const hit = FREQ.find(v => v.toLowerCase() === f.toLowerCase());
      if (hit) j.freq = hit;
    }
    if (EX_NUM(x.rate)  !== null) j.rate  = EX_NUM(x.rate);
    if (EX_NUM(x.hours) !== null) j.hours = EX_NUM(x.hours);
    const d1 = parseLoose(x.hireDate||''), d2 = parseLoose(x.ytdThru||'');
    if (d1) j.hireDate = d1;
    if (d2) j.ytdThru  = d2;
    ['y1','y2','y3'].forEach(y=>{ if (x[y]) EX_SET(j[y], x[y], ['base','ot','comm','bonus','other']); });
    srcNote(j, x.src);
    S.w2.push(j); made.w2++;
    if (!d2 && (x.y1 && Object.keys(x.y1).length))
      notes.push(`${j.employer||'An employment record'}: no paystub through-date, so YTD months cannot be measured.`);
  });

  /* --- schedule C --- */
  (data.schc||[]).forEach(x=>{
    const b = newSchC();
    if (x.name) b.name = String(x.name);
    if (x.b === 2) b.b = 2;
    ['y1','y2'].forEach(y=>{ if (!x[y]) return;
      if (EX_NUM(x[y].yr)) b[y].yr = EX_NUM(x[y].yr);
      EX_SET(b[y], x[y], ['net31','depl12','depr13','meals','home30','amort','miles']); });
    srcNote(b, x.src);
    S.schc.push(b); made.schc++;
  });

  /* --- entities --- */
  (data.corp||[]).forEach(x=>{
    const e = newCorp();
    if (x.name) e.name = String(x.name);
    if (x.b === 2) e.b = 2;
    if (['1065','1120S','1120'].includes(x.form)) e.form = x.form;
    if (EX_NUM(x.own) !== null) e.own = EX_NUM(x.own);
    const KEYS = Object.keys(blankCorpYear());
    ['y1','y2'].forEach(y=>{ if (!x[y]) return;
      if (EX_NUM(x[y].yr)) e[y].yr = EX_NUM(x[y].yr);
      EX_SET(e[y], x[y], KEYS); });
    if (EX_NUM(x.curAssets) !== null) e.curAssets = EX_NUM(x.curAssets);
    if (EX_NUM(x.curLiab)   !== null) e.curLiab   = EX_NUM(x.curLiab);
    srcNote(e, x.src);
    S.corp.push(e); made.corp++;
    if (x.y1 && (x.y1.dist === null || x.y1.dist === undefined) && N(e.y1.ordinary))
      notes.push(`${e.name||'An entity'}: no distributions were documented, so the conventional rule will cap ordinary income at zero until you enter them or evidence liquidity.`);
  });

  /* --- rentals --- */
  (data.sche||[]).forEach(x=>{
    const p = newSchE();
    if (x.addr) p.addr = String(x.addr);
    if (x.b === 2) p.b = 2;
    if (x.method === 'lease') p.method = 'lease';
    EX_SET(p, x, ['rents','ins','mortInt','taxes','depr','otherAdd','totalExp',
                  'fairDays','personalDays','leaseRent','pitia']);
    srcNote(p, x.src);
    S.sche.push(p); made.sche++;
  });

  /* --- other income --- */
  const OT_V = OTHER_TYPES.map(t=>t.v);
  (data.other||[]).forEach(x=>{
    const o = newOther();
    o.type = OT_V.includes(x.type) ? x.type : 'other';
    if (x.desc) o.desc = String(x.desc);
    if (x.b === 2) o.b = 2;
    if (EX_NUM(x.amt) !== null) o.amt = EX_NUM(x.amt);
    if (typeof x.nonTax === 'boolean') o.nonTax = x.nonTax;
    else { const t = OTHER_TYPES.find(t=>t.v===o.type); o.nonTax = t ? t.nt : false; }
    if (!o.nonTax) o.grossUp = 0;
    if (EX_NUM(x.continuance) !== null) o.continuance = EX_NUM(x.continuance);
    if (x.src) o.docs = typeof x.src === 'string' ? x.src : JSON.stringify(x.src);
    S.other.push(o); made.other++;
  });

  /* --- assets --- */
  (data.assets||[]).forEach(x=>{
    const a = newAsset();
    if (x.name) a.name = String(x.name);
    if (ASSET_TYPES.some(t=>t.v===x.type)){ a.type = x.type;
      a.elig = ASSET_TYPES.find(t=>t.v===x.type).e; }
    if (EX_NUM(x.bal) !== null) a.bal = EX_NUM(x.bal);
    S.assets.rows.push(a); made.assets++;
  });

  /* the untouched worksheet the file opens with should not survive as record #1 */
  if (made.w2)   S.w2   = S.w2.filter(j=>!isEmptyRec('w2', j)   || S.w2.length===1);
  if (made.schc) S.schc = S.schc.filter(b=>!isEmptyRec('schc', b));
  if (made.corp) S.corp = S.corp.filter(e=>!isEmptyRec('corp', e));
  if (made.sche) S.sche = S.sche.filter(x=>!isEmptyRec('sche', x));

  (data.flags||[]).forEach(f=> notes.push(String(f)) );
  if (notes.length)
    S.notes = (S.notes ? S.notes + '\n\n' : '')
      + `From the document extraction on ${today()}:\n` + notes.map(n=>'• ' + n).join('\n');

  return {made, notes, total: Object.values(made).reduce((a,b)=>a+b,0)};
}

/* ---------- paste modal ---------- */
function openExtract(){
  $('exModal').classList.add('on');
  document.body.style.overflow = 'hidden';
  $('exText').value = '';
  $('exResult').innerHTML = '';
  setTimeout(()=>$('exText').focus(), 60);
}
function closeExtract(){ $('exModal').classList.remove('on'); document.body.style.overflow=''; }
function copyExtractPrompt(){
  const done = () => toast('Prompt copied — paste it to the assistant with your documents');
  if (navigator.clipboard && navigator.clipboard.writeText)
    navigator.clipboard.writeText(EXTRACT_PROMPT).then(done, () => fallback());
  else fallback();
  function fallback(){
    const ta = document.createElement('textarea');
    ta.value = EXTRACT_PROMPT; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); done(); }
    catch(e){ toast('Copy failed — the prompt is shown below, select it manually'); }
    document.body.removeChild(ta);
  }
}
function downloadExtractPrompt(){
  dl(new Blob([EXTRACT_PROMPT], {type:'text/plain'}), 'Income extraction prompt.txt');
}
function runExtract(){
  const raw = $('exText').value.trim();
  if (!raw){ $('exResult').innerHTML = '<div class="notice warn"><svg class="icon"><use href="#i-alert"/></svg><span>Paste the JSON first.</span></div>'; return; }
  const r = importExtract(raw);
  if (r.error){
    $('exResult').innerHTML = `<div class="notice bad"><svg class="icon"><use href="#i-alert"/></svg>
      <span><b>Could not read that.</b> ${esc(r.error)}<br>
      Check that you pasted the whole object, from the first <code>{</code> to the last <code>}</code>.</span></div>`;
    return;
  }
  const L = {w2:'employment record', schc:'Schedule C business', corp:'entity',
             sche:'rental property', other:'other income source', assets:'asset account'};
  const parts = Object.keys(r.made).filter(k=>r.made[k])
    .map(k=>`<b>${r.made[k]}</b> ${L[k]}${r.made[k]===1?'':'s'}`);
  renderAll();
  $('exResult').innerHTML = `<div class="notice good"><svg class="icon"><use href="#i-check"/></svg>
    <span><b>Imported ${parts.join(', ') || 'nothing — the object had no income arrays'}.</b>
    ${r.notes.length?`<br>${r.notes.length} note${r.notes.length===1?'':'s'} were written into the UW notes.`:''}
    <br>Nothing has been calculated yet: open each record, confirm the figures against the documents,
    and choose the averaging method.</span></div>`;
  if (r.total) toast(`${r.total} record${r.total===1?'':'s'} imported — verify every figure`);
}
