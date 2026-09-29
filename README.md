# Mortgage Suite

Income Calculator and Loan Suite in one self-contained web app. It runs entirely in the browser, stores work on the device, and needs no server.

```
index.html               landing page
loan-suite.html          self-contained Loan Suite launcher
income-calculator.html   self-contained Income Calculator launcher
mortgage-suite-los.html  self-contained combined app (?app=suite|income)
dist/                    matching deploy copies of every public entry point
```

Open `index.html` (or anything in `dist/`) by double-clicking it. Nothing needs to be installed to *use* it.

## URLs
`?app=suite` or `?app=income` picks the workspace, and `&tab=<id>` opens a page. Launchers default the workspace only when `?app=` is absent.
Loan Suite tabs: `quote setup renovation maxmortgage closing escrow qualify rental advanced scenarios summary`.
Calculator tabs: `w2 selfemp sche va other dti docs aus summary assets`. Unknown tabs fall back safely.

## Layout
```
src/manifest.json        ordered list of parts
src/parts/NNN-*.js|css|html   the app, split losslessly from the built file (83 parts)
src/landing.html         landing page source
build/build.py           assemble -> minify -> emit dist/ and index.html
tools/split_parts.py     re-split a built file into parts (maintenance)
test/node/               structural tests (every script parses, launchers, regression anchors)
test/browser/            Playwright tests: calculations, navigation, every dropdown and input, package click-through, perf
.github/workflows/       CI and GitHub Pages
```
The layers are additive: each `src/parts/*-script-*.js` wraps or extends what came before. Edit the part that owns the behaviour, rebuild, and run the tests.

## Commands
```
npm ci
npm run build            # dist/ and index.html (commit them; CI checks they are current)
npm test                 # node structural tests, ~1 s
npm run test:browser     # needs: pip install playwright && playwright install chromium
sh test/browser/package_check.sh   # click-through of the landing page from a clean copy of dist/
python3 test/browser/perf.py dist/mortgage-suite-los.html tag '?app=income&tab=w2'
```
`npm run build:dev` skips minification so stack traces map to readable code.

## Tests worth knowing about
- **Every script must parse.** A stray escape once stopped the whole layer bundle from loading while everything else looked healthy. `test/node` parses every source and built script.
- **Regression anchors** assert that each fix listed in `CHANGELOG-v54.md` is still present in the source.
- **Known-answer calculator tests** use inputs with hand-derived answers (a paystub date of 2028-07-01 is exactly 6.000 months; a 4,000/4,500/… income series exercises each auto-recommendation branch).
- **Sweeps** apply every option of every enabled dropdown and type freeform values (`$550,000`, `650k`, `1.2m`, `6.875%`, junk, negatives, blanks) into every input, failing on any page error or any `NaN`, `Infinity` or `undefined` in the visible text.

See `docs/QA-REPORT.md` for results and limits.
