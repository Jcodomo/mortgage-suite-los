
/* ==================================================================
   DOCUMENT IMPORT — drag & drop, PDF text extraction, OCR fallback,
   and field mapping into the income worksheets.
   Everything runs locally in the browser; no file leaves the machine.
   ================================================================== */
const DOCS = [];
let AUTO_APPLY = true;
if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/* ---------- number / line helpers ---------- */
const MONEY_RE = /\(?-?\$?\s?\d[\d,]*(?:\.\d{1,2})?\)?/g;
/* form lines start with their line number ("12 Depletion ... 0") — drop it before reading amounts */
const stripLineNo = l => l.replace(/^\s*\d{1,3}[a-z]?\s+(?=[A-Za-z(])/,'').replace(/\.{2,}/g,' ');
function toNum(t){
  if(t==null) return 0;
  let x = String(t).trim(), neg = /^\(.*\)$/.test(x) || x.startsWith('-');
  x = x.replace(/[()$,\s-]/g,'');
  const v = parseFloat(x);
  return isFinite(v) ? (neg ? -v : v) : 0;
}
function moneyOn(line){
  const m = stripLineNo(String(line)).match(MONEY_RE);
  if(!m) return [];
  return m.map(toNum).filter(v=>isFinite(v));
}
function intsOn(line){
  const m = stripLineNo(String(line)).match(/\d[\d,]*/g);
  return m ? m.map(x=>parseInt(x.replace(/,/g,''),10)).filter(x=>isFinite(x)) : [];
}
/* pull the number that directly follows a phrase, anywhere in the document */
function afterPhrase(text, phrase, max){
  const re = new RegExp(phrase + '\\D{0,12}(\\d[\\d,]*)', 'i');
  const m = text.match(re); if(!m) return null;
  const v = parseInt(m[1].replace(/,/g,''),10);
  if(!isFinite(v) || (max && v>max)) return null;
  return {value:v, src:m[0].replace(/\s+/g,' ').trim()};
}
function lines(text){ return text.split(/\r?\n/).map(l=>l.replace(/\s+/g,' ').trim()).filter(Boolean); }

/* find the first line matching `re`; returns {line, idx} */
function findLine(L, re, from){ for(let i=from||0;i<L.length;i++) if(re.test(L[i])) return {line:L[i], idx:i}; return null; }
/* last money value on a matching line, falling back to the next line */
function amountFor(L, re){
  const hit = findLine(L, re); if(!hit) return null;
  let v = moneyOn(hit.line);
  if(!v.length && L[hit.idx+1]) v = moneyOn(L[hit.idx+1]);
  if(!v.length) return null;
  return {value: v[v.length-1], src: hit.line};
}
function firstAmountFor(L, re){
  const hit = findLine(L, re); if(!hit) return null;
  let v = moneyOn(hit.line);
  if(!v.length && L[hit.idx+1]) v = moneyOn(L[hit.idx+1]);
  if(!v.length) return null;
  return {value: v[0], src: hit.line};
}
function dateFor(L, re){
  const hit = findLine(L, re); if(!hit) return null;
  const all = hit.line.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g);
  if(!all) return null;
  const m = all[all.length-1].match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  let y = +m[3]; if(y<100) y += 2000;
  const iso = `${y}-${String(+m[1]).padStart(2,'0')}-${String(+m[2]).padStart(2,'0')}`;
  return {value: iso, src: hit.line, isDate:true};
}

/* ---------- document classification ---------- */
function classify(text){
  const t = text.toLowerCase();
  if (/schedule\s*k-?1/.test(t) && /1065/.test(t))            return 'k1_1065';
  if (/schedule\s*k-?1/.test(t) && /1120-?s/.test(t))         return 'k1_1120s';
  if (/form\s*1120-?s/.test(t))                               return 'k1_1120s';
  if (/form\s*1120\b/.test(t))                                return 'f1120';
  if (/form\s*1065\b/.test(t))                                return 'k1_1065';
  if (/desktop underwriter|du underwriting findings|summary of findings|casefile id|loan product advisor|lpa\b|feedback certificate/.test(t)) return 'aus';
  if (/form\s*1040\b|u\.s\. individual income tax return/.test(t) && !/schedule\s*[cef]\b/.test(t)) return 'f1040';
  if (/schedule\s*c\b/.test(t) || /profit or loss from business/.test(t)) return 'schedc';
  if (/schedule\s*e\b/.test(t) || /supplemental income and loss/.test(t)) return 'schede';
  if (/the work number|employment data report|verification of employment|written voe|\bwvoe\b|equifax workforce/.test(t)) return 'wvoe';
  if (/wage and tax statement/.test(t))                        return 'w2';
  if (/earnings statement|pay\s*period|net pay|gross pay|paystub|pay stub|direct deposit/.test(t)) return 'paystub';
  if (/\bw-?2\b/.test(t))                                      return 'w2';
  return 'other';
}
const DOC_TYPES = {
  wvoe:   {label:'Written VOE / The Work Number', kind:'w2'},
  paystub:{label:'Paystub / Earnings Statement', kind:'w2'},
  w2:     {label:'W-2 Wage & Tax Statement',      kind:'w2'},
  schedc: {label:'Schedule C (Sole Proprietor)',  kind:'schc'},
  schede: {label:'Schedule E (Rental)',           kind:'sche'},
  k1_1065:{label:'Schedule K-1 / Form 1065',      kind:'corp'},
  k1_1120s:{label:'Schedule K-1 / Form 1120-S',   kind:'corp'},
  f1120:  {label:'Form 1120 (C-Corporation)',     kind:'corp'},
  f1040:  {label:'Form 1040 Individual Return',    kind:'none'},
  aus:    {label:'AUS Findings (DU / LPA)',        kind:'aus'},
  other:  {label:'Other / unrecognised document', kind:'none'}
};

/* Any lookup of DOC_TYPES goes through this — an unknown or missing type must never
   throw inside renderDocs(), or the whole Documents tab stops painting. */
const docType = t => DOC_TYPES[t] || DOC_TYPES.other;

/* ---------- per-type extraction ---------- */
function extractFields(type, text){
  const L = lines(text), F = [];
  const push = (slot,label,hit,yearScoped)=>{ if(hit) F.push({
      slot, label, value:hit.value, src:hit.src, yearScoped:yearScoped!==false,
      isDate:!!hit.isDate, apply:true }); };

  if (type==='wvoe'){
    /* --- identification ------------------------------------------------ */
    const empM = text.match(/^\s*Employer(?:\s*Name)?\s*:\s*(.+)$/mi);
    if (empM){
      const nm = empM[1].replace(/\s*\(\d{3,}\)\s*$/,'').trim();   /* drop the employer code */
      if (nm && !/data not provided|image not found/i.test(nm))
        F.push({slot:'employer', label:'Employer name', value:nm, src:empM[0].trim(),
                yearScoped:false, isText:true, apply:true});
    }
    const who = text.match(/^\s*([A-Z][A-Za-z.'\-]+(?:\s+[A-Z][A-Za-z.'\-]+){1,3})\s+x{3}-x{2}-\d{4}/mi)
             || text.match(/employee(?:\s*name)?\s*[:\-]\s*([A-Za-z][A-Za-z.'\- ]{2,44})/i);
    if (who) F.push({slot:'_borrower', label:'Borrower name (file header)',
                     value:who[1].replace(/\s+/g,' ').trim(), src:who[0].trim(),
                     yearScoped:false, isText:true, apply:true});

    push('hireDate','Original hire date',
         dateFor(L,/original\s*hire\s*date/i) || dateFor(L,/most\s*recent\s*start\s*date/i)
      || dateFor(L,/hire\s*date|start\s*date/i), false);
    push('ytdThru','Income current as of',
         dateFor(L,/current\s*as\s*of/i) || dateFor(L,/year[\s\-]*to[\s\-]*date.{0,24}as of/i)
      || dateFor(L,/\bas of\b/i) || dateFor(L,/verified\s*on/i), false);

    /* --- employment status / termination -------------------------------- */
    const stM = text.match(/Employment\s*Status\s*[:\-]?\s*([A-Za-z ]{3,30})/i);
    const status = stM ? stM[1].trim() : '';
    const termD  = dateFor(L, /termination\s*date/i);
    if (status) F.push({slot:'', label:`Employment status: ${status}${termD?' — terminated '+termD.value:''}`,
                        value:0, src:stM[0].replace(/\s+/g,' ').trim(), yearScoped:false,
                        apply:false, readonly:true, warn:/no longer|inactive|terminat/i.test(status)});

    /* --- rate, frequency, hours ----------------------------------------- */
    const FRQ = [[/hourly|per hour|\/hr/i,'Hourly'], [/bi-?\s?weekly|every other week/i,'Bi-Weekly'],
                 [/semi-?\s?monthly|twice a month/i,'Semi-Monthly'], [/\bweekly\b/i,'Weekly'],
                 [/\bmonthly\b/i,'Monthly'], [/annual|yearly|per year|salaried/i,'Annually']];
    const rate = text.match(/(?:employee\s*)?rate of pay\s*[:\-]?\s*\$?\s*([\d,]+(?:\.\d{1,2})?)/i)
              || text.match(/(?:annual salary|base rate|current rate|pay rate)\s*[:\-]?\s*\$?\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (rate) F.push({slot:'rate', label:'Rate of pay', value:toNum(rate[1]),
                      src:rate[0].replace(/\s+/g,' ').trim(), yearScoped:false, apply:true});
    const basisLine  = findLine(L, /rate of pay|salary type|pay basis|annual salary/i);
    const periodLine = findLine(L, /(?:employee\s*)?pay\s*frequency|pay\s*period\s*frequency|pay\s*cycle/i);
    const basis  = basisLine  ? (FRQ.find(([re])=>re.test(basisLine.line))  ||[])[1] : null;
    const period = periodLine ? (FRQ.find(([re])=>re.test(periodLine.line)) ||[])[1] : null;
    const useFreq = basis || period;
    if (useFreq)
      F.push({slot:'freq', label:'Pay frequency (rate basis)', value:useFreq,
              src:(basis?basisLine:periodLine).line, yearScoped:false, isText:true, apply:true});
    const hrs = text.match(/avg\.?\s*hrs?\.?\s*worked\s*\/?\s*pay\s*period\s*[:\-]?\s*([\d,.]+)/i)
             || text.match(/average\s*hours?\s*(?:worked\s*)?per\s*(?:pay\s*period)\s*[:\-]?\s*([\d,.]+)/i);
    const hrsWk = text.match(/average\s*hours?\s*(?:worked\s*)?per\s*week\s*[:\-]?\s*([\d,.]+)/i);
    if (hrsWk){
      F.push({slot:'hours', label:'Average hours per week', value:toNum(hrsWk[1]),
              src:hrsWk[0].replace(/\s+/g,' ').trim(), yearScoped:false, apply:true});
    } else if (hrs){
      const raw = toNum(hrs[1]);
      const div = period==='Bi-Weekly' ? 2 : period==='Semi-Monthly' ? (52/24)
                : period==='Monthly' ? (52/12) : period==='Weekly' ? 1 : 0;
      const weekly = div ? Math.round(raw/div*100)/100 : raw;
      F.push({slot:'hours',
              label: div ? `Average hours per week (${raw} per ${period.toLowerCase()} pay period)`
                         : 'Average hours per pay period — confirm the weekly figure',
              value:weekly, src:hrs[0].replace(/\s+/g,' ').trim(), yearScoped:false, apply:true});
    }

    /* --- annual income summary table ------------------------------------
       Rows read: 2026 $43,183.23Data not provided ... $54,664.38
       Amounts butt straight up against "Data not provided", so tokens are
       matched explicitly rather than by splitting on whitespace.          */
    const COLMAP = [[/\b(base|regular|salary)\b/i,'base'], [/\b(overtime|o\.?t\.?)\b/i,'ot'],
                    [/\bcommission/i,'comm'], [/\bbonus/i,'bonus'],
                    [/\bother\b/i,'other'], [/\btotal\b/i,'_total']];
    let order = null, hdrSrc = '';
    const hdr = findLine(L, /(base|regular).{0,90}?\btotal\b/i);
    if (hdr && !/\$/.test(hdr.line)){
      hdrSrc = hdr.line; order = [];
      hdr.line.replace(/annual income summary/ig,'').split(/[\s|]+/).forEach(tok=>{
        const m = COLMAP.find(([re])=>re.test(tok));
        if (m && !order.includes(m[1])) order.push(m[1]);
      });
      if (!order.length) order = null;
    }
    const TOKEN = /\(?-?\$\s?[\d,]+(?:\.\d{1,2})?\)?|data not provided|not provided|\bn\/a\b|--/gi;
    const yrRows = [];
    L.forEach(l=>{
      const clean = l.replace(/annual income summary.*$/i,'').trim();
      const m = clean.match(/^\(?\s*(20\d{2})\b(.*)$/);
      if (!m) return;
      const toks = m[2].match(TOKEN);
      if (!toks || toks.length < 2) return;
      yrRows.push({year:+m[1], vals: toks.map(t=>/\$/.test(t) ? toNum(t) : 0), src:clean});
    });
    yrRows.sort((a,b)=>b.year-a.year);
    const COLS = ['y1','y2','y3'], SL = {base:'base salary', ot:'overtime', comm:'commissions',
                                         bonus:'bonus', other:'other'};
    yrRows.slice(0,3).forEach((row,ri)=>{
      const col = COLS[ri];
      if (order && order.length === row.vals.length){
        order.forEach((slot,ci)=>{
          if (slot==='_total'){
            F.push({slot:'', label:`${row.year} total pay (reference)`, value:row.vals[ci],
                    src:row.src, yearScoped:false, apply:false, readonly:true});
            return;
          }
          F.push({slot, label:`${row.year} ${SL[slot]||slot} → ${col.toUpperCase()}`,
                  value:row.vals[ci], src:row.src, yearScoped:true, col, apply:true});
        });
      } else {
        row.vals.forEach((v,ci)=>{
          F.push({slot:'', label:`${row.year} amount ${ci+1} (column order not identified) → ${col.toUpperCase()}`,
                  value:v, src:row.src, yearScoped:true, col, apply:false});
        });
      }
    });
    if (hdrSrc) F.push({slot:'', label:'Income table header used for column order', value:0,
                        src:hdrSrc, yearScoped:false, apply:false, readonly:true});

    /* --- labelled fallback when no year table was found ------------------ */
    if (!yrRows.length){
      push('base', 'Base pay (year-to-date)',  amountFor(L,/base\s*(pay|salary|earnings)/i));
      push('ot',   'Overtime (year-to-date)',  amountFor(L,/overtime/i));
      push('comm', 'Commission (year-to-date)',amountFor(L,/commission/i));
      push('bonus','Bonus (year-to-date)',     amountFor(L,/bonus/i));
    }
  }
  else if (type==='paystub'){
    const earn = (re, slot, label) => {
      const hit = findLine(L, re); if(!hit) return;
      const v = moneyOn(hit.line);
      if(!v.length) return;
      /* a paystub earnings row typically reads: rate, hours, current, YTD */
      F.push({slot, label:label+' (YTD)', value:v[v.length-1], src:hit.line, yearScoped:true, apply:true});
      if (slot==='base' && v.length>=4){
        F.push({slot:'rate',  label:'Pay rate',      value:v[0], src:hit.line, yearScoped:false, apply:true});
        F.push({slot:'hours', label:'Hours on this stub — convert to hours per week before using',
                value:v[1], src:hit.line, yearScoped:false, apply:false});
      }
    };
    earn(/\b(regular|reg\b|base|salary|hourly)\b/i, 'base',  'Regular / base earnings');
    earn(/\b(overtime|over time|o\.?t\.?)\b/i,      'ot',    'Overtime');
    earn(/\bcommission/i,                            'comm',  'Commission');
    earn(/\bbonus/i,                                 'bonus', 'Bonus');
    push('ytdThru','Pay period end date',
         dateFor(L,/period\s*end(?:ing)?\s*date|pay\s*period\s*end|period\s*ending/i)
      || dateFor(L,/pay\s*period|ending|end\s*date|check\s*date|pay\s*date/i), false);
    push('hireDate','Hire / original date', dateFor(L,/hire\s*date|date of hire|orig(?:inal)?\s*hire/i), false);
    const emp = L.slice(0,4).find(l=> /^[A-Za-z][A-Za-z0-9&.,'\- ]{4,58}$/.test(l)
                 && !/statement|earnings|payroll|advice|employee|period/i.test(l));
    if (emp) F.push({slot:'employer', label:'Employer name', value:emp, src:emp,
                     yearScoped:false, isText:true, apply:false});
    const who = text.match(/employee(?:\s*name)?\s*[:\-]\s*([A-Za-z][A-Za-z.'\- ]{2,40})/i);
    if (who) F.push({slot:'_borrower', label:'Borrower name (file header)', value:who[1].trim(),
                     src:who[0].trim(), yearScoped:false, isText:true, apply:false});
    const g = amountFor(L, /(gross|total)\s*(pay|earnings)/i);
    if (g) F.push({slot:'_grossYTD', label:'Gross pay (reference only)', value:g.value, src:g.src,
                   yearScoped:false, apply:false, readonly:true});
  }
  else if (type==='w2'){
    push('base','Box 1 — Wages, tips, other compensation',
         amountFor(L, /wages,?\s*tips,?\s*other|^\s*1\s+wages/i));
    push('_ss','Box 3 — Social security wages (reference)', amountFor(L,/social security wages/i));
    push('_med','Box 5 — Medicare wages (reference)',       amountFor(L,/medicare wages/i));
    const eo = text.match(/employer'?s?\s*name[^\n]*\n?\s*([A-Za-z][A-Za-z0-9&.,'\- ]{4,58})/i);
    if (eo) F.push({slot:'employer', label:'Employer name', value:eo[1].trim(), src:eo[0].replace(/\s+/g,' ').trim(),
                    yearScoped:false, isText:true, apply:false});
    const yr = (text.match(/\b(20\d{2})\b/g)||[]).map(Number).sort((a,b)=>b-a)[0];
    if (yr) F.push({slot:'_year', label:'Tax year on the form', value:yr, src:'Detected tax year',
                    yearScoped:false, apply:false, readonly:true});
  }
  else if (type==='schedc'){
    push('net31', 'Line 31 — Net profit or (loss)',        amountFor(L,/\b31\b.*net profit|net profit or \(?loss\)?/i));
    push('depl12','Line 12 — Depletion',                    amountFor(L,/\b12\b.*depletion|^depletion/i));
    push('depr13','Line 13 — Depreciation',                 amountFor(L,/\b13\b.*depreciation|depreciation and section 179/i));
    push('meals', 'Line 24b — Deductible meals',            amountFor(L,/24b|deductible meals/i));
    push('home30','Line 30 — Business use of home',         amountFor(L,/\b30\b.*business use of (?:your )?home|expenses for business use/i));
    const mi = afterPhrase(text,'business\\s*miles') || afterPhrase(text,'44a');
    if (mi && mi.value>50) F.push({slot:'miles', label:'Line 44a — Business miles', value:mi.value,
                                   src:mi.src, yearScoped:true, apply:true});
    const gr = amountFor(L,/\b7\b.*gross income|gross income/i);
    if (gr) F.push({slot:'_gross', label:'Line 7 — Gross income (reference)', value:gr.value, src:gr.src, yearScoped:false, apply:false, readonly:true});
  }
  else if (type==='schede'){
    push('fairDays','Line 2 — Fair rental days',     afterPhrase(text,'fair\\s*rental\\s*days', 366), false);
    push('personalDays','Line 2 — Personal use days', afterPhrase(text,'personal\\s*use\\s*days', 366), false);
    push('rents',   'Line 3 — Rents received',       amountFor(L,/\b3\b.*rents received|rents received/i), false);
    push('ins',     'Line 9 — Insurance',            amountFor(L,/\b9\b.*insurance|^insurance/i), false);
    push('mortInt', 'Line 12 — Mortgage interest',   amountFor(L,/\b12\b.*mortgage interest|mortgage interest paid/i), false);
    push('taxes',   'Line 16 — Taxes',               amountFor(L,/\b16\b.*taxes|^taxes\b/i), false);
    push('depr',    'Line 18 — Depreciation',        amountFor(L,/\b18\b.*depreciation|depreciation expense or depletion/i), false);
    push('otherAdd','Line 14/19 — Repairs / other',  amountFor(L,/\b14\b.*repairs|^repairs/i), false);
    push('totalExp','Line 20 — Total expenses',      amountFor(L,/\b20\b.*total expenses|total expenses/i), false);
  }
  else if (type==='k1_1065' || type==='k1_1120s'){
    push('ordinary', 'Part III Line 1 — Ordinary business income',      amountFor(L,/ordinary business income/i));
    push('netRental','Part III Line 2 — Net rental real estate income', amountFor(L,/net rental real estate/i));
    push('othRental','Part III Line 3 — Other net rental income',       amountFor(L,/other net rental/i));
    if (type==='k1_1065') push('guar','Part III Line 4c — Guaranteed payments', amountFor(L,/guaranteed payment/i));
    push('dist', type==='k1_1065' ? 'Line 19 — Distributions' : 'Line 16d — Distributions',
         amountFor(L,/distribution/i));
    const om = text.match(/(?:profit|ownership|stock owned|shareholder)[^\n%]{0,40}?(\d{1,3}(?:\.\d+)?)\s*%/i);
    if (om) F.push({slot:'_own', label:'Ownership percentage', value:parseFloat(om[1]),
                    src:om[0].replace(/\s+/g,' ').trim(), yearScoped:false, apply:true});
    push('depr','Depreciation (Sch K / attachment)', amountFor(L,/depreciation/i));
    push('depl','Depletion',                          amountFor(L,/depletion/i));
  }
  else if (type==='f1040'){
    const g=(lbl,re)=>{ const h=amountFor(L,re); if(h) F.push({slot:'', label:lbl, value:h.value, src:h.src,
                        yearScoped:false, apply:false, readonly:true}); };
    g('Line 1z — Wages, salaries, tips',            /\b1z\b|wages,?\s*salaries,?\s*tips/i);
    g('Line 2b — Taxable interest',                 /\b2b\b|taxable interest/i);
    g('Line 3b — Ordinary dividends',               /\b3b\b|ordinary dividends/i);
    g('Line 4b — IRA distributions (taxable)',      /\b4b\b|ira distributions/i);
    g('Line 5b — Pensions & annuities (taxable)',   /\b5b\b|pensions and annuities/i);
    g('Line 6b — Social Security (taxable)',        /\b6b\b|social security benefits/i);
    g('Line 7 — Capital gain or (loss)',            /\b7\b.*capital gain|capital gain or \(loss\)/i);
    g('Line 8 — Other income from Schedule 1',      /\b8\b.*schedule 1|additional income/i);
    g('Line 9 — Total income',                      /\b9\b.*total income|total income/i);
    g('Line 11 — Adjusted gross income',            /\b11\b.*adjusted gross|adjusted gross income/i);
    const yr = (text.match(/\b(20\d{2})\b/g)||[]).map(Number).sort((a,b)=>b-a)[0];
    if (yr) F.push({slot:'', label:'Tax year on the return', value:yr, src:'Detected', yearScoped:false, apply:false, readonly:true});
    F.push({slot:'', label:'The 1040 is a cross-check — enter the qualifying figures on the Schedule C, K-1 or Other Income worksheets',
            value:0, src:'Guidance', yearScoped:false, apply:false, readonly:true});
  }
  else if (type==='aus'){
    const A = parseAUS(text);
    Object.keys(A.f).forEach(k=>{ if(A.f[k]) F.push({slot:'', label:AUS_LABEL[k]||k, value:A.f[k],
      src:'AUS findings', yearScoped:false, apply:false, readonly:true, isText:true}); });
    F.push({slot:'', label:`${A.findings.length} numbered findings parsed`, value:A.findings.length,
            src:'Use the AUS tab to review them', yearScoped:false, apply:false, readonly:true});
  }
  else if (type==='f1120'){
    push('taxable','Line 30 — Taxable income',   amountFor(L,/\b30\b.*taxable income|taxable income/i));
    push('tax',    'Line 31 — Total tax',        amountFor(L,/\b31\b.*total tax|total tax/i));
    push('depr',   'Line 20 — Depreciation',     amountFor(L,/\b20\b.*depreciation|depreciation/i));
    push('depl',   'Line 21 — Depletion',        amountFor(L,/\b21\b.*depletion|depletion/i));
    push('nol',    'Line 29c — NOL & special deductions', amountFor(L,/29c|net operating loss/i));
  }
  /* generic sweep: every labelled dollar amount, unchecked, for manual mapping */
  const seen = new Set(F.map(f=>f.value));
  L.forEach(l=>{
    const v = moneyOn(l);
    if (!v.length) return;
    const amt = v[v.length-1];
    if (!amt || Math.abs(amt) < 1 || seen.has(amt)) return;
    const label = l.replace(MONEY_RE,'').replace(/\s+/g,' ').trim().slice(0,58);
    if (label.length < 3) return;
    seen.add(amt);
    F.push({slot:'', label:label, value:amt, src:l, yearScoped:true, apply:false, generic:true});
  });
  return F;
}

/* ---------- reading the file ---------- */
async function pdfText(file, onProg){
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({data:buf}).promise;
  let out = '';
  for (let i=1;i<=pdf.numPages;i++){
    const pg = await pdf.getPage(i);
    const tc = await pg.getTextContent();
    let last = null, line = '';
    tc.items.forEach(it=>{
      const y = it.transform[5];
      if (last !== null && Math.abs(y-last) > 2){ out += line.trim()+'\n'; line=''; }
      line += it.str + ' '; last = y;
    });
    out += line.trim()+'\n';
    if (onProg) onProg(i/pdf.numPages*0.9);
  }
  return {text:out, pdf};
}
async function pdfPageImages(pdf, max){
  const imgs = [];
  for (let i=1;i<=Math.min(pdf.numPages, max||4); i++){
    const pg = await pdf.getPage(i);
    const vp = pg.getViewport({scale:2});
    const c = document.createElement('canvas');
    c.width = vp.width; c.height = vp.height;
    await pg.render({canvasContext:c.getContext('2d'), viewport:vp}).promise;
    imgs.push(c);
  }
  return imgs;
}
let tessLoading = null;
function loadTesseract(){
  if (window.Tesseract) return Promise.resolve(true);
  if (tessLoading) return tessLoading;
  tessLoading = new Promise(res=>{
    const sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.0/tesseract.min.js';
    sc.onload = ()=>res(!!window.Tesseract);
    sc.onerror = ()=>res(false);
    document.head.appendChild(sc);
    setTimeout(()=>res(!!window.Tesseract), 15000);
  });
  return tessLoading;
}
async function ocrImages(imgs, onProg){
  const ok = await loadTesseract();
  if (!ok) throw new Error('OCR engine could not be loaded — an internet connection is required the first time OCR runs.');
  let out = '';
  for (let i=0;i<imgs.length;i++){
    const r = await Tesseract.recognize(imgs[i], 'eng', {
      logger: m => { if (m.status==='recognizing text' && onProg) onProg((i + m.progress)/imgs.length); }
    });
    out += r.data.text + '\n';
  }
  return out;
}

/* ---------- pipeline ---------- */
async function handleFiles(files){
  for (const f of [...files]){
    const d = { id:uid(), name:f.name, size:f.size, status:'working', note:'Reading…',
                text:'', type:'other', fields:[], target:'', yearCol:'y1', prog:0, open:false };
    DOCS.push(d); renderDocs();
    try{
      let text = '', pdf = null, viaOCR = false;
      if (/\.pdf$/i.test(f.name)){
        if (!window.pdfjsLib) throw new Error('The PDF reader could not be loaded — an internet connection is required the first time the page is opened.');
        const r = await pdfText(f, p=>{ d.prog=p; d.note='Reading PDF text…'; renderDocs(); });
        text = r.text; pdf = r.pdf;
        if (text.replace(/\s/g,'').length < 40){
          d.note = 'No text layer found — running OCR on the scan…'; renderDocs();
          const imgs = await pdfPageImages(pdf, 4);
          text = await ocrImages(imgs, p=>{ d.prog=p; renderDocs(); });
          viaOCR = true;
        }
      } else {
        d.note = 'Running OCR on the image…'; renderDocs();
        const img = await new Promise((res,rej)=>{ const i=new Image();
          i.onload=()=>res(i); i.onerror=rej; i.src = URL.createObjectURL(f); });
        text = await ocrImages([img], p=>{ d.prog=p; renderDocs(); });
        viaOCR = true;
      }
      const type = classify(text);
      const segs = (type==='wvoe') ? wvoeSegments(text) : [{label:'', text}];
      const made = [];
      segs.forEach((sg, i)=>{
        const doc = i===0 ? d : {id:uid(), name:f.name, size:f.size, prog:1};
        Object.assign(doc, {
          status:'done', text:sg.text, type,
          fields: extractFields(type, sg.text),
          name: sg.label ? `${f.name} — ${sg.label}` : f.name,
          yearCol:'y1'
        });
        doc.note = `${viaOCR?'OCR':'PDF text layer'} · ${doc.fields.filter(x=>x.apply).length} field`
                 + `${doc.fields.filter(x=>x.apply).length===1?'':'s'} detected`
                 + (segs.length>1 ? ` · employer ${i+1} of ${segs.length}` : '');
        if (i>0) DOCS.push(doc);
        made.push(doc);
      });
      renderDocs();
      if (made.some(d=>d.type==='aus')){
        const a = made.find(d=>d.type==='aus');
        applyAUS(a.text, f.name);
        toast('AUS findings read — see the AUS Findings tab');
        renderDocs();
      }
      if (AUTO_APPLY){
        made.forEach(doc=>{
          if (!REC_KIND[docType(doc.type).kind]) return;
          doc.target = defaultTarget(doc.type);   /* recomputed per segment so each gets its own record */
          applyDoc(doc.id, true);
        });
        toast(made.length>1
          ? `${made.length} employers imported and applied — verify every figure against the report`
          : 'Imported and applied — verify every figure against the document');
      }
    }catch(err){
      d.status='fail'; d.note = err.message || String(err);
    }
    renderDocs();
  }
}
/* a Work Number report can cover several employers — split it into one segment each */
function wvoeSegments(text){
  let idx = [...text.matchAll(/VERIFICATION SERVICES/gi)].map(m=>m.index);
  if (idx.length < 2) idx = [...text.matchAll(/^[ \t]*Employer:[ \t]*\S/gmi)].map(m=>m.index);
  if (idx.length < 2) return [{label:'', text}];
  return idx.map((st,i)=>{
    const seg = text.slice(st, i+1<idx.length ? idx[i+1] : text.length);
    const nm = (seg.match(/^\s*Employer(?:\s*Name)?\s*:\s*(.+)$/mi)||[])[1] || '';
    return {label: nm.replace(/\s*\(\d{3,}\)\s*$/,'').trim(), text:seg};
  }).filter(x=>/employer/i.test(x.text));
}
function isEmptyRec(k, r){
  if (k==='w2')   return !r.employer && !N(r.rate) && !N(r.y1.base) && !N(r.y2.base);
  if (k==='schc') return !r.name && !N(r.y1.net31) && !N(r.y2.net31);
  if (k==='corp') return !r.name && !N(r.y1.ordinary) && !N(r.y2.ordinary);
  if (k==='sche') return !r.addr && !N(r.rents) && !N(r.leaseRent);
  return false;
}
function defaultTarget(type){
  const kind = docType(type).kind;
  if (!REC_KIND[kind]) return '';           /* 'none' and 'aus' have no worksheet record */
  const empty = (S[kind]||[]).find(r=>isEmptyRec(kind,r));
  return empty ? kind+'|'+empty.id : kind+'|NEW';
}
/* The only document kinds that map onto a worksheet record. Anything else — a 1040
   read for cross-check, a DU/LPA findings report — has no record to be applied to. */
const REC_KIND = {
  w2  :{label:'Employment', name:r=>r.employer},
  schc:{label:'Business',   name:r=>r.name},
  corp:{label:'Entity',     name:r=>r.name},
  sche:{label:'Property',   name:r=>r.addr}
};
function targetOptions(type){
  const kind = docType(type).kind;
  if (kind==='aus')   return '<option value="">AUS Findings tab</option>';
  const K = REC_KIND[kind];
  if (!K) return '<option value="">— read for reference only —</option>';
  return (S[kind]||[]).map((r,i)=>`<option value="${kind}|${r.id}">${esc(K.name(r))||K.label+' #'+(i+1)}</option>`).join('')
    + `<option value="${kind}|NEW">+ Create a new ${K.label.toLowerCase()}</option>`;
}
function setDoc(id, f, v){ const d=DOCS.find(x=>x.id===id); if(d){ d[f]= v; if(f==='type'){ d.fields=extractFields(v,d.text); d.target=defaultTarget(v); } renderDocs(); } }
function setFld(docId, i, f, v){ const d=DOCS.find(x=>x.id===docId); if(!d) return; d.fields[i][f]=v; if(f!=='apply') renderDocs(); else renderDocs(); }
function clearDocs(){ DOCS.length=0; renderDocs(); }

function renderDocs(){
  setT('cnt-docs', DOCS.length);
  const yearCols = {w2:[['y1','Most recent / YTD'],['y2','Prior year'],['y3','Two years prior']],
                    schc:[['y1','Most recent year'],['y2','Prior year']],
                    corp:[['y1','Most recent year'],['y2','Prior year']],
                    sche:[['y1','Most recent year']]};
  const card = d => {
    const kind = docType(d.type).kind;
    const cols = yearCols[kind] || [];
    const applied = d.fields.filter(f=>f.apply).length;
    return `<div class="doc-card">
      <div class="doc-top">
        <svg class="icon" style="color:var(--accent)"><use href="#i-doc"/></svg>
        <div><div class="doc-name">${esc(d.name)}</div>
          <div class="doc-meta">${(d.size/1024).toFixed(0)} KB · ${esc(d.note)}</div></div>
        <div class="spacer"></div>
        <span class="doc-status ${d.status==='done'?'st-done':d.status==='fail'?'st-fail':'st-work'}">
          ${d.status==='done'?'READY':d.status==='fail'?'FAILED':'WORKING'}</span>
        <button class="btn-icon no-print" onclick="DOCS.splice(DOCS.findIndex(x=>x.id==='${d.id}'),1);renderDocs()">
          <svg class="icon"><use href="#i-trash"/></svg></button>
      </div>
      ${d.status==='working' ? `<div style="padding:12px 14px"><div class="prog"><i style="width:${Math.round(d.prog*100)}%"></i></div></div>` : ''}
      ${d.status==='fail' ? `<div style="padding:12px 14px"><div class="notice bad" style="margin:0">
        <svg class="icon"><use href="#i-alert"/></svg><span>${esc(d.note)}</span></div></div>` : ''}
      ${d.status==='done' ? `
      <div style="padding:13px 14px">
        ${d.fields.some(f=>f.warn) ? `<div class="notice bad"><svg class="icon"><use href="#i-alert"/></svg>
          <span><b>Employment is not shown as active on this verification.</b>
          ${esc((d.fields.find(f=>f.warn)||{}).label||'')} — confirm whether this income may be used at all.</span></div>` : ''}
        <div class="grid g4" style="margin-bottom:12px">
          <div class="field"><label>Document type</label>
            <select class="cell-input" onchange="setDoc('${d.id}','type',this.value)">
              ${Object.keys(DOC_TYPES).map(k=>`<option value="${k}" ${d.type===k?'selected':''}>${DOC_TYPES[k].label}</option>`).join('')}
            </select></div>
          <div class="field"><label>Apply to</label>
            <select class="cell-input" onchange="setDoc('${d.id}','target',this.value)">
              ${targetOptions(d.type).replace(`value="${d.target}"`, `value="${d.target}" selected`)}
            </select></div>
          ${cols.length>1?`<div class="field"><label>Year column</label>
            <select class="cell-input" onchange="setDoc('${d.id}','yearCol',this.value)">
              ${cols.map(([v,l])=>`<option value="${v}" ${d.yearCol===v?'selected':''}>${l}</option>`).join('')}
            </select></div>`:''}
          <div class="field"><label>&nbsp;</label>
            <button class="btn btn-green" style="width:100%" onclick="applyDoc('${d.id}')">
              <svg class="icon"><use href="#i-magic"/></svg>${kind==='aus'
                ? 'Read findings'
                : `Apply ${applied} field${applied===1?'':'s'}`}</button></div>
        </div>
        <div class="tbl-scroll"><table class="fld-tbl">
          <thead><tr><th style="width:34px">Use</th><th>Detected field</th><th style="width:150px">Value</th>
            <th style="width:190px">Goes to</th><th>Source line</th></tr></thead>
          <tbody>${d.fields.map((f,i)=>`<tr>
            <td><input type="checkbox" ${f.apply?'checked':''} ${f.readonly?'disabled':''}
                 onchange="setFld('${d.id}',${i},'apply',this.checked)"></td>
            <td>${esc(f.label)}</td>
            <td>${f.isDate
                 ? dateFld(f.value,'setFld',d.id,i,'value')
                 : f.isText
                 ? `<input class="cell-input" value="${esc(f.value)}" oninput="setFld('${d.id}',${i},'value',this.value)">`
                 : `<input class="cell-input" type="number" step="0.01" value="${f.value}" oninput="setFld('${d.id}',${i},'value',N(this.value))">`}</td>
            <td><select class="cell-input" onchange="setFld('${d.id}',${i},'slot',this.value)">
                  <option value="">— skip —</option>
                  ${slotOptions(kind, d.yearCol).map(([v,l])=>`<option value="${v}" ${f.slot===v?'selected':''}>${l}</option>`).join('')}
                </select></td>
            <td><span class="src" title="${esc(f.src)}">${esc(f.src)}</span></td>
          </tr>`).join('')}</tbody>
        </table></div>
        <div class="block collapsed" style="margin-top:12px">
          <div class="block-head" onclick="this.parentNode.classList.toggle('collapsed')">
            <h3><svg class="icon"><use href="#i-doc"/></svg>Extracted text</h3>
            <svg class="icon chev"><use href="#i-chev"/></svg></div>
          <div class="block-body"><div class="raw">${esc(d.text.slice(0,6000))}</div></div>
        </div>
      </div>` : ''}
    </div>`;
  };
  $('docList').innerHTML = DOCS.map(d=>{
    try { return card(d); }
    catch(err){
      console.error('Document card failed to render', d && d.name, err);
      return `<div class="doc-card"><div class="doc-top">
        <svg class="icon" style="color:var(--rose)"><use href="#i-alert"/></svg>
        <div><div class="doc-name">${esc((d&&d.name)||'Document')}</div>
          <div class="doc-meta">This card could not be displayed — ${esc(err.message)}.
            The text was still read, so re-pick the document type below.</div></div>
        <div class="spacer"></div>
        <button class="btn-icon no-print" onclick="DOCS.splice(DOCS.findIndex(x=>x.id==='${d&&d.id}'),1);renderDocs()">
          <svg class="icon"><use href="#i-trash"/></svg></button>
      </div></div>`;
    }
  }).join('') || '';
}
function slotOptions(kind){
  const M = {
    w2:  [['base','Base / regular earnings'],['ot','Overtime'],['comm','Commission'],['bonus','Bonus'],
          ['other','Other income'],['rate','Pay rate'],['hours','Hours per week'],
          ['ytdThru','Paystub / VOE end date'],['hireDate','Hire date'],['freq','Pay frequency'],
          ['employer','Employer name'],['_borrower','Borrower name (file header)']],
    schc:[['net31','Line 31 net profit'],['depl12','Line 12 depletion'],['depr13','Line 13 depreciation'],
          ['meals','Line 24b meals'],['home30','Line 30 business use of home'],['amort','Amortization'],['miles','Line 44a business miles']],
    corp:[['ordinary','Ordinary business income'],['netRental','Net rental real estate'],['othRental','Other net rental'],
          ['guar','Guaranteed payments'],['dist','Distributions'],['w2biz','W-2 from business'],
          ['depr','Depreciation'],['depl','Depletion'],['amort','Amortization'],['nonrec','Non-recurring other income'],
          ['notes','Notes payable < 1 yr'],['travel','Travel & entertainment'],
          ['taxable','1120 taxable income'],['tax','1120 total tax'],['nol','1120 NOL'],['_own','Ownership %']],
    sche:[['rents','Rents received'],['ins','Insurance'],['mortInt','Mortgage interest'],['taxes','Taxes'],
          ['depr','Depreciation'],['otherAdd','HOA / repairs'],['totalExp','Total expenses'],
          ['fairDays','Fair rental days'],['personalDays','Personal use days'],['pitia','Full PITIA']],
    none:[]
  };
  return M[kind]||[];
}

/* ---------- apply to worksheets ---------- */
const NOT_YEAR_SCOPED = {w2:['rate','hours','ytdThru','hireDate','freq','employer'], schc:[], corp:['_own'],
                         sche:['rents','ins','mortInt','taxes','depr','otherAdd','totalExp','fairDays','personalDays','pitia']};
function applyDoc(id, quiet){
  const d = DOCS.find(x=>x.id===id); if(!d) return;
  const kind = docType(d.type).kind;
  if (kind==='aus'){ applyAUS(d.text, d.name); switchTab('aus'); return; }
  if (kind==='none' || !d.target){ toast('Choose where this document should be applied first'); return; }
  let [k, rid] = d.target.split('|');
  if (rid==='NEW'){
    const mk = {w2:newW2, schc:newSchC, corp:newCorp, sche:newSchE}[k];
    const rec = mk(); S[k].push(rec); rid = rec.id;
    d.target = k+'|'+rid;
  }
  const rec = S[k].find(r=>r.id===rid);
  if(!rec){ toast('Target worksheet no longer exists'); return; }
  let n = 0;
  d.fields.forEach(f=>{
    if (!f.apply || !f.slot || f.readonly) return;
    if (f.slot==='_borrower'){ S.b1 = String(f.value); S.borrower = S.b1; $('b1Name').value = S.b1; n++; return; }
    if (f.slot==='_own'){ rec.own = N(f.value); n++; return; }
    const flat = (NOT_YEAR_SCOPED[k]||[]).includes(f.slot) || f.isText;
    if (flat || !f.yearScoped){
      rec[f.slot] = (f.isDate || f.isText) ? f.value : N(f.value);
    } else {
      const col = (k==='sche') ? null : (f.col || d.yearCol);
      if (col && rec[col]) rec[col][f.slot] = N(f.value);
      else rec[f.slot] = N(f.value);
    }
    n++;
  });
  let extra = '';
  if (k==='w2'){
    const r = calcW2(rec);
    /* a paystub gives the rate but not always weekly hours — fall back to the YTD average
       so the worksheet is not left showing zero */
    if (!r.monthlyBase && N(rec.y1.base) > 0 && rec.m.base === 'current'){
      rec.m.base = 'ytd';
      extra = ' Base set to the YTD average because weekly hours are not on the document.';
    }
    const varImported = ['ot','comm','bonus'].filter(c=>N(rec.y1[c])>0 && rec.m[c]==='none');
    if (varImported.length) extra += ' Overtime, commission and bonus stay at "Do Not Use" until you pick a method.';
  }
  ({w2:renderW2, schc:renderSchC, corp:renderCorp, sche:renderSchE})[k]();
  RECALC();
  if (!quiet) toast(`${n} value${n===1?'':'s'} applied — verify against the document.${extra}`);
}
function applyAllDocs(){ DOCS.filter(d=>d.status==='done').forEach(d=>applyDoc(d.id)); }

/* ---------- drag & drop ---------- */
(function(){
  const dz = () => $('dropZone');
  ['dragenter','dragover'].forEach(ev=>document.addEventListener(ev, e=>{
    if (!e.dataTransfer || ![...e.dataTransfer.types].includes('Files')) return;
    e.preventDefault();
    if ($('panel-docs') && !$('panel-docs').classList.contains('active')) switchTab('docs');
    if (dz()) dz().classList.add('drag');
  }));
  ['dragleave','drop'].forEach(ev=>document.addEventListener(ev, e=>{
    if (dz()) dz().classList.remove('drag');
  }));
  document.addEventListener('drop', e=>{
    if (!e.dataTransfer || !e.dataTransfer.files.length) return;
    e.preventDefault();
    switchTab('docs');
    handleFiles(e.dataTransfer.files);
  });
})();
