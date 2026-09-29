
/* ================== AGENCY GUIDELINE LIBRARY ==================
   Condensed summaries of published agency policy. Always confirm against the
   current Fannie Mae Selling Guide, Freddie Mac Seller/Servicer Guide, or
   HUD Handbook 4000.1 before making a final underwriting decision.
   ============================================================== */
const GUIDES = [
{key:'w2', title:'W-2 / Salaried & Hourly Base Income', cat:'Employment',
 cite:{FNMA:'B3-3.1-01 / B3-3.1-02', FHLMC:'Guide 5303.2', FHA:'4000.1 II.A.4.c.xii(B)'},
 FNMA:`Two-year employment history is the benchmark; gaps or shorter histories require justification that income is stable and likely to continue for at least three years. Document with a paystub showing at least <b>30 days of YTD earnings</b> plus W-2s for the most recent two years, or a fully completed written VOE. A <b>verbal VOE</b> is required within 10 business days of the note date. Calculate base pay by pay frequency (hourly rate x hours x 52 &divide; 12).`,
 FHLMC:`Same core standard: a 10-day pre-closing verification plus a YTD paystub and prior-year W-2 (or written VOE). Freddie Mac allows a <b>one-paystub option</b> where the paystub covers at least 30 days YTD and includes all year-to-date earnings.`,
 FHA:`Two full years of employment history required (school or military counts with documentation). Provide the most recent paystub with YTD figures covering at least 30 days plus W-2s for the prior two years, or a written VOE plus a paystub. Gaps of six months or more require six months on the current job.`,
 rule:`If the YTD monthly average is <b>lower</b> than the calculated base rate, the YTD figure is used unless a satisfactory written explanation is documented.`},

{key:'variable', title:'Overtime, Bonus & Commission (Variable Income)', cat:'Employment',
 cite:{FNMA:'B3-3.1-01', FHLMC:'Guide 5303.4', FHA:'4000.1 II.A.4.c.xii(C)-(D)'},
 FNMA:`Variable income must have a history of receipt of at least <b>12 months</b> and be averaged over the <b>lesser of 24 months or the full length of receipt</b>. If the trend is declining, the lender must document that the income is still stable and generally use the more conservative (lower) figure. Level or increasing income may be averaged over 24 months.`,
 FHLMC:`Fluctuating hourly, overtime, bonus and commission earnings are averaged over the most recent two years (or the period of receipt if shorter, with a minimum 12-month history). A year-over-year decline requires written analysis supporting continued receipt.`,
 FHA:`Overtime and bonus may be used when received for the <b>past two years</b> and likely to continue. Average over two years; if the earnings show a decrease of <b>more than 20%</b> from the prior year, the lender must use the lower current figure. Commission requires a minimum <b>one-year</b> history.`,
 rule:`This worksheet enables 12-month and 24-month averaging columns and flags any component with less than a two-year history.`},

{key:'declining', title:'Declining Income Analysis', cat:'Risk',
 cite:{FNMA:'B3-3.1-01', FHLMC:'Guide 5303.1', FHA:'4000.1 II.A.4.c'},
 FNMA:`If income is trending down, the lender must provide a written analysis explaining why the income remains stable, and must use the lower amount. Income that cannot be shown to be stable must be excluded entirely.`,
 FHLMC:`A decline requires the seller to document the reason and to determine the income is reasonably expected to continue; the reduced amount is used for qualifying.`,
 FHA:`Declining income must be analyzed; the mortgagee may not use income that is not reasonably likely to continue. Use the lower, most recent figure.`,
 rule:`Any component with a year-over-year decline is automatically recommended at the more conservative averaging period.`},

{key:'schc', title:'Self-Employment — Schedule C Sole Proprietorship', cat:'Self-Employed',
 cite:{FNMA:'B3-3.2 / Form 1084', FHLMC:'Guide 5304 / Form 91', FHA:'4000.1 II.A.4.c.xii'},
 FNMA:`Generally two years of signed individual federal returns. A <b>one-year</b> option exists when the borrower has been self-employed at least five years and the return supports the income. Add back depletion, depreciation, business use of home, amortization/casualty loss and the business mileage depreciation component; subtract the meals and entertainment exclusion. Fannie Mae also requires an assessment of business stability (e.g., a recent P&amp;L or business bank statements where applicable).`,
 FHLMC:`Form 91 applies the same add-backs. Freddie Mac permits a one-year return when the business has been in existence for five or more years and income is stable or increasing.`,
 FHA:`Two years of self-employment is standard. Between one and two years may be acceptable only where the borrower has documented prior related employment or training. Average the last two years; if the most recent year is lower, use the lower figure.`,
 rule:`Calculation: Line 31 + depletion + depreciation − 50% meals exclusion + business use of home + amortization + (business miles &times; depreciation rate).`},

{key:'partnership', title:'Partnership Income (Form 1065 / K-1)', cat:'Self-Employed',
 cite:{FNMA:'B3-3.2-02 / B3-3.4-01', FHLMC:'Guide 5304.1', FHA:'4000.1 II.A.4.c.xii'},
 FNMA:`The borrower must document <b>ownership percentage</b> (Schedule K-1), <b>access to the income</b>, and that the business has <b>adequate liquidity</b> to support the withdrawal of earnings. Where distributions are less than ordinary business income, use the lesser amount unless liquidity is demonstrated. Guaranteed payments to the partner (K-1 line 4c) are added in full.`,
 FHLMC:`Ordinary income may be used when the borrower has access to it; otherwise use distributions. A liquidity analysis (current or quick ratio) supports using the higher ordinary income figure.`,
 FHA:`Government loans generally use the <b>ordinary business income</b> reported on the K-1, adjusted for the borrower's ownership percentage, with add-backs for depreciation, depletion and amortization.`,
 rule:`This tool caps ordinary income at distributions for conventional files unless "liquidity documented" is set to Yes.`},

{key:'scorp', title:'S-Corporation Income (Form 1120-S / K-1)', cat:'Self-Employed',
 cite:{FNMA:'B3-3.2-02 / Form 1084', FHLMC:'Guide 5304.1', FHA:'4000.1 II.A.4.c.xii'},
 FNMA:`Same ownership / access / liquidity tests as a partnership. W-2 wages paid by the S-Corporation to the borrower are counted as wage income and must not be double counted. Distributions appear on K-1 line 16d.`,
 FHLMC:`Form 91 adjusts ordinary income for depreciation, depletion, amortization, non-recurring items, notes payable in less than one year, and the travel and entertainment exclusion, then applies ownership percentage.`,
 FHA:`Use ordinary business income adjusted for the ownership percentage; corporate losses reduce qualifying income.`,
 rule:`Add-backs applied: depreciation, depletion, amortization; deductions: non-recurring income, notes payable &lt; 1 year, meals &amp; entertainment.`},

{key:'ccorp', title:'C-Corporation Income (Form 1120)', cat:'Self-Employed',
 cite:{FNMA:'B3-3.2-02 / Form 1084', FHLMC:'Guide 5304.1', FHA:'4000.1 II.A.4.c.xii'},
 FNMA:`Corporate cash flow = taxable income − total tax − non-recurring gains + non-recurring losses + depreciation + depletion + amortization − net operating loss and special deductions − notes payable in less than one year − meals and entertainment exclusion, multiplied by the borrower's ownership percentage. Dividends already reported on the borrower's 1040 must not be counted twice.`,
 FHLMC:`Identical structure on Form 91. Ownership evidenced by Form 1125-E.`,
 FHA:`Corporate income may be used where the borrower owns 25% or more and can document access; otherwise only W-2 wages and documented dividends are used.`,
 rule:`Dividends paid to the borrower are added after applying the ownership percentage.`},

{key:'rental', title:'Rental / Schedule E Income', cat:'Real Estate',
 cite:{FNMA:'B3-3.1-08 / Forms 1037-1039', FHLMC:'Guide 5306.1', FHA:'4000.1 II.A.4.c.xii(I)'},
 FNMA:`When the property appears on Schedule E for a full year, net rental income = rents received − total expenses + insurance + mortgage interest + taxes + depreciation + HOA/documented repairs, divided by the number of months in service, then reduced by the <b>full monthly PITIA</b>. For a newly acquired property or a new lease, use <b>75% of gross rent</b>. A net loss is added to monthly liabilities.`,
 FHLMC:`Same add-back structure; Freddie Mac limits qualifying rental income from a subject investment property to 30% of total stable monthly income when the borrower has no rental-management history.`,
 FHA:`Apply a <b>75% vacancy factor</b> to gross rents unless the state or jurisdiction requires otherwise. Limited or no rental history requires two years of Schedule E or an appraiser's rent schedule. Net loss is treated as a recurring liability.`,
 rule:`Positive cash flow is added to income; negative cash flow is automatically added to the back-end debt total on the DTI tab.`},

{key:'ss', title:'Social Security (Retirement, Survivor, Disability)', cat:'Other Income',
 cite:{FNMA:'B3-3.1-09', FHLMC:'Guide 5305.2', FHA:'4000.1 II.A.4.c.xii(M)'},
 FNMA:`Document with the SSA award letter, most recent benefit statement, or 1099. For income with <b>no defined expiration date</b>, no additional continuance documentation is required. Non-taxable benefits may be grossed up by up to <b>25%</b>.`,
 FHLMC:`Verify with the award letter or Proof of Income letter plus receipt. Non-taxable portion may be grossed up by 25%.`,
 FHA:`Requires the award letter plus proof of current receipt. If the benefit has a defined expiration, it must continue at least <b>three years</b>. Gross-up limited to <b>15%</b> unless a higher actual tax rate is documented.`,
 rule:`Gross-up percentage defaults to 25% (conventional) or 15% (FHA) based on the agency selected in the header.`},

{key:'retire', title:'Pension, IRA, 401(k) & Annuity Distributions', cat:'Other Income',
 cite:{FNMA:'B3-3.1-09', FHLMC:'Guide 5305.2', FHA:'4000.1 II.A.4.c.xii(N)'},
 FNMA:`Verify with letters from the organization, 1099s, or the most recent two months of bank statements showing deposits. Distributions must be expected to continue at least <b>three years</b>; retirement accounts drawn down must show sufficient remaining balance.`,
 FHLMC:`Requires evidence of current receipt and that the asset supporting the distribution is sufficient to continue for at least three years.`,
 FHA:`Requires the most recent federal return or 1099 plus evidence of current receipt, and confirmation that the income continues for at least three years.`,
 rule:`Enter the documented monthly amount; taxable pension income is not grossed up.`},

{key:'support', title:'Alimony, Separate Maintenance & Child Support', cat:'Other Income',
 cite:{FNMA:'B3-3.1-09', FHLMC:'Guide 5305.2', FHA:'4000.1 II.A.4.c.xii(E)'},
 FNMA:`Document with the divorce decree, separation agreement, or court order, plus evidence of <b>full, regular receipt</b> (generally 6 to 12 months). The income must continue for at least three years after the note date. Alimony may alternatively be treated as a reduction to income rather than a liability.`,
 FHLMC:`Requires the legal agreement plus 3 to 12 months of documented receipt and evidence the payments continue at least three years.`,
 FHA:`Requires the court order and evidence of receipt for the most recent <b>three months</b>, and that payments continue for at least three years. Child support is generally non-taxable and may be grossed up by 15%.`,
 rule:`Set continuance below 36 months to trigger an automatic ineligibility flag.`},

{key:'disab', title:'Long-Term Disability Income', cat:'Other Income',
 cite:{FNMA:'B3-3.1-09', FHLMC:'Guide 5305.2', FHA:'4000.1 II.A.4.c.xii(F)'},
 FNMA:`Obtain a copy of the disability policy or benefits statement confirming the amount, frequency and, critically, that there is <b>no predetermined expiration date</b>. Short-term disability generally may not be used.`,
 FHLMC:`Similar documentation; benefit must not expire within three years.`,
 FHA:`Requires the award letter and evidence of current receipt; the benefit must continue at least three years. Non-taxable benefits may be grossed up by 15%.`,
 rule:``},

{key:'va', title:'VA Benefits (Non-Education)', cat:'Other Income',
 cite:{FNMA:'B3-3.1-09', FHLMC:'Guide 5305.2', FHA:'4000.1 II.A.4.c.xii(T)'},
 FNMA:`Document with a VA benefits letter or distribution form confirming the benefit continues at least three years. Education benefits may not be used.`,
 FHLMC:`Same standard; verify amount and continuance.`,
 FHA:`Requires the VA award letter and proof the benefit continues at least three years. Non-taxable, so gross-up applies.`, rule:``},

{key:'military', title:'Military Entitlements (BAH / BAS / Flight / Hazard)', cat:'Other Income',
 cite:{FNMA:'B3-3.1-09', FHLMC:'Guide 5303.4', FHA:'4000.1 II.A.4.c.xii(K)'},
 FNMA:`Verified with the Leave and Earnings Statement. Entitlements such as quarters allowance, clothing, rations, flight or hazard pay are usable when likely to continue. Non-taxable allowances may be grossed up.`,
 FHLMC:`Same; the LES documents both base pay and entitlements.`,
 FHA:`Military income including allowances is acceptable when documented on the LES and likely to continue for the first three years.`, rule:``},

{key:'intdiv', title:'Interest & Dividend Income', cat:'Other Income',
 cite:{FNMA:'B3-3.1-09', FHLMC:'Guide 5305.2', FHA:'4000.1 II.A.4.c.xii(J)'},
 FNMA:`Average the amount reported on Schedule B over the most recent <b>two years</b>. Subtract any portion generated by assets being liquidated for the down payment or closing costs.`,
 FHLMC:`Two-year average from the tax returns with the same asset-depletion adjustment.`,
 FHA:`Average over the last two years using tax returns; subtract funds withdrawn for the transaction.`, rule:``},

{key:'capgain', title:'Recurring Capital Gains', cat:'Other Income',
 cite:{FNMA:'B3-3.1-09', FHLMC:'Guide 5305.2', FHA:'4000.1 II.A.4.c.xii(H)'},
 FNMA:`Requires a <b>three-year</b> history of receipt documented on Schedule D, evidence the borrower still owns sufficient assets to generate the gains, and averaging over three years. One-time gains are excluded.`,
 FHLMC:`Two to three years of returns showing consistent gains and remaining assets sufficient to continue.`,
 FHA:`Three-year average from the tax returns; the mortgagee must document that the gains will continue.`, rule:``},

{key:'trust', title:'Trust Income', cat:'Other Income',
 cite:{FNMA:'B3-3.1-09', FHLMC:'Guide 5305.2', FHA:'4000.1 II.A.4.c.xii(R)'},
 FNMA:`Obtain a copy of the trust agreement or trustee statement confirming the amount, frequency and duration of payments; income must continue at least three years.`,
 FHLMC:`Same documentation standard.`, FHA:`Trust agreement or trustee statement plus evidence of current and continuing receipt for three years.`, rule:``},

{key:'notes', title:'Notes Receivable / Installment Sale Income', cat:'Other Income',
 cite:{FNMA:'B3-3.1-09', FHLMC:'Guide 5305.2', FHA:'4000.1 II.A.4.c.xii(L)'},
 FNMA:`Copy of the note confirming the amount and remaining term (at least three years) plus evidence of regular receipt for the last 12 months.`,
 FHLMC:`Same standard.`, FHA:`Copy of the note and three months of receipt; remaining term must be at least three years.`, rule:``},

{key:'royalty', title:'Royalty Income (Schedule E Part I)', cat:'Other Income',
 cite:{FNMA:'B3-3.1-09', FHLMC:'Guide 5305.2', FHA:'4000.1 II.A.4.c.xii(P)'},
 FNMA:`Copy of the royalty contract or statement plus the most recent two years of Schedule E; average over the documented period and confirm three-year continuance.`,
 FHLMC:`Two-year average from Schedule E.`, FHA:`Royalty payments require the contract and the last two years of returns.`, rule:``},

{key:'unemp', title:'Seasonal / Unemployment Income', cat:'Other Income',
 cite:{FNMA:'B3-3.1-09', FHLMC:'Guide 5303.4', FHA:'4000.1 II.A.4.c.xii(S)'},
 FNMA:`Seasonal unemployment compensation may be used when documented on tax returns for the most recent <b>two years</b> and the pattern of seasonal work is expected to continue.`,
 FHLMC:`Same two-year documentation standard for cyclical or seasonal employment.`,
 FHA:`Requires a two-year history of seasonal employment with the same employer and reasonable assurance of rehire.`, rule:``},

{key:'boarder', title:'Boarder Income', cat:'Other Income',
 cite:{FNMA:'B3-3.1-09 / HomeReady', FHLMC:'Home Possible 5318.1', FHA:'4000.1 II.A.4.c.xii(G)'},
 FNMA:`Permitted only on <b>HomeReady</b> loans: documented for at least 9 of the most recent 12 months, capped at <b>30%</b> of total qualifying income.`,
 FHLMC:`Permitted on Home Possible with 12 months of documented shared residency and payments; capped at 30% of qualifying income.`,
 FHA:`Boarder income is acceptable when the boarder has resided with the borrower for at least two years and is documented on tax returns.`, rule:``},

{key:'foster', title:'Foster Care Income', cat:'Other Income',
 cite:{FNMA:'B3-3.1-09', FHLMC:'Guide 5305.2', FHA:'4000.1 II.A.4.c.xii(I)'},
 FNMA:`Verified with letters from the placing agency and evidence of receipt for the most recent 12 to 24 months; income must be likely to continue.`,
 FHLMC:`Same standard.`, FHA:`Requires a two-year history; a shorter history may be used if income does not exceed 30% of total income.`, rule:``},

{key:'allow', title:'Automobile / Housing Allowance', cat:'Other Income',
 cite:{FNMA:'B3-3.1-09', FHLMC:'Guide 5303.4', FHA:'4000.1 II.A.4.c.xii(A)'},
 FNMA:`Requires a 12-month history of receipt. The full allowance is added to income and the associated debt (car payment) remains in the liabilities.`,
 FHLMC:`Same, with documentation of consistent receipt.`,
 FHA:`Automobile allowance may be used only for the amount by which it exceeds the actual expenses, documented for two years.`, rule:``},

{key:'c1099', title:'1099 / Independent Contractor Income', cat:'Self-Employed',
 cite:{FNMA:'B3-3.2', FHLMC:'Guide 5304', FHA:'4000.1 II.A.4.c.xii'},
 FNMA:`Contract income reported on 1099 is treated as <b>self-employment</b>: two years of signed returns with Schedule C analysis, unless the five-year/one-year exception applies.`,
 FHLMC:`Same treatment under Form 91; Freddie Mac's Schedule C analysis applies.`,
 FHA:`1099 income is self-employment income requiring two years of returns and a year-to-date profit and loss statement where the fiscal year is more than a quarter complete.`, rule:``},

{key:'tip', title:'Tip Income', cat:'Employment',
 cite:{FNMA:'B3-3.1-01', FHLMC:'Guide 5303.4', FHA:'4000.1 II.A.4.c.xii(R)'},
 FNMA:`Treated as variable income: minimum 12-month history, averaged over the lesser of 24 months or the period of receipt.`,
 FHLMC:`Averaged over two years or the documented period of receipt.`,
 FHA:`Requires a two-year history of receipt and likelihood of continuance; average over two years.`, rule:``},

{key:'pubassist', title:'Public Assistance', cat:'Other Income',
 cite:{FNMA:'B3-3.1-09', FHLMC:'Guide 5305.2', FHA:'4000.1 II.A.4.c.xii(O)'},
 FNMA:`Documented with letters or exhibits from the paying agency confirming amount, frequency and three-year continuance. Non-taxable, so gross-up applies.`,
 FHLMC:`Same standard.`, FHA:`Requires the paying agency letter and evidence the assistance continues at least three years.`, rule:``},

{key:'grossup', title:'Non-Taxable Income Gross-Up', cat:'Other Income',
 cite:{FNMA:'B3-3.1-01', FHLMC:'Guide 5305.1', FHA:'4000.1 II.A.4.c.xii'},
 FNMA:`Non-taxable income may be adjusted upward by <b>25%</b>. If the borrower's actual tax rate is documented and lower, use the lower amount. The lender must document that the income is in fact non-taxable.`,
 FHLMC:`Gross-up capped at <b>25%</b> of the non-taxable portion.`,
 FHA:`Gross-up limited to <b>15%</b>, or the borrower's actual documented tax rate if greater.`, rule:``},

{key:'assets', title:'Asset Depletion / Employment-Related Assets', cat:'Assets',
 cite:{FNMA:'B3-3.1-09 / B3-4.3-04', FHLMC:'Guide 5307.1', FHA:'4000.1 II.A.4'},
 FNMA:`Employment-related assets (retirement accounts, vested stock, severance) may be converted to income. Net eligible assets after funds to close and reserves are divided by the loan term in months (commonly <b>360</b>). Retirement accounts are typically discounted to 70% and require the borrower to have unrestricted access.`,
 FHLMC:`Asset depletion divides eligible assets by <b>240 months</b>; the borrower must be the sole owner or have documented access, and assets used for the down payment are excluded.`,
 FHA:`FHA does not recognize asset depletion as effective income. Liquid assets may still be used for reserves and closing funds only.`,
 rule:`Adjust the divisor on the Asset Depletion tab to match the agency and product.`},

{key:'dti', title:'Debt-to-Income Ratio Limits', cat:'Ratios',
 cite:{FNMA:'B3-6-02', FHLMC:'Guide 5401.2', FHA:'4000.1 II.A.5'},
 FNMA:`DU-approved loans allow a maximum back-end DTI of <b>50%</b>; there is no separate front-end (housing) limit. Manually underwritten loans are capped at 36% (up to 45% with strong reserves and credit).`,
 FHLMC:`LPA-accepted loans allow up to <b>50%</b>; manual underwrites cap at 45%.`,
 FHA:`Manual underwriting benchmarks are <b>31% front-end / 43% back-end</b>. With documented compensating factors, ratios may extend to 40%/50% or as high as 40%/56.9%. TOTAL Scorecard "Accept" findings govern automated files.`,
 rule:`Negative rental cash flow is automatically included in the back-end debt total.`},

{key:'docs', title:'Income Documentation Age & Verification', cat:'Risk',
 cite:{FNMA:'B1-1-03', FHLMC:'Guide 5102.4', FHA:'4000.1 II.A.1.b'},
 FNMA:`Income and asset documentation must be no more than <b>four months old</b> at the note date (12 months for tax returns per the filing calendar). Verbal VOE within 10 business days of closing for employment income and 120 days for self-employment.`,
 FHLMC:`Documents generally must be dated within 120 days of the note date.`,
 FHA:`Documents must be no more than <b>120 days old</b> at disbursement (180 days for new construction).`, rule:``}
];
const FNMA_SLUG = {
  'B3-3.1-01':'general-income-information',
  'B3-3.1-02':'standards-for-employment-documentation',
  'B3-3.1-08':'rental-income',
  'B3-3.1-09':'other-sources-of-income',
  'B3-3.2'   :'underwriting-factors-and-documentation-for-a-self-employed-borrower',
  'B3-3.2-01':'underwriting-factors-and-documentation-for-a-self-employed-borrower',
  'B3-3.2-02':'business-structures',
  'B3-3.4-01':'analyzing-partnership-returns-for-a-partnership-or-llc',
  'B3-6-02'  :'debt-to-income-ratios',
  'B1-1-03'  :'allowable-age-of-credit-documents-and-federal-income-tax-returns',
  'B3-4.3-04':'personal-gifts'
};
const HUD_4000_1 = 'https://www.hud.gov/program_offices/housing/sfh/handbook_4000-1';
function guideUrls(g){
  const fm = (g.cite.FNMA||'').match(/[AB]\d-[\d.\-]+\d/);
  const id = fm ? fm[0] : '';
  const slug = FNMA_SLUG[id];
  const FNMA = slug ? `https://selling-guide.fanniemae.com/sel/${id.toLowerCase()}/${slug}`
                    : 'https://selling-guide.fanniemae.com/';
  const fh = (g.cite.FHLMC||'').match(/\d{4}(?:\.\d+)?/);
  const FHLMC = fh ? `https://guide.freddiemac.com/app/guide/section/${fh[0]}`
                   : 'https://guide.freddiemac.com/';
  return {FNMA, FHLMC, FHA:HUD_4000_1, VA:'https://www.benefits.va.gov/warms/pam26_7.asp'};
}
function activeGuideKeys(){
  const k = new Set(['docs','dti']);
  if (S.w2.length) k.add('w2');
  S.w2.forEach(j=>{
    const r=calcW2(j);
    if (r.hasVariable) k.add('variable');
    if (r.chg1<0 || r.chg2<0) k.add('declining');
  });
  if (S.schc.length) { k.add('schc'); }
  S.corp.forEach(e=>{ if(e.form==='1065')k.add('partnership'); if(e.form==='1120S')k.add('scorp'); if(e.form==='1120')k.add('ccorp'); });
  S.schc.forEach(b=>{ if(calcSchC(b).declining) k.add('declining'); });
  S.corp.forEach(e=>{ if(calcCorp(e).declining) k.add('declining'); });
  if (S.sche.length) k.add('rental');
  S.other.forEach(o=>{ const t=OTHER_TYPES.find(x=>x.v===o.type); if(t) k.add(t.g); if(o.nonTax) k.add('grossup'); });
  if (S.assets.use || S.assets.rows.length) k.add('assets');
  return k;
}
let guideOpen = false;
function renderGuides(){
  const keys = activeGuideKeys();
  const list = GUIDES.filter(g=>keys.has(g.key));
  setT('cnt-guide', list.length);
  const cats = [...new Set(list.map(g=>g.cat))];
  const ag = S.agency==='VA' ? 'FHA' : S.agency;
  $('guideBody').innerHTML = `
    <div class="notice info"><svg class="icon"><use href="#i-alert"/></svg>
      <span>Showing <b>${list.length}</b> guideline topics triggered by the income entered in this file, highlighted for
      <b>${S.agency}</b>. These are condensed summaries for underwriting reference — confirm against the current
      Fannie Mae Selling Guide, Freddie Mac Seller/Servicer Guide, or HUD Handbook 4000.1 before final decisioning.</span></div>
    ${cats.map(c=>`
      <div style="margin:18px 0 8px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--slate-500)">${c}</div>
      ${list.filter(g=>g.cat===c).map(g=>`
        <div class="gl-card ${guideOpen?'open':''}" data-gkey="${g.key}">
          <div class="gl-head" onclick="this.parentNode.classList.toggle('open')">
            <svg class="icon chev"><use href="#i-chev"/></svg>
            <span class="t">${g.title}</span>
            <span class="cite">${g.cite[ag]||''}</span>
          </div>
          <div class="gl-body">
            ${['FNMA','FHLMC','FHA'].map(a=>`
              <div style="margin-bottom:10px;${a===ag?'':'opacity:.62'}">
                <span class="gl-agency ag-${a.toLowerCase()}">${a==='FNMA'?'FANNIE MAE':a==='FHLMC'?'FREDDIE MAC':'FHA'}</span>
                <span class="cite">${g.cite[a]}</span>
                <div style="margin-top:5px">${g[a]}</div>
              </div>`).join('')}
            ${g.rule?`<div class="rule"><b>Applied in this worksheet:</b> ${g.rule}</div>`:''}
            <div class="gl-links">
              <span class="muted" style="align-self:center">Open the source:</span>
              <a class="btn-link" target="_blank" rel="noopener" href="${guideUrls(g).FNMA}"><svg class="icon"><use href="#i-ext"/></svg>Fannie Mae Selling Guide</a>
              <a class="btn-link" target="_blank" rel="noopener" href="${guideUrls(g).FHLMC}"><svg class="icon"><use href="#i-ext"/></svg>Freddie Mac Guide ${(g.cite.FHLMC||'').replace('Guide ','')}</a>
              <a class="btn-link" target="_blank" rel="noopener" href="${guideUrls(g).FHA}"><svg class="icon"><use href="#i-ext"/></svg>HUD Handbook 4000.1</a>
            </div>
          </div>
        </div>`).join('')}`).join('')}`;
}
function toggleAllGuides(){ guideOpen=!guideOpen; renderGuides(); }
function openGuide(key){
  switchTab('summary');
  setTimeout(()=>{
    const c=document.querySelector(`.gl-card[data-gkey="${key}"]`);
    if(!c){ toast('No guideline topic matched — add the income first'); return; }
    document.querySelectorAll('.gl-card').forEach(x=>x.classList.remove('flash'));
    c.classList.add('open','flash');
    c.scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(()=>c.classList.remove('flash'),2600);
  },120);
}
function guideBtn(key,label){
  return `<button class="btn-link no-print" onclick="openGuide('${key}')" title="Jump to the agency guideline for this income type">
    <svg class="icon"><use href="#i-book"/></svg>${label||'Guidelines'}</button>`;
}

/* ================== SUMMARY ================== */
function summaryRows(){
  const rows=[];
  if (combineActive()){
    const r = calcCombined();
    const MN={current:'Current Base',ytd:'YTD Avg',ytd12:'YTD + Prev Yr',ytd24:'YTD + Last 2 Yrs',custom:'Custom Override'};
    const CN={base:'Base',ot:'OT',comm:'Comm',bonus:'Bonus',other:'Other',unre:'Unreimb'};
    rows.push(['W-2 Employment (combined)',
      S.w2.map((j,i)=>j.employer||`Job #${i+1}`).join(' + '),
      'All jobs aggregated — ' + Object.keys(S.combine.m).filter(k=>S.combine.m[k]!=='none')
        .map(k=>`${CN[k]}: ${MN[S.combine.m[k]]}`).join(' | '),
      r.total]);
  } else
  S.w2.filter(ON).forEach(j=>{ const r=calcW2(j);
    const MN={current:'Current Base',ytd:'YTD Avg',ytd12:'YTD + Prev Yr',ytd24:'YTD + Last 2 Yrs',custom:'Custom Override'};
    const CN={base:'Base',ot:'OT',comm:'Comm',bonus:'Bonus',other:'Other',unre:'Unreimb'};
    const meth = Object.keys(j.m).filter(k=>j.m[k]!=='none')
      .map(k=>`${CN[k]}: ${MN[j.m[k]]||j.m[k]}`).join(' | ');
    rows.push(['W-2 Employment', `${j.employer||'Employment'} (${bName(j.b)})`, meth||'—', r.total]); });
  const SEM = {avg2:'24-month average', recent:'most recent year only',
               lower:'lower of the two years', custom:'custom override'};
  const seName = m => SEM[m] || m;
  S.schc.filter(ON).forEach(b=>{ const r=calcSchC(b);
    rows.push(['Schedule C Sole Prop', `${b.name||'Business'} (${bName(b.b)})`, `Form 1084 add-backs — ${seName(r.methodUsed)}`, r.monthly]); });
  S.corp.filter(ON).forEach(e=>{ const r=calcCorp(e);
    rows.push([`Corporate (${e.form})`, `${e.name||'Entity'} (${N(e.own)}% · ${bName(e.b)})`, `Pass-through${e.form==='1065'?' + guaranteed pay':''} — ${seName(r.methodUsed)}`, r.monthly]); });
  S.sche.filter(ON).forEach(p=>{ const r=calcSchE(p);
    rows.push(['Schedule E Rental', `${p.addr||'Property'} (${bName(p.b)})`, p.method==='sche'?'Sch E cash flow':'75% lease rule', r.monthly]); });
  S.other.filter(ON).forEach(o=>{ const r=calcOther(o); const t=OTHER_TYPES.find(x=>x.v===o.type);
    rows.push(['Other Income', `${o.desc || (t?t.t:'')} (${bName(o.b)})`, o.nonTax?`Non-taxable + ${N(o.grossUp)}% gross-up`:'Taxable', r.total]); });
  const a=calcAssets();
  if (S.assets.use) rows.push(['Asset Depletion','Liquid Financial Assets',`${a.div}-month amortization`, a.monthly]);
  return rows;
}
function findings(){
  const t=calcTotals(), out=[], mx=DTI_MAX[S.agency];
  out.push({k: t.back<=mx.b?'good':'bad', t:'Debt Ratios',
    m:`Back-end DTI of <b>${(t.back*100).toFixed(2)}%</b> ${t.back<=mx.b?'is within':'EXCEEDS'} the ${S.agency} benchmark of ${(mx.b*100).toFixed(0)}%.`});
  S.w2.forEach(j=>{ const r=calcW2(j);
    if (r.hasVariable) out.push({k:'info',t:`Variable Compensation (${j.employer})`,
      m:'File contains overtime, bonus or commission income. Ensure a 2-year history of continuous receipt is documented on the VOE.'});
    if (r.varPct < -0.05) out.push({k:'warn',t:`YTD Shortfall (${j.employer})`,
      m:`YTD earnings are ${(r.varPct*100).toFixed(1)}% below the calculated base rate. Use the YTD figure or obtain a written explanation.`});
    if (r.monthsJob < 24 && r.hasVariable) out.push({k:'warn',t:`Employment Tenure (${j.employer})`,
      m:`Only ${r.monthsJob.toFixed(0)} months on this job — variable income generally requires a 24-month history.`});
    if (r.chg1<0 && r.chg2<0) out.push({k:'warn',t:`Declining Wage Trend (${j.employer})`,
      m:'Earnings have declined in both comparison periods. Document stability or use the most conservative figure.'});
  });
  S.schc.forEach(b=>{ if(calcSchC(b).declining) out.push({k:'warn',t:`Declining Self-Employment (${b.name})`,
    m:'Schedule C income decreased year over year. Most recent year used; written analysis of stability required.'}); });
  S.corp.forEach(e=>{ const r=calcCorp(e);
    if(!r.gov && !e.liquidity && N(e.y1.dist)>0 && N(e.y1.dist)<N(e.y1.ordinary))
      out.push({k:'warn',t:`K-1 Distribution Cap (${e.name})`,
        m:'Ordinary business income exceeds distributions and business liquidity has not been documented — income capped at distributions.'});
    if(r.quick && r.quick<1) out.push({k:'warn',t:`Business Liquidity (${e.name})`,
      m:`Current/quick ratio of ${r.quick.toFixed(2)} is below 1.00 — the business may not support withdrawal of earnings.`});
  });
  S.sche.forEach(p=>{ const r=calcSchE(p); if(r.monthly<0) out.push({k:'warn',t:`Negative Rental Cash Flow (${p.addr})`,
    m:`Loss of ${money(Math.abs(r.monthly))}/mo added to monthly liabilities.`}); });
  S.other.forEach(o=>{ if(N(o.amt)>0 && N(o.continuance)<36) out.push({k:'bad',t:`Continuance Shortfall (${o.desc||o.type})`,
    m:'Documented continuance is less than 36 months — this income generally may not be used for qualifying.'}); });
  if (S.assets.use && S.agency==='FHA') out.push({k:'bad',t:'Asset Depletion on FHA',
    m:'FHA does not permit asset depletion as effective income. Remove this income source or change the agency.'});
  if (!t.income) out.push({k:'warn',t:'No Qualifying Income',m:'No income has been entered on any worksheet yet.'});
  return out;
}
/* multi-year comparison across every income source in use */
function comparisonRows(){
  const out = [];
  S.w2.filter(ON).forEach((j,i)=>{ const r=calcW2(j);
    const cur = r.mo ? r.t1/r.mo*12 : 0, prior = r.t2, avg2 = (r.t2+r.t3)/2;
    if (cur||prior) out.push({name:(j.employer||`Employment #${i+1}`)+' (W-2)', cur, prior, avg2,
                              pct: prior ? cur/prior-1 : 0}); });
  S.schc.filter(ON).forEach((b,i)=>{ const r=calcSchC(b);
    if (r.a1||r.a2) out.push({name:(b.name||`Schedule C #${i+1}`), cur:r.a1, prior:r.a2, avg2:(r.a1+r.a2)/2,
                              pct: r.a2 ? r.a1/r.a2-1 : 0}); });
  S.corp.filter(ON).forEach((e,i)=>{ const r=calcCorp(e);
    if (r.a1||r.a2) out.push({name:(e.name||`Entity #${i+1}`)+` (${e.form})`, cur:r.a1, prior:r.a2, avg2:(r.a1+r.a2)/2,
                              pct: r.a2 ? r.a1/r.a2-1 : 0}); });
  return out;
}
/* documentation checklist assembled from the income actually entered */
function checklistItems(){
  const items = [];
  activeDocKeys().forEach(k=>{
    const D = DOCREQ[k]; if(!D) return;
    const grp = [];
    D.common.forEach((x,i)=> grp.push({id:`${k}|c${i}`, t:x}) );
    (D[S.agency]||[]).forEach((x,i)=> grp.push({id:`${k}|a${i}`, t:x, ag:true}) );
    items.push({key:k, title:D.title, list:grp});
  });
  return items;
}
function checklistHTML(){
  const groups = checklistItems();
  if (!groups.length) return '<div class="muted">Add income and the checklist builds itself.</div>';
  const total = groups.reduce((n,g)=>n+g.list.length,0);
  const done  = groups.reduce((n,g)=>n+g.list.filter(i=>S.checklist[i.id]).length,0);
  return `<div class="small" style="margin-bottom:6px"><b>${done} of ${total}</b> items collected</div>` +
    groups.map(g=>`<div class="ck-grp">${g.title}</div>
      ${g.list.map(i=>`<label class="ck ${S.checklist[i.id]?'done':''}">
        <input type="checkbox" ${S.checklist[i.id]?'checked':''} onchange="tickDoc('${i.id}',this.checked)">
        <span>${i.t}${i.ag?` <span class="muted small">(${AG_NAME[S.agency]})</span>`:''}</span></label>`).join('')}`).join('');
}
function tickDoc(id, v){ S.checklist[id] = v; setH('uwCheck', checklistHTML()); scheduleAutosave(); }

function renderSummary(){
  const t=calcTotals(), rows=summaryRows(), f=findings(), mx=DTI_MAX[S.agency];
  $('summaryBody').innerHTML = `
  <div class="summary-doc">
    <div class="doc-head">
      <div><h2>Comprehensive Income Underwriting Summary</h2>
        <p>Official Underwriting File Recap &amp; Agency Calculation Breakdown — Borrower: <b>${esc(S.borrower)||'—'}</b></p></div>
      <div class="doc-id">Form Identifier: 1084-COMBINED<br>File #: ${esc(S.file)}<br>Agency: ${S.agency}</div>
    </div>
    <table class="summary">
      <thead><tr><th>Category</th><th>Source / Entity Name</th><th>Calculation Basis / Method</th><th class="num">Monthly Qualifying Income</th></tr></thead>
      <tbody>
        ${rows.map(r=>`<tr><td>${r[0]}</td><td>${esc(r[1])}</td><td class="muted">${esc(r[2])}</td><td class="num">${money(r[3])}</td></tr>`).join('')
          || '<tr><td colspan="4" class="muted">No income sources entered.</td></tr>'}
        <tr class="grand"><td colspan="3">TOTAL QUALIFYING MONTHLY INCOME:</td><td class="num">${money(t.income)}</td></tr>
      </tbody>
    </table>

    <h3 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--navy-800);margin:24px 0 10px">
      Ratio Analysis</h3>
    <table class="summary">
      <tbody>
        <tr><td>Total Subject PITIA</td><td class="num">${money(t.pitia)}</td>
            <td>Front-End (Housing) Ratio</td><td class="num">${(t.front*100).toFixed(2)}%</td></tr>
        <tr><td>Total Monthly Liabilities</td><td class="num">${money(t.debts)}</td>
            <td>Back-End (Total) Ratio</td><td class="num">${(t.back*100).toFixed(2)}%</td></tr>
        <tr><td>Agency Benchmark</td><td colspan="3" class="muted">${mx.label}</td></tr>
      </tbody>
    </table>

    <div class="findings">
      <h3><svg class="icon"><use href="#i-shield"/></svg>Automated Underwriting Risk &amp; Compliance Findings</h3>
      ${f.map(x=>`<div class="notice ${x.k==='good'?'good':x.k==='bad'?'bad':x.k==='warn'?'warn':'info'}">
        <svg class="icon"><use href="#i-alert"/></svg><span><b>${x.t}:</b> ${x.m}</span></div>`).join('')}
    </div>

    <h3 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--navy-800);margin:24px 0 10px">
      Agency Comparison &mdash; how this borrower is treated under each rule set</h3>
    ${agencyCompareHTML()}

    <h3 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--navy-800);margin:24px 0 10px">
      Income by Borrower</h3>
    <table class="summary">
      <thead><tr><th>Borrower</th><th class="num">Monthly Qualifying Income</th><th class="num">Annualised</th><th class="num">Share</th></tr></thead>
      <tbody>
        <tr><td>${esc(S.b1)||'Borrower 1'}</td><td class="num">${money(t.b1)}</td>
            <td class="num">${money(t.b1*12)}</td><td class="num">${t.income?((t.b1/t.income)*100).toFixed(1):'0.0'}%</td></tr>
        ${(S.b2 || t.b2>0) ? `<tr><td>${esc(S.b2)||'Borrower 2'}</td><td class="num">${money(t.b2)}</td>
            <td class="num">${money(t.b2*12)}</td><td class="num">${t.income?((t.b2/t.income)*100).toFixed(1):'0.0'}%</td></tr>`:''}
        <tr class="grand"><td>COMBINED</td><td class="num">${money(t.income)}</td>
            <td class="num">${money(t.income*12)}</td><td class="num">100%</td></tr>
      </tbody></table>

    <h3 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--navy-800);margin:24px 0 10px">
      Income Comparison &mdash; Current / YTD vs Prior Year vs Two-Year Average</h3>
    <div class="tbl-scroll"><table class="cmp">
      <thead><tr><th>Source</th><th class="num">Current / YTD (annualised)</th><th class="num">Prior Year</th>
        <th class="num">2-Year Average</th><th class="num">Change vs Prior</th></tr></thead>
      <tbody>${comparisonRows().map(r=>`<tr><td>${esc(r.name)}</td>
        <td class="num">${money(r.cur)}</td><td class="num">${money(r.prior)}</td>
        <td class="num">${money(r.avg2)}</td>
        <td class="num">${r.prior ? `<span class="delta ${r.pct>0.005?'up':r.pct<-0.005?'down':'flat'}">${pct(r.pct)}</span>` : '<span class="delta flat">n/a</span>'}</td></tr>`).join('')
        || '<tr><td colspan="5" class="muted">No multi-year income entered.</td></tr>'}
      </tbody></table></div>

    <div class="findings">
      <h3><svg class="icon"><use href="#i-check"/></svg>Documentation Checklist &mdash; ${S.agency}</h3>
      <div class="notice info"><svg class="icon"><use href="#i-alert"/></svg>
        <span>Built from the income entered in this file. Tick items as they are collected — the state is kept with the
        file when you save it.</span></div>
      <div id="uwCheck">${checklistHTML()}</div>
    </div>

    <div class="findings">
      <h3><svg class="icon"><use href="#i-book"/></svg>Documentation Required for the Income Used &mdash; Fannie Mae, Freddie Mac, FHA &amp; VA</h3>
      <div class="notice info"><svg class="icon"><use href="#i-alert"/></svg>
        <span>One card for every income type in this file. Each shows how the figure was derived, the documentation the
        file needs, the additional requirement for each agency, and a link to the published rule. Highlighted for
        <b>${S.agency}</b>. Confirm against the current Selling Guide, Seller/Servicer Guide, HUD 4000.1 or VA M26-7.</span></div>
      <div class="no-print" style="margin-bottom:8px">
        <button class="btn-link" onclick="document.querySelectorAll('#uwDocs .gl-card').forEach(c=>c.classList.toggle('open'))">
          <svg class="icon"><use href="#i-chev"/></svg>Expand / collapse all</button></div>
      <div id="uwDocs">${activeDocKeys().map(k=>docCard(k)).join('') ||
        '<div class="muted">No income entered yet — add income and the documentation checklist builds itself.</div>'}</div>
    </div>

    <h3 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--navy-800);margin:24px 0 10px">
      Senior Underwriter Transmittal &amp; Approval Comments</h3>
    <textarea class="cell-input" id="uwNotes" placeholder="Enter final underwriting notes, conditional approval requirements, or LOE details here..."
      oninput="S.notes=this.value">${esc(S.notes)}</textarea>
  </div>`;
}
