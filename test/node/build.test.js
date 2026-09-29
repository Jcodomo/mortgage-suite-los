'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ROOT = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const manifest = JSON.parse(read('src/manifest.json'));

/* Split a built document into its <script>/<style> elements the way an HTML parser does. */
function elements(html) {
  const out = []; const re = /<(script|style)\b([^>]*)>/gi; let m;
  while ((m = re.exec(html))) {
    const end = html.toLowerCase().indexOf('</' + m[1].toLowerCase() + '>', re.lastIndex);
    out.push({ kind: m[1].toLowerCase(), attrs: m[2], body: html.slice(re.lastIndex, end) });
    re.lastIndex = end;
  }
  return out;
}
const isJs = e => e.kind === 'script' && !/\bsrc=/.test(e.attrs) && !/type=["'](?!text\/javascript|module)/.test(e.attrs) && e.body.trim();

test('manifest and parts agree (no missing, no orphaned files)', () => {
  const listed = new Set(manifest.map(m => m.file));
  for (const f of listed) assert.ok(fs.existsSync(path.join(ROOT, 'src/parts', f)), `missing part ${f}`);
  const onDisk = fs.readdirSync(path.join(ROOT, 'src/parts'));
  assert.deepEqual(onDisk.filter(f => !listed.has(f)), [], 'orphaned parts');
});

test('every source script part parses (catches escaping mistakes that silently kill the app)', () => {
  for (const m of manifest.filter(m => m.kind === 'script' && !/\bsrc=/.test(m.open) && !/type=["'](?!text\/javascript|module)/.test(m.open))) {
    assert.doesNotThrow(() => new vm.Script(read('src/parts/' + m.file), { filename: m.file }), m.file);
  }
});

for (const f of ['mortgage-suite-los.html', 'loan-suite.html', 'income-calculator.html']) {
  test(`dist/${f}: every script parses, nothing blocks the parser from a CDN`, () => {
    const html = read('dist/' + f), els = elements(html);
    for (const e of els.filter(isJs)) assert.doesNotThrow(() => new vm.Script(e.body), `script starting ${e.body.slice(0, 60)}`);
    assert.equal(els.filter(e => e.kind === 'script' && /\bsrc=/.test(e.attrs)).length, 0, 'no <script src> tags');
    assert.match(html, /window\.LOS_LIBS/, 'lazy library loader present');
    assert.match(html, /media="print" onload=/, 'font stylesheet is non-blocking');
    assert.doesNotMatch(html, /Mortgage Suite v53\.1/, 'title updated');
  });
}

test('launchers differ from the combined file only by the workspace default', () => {
  const base = read('dist/mortgage-suite-los.html');
  for (const [f, app] of [['loan-suite.html', 'suite'], ['income-calculator.html', 'income']]) {
    const v = read('dist/' + f), i = v.indexOf('<script>if(!/[?&]app=/');
    assert.ok(i > 0, f + ' bootstrap');
    const end = v.indexOf('</script>', i) + '</script>'.length;
    assert.ok(v.slice(i, end).includes(`app=${app}`), f + ' default workspace');
    assert.ok(v.slice(0, i) + v.slice(end + 1) === base, f + ' is otherwise byte-identical to the combined file');
  }
});

test('root public app entry points match their deployed dist copies', () => {
  for (const f of ['mortgage-suite-los.html', 'loan-suite.html', 'income-calculator.html']) {
    assert.equal(read(f), read('dist/' + f), `${f} stays deployable from the repository root`);
  }
});

test('regression anchors for the v54 fixes are still in the source', () => {
  const all = manifest.map(m => read('src/parts/' + m.file)).join('\n');
  const must = {
    'engine: refresh compares the resolved screen id (freeze fix)': /screenFor\)\(this\.store\.snapshot\.mode\)\.id !== this\.renderedMode/,
    'engine: persisted mode is sanitised': /if \(!\/\^\(quote\|setup\|renovation/,
    'router: calculator tabs go to switchTab': /if\(app==='income'\)\{if\(tab&&\/\^\(w2\|selfemp/,
    'click race: user click cancels pending re-asserts': /var userEpoch=0;/,
    'calcW2: no divide by zero without a paystub date': /const ytd\s+= mo \? a\/mo : 0;/,
    'renovation intent only on a real change': /prevCost=Number/,
    'focus-out commits only edited fields': /__v54dirty/,
    'scheduler: activity-gated backoff': /QUIET=4000,SLOW=8000/,
    'scenario name convention has no "Unnamed" default': /return '\$' \+ Math\.round\(ln\)\.toLocaleString/,
  };
  for (const [name, re] of Object.entries(must)) assert.match(all, re, name);
});

test('landing page links resolve and it makes no external requests', () => {
  for (const [dir, prefix] of [['dist', ''], ['.', '']]) {
    const html = read(path.join(dir, 'index.html'));
    const links = [...html.matchAll(/<a class="card" href="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(links, [prefix + 'loan-suite.html', prefix + 'income-calculator.html']);
    for (const l of links) assert.ok(fs.existsSync(path.join(ROOT, dir, l)), `${dir}/${l} exists`);
    assert.doesNotMatch(html, /https?:\/\//, 'no external URLs');
    assert.doesNotMatch(html, /http-equiv=["']refresh/i, 'no meta-refresh redirects');
  }
});
