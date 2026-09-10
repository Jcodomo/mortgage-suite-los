# Mortgage Suite — LOS layer

Open `index.html` for the GitHub Pages landing page. `loan-suite.html` starts the mortgage suite directly on Quote, and `income-calculator.html` starts the income calculator directly.

Release 35.3 keeps the complete 14-page Loan Suite and continuous editable Full form while moving every file and loan tool behind one stable Actions control. The Income Calculator and Loan Suite now share the same centered 1320px working canvas and browser-level scrolling. Documents uses the full canvas without the Live Summary rail. Quote now owns the FHA 3.5%, Conventional 5%, FHA 203(k), HomeStyle, and renovation controls; each changes the applicable program, down payment, and renovation state through the live engine without replacing the entered purchase price.

The income calculator and the renovation suite in one file, with a loan-origination
style shell over the top: named left navigation, subtabs, five synchronized themes, continuous
income sync, a scenario workbench and material-change autosave.

**The two calculation engines are not modified.** Everything in this repository adds a
presentation and coordination layer on top of them, so the engines can be rebuilt from
their own sources at any time and the layer re-applied.

## Layout

```
src/
  mortgage-suite-allinone.html   the merged engines — treat as generated, do not hand-edit
  patch.css                      shell: fonts, money numerals, navy theme, left nav
  patch-reno.css                 renovation suite skin
  patch.js                       tabs, subtabs, sync, scenarios, MI, autosave
  patch-va.js                    VA income calculator and residual income test
  patch-v2.js                    MND rates, VA loan guard, tax proration, stips, naming, sync
  patch-docs.js                  contract / LE / CD parsers, cross-check, side-by-side
  patch-v3.js                    Loan Suite restructure, Property tab, printable LE and summary
  patch-v4.js                    one tab row on the suite, online rate and property lookups
  patch-v5.css / patch-v5.js     theme cycle, live calc, self-employment and VA fixes,
                                 ZIP lookup, community property, lock extension, rail
  patch-v6.css / patch-v6.js     Documents drag-drop and Comparison, full A-J draft LE,
                                 draft Schedule C, draft-tolerant Schedule C OCR
  patch-v7.css / patch-v7.js     live PMI, menu stacking fix, free-form lock dates,
                                 hourly defaults, 1040-style Sch C, capacity card
  patch-v8.css / patch-v8.js     tab restructure, Taxes folded into Escrow,
                                 free-form Property, HUD key flow, listing link
  patch-v9.css / patch-v9.js     four themes (navy/dark/OLED/light), proration
                                 date fix, suite-side Documents & OCR tab
  patch-v10.css / patch-v10.js   agency strip on W-2, free-form numbers with
                                 550k/1.2m shorthand, ZIP estimates, live tax
                                 sync, condensed stipulations
  patch-v11.css / patch-v11.js   suite JSON/AI import, multi-Loan-Estimate
                                 extraction into scenarios, modal layout fix,
                                 2-month escrow cushion, Property corrections
  patch-v12.css / patch-v12.js   credit report reader: per-agency exclusion
                                 rules, risk flags, APR solver, payoff ranking
  patch-v13.css / patch-v13.js   structured address, OCR review provenance,
                                 scenario preview import/export, PMI and P&L
                                 worksheets, demo payroll styles, email draft,
                                 projections and renovation fee reference
  patch-v14.css / patch-v14.js   professional P&L layouts, live PMI and scenario
                                 editing, four-theme selector, property sync/OCR,
                                 lease/addendum/contractor generators, itemized
                                 A-J fee workflow and renovation fee sync
  patch-v15...patch-v18          date normalization, printable document generators,
                                 expanded live comparison, NY LE reference fees,
                                 and coordinated theme/input-field presets
  patch-v19.css / patch-v19.js   publishable release polish, compact shared changing
                                 theme icons, and universal freeform numeric entry
  patch-v22.css / patch-v22.js   stable Scenario Control Center rendering and polished
                                 MMW, maximum-loan, total-loan and amortization cards
  patch-v23...patch-v25          consolidated workspaces, themes, worksheet and live summary
  patch-v25-1.css / .js          wide four-band header, compact shared menus, organized
                                 page directory, freeform fields and editable 14-page Full form
  patch-v26...patch-v35          stabilized header and actions, responsive nested summary,
                                 Quote-first workflow, linked subtabs and Documents workspace
build/
  inject.py                      applies the layer to src/ and writes dist/
  verify_los.py                  Playwright harness, 33 behavioural checks
test/
  run.sh                         pure-logic unit tests, no browser needed
  run-all.js                     cross-platform Node test runner used by npm/GitHub
dist/
  mortgage-suite-los.html        the file you open — self-contained, works from file://
```

## Build

```bash
python3 build/inject.py src/mortgage-suite-allinone.html dist/mortgage-suite-los.html
npm test                                      # all pure-logic tests
python3 build/verify_los.py                   # legacy browser harness
node build/verify-v35.cjs                     # 42 live UI / responsive checks
```

`test/run.sh` covers the parts of the layer that are just arithmetic and
string handling — the draft-watermark normaliser, the lock extension
pricing and the Loan Estimate A-J bucketing. It needs nothing but node.
It exists because a ten-times-too-high lock extension rate sat in the
build looking entirely reasonable until the numbers were actually run: on
a $615,580 loan a 15-day extension was pricing at $18,467 rather than
$1,847. Re-reading the code had already "confirmed" it twice.

`inject.py` is idempotent: it strips any layer already present before applying a fresh
one, so it can be re-run against its own output without doubling up. This is now
actually true and verified byte-identical across three consecutive passes — it had
been broken three separate ways (patch files resolved from the wrong directory, the
font swap re-firing because the replacement still matched the pattern it replaced,
and the strip leaving the newlines that wrapped each block).

If either engine changes, regenerate `src/mortgage-suite-allinone.html` through the
merge assembler first, then re-run `inject.py`. Never hand-edit the merged file.

## What the layer does

**Navigation** — both engines keep their own horizontal tab bars. A control cluster
(theme, scenarios, hand-off) sits in the app bar, and each tab gains an in-page sticky
strip listing the sections genuinely rendered on that screen, plus *Expand all*, so the
renovation tabs read as long scrolling pages. Subtabs are discovered from the DOM rather
than declared, so a screen that gains a section gains a subtab without any change here.

**VA income** — its own tab: base pay, special and hazard pay, BAH, BAS and clothing
allowance, plus service-connected disability compensation. Untaxed items are separated
from taxable ones, continuance is tested against the separation date (military pay is
excluded when service ends inside twelve months without a re-enlistment statement, while
disability compensation is not), and the funding fee waiver follows the compensation.
Below it is the residual income test — the regional table by household size and loan band,
less taxes, housing, debts and maintenance at $0.14 per square foot, with the 20% uplift
when the back-end ratio passes 41%. A three-way switch moves the whole thing between VA,
FHA and Conventional treatment, and it changes the gross-up actually applied (0% / 15% /
25%), not just the reading. `calcTotals` is wrapped so the result flows into the header,
the borrower split and both ratios.

**Parking the income side** — one button in the app bar hands over to the renovation suite
and fades the income tabs back, with a strip offering to restore them or hide them
entirely. Nothing stops calculating while parked.

**Themes** — light, dark, navy and navy/black. The compact icon and editable-field tone
change with every preset. Navy and navy/black ride on `data-theme="dark"` so every
existing dark rule still applies and only the token values change. A `MutationObserver`
re-asserts the skin whenever either engine writes `data-theme` on its own schedule.

**Income sync** — every settled `RECALC` is pushed into the active suite scenario through
`store.importIncomeText`, the same importer the manual button uses, so there is no second
mapping to keep in step. Debounced, and can be turned off.

**Program switch** — FHA and Conventional mortgage insurance never both apply, so leaving
a stale override behind quietly changes the payment when the program flips back. The
opposite program's override is cleared, a credit score is ensured before PMI can be
priced, and the change in MI, rate and payment is reported.

**Scenarios** — naming convention `Lastname · Program · down % · rate · MM-DD`, with
duplicates taking the next free letter. The workbench does open, duplicate, rename,
delete, versions, autosaves, and a comparison across up to four scenarios with
best-value highlighting and a payment delta row.

**Autosave** — triggers only on note rate, loan amount, purchase price, down payment,
renovation budget or loan program, and writes only when you leave the tab. Last ten
saves are kept in `localStorage`.

**Mortgage rates** — a tab carrying the MND daily survey. A page opened from `file://`
cannot read mortgagenewsdaily.com; the browser blocks the cross-origin response and there is
no server here to proxy it. So there are three ways in, tried in order: a direct fetch, a
proxy URL you configure once, or pasting the survey table, which is parsed properly. The
30-year fixed is the baseline every programme is priced from; FHA and VA are the survey's
own figures, or the baseline plus a spread you set.

**A note on the FHA spread.** The brief asked for baseline minus 2.75. The survey of
2026-08-31 has the 30-year fixed at 6.87% and FHA at 6.40% — a spread of −0.47. Minus 2.75
would price FHA at 4.12% and understate every FHA payment in the file, so the spread is a
field seeded from the measured delta, with −2.75 available as a preset.

**VA loans** are standard only, on the calculator's loan setup, which already prices the
funding fee and charges no monthly MI. They are not available in the renovation suite: the
engine validates `loanProgram` down to FHA or Conventional at two points, so a VA scenario
there would compute as FHA without saying so. The suite shows a notice and hands off.

**Taxes and escrow** — proration at closing against the billing cycle, and a twelve-month
aggregate walk from the first payment that shows the lowest projected balance, the cushion,
and how many months have to be collected at the table.

**Stipulations** sit under the Summary tab between the two halves of the file, grouped into
Income, Asset and Credit, built from the worksheets that actually carry a figure. Add and
remove by hand; copy formatted for a borrower email.

**Loan Suite** — the renovation half is renamed and now carries its own tab strip, built in
the suite's own chrome so the control language matches the calculator's. Mortgage Rates,
Taxes & Escrow, Contract & LE and the new Property tab moved here from the calculator bar.
Escrow folds under Closing and Scenarios under Summary. On the calculator side, Schedule C
and the entity returns merged into Self-Employment, and Assets sits under Other Income —
each with the same section strip every other tab uses.

**Property** is the one place the address is entered, in either form: a known address, or
TBD with a zip that everything downstream prices off. Value, taxes, units and the projected
after-repair value feed the loan setup and the suite automatically. HUD's Fair Market Rent
API is wired in and needs a free token from huduser.gov, stored in the browser. Zillow,
Rentometer, RentHub and AptFinder all refuse cross-origin reads, so the lookup button opens
them pre-filled instead of pretending to scrape them.

**Printing** — a draft Loan Estimate and a renovation summary, both from the live file.

## Version 15 completion layer

Version 15 adds freeform date correction, current-year P&L defaults and analysis,
professional P&L and payroll layouts, a live PMI/FHA MIP worksheet, an expanded one-page
lease, contractor cost allocation, a linked 203(k) maximum-mortgage preview, itemized-fee
pull-through to Closing and the draft LE, editable live scenario comparison, Property ZIP
and area tools, advanced Schedule E/escrow detail, and one consolidated Documents + OCR hub.

The final browser pass covered the active dialogs and navigation paths for Documents,
P&L, PMI/MIP, Closing, live comparison and Property. The complete regression set has
171 passing assertions and no failures. Rebuilding the single-file app is byte-for-byte
idempotent.

## Version 16 document and navigation polish

Version 16 uses the supplied fillable one-page lease as the lease generator's exact field
and section model. Lease, addendum, contractor estimate, and Profit & Loss each have their
own document-only Print and Download PDF actions. P&L analysis remains visible in the
workbench but is excluded from its statement output. The payroll generator now offers four
layouts with a smaller, still-visible training-draft line.

Editable fields use stronger contrast across light, dark, navy, and navy/black themes. New
document amounts and dates accept typed text, with dates normalized by the suite's tolerant
date parser. The Loan Suite Documents & OCR screen now includes the same worksheet launchers
as the Income Calculator. Closing has one visible action for its 20 active buyer fee lines,
the Fannie Mae departing-residence reminder appears only when vacating rental is selected,
Advanced risk rows and warnings are navigable, and Schedule E shows gross rental cash flow
immediately above net rental cash flow.

## Known integration limits

These items need a production credential or a connected service rather than more local
interface code:

- **Property search.** No public aggregate property API is free or CORS-open. Needs an
  ATTOM, Rentcast or similar key, and a decision about where the key lives.
- **Natural-language guideline search.** Without a model call this is retrieval over a
  curated corpus, not an answer engine. Worth building as ranked search across a structured
  guideline set with agency citations — but it should be honest about being search.

OCR still requires review when a source is a scan, has an unusual label, or does not expose
a usable text layer. Every imported value keeps its Auto-matched, Needs Review, or Manual
Override state, and manual edits are not silently replaced.

**Document parsing** — `patch-docs.js` reads a purchase contract, a Loan Estimate or a
Closing Disclosure, cross-checks the contract against the disclosure, and compares up to
four estimates side by side. Built against two real files, which is why it is shaped the
way it is:

- The Closing Disclosure carried a *Draft* watermark whose glyphs are interleaved into the
  text layer, so the extractor returns `$3,a914.29`, `6 .75 %`, `$4 5,056.77`,
  `M onthly Pr incipal` and section names quadrupled to `SSSSeeeeccccttttiiiioooonnnn`.
  `norm()` repairs all of that, and every label is matched with an optional gap between
  each character. Repeated *letters* are collapsed but never digits — `710,000` has three
  legitimate zeros.
- The contract was a pure scan with no text layer at all, so that parser has to run on OCR
  output. It survives `$685,.000.00` and checks the form's own arithmetic (price less
  downpayment against the stated balance) before offering to load anything.

Against those two documents it recovers 17 of 19 header fields and all 24 closing-cost
lines exactly. The two it misses are the Loan Estimate comparison column on page 3 of the
CD, which is worth another pass.

## Notes

- Fonts load from Google Fonts. For a fully offline `file://` deployment they need
  embedding, or the fallback stack in `patch.css` takes over.
- v17 fixes the repeated pay-statement layout toolbar, adds a full-width editable
  scenario control center, locks the combined lender origination/processing/
  underwriting charge at $2,250, exposes fee provenance and official/local search,
  and uses date-driven aggregate escrow for newly upgraded scenarios.
- v18 replaces online fee search with two built-in New York Loan Estimate reference
  profiles (HomeStyle and FHA 203(k)), and adds coordinated light, light-on-dark,
  blue-on-navy, and dark-on-black input-field tones to the four-theme cycle.
- v22 adds direct landing, Mortgage Suite, and Income Calculator entry pages, stabilizes
  active Scenario Control Center fields, and verifies the published calculations with the
  scenario matrix in `QA-SCENARIOS-v22.md`.
- `verify_los.py` needs `playwright` and a Chromium build:
  `pip install playwright && playwright install chromium`.
- The engines declare their globals with `const`, which never become properties of
  `window`. `patch.js` resolves them through the scope chain instead — see `G()`.
