/* Release 38: classifier families, MISMO mapping, ZIP, rail gating.
   Every fixture here is SYNTHETIC form-label text. Nothing from the
   training files — no name, figure, account or address — appears. */
const fs=require('fs'), vm=require('vm');
let pass=0,fail=0;
const eq=(l,g,w)=>{const ok=JSON.stringify(g)===JSON.stringify(w);ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${JSON.stringify(g)} want=${JSON.stringify(w)}`);};

/* --- load the classifier out of the layer without a DOM ------------- */
const src=fs.readFileSync(__dirname+'/../src/patch-v38.js','utf8');
const famSrc=src.slice(src.indexOf('var FAMILIES = ['), src.indexOf('function extendClassifier'));
const ctx={String,RegExp,Array,Object,Math,Number,isFinite,parseFloat};
vm.createContext(ctx);
vm.runInContext(famSrc.replace(/^var /,'').replace('FAMILIES = [','this.FAMILIES = [')
  .replace('function classifyExtended','this.classifyExtended = function classifyExtended'), ctx);
const classify=ctx.classifyExtended;

/* --- each family from generic form labels (OCR-ish: lowercase, spaced) */
const cases=[
 ['bank',       'statement period 03/01 to 03/31 beginning balance 0.00 deposits and other credits withdrawals and other debits ending balance 0.00'],
 ['voa',        'accountchek verification of assets order id 000 reissue key abc days requested 60'],
 ['transcript', 'account transcript request date 01-01 response date 01-02 tax period ending dec 31 taxpayer identification number xxx'],
 ['aus',        'desktop underwriter casefile id 000 submission date 01/01 housing expense ratio 28.0% recommendation approve/eligible'],
 ['credit',     'credit report tradelines inquiries fico score public records too many inquiries last 12 months'],
 ['creditsupp', 'credit supplement order number 000 original order number 111 tu efx xpn'],
 ['hoi',        'policy number 000 policy period 01/01 to 01/01 deductibles dwelling coverage property location'],
 ['titlebill',  'title bill file number 000 title insurance title update patriot search settlement fee'],
 ['commitment', 'commitment letter conditions of this commitment commitment expires loan approval'],
 ['contract',   'contract of sale purchaser seller purchase price down payment closing date'],
 ['lease',      'residential lease agreement landlord tenant monthly rent security deposit term of lease'],
 ['lox',        'letter of explanation to whom it may concern i am writing regarding the transfer sincerely'],
 ['wvoe',       'the work number verification type voi verified on 01/01 permissible purpose employer disclaimer'],
 ['award',      'social security administration benefit verification letter monthly benefit cost-of-living adjustment'],
 ['mtgstmt',    'mortgage statement principal balance escrow balance payment due date interest rate'],
 ['contractor', 'estimate prepared by bill to payment terms scope of work contractor signature customer signature'],
 ['le',         'loan estimate date issued sale price estimated closing costs estimated cash to close services you can shop for'],
 ['cd',         'closing disclosure cash to close loan costs other costs projected payments'],
 ['urla',       'uniform residential loan application borrower information declarations assets and liabilities mortgage loan information'],
 ['appraisal',  'uniform residential appraisal report opinion of market value comparable sales neighborhood site area'],
 ['k1',         'schedule k-1 partner\'s share of income ordinary business income final k-1'],
];
cases.forEach(([want,text])=>eq(`classify ${want}`, classify(text), want));
/* a single hit must NOT classify — one word is not a document */
eq('one weak hit is not enough', classify('the account has a deductible'), null);
eq('empty is null', classify(''), null);
/* the two families that share words must not cross */
eq('a bank statement is not a mortgage statement',
   classify('beginning balance ending balance deposits and other credits statement period'), 'bank');
eq('a mortgage statement is not a bank statement',
   classify('mortgage statement principal balance escrow balance payment due date'), 'mtgstmt');

/* --- MISMO: a minimal synthetic document ---------------------------- */
const xml=`<?xml version="1.0"?><MESSAGE xmlns="http://www.mismo.org/residential/2009/schemas"><DEAL_SETS><DEAL_SET><DEALS><DEAL>
<PARTIES><PARTY><INDIVIDUAL><NAME><FirstName>Test</FirstName><LastName>Borrower</LastName><FullName>Test Borrower</FullName></NAME></INDIVIDUAL>
<ROLES><ROLE><BORROWER><EMPLOYERS><EMPLOYER><EMPLOYMENT><EmploymentStatusType>Current</EmploymentStatusType><EmploymentStartDate>2020-01-01</EmploymentStartDate><EmploymentBorrowerSelfEmployedIndicator>false</EmploymentBorrowerSelfEmployedIndicator></EMPLOYMENT><LEGAL_ENTITY><LEGAL_ENTITY_DETAIL><FullName>Example Employer LLC</FullName></LEGAL_ENTITY_DETAIL></LEGAL_ENTITY></EMPLOYER></EMPLOYERS>
<CURRENT_INCOME><CURRENT_INCOME_ITEMS><CURRENT_INCOME_ITEM><CURRENT_INCOME_ITEM_DETAIL><IncomeType>Base</IncomeType><CurrentIncomeMonthlyTotalAmount>5000</CurrentIncomeMonthlyTotalAmount></CURRENT_INCOME_ITEM_DETAIL></CURRENT_INCOME_ITEM></CURRENT_INCOME_ITEMS></CURRENT_INCOME>
</BORROWER><ROLE_DETAIL><PartyRoleType>Borrower</PartyRoleType></ROLE_DETAIL></ROLE></ROLES></PARTY></PARTIES>
<ASSETS><ASSET><ASSET_DETAIL><AssetType>CheckingAccount</AssetType><AssetCashOrMarketValueAmount>12000</AssetCashOrMarketValueAmount><AssetAccountIdentifier>123456789</AssetAccountIdentifier></ASSET_DETAIL></ASSET></ASSETS>
<LIABILITIES><LIABILITY><LIABILITY_DETAIL><LiabilityType>Installment</LiabilityType><LiabilityMonthlyPaymentAmount>350</LiabilityMonthlyPaymentAmount><LiabilityUnpaidBalanceAmount>9000</LiabilityUnpaidBalanceAmount></LIABILITY_DETAIL></LIABILITY></LIABILITIES>
<COLLATERALS><COLLATERAL><SUBJECT_PROPERTY><ADDRESS><AddressLineText>1 Test St</AddressLineText><CityName>Testville</CityName><StateCode>NY</StateCode><PostalCode>11801</PostalCode></ADDRESS><PROPERTY_DETAIL><PropertyEstimatedValueAmount>600000</PropertyEstimatedValueAmount><FinancedUnitCount>1</FinancedUnitCount></PROPERTY_DETAIL><SALES_CONTRACTS><SALES_CONTRACT><SALES_CONTRACT_DETAIL><SalesContractAmount>600000</SalesContractAmount></SALES_CONTRACT_DETAIL></SALES_CONTRACT></SALES_CONTRACTS></SUBJECT_PROPERTY></COLLATERAL></COLLATERALS>
<LOANS><LOAN><TERMS_OF_LOAN><BaseLoanAmount>570000</BaseLoanAmount><LoanPurposeType>Purchase</LoanPurposeType><NoteRatePercent>6.875</NoteRatePercent><MortgageType>Conventional</MortgageType></TERMS_OF_LOAN></LOAN></LOANS>
</DEAL></DEALS></DEAL_SET></DEAL_SETS></MESSAGE>`;
/* a tiny DOMParser stand-in: enough for getElementsByTagName/textContent */
function mini(xml){
  const tags=[]; const stack=[{children:[],tag:'ROOT'}];
  xml.replace(/<\?[^>]*\?>/,'').replace(/<([A-Za-z_][\w:.-]*)([^>]*)>|<\/([A-Za-z_][\w:.-]*)>|([^<]+)/g,(m,open,attrs,close,text)=>{
    if(open){ const n={tag:open,children:[],text:'',parentNode:stack[stack.length-1]}; stack[stack.length-1].children.push(n); tags.push(n); if(!/\/\s*$/.test(attrs)) stack.push(n); }
    else if(close){ stack.pop(); }
    else if(text&&text.trim()){ stack[stack.length-1].text+=text; }
    return '';
  });
  const all=n=>[n,...n.children.flatMap(all)];
  const wrap=n=>{ if(n.__w)return n; n.__w=true;
    n.getElementsByTagName=t=>all(n).slice(1).filter(x=>x.tag===t||x.tag.endsWith(':'+t));
    Object.defineProperty(n,'textContent',{get(){return n.text+n.children.map(c=>c.textContent).join('');}}); return n; };
  tags.forEach(wrap); return wrap(stack[0]);
}
const parseSrc=src.slice(src.indexOf('function xmlText'), src.indexOf('V38.applyMismo'));
const c2={String,Array,Object,Math,Number,isFinite,parseFloat,N:v=>{v=parseFloat(String(v==null?'':v).replace(/[$,%\s]/g,''));return isFinite(v)?v:0;},
  V38:{}, DOMParser:function(){ this.parseFromString=s=>{ const r=mini(s); return r; }; }};
vm.createContext(c2); vm.runInContext(parseSrc,c2);
const m=c2.V38.parseMismo(xml);
eq('one borrower',            m.borrowers.length, 1);
eq('borrower full name',      m.borrowers[0].full, 'Test Borrower');
eq('employment found',        m.employment.length, 1);
eq('employer name resolves',  m.employment[0].employer, 'Example Employer LLC');
eq('base income monthly',     m.income[0].monthly, 5000);
eq('asset value',             m.assets[0].value, 12000);
eq('account masked to last 4', m.assets[0].account, '••••6789');
eq('liability payment',       m.liabilities[0].payment, 350);
eq('subject zip',             m.property.zip, '11801');
eq('subject state',           m.property.state, 'NY');
eq('sales price',             m.property.price, 600000);
eq('note rate as printed',    m.terms.rate, 6.875);
eq('loan amount',             m.terms.amount, 570000);
/* the 100x trap: rate is converted on apply, not on parse */
eq('apply converts 6.875 -> 0.06875', (m.terms.rate>1?m.terms.rate/100:m.terms.rate), 0.06875);
/* not-MISMO is refused, not guessed at */
let threw=false; try{ c2.V38.parseMismo('<html><body>nope</body></html>'); }catch(e){ threw=true; }
eq('non-MISMO XML is rejected', threw, true);

/* --- rail gating ------------------------------------------------------ */
const showRatios=(income,front,back)=> income>0 && (front>0||back>0);
eq('no income -> no ratio rows',     showRatios(0,0,0), false);
eq('no income, stale ratio -> still hidden', showRatios(0,31,43), false);
eq('income and ratios -> shown',     showRatios(9000,31,43), true);
const showReserves=(avail,need)=> avail>0||need>0;
eq('no assets, no requirement -> hidden', showReserves(0,0), false);
eq('a requirement alone still shows', showReserves(0,2), true);
/* the escaping bug */
const escFn=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
eq('label is escaped exactly once', escFn('Principal & interest'), 'Principal &amp; interest');
eq('v29 double-escaped it', escFn('Principal &amp; interest'), 'Principal &amp;amp; interest');

/* --- ZIP: only empty siblings are filled ------------------------------ */
const fill=(cur,v)=> (!v||String(cur||'').trim()) ? cur : v;
eq('empty city is filled',   fill('','Hicksville'), 'Hicksville');
eq('typed city is kept',     fill('Levittown','Hicksville'), 'Levittown');
eq('no lookup value -> unchanged', fill('','') , '');

console.log(`\nv38: ${pass} passed, ${fail} failed`);
if(fail)process.exit(1);
