const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'src', 'patch-v25-1.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'patch-v25-1.css'), 'utf8');
const source = fs.readFileSync(path.join(root, 'src', 'mortgage-suite-allinone.html'), 'utf8');
const inject = fs.readFileSync(path.join(root, 'build', 'inject.py'), 'utf8');

const checks = [
  ['Release 25.1 marker', /losRelease='25\.1'/.test(js)],
  ['AMD exports safely exposed', /window\.__amdGet/.test(source)],
  ['four-band header totals', /v251HeaderStats/.test(js) && /v251-header-stats/.test(css)],
  ['black default with paper fields', /V25\.setSurface\('oled'\)/.test(js) && /V24\.setInput\('paper'\)/.test(js)],
  ['one consolidated appearance control', /v251AppearancePanel/.test(js) && /v251-retired-appearance/.test(css)],
  ['appearance menu retains every option', /THEMES=\[/.test(js) && /SURFACES=\[/.test(js) && /INPUTS=\[/.test(js)],
  ['scenario and date widths', /min-width:420px/.test(css) && /min-width:112px/.test(css)],
  ['primary and contextual bands separated', /separateNavBands/.test(js) && /!window\.V251/.test(fs.readFileSync(path.join(root, 'src', 'patch-v24.js'), 'utf8'))],
  ['shared compact action menu', /v251-simple-menu/.test(js) && /repeat\(2,minmax\(0,1fr\)\)/.test(css)],
  ['live summary drawer has close control', /v251SummaryClose/.test(js) && /v251-summary-close/.test(css)],
  ['editable Full form uses original renderer', /a\.renderCard\(card\)/.test(js)],
  ['Full form includes suite screens', /mod\.SCREENS/.test(js) && /v251-full-screen/.test(css)],
  ['Full form mounts added live workspaces', /EXTRA_FULL/.test(js) && /panel-property/.test(js) && /panel-rates/.test(js) && /panel-docparse/.test(js)],
  ['Full form exits to focused source tab', /V\.openSource/.test(js)],
  ['new numeric fields enhanced immediately', /MutationObserver/.test(js) && /V19\.enhanceFreeform\(node\)/.test(js)],
  ['all 14 Loan Suite pages organized', /PAGE_GROUPS/.test(js) && /DOCUMENTS & OCR/.test(js) && /v251-page-directory/.test(css)],
  ['renovation page is always available', /keepRenovationAvailable/.test(js) && /renovation\.visible=null/.test(js)],
  ['ultrawide canvas supported', /min-width:2100px/.test(css) && /--v251-max:2040px/.test(css)],
  ['Release 25.1 patch is injected', /patch-v25-1\.css/.test(inject) && /patch-v25-1\.js/.test(inject)],
  ['Release 15 through 25 files retained', Array.from({length: 11}, (_, index) => `patch-v${index + 15}`).every(name => inject.includes(name))]
];

let failed = 0;
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS  ' : 'FAIL  '}${name}`);
  if (!pass) failed += 1;
}
assert.equal(failed, 0);
console.log(`\nv25.1 UI: ${checks.length} passed, 0 failed`);
