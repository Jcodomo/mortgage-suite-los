const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),js=fs.readFileSync(path.join(root,'src','patch-v16.js'),'utf8'),css=fs.readFileSync(path.join(root,'src','patch-v16.css'),'utf8');
const checks=[
  ['template lease title',/RESIDENTIAL LEASE AGREEMENT/.test(js)],
  ['template six sections',/6\. &nbsp;SIGNATURES/.test(js)],
  ['landlord mailing field',/Landlord mailing address/.test(js)],
  ['rent payment instructions',/Rent payment instructions/.test(js)],
  ['security deposit choice',/Security deposit required/.test(js)],
  ['lease print action',/Print '\+label/.test(js)&&/Download '\+label\+' PDF/.test(js)],
  ['document pdf exporter',/html2canvas/.test(js)&&/pdf\.save/.test(js)],
  ['fourth pay style',/Payroll voucher/.test(js)],
  ['loan documents hub',/v16LoanDocs/.test(js)&&/Documents and worksheets/.test(js)],
  ['conditional Fannie reminder',/includeVacatingRental/.test(js)&&/v16-show/.test(js)],
  ['single fee pull',/Pull estimated fees into Closing/.test(js)],
  ['gross rent before net',/Gross Rental Cash Flow/.test(js)],
  ['P&L printable excludes analysis',/v16PlStatement/.test(js)&&/analysis\.classList\.add\('no-print'/.test(js)],
  ['darker field token',/--v16-input/.test(css)],
  ['compact training mark',/font:800 9px/.test(css)],
  ['lease one page styling',/v16-lease-sheet/.test(css)]
];
let fail=0;for(const [name,ok] of checks){console.log((ok?'PASS  ':'FAIL  ')+name);if(!ok)fail++;}assert.equal(fail,0);console.log(`\nv16: ${checks.length} passed, 0 failed`);
