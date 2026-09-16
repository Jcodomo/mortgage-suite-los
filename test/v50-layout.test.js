const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'src','release-50','release-50.css'),'utf8');
const dist=fs.readFileSync(path.join(root,'dist','mortgage-suite-los.html'),'utf8');
const checks=[
  ['Loan Suite uses a wider 1520px centered canvas without changing the Income Calculator',/\.cols-main\{[\s\S]*?width:min\(1520px,calc\(100% - 40px\)\)[\s\S]*?max-width:1520px[\s\S]*?margin:0 auto/.test(css)],
  ['Live Summary remains a fixed right rail on desktop',/grid-template-columns:minmax\(0,1fr\) 300px/.test(css)],
  ['Narrow screens retain a responsive centered canvas',/@media \(max-width:640px\)[\s\S]*?\.cols-main\{ width:calc\(100% - 24px\)/.test(css)],
  ['Expanded Live Summary exposes borrower-funds rows',/Minimum investment[\s\S]*?Plus closing costs[\s\S]*?Less seller credit[\s\S]*?Less earnest money[\s\S]*?Remaining cash to close[\s\S]*?With the cushion/.test(dist)],
  ['Expanded Live Summary includes credit, ARV and state-rule status',/Representative score[\s\S]*?ARV test/.test(dist)&&/Attorney state/.test(dist)],
  ['Live Summary routes credit and rate rows to their workspaces',/credit:'CREDIT'[\s\S]*?rates:'MORTGAGE RATES'/.test(dist)],
  ['Release 50 layer is present in the shipped file',/id="los-release-50"/.test(dist)]
];
let failed=0;for(const [name,ok] of checks){console.log((ok?'PASS  ':'FAIL  ')+name);if(!ok)failed++;}
assert.equal(failed,0);console.log(`\nv50 layout: ${checks.length} passed, 0 failed`);
