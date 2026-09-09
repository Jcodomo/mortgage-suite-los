# v8 — tab restructure, Escrow merge, free-form Property

Adds `src/patch-v8.js` + `patch-v8.css`. Small edits to `patch-v3.js` and
`patch-v4.js` (both patch layers, not engines). Neither engine touched.

## Done

- **Advanced subtabs now match the main row.** They were square-bordered
  boxes; they are now the same pill shape, weight, letter-spacing and
  active gradient as the tabs above them.
- **Mortgage Rates and Property are top-level tabs**, to the right of
  SUMMARY. `buildTabs()` creates its buttons once and thereafter only
  toggles `display`/`className` on them, so appended buttons survive —
  but it will not stand its own tab down when one of ours is showing, so
  that is handled here.
- **Taxes & Escrow folded into the Escrow tab**, mounted directly after
  the aggregate escrow analysis section so the two read as one page.
- **Advanced keeps Rule Tables and Contract & LE.**
- **A "Documents & OCR" button** after Summary, handing over to the
  calculator's existing Documents tab via `LOS.go('c:docs')` rather than
  duplicating the feature set.
- **Property fields are free-form.** The three selects and the date field
  became text inputs backed by `<datalist>`, so the usual values are one
  click away but anything can be typed.
- **Seller-paid-through is a typed date**, parsed with v7's tolerant
  parser (`9/17/26`, `sep 17 2026`, bare `9/17`). Billing cycle and
  closing date stay pickers, as asked.
- **Listing link field** on Property, with a best-effort pull.
- **HUD:** clicking Fair Market Rent with no token now opens the
  huduser.gov registration page and focuses the token field, instead of
  telling you to go and find it.
- **Duplicate import entries removed** from the overflow menu — it
  repeated both `importReno()` and the saved-file loader that is already
  the Load menu's first item.

## A duplicate-id bug found on the way

`patch-v3.js` rendered the tax panel inside the Property tab **and**
`patch-v2.js` rendered it on its own Advanced subtab — two elements with
`id="taxBody"` in one document. `TAXPRO.render()` does
`document.getElementById('taxBody')`, which only ever returns the first,
so one of the two panels was permanently dead. Consolidating into the
Escrow tab removes the collision.

## Zillow — worth being straight about

There is **no public Zillow API**; the old one was retired, and Zillow
actively blocks automated reads. The field saves the link and attempts a
best-effort read through the same relay the other lookups use, fills only
empty fields, and says plainly when it gets nothing rather than failing
silently. Expect it to be refused on Zillow specifically and to work
more often on other portals. Treat anything it does return as scraped
text to be checked, not a data feed.

## Not done in this pass

Called out rather than half-built:

- **ZIP-based estimation on the Property screen** (fill or estimate from
  the zip alone). v7 wired the suite's ZIP lookup for county/state; the
  Property tab's own value/tax/rent estimation from zip is a separate
  build and needs a decision on the data source.
- **W-2 "qualifying income used" agency explanation** (Fannie / Freddie /
  FHA, recommending the strongest). The engine already has
  `agencySnapshot()` and `autoAgency()` on the UW Summary; surfacing that
  reasoning inline on the W-2 tab is the remaining work.
- **Condensing stipulations and checklists.**
- **Documents values routing to loan-suite section dropdowns.**

## Verification

`node --check` clean on all ten patch files and the concatenated bundle;
`inject.py` still byte-identical on rebuild; existing unit suite passes.

Assumptions checked against source rather than assumed — two were wrong
and were fixed before building: `LOS.goCalc` does not exist (the
cross-shell jump is `LOS.go('c:docs')`, which also swaps the shell and
un-parks it — `switchTab` alone would have changed a tab nobody could
see), and sections carry `data-section`, not an `id`.

**Not verified in a browser.** This pass is almost entirely DOM and CSS —
tab injection, panel moving, input replacement — which is exactly what
static analysis cannot confirm. The tab row and the Escrow merge are the
first things to look at. Note also that `#screen-body` is re-rendered on
screen changes, so the tax panel is re-mounted by the poll; if it visibly
flickers, it wants the same synchronous re-append treatment v6 gave the
Comparison card.
